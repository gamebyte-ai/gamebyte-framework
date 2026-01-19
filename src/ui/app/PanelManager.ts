import { EventEmitter } from 'eventemitter3';
import { IContainer } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';
import { GamePanel } from '../panels/GamePanel.js';

/**
 * PanelManager configuration
 */
export interface PanelManagerConfig {
  container: IContainer;
  screenWidth: number;
  screenHeight: number;
}

/**
 * PanelManager - Manages overlay panels (modals, sheets, fullscreen)
 *
 * Features:
 * - Multiple panel support (stacking)
 * - Z-order management
 * - Auto-initialization with screen size
 * - Close all / close top functionality
 *
 * @example
 * ```typescript
 * const panelManager = new PanelManager({
 *   container: stage,
 *   screenWidth: 720,
 *   screenHeight: 1280
 * });
 *
 * // Show a modal
 * const modal = new GameModalPanel({ title: 'Settings' });
 * panelManager.show(modal);
 *
 * // Close top panel
 * panelManager.closeTop();
 *
 * // Close all panels
 * panelManager.closeAll();
 * ```
 */
export class PanelManager extends EventEmitter {
  private container: IContainer;
  private panelContainer: IContainer;
  private activePanels: GamePanel[] = [];

  private config: PanelManagerConfig;

  constructor(config: PanelManagerConfig) {
    super();

    this.config = config;
    this.container = config.container;

    // Create panel container layer
    this.panelContainer = graphics().createContainer();
    this.container.addChild(this.panelContainer);
  }

  /**
   * Show a panel
   */
  public async show(panel: GamePanel): Promise<void> {
    // Initialize panel with screen dimensions
    panel.initialize(this.config.screenWidth, this.config.screenHeight);

    // Add to active panels
    this.activePanels.push(panel);

    // Add to container
    this.panelContainer.addChild(panel.getContainer());

    // Listen for close event
    panel.once('close', () => {
      this.removePanel(panel);
    });

    // Show with animation
    await panel.show();

    this.emit('panel-shown', panel);
  }

  /**
   * Close the top (most recent) panel
   */
  public async closeTop(): Promise<GamePanel | null> {
    if (this.activePanels.length === 0) {
      return null;
    }

    const topPanel = this.activePanels[this.activePanels.length - 1];
    await topPanel.close();

    return topPanel;
  }

  /**
   * Close all panels
   */
  public async closeAll(): Promise<void> {
    // Close in reverse order
    const panels = [...this.activePanels].reverse();

    for (const panel of panels) {
      await panel.close();
    }
  }

  /**
   * Remove a panel from management
   */
  private removePanel(panel: GamePanel): void {
    const index = this.activePanels.indexOf(panel);
    if (index !== -1) {
      this.activePanels.splice(index, 1);
    }

    // Remove from container (try to remove, safe if not a child)
    const container = panel.getContainer();
    try {
      this.panelContainer.removeChild(container);
    } catch {
      // Panel was not a child of panelContainer, ignore
    }

    // Destroy panel to free resources and prevent memory leaks
    panel.destroy();

    this.emit('panel-closed', panel);
  }

  /**
   * Close a specific panel
   */
  public async close(panel: GamePanel): Promise<void> {
    if (this.activePanels.includes(panel)) {
      await panel.close();
    }
  }

  /**
   * Check if any panels are active
   */
  public hasActivePanels(): boolean {
    return this.activePanels.length > 0;
  }

  /**
   * Get the number of active panels
   */
  public getPanelCount(): number {
    return this.activePanels.length;
  }

  /**
   * Get the top panel
   */
  public getTopPanel(): GamePanel | null {
    return this.activePanels.length > 0
      ? this.activePanels[this.activePanels.length - 1]
      : null;
  }

  /**
   * Handle back button (closes top panel if any)
   */
  public handleBackButton(): boolean {
    if (this.activePanels.length > 0) {
      this.closeTop();
      return true;
    }
    return false;
  }

  /**
   * Resize panels when screen size changes
   */
  public resize(screenWidth: number, screenHeight: number): void {
    this.config.screenWidth = screenWidth;
    this.config.screenHeight = screenHeight;

    // Re-initialize all active panels
    this.activePanels.forEach((panel) => {
      panel.initialize(screenWidth, screenHeight);
    });

    this.emit('resize', { width: screenWidth, height: screenHeight });
  }

  /**
   * Bring panel container to front
   */
  public bringToFront(): void {
    // Use the stored container reference instead of relying on parent property
    try {
      this.container.removeChild(this.panelContainer);
      this.container.addChild(this.panelContainer);
    } catch {
      // panelContainer was not a child of container, ignore
    }
  }

  /**
   * Destroy the panel manager
   */
  public destroy(): void {
    // Destroy all panels
    this.activePanels.forEach((panel) => {
      panel.destroy();
    });
    this.activePanels = [];

    this.panelContainer.destroy({ children: true });
    this.removeAllListeners();
  }
}
