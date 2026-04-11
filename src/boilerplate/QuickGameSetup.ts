import { EventEmitter } from 'eventemitter3';
import { GameFlow } from './GameFlow.js';
import { SettingsPanel } from './SettingsPanel.js';
import { graphics } from '../graphics/GraphicsEngine.js';

// ---- Config -----------------------------------------------------------------

export interface QuickGameSetupConfig {
  /** Game title shown on the hub screen */
  title?: string;
  /** Canvas / screen width in pixels */
  width: number;
  /** Canvas / screen height in pixels */
  height: number;

  /** Hub (main menu) screen options */
  hub?: {
    /** Optional resource bar items shown at the top of the hub (coins, gems, etc.) */
    resources?: Array<{ type: string; value: number; showAddButton?: boolean }>;
  };

  /** In-game HUD options */
  game?: {
    /**
     * When false, the pause/home button in the HUD is hidden. Default: true.
     */
    showPause?: boolean;
    /**
     * Called once when the game screen is created.
     * The agent receives the game container and places their game objects here.
     */
    onCreateGame?: (gameContainer: any) => void;
    /** Called each frame with delta-time (seconds). Agent drives their game loop here. */
    onUpdate?: (dt: number) => void;
    /** Called by the framework when the game should end. Returns result data. */
    onGameEnd?: () => { score: number; stars?: number; rewards?: any[] };
  };

  /** Result screen options */
  result?: {
    /** Custom action buttons. Each button emits its event string via the flow. */
    actions?: Array<{ text: string; event: string; style?: 'primary' | 'secondary' }>;
  };

  /** Initial settings toggle values */
  settings?: {
    sound?: boolean;
    music?: boolean;
    vibration?: boolean;
  };

  // ---- Convenience callbacks -------------------------------------------------
  /** Called when the player presses Play */
  onPlay?: () => void;
  /** Called when the player presses Retry */
  onRetry?: () => void;
  /** Called when the player presses Home */
  onHome?: () => void;
}

// ---- Events -----------------------------------------------------------------

export interface QuickGameSetupEvents {
  /** Fired whenever the visible screen changes */
  'screen-changed': (screen: string) => void;
  /** Fired when the game screen is entered */
  'game-start': () => void;
  /** Fired when endGame() is called */
  'game-end': (data: any) => void;
  /** Fired when a settings field changes */
  'setting-changed': (key: string, value: boolean | number) => void;
}

// ---- Implementation ---------------------------------------------------------

/**
 * QuickGameSetup assembles the standard mobile game flow from a single config
 * object: Hub → Game → Result → Hub. Agents write ZERO screen-management code.
 *
 * @example
 * ```typescript
 * const setup = new QuickGameSetup(stage, {
 *   title: 'My Puzzle Game',
 *   width: 540, height: 960,
 *   game: {
 *     onCreateGame: (container) => {
 *       const grid = new Grid({ rows: 8, cols: 8, cellSize: 56 });
 *       container.addChild(grid.view);
 *     },
 *     onUpdate: (dt) => gameLoop(dt),
 *   },
 *   onRetry: () => resetGameState(),
 * });
 * setup.start(); // Hub → Play → Game → Result → Hub — automatic
 * ```
 */
export class QuickGameSetup extends EventEmitter<QuickGameSetupEvents> {
  private _flow: GameFlow;
  private _settings: SettingsPanel;
  private _container: any;
  private _config: QuickGameSetupConfig;
  private _gameContainer: any = null;
  /** requestAnimationFrame handle for the onUpdate game loop. 0 = not running. */
  private _rafHandle: number = 0;
  /** Timestamp of the previous RAF tick, used to calculate dt. */
  private _lastTick: number = 0;

  constructor(container: any, config: QuickGameSetupConfig) {
    super();
    this._config = config;
    this._container = container;

    // Settings panel — displayed above all screens on demand
    this._settings = new SettingsPanel(config.settings ?? {});
    this._settings.on('changed', (key: string, val: boolean | number) =>
      this.emit('setting-changed', key, val)
    );

    // Wire the screen flow
    this._flow = new GameFlow(container, {
      start: 'hub',
      screens: {
        hub: { create: () => this._createHubScreen() },
        game: { create: () => this._createGameScreen() },
        result: { create: () => this._createResultScreen() },
      },
      flow: {
        play: 'game',
        retry: 'game',
        home: 'hub',
        next: 'game',
        'game-over': 'result',
      },
    });

    this._flow.on('navigate', (_from: string, to: string) => {
      this.emit('screen-changed', to);
      if (to === 'game') {
        this.emit('game-start');
        config.onPlay?.();
        // Start per-frame onUpdate loop when entering the game screen
        if (config.game?.onUpdate) {
          this._startUpdateLoop(config.game.onUpdate);
        }
      } else {
        // Stop the update loop when leaving the game screen
        this._stopUpdateLoop();
      }
    });
  }

