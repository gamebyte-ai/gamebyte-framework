import { BaseUIScreen } from './BaseUIScreen';
import { UIPanel } from '../components/UIPanel';
import { UIButton } from '../components/UIButton';
import { UIText } from '../components/UIText';
import { UIContainer } from '../components/UIContainer';
import { Color, Point } from '../../contracts/UI';

export interface MainMenuConfig {
  title?: string;
  backgroundColor?: Color;
  backgroundImage?: string;
  buttons?: Array<{
    text: string;
    id: string;
    style?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
  }>;
  showVersion?: boolean;
  version?: string;
  socialButtons?: boolean;
  settingsButton?: boolean;
  logoImage?: string;
}

/**
 * Professional main menu screen with animated buttons and mobile-optimized layout
 */
export class MainMenuScreen extends BaseUIScreen {
  // Configuration
  private config: MainMenuConfig;
  
  // Components
  private background!: UIPanel;
  private titleText!: UIText;
  private logoContainer?: UIPanel;
  private buttonContainer!: UIContainer;
  private versionText?: UIText;
  private socialContainer?: UIContainer;
  private settingsButton?: UIButton;
  
  // State
  private buttons: Map<string, UIButton> = new Map();

  constructor(config: MainMenuConfig = {}) {
    super('main-menu');
    
    this.config = {
      title: 'Game Title',
      backgroundColor: { r: 25, g: 35, b: 45, a: 1 },
      buttons: [
        { text: 'Play', id: 'play', style: 'primary' },
        { text: 'Leaderboard', id: 'leaderboard', style: 'secondary' },
        { text: 'Settings', id: 'settings', style: 'outline' }
      ],
      showVersion: true,
      version: '1.0.0',
      socialButtons: true,
      settingsButton: true,
      ...config
    };
    
    this.setupMainMenu();
  }

  /**
   * Setup main menu components
   */
  private setupMainMenu(): void {
    // Create background
    this.background = this.createBackground({
      backgroundColor: this.config.backgroundColor,
      backgroundImage: this.config.backgroundImage,
      backgroundSize: 'cover'
    }) as UIPanel;

    // Create main content container
    const mainContainer = this.createCenteredContainer();

    // Create logo if specified
    if (this.config.logoImage) {
      this.logoContainer = new UIPanel({
        backgroundImage: this.config.logoImage,
        backgroundSize: 'contain'
      }, 'logo');
      
      this.logoContainer.setSize(150, 150);
      this.logoContainer.setPosition(0, -120);
      mainContainer.addChild(this.logoContainer);
    }

    // Create title
    this.titleText = new UIText({
      text: this.config.title!,
      fontSize: 42,
      fontWeight: 'bold',
      color: { r: 255, g: 255, b: 255, a: 1 },
      textAlign: 'center',
      shadow: {
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offsetX: 2,
        offsetY: 2,
        blur: 4
      }
    }, 'title');
    
    this.titleText.setPosition(0, this.config.logoImage ? -40 : -80);
    this.titleText.autoSize();
    mainContainer.addChild(this.titleText);

    // Create button container
    this.buttonContainer = new UIContainer('button-container');
    this.buttonContainer.setPosition(0, 40);
    this.buttonContainer.setSizeConstraint('wrap', 'wrap');
    mainContainer.addChild(this.buttonContainer);

    // Create menu buttons
    this.createMenuButtons();

    // Create version text if enabled
    if (this.config.showVersion && this.config.version) {
      this.versionText = new UIText({
        text: `v${this.config.version}`,
        fontSize: 14,
        color: { r: 255, g: 255, b: 255, a: 0.7 },
        textAlign: 'center'
      }, 'version');
      
      this.versionText.setPositionConstraint('center', 'fixed');
      this.versionText.constraints.y.value = -30; // 30px from bottom
      this.versionText.autoSize();
      this.addChild(this.versionText);
    }

    // Create social buttons if enabled
    if (this.config.socialButtons) {
      this.createSocialButtons();
    }

    // Create settings button if enabled
    if (this.config.settingsButton) {
      this.createSettingsButton();
    }

    // Auto-size main container
    mainContainer.autoSize();
  }

