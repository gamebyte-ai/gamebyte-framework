import { EventEmitter } from 'eventemitter3';
import { ServiceContainer } from './ServiceContainer.js';
import { ServiceProvider } from '../contracts/ServiceProvider.js';
import { Renderer, RenderingMode, RendererOptions } from '../contracts/Renderer.js';
import { GraphicsEngine } from '../graphics/GraphicsEngine.js';
import type { ResponsiveConfig } from '../utils/ResponsiveHelper.js';

/**
 * Quick game configuration options
 */
export interface QuickGameConfig {
  /** Container element or selector */
  container?: string | HTMLElement;
  /** Canvas element (alternative to container) */
  canvas?: HTMLCanvasElement;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Rendering mode ('2d', '3d', or 'hybrid') */
  mode?: '2d' | '3d' | 'hybrid';
  /** Background color */
  backgroundColor?: number;
  /** Auto-start game loop */
  autoStart?: boolean;
  /** Enable anti-aliasing */
  antialias?: boolean;
  /** Resolution / pixel ratio */
  resolution?: number;
  /**
   * Resize canvas to fill container.
   * When true, automatically enables responsive mode with container-based tracking.
   * Uses config.width/height as base design dimensions for scale calculation.
   */
  resizeToContainer?: boolean;
  /**
   * Enable responsive scaling.
   * - `true`: Uses config.width/height as base dimensions with mobile-first defaults
   * - Object: Custom responsive config (baseWidth, baseHeight, minScale, maxScale)
   * When used with resizeToContainer, container is tracked automatically.
   */
  responsive?: boolean | Omit<ResponsiveConfig, 'container'>;
  /** Additional renderer options */
  rendererOptions?: RendererOptions;
}

/**
 * Main GameByte framework class.
 * Provides Laravel-inspired architecture for game development.
 */
export class GameByte extends EventEmitter {
  private static instance: GameByte;
  private container: ServiceContainer;
  private providers: Map<string, ServiceProvider> = new Map();
  private booted = false;
  private running = false;
  private canvas: HTMLCanvasElement | null = null;

  // Quick API: Update and render callbacks
  private updateCallbacks: Array<(deltaTime: number) => void> = [];
  private renderCallbacks: Array<() => void> = [];

  // ResizeObserver for container resize handling
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Framework version.
   */
  public static readonly VERSION = '1.0.0';

  constructor() {
    super();
    this.container = new ServiceContainer();
    this.registerCoreServices();
  }

  /**
   * Get the singleton instance of the framework.
   */
  static getInstance(): GameByte {
    if (!GameByte.instance) {
      GameByte.instance = new GameByte();
    }
    return GameByte.instance;
  }

  /**
   * Create a new GameByte application instance.
   */
  static create(): GameByte {
    return new GameByte();
  }

  /**
   * Quick 2D game setup - minimal boilerplate
   * @example
   * const game = await GameByte.quick2D('#game-container', 800, 600);
   * game.stage.addChild(mySprite);
   * game.onUpdate((dt) => { mySprite.x += dt; });
   */
  static async quick2D(
    container: string | HTMLElement,
    width: number = 800,
    height: number = 600,
    options: Partial<QuickGameConfig> = {}
  ): Promise<GameByte> {
    return GameByte.quick({
      container,
      width,
      height,
      mode: '2d',
      autoStart: true,
      ...options
    });
  }

  /**
   * Quick 3D game setup - minimal boilerplate
   * @example
   * const game = await GameByte.quick3D('#game-container', 800, 600);
   * game.stage.add(myCube);
   * game.onUpdate((dt) => { myCube.rotation.y += dt; });
   */
  static async quick3D(
    container: string | HTMLElement,
    width: number = 800,
    height: number = 600,
    options: Partial<QuickGameConfig> = {}
  ): Promise<GameByte> {
    return GameByte.quick({
      container,
      width,
      height,
      mode: '3d',
      autoStart: true,
      ...options
    });
  }

