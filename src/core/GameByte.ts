import { EventEmitter } from 'eventemitter3';
import { ServiceContainer } from './ServiceContainer';
import { ServiceProvider } from '../contracts/ServiceProvider';
import { Renderer, RenderingMode, RendererOptions } from '../contracts/Renderer';
import { SceneManager } from '../contracts/Scene';

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
   */
  async initialize(canvas: HTMLCanvasElement, mode: RenderingMode, options?: RendererOptions): Promise<this> {
    this.canvas = canvas;

    // Boot the framework if not already booted
    if (!this.booted) {
      await this.boot();
    }

    // Initialize the renderer
    const renderer = this.make<Renderer>('renderer');
    await renderer.initialize(canvas, options);

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
    const sceneManager = this.make<SceneManager>('scene.manager');

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

    this.container.flush();
    this.providers.clear();
    this.removeAllListeners();
    
    this.booted = false;
    this.running = false;
    this.canvas = null;
  }
}