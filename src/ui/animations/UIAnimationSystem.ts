import { EventEmitter } from 'eventemitter3';
import { 
  UIAnimationSystem, 
  UITimeline, 
  AnimationConfig, 
  SpringConfig, 
  EasingFunction 
} from '../../contracts/UI';

/**
 * Represents an active tween animation
 */
interface Tween {
  id: string;
  target: any;
  startValues: Record<string, any>;
  endValues: Record<string, any>;
  config: AnimationConfig;
  startTime: number;
  duration: number;
  progress: number;
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Represents an active spring animation
 */
interface Spring {
  id: string;
  target: any;
  properties: Record<string, {
    current: number;
    target: number;
    velocity: number;
    config: SpringConfig;
  }>;
  resolve: () => void;
  onUpdate?: (progress: number) => void;
}

/**
 * High-performance animation system with spring physics and mobile optimization
 */
export class GameByteUIAnimationSystem extends EventEmitter implements UIAnimationSystem {
  // Active animations
  private tweens: Map<string, Tween> = new Map();
  private springs: Map<string, Spring> = new Map();
  private timelines: Set<GameByteUITimeline> = new Set();
  
  // Performance settings
  private targetFPS: number = 60;
  private frameTime: number = 1000 / 60;
  private lastUpdateTime: number = 0;
  private animationFrameId: number | null = null;
  
  // State
  private paused: boolean = false;
  private globalTimeScale: number = 1;

  constructor() {
    super();
    this.startUpdateLoop();
  }

