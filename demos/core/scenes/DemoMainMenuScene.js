import { EventEmitter } from 'eventemitter3';

/**
 * Demo Main Menu Scene - showcases mobile-first UI and service integration
 * 
 * This scene demonstrates:
 * - Mobile-optimized touch-first UI design
 * - Service integration through facades
 * - Responsive layout and design patterns
 * - Smooth animations and micro-interactions
 */
export class DemoMainMenuScene extends EventEmitter {
  constructor() {
    super();
    
    // Scene identification
    this.id = 'mainmenu';
    this.name = 'Main Menu';
    
    // Scene state
    this.isActive = false;
    this.initialized = false;
    
    // UI elements
    this.buttons = [];
    this.selectedButtonIndex = -1;
    this.animationProgress = 0;
    this.startTime = null;
    
    // Layout properties (responsive)
    this.layout = {
      centerX: 0,
      centerY: 0,
      scale: 1,
      buttonWidth: 250,
      buttonHeight: 50,
      buttonSpacing: 20
    };
    
    // Colors (mobile-optimized)
    this.colors = {
      background: '#1a1a1a',
      backgroundGradient: ['#1e3c72', '#2a5298'],
      primary: '#007AFF',
      secondary: '#34C759',
      danger: '#FF3B30',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      buttonBackground: 'rgba(255, 255, 255, 0.1)',
      buttonBackgroundHover: 'rgba(255, 255, 255, 0.2)'
    };
    
    // Initialize buttons
    this.initializeButtons();
    
    console.log('📱 DemoMainMenuScene: Created');
  }
  
