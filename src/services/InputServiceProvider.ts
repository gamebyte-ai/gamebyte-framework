import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { GameByteInputManager } from '../input/InputManager';
import { GameByteTouchInputHandler } from '../input/TouchInputHandler';
import { GameByteVirtualControlsManager } from '../input/VirtualControlsManager';
import { GameByteInputMappingManager } from '../input/InputMappingManager';
import { GameByteInputPerformanceManager } from '../input/InputPerformanceManager';

// Game-specific handlers
import { GameBytePlatformerInputHandler } from '../input/handlers/PlatformerInputHandler';
import { GameByteCameraInputHandler } from '../input/handlers/CameraInputHandler';
import { GameByteUINavigationHandler } from '../input/handlers/UINavigationHandler';
import { GameBytePlayerMovementHandler } from '../input/handlers/PlayerMovementHandler';

/**
 * Service provider for the input system
 * Registers all input-related services and sets up the input system integration
 */
export class InputServiceProvider extends AbstractServiceProvider {
  /**
   * Register input services in the container
   */
  public register(app: GameByte): void {
    // Register core input manager
    app.singleton('input.manager', () => {
      return new GameByteInputManager();
    });

    // Register touch input handler
    app.singleton('input.handlers.touch', () => {
      return new GameByteTouchInputHandler();
    });

    // Register virtual controls manager
    app.singleton('input.virtualControls', () => {
      return new GameByteVirtualControlsManager();
    });

    // Register input mapping manager
    app.singleton('input.mapping', () => {
      return new GameByteInputMappingManager();
    });

    // Register performance manager
    app.singleton('input.performance', () => {
      return new GameByteInputPerformanceManager();
    });

    // Register game-specific handlers
    app.singleton('input.handlers.platformer', () => {
      return new GameBytePlatformerInputHandler();
    });

    app.singleton('input.handlers.camera', () => {
      return new GameByteCameraInputHandler();
    });

    app.singleton('input.handlers.uiNavigation', () => {
      return new GameByteUINavigationHandler();
    });

    app.singleton('input.handlers.playerMovement', () => {
      return new GameBytePlayerMovementHandler();
    });

    // Register convenience aliases
    app.getContainer().alias('input', 'input.manager');
    app.getContainer().alias('virtualControls', 'input.virtualControls');
    app.getContainer().alias('inputMapping', 'input.mapping');
  }

  /**
   * Boot the input services
   */
  public async boot(app: GameByte): Promise<void> {
    const inputManager = app.make<GameByteInputManager>('input.manager');
    const touchHandler = app.make<GameByteTouchInputHandler>('input.handlers.touch');
    const virtualControls = app.make<GameByteVirtualControlsManager>('input.virtualControls');
    const inputMapping = app.make<GameByteInputMappingManager>('input.mapping');
    const performanceManager = app.make<GameByteInputPerformanceManager>('input.performance');

    // Game-specific handlers
    const platformerHandler = app.make<GameBytePlatformerInputHandler>('input.handlers.platformer');
    const cameraHandler = app.make<GameByteCameraInputHandler>('input.handlers.camera');
    const uiNavigationHandler = app.make<GameByteUINavigationHandler>('input.handlers.uiNavigation');
    const playerMovementHandler = app.make<GameBytePlayerMovementHandler>('input.handlers.playerMovement');

    // Initialize input system with canvas
    const canvas = app.getCanvas();
    if (canvas) {
      inputManager.initialize(canvas);
    }

    // Add core handlers to input manager
    inputManager.addHandler(touchHandler);
    
    // Add game-specific handlers
    inputManager.addHandler(platformerHandler);
    inputManager.addHandler(cameraHandler);
    inputManager.addHandler(uiNavigationHandler);
    inputManager.addHandler(playerMovementHandler);

    // Connect virtual controls to input manager
    this.connectVirtualControls(inputManager, virtualControls);

    // Connect input mapping to input manager
    this.connectInputMapping(inputManager, inputMapping);

    // Connect performance manager to input manager
    this.connectPerformanceManager(inputManager, performanceManager);

    // Setup default virtual controls for mobile devices
    this.setupDefaultVirtualControls(virtualControls, inputManager);

    // Setup input system integration with other framework systems
    this.setupFrameworkIntegration(app, inputManager);

    // Setup input context management
    this.setupContextManagement(app, inputManager);

    // Setup input recording and debugging (development mode)
    if (process.env.NODE_ENV === 'development') {
      this.setupInputDebugging(inputManager);
    }

    // Emit input system ready event
    app.emit('input-system-ready', {
      inputManager,
      virtualControls,
      inputMapping,
      performanceManager
    });
  }

