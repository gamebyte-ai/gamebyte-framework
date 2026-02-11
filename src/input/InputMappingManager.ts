import {
  InputMappingManager,
  InputMapping,
  InputProfile,
  InputContext,
  GameAction,
  RawInputEvent
} from '../contracts/Input';
import { Logger } from '../utils/Logger.js';

/**
 * Input mapping manager for handling input profiles and context switching
 */
export class GameByteInputMappingManager implements InputMappingManager {
  private mappings: Map<InputContext, Map<string, GameAction>> = new Map();
  private profiles: Map<string, InputProfile> = new Map();
  private activeContext: InputContext = 'menu';
  private currentProfile: InputProfile | null = null;

  constructor() {
    this.initializeDefaultMappings();
    this.createBuiltInProfiles();
  }

  /**
   * Add input mapping for a specific context
   */
  addMapping(context: InputContext, input: string, action: GameAction): void {
    if (!this.mappings.has(context)) {
      this.mappings.set(context, new Map());
    }
    
    const contextMappings = this.mappings.get(context)!;
    contextMappings.set(input, action);
  }

  /**
   * Remove input mapping
   */
  removeMapping(context: InputContext, input: string): void {
    const contextMappings = this.mappings.get(context);
    if (contextMappings) {
      contextMappings.delete(input);
    }
  }

  /**
   * Get action mapped to input in current or specified context
   */
  getMapping(context: InputContext, input: string): GameAction | null {
    const contextMappings = this.mappings.get(context);
    return contextMappings?.get(input) || null;
  }

  /**
   * Map a raw input event to a game action based on context
   */
  mapInput(event: RawInputEvent, context: InputContext): GameAction | null {
    // Generate input key from event
    let inputKey: string;
    
    switch (event.device) {
      case 'keyboard':
        inputKey = `key:${event.key}`;
        break;
      case 'mouse':
        inputKey = `mouse:button${event.button}`;
        break;
      case 'gamepad':
        if (event.type === 'gamepad-button-down' || event.type === 'gamepad-button-up') {
          inputKey = `gamepad:${event.gamepadIndex}:button${event.button}`;
        } else if (event.type === 'gamepad-axis') {
          inputKey = `gamepad:${event.gamepadIndex}:axis${event.axisIndex}`;
        } else {
          return null;
        }
        break;
      case 'touch':
        inputKey = `touch:${event.type}`;
        break;
      default:
        return null;
    }
    
    return this.getMapping(context, inputKey);
  }

  /**
   * Create new input profile
   */
  createProfile(id: string, name: string): InputProfile {
    const profile: InputProfile = {
      id,
      name,
      description: `Custom input profile: ${name}`,
      mappings: [],
      virtualControls: [],
      settings: {
        touchSensitivity: 1.0,
        gestureThresholds: {
          tap: 10,
          longPress: 500,
          swipe: 50,
          pinch: 0.2
        },
        deadZones: {
          joystick: 0.1,
          gamepad: 0.15
        },
        hapticEnabled: true,
        inputPrediction: false
      }
    };

    this.profiles.set(id, profile);
    return { ...profile };
  }

  /**
   * Save input profile
   */
  saveProfile(profile: InputProfile): void {
    this.profiles.set(profile.id, { ...profile });
    
    // Save to localStorage for persistence
    try {
      const serializedProfile = JSON.stringify(profile, this.profileReplacer);
      localStorage.setItem(`gamebyte-input-profile-${profile.id}`, serializedProfile);
    } catch (error) {
      Logger.warn('Input', 'Failed to save input profile to localStorage:', error);
    }
  }

  /**
   * Load input profile
   */
  loadProfile(id: string): InputProfile | null {
    // Try to load from memory first
    let profile = this.profiles.get(id);
    
    // If not in memory, try localStorage
    if (!profile) {
      try {
        const serializedProfile = localStorage.getItem(`gamebyte-input-profile-${id}`);
        if (serializedProfile) {
          profile = JSON.parse(serializedProfile, this.profileReviver);
          if (profile) {
            this.profiles.set(id, profile);
          }
        }
      } catch (error) {
        Logger.warn('Input', 'Failed to load input profile from localStorage:', error);
      }
    }
    
    return profile ? { ...profile } : null;
  }

