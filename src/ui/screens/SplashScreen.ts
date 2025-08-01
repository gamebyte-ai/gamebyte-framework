import { BaseUIScreen } from './BaseUIScreen';
import { UIPanel } from '../components/UIPanel';
import { UIText } from '../components/UIText';
import { Color } from '../../contracts/UI';

export interface SplashScreenConfig {
  logo?: string; // URL to logo image
  brandName?: string;
  backgroundColor?: Color;
  textColor?: Color;
  duration?: number; // Auto-advance duration in ms
  fadeInDuration?: number;
  fadeOutDuration?: number;
  showProgressBar?: boolean;
  loadingText?: string;
}

/**
 * Professional splash screen with logo, branding, and loading indicator
 */
export class SplashScreen extends BaseUIScreen {
  // Configuration
  private config: SplashScreenConfig;
  
  // Components
  private background!: UIPanel;
  private logoContainer!: UIPanel;
  private brandText!: UIText;
  private loadingText!: UIText;
  private progressBar?: any; // UIProgressBar
  
  // Internal state
  private _autoAdvanceTimer: number | null = null;
  private _loadingProgress: number = 0;

  constructor(config: SplashScreenConfig = {}) {
    super('splash');
    
    this.config = {
      brandName: 'GameByte',
      backgroundColor: { r: 18, g: 18, b: 18, a: 1 }, // Dark background
      textColor: { r: 255, g: 255, b: 255, a: 1 },
      duration: 3000,
      fadeInDuration: 800,
      fadeOutDuration: 600,
      showProgressBar: true,
      loadingText: 'Loading...',
      ...config
    };
    
    this.setupSplashScreen();
  }

  /**
   * Setup splash screen components
   */
  private setupSplashScreen(): void {
    // Create background
    this.background = this.createBackground({
      backgroundColor: this.config.backgroundColor
    }) as UIPanel;

    // Create centered container for content
    const contentContainer = this.createCenteredContainer();

    // Create logo container
    this.logoContainer = new UIPanel({
      backgroundColor: { r: 0, g: 0, b: 0, a: 0 } // Transparent
    }, 'logo-container');
    
    if (this.config.logo) {
      this.logoContainer.setBackgroundImage(this.config.logo);
      this.logoContainer.setSize(200, 200);
    } else {
      // Create a simple colored square as default logo
      this.logoContainer.configure({
        backgroundColor: { r: 0, g: 122, b: 255, a: 1 },
        borderRadius: 20
      });
      this.logoContainer.setSize(120, 120);
    }
    
    contentContainer.addChild(this.logoContainer);

    // Create brand name text
    if (this.config.brandName) {
      this.brandText = new UIText({
        text: this.config.brandName,
        fontSize: 32,
        fontWeight: 'bold',
        color: this.config.textColor,
        textAlign: 'center'
      }, 'brand-text');
      
      this.brandText.setPosition(0, 40); // Below logo
      this.brandText.autoSize();
      contentContainer.addChild(this.brandText);
    }

    // Create loading text
    this.loadingText = new UIText({
      text: this.config.loadingText || 'Loading...',
      fontSize: 16,
      color: this.config.textColor,
      textAlign: 'center'
    }, 'loading-text');
    
    this.loadingText.setPosition(0, this.config.brandName ? 100 : 60);
    this.loadingText.autoSize();
    contentContainer.addChild(this.loadingText);

    // Create progress bar if enabled
    if (this.config.showProgressBar) {
      const UIProgressBar = require('../components/UIProgressBar').UIProgressBar;
      this.progressBar = new UIProgressBar({
        backgroundColor: { r: 60, g: 60, b: 60, a: 1 },
        fillColor: { r: 0, g: 122, b: 255, a: 1 },
        borderRadius: 4,
        value: 0
      }, 'splash-progress');
      
      this.progressBar.setSize(200, 4);
      this.progressBar.setPosition(0, this.loadingText.position.y + 40);
      contentContainer.addChild(this.progressBar);
    }

    // Auto-size content container
    contentContainer.autoSize();
  }