  /**
   * Animate properties to target values
   */
  public async to(target: any, properties: any, config: AnimationConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const tweenId = this.generateId();
      const startValues: Record<string, any> = {};
      
      // Capture start values
      for (const key in properties) {
        startValues[key] = this.getNestedProperty(target, key);
      }

      const tween: Tween = {
        id: tweenId,
        target,
        startValues,
        endValues: properties,
        config,
        startTime: Date.now() + (config.delay || 0),
        duration: config.duration,
        progress: 0,
        resolve,
        reject
      };

      this.tweens.set(tweenId, tween);
      this.emit('tween-started', tween);
    });
  }

  /**
   * Animate properties from initial values
   */
  public async from(target: any, properties: any, config: AnimationConfig): Promise<void> {
    const currentValues: Record<string, any> = {};
    
    // Capture current values as end values
    for (const key in properties) {
      currentValues[key] = this.getNestedProperty(target, key);
    }
    
    // Set initial values
    for (const key in properties) {
      this.setNestedProperty(target, key, properties[key]);
    }
    
    // Animate to current values
    return this.to(target, currentValues, config);
  }

  /**
   * Set properties immediately (no animation)
   */
  public set(target: any, properties: any): void {
    for (const key in properties) {
      this.setNestedProperty(target, key, properties[key]);
    }
  }

  /**
   * Create a new timeline
   */
  public createTimeline(): UITimeline {
    const timeline = new GameByteUITimeline(this);
    this.timelines.add(timeline);
    return timeline;
  }

  /**
   * Spring animation with physics
   */
  public async spring(target: any, properties: any, springConfig: SpringConfig): Promise<void> {
    return new Promise((resolve) => {
      const springId = this.generateId();
      const springProperties: Record<string, any> = {};

      // Setup spring properties
      for (const key in properties) {
        const currentValue = this.getNestedProperty(target, key);
        const targetValue = properties[key];
        
        springProperties[key] = {
          current: currentValue,
          target: targetValue,
          velocity: springConfig.velocity || 0,
          config: { ...springConfig }
        };
      }

      const spring: Spring = {
        id: springId,
        target,
        properties: springProperties,
        resolve,
        onUpdate: springConfig.onUpdate
      };

      this.springs.set(springId, spring);
      this.emit('spring-started', spring);
    });
  }

  /**
   * Kill all animations for a target
   */
  public killTweensOf(target: any): void {
    // Kill tweens
    for (const [id, tween] of this.tweens) {
      if (tween.target === target) {
        tween.reject(new Error('Animation killed'));
        this.tweens.delete(id);
      }
    }

    // Kill springs
    for (const [id, spring] of this.springs) {
      if (spring.target === target) {
        this.springs.delete(id);
      }
    }

    this.emit('tweens-killed', target);
  }

  /**
   * Pause all animations
   */
  public pauseAll(): void {
    this.paused = true;
    this.emit('paused');
  }

  /**
   * Resume all animations
   */
  public resumeAll(): void {
    this.paused = false;
    this.emit('resumed');
  }

  /**
   * Set global time scale
   */
  public setTimeScale(scale: number): void {
    this.globalTimeScale = Math.max(0, scale);
  }

  /**
   * Update animation system
   */
  public update(deltaTime: number): void {
    if (this.paused) return;

    const scaledDeltaTime = deltaTime * this.globalTimeScale;
    const currentTime = Date.now();

    // Update tweens
    this.updateTweens(currentTime, scaledDeltaTime);
    
    // Update springs
    this.updateSprings(scaledDeltaTime);
    
    // Update timelines
    for (const timeline of this.timelines) {
      (timeline as GameByteUITimeline).update(scaledDeltaTime);
    }

    this.lastUpdateTime = currentTime;
  }

  /**
   * Destroy animation system
   */
  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Cleanup all animations
    for (const tween of this.tweens.values()) {
      tween.reject(new Error('Animation system destroyed'));
    }
    
    this.tweens.clear();
    this.springs.clear();
    this.timelines.clear();
    this.removeAllListeners();
  }

  /**
   * Update tween animations
   */
  private updateTweens(currentTime: number, deltaTime: number): void {
    for (const [id, tween] of this.tweens) {
      if (currentTime < tween.startTime) continue;

      const elapsed = currentTime - tween.startTime;
      const progress = Math.min(elapsed / tween.duration, 1);
      const easedProgress = this.applyEasing(progress, tween.config.easing);

      // Update properties
      for (const key in tween.endValues) {
        const startValue = tween.startValues[key];
        const endValue = tween.endValues[key];
        const currentValue = this.interpolateValue(startValue, endValue, easedProgress);
        
        this.setNestedProperty(tween.target, key, currentValue);
      }

      // Update progress
      tween.progress = progress;

      // Call update callback
      if (tween.config.onUpdate) {
        tween.config.onUpdate(easedProgress);
      }

      // Check completion
      if (progress >= 1) {
        this.completeTween(id, tween);
      }
    }
  }

  /**
   * Update spring animations
   */
  private updateSprings(deltaTime: number): void {
    const dt = Math.min(deltaTime / 1000, 1/30); // Cap at 30fps minimum

    for (const [id, spring] of this.springs) {
      let allComplete = true;
      let maxProgress = 0;

      for (const key in spring.properties) {
        const prop = spring.properties[key];
        const config = prop.config;
        
        // Spring physics constants
        const tension = config.tension || 170;
        const friction = config.friction || 26;
        const mass = config.mass || 1;
        const precision = config.precision || 0.01;

        // Calculate spring forces
        const displacement = prop.current - prop.target;
        const springForce = -tension * displacement;
        const dampingForce = -friction * prop.velocity;
        const acceleration = (springForce + dampingForce) / mass;

        // Update velocity and position
        prop.velocity += acceleration * dt;
        prop.current += prop.velocity * dt;

        // Set the property
        this.setNestedProperty(spring.target, key, prop.current);

        // Check if spring has settled
        const settled = Math.abs(displacement) < precision && Math.abs(prop.velocity) < precision;
        if (!settled) {
          allComplete = false;
        }

        // Calculate progress (approximate)
        const progress = 1 - Math.abs(displacement) / Math.abs(prop.current - prop.target + displacement);
        maxProgress = Math.max(maxProgress, progress);
      }

      // Call update callback
      if (spring.onUpdate) {
        spring.onUpdate(maxProgress);
      }

      // Complete spring if all properties settled
      if (allComplete) {
        // Snap to target values
        for (const key in spring.properties) {
          const prop = spring.properties[key];
          this.setNestedProperty(spring.target, key, prop.target);
        }

        spring.resolve();
        this.springs.delete(id);
        this.emit('spring-completed', spring);
      }
    }
  }

  /**
   * Complete a tween animation
   */
  private completeTween(id: string, tween: Tween): void {
    // Set final values
    for (const key in tween.endValues) {
      this.setNestedProperty(tween.target, key, tween.endValues[key]);
    }

    // Handle repeat
    if (tween.config.repeat) {
      if (tween.config.repeat === 'infinite' || tween.config.repeat > 1) {
        // Reset tween
        tween.startTime = Date.now();
        tween.progress = 0;
        
        if (tween.config.yoyo) {
          // Swap start and end values
          const temp = tween.startValues;
          tween.startValues = tween.endValues;
          tween.endValues = temp;
        }

        if (tween.config.repeat !== 'infinite') {
          tween.config.repeat--;
        }
        
        return; // Don't complete yet
      }
    }

    // Complete animation
    if (tween.config.onComplete) {
      tween.config.onComplete();
    }

    tween.resolve();
    this.tweens.delete(id);
    this.emit('tween-completed', tween);
  }

  /**
   * Apply easing function
   */
  private applyEasing(progress: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return progress;
      
      case 'ease-in':
        return progress * progress;
      
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      case 'spring':
        // Simplified spring easing
        return 1 - Math.pow(1 - progress, 3) * Math.cos(progress * Math.PI * 4);
      
      case 'bounce':
        if (progress < 1 / 2.75) {
          return 7.5625 * progress * progress;
        } else if (progress < 2 / 2.75) {
          return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
        } else if (progress < 2.5 / 2.75) {
          return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
        } else {
          return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
        }
      
      default:
        return progress;
    }
  }

  /**
   * Interpolate between two values
   */
  private interpolateValue(start: any, end: any, progress: number): any {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * progress;
    }
    
    if (typeof start === 'object' && typeof end === 'object') {
      const result: any = {};
      for (const key in end) {
        if (key in start) {
          result[key] = this.interpolateValue(start[key], end[key], progress);
        } else {
          result[key] = end[key];
        }
      }
      return result;
    }
    
    // For non-interpolatable values, use threshold
    return progress > 0.5 ? end : start;
  }

  /**
   * Get nested property value
   */
  private getNestedProperty(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Set nested property value
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Generate unique animation ID
   */
  private generateId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    const update = (currentTime: number) => {
      const deltaTime = currentTime - this.lastUpdateTime;
      
      if (deltaTime >= this.frameTime) {
        this.update(deltaTime);
      }
      
      this.animationFrameId = requestAnimationFrame(update);
    };
    
    this.animationFrameId = requestAnimationFrame(update);
  }
}