  /**
   * Universal quick game setup with config object
   * @example
   * const game = await GameByte.quick({
   *   container: '#game',
   *   width: 800,
   *   height: 600,
   *   mode: '2d',
   *   backgroundColor: 0x1a1a2e,
   *   autoStart: true
   * });
   */
  static async quick(config: QuickGameConfig): Promise<GameByte> {
    // Import service providers dynamically to avoid circular dependencies
    const { RenderingServiceProvider } = await import('../services/RenderingServiceProvider');
    const { SceneServiceProvider } = await import('../services/SceneServiceProvider');
    const { PluginServiceProvider } = await import('../services/PluginServiceProvider');
    const { UIServiceProvider } = await import('../services/UIServiceProvider');

    // Create game instance
    const game = new GameByte();

    // Register minimal providers for quick setup
    game.register(new RenderingServiceProvider());
    game.register(new SceneServiceProvider());
    game.register(new PluginServiceProvider());
    game.register(new UIServiceProvider());

    // Resolve container element
    let containerElement: HTMLElement | null = null;
    if (typeof config.container === 'string') {
      containerElement = document.querySelector(config.container);
    } else if (config.container instanceof HTMLElement) {
      containerElement = config.container;
    }

    // Create or use canvas
    let canvas: HTMLCanvasElement;
    if (config.canvas) {
      canvas = config.canvas;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = config.width || 800;
      canvas.height = config.height || 600;

      if (containerElement) {
        containerElement.appendChild(canvas);
      } else {
        document.body.appendChild(canvas);
      }
    }

    // Determine rendering mode (default to 2D)
    let mode: RenderingMode;
    switch (config.mode) {
      case '3d':
        mode = RenderingMode.RENDERER_3D;
        break;
      case 'hybrid':
        mode = RenderingMode.HYBRID;
        break;
      case '2d':
      default:
        mode = RenderingMode.RENDERER_2D;
    }

    // Build renderer options
    const rendererOptions: Record<string, unknown> = {
      width: config.width || canvas.width,
      height: config.height || canvas.height,
      backgroundColor: config.backgroundColor,
      antialias: config.antialias ?? true,
      resolution: config.resolution ?? window.devicePixelRatio,
      ...config.rendererOptions
    };

    // Responsive resize integration
    // When resizeToContainer is true, automatically enable responsive mode with container tracking.
    // This replaces the old manual ResizeObserver that only updated canvas dimensions.
    const baseWidth = (config.width || canvas.width) as number;
    const baseHeight = (config.height || canvas.height) as number;

    if (config.resizeToContainer && containerElement) {
      // Container-based responsive: tracks container size via ResizeObserver + scale calculation
      const userResponsive = typeof config.responsive === 'object' ? config.responsive : null;
      rendererOptions.responsive = {
        baseWidth: userResponsive?.baseWidth ?? baseWidth,
        baseHeight: userResponsive?.baseHeight ?? baseHeight,
        minScale: userResponsive?.minScale,
        maxScale: userResponsive?.maxScale,
        container: containerElement
      };
    } else if (config.responsive) {
      // Window-based responsive: tracks window size
      const userResponsive = typeof config.responsive === 'object' ? config.responsive : null;
      rendererOptions.responsive = {
        baseWidth: userResponsive?.baseWidth ?? baseWidth,
        baseHeight: userResponsive?.baseHeight ?? baseHeight,
        minScale: userResponsive?.minScale,
        maxScale: userResponsive?.maxScale
      };
    }

    // Initialize game (this sets up update/render event hooks automatically)
    // rendererOptions may contain renderer-specific fields (e.g., responsive) beyond RendererOptions
    await game.initialize(canvas, mode, rendererOptions as RendererOptions);

    // Auto-start if requested
    if (config.autoStart !== false) {
      game.start();
    }

    return game;
  }

  /**
   * Get the service container.
   */
  getContainer(): ServiceContainer {
    return this.container;
  }

  /**
   * Register a service provider.
   */
  register(provider: ServiceProvider | (new () => ServiceProvider), name?: string): this {
    const providerInstance = typeof provider === 'function' ? new provider() : provider;
    const providerName = name || providerInstance.constructor.name;

    this.providers.set(providerName, providerInstance);
    
    // Register the provider's services
    providerInstance.register(this);

    this.emit('provider:registered', providerName, providerInstance);
    return this;
  }

  /**
   * Boot all registered service providers.
   */
  async boot(): Promise<this> {
    if (this.booted) {
      return this;
    }

    // Boot all providers
    const bootPromises: Promise<void>[] = [];
    
    for (const [name, provider] of this.providers) {
      if (provider.boot) {
        const result = provider.boot(this);
        if (result instanceof Promise) {
          bootPromises.push(result);
        }
      }
      this.emit('provider:booted', name, provider);
    }

    await Promise.all(bootPromises);
    
    this.booted = true;
    this.emit('booted');
    return this;
  }

  /**
   * Initialize the framework with a canvas element.
   *
   * @example Basic 2D game
   * ```typescript
   * const game = createGame();
   * await game.initialize(canvas, '2d');
   * game.start();
   * ```
   *
   * @example 3D game with options
   * ```typescript
   * await game.initialize(canvas, '3d', {
   *   antialias: true,
   *   shadowMap: { enabled: true }
   * });
   * ```
   *
   * @param canvas - HTML canvas element
   * @param mode - Rendering mode ('2d' or '3d')
   * @param options - Optional renderer configuration
   * @returns Promise resolving to game instance
   */
  async initialize(canvas: HTMLCanvasElement, mode: RenderingMode, options?: RendererOptions): Promise<this> {
    this.canvas = canvas;

    // Boot the framework if not already booted
    if (!this.booted) {
      await this.boot();
    }

    // Initialize GraphicsEngine with rendering mode
    if (!GraphicsEngine.isInitialized()) {
      GraphicsEngine.initialize(mode);
      console.log(`✅ GraphicsEngine initialized with ${mode === RenderingMode.RENDERER_2D ? '2D (Pixi.js)' : '3D (Three.js)'} renderer`);
    }

    // Initialize the renderer
    const renderer = this.make<Renderer>('renderer');
    await renderer.initialize(canvas, options);

    // Store renderer reference in GraphicsEngine for effects that need it
    GraphicsEngine.setRenderer(renderer);

    // Setup update/render event hooks on the renderer's tick
    renderer.on('tick', (deltaTime: number) => {
      // Emit update event for game.on('update', ...) listeners
      this.emit('update', deltaTime);

      // Call all registered update callbacks (game.onUpdate())
      for (const callback of this.updateCallbacks) {
        callback(deltaTime);
      }

      // Emit render event for game.on('render', ...) listeners
      this.emit('render');

      // Call all registered render callbacks (game.onRender())
      for (const callback of this.renderCallbacks) {
        callback();
      }
    });

    this.emit('initialized', { canvas, mode, options });
    return this;
  }

