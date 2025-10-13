import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { GameByteUIManager } from '../ui/core/UIManager';
import { GameByteUIAnimationSystem } from '../ui/animations/UIAnimationSystem';
import { DefaultUITheme, UIThemeManager } from '../ui/themes/DefaultUITheme';
import { BaseUIComponent } from '../ui/core/BaseUIComponent';
import { UIContainer } from '../ui/components/UIContainer';
import { UIButton } from '../ui/components/UIButton';
import { UIText } from '../ui/components/UIText';
import { UIPanel } from '../ui/components/UIPanel';
import { UIProgressBar } from '../ui/components/UIProgressBar';
import { SplashScreen } from '../ui/screens/SplashScreen';
// MainMenuScreen temporarily disabled - needs refactoring to work with UIComponent
// import { MainMenuScreen } from '../ui/screens/MainMenuScreen';

/**
 * Service provider for the UI system
 */
export class UIServiceProvider extends AbstractServiceProvider {
  /**
   * Register UI services in the container
   */
  public register(app: GameByte): void {
    // Register UI Manager
    app.singleton('ui.manager', () => {
      const canvas = app.getCanvas();
      return new GameByteUIManager(canvas || undefined);
    });

    // Register Animation System
    app.singleton('ui.animations', () => {
      return new GameByteUIAnimationSystem();
    });

    // Register Theme Manager
    app.singleton('ui.themes', () => {
      return new UIThemeManager();
    });

    // Register aliases for easier access
    app.getContainer().alias('ui', 'ui.manager');
    app.getContainer().alias('animations', 'ui.animations');
    app.getContainer().alias('themes', 'ui.themes');
  }

  /**
   * Boot the UI services
   */
  public async boot(app: GameByte): Promise<void> {
    const uiManager = app.make<GameByteUIManager>('ui.manager');
    const animationSystem = app.make<GameByteUIAnimationSystem>('ui.animations');
    const themeManager = app.make<UIThemeManager>('ui.themes');

    // Integrate animation system with UI manager
    this.integrateAnimationSystem(uiManager, animationSystem);

    // Set default theme
    uiManager.setTheme(themeManager.getCurrentTheme());

    // Register default component factories
    this.registerComponentFactories(uiManager);

    // Setup UI update loop integration
    this.setupUpdateLoop(app, uiManager, animationSystem);

    // Emit UI system ready event
    app.emit('ui-system-ready', { uiManager, animationSystem, themeManager });
  }

  /**
   * Integrate animation system with UI components
   */
  private integrateAnimationSystem(uiManager: GameByteUIManager, animationSystem: GameByteUIAnimationSystem): void {
    // Patch the BaseUIComponent animate method to use our animation system
    if (BaseUIComponent.prototype) {
      BaseUIComponent.prototype.animate = function(properties: any, config: any): Promise<void> {
        return animationSystem.to(this, properties, config);
      };

      BaseUIComponent.prototype.stopAllAnimations = function(): void {
        animationSystem.killTweensOf(this);
      };
    }
  }

  /**
   * Register component factories with the UI manager
   */
  private registerComponentFactories(uiManager: GameByteUIManager): void {
    // Register core components
    uiManager.registerComponent('container', () =>
      new UIContainer()
    );

    // TODO: UIButton needs to extend UIComponent to be registered here
    // Temporarily commented out until UIButton is refactored to match UIComponent interface
    // uiManager.registerComponent('button', () =>
    //   new UIButton()
    // );

    uiManager.registerComponent('text', () =>
      new UIText()
    );

    uiManager.registerComponent('panel', () =>
      new UIPanel()
    );

    uiManager.registerComponent('progress-bar', () =>
      new UIProgressBar()
    );

    // Register screen components
    uiManager.registerComponent('splash-screen', () =>
      new SplashScreen()
    );

    // TODO: MainMenuScreen temporarily disabled - needs refactoring
    // uiManager.registerComponent('main-menu-screen', () =>
    //   new MainMenuScreen()
    // );
  }

  /**
   * Setup the update loop integration
   */
  private setupUpdateLoop(app: GameByte, uiManager: GameByteUIManager, animationSystem: GameByteUIAnimationSystem): void {
    // Hook into the framework's update loop
    let lastTime = Date.now();
    
    const updateUI = () => {
      if (!app.isRunning()) return;
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update UI system
      uiManager.update(deltaTime);
      
      // Update animation system
      animationSystem.update(deltaTime);
      
      // Continue loop
      requestAnimationFrame(updateUI);
    };

    // Start the UI update loop when the app starts
    app.on('started', () => {
      lastTime = Date.now();
      updateUI();
    });

    // Hook into renderer for UI rendering
    app.on('initialized', () => {
      const renderer = app.make('renderer');
      
      // Override or extend the renderer's render method to include UI
      const originalRender = renderer.render?.bind(renderer);
      
      if (originalRender) {
        renderer.render = (scene: any) => {
          // Render the game scene first
          originalRender(scene);
          
          // Then render the UI on top
          uiManager.render(renderer);
        };
      } else {
        // Fallback if no render method exists
        renderer.renderUI = () => {
          uiManager.render(renderer);
        };
      }
    });
  }

  /**
   * Services this provider offers
   */
  public provides(): string[] {
    return [
      'ui.manager',
      'ui.animations', 
      'ui.themes',
      'ui',
      'animations',
      'themes'
    ];
  }
}