  /**
   * Connect virtual controls to input manager
   */
  private connectVirtualControls(
    inputManager: GameByteInputManager, 
    virtualControls: GameByteVirtualControlsManager
  ): void {
    // Listen for virtual control actions
    virtualControls.on('action', (action: string, data: any) => {
      inputManager.emit('action', action, data, 'virtual-controls');
    });

    // Update virtual controls layout when screen size changes
    window.addEventListener('resize', () => {
      virtualControls.updateLayout({
        width: window.innerWidth,
        height: window.innerHeight
      });
    });

    // Initialize with current screen size
    virtualControls.updateLayout({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  /**
   * Connect input mapping to input manager
   */
  private connectInputMapping(
    inputManager: GameByteInputManager, 
    inputMapping: GameByteInputMappingManager
  ): void {
    // Listen for raw input events and apply mapping
    inputManager.on('raw-input', (event: any) => {
      const action = inputMapping.mapInput(event, inputManager.currentContext);
      if (action) {
        inputManager.emit('mapped-action', action, event);
      }
    });
  }

  /**
   * Connect performance manager to input manager
   */
  private connectPerformanceManager(
    inputManager: GameByteInputManager, 
    performanceManager: GameByteInputPerformanceManager
  ): void {
    // Apply performance optimizations to input processing
    inputManager.on('raw-input', (event: any) => {
      const optimizedEvent = performanceManager.processWithPrediction(event);
      // The optimized event would be used instead of the raw event
    });

    // Monitor performance metrics
    inputManager.on('performance-warning', (metrics: any) => {
      console.warn('Input performance warning:', metrics);
      
      // Automatically optimize for better performance
      if (metrics.frameRate < 30) {
        performanceManager.optimizeForPerformance();
      }
    });
  }

  /**
   * Setup default virtual controls for mobile devices
   */
  private setupDefaultVirtualControls(
    virtualControls: GameByteVirtualControlsManager,
    inputManager: GameByteInputManager
  ): void {
    // Only add virtual controls on touch devices
    if (inputManager.deviceCapabilities.hasTouch && !inputManager.deviceCapabilities.hasKeyboard) {
      // Add virtual joystick for movement
      virtualControls.addControl({
        id: 'movement-joystick',
        type: 'joystick',
        position: { x: 60, y: window.innerHeight - 140 }, // Bottom left
        size: { width: 120, height: 120 },
        visible: true,
        alpha: 0.7,
        deadZone: 0.15,
        returnToCenter: true,
        maxDistance: 50
      } as any);

      // Add jump button
      virtualControls.addControl({
        id: 'jump-button',
        type: 'button',
        position: { x: window.innerWidth - 120, y: window.innerHeight - 140 }, // Bottom right
        size: { width: 80, height: 80 },
        visible: true,
        alpha: 0.7,
        action: 'jump'
      } as any);

      // Add attack button
      virtualControls.addControl({
        id: 'attack-button',
        type: 'button',
        position: { x: window.innerWidth - 220, y: window.innerHeight - 100 }, // Bottom right, offset
        size: { width: 60, height: 60 },
        visible: true,
        alpha: 0.7,
        action: 'attack'
      } as any);
    }
  }

  /**
   * Setup framework integration
   */
  private setupFrameworkIntegration(app: GameByte, inputManager: GameByteInputManager): void {
    // Integrate with renderer for input visualization
    app.on('initialized', () => {
      const renderer = app.make('renderer');
      
      // Override or extend the renderer's render method to include input rendering
      const originalRender = renderer.render?.bind(renderer);
      
      if (originalRender) {
        renderer.render = (scene: any) => {
          // Render the game scene first
          originalRender(scene);
          
          // Then render input system overlays (virtual controls, debug info)
          inputManager.render(renderer);
        };
      } else {
        // Fallback if no render method exists
        renderer.renderInput = () => {
          inputManager.render(renderer);
        };
      }
    });

    // Integrate with UI system
    app.on('ui-system-ready', (uiData: any) => {
      const uiManager = uiData.uiManager;
      
      // Connect input system to UI input handling
      inputManager.on('action', (action: string, data: any) => {
        if (action.startsWith('ui-')) {
          // Forward UI actions to the UI system
          uiManager.handleInteraction({
            type: action.replace('ui-', ''),
            position: data.position || { x: 0, y: 0 },
            target: null,
            timestamp: Date.now(),
            pointerID: data.pointerId || 0
          });
        }
      });
    });

    // Integrate with scene system for context switching
    app.on('scene-changed', (sceneData: any) => {
      const sceneName = sceneData.current;
      
      // Map scene names to input contexts
      let inputContext: string = 'gameplay';
      
      switch (sceneName) {
        case 'menu':
        case 'main-menu':
          inputContext = 'menu';
          break;
        case 'pause':
          inputContext = 'pause';
          break;
        case 'inventory':
          inputContext = 'inventory';
          break;
        case 'settings':
          inputContext = 'settings';
          break;
        case 'gameplay':
        case 'game':
        default:
          inputContext = 'gameplay';
          break;
      }
      
      inputManager.setContext(inputContext as any);
    });

    // Setup update loop integration
    this.setupUpdateLoop(app, inputManager);
  }

  /**
   * Setup context management
   */
  private setupContextManagement(app: GameByte, inputManager: GameByteInputManager): void {
    // Listen for context change requests
    app.on('input-context-change', (context: any) => {
      inputManager.setContext(context);
    });

    // Automatically manage context based on app state
    app.on('paused', () => {
      inputManager.setContext('pause');
    });

    app.on('resumed', () => {
      inputManager.setContext('gameplay');
    });

    // Handle focus/blur events for mobile apps
    window.addEventListener('blur', () => {
      inputManager.setEnabled(false);
    });

    window.addEventListener('focus', () => {
      inputManager.setEnabled(true);
    });
  }

  /**
   * Setup input debugging for development
   */
  private setupInputDebugging(inputManager: GameByteInputManager): void {
    // Log input events for debugging
    inputManager.on('raw-input', (event: any) => {
      console.log('Raw Input:', event);
    });

    inputManager.on('action', (action: string, data: any, source: string) => {
      console.log(`Action: ${action} from ${source}`, data);
    });

    // Add debug overlay for input visualization
    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'input-debug-overlay';
    debugOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      border-radius: 4px;
      max-width: 300px;
      pointer-events: none;
    `;
    document.body.appendChild(debugOverlay);

    // Update debug info
    setInterval(() => {
      const metrics = inputManager.getPerformanceMetrics();
      const context = inputManager.currentContext;
      
      debugOverlay.innerHTML = `
        <strong>Input Debug</strong><br>
        Context: ${context}<br>
        FPS: ${metrics.frameRate.toFixed(1)}<br>
        Input Events/s: ${metrics.inputEventCount}<br>
        Avg Latency: ${metrics.averageLatency.toFixed(1)}ms<br>
        Memory: ${metrics.memoryUsage.toFixed(1)}MB<br>
        Battery Impact: ${metrics.batteryImpact}
      `;
    }, 1000);
  }

  /**
   * Setup the update loop integration
   */
  private setupUpdateLoop(app: GameByte, inputManager: GameByteInputManager): void {
    let lastTime = Date.now();
    
    const updateInput = () => {
      if (!app.isRunning()) return;
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update input system
      inputManager.update(deltaTime);
      
      // Continue loop
      requestAnimationFrame(updateInput);
    };

    // Start the input update loop when the app starts
    app.on('started', () => {
      lastTime = Date.now();
      updateInput();
    });
  }

  /**
   * Services this provider offers
   */
  public provides(): string[] {
    return [
      'input.manager',
      'input.handlers.touch',
      'input.virtualControls',
      'input.mapping',
      'input.performance',
      'input.handlers.platformer',
      'input.handlers.camera',
      'input.handlers.uiNavigation',
      'input.handlers.playerMovement',
      'input',
      'virtualControls',
      'inputMapping'
    ];
  }
}