  /**
   * Delete input profile
   */
  deleteProfile(id: string): void {
    this.profiles.delete(id);
    
    try {
      localStorage.removeItem(`gamebyte-input-profile-${id}`);
    } catch (error) {
      Logger.warn('Input', 'Failed to remove input profile from localStorage:', error);
    }
  }

  /**
   * List all available profiles
   */
  listProfiles(): InputProfile[] {
    return Array.from(this.profiles.values()).map(profile => ({ ...profile }));
  }

  /**
   * Set active input context
   */
  setActiveContext(context: InputContext): void {
    this.activeContext = context;
  }

  /**
   * Get active input context
   */
  getActiveContext(): InputContext {
    return this.activeContext;
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): InputProfile | null {
    return this.currentProfile ? { ...this.currentProfile } : null;
  }

  /**
   * Get available profile names
   */
  getAvailableProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * Load saved profile by name (alias for loadProfile for facade compatibility)
   */
  loadSavedProfile(name: string): boolean {
    const profile = this.loadProfile(name);
    if (profile) {
      this.currentProfile = profile;
      return true;
    }
    return false;
  }

  /**
   * Set mapping from InputMapping object
   */
  setMapping(mapping: InputMapping): void {
    for (const [input, action] of mapping.mappings) {
      this.addMapping(mapping.context, input, action);
    }
  }

  /**
   * Get platformer-optimized input profile
   */
  getPlatformerProfile(): InputProfile {
    const profile = this.profiles.get('platformer');
    if (!profile) {
      throw new Error('Platformer profile not found');
    }
    return { ...profile };
  }

  /**
   * Get top-down game input profile
   */
  getTopDownProfile(): InputProfile {
    const profile = this.profiles.get('top-down');
    if (!profile) {
      throw new Error('Top-down profile not found');
    }
    return { ...profile };
  }

  /**
   * Get menu navigation input profile
   */
  getMenuProfile(): InputProfile {
    const profile = this.profiles.get('menu');
    if (!profile) {
      throw new Error('Menu profile not found');
    }
    return { ...profile };
  }

  /**
   * Initialize default input mappings for all contexts
   */
  private initializeDefaultMappings(): void {
    // Menu context mappings
    this.addMapping('menu', 'key:ArrowUp', 'menu-navigate');
    this.addMapping('menu', 'key:ArrowDown', 'menu-navigate');
    this.addMapping('menu', 'key:ArrowLeft', 'menu-navigate');
    this.addMapping('menu', 'key:ArrowRight', 'menu-navigate');
    this.addMapping('menu', 'key:Enter', 'menu-select');
    this.addMapping('menu', 'key:Escape', 'menu-back');
    this.addMapping('menu', 'key: ', 'menu-select');
    this.addMapping('menu', 'touch:down', 'menu-select');

    // Gameplay context mappings
    this.addMapping('gameplay', 'key:ArrowLeft', 'move-left');
    this.addMapping('gameplay', 'key:ArrowRight', 'move-right');
    this.addMapping('gameplay', 'key:ArrowUp', 'move-up');
    this.addMapping('gameplay', 'key:ArrowDown', 'move-down');
    this.addMapping('gameplay', 'key:a', 'move-left');
    this.addMapping('gameplay', 'key:d', 'move-right');
    this.addMapping('gameplay', 'key:w', 'move-up');
    this.addMapping('gameplay', 'key:s', 'move-down');
    this.addMapping('gameplay', 'key: ', 'jump');
    this.addMapping('gameplay', 'key:Shift', 'run');
    this.addMapping('gameplay', 'key:Control', 'crouch');
    this.addMapping('gameplay', 'key:e', 'interact');
    this.addMapping('gameplay', 'key:f', 'attack');
    this.addMapping('gameplay', 'key:Escape', 'pause');

    // Pause context mappings
    this.addMapping('pause', 'key:Escape', 'menu-back');
    this.addMapping('pause', 'key:Enter', 'menu-select');
    this.addMapping('pause', 'key: ', 'menu-select');

    // Settings context mappings
    this.addMapping('settings', 'key:ArrowUp', 'menu-navigate');
    this.addMapping('settings', 'key:ArrowDown', 'menu-navigate');
    this.addMapping('settings', 'key:ArrowLeft', 'menu-navigate');
    this.addMapping('settings', 'key:ArrowRight', 'menu-navigate');
    this.addMapping('settings', 'key:Enter', 'menu-select');
    this.addMapping('settings', 'key:Escape', 'menu-back');

    // Camera controls (for applicable contexts)
    this.addMapping('gameplay', 'mouse:button0', 'camera-pan');
    this.addMapping('gameplay', 'key:q', 'camera-zoom');
    this.addMapping('gameplay', 'key:e', 'camera-zoom');
    this.addMapping('gameplay', 'key:r', 'camera-rotate');

    // Gamepad mappings
    this.addMapping('gameplay', 'gamepad:0:button0', 'jump'); // A button
    this.addMapping('gameplay', 'gamepad:0:button1', 'attack'); // B button
    this.addMapping('gameplay', 'gamepad:0:button2', 'run'); // X button
    this.addMapping('gameplay', 'gamepad:0:button3', 'interact'); // Y button
    
    this.addMapping('menu', 'gamepad:0:button0', 'menu-select');
    this.addMapping('menu', 'gamepad:0:button1', 'menu-back');
  }

