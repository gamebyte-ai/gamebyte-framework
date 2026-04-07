/**
 * HybridGame — One-call setup for 3D world + 2D HUD games.
 *
 * Wraps GameByte.quick() (hybrid mode), GameCameraManager, and
 * RaycastInputManager into a single ergonomic API targeted at agents
 * building 3D games with 2D UI overlays.
 *
 * @example
 * ```typescript
 * import { HybridGame } from 'gamebyte-framework/hybrid';
 *
 * const game = await HybridGame.create({
 *   container: '#game',
 *   width: 800,
 *   height: 600,
 *   cameraMode: 'isometric',
 *   enableRaycast: true,
 * });
 *
 * game.world;  // THREE.Scene  — add 3D objects here
 * game.hud;    // PIXI.Container — add 2D UI here
 * game.camera; // GameCameraManager
 * game.input;  // RaycastInputManager
 *
 * game.addDefaultLighting();
 * game.onUpdate((dt) => { ... });
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import { GameByte } from '../core/GameByte.js';
import { GameCameraManager } from '../three/cameras/GameCameraManager.js';
import { RaycastInputManager } from '../three/interaction/RaycastInputManager.js';
import { WorldObject3D } from '../three/interaction/WorldObject3D.js';
import { HybridRenderer } from '../rendering/HybridRenderer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HybridGameConfig {
  /** Container element or CSS selector */
  container: string | HTMLElement;
  /** Canvas width (default: 800) */
  width?: number;
  /** Canvas height (default: 600) */
  height?: number;
  /** Background color for the 3D scene (default: 0x1a1a2e) */
  backgroundColor?: number;
  /**
   * Camera preset applied immediately after creation.
   * 'orbital'   – perspective orbit (default)
   * 'topdown'   – orthographic top-down view
   * 'isometric' – orthographic 45° isometric
   * 'front'     – front-facing perspective
   */
  cameraMode?: 'orbital' | 'topdown' | 'isometric' | 'front';
  /** World units visible vertically for orthographic cameras (default: 10) */
  orthoSize?: number;
  /** Enable 3D raycasting input (default: true) */
  enableRaycast?: boolean;
  /** Shadow quality for Three.js (default: 'medium') */
  shadowQuality?: 'low' | 'medium' | 'high';
  /** Auto-start the render loop (default: true) */
  autoStart?: boolean;
}

export interface HybridGameEvents {
  /** Fired every frame with delta time in seconds */
  'update': (dt: number) => void;
  /** Fired once after create() resolves */
  'ready': () => void;
}

// ---------------------------------------------------------------------------
// HybridGame
// ---------------------------------------------------------------------------

export class HybridGame extends EventEmitter<HybridGameEvents> {
  /** THREE.Scene — add 3D meshes, lights, groups here */
  readonly world: any;

  /** PIXI.Container (stage) — add 2D UI elements here */
  readonly hud: any;

  /** Camera manager controlling the 3D view */
  readonly camera: GameCameraManager;

  /** Raycasting input for 3D object interaction */
  readonly input: RaycastInputManager;

  /** The underlying Three.js WebGLRenderer */
  readonly threeRenderer: any;

  /** The underlying GameByte instance */
  readonly app: GameByte;

  /** Viewport width */
  readonly width: number;

  /** Viewport height */
  readonly height: number;

  // Private backing fields
  private _hybridRenderer: HybridRenderer;

  private constructor(
    app: GameByte,
    hybridRenderer: HybridRenderer,
    camera: GameCameraManager,
    input: RaycastInputManager,
    width: number,
    height: number
  ) {
    super();
    this.app = app;
    this._hybridRenderer = hybridRenderer;
    this.camera = camera;
    this.input = input;
    this.width = width;
    this.height = height;

    // Expose the Three.js scene and Pixi stage directly
    this.world = hybridRenderer.getThreeScene();
    this.hud = hybridRenderer.getPixiStage();
    this.threeRenderer = hybridRenderer.getThreeRenderer();
  }

  // ---------------------------------------------------------------------------
  // Static factory
  // ---------------------------------------------------------------------------

  /**
   * Create a fully configured hybrid game.
   *
   * Performs:
   * 1. Resolves the container element
   * 2. Creates a GameByte instance in hybrid mode
   * 3. Extracts HybridRenderer → THREE scene + Pixi stage
   * 4. Builds GameCameraManager with the requested preset
   * 5. Wires the camera into the HybridRenderer
   * 6. Optionally creates RaycastInputManager
   * 7. Hooks the update loop
   * 8. Returns the ready HybridGame
   */
  static async create(config: HybridGameConfig): Promise<HybridGame> {
    const width = config.width ?? 800;
    const height = config.height ?? 600;
    const cameraMode = config.cameraMode ?? 'orbital';
    const enableRaycast = config.enableRaycast ?? true;
    const orthoSize = config.orthoSize ?? 10;

    // 1. Boot GameByte in hybrid mode
    const app = await GameByte.quick({
      container: config.container,
      width,
      height,
      mode: 'hybrid',
      backgroundColor: config.backgroundColor ?? 0x1a1a2e,
      antialias: true,
      autoStart: config.autoStart !== false,
      rendererOptions: {
        shadowQuality: config.shadowQuality ?? 'medium',
      } as any,
    });

    // 2. Retrieve HybridRenderer
    const renderer = app.renderer as HybridRenderer;
    if (!(renderer instanceof HybridRenderer)) {
      throw new Error('HybridGame.create: renderer is not a HybridRenderer. Was mode set to "hybrid"?');
    }

    // 3. Build GameCameraManager
    const cameraMgr = new GameCameraManager({ viewportWidth: width, viewportHeight: height, orthoSize });

    // 4. Load the requested camera controller preset
    await HybridGame._applyCamera(cameraMgr, cameraMode);

    // 5. Wire camera into HybridRenderer so Three.js renders with it
    renderer.setThreeCamera(cameraMgr.getCamera());

    // 6. Create RaycastInputManager
    const inputMgr = new RaycastInputManager();
    if (enableRaycast) {
      const canvas = renderer.getPixiCanvas() ?? renderer.getThreeCanvas();
      if (canvas) {
        inputMgr.attach(canvas);
        inputMgr.setCamera(cameraMgr.getCamera());
        const threeScene = renderer.getThreeScene();
        if (threeScene) {
          inputMgr.setScene(threeScene);
        }

        // Create a Raycaster lazily to avoid bundling issues in tests
        try {
          const { Raycaster } = await import('three');
          inputMgr.setRaycaster(new Raycaster());
        } catch {
          // three not available in test environment — input will work without raycast
        }

        inputMgr.startListening();
      }
    }

    // 7. Construct the HybridGame instance
    const game = new HybridGame(app, renderer, cameraMgr, inputMgr, width, height);

    // 8. Wire update loop: camera.update(dt) + emit 'update'
    app.onUpdate((dt: number) => {
      cameraMgr.update(dt);
      game.emit('update', dt);
    });

    game.emit('ready');
    return game;
  }

