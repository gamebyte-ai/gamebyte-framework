/**
 * Demo UI Service Provider - showcases mobile-first UI service integration
 * 
 * This service provider demonstrates:
 * - UI component service registration
 * - Mobile-optimized UI factory patterns
 * - Touch-first interaction services
 * - Responsive design service integration
 */
export class DemoUIServiceProvider {
  constructor() {
    this.services = [
      'demo.ui.factory',
      'demo.ui.touch',
      'demo.ui.responsive',
      'demo.ui.themes'
    ];
  }
  
  /**
   * Register UI services in the DI container
   */
  register(app) {
    console.log('🎨 DemoUIServiceProvider: Registering UI services...');
    
    // Register UI component factory
    app.singleton('demo.ui.factory', () => {
      return new DemoUIFactory();
    });
    
    // Register touch interaction service
    app.singleton('demo.ui.touch', () => {
      return new DemoTouchService();
    });
    
    // Register responsive design service
    app.singleton('demo.ui.responsive', () => {
      return new DemoResponsiveService();
    });
    
    // Register theme service
    app.singleton('demo.ui.themes', () => {
      return new DemoThemeService();
    });
    
    // Register aliases
    app.getContainer().alias('uiFactory', 'demo.ui.factory');
    app.getContainer().alias('touch', 'demo.ui.touch');
    app.getContainer().alias('responsive', 'demo.ui.responsive');
    app.getContainer().alias('themes', 'demo.ui.themes');
    
    console.log('✅ DemoUIServiceProvider: UI services registered');
  }
  
  /**
   * Bootstrap UI services
   */
  boot(app) {
    console.log('🚀 DemoUIServiceProvider: Booting UI services...');
    
    const uiFactory = app.make('demo.ui.factory');
    const touchService = app.make('demo.ui.touch');
    const responsiveService = app.make('demo.ui.responsive');
    const themeService = app.make('demo.ui.themes');
    const gameStateService = app.make('demo.gamestate');
    
    // Initialize responsive service with canvas
    const canvas = app.getCanvas();
    if (canvas) {
      responsiveService.initialize(canvas);
      touchService.initialize(canvas);
    }
    
    // Set up theme integration with game state
    gameStateService.on('setting:changed', (data) => {
      if (data.key === 'theme') {
        themeService.setTheme(data.newValue);
      }
    });
    
    // Set initial theme
    const currentTheme = gameStateService.getSetting('theme', 'dark');
    themeService.setTheme(currentTheme);
    
    console.log('✅ DemoUIServiceProvider: UI services booted');
  }
  
  provides() {
    return this.services;
  }
}

/**
 * Demo UI Factory - creates mobile-optimized UI components
 */
class DemoUIFactory {
  constructor() {
    this.componentCache = new Map();
  }
  
