import EventEmitter from 'eventemitter3';

/**
 * State definition for a finite state machine.
 * @template T - The entity type this state operates on
 */
export interface StateDefinition<T> {
  /**
   * Called when entering this state
   * @param entity - The entity instance
   */
  onEnter?: (entity: T) => void;

  /**
   * Called every frame while in this state
   * @param entity - The entity instance
   * @param deltaTime - Time since last frame in seconds
   */
  onUpdate?: (entity: T, deltaTime: number) => void;

  /**
   * Called when exiting this state
   * @param entity - The entity instance
   */
  onExit?: (entity: T) => void;

  /**
   * Map of trigger events to target state names
   * @example { 'spot-player': 'chase', 'lost-player': 'idle' }
   */
  transitions: Record<string, string>;
}

/**
 * Configuration for creating a StateMachine
 * @template T - The entity type this machine operates on
 */
export interface StateMachineConfig<T> {
  /**
   * The initial state name
   */
  initial: string;

  /**
   * Map of state names to their definitions
   */
  states: Record<string, StateDefinition<T>>;
}

/**
 * Events emitted by StateMachineInstance
 */
export interface StateMachineEvents<T> {
  'state-enter': (stateName: string, entity: T) => void;
  'state-exit': (stateName: string, entity: T) => void;
  'transition': (from: string, to: string, trigger: string, entity: T) => void;
}

/**
 * Per-entity instance of a state machine.
 * Manages state transitions, lifecycle callbacks, and history tracking.
 * @template T - The entity type this instance operates on
 */
export class StateMachineInstance<T> extends EventEmitter<StateMachineEvents<T>> {
  private entity: T;
  private config: StateMachineConfig<T>;
  private currentState: string;
  private stateHistory: string[] = [];
  private readonly maxHistorySize = 10;

  /**
   * Creates a new state machine instance for an entity
   * @param entity - The entity this state machine controls
   * @param config - The state machine configuration
   */
  constructor(entity: T, config: StateMachineConfig<T>) {
    super();
    this.entity = entity;
    this.config = config;
    this.currentState = config.initial;

    // Validate initial state exists
    if (!this.config.states[this.currentState]) {
      throw new Error(`Initial state '${this.currentState}' not found in state definitions`);
    }

    // Enter initial state
    this.enterState(this.currentState);
  }

  /**
   * Updates the current state (calls onUpdate if defined)
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    const state = this.config.states[this.currentState];
    if (state?.onUpdate) {
      state.onUpdate(this.entity, deltaTime);
    }
  }

  /**
   * Attempts to trigger a state transition
   * @param event - The trigger event name
   * @returns true if transition occurred, false otherwise
   */
  public trigger(event: string): boolean {
    const state = this.config.states[this.currentState];
    if (!state) {
      console.warn(`Current state '${this.currentState}' not found`);
      return false;
    }

    const nextState = state.transitions[event];
    if (!nextState) {
      // No transition defined for this event in current state
      return false;
    }

    if (!this.config.states[nextState]) {
      console.error(`Target state '${nextState}' not found in state definitions`);
      return false;
    }

    this.transitionTo(nextState, event);
    return true;
  }

  /**
   * Gets the current state name
   * @returns The current state name
   */
  public getCurrentState(): string {
    return this.currentState;
  }

  /**
   * Gets the state history (most recent first)
   * @returns Array of recent state names
   */
  public getStateHistory(): string[] {
    return [...this.stateHistory];
  }

  /**
   * Checks if a trigger event can cause a transition from current state
   * @param event - The trigger event name
   * @returns true if transition is possible
   */
  public canTrigger(event: string): boolean {
    const state = this.config.states[this.currentState];
    if (!state) {
      return false;
    }

    const nextState = state.transitions[event];
    return !!nextState && !!this.config.states[nextState];
  }

  /**
   * Forces transition to a state without using triggers (bypasses transition rules)
   * Use with caution - prefer trigger() for normal state changes
   * @param stateName - The state to force transition to
   */
  public forceState(stateName: string): void {
    if (!this.config.states[stateName]) {
      console.error(`Cannot force state '${stateName}' - state not found`);
      return;
    }

    this.transitionTo(stateName, '__forced__');
  }

