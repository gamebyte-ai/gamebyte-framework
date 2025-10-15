/**
 * Archero Menu - Comprehensive Example Usage
 *
 * This file demonstrates all the features and capabilities of the fully configurable
 * ArcheroMenu component in the GameByte Framework.
 */

import {
  ArcheroMenu,
  MenuSection,
  ARCHERO_COLORS,
  ArcheroMenuStyleConfig,
  ArcheroMenuCallbacks
} from './ArcheroMenu';
import { IContainer, IText, IGraphics } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';

/**
 * Example 1: Basic Menu Setup (Backward Compatible)
 */
export function createBasicArcheroMenu(stage: IContainer): ArcheroMenu {
  // Define menu sections
  const sections: MenuSection[] = [
    {
      name: 'Shop',
      icon: '🏪',
      iconColor: ARCHERO_COLORS.red
    },
    {
      name: 'Gear',
      icon: '⚔️',
      iconColor: ARCHERO_COLORS.purple
    },
    {
      name: 'Campaign',
      icon: '🎯',
      iconColor: ARCHERO_COLORS.activeYellow
    },
    {
      name: 'Trophy',
      icon: '🏆',
      iconColor: ARCHERO_COLORS.green
    },
    {
      name: 'Chest',
      icon: '🎁',
      iconColor: ARCHERO_COLORS.red
    }
  ];

  // Create menu using legacy API (still works!)
  const menu = new ArcheroMenu({
    sections,
    activeSection: 2, // Start with Campaign
    onSectionChange: (index, section) => {
      console.log('Section changed to:', section.name);
    },
    enableSwipe: true,
    enableParticles: true,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  // Add to stage
  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 2: Custom Styled Menu with Style Configuration
 */
export function createCustomStyledMenu(stage: IContainer): ArcheroMenu {
  const sections: MenuSection[] = [
    { name: 'Home', icon: '🏠', iconColor: 0x4ECDC4 },
    { name: 'Play', icon: '▶️', iconColor: 0x95E1D3 },
    { name: 'Settings', icon: '⚙️', iconColor: 0xF38181 }
  ];

  // Define custom style configuration
  const customStyle: Partial<ArcheroMenuStyleConfig> = {
    // Custom button sizes
    buttonSize: 150,
    activeButtonSize: 280,
    buttonRadius: 20,

    // Custom gradient (red theme)
    buttonGradient: {
      topColor: 0xFF6B6B,
      middleColor: 0xFF3B3B,
      bottomColor: 0xCC0000
    },

    // Custom shine effect
    shineGradient: {
      topColor: 0xFFFFFF,
      middleColor: 0xFF6B6B,
      bottomColor: 0xFF3B3B,
      alpha: 0.6
    },

    // Custom navigation bar
    navBarColor: 0x1a1a2e,
    navHeight: 250,
    padding: 30,

    // Custom icon styling
    iconSize: 80,
    activeIconSize: 120,
    iconStrokeColor: 0x000000,
    iconStrokeWidth: 6,

    // Custom label styling
    labelSize: 35,
    labelColor: 0xFFFFFF,
    labelStrokeColor: 0xFF3B3B,
    labelStrokeWidth: 3,

    // Faster animations
    transitionDuration: 0.3,
    iconAnimDuration: 0.2,
    repositionDuration: 0.3,

    // More particles
    particleCount: 50,
    particleSizeRange: [4, 12],
    particleSpeedRange: [8, 20]
  };

  const menu = new ArcheroMenu({
    sections,
    activeSection: 1,
    style: customStyle,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 3: Menu with Event Callbacks
 */
export function createMenuWithCallbacks(stage: IContainer): ArcheroMenu {
  const sections: MenuSection[] = [
    { name: 'Profile', icon: '👤', iconColor: 0x3498db },
    { name: 'Friends', icon: '👥', iconColor: 0x2ecc71 },
    { name: 'Settings', icon: '⚙️', iconColor: 0x95a5a6 }
  ];

  // Define comprehensive callbacks
  const callbacks: ArcheroMenuCallbacks = {
    // Before transition - can cancel
    onBeforeTransition: (from, to) => {
      console.log(`Transitioning from ${from} to ${to}`);

      // Example: Prevent switching to settings if user is not logged in
      // return false; // Cancel transition

      return true; // Allow transition
    },

    // Section changed
    onSectionChange: (index, section) => {
      console.log(`Section changed: ${section.name} (index: ${index})`);

      // Update analytics, load content, etc.
      trackSectionView(section.name);
    },

    // After transition completes
    onAfterTransition: (from, to) => {
      console.log(`Transition completed: ${from} -> ${to}`);
    },

    // Button pressed
    onButtonPress: (index) => {
      console.log(`Button ${index} pressed`);
      playSound('button_press');
    },

    // Swipe detected
    onSwipe: (direction) => {
      console.log(`Swiped ${direction}`);
    }
  };

  const menu = new ArcheroMenu({
    sections,
    activeSection: 0,
    callbacks,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 4: Per-Section Style Overrides
 */
export function createMenuWithSectionOverrides(stage: IContainer): ArcheroMenu {
  const sections: MenuSection[] = [
    {
      name: 'Fire',
      icon: '🔥',
      iconColor: 0xFF4500,
      // Custom red gradient for this section
      customStyle: {
        buttonGradient: {
          topColor: 0xFF6B6B,
          middleColor: 0xFF4500,
          bottomColor: 0xCC0000
        },
        labelColor: 0xFFFFFF,
        labelStrokeColor: 0xFF4500
      }
    },
    {
      name: 'Water',
      icon: '💧',
      iconColor: 0x1E90FF,
      // Custom blue gradient for this section
      customStyle: {
        buttonGradient: {
          topColor: 0x87CEEB,
          middleColor: 0x1E90FF,
          bottomColor: 0x0047AB
        },
        labelColor: 0xFFFFFF,
        labelStrokeColor: 0x1E90FF
      }
    },
    {
      name: 'Earth',
      icon: '🌍',
      iconColor: 0x228B22,
      // Custom green gradient for this section
      customStyle: {
        buttonGradient: {
          topColor: 0x90EE90,
          middleColor: 0x228B22,
          bottomColor: 0x006400
        },
        labelColor: 0xFFFFFF,
        labelStrokeColor: 0x228B22,
        // Custom icon size for this section
        activeIconSize: 180
      }
    }
  ];

  const menu = new ArcheroMenu({
    sections,
    activeSection: 1,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 5: Dynamic Section Management
 */
export function createDynamicMenu(stage: IContainer): ArcheroMenu {
  const initialSections: MenuSection[] = [
    { name: 'Home', icon: '🏠', iconColor: ARCHERO_COLORS.blue },
    { name: 'Play', icon: '🎮', iconColor: ARCHERO_COLORS.green }
  ];

  const menu = new ArcheroMenu({
    sections: initialSections,
    activeSection: 0,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  // Add a new section after 2 seconds
  setTimeout(() => {
    console.log('Adding Shop section...');
    menu.addSection({
      name: 'Shop',
      icon: '🏪',
      iconColor: ARCHERO_COLORS.red
    });
  }, 2000);

  // Add another section after 4 seconds
  setTimeout(() => {
    console.log('Adding Inventory section...');
    menu.addSection(
      {
        name: 'Inventory',
        icon: '🎒',
        iconColor: ARCHERO_COLORS.purple
      },
      2 // Insert at index 2
    );
  }, 4000);

  // Update a section after 6 seconds
  setTimeout(() => {
    console.log('Updating Shop section...');
    menu.updateSection(2, {
      name: 'Store',
      icon: '🛒'
    });
  }, 6000);

  // Reorder sections after 8 seconds
  setTimeout(() => {
    console.log('Reordering sections...');
    const sections = menu.getSections();
    console.log('Current sections:', sections.map(s => s.name));

    // Swap first and last
    menu.reorderSections([3, 1, 2, 0]);
  }, 8000);

  return menu;
}

/**
 * Example 6: Custom Renderers for Complete Control
 */
export function createMenuWithCustomRenderers(stage: IContainer): ArcheroMenu {
  const sections: MenuSection[] = [
    { name: 'Custom 1', icon: '⭐', iconColor: 0xFFD700 },
    { name: 'Custom 2', icon: '🎨', iconColor: 0xFF69B4 },
    { name: 'Custom 3', icon: '🎵', iconColor: 0x9370DB }
  ];

  const callbacks: ArcheroMenuCallbacks = {
    // Custom icon renderer
    renderIcon: (section, isActive) => {
      // Create a custom animated icon
      const icon = graphics().createText(
        typeof section.icon === 'string' ? section.icon : '',
        {
          fontSize: isActive ? 150 : 100,
          fontFamily: 'system-ui',
          fill: section.iconColor || 0xFFFFFF,
          stroke: 0x000000,
          strokeThickness: 8
        }
      );

      if (icon.anchor) icon.anchor.set(0.5, 0.5);
      icon.y = isActive ? -40 : -15;

      return icon;
    },

    // Custom label renderer
    renderLabel: (section) => {
      const label = graphics().createText(section.name.toUpperCase(), {
        fontSize: 45,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        stroke: section.iconColor || 0xFFD700,
        strokeThickness: 5
      });

      if (label.anchor) label.anchor.set(0.5, 0.5);
      label.y = 60;

      return label;
    }
  };

  const menu = new ArcheroMenu({
    sections,
    activeSection: 1,
    callbacks,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 7: Custom Subclass with Extended Behavior
 */
export class CustomArcheroMenu extends ArcheroMenu {
  private badgeCount: Map<number, number> = new Map();

  constructor(options: any) {
    super(options);
  }

  /**
   * Set badge count for a section
   */
  public setBadge(index: number, count: number): void {
    this.badgeCount.set(index, count);
    // Could trigger a visual update here
  }

  /**
   * Override button creation to add badges
   */
  protected createButton(section: MenuSection, index: number): any {
    const buttonData = super.createButton(section, index);

    // Add badge if count exists
    const count = this.badgeCount.get(index);
    if (count && count > 0) {
      const badgeContainer = graphics().createContainer();
      const badgeSize = 35;

      // Badge background
      const badge = graphics().createGraphics();
      badge.circle(0, 0, badgeSize);
      badge.fill({ color: ARCHERO_COLORS.red });

      // Badge border
      badge.circle(0, 0, badgeSize);
      badge.stroke({ width: 3, color: ARCHERO_COLORS.white });

      // Badge text
      const badgeText = graphics().createText(count.toString(), {
        fontSize: 28,
        fill: ARCHERO_COLORS.white,
        fontWeight: 'bold'
      });

      if (badgeText.anchor) badgeText.anchor.set(0.5, 0.5);

      badgeContainer.addChild(badge);
      badgeContainer.addChild(badgeText);
      badgeContainer.x = this.style.buttonSize / 2 - 10;
      badgeContainer.y = -this.style.buttonSize / 2 + 10;

      buttonData.container.addChild(badgeContainer);
    }

    return buttonData;
  }

  /**
   * Override animation for custom effects
   */
  protected animateToActive(index: number): void {
    super.animateToActive(index);

    // Add custom shake effect
    const button = this.buttons[index];
    if (typeof window !== 'undefined' && (window as any).gsap) {
      const gsap = (window as any).gsap;
      gsap.from(button.container, {
        rotation: -0.1,
        duration: 0.1,
        repeat: 3,
        yoyo: true
      });
    }
  }
}

/**
 * Example 8: Using Custom Subclass
 */
export function createCustomSubclassMenu(stage: IContainer): CustomArcheroMenu {
  const sections: MenuSection[] = [
    { name: 'Messages', icon: '📧', iconColor: ARCHERO_COLORS.blue },
    { name: 'Notifications', icon: '🔔', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Profile', icon: '👤', iconColor: ARCHERO_COLORS.green }
  ];

  const menu = new CustomArcheroMenu({
    sections,
    activeSection: 0,
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  // Set badges
  menu.setBadge(0, 5); // 5 unread messages
  menu.setBadge(1, 12); // 12 notifications

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 9: Dynamic Style Updates
 */
export function createDynamicStyleMenu(stage: IContainer): ArcheroMenu {
  const sections: MenuSection[] = [
    { name: 'Day', icon: '☀️', iconColor: 0xFFD700 },
    { name: 'Night', icon: '🌙', iconColor: 0x4169E1 }
  ];

  const menu = new ArcheroMenu({
    sections,
    activeSection: 0,
    callbacks: {
      onSectionChange: (index) => {
        if (index === 0) {
          // Switch to day theme
          menu.setStyle({
            buttonGradient: {
              topColor: 0xFFE55C,
              middleColor: 0xFFD700,
              bottomColor: 0xFFA500
            },
            navBarColor: 0x87CEEB,
            labelColor: 0x4A2F1A
          });
        } else {
          // Switch to night theme
          menu.setStyle({
            buttonGradient: {
              topColor: 0x6495ED,
              middleColor: 0x4169E1,
              bottomColor: 0x191970
            },
            navBarColor: 0x191970,
            labelColor: 0xFFFFFF
          });
        }
      }
    },
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 10: Menu with Content Panels
 */
export function createMenuWithContent(stage: IContainer): {
  menu: ArcheroMenu;
  contentPanels: Map<number, IContainer>;
} {
  const sections: MenuSection[] = [
    { name: 'Shop', icon: '🏪', iconColor: ARCHERO_COLORS.red },
    { name: 'Inventory', icon: '🎒', iconColor: ARCHERO_COLORS.blue },
    { name: 'Map', icon: '🗺️', iconColor: ARCHERO_COLORS.green }
  ];

  // Create content panels for each section
  const contentPanels = new Map<number, IContainer>();

  sections.forEach((section, index) => {
    const panel = graphics().createContainer();
    panel.visible = index === 0; // Show first panel initially

    // Add some sample content
    const title = graphics().createText(section.name, {
      fontSize: 80,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    });
    title.x = 540; // Center (1080 / 2)
    title.y = 200;
    if (title.anchor) title.anchor.set(0.5, 0);
    panel.addChild(title);

    contentPanels.set(index, panel);
    stage.addChild(panel);
  });

  // Create menu
  const menu = new ArcheroMenu({
    sections,
    activeSection: 0,
    callbacks: {
      onSectionChange: (index) => {
        // Hide all panels
        contentPanels.forEach((panel) => {
          panel.visible = false;
        });

        // Show active panel with fade animation
        const activePanel = contentPanels.get(index);
        if (activePanel) {
          activePanel.visible = true;
          activePanel.alpha = 0;

          if (typeof window !== 'undefined' && (window as any).gsap) {
            (window as any).gsap.to(activePanel, {
              alpha: 1,
              duration: 0.3
            });
          } else {
            activePanel.alpha = 1;
          }
        }
      }
    },
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return { menu, contentPanels };
}

/**
 * Example 11: Minimal Setup (Performance Optimized)
 */
export function createMinimalMenu(stage: IContainer): ArcheroMenu {
  const sections: MenuSection[] = [
    { name: 'Main', icon: '🏠' },
    { name: 'Play', icon: '▶️' }
  ];

  const menu = new ArcheroMenu({
    sections,
    activeSection: 0,
    style: {
      enableParticles: false,  // Disable particles for better performance
      transitionDuration: 0.2,  // Faster transitions
      iconAnimDuration: 0.15,
      repositionDuration: 0.2
    },
    enableSwipe: false,  // Disable swipe (button clicks only)
    canvasWidth: 1080,
    canvasHeight: 1920
  });

  stage.addChild(menu.getContainer());

  return menu;
}

/**
 * Example 12: Full Game Integration Scene
 */
export class GameWithArcheroMenu {
  private menu: ArcheroMenu;
  private currentContent: IContainer | null = null;
  private stage: IContainer;

  constructor(stage: IContainer) {
    this.stage = stage;

    // Create menu sections
    const sections: MenuSection[] = [
      { name: 'Shop', icon: '🏪', iconColor: ARCHERO_COLORS.red },
      { name: 'Gear', icon: '⚔️', iconColor: ARCHERO_COLORS.purple },
      { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
      { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
      { name: 'Chest', icon: '🎁', iconColor: ARCHERO_COLORS.blue }
    ];

    // Create menu with full configuration
    this.menu = new ArcheroMenu({
      sections,
      activeSection: 2, // Campaign
      callbacks: {
        onBeforeTransition: (from, to) => {
          console.log(`Navigating from ${sections[from].name} to ${sections[to].name}`);
          return true;
        },
        onSectionChange: this.handleSectionChange.bind(this),
        onButtonPress: (index) => {
          console.log(`Button pressed: ${sections[index].name}`);
        }
      },
      style: {
        transitionDuration: 0.5,
        enableParticles: true,
        particleCount: 30
      },
      enableSwipe: true,
      canvasWidth: 1080,
      canvasHeight: 1920
    });

    this.stage.addChild(this.menu.getContainer());

    // Load initial content
    this.loadContent(2);
  }

  private handleSectionChange(index: number, section: MenuSection): void {
    // Remove old content
    if (this.currentContent) {
      this.stage.removeChild(this.currentContent);
      this.currentContent.destroy({ children: true });
    }

    // Load new content
    this.loadContent(index);
  }

  private loadContent(index: number): void {
    console.log('Loading content for section:', index);

    // Create placeholder content
    this.currentContent = graphics().createContainer();

    const title = graphics().createText(
      `Content for ${this.menu.getSection(index).name}`,
      {
        fontSize: 60,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    );
    title.x = 540;
    title.y = 400;
    if (title.anchor) title.anchor.set(0.5, 0);

    this.currentContent.addChild(title);
    this.stage.addChild(this.currentContent);
  }

  public update(deltaTime: number): void {
    // Update menu (for particles)
    this.menu.update(deltaTime);

    // Update current content if needed
  }

  public destroy(): void {
    if (this.currentContent) {
      this.currentContent.destroy({ children: true });
    }
    this.menu.destroy();
  }

  // Public API for external control
  public navigateToSection(index: number): void {
    this.menu.setActiveSection(index);
  }

  public getMenu(): ArcheroMenu {
    return this.menu;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function trackSectionView(sectionName: string): void {
  console.log('Analytics: Section viewed -', sectionName);
}

function playSound(soundName: string): void {
  console.log('Sound: Playing -', soundName);
}
