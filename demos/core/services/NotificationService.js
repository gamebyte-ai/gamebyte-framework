import { EventEmitter } from 'eventemitter3';

/**
 * Demo Notification Service - showcases mobile-first UI notifications
 * 
 * This service demonstrates:
 * - Mobile-optimized notification system
 * - Toast messages and alerts
 * - Achievement notifications
 * - Service integration with UI components
 */
export class NotificationService extends EventEmitter {
  constructor() {
    super();
    
    // Notification state
    this.notifications = [];
    this.activeToasts = new Map();
    this.achievementQueue = [];
    this.settings = {
      maxToasts: 3,
      defaultDuration: 3000,
      enableVibration: true,
      enableSound: true,
      position: 'top' // top, bottom, center
    };
    
    // UI elements
    this.container = null;
    this.initialized = false;
    
    console.log('✅ NotificationService: Initialized');
  }
  
  /**
   * Initialize the notification UI system
   */
  initialize(parentElement) {
    if (this.initialized) return;
    
    this.container = this.createNotificationContainer(parentElement);
    this.initialized = true;
    
    console.log('🎨 NotificationService: UI initialized');
  }
  
  /**
   * Create notification container element
   */
  createNotificationContainer(parent) {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      pointer-events: none;
      max-width: 90%;
      width: 400px;
    `;
    
    parent.appendChild(container);
    return container;
  }
  
  /**
   * Show a toast notification
   */
  showToast(message, type = 'info', options = {}) {
    const config = {
      duration: options.duration || this.settings.defaultDuration,
      persistent: options.persistent || false,
      action: options.action || null,
      vibrate: options.vibrate !== false && this.settings.enableVibration
    };
    
    // Limit number of simultaneous toasts
    if (this.activeToasts.size >= this.settings.maxToasts) {
      this.dismissOldestToast();
    }
    
    const toast = this.createToast(message, type, config);
    this.showToastElement(toast, config);
    
    // Emit event
    this.emit('toast:shown', {
      message,
      type,
      id: toast.id,
      config
    });
    
    console.log(`📢 NotificationService: Toast shown - ${type}: ${message}`);
    
    return toast.id;
  }
  
  /**
   * Create toast element
   */
  createToast(message, type, config) {
    const id = this.generateId();
    const toast = document.createElement('div');
    
    toast.id = `toast-${id}`;
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${this.getToastBackground(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      pointer-events: auto;
      transform: translateY(-20px);
      opacity: 0;
      transition: all 0.3s ease-out;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    `;
    
    // Add icon
    const icon = this.createToastIcon(type);
    toast.appendChild(icon);
    
    // Add message
    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    messageEl.style.cssText = 'flex: 1; margin-left: 8px;';
    toast.appendChild(messageEl);
    
    // Add action button if provided
    if (config.action) {
      const actionBtn = this.createActionButton(config.action);
      toast.appendChild(actionBtn);
    }
    
    // Add close button
    const closeBtn = this.createCloseButton(() => this.dismissToast(id));
    toast.appendChild(closeBtn);
    
    // Vibration feedback
    if (config.vibrate && 'vibrate' in navigator) {
      navigator.vibrate(this.getVibrationPattern(type));
    }
    
    return { id, element: toast };
  }
  
  /**
   * Get background color for toast type
   */
  getToastBackground(type) {
    const colors = {
      info: 'rgba(52, 152, 219, 0.9)',
      success: 'rgba(46, 204, 113, 0.9)',
      warning: 'rgba(241, 196, 15, 0.9)',
      error: 'rgba(231, 76, 60, 0.9)',
      achievement: 'rgba(155, 89, 182, 0.9)'
    };
    return colors[type] || colors.info;
  }
  
  /**
   * Create toast icon
   */
  createToastIcon(type) {
    const icon = document.createElement('span');
    icon.style.cssText = 'font-size: 16px; flex-shrink: 0;';
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      achievement: '🏆'
    };
    
