import { EventEmitter } from 'eventemitter3';

/**
 * Demo Splash Scene - showcases framework initialization and branding
 * 
 * This scene demonstrates:
 * - Scene lifecycle management (initialize -> activate -> deactivate -> destroy)
 * - Mobile-first animations and transitions
 * - Framework branding and loading states
 * - Automatic scene progression
 */
export class DemoSplashScene extends EventEmitter {
  constructor() {
    super();
    
    // Scene identification
    this.id = 'splash';
    this.name = 'Splash Screen';
    
    // Scene state
    this.isActive = false;
    this.initialized = false;
    
    // Animation properties
    this.animationProgress = 0;
    this.animationDuration = 3000; // 3 seconds
    this.startTime = null;
    
    // Visual elements
    this.logoScale = 0;
    this.logoAlpha = 0;
    this.titleAlpha = 0;
    this.loadingProgress = 0;
    this.loadingText = 'Loading GameByte Framework...';
    
    // Colors (mobile-optimized high contrast)
    this.backgroundColor = '#1a1a1a';
    this.primaryColor = '#007AFF';
    this.textColor = '#FFFFFF';
    this.secondaryColor = '#8E8E93';
    
    console.log('🎬 DemoSplashScene: Created');
  }
  
  /**
   * Initialize the scene - prepare resources and setup
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 DemoSplashScene: Initializing...');
    
    // Simulate resource loading
    await this.simulateResourceLoading();
    
    this.initialized = true;
    this.emit('initialized');
    
    console.log('✅ DemoSplashScene: Initialized successfully');
  }
  
  /**
   * Simulate resource loading with progress updates
   */
  async simulateResourceLoading() {
    const loadingSteps = [
      { text: 'Loading framework core...', duration: 300 },
      { text: 'Initializing services...', duration: 400 },
      { text: 'Setting up dependency injection...', duration: 350 },
      { text: 'Registering service providers...', duration: 250 },
      { text: 'Booting services...', duration: 300 },
      { text: 'Preparing UI components...', duration: 200 },
      { text: 'Ready to play!', duration: 200 }
    ];
    
    for (let i = 0; i < loadingSteps.length; i++) {
      const step = loadingSteps[i];
      this.loadingText = step.text;
      this.loadingProgress = (i + 1) / loadingSteps.length;
      
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }
  }
  
  /**
   * Activate the scene - start animations and logic
   */
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.startTime = Date.now();
    
    // Start splash animation sequence
    this.startSplashAnimation();
    
