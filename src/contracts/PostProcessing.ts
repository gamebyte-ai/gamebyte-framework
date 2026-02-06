/**
 * A single post-processing effect.
 */
export interface IPostProcessingEffect {
  readonly name: string;
  enabled: boolean;
  readonly priority: number;
  /** Get the native pmndrs/postprocessing Effect instance */
  getNativeEffect(): unknown;
  setParams(params: Record<string, unknown>): void;
  dispose(): void;
}

/**
 * Post-processing pipeline contract.
 */
export interface IPostProcessingPipeline {
  /** Add an effect by name with optional parameters */
  add(name: string, params?: Record<string, unknown>): IPostProcessingEffect;
  /** Remove an effect by name */
  remove(name: string): void;
  /** Get an effect by name */
  get(name: string): IPostProcessingEffect | undefined;
  /** Enable/disable the entire pipeline */
  enabled: boolean;
  /** Set renderer, scene, camera for the pipeline */
  setRenderer(renderer: unknown, scene: unknown, camera: unknown): void;
  /** Render one frame through the pipeline */
  render(): void;
  /** Get all active effects */
  getEffects(): IPostProcessingEffect[];
  /** Register a custom effect factory */
  registerEffect(name: string, factory: (params?: Record<string, unknown>) => unknown): void;
  /** Cleanup */
  dispose(): void;
}