  /**
   * Create a mobile-optimized button
   */
  createButton(config) {
    const button = {
      id: config.id || this.generateId(),
      text: config.text || 'Button',
      style: config.style || 'primary',
      width: config.width || 200,
      height: config.height || 50,
      x: config.x || 0,
      y: config.y || 0,
      enabled: config.enabled !== false,
      visible: config.visible !== false,
      onClick: config.onClick || (() => {}),
      
      // Mobile-specific properties
      touchTarget: Math.max(config.width || 200, 44), // Minimum 44px touch target
      hapticFeedback: config.hapticFeedback !== false,
      
      render: function(ctx) {
        if (!this.visible) return;
        
        // Draw button background
        ctx.fillStyle = this.getBackgroundColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw button text
        ctx.fillStyle = this.getTextColor();
        ctx.font = `${this.getFontSize()}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          this.text,
          this.x + this.width / 2,
          this.y + this.height / 2
        );
      },
      
      getBackgroundColor: function() {
        if (!this.enabled) return '#666';
        switch (this.style) {
          case 'primary': return '#007AFF';
          case 'secondary': return '#34C759';
          case 'danger': return '#FF3B30';
          default: return '#007AFF';
        }
      },
      
      getTextColor: function() {
        return this.enabled ? '#FFFFFF' : '#999';
      },
      
      getFontSize: function() {
        return Math.max(16, this.height * 0.3);
      },
      
      containsPoint: function(x, y) {
        const margin = (this.touchTarget - this.width) / 2;
        return x >= this.x - margin && 
               x <= this.x + this.width + margin &&
               y >= this.y - margin && 
               y <= this.y + this.height + margin;
      }
    };
    
    return button;
  }
  
  /**
   * Create a mobile-optimized menu
   */
  createMenu(config) {
    const buttons = (config.items || []).map((item, index) => {
      return this.createButton({
        ...item,
        x: config.x || 0,
        y: (config.y || 0) + index * (config.itemHeight || 60),
        width: config.width || 250,
        height: config.itemHeight || 50
      });
    });
    
    return {
      id: config.id || this.generateId(),
      buttons,
      x: config.x || 0,
      y: config.y || 0,
      width: config.width || 250,
      height: buttons.length * (config.itemHeight || 60),
      
      render: function(ctx) {
        // Draw menu background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);
        
        // Render buttons
        this.buttons.forEach(button => button.render(ctx));
      },
      
      handleTouch: function(x, y) {
        for (const button of this.buttons) {
          if (button.containsPoint(x, y) && button.enabled) {
            button.onClick(button);
            return button;
          }
        }
        return null;
      }
    };
  }
  
  generateId() {
    return 'ui_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

/**
 * Demo Touch Service - handles mobile touch interactions
 */
class DemoTouchService {
  constructor() {
    this.canvas = null;
    this.touchHandlers = [];
    this.activeTouches = new Map();
    this.gestureRecognizers = [];
  }
  
  initialize(canvas) {
    this.canvas = canvas;
    this.setupTouchEvents();
    console.log('👆 DemoTouchService: Touch events initialized');
  }
  
  setupTouchEvents() {
    if (!this.canvas) return;
    
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Mouse events for desktop testing
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
  }
  
  handleTouchStart(event) {
    for (const touch of event.changedTouches) {
      const point = this.getTouchPoint(touch);
      this.activeTouches.set(touch.identifier, {
        id: touch.identifier,
        startPoint: point,
        currentPoint: point,
        startTime: Date.now()
      });
      
      this.notifyHandlers('touchstart', point, touch.identifier);
    }
  }
  
  handleTouchMove(event) {
    for (const touch of event.changedTouches) {
      const touchData = this.activeTouches.get(touch.identifier);
      if (touchData) {
        touchData.currentPoint = this.getTouchPoint(touch);
        this.notifyHandlers('touchmove', touchData.currentPoint, touch.identifier);
      }
    }
  }
  
  handleTouchEnd(event) {
    for (const touch of event.changedTouches) {
      const touchData = this.activeTouches.get(touch.identifier);
      if (touchData) {
        const endPoint = this.getTouchPoint(touch);
        const duration = Date.now() - touchData.startTime;
        
        // Check for tap gesture
        if (this.isTap(touchData.startPoint, endPoint, duration)) {
          this.notifyHandlers('tap', endPoint, touch.identifier);
        }
        
        this.notifyHandlers('touchend', endPoint, touch.identifier);
        this.activeTouches.delete(touch.identifier);
      }
    }
  }
  
  handleTouchCancel(event) {
    for (const touch of event.changedTouches) {
      this.activeTouches.delete(touch.identifier);
      this.notifyHandlers('touchcancel', this.getTouchPoint(touch), touch.identifier);
    }
  }
  
  // Mouse event handlers for desktop testing
  handleMouseDown(event) {
    const point = this.getMousePoint(event);
    this.activeTouches.set('mouse', {
      id: 'mouse',
      startPoint: point,
      currentPoint: point,
      startTime: Date.now()
    });
    this.notifyHandlers('touchstart', point, 'mouse');
  }
  
  handleMouseMove(event) {
    const touchData = this.activeTouches.get('mouse');
    if (touchData) {
      touchData.currentPoint = this.getMousePoint(event);
      this.notifyHandlers('touchmove', touchData.currentPoint, 'mouse');
    }
  }
  
  handleMouseUp(event) {
    const touchData = this.activeTouches.get('mouse');
    if (touchData) {
      const endPoint = this.getMousePoint(event);
      const duration = Date.now() - touchData.startTime;
      
      if (this.isTap(touchData.startPoint, endPoint, duration)) {
        this.notifyHandlers('tap', endPoint, 'mouse');
      }
      
      this.notifyHandlers('touchend', endPoint, 'mouse');
      this.activeTouches.delete('mouse');
    }
  }
  
  getTouchPoint(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
  
  getMousePoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  
  isTap(startPoint, endPoint, duration) {
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    return distance < 10 && duration < 500; // 10px tolerance, 500ms max
  }
  
  addTouchHandler(handler) {
    this.touchHandlers.push(handler);
  }
  
  removeTouchHandler(handler) {
    const index = this.touchHandlers.indexOf(handler);
    if (index > -1) {
      this.touchHandlers.splice(index, 1);
    }
  }
  
  notifyHandlers(type, point, touchId) {
    for (const handler of this.touchHandlers) {
      if (handler[type]) {
        handler[type](point, touchId);
      }
    }
  }
}

/**
 * Demo Responsive Service - handles screen size adaptations
 */
class DemoResponsiveService {
  constructor() {
    this.canvas = null;
    this.breakpoints = {
      mobile: 480,
      tablet: 768,
      desktop: 1024
    };
    this.currentBreakpoint = 'mobile';
    this.orientation = 'portrait';
    this.listeners = [];
  }
  
  initialize(canvas) {
    this.canvas = canvas;
    this.updateBreakpoint();
    this.setupResizeHandling();
    console.log('📱 DemoResponsiveService: Responsive design initialized');
  }
  
  setupResizeHandling() {
    window.addEventListener('resize', () => {
      this.updateBreakpoint();
    });
    
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateOrientation();
        this.updateBreakpoint();
      }, 100);
    });
  }
  
  updateBreakpoint() {
    const width = window.innerWidth;
    let newBreakpoint;
    
    if (width < this.breakpoints.mobile) {
      newBreakpoint = 'mobile';
    } else if (width < this.breakpoints.tablet) {
      newBreakpoint = 'tablet';
    } else {
      newBreakpoint = 'desktop';
    }
    
    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      this.notifyListeners('breakpoint', { old: oldBreakpoint, new: newBreakpoint });
    }
    
    this.updateOrientation();
  }
  
  updateOrientation() {
    const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    
    if (newOrientation !== this.orientation) {
      const oldOrientation = this.orientation;
      this.orientation = newOrientation;
      this.notifyListeners('orientation', { old: oldOrientation, new: newOrientation });
    }
  }
  
  getScaleFactor() {
    switch (this.currentBreakpoint) {
      case 'mobile': return 1.0;
      case 'tablet': return 1.2;
      case 'desktop': return 1.5;
      default: return 1.0;
    }
  }
  
  isMobile() {
    return this.currentBreakpoint === 'mobile';
  }
  
  isTablet() {
    return this.currentBreakpoint === 'tablet';
  }
  
  isDesktop() {
    return this.currentBreakpoint === 'desktop';
  }
  
  isPortrait() {
    return this.orientation === 'portrait';
  }
  
  isLandscape() {
    return this.orientation === 'landscape';
  }
  
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  notifyListeners(type, data) {
    for (const listener of this.listeners) {
      if (listener[type]) {
        listener[type](data);
      }
    }
  }
}

/**
 * Demo Theme Service - manages mobile-optimized themes
 */
class DemoThemeService {
  constructor() {
    this.currentTheme = 'dark';
    this.themes = {
      dark: {
        background: '#1a1a1a',
        surface: '#2a2a2a',
        primary: '#007AFF',
        secondary: '#34C759',
        text: '#FFFFFF',
        textSecondary: '#CCCCCC',
        border: '#444444'
      },
      light: {
        background: '#FFFFFF',
        surface: '#F2F2F7',
        primary: '#007AFF',
        secondary: '#34C759',
        text: '#000000',
        textSecondary: '#666666',
        border: '#CCCCCC'
      }
    };
    this.listeners = [];
  }
  
  setTheme(themeName) {
    if (this.themes[themeName] && themeName !== this.currentTheme) {
      const oldTheme = this.currentTheme;
      this.currentTheme = themeName;
      
      this.notifyListeners('themeChanged', {
        old: oldTheme,
        new: themeName,
        colors: this.getColors()
      });
      
      console.log(`🎨 DemoThemeService: Theme changed to ${themeName}`);
    }
  }
  
  getColors() {
    return { ...this.themes[this.currentTheme] };
  }
  
  getColor(colorName) {
    return this.themes[this.currentTheme][colorName] || '#000000';
  }
  
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  notifyListeners(type, data) {
    for (const listener of this.listeners) {
      if (listener[type]) {
        listener[type](data);
      }
    }
  }
}