    icon.textContent = icons[type] || icons.info;
    return icon;
  }
  
  /**
   * Create action button
   */
  createActionButton(action) {
    const button = document.createElement('button');
    button.textContent = action.text;
    button.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      margin-left: 8px;
      transition: background-color 0.2s;
    `;
    
    button.onmouseover = () => {
      button.style.background = 'rgba(255,255,255,0.3)';
    };
    
    button.onmouseout = () => {
      button.style.background = 'rgba(255,255,255,0.2)';
    };
    
    button.onclick = (e) => {
      e.stopPropagation();
      if (action.callback) {
        action.callback();
      }
    };
    
    return button;
  }
  
  /**
   * Create close button
   */
  createCloseButton(callback) {
    const button = document.createElement('button');
    button.innerHTML = '×';
    button.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      margin-left: 8px;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    `;
    
    button.onmouseover = () => {
      button.style.background = 'rgba(255,255,255,0.2)';
    };
    
    button.onmouseout = () => {
      button.style.background = 'none';
    };
    
    button.onclick = (e) => {
      e.stopPropagation();
      callback();
    };
    
    return button;
  }
  
  /**
   * Show toast element with animation
   */
  showToastElement(toast, config) {
    if (!this.container) return;
    
    this.container.appendChild(toast.element);
    this.activeToasts.set(toast.id, toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.element.style.transform = 'translateY(0)';
      toast.element.style.opacity = '1';
    });
    
    // Auto-dismiss if not persistent
    if (!config.persistent) {
      setTimeout(() => {
        this.dismissToast(toast.id);
      }, config.duration);
    }
  }
  
  /**
   * Dismiss a specific toast
   */
  dismissToast(id) {
    const toast = this.activeToasts.get(id);
    if (!toast) return;
    
    // Animate out
    toast.element.style.transform = 'translateY(-20px)';
    toast.element.style.opacity = '0';
    
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.activeToasts.delete(id);
    }, 300);
    
    this.emit('toast:dismissed', { id });
  }
  
  /**
   * Dismiss oldest toast to make room for new ones
   */
  dismissOldestToast() {
    const oldestId = this.activeToasts.keys().next().value;
    if (oldestId) {
      this.dismissToast(oldestId);
    }
  }
  
  /**
   * Show achievement notification with special styling
   */
  showAchievement(achievement) {
    const message = `${achievement.name}: ${achievement.description}`;
    
    const toastId = this.showToast(message, 'achievement', {
      duration: 5000,
      vibrate: true
    });
    
    // Add to achievement queue for replay
    this.achievementQueue.push({
      ...achievement,
      timestamp: Date.now(),
      toastId
    });
    
    this.emit('achievement:shown', achievement);
    
    console.log(`🏆 NotificationService: Achievement shown - ${achievement.name}`);
    
    return toastId;
  }
  
  /**
   * Show error notification
   */
  showError(message, details = null) {
    const config = {
      persistent: true,
      action: details ? {
        text: 'Details',
        callback: () => console.log('Error details:', details)
      } : null
    };
    
    return this.showToast(message, 'error', config);
  }
  
  /**
   * Show success notification
   */
  showSuccess(message) {
    return this.showToast(message, 'success');
  }
  
  /**
   * Show warning notification
   */
  showWarning(message) {
    return this.showToast(message, 'warning');
  }
  
  /**
   * Show info notification
   */
  showInfo(message) {
    return this.showToast(message, 'info');
  }
  
  /**
   * Get vibration pattern for notification type
   */
  getVibrationPattern(type) {
    const patterns = {
      info: [100],
      success: [100, 50, 100],
      warning: [200, 100, 200],
      error: [300, 100, 300, 100, 300],
      achievement: [100, 50, 100, 50, 200]
    };
    return patterns[type] || patterns.info;
  }
  
  /**
   * Clear all notifications
   */
  clearAll() {
    for (const id of this.activeToasts.keys()) {
      this.dismissToast(id);
    }
  }
  
  /**
   * Get active notifications count
   */
  getActiveCount() {
    return this.activeToasts.size;
  }
  
  /**
   * Get achievement history
   */
  getAchievementHistory() {
    return [...this.achievementQueue];
  }
  
  /**
   * Update notification settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.emit('settings:updated', this.settings);
  }
  
  /**
   * Generate unique ID for notifications
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * Service cleanup
   */
  destroy() {
    this.clearAll();
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.removeAllListeners();
    this.initialized = false;
    
    console.log('🧹 NotificationService: Service destroyed and cleaned up');
  }
}