/**
 * Timeline for sequencing animations
 */
export class GameByteUITimeline extends EventEmitter implements UITimeline {
  private animationSystem: GameByteUIAnimationSystem;
  private actions: Array<{
    type: 'to' | 'from' | 'set' | 'delay' | 'call';
    target?: any;
    properties?: any;
    config?: AnimationConfig;
    duration?: number;
    callback?: () => void;
  }> = [];
  
  private currentIndex: number = 0;
  private playing: boolean = false;
  private paused: boolean = false;
  private reversed: boolean = false;

  constructor(animationSystem: GameByteUIAnimationSystem) {
    super();
    this.animationSystem = animationSystem;
  }

  /**
   * Add a 'to' animation to the timeline
   */
  public to(target: any, properties: any, config: AnimationConfig): UITimeline {
    this.actions.push({ type: 'to', target, properties, config });
    return this;
  }

  /**
   * Add a 'from' animation to the timeline
   */
  public from(target: any, properties: any, config: AnimationConfig): UITimeline {
    this.actions.push({ type: 'from', target, properties, config });
    return this;
  }

  /**
   * Add a 'set' action to the timeline
   */
  public set(target: any, properties: any): UITimeline {
    this.actions.push({ type: 'set', target, properties });
    return this;
  }

  /**
   * Add a delay to the timeline
   */
  public delay(duration: number): UITimeline {
    this.actions.push({ type: 'delay', duration });
    return this;
  }

  /**
   * Add a callback to the timeline
   */
  public call(callback: () => void): UITimeline {
    this.actions.push({ type: 'call', callback });
    return this;
  }

  /**
   * Play the timeline
   */
  public async play(): Promise<void> {
    if (this.playing) return;
    
    this.playing = true;
    this.paused = false;
    this.currentIndex = this.reversed ? this.actions.length - 1 : 0;
    
    try {
      await this.executeActions();
      this.emit('complete');
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.playing = false;
    }
  }

  /**
   * Pause the timeline
   */
  public pause(): void {
    this.paused = true;
    this.emit('paused');
  }

  /**
   * Resume the timeline
   */
  public resume(): void {
    this.paused = false;
    this.emit('resumed');
  }

  /**
   * Reverse the timeline direction
   */
  public reverse(): void {
    this.reversed = !this.reversed;
    this.emit('reversed');
  }

  /**
   * Restart the timeline
   */
  public restart(): void {
    this.currentIndex = this.reversed ? this.actions.length - 1 : 0;
    this.play();
  }

  /**
   * Clear all actions
   */
  public clear(): void {
    this.actions = [];
    this.currentIndex = 0;
    this.playing = false;
    this.paused = false;
  }

  /**
   * Update timeline (called by animation system)
   */
  public update(deltaTime: number): void {
    // Timeline updates are handled in executeActions
  }

  /**
   * Execute timeline actions
   */
  private async executeActions(): Promise<void> {
    while (this.hasMoreActions() && this.playing) {
      if (this.paused) {
        await new Promise(resolve => {
          const resumeHandler = () => {
            this.off('resumed', resumeHandler);
            resolve(undefined);
          };
          this.on('resumed', resumeHandler);
        });
      }

      const action = this.getCurrentAction();
      await this.executeAction(action);
      this.advanceIndex();
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: any): Promise<void> {
    switch (action.type) {
      case 'to':
        await this.animationSystem.to(action.target, action.properties, action.config);
        break;
      
      case 'from':
        await this.animationSystem.from(action.target, action.properties, action.config);
        break;
      
      case 'set':
        this.animationSystem.set(action.target, action.properties);
        break;
      
      case 'delay':
        await new Promise(resolve => setTimeout(resolve, action.duration));
        break;
      
      case 'call':
        if (action.callback) {
          action.callback();
        }
        break;
    }
  }

  /**
   * Check if there are more actions to execute
   */
  private hasMoreActions(): boolean {
    if (this.reversed) {
      return this.currentIndex >= 0;
    } else {
      return this.currentIndex < this.actions.length;
    }
  }

  /**
   * Get the current action
   */
  private getCurrentAction(): any {
    return this.actions[this.currentIndex];
  }

  /**
   * Advance to the next action
   */
  private advanceIndex(): void {
    if (this.reversed) {
      this.currentIndex--;
    } else {
      this.currentIndex++;
    }
  }
}