import { BaseUIComponent } from '../core/BaseUIComponent';
import { UIScreen, ScreenOrientation, DeviceInfo } from '../../contracts/UI';
import { UIContainer } from '../components/UIContainer';
import { UIPanel } from '../components/UIPanel';

/**
 * Abstract base class for game screens
 */
export abstract class BaseUIScreen extends BaseUIComponent implements UIScreen {
  public readonly screenName: string;
  
  // Screen lifecycle state
  protected _isShowing: boolean = false;
  protected _isVisible: boolean = false;
  protected _showData: any = null;

  constructor(screenName: string, id?: string) {
    super(id || screenName);
    this.screenName = screenName;
    
    // Screens fill the entire display by default
    this.constraints = {
      x: { type: 'fixed', value: 0 },
      y: { type: 'fixed', value: 0 },
      width: { type: 'fill' },
      height: { type: 'fill' }
    };
  }

  /**
   * Called when screen is about to be shown
   */
  public async onShow(data?: any): Promise<void> {
    this._showData = data;
    this._isShowing = true;
    this._isVisible = true;
    this.setVisible(true);
    
    // Animate in
    await this.animateIn();
    
    this.emit('shown', data);
  }

  /**
   * Called when screen is about to be hidden
   */
  public async onHide(): Promise<void> {
    this._isShowing = false;
    
    // Animate out
    await this.animateOut();
    
    this._isVisible = false;
    this.setVisible(false);
    this._showData = null;
    
    this.emit('hidden');
  }

  /**
   * Called when device orientation changes
   */
  public onOrientationChange(orientation: ScreenOrientation): void {
    this.handleOrientationChange(orientation);
    this.emit('orientation-changed', orientation);
  }

  /**
   * Handle back button (return true if handled)
   */
  public onBackButton(): boolean {
    return this.handleBackButton();
  }

  /**
   * Check if screen is currently showing
   */
  public isShowing(): boolean {
    return this._isShowing;
  }

  /**
   * Get the data passed to onShow
   */
  public getShowData(): any {
    return this._showData;
  }

  /**
   * Animate screen in (to be overridden by subclasses)
   */
  protected async animateIn(): Promise<void> {
    // Default fade in animation
    this.setAlpha(0);
    return this.animate({ alpha: 1 }, {
      duration: 300,
      easing: 'ease-out'
    });
  }

  /**
   * Animate screen out (to be overridden by subclasses)
   */
  protected async animateOut(): Promise<void> {
    // Default fade out animation
    return this.animate({ alpha: 0 }, {
      duration: 200,
      easing: 'ease-in'
    });
  }

  /**
   * Handle orientation change (to be overridden by subclasses)
   */
  protected handleOrientationChange(orientation: ScreenOrientation): void {
    // Default implementation - subclasses can override
    this.requestLayout();
  }

  /**
   * Handle back button (to be overridden by subclasses)
   */
  protected handleBackButton(): boolean {
    // Default implementation - not handled
    return false;
  }

  /**
   * Create safe area padding based on device info
   */
  protected applySafeAreaPadding(deviceInfo: DeviceInfo): void {
    const safeArea = deviceInfo.safeArea;
    this.setPadding({
      top: safeArea.top,
      right: safeArea.right,
      bottom: safeArea.bottom,
      left: safeArea.left
    });
  }

  /**
   * Create responsive design adjustments
   */
  protected applyResponsiveDesign(deviceInfo: DeviceInfo): void {
    // Adjust component sizes based on screen size and performance tier
    const { screenSize, performanceTier } = deviceInfo;
    const isSmallScreen = Math.min(screenSize.width, screenSize.height) < 400;
    
    if (isSmallScreen) {
      // Reduce sizes for small screens
      this.emit('responsive-adjust', { type: 'small-screen', deviceInfo });
    }
    
    if (performanceTier === 'low') {
      // Reduce visual effects for low-end devices
      this.emit('responsive-adjust', { type: 'low-performance', deviceInfo });
    }
  }

  /**
   * Show loading overlay
   */
  protected showLoadingOverlay(message?: string): void {
    // Implementation would create a loading overlay
    this.emit('show-loading', message);
  }

  /**
   * Hide loading overlay
   */
  protected hideLoadingOverlay(): void {
    this.emit('hide-loading');
  }

  /**
   * Show error message
   */
  protected showError(message: string, title?: string): void {
    this.emit('show-error', { message, title });
  }

  /**
   * Show success message
   */
  protected showSuccess(message: string, title?: string): void {
    this.emit('show-success', { message, title });
  }

  /**
   * Create a centered container for main content
   */
  protected createCenteredContainer(): any {
    const container = new UIContainer('centered-container');
    container.setPositionConstraint('center', 'center');
    container.setSizeConstraint('wrap', 'wrap');
    this.addChild(container);
    return container;
  }

  /**
   * Create a full-screen background
   */
  protected createBackground(config?: any): any {
    const background = new UIPanel(config, 'screen-background');
    background.setPositionConstraint('fixed', 'fixed');
    background.setSizeConstraint('fill', 'fill');
    background.setPosition(0, 0);
    
    // Add background first so it renders behind other elements
    this.children.unshift(background);
    
    return background;
  }

  /**
   * Create a header area
   */
  protected createHeader(height: number = 80): any {
    const header = new UIContainer('screen-header');
    header.setPositionConstraint('fixed', 'fixed');
    header.setSizeConstraint('fill', 'fixed');
    header.setPosition(0, 0);
    header.setSize(0, height);
    this.addChild(header);
    return header;
  }

  /**
   * Create a footer area
   */
  protected createFooter(height: number = 80): any {
    const footer = new UIContainer('screen-footer');
    footer.setPositionConstraint('fixed', 'fixed');
    footer.setSizeConstraint('fill', 'fixed');
    footer.setPosition(0, 0); // Will be positioned at bottom by constraint
    footer.setSize(0, height);
    
    // Position at bottom
    footer.constraints.y = { type: 'fixed', value: -height };
    
    this.addChild(footer);
    return footer;
  }

  /**
   * Handle common screen setup
   */
  protected setupScreen(): void {
    // Override in subclasses for specific setup
    this.emit('screen-setup');
  }

  /**
   * Handle common screen cleanup
   */
  protected cleanupScreen(): void {
    // Override in subclasses for specific cleanup
    this.emit('screen-cleanup');
  }

  /**
   * Initialize the screen
   */
  public initialize(): void {
    super.initialize();
    this.setupScreen();
  }

  /**
   * Destroy the screen
   */
  public destroy(): void {
    this.cleanupScreen();
    super.destroy();
  }
}