  /**
   * Initialize menu buttons
   */
  initializeButtons() {
    this.buttons = [
      {
        id: 'play',
        text: 'Play Demo',
        style: 'primary',
        icon: '▶️',
        description: 'Start the interactive demo',
        action: () => this.emit('button:play')
      },
      {
        id: 'architecture',
        text: 'Architecture Demo',
        style: 'secondary',
        icon: '🏗️',
        description: 'Explore DI/IoC patterns',
        action: () => this.emit('button:architecture')
      },
      {
        id: 'services',
        text: 'Service Showcase',
        style: 'secondary',
        icon: '⚙️',
        description: 'View service provider integration',
        action: () => this.emit('button:services')
      },
      {
        id: 'facades',
        text: 'Facade Examples',
        style: 'secondary',
        icon: '🎭',
        description: 'See clean static API usage',
        action: () => this.emit('button:facades')
      },
      {
        id: 'settings',
        text: 'Settings',
        style: 'outline',
        icon: '⚙️',
        description: 'Configure demo options',
        action: () => this.emit('button:settings')
      }
    ];\n    \n    // Add interactive states to buttons\n    this.buttons.forEach((button, index) => {\n      button.index = index;\n      button.alpha = 0;\n      button.scale = 0.8;\n      button.isPressed = false;\n      button.pressStartTime = 0;\n    });\n  }\n  \n  /**\n   * Initialize the scene\n   */\n  async initialize() {\n    if (this.initialized) return;\n    \n    console.log('🚀 DemoMainMenuScene: Initializing...');\n    \n    // Scene setup can be async if needed\n    await this.setupScene();\n    \n    this.initialized = true;\n    this.emit('initialized');\n    \n    console.log('✅ DemoMainMenuScene: Initialized successfully');\n  }\n  \n  /**\n   * Setup scene components\n   */\n  async setupScene() {\n    // Simulate any async setup work\n    await new Promise(resolve => setTimeout(resolve, 100));\n    \n    // Scene is ready\n    console.log('📋 DemoMainMenuScene: Scene components ready');\n  }\n  \n  /**\n   * Activate the scene\n   */\n  activate() {\n    if (this.isActive) return;\n    \n    this.isActive = true;\n    this.startTime = Date.now();\n    this.animationProgress = 0;\n    \n    // Start entrance animations\n    this.startEntranceAnimation();\n    \n    this.emit('activated');\n    console.log('▶️ DemoMainMenuScene: Activated');\n  }\n  \n  /**\n   * Start entrance animation sequence\n   */\n  startEntranceAnimation() {\n    // Stagger button animations\n    this.buttons.forEach((button, index) => {\n      setTimeout(() => {\n        this.animateButtonIn(button);\n      }, index * 100);\n    });\n  }\n  \n  /**\n   * Animate button entrance\n   */\n  animateButtonIn(button) {\n    const duration = 400;\n    const startTime = Date.now();\n    const startAlpha = button.alpha;\n    const startScale = button.scale;\n    \n    const animate = () => {\n      const elapsed = Date.now() - startTime;\n      const progress = Math.min(elapsed / duration, 1);\n      const easedProgress = this.easeOutBack(progress);\n      \n      button.alpha = startAlpha + (1 - startAlpha) * this.easeOutQuad(progress);\n      button.scale = startScale + (1 - startScale) * easedProgress;\n      \n      if (progress < 1) {\n        requestAnimationFrame(animate);\n      }\n    };\n    \n    requestAnimationFrame(animate);\n  }\n  \n  /**\n   * Deactivate the scene\n   */\n  deactivate() {\n    if (!this.isActive) return;\n    \n    this.isActive = false;\n    this.selectedButtonIndex = -1;\n    \n    this.emit('deactivated');\n    console.log('⏸️ DemoMainMenuScene: Deactivated');\n  }\n  \n  /**\n   * Update scene logic\n   */\n  update(deltaTime) {\n    if (!this.isActive || !this.startTime) return;\n    \n    // Update overall animation progress\n    const elapsed = Date.now() - this.startTime;\n    this.animationProgress = Math.min(elapsed / 2000, 1); // 2 second total animation\n    \n    // Update button press animations\n    this.updateButtonAnimations();\n    \n    this.emit('updated', deltaTime);\n  }\n  \n  /**\n   * Update button press animations\n   */\n  updateButtonAnimations() {\n    this.buttons.forEach(button => {\n      if (button.isPressed) {\n        const elapsed = Date.now() - button.pressStartTime;\n        const pressDuration = 150;\n        \n        if (elapsed < pressDuration) {\n          const progress = elapsed / pressDuration;\n          button.scale = 0.95 + (1 - 0.95) * (1 - this.easeOutQuad(progress));\n        } else {\n          button.isPressed = false;\n          button.scale = 1;\n        }\n      }\n    });\n  }\n  \n  /**\n   * Render the main menu scene\n   */\n  render(renderer) {\n    if (!this.isActive) return;\n    \n    const ctx = renderer.getContext ? renderer.getContext('2d') : renderer;\n    const canvas = ctx.canvas;\n    const width = canvas.width;\n    const height = canvas.height;\n    \n    // Update layout for current screen size\n    this.updateLayout(width, height);\n    \n    // Render background\n    this.renderBackground(ctx, width, height);\n    \n    // Render title\n    this.renderTitle(ctx);\n    \n    // Render buttons\n    this.renderButtons(ctx);\n    \n    // Render footer info\n    this.renderFooter(ctx, width, height);\n    \n    this.emit('rendered', renderer);\n  }\n  \n  /**\n   * Update responsive layout\n   */\n  updateLayout(width, height) {\n    this.layout.centerX = width / 2;\n    this.layout.centerY = height / 2;\n    this.layout.scale = Math.min(width / 800, height / 600);\n    \n    // Adjust for mobile screens\n    if (width < 600) {\n      this.layout.buttonWidth = Math.min(250, width - 40);\n      this.layout.buttonHeight = 50;\n      this.layout.buttonSpacing = 15;\n    } else {\n      this.layout.buttonWidth = 250;\n      this.layout.buttonHeight = 50;\n      this.layout.buttonSpacing = 20;\n    }\n  }\n  \n  /**\n   * Render gradient background\n   */\n  renderBackground(ctx, width, height) {\n    // Create gradient background\n    const gradient = ctx.createLinearGradient(0, 0, width, height);\n    gradient.addColorStop(0, this.colors.backgroundGradient[0]);\n    gradient.addColorStop(1, this.colors.backgroundGradient[1]);\n    \n    ctx.fillStyle = gradient;\n    ctx.fillRect(0, 0, width, height);\n    \n    // Add subtle pattern overlay\n    this.renderBackgroundPattern(ctx, width, height);\n  }\n  \n  /**\n   * Render subtle background pattern\n   */\n  renderBackgroundPattern(ctx, width, height) {\n    ctx.save();\n    ctx.globalAlpha = 0.1;\n    ctx.strokeStyle = this.colors.text;\n    ctx.lineWidth = 1;\n    \n    const spacing = 50;\n    for (let x = 0; x < width; x += spacing) {\n      for (let y = 0; y < height; y += spacing) {\n        if ((x + y) % (spacing * 2) === 0) {\n          ctx.beginPath();\n          ctx.arc(x, y, 2, 0, Math.PI * 2);\n          ctx.stroke();\n        }\n      }\n    }\n    \n    ctx.restore();\n  }\n  \n  /**\n   * Render scene title\n   */\n  renderTitle(ctx) {\n    const { centerX, centerY, scale } = this.layout;\n    \n    ctx.save();\n    ctx.globalAlpha = Math.min(this.animationProgress * 2, 1);\n    \n    // Main title with shadow\n    ctx.fillStyle = this.colors.text;\n    ctx.font = `bold ${Math.round(42 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;\n    ctx.textAlign = 'center';\n    ctx.textBaseline = 'middle';\n    \n    // Text shadow\n    ctx.save();\n    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';\n    ctx.fillText('GameByte Framework', centerX + 2, centerY - 150 * scale + 2);\n    ctx.restore();\n    \n    // Main text\n    ctx.fillText('GameByte Framework', centerX, centerY - 150 * scale);\n    \n    // Subtitle\n    ctx.fillStyle = this.colors.textSecondary;\n    ctx.font = `${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;\n    ctx.fillText('Architecture Demo', centerX, centerY - 110 * scale);\n    \n    ctx.restore();\n  }\n  \n  /**\n   * Render menu buttons\n   */\n  renderButtons(ctx) {\n    const { centerX, centerY, scale, buttonWidth, buttonHeight, buttonSpacing } = this.layout;\n    const totalHeight = this.buttons.length * (buttonHeight + buttonSpacing) - buttonSpacing;\n    const startY = centerY - totalHeight / 2;\n    \n    this.buttons.forEach((button, index) => {\n      const y = startY + index * (buttonHeight + buttonSpacing);\n      this.renderButton(ctx, button, centerX, y, buttonWidth, buttonHeight, scale);\n    });\n  }\n  \n  /**\n   * Render individual button\n   */\n  renderButton(ctx, button, x, y, width, height, scale) {\n    if (button.alpha <= 0) return;\n    \n    ctx.save();\n    ctx.globalAlpha = button.alpha;\n    ctx.translate(x, y);\n    ctx.scale(button.scale, button.scale);\n    \n    // Button background\n    const isSelected = button.index === this.selectedButtonIndex;\n    const bgColor = this.getButtonBackgroundColor(button.style, isSelected);\n    \n    ctx.fillStyle = bgColor;\n    ctx.fillRect(-width/2, -height/2, width, height);\n    \n    // Button border\n    if (button.style === 'outline') {\n      ctx.strokeStyle = this.getButtonBorderColor(button.style);\n      ctx.lineWidth = 2;\n      ctx.strokeRect(-width/2, -height/2, width, height);\n    }\n    \n    // Button shadow for depth\n    if (button.style !== 'outline') {\n      ctx.save();\n      ctx.globalAlpha = 0.3;\n      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';\n      ctx.fillRect(-width/2 + 2, -height/2 + 2, width, height);\n      ctx.restore();\n    }\n    \n    // Button content\n    this.renderButtonContent(ctx, button, width, height, scale);\n    \n    ctx.restore();\n  }\n  \n  /**\n   * Render button content (text and icon)\n   */\n  renderButtonContent(ctx, button, width, height, scale) {\n    // Icon\n    if (button.icon) {\n      ctx.font = `${Math.round(20 * scale)}px emoji`;\n      ctx.textAlign = 'left';\n      ctx.textBaseline = 'middle';\n      ctx.fillStyle = this.colors.text;\n      ctx.fillText(button.icon, -width/2 + 20, 0);\n    }\n    \n    // Main text\n    ctx.font = `bold ${Math.round(16 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;\n    ctx.textAlign = 'center';\n    ctx.textBaseline = 'middle';\n    ctx.fillStyle = this.getButtonTextColor(button.style);\n    ctx.fillText(button.text, 0, -3);\n    \n    // Description text\n    if (button.description && width > 200) {\n      ctx.font = `${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;\n      ctx.fillStyle = this.colors.textSecondary;\n      ctx.fillText(button.description, 0, 12);\n    }\n  }\n  \n  /**\n   * Get button background color based on style\n   */\n  getButtonBackgroundColor(style, isSelected) {\n    const alpha = isSelected ? 0.8 : 0.7;\n    \n    switch (style) {\n      case 'primary':\n        return this.colors.primary + Math.round(255 * alpha).toString(16).padStart(2, '0');\n      case 'secondary':\n        return this.colors.secondary + Math.round(255 * alpha).toString(16).padStart(2, '0');\n      case 'danger':\n        return this.colors.danger + Math.round(255 * alpha).toString(16).padStart(2, '0');\n      case 'outline':\n        return isSelected ? this.colors.buttonBackgroundHover : 'rgba(255, 255, 255, 0.05)';\n      default:\n        return this.colors.buttonBackground;\n    }\n  }\n  \n  /**\n   * Get button border color\n   */\n  getButtonBorderColor(style) {\n    switch (style) {\n      case 'primary': return this.colors.primary;\n      case 'secondary': return this.colors.secondary;\n      case 'danger': return this.colors.danger;\n      case 'outline': return this.colors.textSecondary;\n      default: return this.colors.textSecondary;\n    }\n  }\n  \n  /**\n   * Get button text color\n   */\n  getButtonTextColor(style) {\n    return this.colors.text;\n  }\n  \n  /**\n   * Render footer information\n   */\n  renderFooter(ctx, width, height) {\n    const scale = this.layout.scale;\n    \n    ctx.save();\n    ctx.globalAlpha = Math.min(this.animationProgress, 1);\n    \n    // Demo info\n    ctx.fillStyle = this.colors.textSecondary;\n    ctx.font = `${Math.round(12 * scale)}px monospace`;\n    ctx.textAlign = 'left';\n    ctx.textBaseline = 'bottom';\n    ctx.fillText('Demo v1.0.0 | Mobile-First Architecture', 20, height - 20);\n    \n    // Instructions\n    ctx.textAlign = 'right';\n    ctx.fillText('Tap buttons to explore features', width - 20, height - 20);\n    \n    ctx.restore();\n  }\n  \n  /**\n   * Handle touch/click events\n   */\n  handleTouch(x, y) {\n    if (!this.isActive) return false;\n    \n    const { centerX, centerY, buttonWidth, buttonHeight, buttonSpacing } = this.layout;\n    const totalHeight = this.buttons.length * (buttonHeight + buttonSpacing) - buttonSpacing;\n    const startY = centerY - totalHeight / 2;\n    \n    // Check each button\n    for (const button of this.buttons) {\n      const buttonY = startY + button.index * (buttonHeight + buttonSpacing);\n      const bounds = {\n        left: centerX - buttonWidth / 2,\n        right: centerX + buttonWidth / 2,\n        top: buttonY - buttonHeight / 2,\n        bottom: buttonY + buttonHeight / 2\n      };\n      \n      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {\n        this.handleButtonPress(button);\n        return true;\n      }\n    }\n    \n    return false;\n  }\n  \n  /**\n   * Handle button press\n   */\n  handleButtonPress(button) {\n    // Visual feedback\n    button.isPressed = true;\n    button.pressStartTime = Date.now();\n    \n    // Haptic feedback (if supported)\n    if ('vibrate' in navigator) {\n      navigator.vibrate(50);\n    }\n    \n    // Execute button action\n    setTimeout(() => {\n      button.action();\n    }, 100); // Small delay for visual feedback\n    \n    console.log(`🔘 DemoMainMenuScene: Button pressed - ${button.id}`);\n  }\n  \n  /**\n   * Handle keyboard input\n   */\n  handleKeyboard(key) {\n    if (!this.isActive) return false;\n    \n    switch (key) {\n      case 'ArrowUp':\n      case 'w':\n      case 'W':\n        this.selectPreviousButton();\n        return true;\n        \n      case 'ArrowDown':\n      case 's':\n      case 'S':\n        this.selectNextButton();\n        return true;\n        \n      case 'Enter':\n      case ' ':\n        if (this.selectedButtonIndex >= 0) {\n          this.handleButtonPress(this.buttons[this.selectedButtonIndex]);\n        }\n        return true;\n    }\n    \n    return false;\n  }\n  \n  /**\n   * Select previous button (keyboard navigation)\n   */\n  selectPreviousButton() {\n    if (this.selectedButtonIndex <= 0) {\n      this.selectedButtonIndex = this.buttons.length - 1;\n    } else {\n      this.selectedButtonIndex--;\n    }\n  }\n  \n  /**\n   * Select next button (keyboard navigation)\n   */\n  selectNextButton() {\n    if (this.selectedButtonIndex >= this.buttons.length - 1) {\n      this.selectedButtonIndex = 0;\n    } else {\n      this.selectedButtonIndex++;\n    }\n  }\n  \n  /**\n   * Clean up scene resources\n   */\n  destroy() {\n    this.deactivate();\n    this.removeAllListeners();\n    \n    this.buttons = [];\n    this.initialized = false;\n    this.startTime = null;\n    \n    console.log('🧹 DemoMainMenuScene: Destroyed');\n  }\n  \n  // Easing functions\n  \n  easeOutQuad(t) {\n    return 1 - (1 - t) * (1 - t);\n  }\n  \n  easeOutBack(t) {\n    const c1 = 1.70158;\n    const c3 = c1 + 1;\n    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);\n  }\n}