  /**
   * Performs state transition with lifecycle callbacks
   * @param nextState - The state to transition to
   * @param trigger - The event that caused the transition
   */
  private transitionTo(nextState: string, trigger: string): void {
    const previousState = this.currentState;

    // Exit current state
    this.exitState(previousState);

    // Update state
    this.currentState = nextState;

    // Track history
    this.addToHistory(nextState);

    // Enter new state
    this.enterState(nextState);

    // Emit transition event
    this.emit('transition', previousState, nextState, trigger, this.entity);
  }

  /**
   * Calls onEnter callback and emits state-enter event
   * @param stateName - The state being entered
   */
  private enterState(stateName: string): void {
    const state = this.config.states[stateName];
    if (state?.onEnter) {
      state.onEnter(this.entity);
    }
    this.emit('state-enter', stateName, this.entity);
  }

  /**
   * Calls onExit callback and emits state-exit event
   * @param stateName - The state being exited
   */
  private exitState(stateName: string): void {
    const state = this.config.states[stateName];
    if (state?.onExit) {
      state.onExit(this.entity);
    }
    this.emit('state-exit', stateName, this.entity);
  }

  /**
   * Adds state to history with maximum size limit
   * @param stateName - The state to add to history
   */
  private addToHistory(stateName: string): void {
    this.stateHistory.unshift(stateName);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.pop();
    }
  }

  /**
   * Gets the entity this state machine controls
   * @returns The entity instance
   */
  public getEntity(): T {
    return this.entity;
  }

  /**
   * Destroys the state machine instance and removes all listeners
   */
  public destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Finite State Machine template/definition.
 * Use this to define state behavior, then create instances per entity.
 *
 * @template T - The entity type this machine operates on
 *
 * @example
 * ```typescript
 * interface Enemy {
 *   playAnim(name: string): void;
 *   moveToward(target: any, dt: number): void;
 *   attack(): void;
 * }
 *
 * const enemyFSM = new StateMachine<Enemy>({
 *   initial: 'idle',
 *   states: {
 *     idle: {
 *       onEnter: (e) => e.playAnim('idle'),
 *       transitions: { 'spot-player': 'chase' }
 *     },
 *     chase: {
 *       onUpdate: (e, dt) => e.moveToward(player, dt),
 *       transitions: { 'in-range': 'attack', 'lost-player': 'idle' }
 *     },
 *     attack: {
 *       onEnter: (e) => e.attack(),
 *       transitions: { 'attack-done': 'chase' }
 *     }
 *   }
 * });
 *
 * const enemy = new Enemy();
 * enemy.fsm = enemyFSM.createInstance(enemy);
 *
 * // In game loop
 * enemy.fsm.update(dt);
 * enemy.fsm.trigger('spot-player');
 *
 * // Listen to state changes
 * enemy.fsm.on('state-enter', (state) => {
 *   console.log('Entered state:', state);
 * });
 *
 * // Check if transition is possible
 * if (enemy.fsm.canTrigger('attack')) {
 *   enemy.fsm.trigger('attack');
 * }
 *
 * // Debug state history
 * console.log('Recent states:', enemy.fsm.getStateHistory());
 * ```
 */
export class StateMachine<T> {
  private config: StateMachineConfig<T>;

  /**
   * Creates a new state machine definition
   * @param config - The state machine configuration
   */
  constructor(config: StateMachineConfig<T>) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Creates a new state machine instance for an entity
   * @param entity - The entity this state machine will control
   * @returns A new state machine instance
   */
  public createInstance(entity: T): StateMachineInstance<T> {
    return new StateMachineInstance(entity, this.config);
  }

  /**
   * Validates the state machine configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    if (!this.config.initial) {
      throw new Error('StateMachine requires an initial state');
    }

    if (!this.config.states || Object.keys(this.config.states).length === 0) {
      throw new Error('StateMachine requires at least one state definition');
    }

    if (!this.config.states[this.config.initial]) {
      throw new Error(`Initial state '${this.config.initial}' not found in state definitions`);
    }

    // Validate all transition targets exist
    for (const [stateName, state] of Object.entries(this.config.states)) {
      if (!state.transitions) {
        throw new Error(`State '${stateName}' missing transitions object`);
      }

      for (const [trigger, targetState] of Object.entries(state.transitions)) {
        if (!this.config.states[targetState]) {
          console.warn(
            `State '${stateName}' has transition '${trigger}' to undefined state '${targetState}'`
          );
        }
      }
    }
  }

  /**
   * Gets the configuration of this state machine
   * @returns The state machine configuration
   */
  public getConfig(): Readonly<StateMachineConfig<T>> {
    return this.config;
  }
}