    this.emit('activated');
    console.log('▶️ DemoSplashScene: Activated');
  }
  
  /**
   * Start the splash screen animation sequence
   */
  startSplashAnimation() {
    // Auto-progress to main menu after animation completes
    setTimeout(() => {
      if (this.isActive) {
        this.emit('complete');
      }
    }, this.animationDuration);
  }
  
  /**
   * Deactivate the scene
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.emit('deactivated');
    
    console.log('⏸️ DemoSplashScene: Deactivated');
  }
  
  /**
   * Update scene logic
   */
  update(deltaTime) {
    if (!this.isActive || !this.startTime) return;
    
    const elapsed = Date.now() - this.startTime;
    this.animationProgress = Math.min(elapsed / this.animationDuration, 1);
    
    // Update animation properties with easing
    this.updateAnimationProperties();
    
    this.emit('updated', deltaTime);
  }
  
  /**
   * Update animation properties with smooth easing
   */
  updateAnimationProperties() {
    const progress = this.animationProgress;
    
    // Logo animation: scale and fade in
    if (progress <= 0.3) {
      // Logo appears in first 30% of animation
      const logoProgress = progress / 0.3;
      this.logoScale = this.easeOutBack(logoProgress);
      this.logoAlpha = this.easeOutQuad(logoProgress);
    } else {
      this.logoScale = 1;
      this.logoAlpha = 1;
    }
    
    // Title animation: fade in after logo
    if (progress >= 0.4 && progress <= 0.7) {
      // Title appears between 40%-70% of animation
      const titleProgress = (progress - 0.4) / 0.3;
      this.titleAlpha = this.easeOutQuad(titleProgress);
    } else if (progress > 0.7) {
      this.titleAlpha = 1;
    }
    
    // Loading bar animation: smooth progress
    if (progress >= 0.6) {
      const loadingProgress = (progress - 0.6) / 0.4;
      this.loadingBarProgress = this.easeOutQuad(loadingProgress);
    }
  }
  
  /**
   * Render the splash scene
   */
  render(renderer) {
    if (!this.isActive) return;
    
    const ctx = renderer.getContext ? renderer.getContext('2d') : renderer;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with background color
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate responsive sizing
    const scale = Math.min(width / 800, height / 600);
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Render logo
    this.renderLogo(ctx, centerX, centerY - 60 * scale, scale);
    
    // Render title
    this.renderTitle(ctx, centerX, centerY + 40 * scale, scale);
    
    // Render loading indicator
    this.renderLoadingIndicator(ctx, centerX, centerY + 120 * scale, scale);
    
    // Render framework info
    this.renderFrameworkInfo(ctx, width, height, scale);
    
    this.emit('rendered', renderer);
  }
  
  /**
   * Render the GameByte logo
   */
  renderLogo(ctx, x, y, scale) {
    if (this.logoAlpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.logoAlpha;
    ctx.translate(x, y);
    ctx.scale(this.logoScale * scale, this.logoScale * scale);
    
    // Draw stylized GameByte logo (simplified geometric design)
    const size = 80;
    
    // Outer ring
    ctx.strokeStyle = this.primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner diamond
    ctx.fillStyle = this.primaryColor;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size * 0.6);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    
    // Center dot
    ctx.fillStyle = this.backgroundColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Render the framework title
   */
  renderTitle(ctx, x, y, scale) {
    if (this.titleAlpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.titleAlpha;
    
    // Main title
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.round(36 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GameByte Framework', x, y);
    
    // Subtitle
    ctx.fillStyle = this.secondaryColor;
    ctx.font = `${Math.round(16 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillText('Mobile-First Game Development', x, y + 30 * scale);
    
    ctx.restore();
  }
  
  /**
   * Render loading indicator
   */
  renderLoadingIndicator(ctx, x, y, scale) {
    const barWidth = 200 * scale;
    const barHeight = 4 * scale;
    const progress = this.loadingProgress;
    
    // Background bar
    ctx.fillStyle = this.secondaryColor + '40'; // 25% opacity
    ctx.fillRect(x - barWidth/2, y - barHeight/2, barWidth, barHeight);
    
    // Progress bar
    if (progress > 0) {
      ctx.fillStyle = this.primaryColor;
      ctx.fillRect(x - barWidth/2, y - barHeight/2, barWidth * progress, barHeight);
    }
    
    // Loading text
    ctx.fillStyle = this.secondaryColor;
    ctx.font = `${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.loadingText, x, y + 25 * scale);
    
    // Progress percentage
    const percentage = Math.round(progress * 100);
    ctx.fillText(`${percentage}%`, x, y + 45 * scale);
  }
  
  /**
   * Render framework information
   */
  renderFrameworkInfo(ctx, width, height, scale) {
    // Version info in bottom left
    ctx.fillStyle = this.secondaryColor;
    ctx.font = `${Math.round(12 * scale)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v1.0.0 Demo', 20 * scale, height - 20 * scale);
    
    // Architecture info in bottom right
    ctx.textAlign = 'right';
    const features = [\n      'DI/IoC Container',\n      'Service Providers',\n      'Facade Pattern',\n      'Scene Management'\n    ];\n    \n    features.forEach((feature, index) => {\n      ctx.fillText(\n        feature,\n        width - 20 * scale,\n        height - (20 + index * 15) * scale\n      );\n    });\n  }\n  \n  /**\n   * Handle touch/click events\n   */\n  handleTouch(x, y) {\n    // Allow skipping splash screen with tap\n    if (this.isActive && this.animationProgress > 0.5) {\n      this.emit('complete');\n      return true;\n    }\n    return false;\n  }\n  \n  /**\n   * Clean up scene resources\n   */\n  destroy() {\n    this.deactivate();\n    this.removeAllListeners();\n    \n    this.initialized = false;\n    this.startTime = null;\n    \n    console.log('🧹 DemoSplashScene: Destroyed');\n  }\n  \n  // Easing functions for smooth animations\n  \n  easeOutQuad(t) {\n    return 1 - (1 - t) * (1 - t);\n  }\n  \n  easeOutBack(t) {\n    const c1 = 1.70158;\n    const c3 = c1 + 1;\n    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);\n  }\n  \n  easeOutBounce(t) {\n    const n1 = 7.5625;\n    const d1 = 2.75;\n    \n    if (t < 1 / d1) {\n      return n1 * t * t;\n    } else if (t < 2 / d1) {\n      return n1 * (t -= 1.5 / d1) * t + 0.75;\n    } else if (t < 2.5 / d1) {\n      return n1 * (t -= 2.25 / d1) * t + 0.9375;\n    } else {\n      return n1 * (t -= 2.625 / d1) * t + 0.984375;\n    }\n  }\n}