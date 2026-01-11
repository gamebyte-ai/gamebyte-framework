import { EventEmitter } from 'eventemitter3';

/**
 * Unified renderer interface that abstracts 2D and 3D rendering.
 */
export interface Renderer extends EventEmitter {
  /**
   * The rendering mode (2D or 3D).
   */
  readonly mode: RenderingMode;

  /**
   * Initialize the renderer with a canvas element.
   */
  initialize(canvas: HTMLCanvasElement, options?: RendererOptions): Promise<void>;

  /**
   * Start the render loop.
   */
  start(): void;

  /**
   * Stop the render loop.
   */
  stop(): void;

  /**
   * Resize the renderer.
   */
  resize(width: number, height: number): void;

  /**
   * Render a single frame.
   */
  render(deltaTime?: number): void;

  /**
   * Get the current canvas element.
   */
  getCanvas(): HTMLCanvasElement | null;

  /**
   * Get renderer statistics.
   */
  getStats(): RendererStats;

  /**
   * Get the stage/scene container.
   * For 2D: Returns PIXI.Container (stage)
   * For 3D: Returns THREE.Scene
   * @template T - The expected stage type (e.g., PIXI.Container or THREE.Scene)
   */
  getStage<T = unknown>(): T;

  /**
   * Get the native renderer instance.
   * For 2D: Returns Pixi Application or Renderer
   * For 3D: Returns Three.js WebGLRenderer
   * @template T - The expected renderer type
   */
  getNativeRenderer<T = unknown>(): T;

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void;
}

/**
 * Rendering modes supported by the framework.
 */
export enum RenderingMode {
  RENDERER_2D = '2d',
  RENDERER_3D = '3d',
  HYBRID = 'hybrid'
}

/**
 * Configuration options for renderers.
 */
export interface RendererOptions {
  width?: number;
  height?: number;
  antialias?: boolean;
  transparent?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  backgroundColor?: number | string;
  resolution?: number;
  autoDensity?: boolean;
}

/**
 * Renderer performance statistics.
 */
export interface RendererStats {
  fps: number;
  deltaTime: number;
  drawCalls: number;
  triangles: number;
  memory: {
    used: number;
    total: number;
  };
}