  /**
   * Create menu buttons
   */
  private createMenuButtons(): void {
    if (!this.config.buttons) return;

    const buttonSpacing = 20;
    let currentY = 0;

    for (const buttonConfig of this.config.buttons) {
      const button = this.createButton(buttonConfig);
      button.setPosition(0, currentY);
      this.buttonContainer.addChild(button);
      this.buttons.set(buttonConfig.id, button);
      
      currentY += button.size.height + buttonSpacing;
    }

    // Auto-size container
    this.buttonContainer.autoSize();
  }

  /**
   * Create a styled button
   */
  private createButton(config: { text: string; id: string; style?: string; disabled?: boolean }): UIButton {
    let buttonStyle;
    
    switch (config.style) {
      case 'primary':
        buttonStyle = {
          backgroundColor: { r: 0, g: 122, b: 255, a: 1 },
          textColor: { r: 255, g: 255, b: 255, a: 1 },
          borderRadius: 12,
          fontSize: 18,
          fontWeight: 'bold',
          padding: 20
        };
        break;
      
      case 'secondary':
        buttonStyle = {
          backgroundColor: { r: 60, g: 70, b: 80, a: 1 },
          textColor: { r: 255, g: 255, b: 255, a: 1 },
          borderRadius: 12,
          fontSize: 16,
          padding: 18
        };
        break;
      
      case 'outline':
        buttonStyle = {
          backgroundColor: { r: 0, g: 0, b: 0, a: 0.2 },
          textColor: { r: 255, g: 255, b: 255, a: 1 },
          borderColor: { r: 255, g: 255, b: 255, a: 0.5 },
          borderWidth: 2,
          borderRadius: 12,
          fontSize: 16,
          padding: 18
        };
        break;
      
      default:
        buttonStyle = {
          backgroundColor: { r: 0, g: 122, b: 255, a: 1 },
          textColor: { r: 255, g: 255, b: 255, a: 1 },
          borderRadius: 12,
          fontSize: 16,
          padding: 18
        };
    }

    const button = new UIButton(buttonStyle, config.id);
    button.setText(config.text);
    button.setSize(250, 0); // Fixed width, auto height
    button.setDisabled(config.disabled || false);
    
    // Add event handlers
    button.on('click', () => {
      this.emit('button-clicked', config.id);
      this.handleButtonClick(config.id);
    });

    return button;
  }

  /**
   * Create social media buttons
   */
  private createSocialButtons(): void {
    this.socialContainer = new UIContainer('social-container');
    this.socialContainer.setPositionConstraint('center', 'fixed');
    this.socialContainer.constraints.y.value = -80; // 80px from bottom
    this.socialContainer.setSizeConstraint('wrap', 'wrap');

    // Create social buttons (simplified icons as colored circles)
    const socialButtons = [
      { id: 'facebook', color: { r: 59, g: 89, b: 152, a: 1 } },
      { id: 'twitter', color: { r: 29, g: 161, b: 242, a: 1 } },
      { id: 'instagram', color: { r: 225, g: 48, b: 108, a: 1 } }
    ];

    for (let i = 0; i < socialButtons.length; i++) {
      const social = socialButtons[i];
      const button = new UIButton({
        backgroundColor: social.color,
        borderRadius: 25,
        text: '', // Would use icons in real implementation
      }, social.id);
      
      button.setSize(50, 50);
      button.setPosition(i * 60, 0);
      
      button.on('click', () => {
        this.emit('social-clicked', social.id);
      });
      
      this.socialContainer.addChild(button);
    }

    this.socialContainer.autoSize();
    this.addChild(this.socialContainer);
  }