  // ---- Private update loop -------------------------------------------------

  private _startUpdateLoop(onUpdate: (dt: number) => void): void {
    this._stopUpdateLoop();
    this._lastTick = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - this._lastTick) / 1000, 0.1); // cap at 100 ms
      this._lastTick = now;
      onUpdate(dt);
      this._rafHandle = requestAnimationFrame(tick);
    };

    this._rafHandle = requestAnimationFrame(tick);
  }

  private _stopUpdateLoop(): void {
    if (this._rafHandle !== 0) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = 0;
    }
  }

  // ---- Public API -----------------------------------------------------------

  /** Show the hub screen and begin the game flow */
  start(): void {
    this._flow.start();
  }

  /** Fire a named flow event (e.g. 'play', 'retry', 'home', 'game-over') */
  trigger(event: string, data?: any): void {
    this._flow.trigger(event, data);
  }

  /**
   * End the current game session.
   * Emits 'game-end' and transitions to the result screen.
   */
  endGame(data?: { score?: number; stars?: number; type?: 'victory' | 'defeat' }): void {
    this.emit('game-end', data);
    this._flow.goTo('result', data);
  }

  /** Overlay the settings panel on top of the current screen */
  showSettings(): void {
    const settingsContainer = this._settings.getContainer();
    const { width, height } = this._config;
    settingsContainer.x = width / 2;
    settingsContainer.y = height / 2;
    this._container.addChild(settingsContainer);
    this._settings.show();
  }

  /** The container where the agent should place game objects (available after game screen is created) */
  get gameContainer(): any {
    return this._gameContainer;
  }

  /** Direct access to the underlying SettingsPanel */
  get settings(): SettingsPanel {
    return this._settings;
  }

  /** Name of the currently visible screen ('hub' | 'game' | 'result') */
  get currentScreen(): string {
    return this._flow.current;
  }

  destroy(): void {
    this._stopUpdateLoop();
    this._flow.destroy();
    this._settings.destroy();
    this.removeAllListeners();
  }

  // ---- Private screen factories --------------------------------------------

  private _createHubScreen(): any {
    const f = graphics();
    const { width, height, title } = this._config;
    const container = f.createContainer();

    // Background
    const bg = f.createGraphics();
    bg.rect(0, 0, width, height).fill({ color: 0x1a1a2e });
    container.addChild(bg);

    // Resource bar — coins, gems, etc. (optional)
    const resources = this._config.hub?.resources;
    if (resources && resources.length > 0) {
      const barBg = f.createGraphics();
      barBg.rect(0, 0, width, 44).fill({ color: 0x000000, alpha: 0.5 });
      container.addChild(barBg);

      resources.forEach((res, idx) => {
        const label = f.createText(`${res.type}: ${res.value}`, {
          fontSize: 15,
          fill: 0xffd700,
          fontWeight: 'bold',
        });
        label.x = 12 + idx * 130;
        label.y = 12;
        container.addChild(label);
      });
    }

    // Title
    if (title) {
      const titleText = f.createText(title, {
        fontSize: 32,
        fill: 0xffffff,
        fontWeight: 'bold',
      });
      titleText.x = width / 2 - 80;
      titleText.y = height * 0.3;
      container.addChild(titleText);
    }

    // Play button (≥60 px touch target)
    const playBtn = f.createGraphics();
    playBtn.roundRect(width / 2 - 80, height * 0.5, 160, 60, 30).fill({ color: 0x4caf50 });
    playBtn.eventMode = 'static';
    playBtn.cursor = 'pointer';
    playBtn.on('pointerdown', () => this._flow.trigger('play'));
    container.addChild(playBtn);

    const playLabel = f.createText('PLAY', { fontSize: 22, fill: 0xffffff, fontWeight: 'bold' });
    playLabel.x = width / 2 - 28;
    playLabel.y = height * 0.5 + 16;
    container.addChild(playLabel);

    // Settings button (≥60 px touch target area)
    const settingsBtn = f.createGraphics();
    settingsBtn.roundRect(width - 64, 12, 52, 52, 10).fill({ color: 0x333355 });
    settingsBtn.eventMode = 'static';
    settingsBtn.cursor = 'pointer';
    settingsBtn.on('pointerdown', () => this.showSettings());
    container.addChild(settingsBtn);

    const settingsLabel = f.createText('S', { fontSize: 18, fill: 0xaaaaaa, fontWeight: 'bold' });
    settingsLabel.x = width - 46;
    settingsLabel.y = 26;
    container.addChild(settingsLabel);

    return {
      getContainer: () => container,
      show: () => { container.visible = true; },
      hide: () => { container.visible = false; },
      destroy: () => container.destroy({ children: true }),
    };
  }

  private _createGameScreen(): any {
    const f = graphics();
    const { width, height } = this._config;
    const container = f.createContainer();

    // HUD bar background
    const hudBg = f.createGraphics();
    hudBg.rect(0, 0, width, 56).fill({ color: 0x000000, alpha: 0.6 });
    container.addChild(hudBg);

    // Game area container — agents put their game objects here
    this._gameContainer = f.createContainer();
    this._gameContainer.y = 56;
    container.addChild(this._gameContainer);

    // Pause / home button — shown unless showPause is explicitly false (≥60 px touch target)
    if (this._config.game?.showPause !== false) {
      const pauseBtn = f.createGraphics();
      pauseBtn.roundRect(width - 58, 8, 50, 40, 8).fill({ color: 0x333333 });
      pauseBtn.eventMode = 'static';
      pauseBtn.cursor = 'pointer';
      pauseBtn.on('pointerdown', () => this._flow.trigger('home'));
      container.addChild(pauseBtn);

      const pauseLabel = f.createText('||', { fontSize: 18, fill: 0xffffff, fontWeight: 'bold' });
      pauseLabel.x = width - 46;
      pauseLabel.y = 16;
      container.addChild(pauseLabel);
    }

    // Invoke agent's game setup callback
    this._config.game?.onCreateGame?.(this._gameContainer);

    return {
      getContainer: () => container,
      show: () => { container.visible = true; },
      hide: () => { container.visible = false; },
      destroy: () => container.destroy({ children: true }),
    };
  }

  private _createResultScreen(): any {
    const f = graphics();
    const { width, height } = this._config;
    const container = f.createContainer();

    return {
      getContainer: () => container,

      show: (data?: any) => {
        container.visible = true;

        // Clear stale children from previous show calls
        if (container.children) {
          const kids = [...container.children];
          for (const kid of kids) container.removeChild(kid);
        }

        // Background
        const bg = f.createGraphics();
        bg.rect(0, 0, width, height).fill({ color: 0x0d1117 });
        container.addChild(bg);

        // Victory / Defeat headline
        const type: 'victory' | 'defeat' = data?.type ?? 'victory';
        const headlineText = type === 'victory' ? 'VICTORY!' : 'GAME OVER';
        const headlineColor = type === 'victory' ? 0xffd700 : 0xff4444;

        const headline = f.createText(headlineText, {
          fontSize: 36,
          fill: headlineColor,
          fontWeight: 'bold',
        });
        headline.x = width / 2 - 80;
        headline.y = height * 0.18;
        container.addChild(headline);

        // Score
        if (data?.score !== undefined) {
          const scoreText = f.createText(`Score: ${data.score}`, {
            fontSize: 26,
            fill: 0xffffff,
          });
          scoreText.x = width / 2 - 60;
          scoreText.y = height * 0.32;
          container.addChild(scoreText);
        }

        // Star rating (0-3)
        if (data?.stars !== undefined) {
          const filled = Math.max(0, Math.min(3, data.stars));
          const starStr = '\u2605'.repeat(filled) + '\u2606'.repeat(3 - filled);
          const starsText = f.createText(starStr, { fontSize: 38, fill: 0xffd700 });
          starsText.x = width / 2 - 58;
          starsText.y = height * 0.43;
          container.addChild(starsText);
        }

        // Default action buttons (Retry + Home) unless agent provides custom ones
        const actions: Array<{ text: string; event: string; style?: 'primary' | 'secondary' }> =
          this._config.result?.actions ?? [
            { text: 'Retry', event: 'retry', style: 'primary' },
            { text: 'Home', event: 'home', style: 'secondary' },
          ];

        const btnW = 120;
        const btnH = 52;
        const totalW = actions.length * btnW + (actions.length - 1) * 16;
        const startX = width / 2 - totalW / 2;
        const btnY = height * 0.63;

        actions.forEach((action, idx) => {
          const btnColor = action.style === 'secondary' ? 0x555555 : 0x4caf50;
          const btn = f.createGraphics();
          btn.roundRect(startX + idx * (btnW + 16), btnY, btnW, btnH, 12).fill({
            color: btnColor,
          });
          btn.eventMode = 'static';
          btn.cursor = 'pointer';
          btn.on('pointerdown', () => {
            if (action.event === 'retry') this._config.onRetry?.();
            if (action.event === 'home') this._config.onHome?.();
            this._flow.trigger(action.event);
          });
          container.addChild(btn);

          const btnLabel = f.createText(action.text, {
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: 'bold',
          });
          btnLabel.x = startX + idx * (btnW + 16) + 20;
          btnLabel.y = btnY + 14;
          container.addChild(btnLabel);
        });
      },

      hide: () => { container.visible = false; },
      destroy: () => container.destroy({ children: true }),
    };
  }
}