  /**
   * Animate screen in with logo animation
   */
  protected async animateIn(): Promise<void> {
    // Start with everything invisible
    this.setAlpha(0);
    this.logoContainer.setScale(0.5);
    this.logoContainer.setAlpha(0);
    
    if (this.brandText) {
      this.brandText.setAlpha(0);
    }
    
    this.loadingText.setAlpha(0);
    
    if (this.progressBar) {
      this.progressBar.setAlpha(0);
    }

    // Fade in background
    await this.animate({ alpha: 1 }, {
      duration: this.config.fadeInDuration! / 3,
      easing: 'ease-out'
    });

    // Animate logo in with scale and fade
    const logoPromises = [
      this.logoContainer.animate({ scale: { x: 1, y: 1 } }, {
        duration: this.config.fadeInDuration! * 0.6,
        easing: 'spring'
      }),
      this.logoContainer.animate({ alpha: 1 }, {
        duration: this.config.fadeInDuration! * 0.4,
        easing: 'ease-out'
      })
    ];

    await Promise.all(logoPromises);

    // Animate text elements in sequence
    if (this.brandText) {
      await this.brandText.animate({ alpha: 1 }, {
        duration: 400,
        easing: 'ease-out'
      });
    }

    await this.loadingText.animate({ alpha: 1 }, {
      duration: 300,
      easing: 'ease-out'
    });

    if (this.progressBar) {
      await this.progressBar.animate({ alpha: 1 }, {
        duration: 300,
        easing: 'ease-out'
      });
    }

    // Start auto-advance timer if specified
    if (this.config.duration && this.config.duration > 0) {
      this._autoAdvanceTimer = window.setTimeout(() => {
        this.emit('auto-advance');
      }, this.config.duration);
    }
  }

  /**
   * Animate screen out
   */
  protected async animateOut(): Promise<void> {
    // Clear auto-advance timer
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }

    // Animate logo out with scale and fade
    const logoPromises = [
      this.logoContainer.animate({ scale: { x: 1.2, y: 1.2 } }, {
        duration: this.config.fadeOutDuration! * 0.6,
        easing: 'ease-in'
      }),
      this.logoContainer.animate({ alpha: 0 }, {
        duration: this.config.fadeOutDuration! * 0.8,
        easing: 'ease-in'
      })
    ];

    // Fade out text elements
    const textPromises = [];
    
    if (this.brandText) {
      textPromises.push(this.brandText.animate({ alpha: 0 }, {
        duration: this.config.fadeOutDuration! * 0.5,
        easing: 'ease-in'
      }));
    }
    
    textPromises.push(this.loadingText.animate({ alpha: 0 }, {
      duration: this.config.fadeOutDuration! * 0.5,
      easing: 'ease-in'
    }));
    
    if (this.progressBar) {
      textPromises.push(this.progressBar.animate({ alpha: 0 }, {
        duration: this.config.fadeOutDuration! * 0.5,
        easing: 'ease-in'
      }));
    }

    // Wait for all animations
    await Promise.all([...logoPromises, ...textPromises]);

    // Fade out entire screen
    await this.animate({ alpha: 0 }, {
      duration: this.config.fadeOutDuration! * 0.3,
      easing: 'ease-in'
    });
  }

  /**
   * Set loading progress (0-1)
   */
  public setLoadingProgress(progress: number): void {
    this._loadingProgress = Math.max(0, Math.min(1, progress));
    
    if (this.progressBar) {
      this.progressBar.setValue(this._loadingProgress, true);
    }
    
    this.emit('loading-progress', this._loadingProgress);
  }

  /**
   * Set loading text
   */
  public setLoadingText(text: string): void {
    this.loadingText.setText(text);
  }

  /**
   * Show completion state
   */
  public showComplete(): void {
    this.setLoadingText('Complete!');
    this.setLoadingProgress(1);
    
    // Trigger completion animation
    if (this.brandText) {
      this.brandText.animate({ scale: { x: 1.05, y: 1.05 } }, {
        duration: 200,
        easing: 'ease-out',
        yoyo: true
      });
    }
  }

  /**
   * Manual advance (skip auto-timer)
   */
  public advance(): void {
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
    this.emit('advance');
  }

  /**
   * Get current loading progress
   */
  public getLoadingProgress(): number {
    return this._loadingProgress;
  }

  /**
   * Handle tap to skip (mobile-friendly)
   */
  protected setupTapToSkip(): void {
    this.makeInteractive();
    this.on('tap', () => {
      this.advance();
    });
  }

  /**
   * Override render to add subtle animations
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0) return;
    
    // Render all child components
    for (const child of this.children) {
      child.render(renderer);
    }
    
    // Add subtle breathing effect to logo
    const time = Date.now() * 0.001;
    const breathe = 1 + Math.sin(time * 2) * 0.02;
    
    if (this.logoContainer && this._isShowing) {
      // Apply subtle scale variation for breathing effect
      const currentScale = this.logoContainer.scale.x;
      if (Math.abs(currentScale - 1) < 0.1) { // Only if not animating
        this.logoContainer.setScale(breathe);
      }
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
    super.destroy();
  }
}