  /**
   * Create settings button (gear icon in corner)
   */
  private createSettingsButton(): void {
    this.settingsButton = new UIButton({
      backgroundColor: { r: 0, g: 0, b: 0, a: 0.3 },
      textColor: { r: 255, g: 255, b: 255, a: 0.8 },
      borderRadius: 25,
      text: '⚙', // Unicode gear symbol (would use icon in real implementation)
      fontSize: 20
    }, 'settings-corner');
    
    this.settingsButton.setSize(50, 50);
    this.settingsButton.setPositionConstraint('fixed', 'fixed');
    this.settingsButton.constraints.x.value = -60; // 60px from right
    this.settingsButton.position.y = 60; // 60px from top
    
    this.settingsButton.on('click', () => {
      this.emit('settings-clicked');
    });
    
    this.addChild(this.settingsButton);
  }

  /**
   * Handle button clicks with feedback
   */
  private handleButtonClick(buttonId: string): void {
    const button = this.buttons.get(buttonId);
    if (!button) return;

    // Add subtle feedback animation
    button.animate({ scale: { x: 0.95, y: 0.95 } }, {
      duration: 100,
      easing: 'ease-out',
      yoyo: true
    });

    // Add subtle screen shake for impact
    this.addScreenShake();
  }

  /**
   * Add subtle screen shake effect
   */
  private addScreenShake(): void {
    const originalPos = { ...this.position };
    const shakeIntensity = 2;
    const shakeDuration = 150;
    
    // Random shake positions
    const shakeFrames = 8;
    let currentFrame = 0;
    
    const shakeInterval = setInterval(() => {
      if (currentFrame >= shakeFrames) {
        this.setPosition(originalPos.x, originalPos.y);
        clearInterval(shakeInterval);
        return;
      }
      
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      
      this.setPosition(originalPos.x + shakeX, originalPos.y + shakeY);
      currentFrame++;
    }, shakeDuration / shakeFrames);
  }

  /**
   * Animate screen in with staggered button animations
   */
  protected async animateIn(): Promise<void> {
    // Start with elements hidden
    this.setAlpha(1);
    this.titleText.setAlpha(0);
    
    if (this.logoContainer) {
      this.logoContainer.setScale(0.5);
      this.logoContainer.setAlpha(0);
    }
    
    // Hide all buttons
    for (const button of Array.from(this.buttons.values())) {
      button.setAlpha(0);
      button.setScale(0.8);
    }
    
    if (this.versionText) this.versionText.setAlpha(0);
    if (this.socialContainer) this.socialContainer.setAlpha(0);
    if (this.settingsButton) this.settingsButton.setAlpha(0);

    // Animate logo first
    if (this.logoContainer) {
      await Promise.all([
        this.logoContainer.animate({ alpha: 1 }, { duration: 600, easing: 'ease-out' }),
        this.logoContainer.animate({ scale: { x: 1, y: 1 } }, { duration: 800, easing: 'spring' })
      ]);
    }

    // Animate title
    await this.titleText.animate({ alpha: 1 }, { duration: 400, easing: 'ease-out' });

    // Animate buttons with stagger
    const buttonArray = Array.from(this.buttons.values());
    for (let i = 0; i < buttonArray.length; i++) {
      const button = buttonArray[i];
      
      // Stagger the animations
      setTimeout(() => {
        Promise.all([
          button.animate({ alpha: 1 }, { duration: 300, easing: 'ease-out' }),
          button.animate({ scale: { x: 1, y: 1 } }, { duration: 400, easing: 'spring' })
        ]);
      }, i * 100);
    }

    // Wait for all button animations to start
    await new Promise(resolve => setTimeout(resolve, buttonArray.length * 100 + 300));

    // Animate other elements
    const otherAnimations = [];
    
    if (this.versionText) {
      otherAnimations.push(this.versionText.animate({ alpha: 1 }, { duration: 300, easing: 'ease-out' }));
    }
    
    if (this.socialContainer) {
      otherAnimations.push(this.socialContainer.animate({ alpha: 1 }, { duration: 300, easing: 'ease-out' }));
    }
    
    if (this.settingsButton) {
      otherAnimations.push(this.settingsButton.animate({ alpha: 1 }, { duration: 300, easing: 'ease-out' }));
    }

    await Promise.all(otherAnimations);
  }