  /**
   * Start the game loop.
   */
  start(): this {
    if (this.running) {
      return this;
    }

    const renderer = this.make<Renderer>('renderer');
    renderer.start();
    this.running = true;

    this.emit('started');
    return this;
  }

  /**
   * Stop the game loop.
   */
  stop(): this {
    if (!this.running) {
      return this;
    }

    const renderer = this.make<Renderer>('renderer');
    renderer.stop();
    this.running = false;

    this.emit('stopped');
    return this;
  }

  /**
   * Resolve a service from the container.
   */
  make<T = any>(key: string): T {
    return this.container.make<T>(key);
  }

  /**
   * Bind a service to the container.
   */
  bind<T = any>(key: string, concrete: T | (() => T), singleton = false): this {
    this.container.bind(key, concrete, singleton);
    return this;
  }

  /**
   * Bind a singleton service to the container.
   */
  singleton<T = any>(key: string, concrete: T | (() => T)): this {
    this.container.singleton(key, concrete);
    return this;
  }

  /**
   * Check if the framework is booted.
   */
  isBooted(): boolean {
    return this.booted;
  }

  /**
   * Check if the framework is running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the current canvas element.
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Get direct access to the stage/scene container.
   * For 2D (Pixi.js): Returns PIXI.Container (stage)
   * For 3D (Three.js): Returns THREE.Scene
   * @example
   * const game = await GameByte.quick2D('#container', 800, 600);
   * game.stage.addChild(mySprite); // Pixi.js
   */
  get stage(): any {
    if (!this.container.bound('renderer')) {
      throw new Error('Renderer not initialized. Call initialize() or use quick2D()/quick3D() first.');
    }
    const renderer = this.make<Renderer>('renderer');
    return renderer.getStage();
  }

  /**
   * Get the native renderer instance.
   * For 2D: Returns Pixi.js Application/Renderer
   * For 3D: Returns Three.js WebGLRenderer
   */
  get renderer(): Renderer {
    if (!this.container.bound('renderer')) {
      throw new Error('Renderer not initialized. Call initialize() or use quick2D()/quick3D() first.');
    }
    return this.make<Renderer>('renderer');
  }

  /**
   * Register an update callback (called every frame with deltaTime)
   * @example
   * game.onUpdate((dt) => {
   *   player.x += speed * dt;
   * });
   */
  onUpdate(callback: (deltaTime: number) => void): this {
    this.updateCallbacks.push(callback);
    return this;
  }

  /**
   * Remove an update callback
   */
  offUpdate(callback: (deltaTime: number) => void): this {
    const index = this.updateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.updateCallbacks.splice(index, 1);
    }
    return this;
  }

  /**
   * Register a render callback (called every frame after update)
   * @example
   * game.onRender(() => {
   *   debugDraw();
   * });
   */
  onRender(callback: () => void): this {
    this.renderCallbacks.push(callback);
    return this;
  }

  /**
   * Remove a render callback
   */
  offRender(callback: () => void): this {
    const index = this.renderCallbacks.indexOf(callback);
    if (index !== -1) {
      this.renderCallbacks.splice(index, 1);
    }
    return this;
  }

  /**
   * Get all registered providers.
   */
  getProviders(): Map<string, ServiceProvider> {
    return new Map(this.providers);
  }

  /**
   * Register core framework services.
   */
  private registerCoreServices(): void {
    // Register the container itself
    this.container.instance('container', this.container);
    this.container.instance('app', this);
    
    // These will be registered by their respective service providers
    this.container.alias('GameByte', 'app');
  }

  /**
   * Destroy the framework and clean up resources.
   */
  destroy(): void {
    this.stop();

    // Emit destroyed event before cleanup
    this.emit('destroyed');

    if (this.container.bound('renderer')) {
      const renderer = this.make<Renderer>('renderer');
      renderer.destroy();
    }

    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear callback arrays
    this.updateCallbacks.length = 0;
    this.renderCallbacks.length = 0;

    this.container.flush();
    this.providers.clear();
    this.removeAllListeners();

    this.booted = false;
    this.running = false;
    this.canvas = null;
  }
}