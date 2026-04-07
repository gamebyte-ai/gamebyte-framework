import { EventEmitter } from 'eventemitter3';

export interface GameFlowConfig {
  /** Screen name → screen class/factory mapping */
  screens: Record<string, { create: () => any; transition?: string }>;
  /** Event → target screen mapping */
  flow: Record<string, string | ((data?: any) => string)>;
  /** Starting screen */
  start: string;
}

export interface GameFlowEvents {
  'navigate': (from: string, to: string) => void;
}

/**
 * GameFlow - Simple screen flow orchestrator.
 * Maps events to screen transitions. NOT a state machine.
 */
export class GameFlow extends EventEmitter<GameFlowEvents> {
  private _screens: Record<string, { create: () => any; transition?: string }>;
  private _flow: Record<string, string | ((data?: any) => string)>;
  private _currentScreen: string = '';
  private _screenInstances: Map<string, any> = new Map();
  private _container: any;
  private _startScreen: string;

  constructor(container: any, config: GameFlowConfig) {
    super();
    this._container = container;
    this._screens = config.screens;
    this._flow = config.flow;
    this._startScreen = config.start;
  }

  /** Start the flow at the configured start screen */
  start(): void {
    this.goTo(this._startScreen);
  }

  /** Trigger a flow event (e.g., 'play', 'gameOver', 'retry', 'home') */
  trigger(event: string, data?: any): void {
    const target = this._flow[event];
    if (!target) return;

    const screenName = typeof target === 'function' ? target(data) : target;
    this.goTo(screenName, data);
  }

  /** Navigate to a specific screen directly */
  goTo(screenName: string, data?: any): void {
    const def = this._screens[screenName];
    if (!def) {
      console.warn(`[GameFlow] Unknown screen: "${screenName}"`);
      return;
    }

    // Hide current screen
    if (this._currentScreen) {
      const current = this._screenInstances.get(this._currentScreen);
      if (current) {
        if (typeof current.hide === 'function') current.hide();
        if (current.getContainer) this._container.removeChild(current.getContainer());
      }
    }

    const prev = this._currentScreen;

    // Get or create target screen instance
    let instance = this._screenInstances.get(screenName);
    if (!instance) {
      instance = def.create();
      this._screenInstances.set(screenName, instance);
    }

    // Add to container and show
    if (instance.getContainer) this._container.addChild(instance.getContainer());
    if (typeof instance.show === 'function') instance.show(data);

    this._currentScreen = screenName;
    this.emit('navigate', prev, screenName);
  }

  /** Get current screen name */
  get current(): string {
    return this._currentScreen;
  }

  /** Get a screen instance by name (null if not yet created) */
  getScreen(name: string): any {
    return this._screenInstances.get(name) ?? null;
  }

  destroy(): void {
    this._screenInstances.forEach((instance) => {
      if (typeof instance.destroy === 'function') instance.destroy();
    });
    this._screenInstances.clear();
    this.removeAllListeners();
  }
}