  /**
   * Animate screen out
   */
  protected async animateOut(): Promise<void> {
    // Animate all elements out simultaneously
    const animations = [];
    
    animations.push(this.titleText.animate({ alpha: 0 }, { duration: 200, easing: 'ease-in' }));
    
    if (this.logoContainer) {
      animations.push(
        this.logoContainer.animate({ alpha: 0 }, { duration: 200, easing: 'ease-in' }),
        this.logoContainer.animate({ scale: { x: 0.8, y: 0.8 } }, { duration: 200, easing: 'ease-in' })
      );
    }
    
    for (const button of Array.from(this.buttons.values())) {
      animations.push(
        button.animate({ alpha: 0 }, { duration: 150, easing: 'ease-in' }),
        button.animate({ scale: { x: 0.9, y: 0.9 } }, { duration: 150, easing: 'ease-in' })
      );
    }
    
    if (this.versionText) {
      animations.push(this.versionText.animate({ alpha: 0 }, { duration: 150, easing: 'ease-in' }));
    }
    
    if (this.socialContainer) {
      animations.push(this.socialContainer.animate({ alpha: 0 }, { duration: 150, easing: 'ease-in' }));
    }
    
    if (this.settingsButton) {
      animations.push(this.settingsButton.animate({ alpha: 0 }, { duration: 150, easing: 'ease-in' }));
    }

    await Promise.all(animations);
  }

  /**
   * Enable/disable a button
   */
  public setButtonEnabled(buttonId: string, enabled: boolean): void {
    const button = this.buttons.get(buttonId);
    if (button) {
      button.setDisabled(!enabled);
    }
  }

  /**
   * Update button text
   */
  public setButtonText(buttonId: string, text: string): void {
    const button = this.buttons.get(buttonId);
    if (button) {
      button.setText(text);
    }
  }

  /**
   * Add a new button dynamically
   */
  public addButton(config: { text: string; id: string; style?: string; disabled?: boolean }): void {
    if (this.buttons.has(config.id)) return;

    const button = this.createButton(config);
    const buttonCount = this.buttons.size;
    const buttonSpacing = 20;
    
    button.setPosition(0, buttonCount * (button.size.height + buttonSpacing));
    this.buttonContainer.addChild(button);
    this.buttons.set(config.id, button);
    
    // Auto-size container
    this.buttonContainer.autoSize();
    
    // Animate in
    button.setAlpha(0);
    button.setScale(0.8);
    button.animate({ alpha: 1 }, { duration: 300, easing: 'ease-out' });
    button.animate({ scale: { x: 1, y: 1 } }, { duration: 400, easing: 'spring' });
  }

  /**
   * Remove a button
   */
  public removeButton(buttonId: string): void {
    const button = this.buttons.get(buttonId);
    if (!button) return;

    // Animate out
    Promise.all([
      button.animate({ alpha: 0 }, { duration: 200, easing: 'ease-in' }),
      button.animate({ scale: { x: 0.8, y: 0.8 } }, { duration: 200, easing: 'ease-in' })
    ]).then(() => {
      button.removeFromParent();
      this.buttons.delete(buttonId);
      
      // Rearrange remaining buttons
      this.rearrangeButtons();
    });
  }

  /**
   * Rearrange buttons after removal
   */
  private rearrangeButtons(): void {
    const buttonArray = Array.from(this.buttons.values());
    const buttonSpacing = 20;
    
    buttonArray.forEach((button, index) => {
      button.animate({ position: { x: 0, y: index * (button.size.height + buttonSpacing) } }, {
        duration: 300,
        easing: 'ease-out'
      });
    });
    
    // Auto-size container after animation
    setTimeout(() => {
      this.buttonContainer.autoSize();
    }, 300);
  }

  /**
   * Render the main menu screen
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0) return;
    
    // Render background first
    if (this.background) {
      this.background.render(renderer);
    }
    
    // Render all child components
    for (const child of this.children) {
      child.render(renderer);
    }
  }
}