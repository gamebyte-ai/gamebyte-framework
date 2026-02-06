/**
 * Ambient module declaration for pmndrs/postprocessing.
 * This is an optional peer dependency loaded via dynamic import().
 * Full types are available when the package is installed.
 */
declare module 'postprocessing' {
  export class EffectComposer {
    constructor(renderer: any, options?: any);
    addPass(pass: any): void;
    removeAllPasses(): void;
    render(deltaTime?: number): void;
    dispose(): void;
  }

  export class RenderPass {
    constructor(scene: any, camera: any);
  }

  export class EffectPass {
    constructor(camera: any, ...effects: any[]);
  }

  export class BloomEffect {
    constructor(options?: any);
    dispose(): void;
  }

  export class VignetteEffect {
    constructor(options?: any);
    dispose(): void;
  }

  export class FXAAEffect {
    constructor();
    dispose(): void;
  }

  export class ChromaticAberrationEffect {
    constructor(options?: any);
    dispose(): void;
  }

  export class SSAOEffect {
    constructor(camera: any, normalBuffer: any, options?: any);
    dispose(): void;
  }

  export class DepthOfFieldEffect {
    constructor(camera: any, options?: any);
    dispose(): void;
  }

  export class ToneMappingEffect {
    constructor(options?: any);
    dispose(): void;
  }
}