  // ---------------------------------------------------------------------------
  // Camera preset loader (dynamic import keeps three out of 2D bundles)
  // ---------------------------------------------------------------------------

  private static async _applyCamera(mgr: GameCameraManager, mode: string): Promise<void> {
    switch (mode) {
      case 'orbital': {
        const { OrbitalController } = await import('../camera/controllers/OrbitalController.js');
        mgr.setController(new OrbitalController());
        break;
      }
      case 'topdown': {
        const { TopDownController } = await import('../camera/controllers/TopDownController.js');
        mgr.setController(new TopDownController());
        break;
      }
      case 'isometric': {
        const { IsometricController } = await import('../camera/controllers/IsometricController.js');
        mgr.setController(new IsometricController());
        break;
      }
      case 'front': {
        const { FrontController } = await import('../camera/controllers/FrontController.js');
        mgr.setController(new FrontController());
        break;
      }
      default: {
        const { OrbitalController } = await import('../camera/controllers/OrbitalController.js');
        mgr.setController(new OrbitalController());
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Update API
  // ---------------------------------------------------------------------------

  /**
   * Register a per-frame update callback.
   * Shorthand for `game.on('update', fn)`.
   */
  onUpdate(fn: (dt: number) => void): void {
    this.on('update', fn);
  }

  // ---------------------------------------------------------------------------
  // World helpers
  // ---------------------------------------------------------------------------

  /** Add a Three.js object3D to the world scene */
  addToWorld(object: any): void {
    this.world?.add(object);
  }

  /** Remove a Three.js object3D from the world scene */
  removeFromWorld(object: any): void {
    this.world?.remove(object);
  }

  // ---------------------------------------------------------------------------
  // HUD helpers
  // ---------------------------------------------------------------------------

  /** Add a Pixi.js display object to the HUD overlay */
  addToHUD(element: any): void {
    this.hud?.addChild(element);
  }

  /** Remove a Pixi.js display object from the HUD overlay */
  removeFromHUD(element: any): void {
    this.hud?.removeChild(element);
  }

  // ---------------------------------------------------------------------------
  // Interaction helpers
  // ---------------------------------------------------------------------------

  /**
   * Register a WorldObject3D with the RaycastInputManager so it receives
   * pointer broadcasts.
   */
  makeInteractive(object: WorldObject3D): void {
    this.input.addHandler(object);
  }

  // ---------------------------------------------------------------------------
  // Camera helpers
  // ---------------------------------------------------------------------------

  /**
   * Smoothly follow a world-space position.
   * @param target - World position to follow
   * @param easing - Exponential easing coefficient (higher = snappier)
   */
  followTarget(target: { x: number; y: number; z: number }, easing?: number): void {
    this.camera.followPosition(target.x, target.y, target.z, easing);
  }

  /**
   * Instantly move the camera focus to the specified world position.
   */
  moveCameraTo(x: number, y: number, z: number): void {
    this.camera.setPosition(x, y, z);
  }

  // ---------------------------------------------------------------------------
  // Lighting helper
  // ---------------------------------------------------------------------------

  /**
   * Add sensible ambient + directional lights to the world scene.
   * Suitable for most game scenarios without extra configuration.
   */
  addDefaultLighting(): void {
    try {
      // Use the dynamic pattern to keep this importable in environments
      // where Three.js is available but not statically analysed
      const THREE = require('three');
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      const directional = new THREE.DirectionalLight(0xffffff, 0.8);
      directional.position.set(5, 10, 5);
      directional.castShadow = true;
      this.world?.add(ambient);
      this.world?.add(directional);
    } catch {
      // Fallback: if require isn't available, use dynamic import
      import('three').then(({ AmbientLight, DirectionalLight }) => {
        const ambient = new AmbientLight(0xffffff, 0.6);
        const directional = new DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 10, 5);
        directional.castShadow = true;
        this.world?.add(ambient);
        this.world?.add(directional);
      }).catch(() => {
        // three.js not available — skip default lighting
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Destroy the game and release all resources.
   */
  destroy(): void {
    this.input.destroy();
    this.camera.destroy();
    this.app.destroy();
    this.removeAllListeners();
  }
}