  /**
   * Create built-in input profiles
   */
  private createBuiltInProfiles(): void {
    // Platformer profile
    const platformerProfile: InputProfile = {
      id: 'platformer',
      name: 'Platformer',
      description: 'Optimized for 2D platformer games with precise jumping and movement',
      mappings: [
        {
          context: 'gameplay',
          mappings: new Map([
            ['key:ArrowLeft', 'move-left'],
            ['key:ArrowRight', 'move-right'],
            ['key:a', 'move-left'],
            ['key:d', 'move-right'],
            ['key: ', 'jump'],
            ['key:Shift', 'run'],
            ['key:Control', 'crouch'],
            ['touch:down', 'jump'],
            ['gamepad:0:button0', 'jump']
          ]),
          priority: 1,
          enabled: true
        }
      ],
      virtualControls: [
        {
          id: 'movement-stick',
          type: 'joystick',
          position: { x: 50, y: window.innerHeight - 150 },
          size: { width: 100, height: 100 },
          visible: true,
          alpha: 0.7,
          scale: 1.0,
          deadZone: 0.15,
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderColor: 'rgba(255, 255, 255, 0.6)',
            knobColor: 'rgba(255, 255, 255, 0.8)'
          },
          hapticFeedback: true
        },
        {
          id: 'jump-button',
          type: 'button',
          position: { x: window.innerWidth - 100, y: window.innerHeight - 150 },
          size: { width: 80, height: 80 },
          action: 'jump',
          visible: true,
          alpha: 0.7,
          scale: 1.0,
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderColor: 'rgba(255, 255, 255, 0.6)',
            activeColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 40
          },
          hapticFeedback: true
        }
      ],
      settings: {
        touchSensitivity: 1.2,
        gestureThresholds: {
          tap: 8,
          longPress: 400,
          swipe: 40,
          pinch: 0.2
        },
        deadZones: {
          joystick: 0.15,
          gamepad: 0.1
        },
        hapticEnabled: true,
        inputPrediction: true
      }
    };

    // Top-down profile
    const topDownProfile: InputProfile = {
      id: 'top-down',
      name: 'Top-Down',
      description: 'Optimized for top-down games with 8-directional movement',
      mappings: [
        {
          context: 'gameplay',
          mappings: new Map([
            ['key:ArrowLeft', 'move-left'],
            ['key:ArrowRight', 'move-right'],
            ['key:ArrowUp', 'move-up'],
            ['key:ArrowDown', 'move-down'],
            ['key:a', 'move-left'],
            ['key:d', 'move-right'],
            ['key:w', 'move-up'],
            ['key:s', 'move-down'],
            ['key: ', 'attack'],
            ['key:Shift', 'run'],
            ['key:e', 'interact'],
            ['mouse:button0', 'attack'],
            ['gamepad:0:button0', 'attack']
          ]),
          priority: 1,
          enabled: true
        }
      ],
      virtualControls: [
        {
          id: 'movement-stick',
          type: 'joystick',
          position: { x: 50, y: window.innerHeight - 150 },
          size: { width: 120, height: 120 },
          visible: true,
          alpha: 0.7,
          scale: 1.0,
          deadZone: 0.1,
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderColor: 'rgba(255, 255, 255, 0.6)',
            knobColor: 'rgba(255, 255, 255, 0.8)'
          },
          hapticFeedback: true
        },
        {
          id: 'attack-button',
          type: 'button',
          position: { x: window.innerWidth - 100, y: window.innerHeight - 150 },
          size: { width: 80, height: 80 },
          action: 'attack',
          visible: true,
          alpha: 0.7,
          scale: 1.0,
          style: {
            backgroundColor: 'rgba(255, 100, 100, 0.3)',
            borderColor: 'rgba(255, 100, 100, 0.6)',
            activeColor: 'rgba(255, 100, 100, 0.8)',
            borderRadius: 40
          },
          hapticFeedback: true
        },
        {
          id: 'interact-button',
          type: 'button',
          position: { x: window.innerWidth - 200, y: window.innerHeight - 150 },
          size: { width: 60, height: 60 },
          action: 'interact',
          visible: true,
          alpha: 0.7,
          scale: 1.0,
          style: {
            backgroundColor: 'rgba(100, 255, 100, 0.3)',
            borderColor: 'rgba(100, 255, 100, 0.6)',
            activeColor: 'rgba(100, 255, 100, 0.8)',
            borderRadius: 30
          },
          hapticFeedback: true
        }
      ],
      settings: {
        touchSensitivity: 1.0,
        gestureThresholds: {
          tap: 10,
          longPress: 500,
          swipe: 50,
          pinch: 0.2
        },
        deadZones: {
          joystick: 0.1,
          gamepad: 0.15
        },
        hapticEnabled: true,
        inputPrediction: false
      }
    };

    // Menu profile
    const menuProfile: InputProfile = {
      id: 'menu',
      name: 'Menu Navigation',
      description: 'Optimized for menu navigation and UI interaction',
      mappings: [
        {
          context: 'menu',
          mappings: new Map([
            ['key:ArrowUp', 'menu-navigate'],
            ['key:ArrowDown', 'menu-navigate'],
            ['key:ArrowLeft', 'menu-navigate'],
            ['key:ArrowRight', 'menu-navigate'],
            ['key:Enter', 'menu-select'],
            ['key: ', 'menu-select'],
            ['key:Escape', 'menu-back'],
            ['touch:down', 'menu-select'],
            ['gamepad:0:button0', 'menu-select'],
            ['gamepad:0:button1', 'menu-back']
          ]),
          priority: 1,
          enabled: true
        }
      ],
      virtualControls: [],
      settings: {
        touchSensitivity: 1.0,
        gestureThresholds: {
          tap: 15,
          longPress: 600,
          swipe: 60,
          pinch: 0.3
        },
        deadZones: {
          joystick: 0.2,
          gamepad: 0.2
        },
        hapticEnabled: false,
        inputPrediction: false
      }
    };

    this.profiles.set('platformer', platformerProfile);
    this.profiles.set('top-down', topDownProfile);
    this.profiles.set('menu', menuProfile);
  }

  /**
   * JSON serialization replacer for Map objects
   */
  private profileReplacer(key: string, value: any): any {
    if (value instanceof Map) {
      return {
        __type: 'Map',
        entries: Array.from(value.entries())
      };
    }
    return value;
  }

  /**
   * JSON deserialization reviver for Map objects
   */
  private profileReviver(key: string, value: any): any {
    if (typeof value === 'object' && value !== null && value.__type === 'Map') {
      return new Map(value.entries);
    }
    return value;
  }
}