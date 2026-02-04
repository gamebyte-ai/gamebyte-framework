(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GameByteThree = {}, global.THREE));
})(this, (function (exports, THREE) { 'use strict';

	function _interopNamespaceDefault(e) {
		var n = Object.create(null);
		if (e) {
			Object.keys(e).forEach(function (k) {
				if (k !== 'default') {
					var d = Object.getOwnPropertyDescriptor(e, k);
					Object.defineProperty(n, k, d.get ? d : {
						enumerable: true,
						get: function () { return e[k]; }
					});
				}
			});
		}
		n.default = e;
		return Object.freeze(n);
	}

	var THREE__namespace = /*#__PURE__*/_interopNamespaceDefault(THREE);

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var eventemitter3 = {exports: {}};

	(function (module) {

		var has = Object.prototype.hasOwnProperty
		  , prefix = '~';

		/**
		 * Constructor to create a storage for our `EE` objects.
		 * An `Events` instance is a plain object whose properties are event names.
		 *
		 * @constructor
		 * @private
		 */
		function Events() {}

		//
		// We try to not inherit from `Object.prototype`. In some engines creating an
		// instance in this way is faster than calling `Object.create(null)` directly.
		// If `Object.create(null)` is not supported we prefix the event names with a
		// character to make sure that the built-in object properties are not
		// overridden or used as an attack vector.
		//
		if (Object.create) {
		  Events.prototype = Object.create(null);

		  //
		  // This hack is needed because the `__proto__` property is still inherited in
		  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
		  //
		  if (!new Events().__proto__) prefix = false;
		}

		/**
		 * Representation of a single event listener.
		 *
		 * @param {Function} fn The listener function.
		 * @param {*} context The context to invoke the listener with.
		 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
		 * @constructor
		 * @private
		 */
		function EE(fn, context, once) {
		  this.fn = fn;
		  this.context = context;
		  this.once = once || false;
		}

		/**
		 * Add a listener for a given event.
		 *
		 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn The listener function.
		 * @param {*} context The context to invoke the listener with.
		 * @param {Boolean} once Specify if the listener is a one-time listener.
		 * @returns {EventEmitter}
		 * @private
		 */
		function addListener(emitter, event, fn, context, once) {
		  if (typeof fn !== 'function') {
		    throw new TypeError('The listener must be a function');
		  }

		  var listener = new EE(fn, context || emitter, once)
		    , evt = prefix ? prefix + event : event;

		  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
		  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
		  else emitter._events[evt] = [emitter._events[evt], listener];

		  return emitter;
		}

		/**
		 * Clear event by name.
		 *
		 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
		 * @param {(String|Symbol)} evt The Event name.
		 * @private
		 */
		function clearEvent(emitter, evt) {
		  if (--emitter._eventsCount === 0) emitter._events = new Events();
		  else delete emitter._events[evt];
		}

		/**
		 * Minimal `EventEmitter` interface that is molded against the Node.js
		 * `EventEmitter` interface.
		 *
		 * @constructor
		 * @public
		 */
		function EventEmitter() {
		  this._events = new Events();
		  this._eventsCount = 0;
		}

		/**
		 * Return an array listing the events for which the emitter has registered
		 * listeners.
		 *
		 * @returns {Array}
		 * @public
		 */
		EventEmitter.prototype.eventNames = function eventNames() {
		  var names = []
		    , events
		    , name;

		  if (this._eventsCount === 0) return names;

		  for (name in (events = this._events)) {
		    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
		  }

		  if (Object.getOwnPropertySymbols) {
		    return names.concat(Object.getOwnPropertySymbols(events));
		  }

		  return names;
		};

		/**
		 * Return the listeners registered for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @returns {Array} The registered listeners.
		 * @public
		 */
		EventEmitter.prototype.listeners = function listeners(event) {
		  var evt = prefix ? prefix + event : event
		    , handlers = this._events[evt];

		  if (!handlers) return [];
		  if (handlers.fn) return [handlers.fn];

		  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
		    ee[i] = handlers[i].fn;
		  }

		  return ee;
		};

		/**
		 * Return the number of listeners listening to a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @returns {Number} The number of listeners.
		 * @public
		 */
		EventEmitter.prototype.listenerCount = function listenerCount(event) {
		  var evt = prefix ? prefix + event : event
		    , listeners = this._events[evt];

		  if (!listeners) return 0;
		  if (listeners.fn) return 1;
		  return listeners.length;
		};

		/**
		 * Calls each of the listeners registered for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @returns {Boolean} `true` if the event had listeners, else `false`.
		 * @public
		 */
		EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
		  var evt = prefix ? prefix + event : event;

		  if (!this._events[evt]) return false;

		  var listeners = this._events[evt]
		    , len = arguments.length
		    , args
		    , i;

		  if (listeners.fn) {
		    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

		    switch (len) {
		      case 1: return listeners.fn.call(listeners.context), true;
		      case 2: return listeners.fn.call(listeners.context, a1), true;
		      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
		      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
		      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
		      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
		    }

		    for (i = 1, args = new Array(len -1); i < len; i++) {
		      args[i - 1] = arguments[i];
		    }

		    listeners.fn.apply(listeners.context, args);
		  } else {
		    var length = listeners.length
		      , j;

		    for (i = 0; i < length; i++) {
		      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

		      switch (len) {
		        case 1: listeners[i].fn.call(listeners[i].context); break;
		        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
		        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
		        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
		        default:
		          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
		            args[j - 1] = arguments[j];
		          }

		          listeners[i].fn.apply(listeners[i].context, args);
		      }
		    }
		  }

		  return true;
		};

		/**
		 * Add a listener for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn The listener function.
		 * @param {*} [context=this] The context to invoke the listener with.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.on = function on(event, fn, context) {
		  return addListener(this, event, fn, context, false);
		};

		/**
		 * Add a one-time listener for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn The listener function.
		 * @param {*} [context=this] The context to invoke the listener with.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.once = function once(event, fn, context) {
		  return addListener(this, event, fn, context, true);
		};

		/**
		 * Remove the listeners of a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn Only remove the listeners that match this function.
		 * @param {*} context Only remove the listeners that have this context.
		 * @param {Boolean} once Only remove one-time listeners.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
		  var evt = prefix ? prefix + event : event;

		  if (!this._events[evt]) return this;
		  if (!fn) {
		    clearEvent(this, evt);
		    return this;
		  }

		  var listeners = this._events[evt];

		  if (listeners.fn) {
		    if (
		      listeners.fn === fn &&
		      (!once || listeners.once) &&
		      (!context || listeners.context === context)
		    ) {
		      clearEvent(this, evt);
		    }
		  } else {
		    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
		      if (
		        listeners[i].fn !== fn ||
		        (once && !listeners[i].once) ||
		        (context && listeners[i].context !== context)
		      ) {
		        events.push(listeners[i]);
		      }
		    }

		    //
		    // Reset the array, or remove it completely if we have no more listeners.
		    //
		    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
		    else clearEvent(this, evt);
		  }

		  return this;
		};

		/**
		 * Remove all listeners, or those of the specified event.
		 *
		 * @param {(String|Symbol)} [event] The event name.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
		  var evt;

		  if (event) {
		    evt = prefix ? prefix + event : event;
		    if (this._events[evt]) clearEvent(this, evt);
		  } else {
		    this._events = new Events();
		    this._eventsCount = 0;
		  }

		  return this;
		};

		//
		// Alias methods names because people roll like that.
		//
		EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
		EventEmitter.prototype.addListener = EventEmitter.prototype.on;

		//
		// Expose the prefix.
		//
		EventEmitter.prefixed = prefix;

		//
		// Allow `EventEmitter` to be imported as module namespace.
		//
		EventEmitter.EventEmitter = EventEmitter;

		//
		// Expose the module.
		//
		{
		  module.exports = EventEmitter;
		} 
	} (eventemitter3));

	var eventemitter3Exports = eventemitter3.exports;
	var EventEmitter = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

	/**
	 * IsometricCamera component for true isometric projection
	 *
	 * Provides a camera with proper isometric angles:
	 * - 45° rotation around Y axis (by default)
	 * - 35.264° tilt from horizontal (atan(1/√2) for true isometric)
	 *
	 * @example
	 * ```typescript
	 * const camera = new IsometricCamera({
	 *   viewSize: 20,
	 *   aspectRatio: window.innerWidth / window.innerHeight
	 * });
	 *
	 * // Position camera to look at origin
	 * camera.lookAt(0, 0, 0);
	 *
	 * // Handle window resize
	 * window.addEventListener('resize', () => {
	 *   camera.setAspectRatio(window.innerWidth / window.innerHeight);
	 *   camera.updateProjection();
	 * });
	 * ```
	 */
	class IsometricCamera extends EventEmitter {
	    constructor(options = {}) {
	        super();
	        const { viewSize = 10, angle = 45, tilt = IsometricCamera.TRUE_ISOMETRIC_TILT, aspectRatio = 1, near = 0.1, far = 1000, zoom = 1 } = options;
	        this._viewSize = viewSize;
	        this._aspectRatio = aspectRatio;
	        this._angle = angle;
	        this._tilt = tilt;
	        // Calculate initial frustum
	        const frustumHeight = viewSize;
	        const frustumWidth = frustumHeight * aspectRatio;
	        // Create orthographic camera
	        this.camera = new THREE__namespace.OrthographicCamera(-frustumWidth / 2, frustumWidth / 2, frustumHeight / 2, -frustumHeight / 2, near, far);
	        this.camera.zoom = zoom;
	        // Set initial isometric position and rotation
	        this.applyIsometricTransform();
	    }
	    /**
	     * Apply isometric transformation to camera
	     */
	    applyIsometricTransform() {
	        // Calculate camera distance based on view size
	        // Distance ensures the frustum covers the desired view size
	        const distance = this._viewSize * 2;
	        // Convert angles to radians
	        const angleRad = this._angle * (Math.PI / 180);
	        const tiltRad = this._tilt * (Math.PI / 180);
	        // Calculate camera position using spherical coordinates
	        const x = distance * Math.cos(tiltRad) * Math.sin(angleRad);
	        const y = distance * Math.sin(tiltRad);
	        const z = distance * Math.cos(tiltRad) * Math.cos(angleRad);
	        this.camera.position.set(x, y, z);
	        this.camera.lookAt(0, 0, 0);
	    }
	    /**
	     * Point camera at specific world coordinates
	     */
	    lookAt(x, y, z) {
	        this.camera.lookAt(x, y, z);
	    }
	    /**
	     * Set camera zoom level
	     */
	    setZoom(zoom) {
	        if (zoom <= 0) {
	            console.warn('IsometricCamera: zoom must be positive, clamping to 0.01');
	            zoom = 0.01;
	        }
	        this.camera.zoom = zoom;
	        this.camera.updateProjectionMatrix();
	        this.emit('zoom-changed', zoom);
	    }
	    /**
	     * Get current zoom level
	     */
	    getZoom() {
	        return this.camera.zoom;
	    }
	    /**
	     * Set view size (world units visible vertically)
	     */
	    setViewSize(size) {
	        if (size <= 0) {
	            console.warn('IsometricCamera: viewSize must be positive, clamping to 1');
	            size = 1;
	        }
	        this._viewSize = size;
	        this.applyIsometricTransform();
	        this.updateProjection();
	        this.emit('view-size-changed', size);
	    }
	    /**
	     * Get current view size
	     */
	    getViewSize() {
	        return this._viewSize;
	    }
	    /**
	     * Set aspect ratio (width/height)
	     */
	    setAspectRatio(aspectRatio) {
	        if (aspectRatio <= 0) {
	            console.warn('IsometricCamera: aspectRatio must be positive, clamping to 1');
	            aspectRatio = 1;
	        }
	        this._aspectRatio = aspectRatio;
	    }
	    /**
	     * Get current aspect ratio
	     */
	    getAspectRatio() {
	        return this._aspectRatio;
	    }
	    /**
	     * Set camera angle (rotation around Y axis in degrees)
	     */
	    setAngle(angle) {
	        this._angle = angle;
	        this.applyIsometricTransform();
	    }
	    /**
	     * Get current camera angle
	     */
	    getAngle() {
	        return this._angle;
	    }
	    /**
	     * Set camera tilt (angle from horizontal in degrees)
	     */
	    setTilt(tilt) {
	        this._tilt = tilt;
	        this.applyIsometricTransform();
	    }
	    /**
	     * Get current camera tilt
	     */
	    getTilt() {
	        return this._tilt;
	    }
	    /**
	     * Update projection matrix after aspect ratio or view size changes
	     * Call this after window resize events
	     */
	    updateProjection() {
	        const frustumHeight = this._viewSize;
	        const frustumWidth = frustumHeight * this._aspectRatio;
	        this.camera.left = -frustumWidth / 2;
	        this.camera.right = frustumWidth / 2;
	        this.camera.top = frustumHeight / 2;
	        this.camera.bottom = -frustumHeight / 2;
	        this.camera.updateProjectionMatrix();
	        this.emit('projection-updated');
	    }
	    /**
	     * Get underlying THREE.OrthographicCamera instance
	     */
	    getThreeCamera() {
	        return this.camera;
	    }
	    /**
	     * Get camera position
	     */
	    getPosition() {
	        return this.camera.position;
	    }
	    /**
	     * Set camera position directly (bypasses isometric transform)
	     */
	    setPosition(x, y, z) {
	        this.camera.position.set(x, y, z);
	    }
	    /**
	     * Get camera rotation
	     */
	    getRotation() {
	        return this.camera.rotation;
	    }
	    /**
	     * Dispose of resources
	     */
	    dispose() {
	        this.removeAllListeners();
	    }
	}
	// True isometric tilt: atan(1/√2) ≈ 35.264°
	IsometricCamera.TRUE_ISOMETRIC_TILT = Math.atan(1 / Math.sqrt(2)) * (180 / Math.PI);

	/**
	 * StrategyCamera - Perspective top-down camera for strategy games
	 *
	 * Provides a bird's-eye view similar to Clash Royale, Brawl Stars, etc.
	 * The camera orbits around a target point with configurable distance, angle, and tilt.
	 *
	 * @example
	 * ```typescript
	 * const camera = new StrategyCamera({
	 *   fov: 60,
	 *   distance: 15,
	 *   angle: 45,
	 *   tilt: 55,
	 *   target: [0, 0, 0]
	 * });
	 *
	 * // Move camera target
	 * camera.setTarget(5, 0, 10);
	 *
	 * // Rotate around target
	 * camera.setAngle(90);
	 *
	 * // Adjust view distance
	 * camera.setDistance(20);
	 * ```
	 */
	class StrategyCamera {
	    /**
	     * Creates a new StrategyCamera instance
	     * @param config - Camera configuration options
	     */
	    constructor(config = {}) {
	        const { fov = 60, distance = 10, angle = 0, tilt = 55, target = [0, 0, 0], near = 0.1, far = 1000, aspect = (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1) } = config;
	        // Create the underlying PerspectiveCamera
	        this._camera = new THREE__namespace.PerspectiveCamera(fov, aspect, near, far);
	        // Initialize properties
	        this._target = new THREE__namespace.Vector3(target[0], target[1], target[2]);
	        this._distance = distance;
	        this._angle = angle;
	        this._tilt = Math.max(0, Math.min(90, tilt)); // Clamp tilt to 0-90 degrees
	        // Position the camera
	        this.updatePosition();
	    }
	    /**
	     * Get the underlying THREE.PerspectiveCamera instance
	     */
	    get camera() {
	        return this._camera;
	    }
	    /**
	     * Set the target look-at point
	     * @param x - X coordinate
	     * @param y - Y coordinate
	     * @param z - Z coordinate
	     */
	    setTarget(x, y, z) {
	        this._target.set(x, y, z);
	        this.updatePosition();
	    }
	    /**
	     * Set the distance from target
	     * @param distance - Distance value (must be positive)
	     */
	    setDistance(distance) {
	        this._distance = Math.max(0.1, distance);
	        this.updatePosition();
	    }
	    /**
	     * Set the rotation angle around Y-axis
	     * @param angle - Angle in degrees
	     */
	    setAngle(angle) {
	        this._angle = angle;
	        this.updatePosition();
	    }
	    /**
	     * Set the tilt angle from horizontal
	     * @param tilt - Tilt angle in degrees (clamped to 0-90)
	     */
	    setTilt(tilt) {
	        this._tilt = Math.max(0, Math.min(90, tilt));
	        this.updatePosition();
	    }
	    /**
	     * Get the current target point
	     * @returns A copy of the target Vector3
	     */
	    getTarget() {
	        return this._target.clone();
	    }
	    /**
	     * Get the current distance from target
	     */
	    getDistance() {
	        return this._distance;
	    }
	    /**
	     * Get the current rotation angle
	     */
	    getAngle() {
	        return this._angle;
	    }
	    /**
	     * Get the current tilt angle
	     */
	    getTilt() {
	        return this._tilt;
	    }
	    /**
	     * Update camera position based on current target, distance, angle, and tilt
	     *
	     * Calculation:
	     * - Convert angles to radians
	     * - Calculate camera position using spherical coordinates
	     * - Position camera and update look-at target
	     */
	    updatePosition() {
	        // Convert degrees to radians
	        const angleRad = THREE__namespace.MathUtils.degToRad(this._angle);
	        const tiltRad = THREE__namespace.MathUtils.degToRad(this._tilt);
	        // Calculate camera position using spherical coordinates
	        // X and Z form a circle around target, Y is height above target
	        const horizontalDistance = this._distance * Math.cos(tiltRad);
	        const verticalDistance = this._distance * Math.sin(tiltRad);
	        const x = this._target.x + horizontalDistance * Math.sin(angleRad);
	        const y = this._target.y + verticalDistance;
	        const z = this._target.z + horizontalDistance * Math.cos(angleRad);
	        // Set camera position and look at target
	        this._camera.position.set(x, y, z);
	        this._camera.lookAt(this._target);
	        this._camera.updateMatrixWorld();
	    }
	    /**
	     * Update camera aspect ratio (useful for window resize)
	     * @param aspect - New aspect ratio
	     */
	    updateAspect(aspect) {
	        this._camera.aspect = aspect;
	        this._camera.updateProjectionMatrix();
	    }
	    /**
	     * Update field of view
	     * @param fov - Field of view in degrees
	     */
	    updateFOV(fov) {
	        this._camera.fov = fov;
	        this._camera.updateProjectionMatrix();
	    }
	    /**
	     * Smoothly move target to a new position
	     * @param x - Target X coordinate
	     * @param y - Target Y coordinate
	     * @param z - Target Z coordinate
	     * @param duration - Animation duration in milliseconds
	     * @returns Promise that resolves when animation completes
	     */
	    async animateToTarget(x, y, z, duration = 1000) {
	        return new Promise((resolve) => {
	            const startTarget = this._target.clone();
	            const endTarget = new THREE__namespace.Vector3(x, y, z);
	            const startTime = Date.now();
	            const animate = () => {
	                const elapsed = Date.now() - startTime;
	                const progress = Math.min(elapsed / duration, 1);
	                // Ease in-out cubic
	                const eased = progress < 0.5
	                    ? 4 * progress * progress * progress
	                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
	                this._target.lerpVectors(startTarget, endTarget, eased);
	                this.updatePosition();
	                if (progress < 1) {
	                    requestAnimationFrame(animate);
	                }
	                else {
	                    resolve();
	                }
	            };
	            animate();
	        });
	    }
	    /**
	     * Smoothly rotate to a new angle
	     * @param angle - Target angle in degrees
	     * @param duration - Animation duration in milliseconds
	     * @returns Promise that resolves when animation completes
	     */
	    async animateToAngle(angle, duration = 1000) {
	        return new Promise((resolve) => {
	            const startAngle = this._angle;
	            const endAngle = angle;
	            const startTime = Date.now();
	            const animate = () => {
	                const elapsed = Date.now() - startTime;
	                const progress = Math.min(elapsed / duration, 1);
	                // Ease in-out cubic
	                const eased = progress < 0.5
	                    ? 4 * progress * progress * progress
	                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
	                this._angle = startAngle + (endAngle - startAngle) * eased;
	                this.updatePosition();
	                if (progress < 1) {
	                    requestAnimationFrame(animate);
	                }
	                else {
	                    resolve();
	                }
	            };
	            animate();
	        });
	    }
	    /**
	     * Dispose of resources
	     */
	    dispose() {
	        // PerspectiveCamera doesn't have resources to dispose,
	        // but this method is here for consistency with other components
	    }
	}

	/**
	 * CameraController - Universal camera controller for Three.js cameras
	 *
	 * Works with any THREE.Camera including IsometricCamera and StrategyCamera.
	 * Provides pan, zoom, and optional rotation controls with smooth interpolation,
	 * momentum, and boundary enforcement.
	 *
	 * @example
	 * ```typescript
	 * const controller = new CameraController(camera, {
	 *   enablePan: true,
	 *   enableZoom: true,
	 *   panSpeed: 1.5,
	 *   zoomRange: [0.5, 3],
	 *   bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
	 *   smoothing: 0.15,
	 *   momentum: true
	 * });
	 *
	 * // In game loop
	 * controller.update(deltaTime);
	 *
	 * // Pan to position
	 * controller.setTarget(10, 20);
	 *
	 * // Clean up
	 * controller.dispose();
	 * ```
	 */
	class CameraController extends EventEmitter {
	    constructor(camera, config = {}) {
	        super();
	        this.enabled = true;
	        // Target state (what we're lerping toward)
	        this.targetX = 0;
	        this.targetZ = 0;
	        this.targetZoom = 1;
	        this.targetRotation = 0;
	        // Current state (smoothed)
	        this.currentX = 0;
	        this.currentZ = 0;
	        this.currentZoom = 1;
	        this.currentRotation = 0;
	        // Initial state (for reset)
	        this.initialX = 0;
	        this.initialZ = 0;
	        this.initialZoom = 1;
	        this.initialRotation = 0;
	        // Input tracking
	        this.input = {
	            isPointerDown: false,
	            pointerCount: 0,
	            lastPointerX: 0,
	            lastPointerY: 0,
	            lastPinchDistance: 0,
	            velocityX: 0,
	            velocityZ: 0
	        };
	        // DOM element for event listeners
	        this.domElement = null;
	        // Bound event handlers for cleanup
	        this.boundHandlers = {
	            pointerDown: this.onPointerDown.bind(this),
	            pointerMove: this.onPointerMove.bind(this),
	            pointerUp: this.onPointerUp.bind(this),
	            wheel: this.onWheel.bind(this),
	            touchStart: this.onTouchStart.bind(this),
	            touchMove: this.onTouchMove.bind(this),
	            touchEnd: this.onTouchEnd.bind(this)
	        };
	        this.camera = camera;
	        // Merge config with defaults
	        this.config = {
	            enablePan: config.enablePan ?? true,
	            enableZoom: config.enableZoom ?? true,
	            enableRotate: config.enableRotate ?? false,
	            panSpeed: config.panSpeed ?? 1,
	            zoomSpeed: config.zoomSpeed ?? 1,
	            rotateSpeed: config.rotateSpeed ?? 1,
	            zoomRange: config.zoomRange ?? [0.5, 5],
	            bounds: config.bounds ?? null,
	            smoothing: Math.max(0, Math.min(1, config.smoothing ?? 0.1)),
	            momentum: config.momentum ?? true,
	            momentumDecay: Math.max(0, Math.min(1, config.momentumDecay ?? 0.92))
	        };
	        // Initialize from camera position
	        this.initializeFromCamera();
	        // Auto-detect DOM element from renderer
	        if (typeof document !== 'undefined') {
	            this.attachToElement(document.body);
	        }
	    }
	    /**
	     * Initialize controller state from current camera position
	     */
	    initializeFromCamera() {
	        this.currentX = this.targetX = this.initialX = this.camera.position.x;
	        this.currentZ = this.targetZ = this.initialZ = this.camera.position.z;
	        // Try to get zoom from camera
	        if ('zoom' in this.camera && typeof this.camera.zoom === 'number') {
	            this.currentZoom = this.targetZoom = this.initialZoom = this.camera.zoom;
	        }
	        // Try to get rotation from camera
	        this.currentRotation = this.targetRotation = this.initialRotation = this.camera.rotation.y;
	    }
	    /**
	     * Attach event listeners to a DOM element
	     */
	    attachToElement(element) {
	        if (this.domElement) {
	            this.detachFromElement();
	        }
	        this.domElement = element;
	        // Mouse events
	        element.addEventListener('pointerdown', this.boundHandlers.pointerDown);
	        element.addEventListener('pointermove', this.boundHandlers.pointerMove);
	        element.addEventListener('pointerup', this.boundHandlers.pointerUp);
	        element.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
	        // Touch events
	        element.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
	        element.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
	        element.addEventListener('touchend', this.boundHandlers.touchEnd);
	    }
	    /**
	     * Remove event listeners from current DOM element
	     */
	    detachFromElement() {
	        if (!this.domElement)
	            return;
	        const element = this.domElement;
	        element.removeEventListener('pointerdown', this.boundHandlers.pointerDown);
	        element.removeEventListener('pointermove', this.boundHandlers.pointerMove);
	        element.removeEventListener('pointerup', this.boundHandlers.pointerUp);
	        element.removeEventListener('wheel', this.boundHandlers.wheel);
	        element.removeEventListener('touchstart', this.boundHandlers.touchStart);
	        element.removeEventListener('touchmove', this.boundHandlers.touchMove);
	        element.removeEventListener('touchend', this.boundHandlers.touchEnd);
	        this.domElement = null;
	    }
	    /**
	     * Handle pointer down event
	     */
	    onPointerDown(event) {
	        if (!this.enabled || !this.config.enablePan)
	            return;
	        this.input.isPointerDown = true;
	        this.input.lastPointerX = event.clientX;
	        this.input.lastPointerY = event.clientY;
	        this.input.velocityX = 0;
	        this.input.velocityZ = 0;
	    }
	    /**
	     * Handle pointer move event
	     */
	    onPointerMove(event) {
	        if (!this.enabled || !this.input.isPointerDown || !this.config.enablePan)
	            return;
	        const deltaX = event.clientX - this.input.lastPointerX;
	        const deltaY = event.clientY - this.input.lastPointerY;
	        // Calculate world-space pan movement
	        const panScale = this.calculatePanScale();
	        const moveX = -deltaX * panScale * this.config.panSpeed;
	        const moveZ = -deltaY * panScale * this.config.panSpeed;
	        this.targetX += moveX;
	        this.targetZ += moveZ;
	        // Track velocity for momentum
	        if (this.config.momentum) {
	            this.input.velocityX = moveX * 0.3;
	            this.input.velocityZ = moveZ * 0.3;
	        }
	        this.input.lastPointerX = event.clientX;
	        this.input.lastPointerY = event.clientY;
	        this.applyBounds();
	    }
	    /**
	     * Handle pointer up event
	     */
	    onPointerUp() {
	        this.input.isPointerDown = false;
	    }
	    /**
	     * Handle wheel event (zoom)
	     */
	    onWheel(event) {
	        if (!this.enabled || !this.config.enableZoom)
	            return;
	        event.preventDefault();
	        const delta = event.deltaY;
	        const zoomDelta = -delta * 0.001 * this.config.zoomSpeed;
	        this.targetZoom = THREE__namespace.MathUtils.clamp(this.targetZoom + zoomDelta, this.config.zoomRange[0], this.config.zoomRange[1]);
	    }
	    /**
	     * Handle touch start event
	     */
	    onTouchStart(event) {
	        if (!this.enabled)
	            return;
	        event.preventDefault();
	        this.input.pointerCount = event.touches.length;
	        if (event.touches.length === 1 && this.config.enablePan) {
	            // Single touch - pan
	            this.input.isPointerDown = true;
	            this.input.lastPointerX = event.touches[0].clientX;
	            this.input.lastPointerY = event.touches[0].clientY;
	            this.input.velocityX = 0;
	            this.input.velocityZ = 0;
	        }
	        else if (event.touches.length === 2 && this.config.enableZoom) {
	            // Two fingers - pinch zoom
	            const dx = event.touches[0].clientX - event.touches[1].clientX;
	            const dy = event.touches[0].clientY - event.touches[1].clientY;
	            this.input.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
	        }
	    }
	    /**
	     * Handle touch move event
	     */
	    onTouchMove(event) {
	        if (!this.enabled)
	            return;
	        event.preventDefault();
	        if (event.touches.length === 1 && this.input.isPointerDown && this.config.enablePan) {
	            // Single touch - pan
	            const deltaX = event.touches[0].clientX - this.input.lastPointerX;
	            const deltaY = event.touches[0].clientY - this.input.lastPointerY;
	            const panScale = this.calculatePanScale();
	            const moveX = -deltaX * panScale * this.config.panSpeed;
	            const moveZ = -deltaY * panScale * this.config.panSpeed;
	            this.targetX += moveX;
	            this.targetZ += moveZ;
	            if (this.config.momentum) {
	                this.input.velocityX = moveX * 0.3;
	                this.input.velocityZ = moveZ * 0.3;
	            }
	            this.input.lastPointerX = event.touches[0].clientX;
	            this.input.lastPointerY = event.touches[0].clientY;
	            this.applyBounds();
	        }
	        else if (event.touches.length === 2 && this.config.enableZoom) {
	            // Two fingers - pinch zoom
	            const dx = event.touches[0].clientX - event.touches[1].clientX;
	            const dy = event.touches[0].clientY - event.touches[1].clientY;
	            const distance = Math.sqrt(dx * dx + dy * dy);
	            if (this.input.lastPinchDistance > 0) {
	                const delta = distance - this.input.lastPinchDistance;
	                const zoomDelta = delta * 0.01 * this.config.zoomSpeed;
	                this.targetZoom = THREE__namespace.MathUtils.clamp(this.targetZoom + zoomDelta, this.config.zoomRange[0], this.config.zoomRange[1]);
	            }
	            this.input.lastPinchDistance = distance;
	        }
	    }
	    /**
	     * Handle touch end event
	     */
	    onTouchEnd(event) {
	        this.input.isPointerDown = false;
	        this.input.pointerCount = event.touches.length;
	        if (event.touches.length === 0) {
	            this.input.lastPinchDistance = 0;
	        }
	    }
	    /**
	     * Calculate pan scale based on camera distance/zoom
	     */
	    calculatePanScale() {
	        // For orthographic cameras (zoom-based)
	        if ('zoom' in this.camera && typeof this.camera.zoom === 'number') {
	            const zoom = this.camera.zoom || 1;
	            return 1 / (zoom * 100);
	        }
	        // For perspective cameras (distance-based)
	        const distance = this.camera.position.length();
	        return distance / 500;
	    }
	    /**
	     * Apply boundary constraints to target position
	     */
	    applyBounds() {
	        if (!this.config.bounds)
	            return;
	        const { minX, maxX, minZ, maxZ } = this.config.bounds;
	        // Hard clamp
	        this.targetX = THREE__namespace.MathUtils.clamp(this.targetX, minX, maxX);
	        this.targetZ = THREE__namespace.MathUtils.clamp(this.targetZ, minZ, maxZ);
	    }
	    /**
	     * Update controller (call this in your game loop)
	     */
	    update(deltaTime) {
	        if (!this.enabled)
	            return;
	        // Apply momentum
	        if (this.config.momentum && !this.input.isPointerDown) {
	            if (Math.abs(this.input.velocityX) > 0.001 || Math.abs(this.input.velocityZ) > 0.001) {
	                this.targetX += this.input.velocityX;
	                this.targetZ += this.input.velocityZ;
	                this.input.velocityX *= this.config.momentumDecay;
	                this.input.velocityZ *= this.config.momentumDecay;
	                this.applyBounds();
	            }
	        }
	        // Smooth interpolation
	        const lerpFactor = 1 - Math.pow(1 - this.config.smoothing, deltaTime * 60);
	        const lastX = this.currentX;
	        const lastZ = this.currentZ;
	        const lastZoom = this.currentZoom;
	        this.currentX = THREE__namespace.MathUtils.lerp(this.currentX, this.targetX, lerpFactor);
	        this.currentZ = THREE__namespace.MathUtils.lerp(this.currentZ, this.targetZ, lerpFactor);
	        this.currentZoom = THREE__namespace.MathUtils.lerp(this.currentZoom, this.targetZoom, lerpFactor);
	        this.currentRotation = THREE__namespace.MathUtils.lerp(this.currentRotation, this.targetRotation, lerpFactor);
	        // Update camera position
	        const deltaX = this.currentX - lastX;
	        const deltaZ = this.currentZ - lastZ;
	        if (Math.abs(deltaX) > 0.001 || Math.abs(deltaZ) > 0.001) {
	            this.camera.position.x = this.currentX;
	            this.camera.position.z = this.currentZ;
	            this.emit('pan', this.currentX, this.currentZ);
	        }
	        // Update camera zoom
	        if (Math.abs(this.currentZoom - lastZoom) > 0.001) {
	            if ('zoom' in this.camera && 'updateProjectionMatrix' in this.camera) {
	                this.camera.zoom = this.currentZoom;
	                this.camera.updateProjectionMatrix();
	            }
	            else if (this.camera instanceof THREE__namespace.PerspectiveCamera) {
	                // For perspective cameras, adjust FOV instead
	                const baseFOV = 60;
	                this.camera.fov = baseFOV / this.currentZoom;
	                this.camera.updateProjectionMatrix();
	            }
	            this.emit('zoom', this.currentZoom);
	        }
	        // Update camera rotation (if enabled)
	        if (this.config.enableRotate && Math.abs(this.currentRotation - this.camera.rotation.y) > 0.001) {
	            this.camera.rotation.y = this.currentRotation;
	            this.emit('rotate', this.currentRotation);
	        }
	    }
	    /**
	     * Set target pan position
	     */
	    setTarget(x, z) {
	        this.targetX = x;
	        this.targetZ = z;
	        this.applyBounds();
	    }
	    /**
	     * Set target zoom level
	     */
	    setZoom(zoom) {
	        this.targetZoom = THREE__namespace.MathUtils.clamp(zoom, this.config.zoomRange[0], this.config.zoomRange[1]);
	    }
	    /**
	     * Set target rotation angle (radians)
	     */
	    setRotation(angle) {
	        this.targetRotation = angle;
	    }
	    /**
	     * Reset to initial state
	     */
	    reset() {
	        this.targetX = this.currentX = this.initialX;
	        this.targetZ = this.currentZ = this.initialZ;
	        this.targetZoom = this.currentZoom = this.initialZoom;
	        this.targetRotation = this.currentRotation = this.initialRotation;
	        this.input.velocityX = 0;
	        this.input.velocityZ = 0;
	        this.camera.position.x = this.currentX;
	        this.camera.position.z = this.currentZ;
	        if ('zoom' in this.camera && 'updateProjectionMatrix' in this.camera) {
	            this.camera.zoom = this.currentZoom;
	            this.camera.updateProjectionMatrix();
	        }
	    }
	    /**
	     * Enable controller
	     */
	    enable() {
	        this.enabled = true;
	    }
	    /**
	     * Disable controller
	     */
	    disable() {
	        this.enabled = false;
	        this.input.isPointerDown = false;
	        this.input.velocityX = 0;
	        this.input.velocityZ = 0;
	    }
	    /**
	     * Check if controller is enabled
	     */
	    isEnabled() {
	        return this.enabled;
	    }
	    /**
	     * Get current pan position
	     */
	    getPosition() {
	        return { x: this.currentX, z: this.currentZ };
	    }
	    /**
	     * Get current zoom level
	     */
	    getZoom() {
	        return this.currentZoom;
	    }
	    /**
	     * Get current rotation angle
	     */
	    getRotation() {
	        return this.currentRotation;
	    }
	    /**
	     * Update controller configuration
	     */
	    updateConfig(config) {
	        if (config.enablePan !== undefined)
	            this.config.enablePan = config.enablePan;
	        if (config.enableZoom !== undefined)
	            this.config.enableZoom = config.enableZoom;
	        if (config.enableRotate !== undefined)
	            this.config.enableRotate = config.enableRotate;
	        if (config.panSpeed !== undefined)
	            this.config.panSpeed = config.panSpeed;
	        if (config.zoomSpeed !== undefined)
	            this.config.zoomSpeed = config.zoomSpeed;
	        if (config.rotateSpeed !== undefined)
	            this.config.rotateSpeed = config.rotateSpeed;
	        if (config.zoomRange !== undefined)
	            this.config.zoomRange = config.zoomRange;
	        if (config.bounds !== undefined)
	            this.config.bounds = config.bounds;
	        if (config.smoothing !== undefined) {
	            this.config.smoothing = Math.max(0, Math.min(1, config.smoothing));
	        }
	        if (config.momentum !== undefined)
	            this.config.momentum = config.momentum;
	        if (config.momentumDecay !== undefined) {
	            this.config.momentumDecay = Math.max(0, Math.min(1, config.momentumDecay));
	        }
	    }
	    /**
	     * Get current configuration
	     */
	    getConfig() {
	        return { ...this.config };
	    }
	    /**
	     * Dispose of resources and remove event listeners
	     */
	    dispose() {
	        this.detachFromElement();
	        this.removeAllListeners();
	    }
	}

	/**
	 * Helper to create grid coordinate key for Maps
	 */
	function gridCoordToKey(coord) {
	    if ('q' in coord) {
	        return `${coord.q},${coord.r},${coord.s}`;
	    }
	    return `${coord.x},${coord.y}`;
	}
	/**
	 * Helper to parse grid coordinate from key
	 */
	function keyToGridCoord(key) {
	    const [x, y] = key.split(',').map(Number);
	    return { x, y };
	}
	/**
	 * Helper to parse hex coordinate from key
	 */
	function keyToHexCoord(key) {
	    const [q, r, s] = key.split(',').map(Number);
	    return { q, r, s };
	}

	/**
	 * Square/rectangular grid system for GameByte Framework
	 * @template T - Type of data stored in grid cells
	 */
	class SquareGrid {
	    constructor(config) {
	        this.cells = new Map();
	        this.walkable = new Map();
	        this.movementCosts = new Map();
	        this.width = config.width;
	        this.height = config.height;
	        this.cellSize = config.cellSize;
	        this.origin = new THREE.Vector3(config.origin?.[0] ?? 0, config.origin?.[1] ?? 0, config.origin?.[2] ?? 0);
	        this.originMode = config.originMode ?? 'corner';
	        this.neighborMode = config.neighborMode ?? '4-way';
	    }
	    worldToCell(worldPos) {
	        // Adjust for origin offset
	        let localX = worldPos.x - this.origin.x;
	        let localZ = worldPos.z - this.origin.z;
	        // Adjust for center mode
	        if (this.originMode === 'center') {
	            localX += (this.width * this.cellSize) / 2;
	            localZ += (this.height * this.cellSize) / 2;
	        }
	        // Convert to grid coordinates
	        const x = Math.floor(localX / this.cellSize);
	        const y = Math.floor(localZ / this.cellSize);
	        return { x, y };
	    }
	    cellToWorld(coord) {
	        // Cell center position
	        let worldX = coord.x * this.cellSize + this.cellSize / 2;
	        let worldZ = coord.y * this.cellSize + this.cellSize / 2;
	        // Adjust for center mode
	        if (this.originMode === 'center') {
	            worldX -= (this.width * this.cellSize) / 2;
	            worldZ -= (this.height * this.cellSize) / 2;
	        }
	        // Apply origin offset
	        worldX += this.origin.x;
	        worldZ += this.origin.z;
	        return new THREE.Vector3(worldX, this.origin.y, worldZ);
	    }
	    getCell(coord) {
	        if (!this.isValidCoord(coord))
	            return undefined;
	        return this.cells.get(gridCoordToKey(coord));
	    }
	    setCell(coord, value) {
	        if (!this.isValidCoord(coord)) {
	            throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
	        }
	        this.cells.set(gridCoordToKey(coord), value);
	    }
	    clearCell(coord) {
	        this.cells.delete(gridCoordToKey(coord));
	        this.walkable.delete(gridCoordToKey(coord));
	        this.movementCosts.delete(gridCoordToKey(coord));
	    }
	    getAllCells() {
	        const result = new Map();
	        this.cells.forEach((value, key) => {
	            result.set(key, { coord: keyToGridCoord(key), value });
	        });
	        return result;
	    }
	    getNeighbors(coord) {
	        const neighbors = [];
	        // Cardinal directions (4-way)
	        const cardinalOffsets = [
	            [0, -1], // North
	            [1, 0], // East
	            [0, 1], // South
	            [-1, 0], // West
	        ];
	        // Diagonal directions (additional for 8-way)
	        const diagonalOffsets = [
	            [1, -1], // Northeast
	            [1, 1], // Southeast
	            [-1, 1], // Southwest
	            [-1, -1], // Northwest
	        ];
	        // Add cardinal neighbors
	        for (const [dx, dy] of cardinalOffsets) {
	            const neighbor = { x: coord.x + dx, y: coord.y + dy };
	            if (this.isValidCoord(neighbor)) {
	                neighbors.push(neighbor);
	            }
	        }
	        // Add diagonal neighbors for 8-way mode
	        if (this.neighborMode === '8-way') {
	            for (const [dx, dy] of diagonalOffsets) {
	                const neighbor = { x: coord.x + dx, y: coord.y + dy };
	                if (this.isValidCoord(neighbor)) {
	                    neighbors.push(neighbor);
	                }
	            }
	        }
	        return neighbors;
	    }
	    getCellsInRange(center, range) {
	        const cells = [];
	        for (let dy = -range; dy <= range; dy++) {
	            for (let dx = -range; dx <= range; dx++) {
	                // Manhattan distance for 4-way, Chebyshev for 8-way
	                const distance = this.neighborMode === '4-way'
	                    ? Math.abs(dx) + Math.abs(dy)
	                    : Math.max(Math.abs(dx), Math.abs(dy));
	                if (distance <= range) {
	                    const coord = { x: center.x + dx, y: center.y + dy };
	                    if (this.isValidCoord(coord)) {
	                        cells.push(coord);
	                    }
	                }
	            }
	        }
	        return cells;
	    }
	    isValidCoord(coord) {
	        return (coord.x >= 0 &&
	            coord.x < this.width &&
	            coord.y >= 0 &&
	            coord.y < this.height);
	    }
	    isWalkable(coord) {
	        if (!this.isValidCoord(coord))
	            return false;
	        const key = gridCoordToKey(coord);
	        // Default to true if not explicitly set
	        return this.walkable.get(key) ?? true;
	    }
	    setWalkable(coord, walkable) {
	        if (!this.isValidCoord(coord)) {
	            throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
	        }
	        this.walkable.set(gridCoordToKey(coord), walkable);
	    }
	    getMovementCost(from, to) {
	        // Check if coordinates are valid
	        if (!this.isValidCoord(from) || !this.isValidCoord(to)) {
	            return Infinity;
	        }
	        // Check if destination is walkable
	        if (!this.isWalkable(to)) {
	            return Infinity;
	        }
	        // Check if cells are adjacent
	        const dx = Math.abs(to.x - from.x);
	        const dy = Math.abs(to.y - from.y);
	        const isCardinal = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
	        const isDiagonal = dx === 1 && dy === 1;
	        if (!isCardinal && !isDiagonal) {
	            return Infinity; // Not adjacent
	        }
	        if (isDiagonal && this.neighborMode === '4-way') {
	            return Infinity; // Diagonal not allowed in 4-way mode
	        }
	        // Check for custom movement cost
	        const toKey = gridCoordToKey(to);
	        const customCost = this.movementCosts.get(toKey);
	        if (customCost !== undefined) {
	            return customCost;
	        }
	        // Default costs: 1 for cardinal, sqrt(2) for diagonal
	        return isDiagonal ? Math.SQRT2 : 1;
	    }
	    /**
	     * Set custom movement cost for a cell
	     */
	    setMovementCost(coord, cost) {
	        if (!this.isValidCoord(coord)) {
	            throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
	        }
	        this.movementCosts.set(gridCoordToKey(coord), cost);
	    }
	    /**
	     * Get grid dimensions
	     */
	    getDimensions() {
	        return { width: this.width, height: this.height };
	    }
	    /**
	     * Get cell size
	     */
	    getCellSize() {
	        return this.cellSize;
	    }
	    /**
	     * Get grid origin
	     */
	    getOrigin() {
	        return this.origin.clone();
	    }
	}

	/**
	 * Hexagonal grid using cube coordinates
	 *
	 * Based on Red Blob Games hex grid math:
	 * https://www.redblobgames.com/grids/hexagons/
	 *
	 * Uses cube coordinates where q + r + s = 0
	 * - q: column axis
	 * - r: row axis
	 * - s: diagonal axis
	 *
	 * @template T - Type of data stored in grid cells
	 */
	class HexGrid {
	    constructor(config) {
	        // Orientation matrices for hex-to-pixel conversion
	        this.orientations = {
	            flat: {
	                f0: 3.0 / 2.0, f1: 0.0, f2: Math.sqrt(3.0) / 2.0, f3: Math.sqrt(3.0),
	                b0: 2.0 / 3.0, b1: 0.0, b2: -1 / 3.0, b3: Math.sqrt(3.0) / 3.0,
	                startAngle: 0.0,
	            },
	            pointy: {
	                f0: Math.sqrt(3.0), f1: Math.sqrt(3.0) / 2.0, f2: 0.0, f3: 3.0 / 2.0,
	                b0: Math.sqrt(3.0) / 3.0, b1: -1 / 3.0, b2: 0.0, b3: 2.0 / 3.0,
	                startAngle: 0.5,
	            },
	        };
	        // Cube direction vectors for 6 neighbors
	        this.directions = [
	            { q: 1, r: 0, s: -1 },
	            { q: 1, r: -1, s: 0 },
	            { q: 0, r: -1, s: 1 },
	            { q: -1, r: 0, s: 1 },
	            { q: -1, r: 1, s: 0 },
	            { q: 0, r: 1, s: -1 },
	        ];
	        this.config = {
	            ...config,
	            defaultMovementCost: config.defaultMovementCost ?? 1,
	        };
	        this.cells = new Map();
	        this.walkable = new Map();
	        this.origin = new THREE.Vector3(...config.origin);
	    }
	    /**
	     * Convert world position to hex coordinate
	     */
	    worldToCell(worldPos) {
	        const orientation = this.orientations[this.config.orientation];
	        const size = this.config.hexSize;
	        // Convert world to local coordinates
	        const localX = worldPos.x - this.origin.x;
	        const localZ = worldPos.z - this.origin.z;
	        // Hex-to-pixel inverse transformation
	        const q = (orientation.b0 * localX + orientation.b1 * localZ) / size;
	        const r = (orientation.b2 * localX + orientation.b3 * localZ) / size;
	        // Round to nearest hex using cube rounding
	        return this.cubeRound({ q, r, s: -q - r });
	    }
	    /**
	     * Convert hex coordinate to world position
	     */
	    cellToWorld(coord) {
	        const orientation = this.orientations[this.config.orientation];
	        const size = this.config.hexSize;
	        // Pixel-to-hex transformation
	        const x = (orientation.f0 * coord.q + orientation.f1 * coord.r) * size;
	        const z = (orientation.f2 * coord.q + orientation.f3 * coord.r) * size;
	        return new THREE.Vector3(this.origin.x + x, this.origin.y, this.origin.z + z);
	    }
	    /**
	     * Get cell value at coordinate
	     */
	    getCell(coord) {
	        const key = gridCoordToKey(coord);
	        return this.cells.get(key);
	    }
	    /**
	     * Set cell value at coordinate
	     */
	    setCell(coord, value) {
	        if (!this.isValidCoord(coord)) {
	            throw new Error(`Coordinate ${gridCoordToKey(coord)} is outside grid radius ${this.config.radius}`);
	        }
	        const key = gridCoordToKey(coord);
	        this.cells.set(key, value);
	    }
	    /**
	     * Clear cell at coordinate
	     */
	    clearCell(coord) {
	        const key = gridCoordToKey(coord);
	        this.cells.delete(key);
	        this.walkable.delete(key);
	    }
	    /**
	     * Get all cells in the grid
	     */
	    getAllCells() {
	        const result = new Map();
	        this.cells.forEach((value, key) => {
	            result.set(key, { coord: keyToHexCoord(key), value });
	        });
	        return result;
	    }
	    /**
	     * Get 6 neighboring hex coordinates
	     */
	    getNeighbors(coord) {
	        return this.directions
	            .map((dir) => this.cubeAdd(coord, dir))
	            .filter((neighbor) => this.isValidCoord(neighbor));
	    }
	    /**
	     * Get all cells within range of center
	     */
	    getCellsInRange(center, range) {
	        const results = [];
	        for (let q = -range; q <= range; q++) {
	            for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
	                const s = -q - r;
	                const coord = this.cubeAdd(center, { q, r, s });
	                if (this.isValidCoord(coord)) {
	                    results.push(coord);
	                }
	            }
	        }
	        return results;
	    }
	    /**
	     * Check if coordinate is valid within grid bounds
	     */
	    isValidCoord(coord) {
	        // Validate cube coordinate constraint
	        if (Math.abs(coord.q + coord.r + coord.s) > 0.001) {
	            return false;
	        }
	        // Check distance from origin
	        const distance = this.distance(coord, { q: 0, r: 0, s: 0 });
	        return distance <= this.config.radius;
	    }
	    /**
	     * Check if cell is walkable for pathfinding
	     */
	    isWalkable(coord) {
	        const key = gridCoordToKey(coord);
	        return this.walkable.get(key) ?? true;
	    }
	    /**
	     * Set cell walkability for pathfinding
	     */
	    setWalkable(coord, walkable) {
	        const key = gridCoordToKey(coord);
	        this.walkable.set(key, walkable);
	    }
	    /**
	     * Get movement cost between adjacent cells
	     */
	    getMovementCost(from, to) {
	        // Check if cells are adjacent
	        const distance = this.distance(from, to);
	        if (distance !== 1) {
	            return Infinity;
	        }
	        // Check if destination is walkable
	        if (!this.isWalkable(to)) {
	            return Infinity;
	        }
	        return this.config.defaultMovementCost;
	    }
	    /**
	     * Get all hexes at exact distance from center (ring)
	     */
	    getRing(center, radius) {
	        if (radius === 0) {
	            return [center];
	        }
	        const results = [];
	        // Start at radius steps in one direction
	        let hex = this.cubeAdd(center, this.cubeScale(this.directions[4], radius));
	        // Walk around the ring
	        for (let i = 0; i < 6; i++) {
	            for (let j = 0; j < radius; j++) {
	                if (this.isValidCoord(hex)) {
	                    results.push(hex);
	                }
	                hex = this.cubeAdd(hex, this.directions[i]);
	            }
	        }
	        return results;
	    }
	    /**
	     * Get all hexes up to radius from center (filled spiral)
	     */
	    getSpiral(center, radius) {
	        const results = [center];
	        for (let r = 1; r <= radius; r++) {
	            results.push(...this.getRing(center, r));
	        }
	        return results;
	    }
	    /**
	     * Get hexes along line from start to end
	     */
	    getLine(from, to) {
	        const distance = this.distance(from, to);
	        const results = [];
	        for (let i = 0; i <= distance; i++) {
	            const t = distance === 0 ? 0 : i / distance;
	            results.push(this.cubeLerp(from, to, t));
	        }
	        return results;
	    }
	    /**
	     * Convert cube coordinate to axial (q, r)
	     */
	    cubeToAxial(cube) {
	        return { q: cube.q, r: cube.r };
	    }
	    /**
	     * Convert axial coordinate to cube (q, r, s)
	     */
	    axialToCube(axial) {
	        return { q: axial.q, r: axial.r, s: -axial.q - axial.r };
	    }
	    /**
	     * Calculate distance between two hex coordinates
	     */
	    distance(a, b) {
	        return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
	    }
	    /**
	     * Get hex size (flat-to-flat distance)
	     */
	    getHexSize() {
	        return this.config.hexSize;
	    }
	    /**
	     * Get grid radius
	     */
	    getRadius() {
	        return this.config.radius;
	    }
	    /**
	     * Get hex orientation
	     */
	    getOrientation() {
	        return this.config.orientation;
	    }
	    /**
	     * Get grid origin
	     */
	    getOrigin() {
	        return this.origin.clone();
	    }
	    /**
	     * Get corner positions of a hex in world space
	     */
	    getHexCorners(coord) {
	        const center = this.cellToWorld(coord);
	        const orientation = this.orientations[this.config.orientation];
	        const size = this.config.hexSize;
	        const corners = [];
	        for (let i = 0; i < 6; i++) {
	            const angle = 2.0 * Math.PI * (orientation.startAngle + i) / 6.0;
	            const x = center.x + size * Math.cos(angle);
	            const z = center.z + size * Math.sin(angle);
	            corners.push(new THREE.Vector3(x, center.y, z));
	        }
	        return corners;
	    }
	    // ==================== Private Helper Methods ====================
	    /**
	     * Add two cube coordinates
	     */
	    cubeAdd(a, b) {
	        return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s };
	    }
	    /**
	     * Scale cube coordinate by factor
	     */
	    cubeScale(coord, factor) {
	        return { q: coord.q * factor, r: coord.r * factor, s: coord.s * factor };
	    }
	    /**
	     * Linear interpolation between two cube coordinates
	     */
	    cubeLerp(a, b, t) {
	        return this.cubeRound({
	            q: a.q * (1 - t) + b.q * t,
	            r: a.r * (1 - t) + b.r * t,
	            s: a.s * (1 - t) + b.s * t,
	        });
	    }
	    /**
	     * Round fractional cube coordinates to nearest hex
	     */
	    cubeRound(frac) {
	        let q = Math.round(frac.q);
	        let r = Math.round(frac.r);
	        let s = Math.round(frac.s);
	        const qDiff = Math.abs(q - frac.q);
	        const rDiff = Math.abs(r - frac.r);
	        const sDiff = Math.abs(s - frac.s);
	        // Reset the component with largest rounding error
	        if (qDiff > rDiff && qDiff > sDiff) {
	            q = -r - s;
	        }
	        else if (rDiff > sDiff) {
	            r = -q - s;
	        }
	        else {
	            s = -q - r;
	        }
	        return { q, r, s };
	    }
	}

	/**
	 * GridRenderer - Visualizes grid systems in Three.js
	 * Works with both SquareGrid and HexGrid (when implemented)
	 * Extends THREE.Group so it can be added directly to scene
	 */
	class GridRenderer extends THREE__namespace.Group {
	    constructor(grid, config = {}) {
	        super();
	        this.grid = null;
	        // Visual components
	        this.gridLines = null;
	        this.highlights = new Map();
	        this.filledCells = new Map();
	        // Geometries and materials for cleanup
	        this.geometries = [];
	        this.materials = [];
	        // Set default configuration
	        this.config = {
	            showGrid: config.showGrid ?? true,
	            lineColor: config.lineColor ?? 0x444444,
	            lineAlpha: config.lineAlpha ?? 0.5,
	            lineWidth: config.lineWidth ?? 1,
	            highlightColor: config.highlightColor ?? 0xffff00,
	            cellMaterial: config.cellMaterial ?? 'standard',
	            groundOffset: config.groundOffset ?? 0.01,
	        };
	        if (grid) {
	            this.setGrid(grid);
	        }
	    }
	    /**
	     * Set the grid system to render
	     */
	    setGrid(grid) {
	        this.grid = grid;
	        this.rebuild();
	    }
	    /**
	     * Highlight a single cell
	     */
	    highlightCell(coord, color) {
	        if (!this.grid)
	            return;
	        const key = gridCoordToKey(coord);
	        const highlightColor = color ?? this.config.highlightColor;
	        // Remove existing highlight if present
	        this.clearHighlight(coord);
	        // Create highlight mesh
	        const worldPos = this.grid.cellToWorld(coord);
	        const mesh = this.createHighlightMesh(coord, highlightColor);
	        mesh.position.copy(worldPos);
	        mesh.position.y += this.config.groundOffset;
	        this.add(mesh);
	        this.highlights.set(key, { mesh, color: highlightColor });
	    }
	    /**
	     * Highlight multiple cells
	     */
	    highlightCells(coords, color) {
	        coords.forEach((coord) => this.highlightCell(coord, color));
	    }
	    /**
	     * Clear highlight from a cell
	     */
	    clearHighlight(coord) {
	        const key = gridCoordToKey(coord);
	        const entry = this.highlights.get(key);
	        if (entry) {
	            this.remove(entry.mesh);
	            entry.mesh.geometry.dispose();
	            if (entry.mesh.material instanceof THREE__namespace.Material) {
	                entry.mesh.material.dispose();
	            }
	            this.highlights.delete(key);
	        }
	    }
	    /**
	     * Clear all highlights
	     */
	    clearAllHighlights() {
	        this.highlights.forEach((entry) => {
	            this.remove(entry.mesh);
	            entry.mesh.geometry.dispose();
	            if (entry.mesh.material instanceof THREE__namespace.Material) {
	                entry.mesh.material.dispose();
	            }
	        });
	        this.highlights.clear();
	    }
	    /**
	     * Show a filled cell
	     */
	    showCell(coord, color) {
	        if (!this.grid)
	            return;
	        const key = gridCoordToKey(coord);
	        const cellColor = color ?? 0xffffff;
	        // Remove existing filled cell if present
	        this.hideCell(coord);
	        // Create filled cell mesh
	        const worldPos = this.grid.cellToWorld(coord);
	        const mesh = this.createFilledCellMesh(coord, cellColor);
	        mesh.position.copy(worldPos);
	        this.add(mesh);
	        this.filledCells.set(key, { mesh, color: cellColor });
	    }
	    /**
	     * Hide a filled cell
	     */
	    hideCell(coord) {
	        const key = gridCoordToKey(coord);
	        const entry = this.filledCells.get(key);
	        if (entry) {
	            this.remove(entry.mesh);
	            entry.mesh.geometry.dispose();
	            if (entry.mesh.material instanceof THREE__namespace.Material) {
	                entry.mesh.material.dispose();
	            }
	            this.filledCells.delete(key);
	        }
	    }
	    /**
	     * Rebuild grid lines
	     */
	    rebuild() {
	        // Clear existing grid lines
	        if (this.gridLines) {
	            this.remove(this.gridLines);
	            this.gridLines.geometry.dispose();
	            if (this.gridLines.material instanceof THREE__namespace.Material) {
	                this.gridLines.material.dispose();
	            }
	            this.gridLines = null;
	        }
	        if (!this.grid || !this.config.showGrid)
	            return;
	        // Determine grid type and build appropriate lines
	        const testCoord = this.getTestCoordinate();
	        if (this.isHexCoord(testCoord)) {
	            this.buildHexGridLines();
	        }
	        else {
	            this.buildSquareGridLines();
	        }
	    }
	    /**
	     * Set visibility of grid renderer
	     */
	    setVisible(visible) {
	        this.visible = visible;
	    }
	    /**
	     * Update configuration
	     */
	    updateConfig(config) {
	        Object.assign(this.config, config);
	        this.rebuild();
	    }
	    /**
	     * Get current configuration
	     */
	    getConfig() {
	        return { ...this.config };
	    }
	    /**
	     * Dispose of all resources
	     */
	    dispose() {
	        this.clearAllHighlights();
	        // Dispose filled cells
	        this.filledCells.forEach((entry) => {
	            this.remove(entry.mesh);
	            entry.mesh.geometry.dispose();
	            if (entry.mesh.material instanceof THREE__namespace.Material) {
	                entry.mesh.material.dispose();
	            }
	        });
	        this.filledCells.clear();
	        // Dispose grid lines
	        if (this.gridLines) {
	            this.remove(this.gridLines);
	            this.gridLines.geometry.dispose();
	            if (this.gridLines.material instanceof THREE__namespace.Material) {
	                this.gridLines.material.dispose();
	            }
	            this.gridLines = null;
	        }
	        // Dispose tracked geometries and materials
	        this.geometries.forEach((geom) => geom.dispose());
	        this.materials.forEach((mat) => mat.dispose());
	        this.geometries = [];
	        this.materials = [];
	    }
	    // ============================================================================
	    // PRIVATE METHODS
	    // ============================================================================
	    /**
	     * Build grid lines for square grid
	     */
	    buildSquareGridLines() {
	        if (!this.grid)
	            return;
	        // Get grid dimensions from SquareGrid
	        const squareGrid = this.grid;
	        if (!squareGrid.getDimensions || !squareGrid.getCellSize) {
	            console.warn('Grid does not support SquareGrid methods');
	            return;
	        }
	        const { width, height } = squareGrid.getDimensions();
	        const cellSize = squareGrid.getCellSize();
	        const origin = squareGrid.getOrigin();
	        const positions = [];
	        // Vertical lines
	        for (let x = 0; x <= width; x++) {
	            const worldX = origin.x + x * cellSize;
	            const startZ = origin.z;
	            const endZ = origin.z + height * cellSize;
	            positions.push(worldX, origin.y, startZ);
	            positions.push(worldX, origin.y, endZ);
	        }
	        // Horizontal lines
	        for (let y = 0; y <= height; y++) {
	            const worldZ = origin.z + y * cellSize;
	            const startX = origin.x;
	            const endX = origin.x + width * cellSize;
	            positions.push(startX, origin.y, worldZ);
	            positions.push(endX, origin.y, worldZ);
	        }
	        this.createLineSegments(positions);
	    }
	    /**
	     * Build grid lines for hex grid
	     */
	    buildHexGridLines() {
	        if (!this.grid)
	            return;
	        // Get all cells and draw hexagon outlines
	        const allCells = this.grid.getAllCells();
	        const positions = [];
	        allCells.forEach(({ coord }) => {
	            const hexPositions = this.getHexagonVertices(coord);
	            // Create lines connecting vertices
	            for (let i = 0; i < 6; i++) {
	                const v1 = hexPositions[i];
	                const v2 = hexPositions[(i + 1) % 6];
	                positions.push(v1.x, v1.y, v1.z);
	                positions.push(v2.x, v2.y, v2.z);
	            }
	        });
	        if (positions.length > 0) {
	            this.createLineSegments(positions);
	        }
	    }
	    /**
	     * Create line segments from positions array
	     */
	    createLineSegments(positions) {
	        const geometry = new THREE__namespace.BufferGeometry();
	        geometry.setAttribute('position', new THREE__namespace.Float32BufferAttribute(positions, 3));
	        const material = new THREE__namespace.LineBasicMaterial({
	            color: this.config.lineColor,
	            opacity: this.config.lineAlpha,
	            transparent: this.config.lineAlpha < 1,
	            linewidth: this.config.lineWidth, // Note: linewidth only works in WebGL when using LineSegments2
	        });
	        this.gridLines = new THREE__namespace.LineSegments(geometry, material);
	        this.add(this.gridLines);
	        this.geometries.push(geometry);
	        this.materials.push(material);
	    }
	    /**
	     * Create highlight mesh for a cell
	     */
	    createHighlightMesh(coord, color) {
	        let geometry;
	        if (this.isHexCoord(coord)) {
	            // Hexagon shape
	            const vertices = this.getHexagonVertices(coord);
	            const positions = [];
	            // Create triangle fan
	            const center = this.grid.cellToWorld(coord);
	            for (let i = 0; i < 6; i++) {
	                const v1 = vertices[i];
	                const v2 = vertices[(i + 1) % 6];
	                positions.push(center.x, 0, center.z);
	                positions.push(v1.x, 0, v1.z);
	                positions.push(v2.x, 0, v2.z);
	            }
	            geometry = new THREE__namespace.BufferGeometry();
	            geometry.setAttribute('position', new THREE__namespace.Float32BufferAttribute(positions, 3));
	        }
	        else {
	            // Square shape
	            const squareGrid = this.grid;
	            const cellSize = squareGrid.getCellSize();
	            geometry = new THREE__namespace.PlaneGeometry(cellSize, cellSize);
	            geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane
	        }
	        const material = new THREE__namespace.MeshBasicMaterial({
	            color,
	            transparent: true,
	            opacity: 0.3,
	            side: THREE__namespace.DoubleSide,
	        });
	        this.geometries.push(geometry);
	        this.materials.push(material);
	        return new THREE__namespace.Mesh(geometry, material);
	    }
	    /**
	     * Create filled cell mesh
	     */
	    createFilledCellMesh(coord, color) {
	        let geometry;
	        if (this.isHexCoord(coord)) {
	            // Hexagon shape
	            const vertices = this.getHexagonVertices(coord);
	            const positions = [];
	            // Create triangle fan
	            const center = this.grid.cellToWorld(coord);
	            for (let i = 0; i < 6; i++) {
	                const v1 = vertices[i];
	                const v2 = vertices[(i + 1) % 6];
	                positions.push(center.x, 0, center.z);
	                positions.push(v1.x, 0, v1.z);
	                positions.push(v2.x, 0, v2.z);
	            }
	            geometry = new THREE__namespace.BufferGeometry();
	            geometry.setAttribute('position', new THREE__namespace.Float32BufferAttribute(positions, 3));
	            geometry.computeVertexNormals();
	        }
	        else {
	            // Square shape
	            const squareGrid = this.grid;
	            const cellSize = squareGrid.getCellSize();
	            geometry = new THREE__namespace.PlaneGeometry(cellSize, cellSize);
	            geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane
	        }
	        let material;
	        if (this.config.cellMaterial instanceof THREE__namespace.Material) {
	            material = this.config.cellMaterial.clone();
	            if ('color' in material) {
	                material.color = new THREE__namespace.Color(color);
	            }
	        }
	        else if (this.config.cellMaterial === 'basic') {
	            material = new THREE__namespace.MeshBasicMaterial({ color });
	        }
	        else {
	            material = new THREE__namespace.MeshStandardMaterial({ color });
	        }
	        this.geometries.push(geometry);
	        this.materials.push(material);
	        return new THREE__namespace.Mesh(geometry, material);
	    }
	    /**
	     * Get hexagon vertices for a hex coordinate
	     */
	    getHexagonVertices(coord) {
	        // This is a placeholder - will need proper hex-to-world conversion
	        // when HexGrid is implemented
	        const center = this.grid.cellToWorld(coord);
	        const size = 1; // This should come from HexGrid config
	        const vertices = [];
	        for (let i = 0; i < 6; i++) {
	            const angle = (Math.PI / 3) * i;
	            const x = center.x + size * Math.cos(angle);
	            const z = center.z + size * Math.sin(angle);
	            vertices.push(new THREE__namespace.Vector3(x, center.y, z));
	        }
	        return vertices;
	    }
	    /**
	     * Get a test coordinate to determine grid type
	     */
	    getTestCoordinate() {
	        if (!this.grid) {
	            return { x: 0, y: 0 };
	        }
	        // Try to get any cell
	        const cells = this.grid.getAllCells();
	        const firstCell = cells.values().next().value;
	        if (firstCell) {
	            return firstCell.coord;
	        }
	        // Fallback to origin
	        return { x: 0, y: 0 };
	    }
	    /**
	     * Type guard to check if coordinate is HexCoord
	     */
	    isHexCoord(coord) {
	        return 'q' in coord && 'r' in coord && 's' in coord;
	    }
	}

	/**
	 * Raycasting-based 3D object picker for Three.js scenes.
	 *
	 * Features:
	 * - Screen-to-world raycasting
	 * - Layer-based filtering
	 * - Hover detection with enter/exit events
	 * - Single and multi-object picking
	 * - Configurable sorting and recursion
	 *
	 * @example
	 * ```typescript
	 * const picker = new Object3DPicker(camera, { layers: [0, 1] });
	 * picker.addTargets([cube, sphere]);
	 * picker.on('hover-enter', (obj) => obj.material.color.set(0xff0000));
	 *
	 * const result = picker.pick(mouseX, mouseY);
	 * if (result) {
	 *   console.log('Picked:', result.object.name);
	 * }
	 * ```
	 */
	class Object3DPicker extends EventEmitter {
	    /**
	     * Creates a new Object3DPicker
	     *
	     * @param camera - Camera to use for raycasting
	     * @param config - Optional configuration
	     */
	    constructor(camera, config = {}) {
	        super();
	        this.hoveredObject = null;
	        this.camera = camera;
	        this.raycaster = new THREE__namespace.Raycaster();
	        this.targets = new Set();
	        this.mouse = new THREE__namespace.Vector2();
	        this.canvasWidth = 1;
	        this.canvasHeight = 1;
	        // Merge config with defaults
	        this.config = {
	            layers: config.layers || [0],
	            recursive: config.recursive !== undefined ? config.recursive : true,
	            sortByDistance: config.sortByDistance !== undefined ? config.sortByDistance : true,
	        };
	        // Configure raycaster layers
	        this.updateRaycasterLayers();
	    }
	    /**
	     * Updates raycaster layer mask based on config
	     */
	    updateRaycasterLayers() {
	        this.raycaster.layers.disableAll();
	        for (const layer of this.config.layers) {
	            this.raycaster.layers.enable(layer);
	        }
	    }
	    /**
	     * Normalizes screen coordinates to NDC (-1 to +1)
	     *
	     * @param screenX - Screen X coordinate (0 to canvasWidth)
	     * @param screenY - Screen Y coordinate (0 to canvasHeight)
	     */
	    normalizeCoordinates(screenX, screenY) {
	        this.mouse.x = (screenX / this.canvasWidth) * 2 - 1;
	        this.mouse.y = -(screenY / this.canvasHeight) * 2 + 1;
	    }
	    /**
	     * Converts THREE.Intersection to PickResult
	     */
	    intersectionToPickResult(intersection) {
	        return {
	            object: intersection.object,
	            point: intersection.point.clone(),
	            distance: intersection.distance,
	            face: intersection.face || null,
	            faceIndex: intersection.faceIndex !== undefined ? intersection.faceIndex : null,
	            uv: intersection.uv ? intersection.uv.clone() : null,
	        };
	    }
	    /**
	     * Performs raycast against current targets
	     */
	    performRaycast() {
	        this.raycaster.setFromCamera(this.mouse, this.camera);
	        const targetsArray = Array.from(this.targets);
	        const intersections = this.raycaster.intersectObjects(targetsArray, this.config.recursive);
	        if (this.config.sortByDistance) {
	            intersections.sort((a, b) => a.distance - b.distance);
	        }
	        return intersections;
	    }
	    /**
	     * Adds a target object for picking
	     *
	     * @param object - Object to add
	     */
	    addTarget(object) {
	        this.targets.add(object);
	    }
	    /**
	     * Adds multiple target objects for picking
	     *
	     * @param objects - Objects to add
	     */
	    addTargets(objects) {
	        for (const object of objects) {
	            this.targets.add(object);
	        }
	    }
	    /**
	     * Removes a target object from picking
	     *
	     * @param object - Object to remove
	     */
	    removeTarget(object) {
	        this.targets.delete(object);
	        // Clear hover if removing hovered object
	        if (this.hoveredObject === object) {
	            this.emit('hover-exit', object);
	            this.hoveredObject = null;
	        }
	    }
	    /**
	     * Clears all target objects
	     */
	    clearTargets() {
	        // Clear hover state
	        if (this.hoveredObject) {
	            this.emit('hover-exit', this.hoveredObject);
	            this.hoveredObject = null;
	        }
	        this.targets.clear();
	    }
	    /**
	     * Picks the first object at screen coordinates
	     *
	     * @param screenX - Screen X coordinate (pixels)
	     * @param screenY - Screen Y coordinate (pixels)
	     * @returns Pick result or null if nothing picked
	     */
	    pick(screenX, screenY) {
	        this.normalizeCoordinates(screenX, screenY);
	        const intersections = this.performRaycast();
	        if (intersections.length === 0) {
	            return null;
	        }
	        const result = this.intersectionToPickResult(intersections[0]);
	        this.emit('pick', result);
	        return result;
	    }
	    /**
	     * Picks all objects at screen coordinates
	     *
	     * @param screenX - Screen X coordinate (pixels)
	     * @param screenY - Screen Y coordinate (pixels)
	     * @returns Array of pick results (may be empty)
	     */
	    pickAll(screenX, screenY) {
	        this.normalizeCoordinates(screenX, screenY);
	        const intersections = this.performRaycast();
	        const results = intersections.map((intersection) => this.intersectionToPickResult(intersection));
	        if (results.length > 0) {
	            this.emit('pick', results[0]);
	        }
	        return results;
	    }
	    /**
	     * Updates hover state at screen coordinates.
	     * Call this continuously (e.g., on mousemove) to track hover changes.
	     *
	     * @param screenX - Screen X coordinate (pixels)
	     * @param screenY - Screen Y coordinate (pixels)
	     */
	    updateHover(screenX, screenY) {
	        this.normalizeCoordinates(screenX, screenY);
	        const intersections = this.performRaycast();
	        const newHovered = intersections.length > 0 ? intersections[0].object : null;
	        // Check if hover changed
	        if (newHovered !== this.hoveredObject) {
	            // Exit previous
	            if (this.hoveredObject) {
	                this.emit('hover-exit', this.hoveredObject);
	            }
	            // Enter new
	            if (newHovered) {
	                this.emit('hover-enter', newHovered);
	            }
	            this.hoveredObject = newHovered;
	        }
	    }
	    /**
	     * Sets the camera used for raycasting
	     *
	     * @param camera - New camera
	     */
	    setCamera(camera) {
	        this.camera = camera;
	    }
	    /**
	     * Sets the canvas size for coordinate normalization
	     *
	     * @param width - Canvas width in pixels
	     * @param height - Canvas height in pixels
	     */
	    setCanvasSize(width, height) {
	        this.canvasWidth = Math.max(1, width);
	        this.canvasHeight = Math.max(1, height);
	    }
	    /**
	     * Updates configuration
	     *
	     * @param config - Partial config to merge
	     */
	    updateConfig(config) {
	        if (config.layers !== undefined) {
	            this.config.layers = config.layers;
	            this.updateRaycasterLayers();
	        }
	        if (config.recursive !== undefined) {
	            this.config.recursive = config.recursive;
	        }
	        if (config.sortByDistance !== undefined) {
	            this.config.sortByDistance = config.sortByDistance;
	        }
	    }
	    /**
	     * Gets current configuration
	     */
	    getConfig() {
	        return { ...this.config };
	    }
	    /**
	     * Gets the currently hovered object (if any)
	     */
	    getHoveredObject() {
	        return this.hoveredObject;
	    }
	    /**
	     * Gets the underlying THREE.Raycaster for advanced usage
	     */
	    getRaycaster() {
	        return this.raycaster;
	    }
	    /**
	     * Cleans up resources
	     */
	    dispose() {
	        this.clearTargets();
	        this.removeAllListeners();
	    }
	}

	/**
	 * DragController - Handles 3D object drag and drop with grid snapping
	 *
	 * Features:
	 * - Drag objects in XY, XZ, or YZ planes
	 * - Optional grid snapping
	 * - Ghost preview during drag
	 * - Drop validation
	 * - Full event support
	 *
	 * @example
	 * ```typescript
	 * const dragController = new DragController(camera, {
	 *   plane: 'xz',
	 *   planeHeight: 0,
	 *   snapToGrid: gridSystem,
	 *   showGhost: true,
	 *   validationFn: (obj, pos, coord) => !isOccupied(coord)
	 * });
	 *
	 * dragController.on('drag-end', ({ object, finalPos, valid }) => {
	 *   if (valid) {
	 *     // Place object
	 *   }
	 * });
	 *
	 * // Start drag from pointer event
	 * dragController.startDrag(object, event.clientX, event.clientY);
	 * ```
	 */
	class DragController extends EventEmitter {
	    constructor(camera, config = {}) {
	        super();
	        this.draggedObject = null;
	        this.ghostObject = null;
	        this.startPosition = new THREE__namespace.Vector3();
	        this.currentPosition = new THREE__namespace.Vector3();
	        this._isDragging = false;
	        this.camera = camera;
	        this.config = {
	            plane: config.plane ?? 'xz',
	            planeHeight: config.planeHeight ?? 0,
	            snapToGrid: config.snapToGrid ?? null,
	            showGhost: config.showGhost ?? true,
	            ghostOpacity: config.ghostOpacity ?? 0.5,
	            validationFn: config.validationFn
	        };
	        this.raycaster = new THREE__namespace.Raycaster();
	        this.dragPlane = this.createDragPlane();
	    }
	    /**
	     * Create the constraint plane based on configuration
	     */
	    createDragPlane() {
	        const planeConfig = this.config.plane;
	        if (planeConfig instanceof THREE__namespace.Plane) {
	            return planeConfig;
	        }
	        // Create plane based on string configuration
	        switch (planeConfig) {
	            case 'xy':
	                // XY plane (vertical, facing Z)
	                return new THREE__namespace.Plane(new THREE__namespace.Vector3(0, 0, 1), -this.config.planeHeight);
	            case 'yz':
	                // YZ plane (vertical, facing X)
	                return new THREE__namespace.Plane(new THREE__namespace.Vector3(1, 0, 0), -this.config.planeHeight);
	            case 'xz':
	            default:
	                // XZ plane (horizontal, facing Y)
	                return new THREE__namespace.Plane(new THREE__namespace.Vector3(0, 1, 0), -this.config.planeHeight);
	        }
	    }
	    /**
	     * Calculate world position from screen coordinates using raycasting to plane
	     */
	    screenToWorld(screenX, screenY, target) {
	        // Convert screen coordinates to NDC
	        const rect = this.camera.viewport || { width: window.innerWidth, height: window.innerHeight };
	        const mouse = new THREE__namespace.Vector2((screenX / rect.width) * 2 - 1, -(screenY / rect.height) * 2 + 1);
	        this.raycaster.setFromCamera(mouse, this.camera);
	        return this.raycaster.ray.intersectPlane(this.dragPlane, target) !== null;
	    }
	    /**
	     * Create ghost object from original
	     */
	    createGhost(object) {
	        const ghost = object.clone();
	        // Apply transparency to all materials
	        ghost.traverse((child) => {
	            if (child instanceof THREE__namespace.Mesh) {
	                const material = child.material;
	                if (Array.isArray(material)) {
	                    child.material = material.map((mat) => this.makeTransparent(mat));
	                }
	                else {
	                    child.material = this.makeTransparent(material);
	                }
	            }
	        });
	        return ghost;
	    }
	    /**
	     * Create transparent material clone
	     */
	    makeTransparent(material) {
	        const clone = material.clone();
	        clone.transparent = true;
	        clone.opacity = this.config.ghostOpacity;
	        clone.depthWrite = false;
	        return clone;
	    }
	    /**
	     * Start dragging an object
	     */
	    startDrag(object, screenX, screenY) {
	        if (this._isDragging) {
	            this.cancelDrag();
	        }
	        // Calculate start position
	        if (!this.screenToWorld(screenX, screenY, this.startPosition)) {
	            console.warn('DragController: Failed to calculate start position');
	            return;
	        }
	        this.draggedObject = object;
	        this._isDragging = true;
	        this.currentPosition.copy(this.startPosition);
	        // Create ghost if enabled
	        if (this.config.showGhost && object.parent) {
	            this.ghostObject = this.createGhost(object);
	            this.ghostObject.position.copy(object.position);
	            object.parent.add(this.ghostObject);
	            // Hide original object
	            object.visible = false;
	        }
	        // Emit drag start event
	        this.emit('drag-start', {
	            object,
	            startPos: this.startPosition.clone()
	        });
	    }
	    /**
	     * Update drag position
	     */
	    updateDrag(screenX, screenY) {
	        if (!this._isDragging || !this.draggedObject) {
	            return;
	        }
	        // Calculate new position
	        if (!this.screenToWorld(screenX, screenY, this.currentPosition)) {
	            return;
	        }
	        let targetPos = this.currentPosition.clone();
	        let gridCoord = null;
	        // Apply grid snapping if enabled
	        if (this.config.snapToGrid) {
	            const cellCoord = this.config.snapToGrid.worldToCell(targetPos);
	            const snappedPos = this.config.snapToGrid.cellToWorld(cellCoord);
	            targetPos = snappedPos;
	            gridCoord = 'q' in cellCoord
	                ? { x: cellCoord.q, y: cellCoord.r, z: cellCoord.s }
	                : { x: cellCoord.x, y: cellCoord.y, z: 0 };
	        }
	        // Update ghost position
	        if (this.ghostObject) {
	            this.ghostObject.position.copy(targetPos);
	            // Apply validation visual feedback if validation function exists
	            if (this.config.validationFn) {
	                const isValid = this.config.validationFn(this.draggedObject, targetPos, gridCoord ?? undefined);
	                // Change ghost color based on validity
	                this.ghostObject.traverse((child) => {
	                    if (child instanceof THREE__namespace.Mesh) {
	                        const material = child.material;
	                        if (Array.isArray(material)) {
	                            material.forEach((mat) => {
	                                if ('color' in mat) {
	                                    mat.color.setHex(isValid ? 0x00ff00 : 0xff0000);
	                                }
	                            });
	                        }
	                        else if ('color' in material) {
	                            material.color.setHex(isValid ? 0x00ff00 : 0xff0000);
	                        }
	                    }
	                });
	            }
	        }
	        // Emit drag move event
	        this.emit('drag-move', {
	            object: this.draggedObject,
	            currentPos: targetPos,
	            gridCoord
	        });
	    }
	    /**
	     * End drag and place object
	     */
	    endDrag() {
	        if (!this._isDragging || !this.draggedObject) {
	            return null;
	        }
	        let finalPos = this.currentPosition.clone();
	        let gridCoord = null;
	        // Apply grid snapping
	        if (this.config.snapToGrid) {
	            const cellCoord = this.config.snapToGrid.worldToCell(finalPos);
	            const snappedPos = this.config.snapToGrid.cellToWorld(cellCoord);
	            finalPos = snappedPos;
	            gridCoord = 'q' in cellCoord
	                ? { x: cellCoord.q, y: cellCoord.r, z: cellCoord.s }
	                : { x: cellCoord.x, y: cellCoord.y, z: 0 };
	        }
	        // Validate final position
	        const isValid = this.config.validationFn
	            ? this.config.validationFn(this.draggedObject, finalPos, gridCoord ?? undefined)
	            : true;
	        // Update object position if valid
	        if (isValid) {
	            this.draggedObject.position.copy(finalPos);
	        }
	        // Show original object
	        this.draggedObject.visible = true;
	        // Remove ghost
	        if (this.ghostObject && this.ghostObject.parent) {
	            this.ghostObject.parent.remove(this.ghostObject);
	            this.ghostObject.traverse((child) => {
	                if (child instanceof THREE__namespace.Mesh) {
	                    child.geometry.dispose();
	                    const material = child.material;
	                    if (Array.isArray(material)) {
	                        material.forEach((mat) => mat.dispose());
	                    }
	                    else {
	                        material.dispose();
	                    }
	                }
	            });
	            this.ghostObject = null;
	        }
	        const result = {
	            object: this.draggedObject,
	            finalPos,
	            gridCoord,
	            valid: isValid
	        };
	        this.draggedObject;
	        this.draggedObject = null;
	        this._isDragging = false;
	        // Emit drag end event
	        this.emit('drag-end', result);
	        return result;
	    }
	    /**
	     * Cancel drag without placing object
	     */
	    cancelDrag() {
	        if (!this._isDragging || !this.draggedObject) {
	            return;
	        }
	        // Show original object
	        this.draggedObject.visible = true;
	        // Remove ghost
	        if (this.ghostObject && this.ghostObject.parent) {
	            this.ghostObject.parent.remove(this.ghostObject);
	            this.ghostObject.traverse((child) => {
	                if (child instanceof THREE__namespace.Mesh) {
	                    child.geometry.dispose();
	                    const material = child.material;
	                    if (Array.isArray(material)) {
	                        material.forEach((mat) => mat.dispose());
	                    }
	                    else {
	                        material.dispose();
	                    }
	                }
	            });
	            this.ghostObject = null;
	        }
	        const draggedObject = this.draggedObject;
	        this.draggedObject = null;
	        this._isDragging = false;
	        // Emit drag cancel event
	        this.emit('drag-cancel', { object: draggedObject });
	    }
	    /**
	     * Check if currently dragging
	     */
	    isDragging() {
	        return this._isDragging;
	    }
	    /**
	     * Get currently dragged object
	     */
	    getDraggedObject() {
	        return this.draggedObject;
	    }
	    /**
	     * Update camera reference (e.g., when switching cameras)
	     */
	    setCamera(camera) {
	        this.camera = camera;
	    }
	    /**
	     * Update configuration
	     */
	    updateConfig(config) {
	        Object.assign(this.config, config);
	        // Recreate drag plane if plane config changed
	        if (config.plane !== undefined || config.planeHeight !== undefined) {
	            this.dragPlane = this.createDragPlane();
	        }
	    }
	    /**
	     * Clean up resources
	     */
	    dispose() {
	        if (this._isDragging) {
	            this.cancelDrag();
	        }
	        this.removeAllListeners();
	    }
	}

	/**
	 * Unified touch and mouse gesture handler for Three.js
	 * Supports tap, double-tap, long-press, drag, and pinch gestures
	 */
	class GestureHandler3D extends EventEmitter {
	    constructor(config) {
	        super();
	        this.element = null;
	        this.enabled = true;
	        // Connected components
	        this.cameraController = null;
	        this.objectPicker = null;
	        this.dragController = null;
	        // Touch/Mouse state
	        this.touches = new Map();
	        this.mouseDown = false;
	        this.mouseStartPos = null;
	        this.mouseCurrentPos = null;
	        this.mouseStartTime = 0;
	        // Gesture state
	        this.isDragging = false;
	        this.isPinching = false;
	        this.longPressTimer = null;
	        this.lastTapTime = 0;
	        this.lastTapPos = null;
	        // Velocity tracking
	        this.lastMoveTime = 0;
	        this.lastMovePos = null;
	        this.velocityX = 0;
	        this.velocityY = 0;
	        // Pinch state
	        this.initialPinchDistance = 0;
	        this.lastPinchScale = 1;
	        // Touch Event Handlers
	        this.handleTouchStart = (event) => {
	            if (!this.enabled)
	                return;
	            event.preventDefault();
	            const now = performance.now();
	            for (let i = 0; i < event.changedTouches.length; i++) {
	                const touch = event.changedTouches[i];
	                const pos = this.getScreenPosition(touch);
	                this.touches.set(touch.identifier, {
	                    identifier: touch.identifier,
	                    startPos: pos,
	                    currentPos: pos,
	                    startTime: now,
	                });
	            }
	            // Handle pinch start
	            if (this.config.pinchEnabled && this.touches.size === 2) {
	                this.startPinch();
	            }
	            // Handle potential tap/long-press
	            else if (this.touches.size === 1) {
	                const firstTouch = Array.from(this.touches.values())[0];
	                this.startLongPressTimer(firstTouch.startPos);
	            }
	        };
	        this.handleTouchMove = (event) => {
	            if (!this.enabled)
	                return;
	            event.preventDefault();
	            const now = performance.now();
	            for (let i = 0; i < event.changedTouches.length; i++) {
	                const touch = event.changedTouches[i];
	                const touchData = this.touches.get(touch.identifier);
	                if (!touchData)
	                    continue;
	                const pos = this.getScreenPosition(touch);
	                touchData.currentPos = pos;
	                // Update velocity
	                if (this.lastMovePos && this.lastMoveTime) {
	                    const dt = Math.max(1, now - this.lastMoveTime);
	                    this.velocityX = ((pos.x - this.lastMovePos.x) / dt) * 1000;
	                    this.velocityY = ((pos.y - this.lastMovePos.y) / dt) * 1000;
	                }
	                this.lastMovePos = { ...pos };
	                this.lastMoveTime = now;
	            }
	            // Handle pinch
	            if (this.isPinching && this.touches.size === 2) {
	                this.updatePinch();
	            }
	            // Handle drag
	            else if (this.touches.size === 1) {
	                const firstTouch = Array.from(this.touches.values())[0];
	                const distance = this.getDistance(firstTouch.startPos, firstTouch.currentPos);
	                if (distance > this.config.tapThreshold) {
	                    this.cancelLongPress();
	                    if (!this.isDragging) {
	                        this.startDrag(firstTouch.startPos);
	                    }
	                    this.updateDrag(firstTouch.currentPos, firstTouch.startPos);
	                }
	            }
	        };
	        this.handleTouchEnd = (event) => {
	            if (!this.enabled)
	                return;
	            event.preventDefault();
	            const now = performance.now();
	            for (let i = 0; i < event.changedTouches.length; i++) {
	                const touch = event.changedTouches[i];
	                const touchData = this.touches.get(touch.identifier);
	                if (!touchData)
	                    continue;
	                const distance = this.getDistance(touchData.startPos, touchData.currentPos);
	                const duration = now - touchData.startTime;
	                // Handle tap
	                if (distance <= this.config.tapThreshold && duration <= this.config.tapDuration) {
	                    this.handleTap(touchData.currentPos, now);
	                }
	                this.touches.delete(touch.identifier);
	            }
	            // End pinch
	            if (this.isPinching && this.touches.size < 2) {
	                this.endPinch();
	            }
	            // End drag
	            if (this.isDragging && this.touches.size === 0) {
	                const lastTouch = Array.from(this.touches.values())[0];
	                const pos = lastTouch?.currentPos ?? this.lastMovePos;
	                if (pos) {
	                    this.endDrag(pos);
	                }
	            }
	            this.cancelLongPress();
	            if (this.touches.size === 0) {
	                this.resetVelocity();
	            }
	        };
	        this.handleTouchCancel = (event) => {
	            if (!this.enabled)
	                return;
	            event.preventDefault();
	            for (let i = 0; i < event.changedTouches.length; i++) {
	                const touch = event.changedTouches[i];
	                this.touches.delete(touch.identifier);
	            }
	            if (this.isPinching) {
	                this.endPinch();
	            }
	            if (this.isDragging) {
	                const pos = this.lastMovePos;
	                if (pos) {
	                    this.endDrag(pos);
	                }
	            }
	            this.cancelLongPress();
	            this.resetState();
	        };
	        // Mouse Event Handlers
	        this.handleMouseDown = (event) => {
	            if (!this.enabled)
	                return;
	            event.preventDefault();
	            const pos = this.getScreenPositionMouse(event);
	            const now = performance.now();
	            this.mouseDown = true;
	            this.mouseStartPos = pos;
	            this.mouseCurrentPos = pos;
	            this.mouseStartTime = now;
	            this.startLongPressTimer(pos);
	        };
	        this.handleMouseMove = (event) => {
	            if (!this.enabled || !this.mouseDown)
	                return;
	            const pos = this.getScreenPositionMouse(event);
	            const now = performance.now();
	            this.mouseCurrentPos = pos;
	            // Update velocity
	            if (this.lastMovePos && this.lastMoveTime) {
	                const dt = Math.max(1, now - this.lastMoveTime);
	                this.velocityX = ((pos.x - this.lastMovePos.x) / dt) * 1000;
	                this.velocityY = ((pos.y - this.lastMovePos.y) / dt) * 1000;
	            }
	            this.lastMovePos = { ...pos };
	            this.lastMoveTime = now;
	            if (!this.mouseStartPos)
	                return;
	            const distance = this.getDistance(this.mouseStartPos, pos);
	            if (distance > this.config.tapThreshold) {
	                this.cancelLongPress();
	                if (!this.isDragging) {
	                    this.startDrag(this.mouseStartPos);
	                }
	                this.updateDrag(pos, this.mouseStartPos);
	            }
	        };
	        this.handleMouseUp = (event) => {
	            if (!this.enabled || !this.mouseDown)
	                return;
	            event.preventDefault();
	            const pos = this.getScreenPositionMouse(event);
	            const now = performance.now();
	            if (this.mouseStartPos) {
	                const distance = this.getDistance(this.mouseStartPos, pos);
	                const duration = now - this.mouseStartTime;
	                // Handle tap
	                if (distance <= this.config.tapThreshold && duration <= this.config.tapDuration) {
	                    this.handleTap(pos, now);
	                }
	            }
	            if (this.isDragging) {
	                this.endDrag(pos);
	            }
	            this.cancelLongPress();
	            this.mouseDown = false;
	            this.mouseStartPos = null;
	            this.mouseCurrentPos = null;
	            this.resetVelocity();
	        };
	        this.handleMouseLeave = (event) => {
	            if (!this.enabled || !this.mouseDown)
	                return;
	            const pos = this.getScreenPositionMouse(event);
	            if (this.isDragging) {
	                this.endDrag(pos);
	            }
	            this.cancelLongPress();
	            this.mouseDown = false;
	            this.mouseStartPos = null;
	            this.mouseCurrentPos = null;
	            this.resetVelocity();
	        };
	        this.config = {
	            tapThreshold: config?.tapThreshold ?? 10,
	            tapDuration: config?.tapDuration ?? 300,
	            longPressDelay: config?.longPressDelay ?? 500,
	            doubleTapDelay: config?.doubleTapDelay ?? 300,
	            pinchEnabled: config?.pinchEnabled ?? true,
	            doubleTapEnabled: config?.doubleTapEnabled ?? true,
	        };
	    }
	    /**
	     * Attach gesture handling to a DOM element
	     */
	    attach(element) {
	        this.detach();
	        this.element = element;
	        // Touch events
	        element.addEventListener('touchstart', this.handleTouchStart);
	        element.addEventListener('touchmove', this.handleTouchMove);
	        element.addEventListener('touchend', this.handleTouchEnd);
	        element.addEventListener('touchcancel', this.handleTouchCancel);
	        // Mouse events
	        element.addEventListener('mousedown', this.handleMouseDown);
	        element.addEventListener('mousemove', this.handleMouseMove);
	        element.addEventListener('mouseup', this.handleMouseUp);
	        element.addEventListener('mouseleave', this.handleMouseLeave);
	        // Prevent default touch behaviors
	        element.style.touchAction = 'none';
	    }
	    /**
	     * Detach gesture handling from current element
	     */
	    detach() {
	        if (!this.element)
	            return;
	        this.element.removeEventListener('touchstart', this.handleTouchStart);
	        this.element.removeEventListener('touchmove', this.handleTouchMove);
	        this.element.removeEventListener('touchend', this.handleTouchEnd);
	        this.element.removeEventListener('touchcancel', this.handleTouchCancel);
	        this.element.removeEventListener('mousedown', this.handleMouseDown);
	        this.element.removeEventListener('mousemove', this.handleMouseMove);
	        this.element.removeEventListener('mouseup', this.handleMouseUp);
	        this.element.removeEventListener('mouseleave', this.handleMouseLeave);
	        this.element = null;
	        this.resetState();
	    }
	    /**
	     * Connect camera controller for auto pan/zoom
	     */
	    connectCamera(controller) {
	        this.cameraController = controller;
	    }
	    /**
	     * Connect object picker for auto selection on tap
	     */
	    connectPicker(picker) {
	        this.objectPicker = picker;
	    }
	    /**
	     * Connect drag controller for auto drag handling
	     */
	    connectDragger(dragger) {
	        this.dragController = dragger;
	    }
	    /**
	     * Disconnect all connected components
	     */
	    disconnectAll() {
	        this.cameraController = null;
	        this.objectPicker = null;
	        this.dragController = null;
	    }
	    /**
	     * Enable gesture handling
	     */
	    enable() {
	        this.enabled = true;
	    }
	    /**
	     * Disable gesture handling
	     */
	    disable() {
	        this.enabled = false;
	        this.resetState();
	    }
	    // Gesture Handlers
	    handleTap(pos, now) {
	        let worldPos;
	        // Try to pick object at tap position
	        if (this.objectPicker) {
	            const pickResult = this.objectPicker.pick(pos);
	            if (pickResult?.worldPos) {
	                worldPos = pickResult.worldPos;
	            }
	        }
	        const tapEvent = { screenPos: pos, worldPos };
	        this.emit('tap', tapEvent);
	        // Handle double tap
	        if (this.config.doubleTapEnabled && this.lastTapPos) {
	            const timeSinceLastTap = now - this.lastTapTime;
	            const distanceFromLastTap = this.getDistance(pos, this.lastTapPos);
	            if (timeSinceLastTap <= this.config.doubleTapDelay &&
	                distanceFromLastTap <= this.config.tapThreshold) {
	                const doubleTapEvent = { screenPos: pos, worldPos };
	                this.emit('double-tap', doubleTapEvent);
	                // Reset to prevent triple tap
	                this.lastTapTime = 0;
	                this.lastTapPos = null;
	                return;
	            }
	        }
	        this.lastTapTime = now;
	        this.lastTapPos = pos;
	    }
	    startLongPressTimer(pos) {
	        this.cancelLongPress();
	        this.longPressTimer = window.setTimeout(() => {
	            let worldPos;
	            if (this.objectPicker) {
	                const pickResult = this.objectPicker.pick(pos);
	                if (pickResult?.worldPos) {
	                    worldPos = pickResult.worldPos;
	                }
	            }
	            const event = { screenPos: pos, worldPos };
	            this.emit('long-press', event);
	            this.longPressTimer = null;
	        }, this.config.longPressDelay);
	    }
	    cancelLongPress() {
	        if (this.longPressTimer !== null) {
	            clearTimeout(this.longPressTimer);
	            this.longPressTimer = null;
	        }
	    }
	    startDrag(startPos) {
	        this.isDragging = true;
	        const event = { screenPos: startPos };
	        this.emit('drag-start', event);
	        if (this.dragController) {
	            this.dragController.startDrag(startPos);
	        }
	    }
	    updateDrag(currentPos, startPos) {
	        if (!this.isDragging)
	            return;
	        const delta = {
	            x: currentPos.x - (this.lastMovePos?.x ?? startPos.x),
	            y: currentPos.y - (this.lastMovePos?.y ?? startPos.y),
	        };
	        const event = {
	            screenPos: currentPos,
	            delta,
	            startPos,
	        };
	        this.emit('drag-move', event);
	        // Auto pan camera if connected
	        if (this.cameraController) {
	            this.cameraController.pan(delta.x, delta.y);
	        }
	        if (this.dragController) {
	            this.dragController.updateDrag(currentPos, delta);
	        }
	    }
	    endDrag(endPos) {
	        if (!this.isDragging)
	            return;
	        const velocity = {
	            x: this.velocityX,
	            y: this.velocityY,
	        };
	        const event = {
	            screenPos: endPos,
	            velocity,
	        };
	        this.emit('drag-end', event);
	        if (this.dragController) {
	            this.dragController.endDrag(endPos, velocity);
	        }
	        this.isDragging = false;
	    }
	    startPinch() {
	        const touchArray = Array.from(this.touches.values());
	        if (touchArray.length !== 2)
	            return;
	        this.isPinching = true;
	        this.initialPinchDistance = this.getTouchDistance(touchArray[0], touchArray[1]);
	        this.lastPinchScale = 1;
	        const center = this.getTouchCenter(touchArray[0], touchArray[1]);
	        const event = { center };
	        this.emit('pinch-start', event);
	    }
	    updatePinch() {
	        if (!this.isPinching)
	            return;
	        const touchArray = Array.from(this.touches.values());
	        if (touchArray.length !== 2)
	            return;
	        const currentDistance = this.getTouchDistance(touchArray[0], touchArray[1]);
	        const scale = currentDistance / this.initialPinchDistance;
	        const center = this.getTouchCenter(touchArray[0], touchArray[1]);
	        const event = { scale, center };
	        this.emit('pinch', event);
	        // Auto zoom camera if connected
	        if (this.cameraController) {
	            const scaleDelta = scale - this.lastPinchScale;
	            this.cameraController.zoom(scaleDelta, center);
	        }
	        this.lastPinchScale = scale;
	    }
	    endPinch() {
	        if (!this.isPinching)
	            return;
	        this.isPinching = false;
	        this.initialPinchDistance = 0;
	        this.lastPinchScale = 1;
	        const event = {};
	        this.emit('pinch-end', event);
	    }
	    // Utility Methods
	    getScreenPosition(touch) {
	        if (!this.element)
	            return { x: 0, y: 0 };
	        const rect = this.element.getBoundingClientRect();
	        return {
	            x: touch.clientX - rect.left,
	            y: touch.clientY - rect.top,
	        };
	    }
	    getScreenPositionMouse(event) {
	        if (!this.element)
	            return { x: 0, y: 0 };
	        const rect = this.element.getBoundingClientRect();
	        return {
	            x: event.clientX - rect.left,
	            y: event.clientY - rect.top,
	        };
	    }
	    getDistance(pos1, pos2) {
	        const dx = pos2.x - pos1.x;
	        const dy = pos2.y - pos1.y;
	        return Math.sqrt(dx * dx + dy * dy);
	    }
	    getTouchDistance(touch1, touch2) {
	        return this.getDistance(touch1.currentPos, touch2.currentPos);
	    }
	    getTouchCenter(touch1, touch2) {
	        return {
	            x: (touch1.currentPos.x + touch2.currentPos.x) / 2,
	            y: (touch1.currentPos.y + touch2.currentPos.y) / 2,
	        };
	    }
	    resetState() {
	        this.touches.clear();
	        this.mouseDown = false;
	        this.mouseStartPos = null;
	        this.mouseCurrentPos = null;
	        this.isDragging = false;
	        this.isPinching = false;
	        this.cancelLongPress();
	        this.resetVelocity();
	    }
	    resetVelocity() {
	        this.velocityX = 0;
	        this.velocityY = 0;
	        this.lastMovePos = null;
	        this.lastMoveTime = 0;
	    }
	}

	/**
	 * Billboard - A sprite that always faces the camera
	 *
	 * Features:
	 * - Automatic camera facing
	 * - Optional distance-based scaling
	 * - Fixed screen-space size mode
	 * - Texture loading from path or THREE.Texture
	 * - Offset positioning from parent
	 *
	 * @example
	 * ```typescript
	 * const billboard = new Billboard({
	 *   texture: '/assets/marker.png',
	 *   size: [1, 1],
	 *   offset: [0, 2, 0]
	 * });
	 * billboard.attachTo(player);
	 *
	 * // In game loop
	 * billboard.update(camera);
	 * ```
	 */
	class Billboard extends THREE__namespace.Group {
	    constructor(config) {
	        super();
	        this.parentObject = null;
	        this.loadedTexture = null;
	        // Set defaults
	        this.config = {
	            texture: config.texture,
	            size: config.size,
	            offset: config.offset || [0, 0, 0],
	            scaleWithDistance: config.scaleWithDistance ?? true,
	            fixedSize: config.fixedSize || 100,
	            opacity: config.opacity ?? 1,
	            depthTest: config.depthTest ?? true,
	            depthWrite: config.depthWrite ?? false
	        };
	        this.textureLoader = new THREE__namespace.TextureLoader();
	        // Create material
	        this.material = new THREE__namespace.SpriteMaterial({
	            transparent: true,
	            opacity: this.config.opacity,
	            depthTest: this.config.depthTest,
	            depthWrite: this.config.depthWrite
	        });
	        // Create sprite
	        this.sprite = new THREE__namespace.Sprite(this.material);
	        this.sprite.scale.set(this.config.size[0], this.config.size[1], 1);
	        this.add(this.sprite);
	        // Load texture
	        this._loadTexture(this.config.texture);
	        // Apply offset
	        this.position.set(...this.config.offset);
	    }
	    /**
	     * Attach billboard to a parent object
	     */
	    attachTo(parent) {
	        if (this.parentObject) {
	            this.detach();
	        }
	        this.parentObject = parent;
	        parent.add(this);
	    }
	    /**
	     * Detach billboard from parent
	     */
	    detach() {
	        if (this.parentObject) {
	            this.parentObject.remove(this);
	            this.parentObject = null;
	        }
	    }
	    /**
	     * Update texture
	     */
	    setTexture(texture) {
	        this.config.texture = texture;
	        this._loadTexture(texture);
	    }
	    /**
	     * Update billboard size in world units
	     */
	    setSize(width, height) {
	        this.config.size = [width, height];
	        if (this.config.scaleWithDistance) {
	            this.sprite.scale.set(width, height, 1);
	        }
	    }
	    /**
	     * Update offset from parent position
	     */
	    setOffset(x, y, z) {
	        this.config.offset = [x, y, z];
	        this.position.set(x, y, z);
	    }
	    /**
	     * Update opacity
	     */
	    setOpacity(opacity) {
	        this.config.opacity = Math.max(0, Math.min(1, opacity));
	        this.material.opacity = this.config.opacity;
	    }
	    /**
	     * Update billboard orientation and scale
	     * Call this each frame for proper billboarding
	     */
	    update(camera) {
	        // Billboard always faces camera (handled automatically by THREE.Sprite)
	        // Handle fixed screen-space size mode
	        if (!this.config.scaleWithDistance) {
	            this._updateFixedSize(camera);
	        }
	    }
	    /**
	     * Clean up resources
	     */
	    dispose() {
	        this.detach();
	        if (this.loadedTexture) {
	            this.loadedTexture.dispose();
	            this.loadedTexture = null;
	        }
	        this.material.dispose();
	    }
	    /**
	     * Get the underlying sprite
	     */
	    getSprite() {
	        return this.sprite;
	    }
	    /**
	     * Get the sprite material
	     */
	    getMaterial() {
	        return this.material;
	    }
	    /**
	     * Load texture from string path or use THREE.Texture directly
	     */
	    _loadTexture(texture) {
	        // Dispose previous texture if we loaded it
	        if (this.loadedTexture) {
	            this.loadedTexture.dispose();
	            this.loadedTexture = null;
	        }
	        if (typeof texture === 'string') {
	            // Load from path
	            this.textureLoader.load(texture, (loadedTexture) => {
	                this.loadedTexture = loadedTexture;
	                this.material.map = loadedTexture;
	                this.material.needsUpdate = true;
	            }, undefined, (error) => {
	                console.error(`Failed to load billboard texture: ${texture}`, error);
	            });
	        }
	        else {
	            // Use provided texture directly
	            this.material.map = texture;
	            this.material.needsUpdate = true;
	        }
	    }
	    /**
	     * Calculate and apply fixed screen-space size scaling
	     */
	    _updateFixedSize(camera) {
	        // Get world position
	        const worldPos = new THREE__namespace.Vector3();
	        this.getWorldPosition(worldPos);
	        // Calculate distance to camera
	        const distance = camera.position.distanceTo(worldPos);
	        // Calculate scale factor based on perspective
	        // For perspective camera, objects get smaller with distance
	        // We need to scale up to maintain constant screen size
	        let scaleFactor = 1;
	        if (camera instanceof THREE__namespace.PerspectiveCamera) {
	            // Calculate how much the object would naturally shrink at this distance
	            // and compensate for it
	            const vFOV = (camera.fov * Math.PI) / 180;
	            const height = 2 * Math.tan(vFOV / 2) * distance;
	            const pixelSize = height / window.innerHeight;
	            scaleFactor = (this.config.fixedSize * pixelSize) / this.config.size[1];
	        }
	        else if (camera instanceof THREE__namespace.OrthographicCamera) {
	            // For orthographic camera, use zoom level
	            const height = (camera.top - camera.bottom) / camera.zoom;
	            const pixelSize = height / window.innerHeight;
	            scaleFactor = (this.config.fixedSize * pixelSize) / this.config.size[1];
	        }
	        // Apply scale while maintaining aspect ratio
	        this.config.size[0] / this.config.size[1];
	        this.sprite.scale.set(this.config.size[0] * scaleFactor, this.config.size[1] * scaleFactor, 1);
	    }
	}

	/**
	 * 3D Health Bar Component
	 *
	 * A floating health bar that always faces the camera (billboard behavior).
	 * Supports smooth animations, color transitions, and configurable styling.
	 *
	 * @example
	 * ```typescript
	 * const healthBar = new HealthBar3D({
	 *   width: 2,
	 *   height: 0.2,
	 *   offset: [0, 2.5, 0],
	 *   lowHealthThreshold: 0.25
	 * });
	 *
	 * healthBar.attachTo(characterMesh);
	 *
	 * // In game loop
	 * healthBar.update(camera, deltaTime);
	 *
	 * // Take damage
	 * healthBar.damage(0.1); // -10%
	 * ```
	 */
	class HealthBar3D extends THREE__namespace.Group {
	    constructor(config = {}) {
	        super();
	        this.borderMesh = null;
	        // State
	        this.currentValue = 1.0; // Current displayed value (0-1)
	        this.targetValue = 1.0; // Target value for animation (0-1)
	        this.maxDisplayValue = 100; // For display purposes only
	        this.parentObject = null;
	        // Merge config with defaults
	        this.config = {
	            width: config.width ?? 1.5,
	            height: config.height ?? 0.15,
	            offset: config.offset ?? [0, 2, 0],
	            backgroundColor: config.backgroundColor ?? 0x333333,
	            fillColor: config.fillColor ?? 0x44ff44,
	            lowHealthColor: config.lowHealthColor ?? 0xff4444,
	            lowHealthThreshold: config.lowHealthThreshold ?? 0.3,
	            showBorder: config.showBorder ?? true,
	            borderColor: config.borderColor ?? 0x000000,
	            borderWidth: config.borderWidth ?? 0.02,
	            animated: config.animated ?? true,
	            animationSpeed: config.animationSpeed ?? 5,
	            hideWhenFull: config.hideWhenFull ?? false
	        };
	        // Apply offset
	        this.position.set(...this.config.offset);
	        // Create visual elements
	        this.createBackground();
	        this.createFillBar();
	        if (this.config.showBorder) {
	            this.createBorder();
	        }
	        // Initial visibility
	        this.updateVisibility();
	    }
	    /**
	     * Create background bar mesh
	     */
	    createBackground() {
	        const geometry = new THREE__namespace.PlaneGeometry(this.config.width, this.config.height);
	        this.backgroundMaterial = new THREE__namespace.MeshBasicMaterial({
	            color: this.config.backgroundColor,
	            side: THREE__namespace.DoubleSide,
	            transparent: true,
	            opacity: 0.8
	        });
	        this.backgroundMesh = new THREE__namespace.Mesh(geometry, this.backgroundMaterial);
	        this.add(this.backgroundMesh);
	    }
	    /**
	     * Create fill bar mesh
	     */
	    createFillBar() {
	        const geometry = new THREE__namespace.PlaneGeometry(this.config.width, this.config.height);
	        this.fillMaterial = new THREE__namespace.MeshBasicMaterial({
	            color: this.config.fillColor,
	            side: THREE__namespace.DoubleSide,
	            transparent: true,
	            opacity: 0.9
	        });
	        this.fillMesh = new THREE__namespace.Mesh(geometry, this.fillMaterial);
	        this.fillMesh.position.z = 0.001; // Slightly in front of background
	        this.add(this.fillMesh);
	        this.updateFillBar();
	    }
	    /**
	     * Create border around health bar
	     */
	    createBorder() {
	        const hw = this.config.width / 2;
	        const hh = this.config.height / 2;
	        const points = [
	            new THREE__namespace.Vector3(-hw, -hh, 0),
	            new THREE__namespace.Vector3(hw, -hh, 0),
	            new THREE__namespace.Vector3(hw, hh, 0),
	            new THREE__namespace.Vector3(-hw, hh, 0),
	            new THREE__namespace.Vector3(-hw, -hh, 0)
	        ];
	        const geometry = new THREE__namespace.BufferGeometry().setFromPoints(points);
	        const material = new THREE__namespace.LineBasicMaterial({
	            color: this.config.borderColor,
	            linewidth: this.config.borderWidth
	        });
	        this.borderMesh = new THREE__namespace.LineSegments(geometry, material);
	        this.borderMesh.position.z = 0.002; // In front of fill bar
	        this.add(this.borderMesh);
	    }
	    /**
	     * Update fill bar scale and position based on current value
	     */
	    updateFillBar() {
	        // Scale fill bar horizontally based on health value
	        this.fillMesh.scale.x = Math.max(0, Math.min(1, this.currentValue));
	        // Adjust position so it grows from left to right
	        const offset = (this.config.width * (1 - this.currentValue)) / 2;
	        this.fillMesh.position.x = -offset;
	        // Update color based on health threshold
	        this.updateFillColor();
	    }
	    /**
	     * Update fill bar color based on current health value
	     */
	    updateFillColor() {
	        if (this.currentValue <= this.config.lowHealthThreshold) {
	            // Low health - transition to low health color
	            const t = this.currentValue / this.config.lowHealthThreshold;
	            const currentColor = new THREE__namespace.Color(this.fillMaterial.color);
	            const targetColor = new THREE__namespace.Color(this.config.lowHealthColor);
	            currentColor.lerp(targetColor, 1 - t);
	            this.fillMaterial.color.copy(currentColor);
	        }
	        else {
	            // Normal health
	            this.fillMaterial.color.setHex(this.config.fillColor);
	        }
	    }
	    /**
	     * Update visibility based on hideWhenFull setting
	     */
	    updateVisibility() {
	        if (this.config.hideWhenFull) {
	            this.visible = this.targetValue < 1.0;
	        }
	        else {
	            this.visible = true;
	        }
	    }
	    /**
	     * Attach health bar to a parent object
	     */
	    attachTo(parent) {
	        if (this.parentObject) {
	            this.detach();
	        }
	        this.parentObject = parent;
	        parent.add(this);
	    }
	    /**
	     * Detach health bar from parent object
	     */
	    detach() {
	        if (this.parentObject) {
	            this.parentObject.remove(this);
	            this.parentObject = null;
	        }
	    }
	    /**
	     * Set health value (0-1 normalized)
	     */
	    setValue(value) {
	        this.targetValue = Math.max(0, Math.min(1, value));
	        if (!this.config.animated) {
	            this.currentValue = this.targetValue;
	            this.updateFillBar();
	        }
	        this.updateVisibility();
	    }
	    /**
	     * Get current health value (0-1)
	     */
	    getValue() {
	        return this.targetValue;
	    }
	    /**
	     * Set maximum display value (for UI purposes, internal stays 0-1)
	     */
	    setMaxValue(max) {
	        this.maxDisplayValue = max;
	    }
	    /**
	     * Apply damage (decrease health)
	     */
	    damage(amount) {
	        this.setValue(this.targetValue - amount);
	    }
	    /**
	     * Apply healing (increase health)
	     */
	    heal(amount) {
	        this.setValue(this.targetValue + amount);
	    }
	    /**
	     * Set whether to hide bar when full
	     */
	    setHideWhenFull(hide) {
	        this.config.hideWhenFull = hide;
	        this.updateVisibility();
	    }
	    /**
	     * Update health bar (call in game loop)
	     *
	     * @param camera - Camera for billboard behavior
	     * @param deltaTime - Time since last frame in seconds
	     */
	    update(camera, deltaTime) {
	        // Billboard behavior - face camera
	        this.quaternion.copy(camera.quaternion);
	        // Animate value changes
	        if (this.config.animated && this.currentValue !== this.targetValue) {
	            const diff = this.targetValue - this.currentValue;
	            const step = this.config.animationSpeed * deltaTime;
	            if (Math.abs(diff) < step) {
	                this.currentValue = this.targetValue;
	            }
	            else {
	                this.currentValue += Math.sign(diff) * step;
	            }
	            this.updateFillBar();
	        }
	    }
	    /**
	     * Clean up resources
	     */
	    dispose() {
	        // Dispose geometries
	        this.backgroundMesh.geometry.dispose();
	        this.fillMesh.geometry.dispose();
	        if (this.borderMesh) {
	            this.borderMesh.geometry.dispose();
	            this.borderMesh.material.dispose();
	        }
	        // Dispose materials
	        this.backgroundMaterial.dispose();
	        this.fillMaterial.dispose();
	        // Detach from parent
	        this.detach();
	        // Clear references
	        this.clear();
	    }
	    /**
	     * Get current health as a percentage (0-100)
	     */
	    getHealthPercentage() {
	        return this.targetValue * 100;
	    }
	    /**
	     * Get current health as display value
	     */
	    getDisplayValue() {
	        return Math.round(this.targetValue * this.maxDisplayValue);
	    }
	    /**
	     * Set health from display value
	     */
	    setDisplayValue(value) {
	        this.setValue(value / this.maxDisplayValue);
	    }
	    /**
	     * Check if health is critically low
	     */
	    isCritical() {
	        return this.targetValue <= this.config.lowHealthThreshold;
	    }
	    /**
	     * Check if health is full
	     */
	    isFull() {
	        return this.targetValue >= 1.0;
	    }
	    /**
	     * Check if health is depleted
	     */
	    isEmpty() {
	        return this.targetValue <= 0;
	    }
	}

	/**
	 * Selection indicator for highlighting selected 3D objects
	 * Shows a visual indicator (ring, square, hex) at the base of selected objects
	 */
	class SelectionIndicator extends THREE__namespace.Group {
	    constructor(config = {}) {
	        super();
	        this.pulseTime = 0;
	        // Set defaults
	        this.config = {
	            type: config.type ?? 'ring',
	            size: config.size ?? 1,
	            color: config.color ?? 0x00ff00,
	            opacity: config.opacity ?? 0.6,
	            pulseEnabled: config.pulseEnabled ?? true,
	            pulseSpeed: config.pulseSpeed ?? 2,
	            pulseScale: config.pulseScale ?? [1.0, 1.1],
	            rotateEnabled: config.rotateEnabled ?? false,
	            rotateSpeed: config.rotateSpeed ?? 1,
	            groundOffset: config.groundOffset ?? 0.01,
	            multiSelect: config.multiSelect ?? false,
	            customGeometry: config.customGeometry ?? new THREE__namespace.RingGeometry(0.8, 1, 32),
	        };
	        this.emitter = new EventEmitter();
	        this.selectedObjects = new Map();
	        // Create material
	        this.material = new THREE__namespace.MeshBasicMaterial({
	            color: this.config.color,
	            opacity: this.config.opacity,
	            transparent: true,
	            side: THREE__namespace.DoubleSide,
	            depthWrite: false,
	            depthTest: true,
	        });
	        // Create base geometry based on type
	        this.baseGeometry = this.createGeometry();
	        this.name = 'SelectionIndicator';
	    }
	    /**
	     * Create geometry based on indicator type
	     */
	    createGeometry() {
	        const size = this.config.size;
	        switch (this.config.type) {
	            case 'ring':
	                return new THREE__namespace.RingGeometry(size * 0.8, size, 32);
	            case 'square':
	                return new THREE__namespace.PlaneGeometry(size * 2, size * 2);
	            case 'hex':
	                return this.createHexGeometry(size);
	            case 'custom':
	                return this.config.customGeometry;
	            default:
	                return new THREE__namespace.RingGeometry(size * 0.8, size, 32);
	        }
	    }
	    /**
	     * Create hexagon geometry
	     */
	    createHexGeometry(size) {
	        const shape = new THREE__namespace.Shape();
	        const sides = 6;
	        const angleStep = (Math.PI * 2) / sides;
	        // Create hexagon path
	        for (let i = 0; i <= sides; i++) {
	            const angle = angleStep * i;
	            const x = Math.cos(angle) * size;
	            const y = Math.sin(angle) * size;
	            if (i === 0) {
	                shape.moveTo(x, y);
	            }
	            else {
	                shape.lineTo(x, y);
	            }
	        }
	        // Create inner hole for ring effect
	        const hole = new THREE__namespace.Path();
	        const innerSize = size * 0.8;
	        for (let i = 0; i <= sides; i++) {
	            const angle = angleStep * i;
	            const x = Math.cos(angle) * innerSize;
	            const y = Math.sin(angle) * innerSize;
	            if (i === 0) {
	                hole.moveTo(x, y);
	            }
	            else {
	                hole.lineTo(x, y);
	            }
	        }
	        shape.holes.push(hole);
	        return new THREE__namespace.ShapeGeometry(shape);
	    }
	    /**
	     * Calculate object's ground position
	     */
	    getGroundPosition(object) {
	        const box = new THREE__namespace.Box3().setFromObject(object);
	        const center = new THREE__namespace.Vector3();
	        box.getCenter(center);
	        const height = box.max.y - box.min.y;
	        const groundY = center.y - height / 2 + this.config.groundOffset;
	        return new THREE__namespace.Vector3(center.x, groundY, center.z);
	    }
	    /**
	     * Create indicator mesh for an object
	     */
	    createIndicatorMesh(object) {
	        const mesh = new THREE__namespace.Mesh(this.baseGeometry, this.material);
	        mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
	        mesh.renderOrder = 999; // Render on top
	        const groundPos = this.getGroundPosition(object);
	        mesh.position.copy(groundPos);
	        return mesh;
	    }
	    /**
	     * Select an object (clears previous selection if multiSelect is false)
	     */
	    select(object) {
	        if (!this.config.multiSelect) {
	            this.clearSelection();
	        }
	        if (!this.selectedObjects.has(object)) {
	            const indicator = this.createIndicatorMesh(object);
	            this.add(indicator);
	            this.selectedObjects.set(object, indicator);
	            this.emitter.emit('selected', object);
	            this.emitter.emit('selection-changed', this.getSelection());
	        }
	    }
	    /**
	     * Deselect the current object (if single select) or all objects
	     */
	    deselect() {
	        if (this.config.multiSelect) {
	            this.clearSelection();
	        }
	        else {
	            const objects = Array.from(this.selectedObjects.keys());
	            if (objects.length > 0) {
	                this.removeFromSelection(objects[0]);
	            }
	        }
	    }
	    /**
	     * Add object to selection (for multiSelect mode)
	     */
	    addToSelection(object) {
	        if (!this.selectedObjects.has(object)) {
	            const indicator = this.createIndicatorMesh(object);
	            this.add(indicator);
	            this.selectedObjects.set(object, indicator);
	            this.emitter.emit('selected', object);
	            this.emitter.emit('selection-changed', this.getSelection());
	        }
	    }
	    /**
	     * Remove object from selection
	     */
	    removeFromSelection(object) {
	        const indicator = this.selectedObjects.get(object);
	        if (indicator) {
	            this.remove(indicator);
	            this.selectedObjects.delete(object);
	            this.emitter.emit('deselected', object);
	            this.emitter.emit('selection-changed', this.getSelection());
	        }
	    }
	    /**
	     * Get all selected objects
	     */
	    getSelection() {
	        return Array.from(this.selectedObjects.keys());
	    }
	    /**
	     * Clear all selections
	     */
	    clearSelection() {
	        const objects = Array.from(this.selectedObjects.keys());
	        for (const object of objects) {
	            const indicator = this.selectedObjects.get(object);
	            if (indicator) {
	                this.remove(indicator);
	                this.emitter.emit('deselected', object);
	            }
	        }
	        this.selectedObjects.clear();
	        this.emitter.emit('selection-changed', []);
	    }
	    /**
	     * Check if object is selected
	     */
	    isSelected(object) {
	        return this.selectedObjects.has(object);
	    }
	    /**
	     * Set indicator color
	     */
	    setColor(color) {
	        this.config.color = color;
	        this.material.color.setHex(color);
	    }
	    /**
	     * Set indicator size
	     */
	    setSize(size) {
	        this.config.size = size;
	        // Recreate geometry with new size
	        this.baseGeometry.dispose();
	        this.baseGeometry = this.createGeometry();
	        // Update all existing indicators
	        const entries = Array.from(this.selectedObjects.entries());
	        this.clearSelection();
	        for (const [object] of entries) {
	            this.select(object);
	        }
	    }
	    /**
	     * Update animations (call each frame)
	     */
	    update(deltaTime) {
	        if (this.selectedObjects.size === 0)
	            return;
	        // Update pulse animation
	        if (this.config.pulseEnabled) {
	            this.pulseTime += deltaTime * this.config.pulseSpeed;
	            const pulseValue = Math.sin(this.pulseTime) * 0.5 + 0.5; // 0 to 1
	            const [minScale, maxScale] = this.config.pulseScale;
	            const scale = minScale + (maxScale - minScale) * pulseValue;
	            for (const indicator of this.selectedObjects.values()) {
	                indicator.scale.setScalar(scale);
	            }
	        }
	        // Update rotation animation
	        if (this.config.rotateEnabled) {
	            const rotationDelta = deltaTime * this.config.rotateSpeed;
	            for (const indicator of this.selectedObjects.values()) {
	                indicator.rotation.z += rotationDelta;
	            }
	        }
	        // Update positions to follow objects
	        for (const [object, indicator] of this.selectedObjects.entries()) {
	            const groundPos = this.getGroundPosition(object);
	            indicator.position.copy(groundPos);
	        }
	    }
	    /**
	     * Add event listener
	     */
	    on(event, listener) {
	        this.emitter.on(event, listener);
	        return this;
	    }
	    /**
	     * Remove event listener
	     */
	    off(event, listener) {
	        this.emitter.off(event, listener);
	        return this;
	    }
	    /**
	     * Add one-time event listener
	     */
	    once(event, listener) {
	        this.emitter.once(event, listener);
	        return this;
	    }
	    /**
	     * Clean up resources
	     */
	    dispose() {
	        this.clearSelection();
	        this.baseGeometry.dispose();
	        this.material.dispose();
	        this.emitter.removeAllListeners();
	    }
	}

	/**
	 * FloatingText - Damage numbers, XP gains, status text with animations
	 *
	 * Features:
	 * - Object pooling for performance
	 * - Multiple animation types (rise-fade, pop, bounce)
	 * - Billboard behavior (always faces camera)
	 * - Canvas-based text rendering with stroke support
	 * - Configurable appearance and behavior
	 *
	 * @example
	 * ```typescript
	 * const floatingText = new FloatingText({
	 *   font: 'bold 32px Arial',
	 *   color: 0xFFFF00,
	 *   animation: 'pop',
	 *   duration: 1500
	 * });
	 * scene.add(floatingText);
	 *
	 * // Spawn damage number
	 * floatingText.spawn(
	 *   new THREE.Vector3(0, 0, 0),
	 *   '-150',
	 *   { color: 0xFF0000, scale: 1.5 }
	 * );
	 *
	 * // Update in game loop
	 * floatingText.update(camera, deltaTime);
	 * ```
	 */
	class FloatingText extends THREE__namespace.Group {
	    constructor(config = {}) {
	        super();
	        this.pool = [];
	        this.activeInstances = [];
	        this.canvasCache = new Map();
	        // Apply defaults
	        this.config = {
	            font: config.font ?? 'bold 24px Arial',
	            color: config.color ?? 0xffffff,
	            stroke: config.stroke ?? 0x000000,
	            strokeWidth: config.strokeWidth ?? 3,
	            offset: config.offset ?? [0, 2, 0],
	            animation: config.animation ?? 'rise-fade',
	            duration: config.duration ?? 1000,
	            riseDistance: config.riseDistance ?? 1,
	            poolSize: config.poolSize ?? 20,
	        };
	        this.initializePool();
	    }
	    /**
	     * Initialize the object pool with pre-allocated sprites
	     */
	    initializePool() {
	        for (let i = 0; i < this.config.poolSize; i++) {
	            const sprite = new THREE__namespace.Sprite(new THREE__namespace.SpriteMaterial({
	                transparent: true,
	                opacity: 1,
	                depthTest: false,
	                depthWrite: false,
	            }));
	            sprite.visible = false;
	            this.add(sprite);
	            const instance = {
	                sprite,
	                startPosition: new THREE__namespace.Vector3(),
	                startTime: 0,
	                duration: 0,
	                animation: 'none',
	                riseDistance: 0,
	                startScale: 1,
	                active: false,
	            };
	            this.pool.push(instance);
	        }
	    }
	    /**
	     * Spawn a floating text at the specified position
	     */
	    spawn(position, text, options = {}) {
	        // Get instance from pool
	        const instance = this.getInstanceFromPool();
	        if (!instance) {
	            console.warn('FloatingText: Pool exhausted, cannot spawn text');
	            return;
	        }
	        // Apply configuration
	        const color = options.color ?? this.config.color;
	        const scale = options.scale ?? 1;
	        const animation = options.animation ?? this.config.animation;
	        const duration = options.duration ?? this.config.duration;
	        // Create or retrieve canvas texture
	        const texture = this.createTextTexture(text, color);
	        instance.sprite.material.map = texture;
	        instance.sprite.material.needsUpdate = true;
	        // Position with offset
	        instance.startPosition.copy(position);
	        instance.startPosition.x += this.config.offset[0];
	        instance.startPosition.y += this.config.offset[1];
	        instance.startPosition.z += this.config.offset[2];
	        instance.sprite.position.copy(instance.startPosition);
	        // Calculate scale based on texture size
	        const aspectRatio = texture.image.width / texture.image.height;
	        const baseScale = 0.5; // Base world unit scale
	        instance.startScale = baseScale * scale;
	        instance.sprite.scale.set(instance.startScale * aspectRatio, instance.startScale, 1);
	        // Configure animation
	        instance.startTime = performance.now();
	        instance.duration = duration;
	        instance.animation = animation;
	        instance.riseDistance = this.config.riseDistance;
	        instance.active = true;
	        instance.sprite.visible = true;
	        // Add to active list
	        this.activeInstances.push(instance);
	    }
	    /**
	     * Update all active floating texts
	     */
	    update(camera, deltaTime) {
	        const currentTime = performance.now();
	        const instancesToRemove = [];
	        for (const instance of this.activeInstances) {
	            const elapsed = currentTime - instance.startTime;
	            const progress = Math.min(elapsed / instance.duration, 1);
	            // Update animation
	            this.updateAnimation(instance, progress);
	            // Billboard effect - face camera
	            instance.sprite.quaternion.copy(camera.quaternion);
	            // Mark for removal if complete
	            if (progress >= 1) {
	                instancesToRemove.push(instance);
	            }
	        }
	        // Remove completed instances
	        for (const instance of instancesToRemove) {
	            this.returnInstanceToPool(instance);
	        }
	    }
	    /**
	     * Update individual instance based on animation type
	     */
	    updateAnimation(instance, progress) {
	        const easeOut = 1 - Math.pow(1 - progress, 2);
	        switch (instance.animation) {
	            case 'rise-fade': {
	                // Float upward while fading
	                const offset = easeOut * instance.riseDistance;
	                instance.sprite.position.copy(instance.startPosition);
	                instance.sprite.position.y += offset;
	                instance.sprite.material.opacity = 1 - progress;
	                break;
	            }
	            case 'pop': {
	                // Scale up quickly then shrink while fading
	                const scale = progress < 0.3
	                    ? 1 + (progress / 0.3) * 0.5 // Grow to 1.5x
	                    : 1.5 - ((progress - 0.3) / 0.7) * 0.5; // Shrink back to 1x
	                const map = instance.sprite.material.map;
	                const aspectRatio = map?.image ? map.image.width / map.image.height : 1;
	                instance.sprite.scale.set(instance.startScale * scale * aspectRatio, instance.startScale * scale, 1);
	                instance.sprite.material.opacity = 1 - progress;
	                break;
	            }
	            case 'bounce': {
	                // Bounce up and down while fading
	                const bounceHeight = Math.sin(progress * Math.PI) * instance.riseDistance;
	                instance.sprite.position.copy(instance.startPosition);
	                instance.sprite.position.y += bounceHeight;
	                instance.sprite.material.opacity = 1 - progress;
	                break;
	            }
	            case 'none': {
	                // Just fade out
	                instance.sprite.material.opacity = 1 - progress;
	                break;
	            }
	        }
	    }
	    /**
	     * Create a canvas texture for the given text
	     */
	    createTextTexture(text, color) {
	        // Create cache key
	        const cacheKey = `${text}_${color.toString(16)}`;
	        // Check cache
	        let canvas = this.canvasCache.get(cacheKey);
	        if (!canvas) {
	            canvas = this.renderTextToCanvas(text, color);
	            this.canvasCache.set(cacheKey, canvas);
	        }
	        const texture = new THREE__namespace.CanvasTexture(canvas);
	        texture.needsUpdate = true;
	        return texture;
	    }
	    /**
	     * Render text to a canvas element
	     */
	    renderTextToCanvas(text, color) {
	        const canvas = document.createElement('canvas');
	        const ctx = canvas.getContext('2d');
	        // Set font to measure text
	        ctx.font = this.config.font;
	        const metrics = ctx.measureText(text);
	        const textWidth = metrics.width;
	        const textHeight = parseInt(this.config.font.match(/\d+/)?.[0] ?? '24', 10);
	        // Set canvas size with padding
	        const padding = this.config.strokeWidth * 2;
	        canvas.width = textWidth + padding * 2;
	        canvas.height = textHeight + padding * 2;
	        // Re-set font after canvas resize (resets context)
	        ctx.font = this.config.font;
	        ctx.textBaseline = 'top';
	        ctx.textAlign = 'left';
	        // Draw stroke
	        if (this.config.strokeWidth > 0) {
	            ctx.strokeStyle = `#${this.config.stroke.toString(16).padStart(6, '0')}`;
	            ctx.lineWidth = this.config.strokeWidth * 2;
	            ctx.lineJoin = 'round';
	            ctx.miterLimit = 2;
	            ctx.strokeText(text, padding, padding);
	        }
	        // Draw fill
	        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
	        ctx.fillText(text, padding, padding);
	        return canvas;
	    }
	    /**
	     * Get an available instance from the pool
	     */
	    getInstanceFromPool() {
	        for (const instance of this.pool) {
	            if (!instance.active) {
	                return instance;
	            }
	        }
	        return null;
	    }
	    /**
	     * Return an instance to the pool
	     */
	    returnInstanceToPool(instance) {
	        instance.active = false;
	        instance.sprite.visible = false;
	        instance.sprite.material.opacity = 1;
	        // Remove from active list
	        const index = this.activeInstances.indexOf(instance);
	        if (index !== -1) {
	            this.activeInstances.splice(index, 1);
	        }
	    }
	    /**
	     * Clear all active floating texts
	     */
	    clearAll() {
	        for (const instance of this.activeInstances) {
	            this.returnInstanceToPool(instance);
	        }
	        this.activeInstances = [];
	    }
	    /**
	     * Dispose of all resources
	     */
	    dispose() {
	        this.clearAll();
	        // Dispose sprites
	        for (const instance of this.pool) {
	            if (instance.sprite.material.map) {
	                instance.sprite.material.map.dispose();
	            }
	            instance.sprite.material.dispose();
	        }
	        // Clear cache
	        this.canvasCache.clear();
	        this.pool = [];
	    }
	}

	/**
	 * ObjectPool3D - Generic object pooling for THREE.Object3D instances
	 *
	 * Manages a pool of reusable 3D objects to reduce garbage collection and improve performance.
	 * Supports automatic scene management, lifecycle callbacks, and object recycling.
	 *
	 * @example
	 * ```typescript
	 * const enemyPool = new ObjectPool3D({
	 *   factory: () => createEnemyMesh(),
	 *   initialSize: 20,
	 *   maxSize: 100,
	 *   autoAddToScene: scene,
	 *   onAcquire: (enemy) => {
	 *     enemy.userData.health = 100;
	 *     enemy.visible = true;
	 *   },
	 *   onRelease: (enemy) => {
	 *     enemy.visible = false;
	 *   }
	 * });
	 *
	 * const enemy = enemyPool.acquire();
	 * // ... use enemy ...
	 * enemyPool.release(enemy);
	 * ```
	 */
	/**
	 * ObjectPool3D - Generic object pooling for THREE.Object3D
	 */
	class ObjectPool3D {
	    constructor(config) {
	        this.available = [];
	        this.active = new Set();
	        this.factory = config.factory;
	        this.initialSize = config.initialSize ?? 10;
	        this.maxSize = config.maxSize ?? 100;
	        this.onAcquire = config.onAcquire;
	        this.onRelease = config.onRelease;
	        this.autoAddToScene = config.autoAddToScene;
	        // Pre-allocate initial objects
	        this.warmup(this.initialSize);
	    }
	    /**
	     * Pre-create objects and add them to the pool
	     */
	    warmup(count) {
	        const toCreate = Math.min(count, this.maxSize - this.getTotalCount());
	        for (let i = 0; i < toCreate; i++) {
	            const obj = this.factory();
	            this.available.push(obj);
	        }
	    }
	    /**
	     * Get an object from the pool (creates new if pool is empty and under max size)
	     */
	    acquire() {
	        let obj;
	        if (this.available.length > 0) {
	            // Reuse object from pool
	            obj = this.available.pop();
	        }
	        else if (this.getTotalCount() < this.maxSize) {
	            // Create new object if under max size
	            obj = this.factory();
	        }
	        else {
	            // Pool exhausted - reuse oldest active object (emergency fallback)
	            const oldest = this.active.values().next().value;
	            if (oldest) {
	                this.release(oldest);
	                obj = this.available.pop();
	            }
	            else {
	                // Should never happen, but create new object as last resort
	                obj = this.factory();
	            }
	        }
	        // Track as active
	        this.active.add(obj);
	        // Reset transform
	        obj.position.set(0, 0, 0);
	        obj.rotation.set(0, 0, 0);
	        obj.scale.set(1, 1, 1);
	        // Auto add to scene
	        if (this.autoAddToScene) {
	            this.autoAddToScene.add(obj);
	        }
	        // Call acquire callback
	        if (this.onAcquire) {
	            this.onAcquire(obj);
	        }
	        return obj;
	    }
	    /**
	     * Return an object to the pool
	     */
	    release(obj) {
	        // Check if object is tracked
	        if (!this.active.has(obj)) {
	            console.warn('ObjectPool3D: Attempting to release object not acquired from this pool');
	            return;
	        }
	        // Remove from active set
	        this.active.delete(obj);
	        // Call release callback
	        if (this.onRelease) {
	            this.onRelease(obj);
	        }
	        // Auto remove from scene
	        if (this.autoAddToScene && obj.parent === this.autoAddToScene) {
	            this.autoAddToScene.remove(obj);
	        }
	        // Reset transform
	        obj.position.set(0, 0, 0);
	        obj.rotation.set(0, 0, 0);
	        obj.scale.set(1, 1, 1);
	        // Return to pool
	        this.available.push(obj);
	    }
	    /**
	     * Release all active objects back to the pool
	     */
	    releaseAll() {
	        // Create array copy to avoid modification during iteration
	        const activeObjects = Array.from(this.active);
	        for (const obj of activeObjects) {
	            this.release(obj);
	        }
	    }
	    /**
	     * Get number of active (in-use) objects
	     */
	    getActiveCount() {
	        return this.active.size;
	    }
	    /**
	     * Get number of available (pooled) objects
	     */
	    getAvailableCount() {
	        return this.available.length;
	    }
	    /**
	     * Get total number of objects (active + available)
	     */
	    getTotalCount() {
	        return this.active.size + this.available.length;
	    }
	    /**
	     * Dispose all objects and clear the pool
	     */
	    destroy() {
	        // Release all active objects first
	        this.releaseAll();
	        // Dispose all objects
	        for (const obj of this.available) {
	            this.disposeObject(obj);
	        }
	        // Clear arrays
	        this.available = [];
	        this.active.clear();
	    }
	    /**
	     * Recursively dispose geometries and materials in an object hierarchy
	     */
	    disposeObject(obj) {
	        obj.traverse((child) => {
	            // Dispose geometry
	            if (child.geometry) {
	                child.geometry.dispose();
	            }
	            // Dispose material(s)
	            if (child.material) {
	                const materials = Array.isArray(child.material)
	                    ? child.material
	                    : [child.material];
	                for (const material of materials) {
	                    // Dispose textures
	                    if (material.map)
	                        material.map.dispose();
	                    if (material.lightMap)
	                        material.lightMap.dispose();
	                    if (material.bumpMap)
	                        material.bumpMap.dispose();
	                    if (material.normalMap)
	                        material.normalMap.dispose();
	                    if (material.specularMap)
	                        material.specularMap.dispose();
	                    if (material.envMap)
	                        material.envMap.dispose();
	                    if (material.alphaMap)
	                        material.alphaMap.dispose();
	                    if (material.aoMap)
	                        material.aoMap.dispose();
	                    if (material.displacementMap)
	                        material.displacementMap.dispose();
	                    if (material.emissiveMap)
	                        material.emissiveMap.dispose();
	                    if (material.gradientMap)
	                        material.gradientMap.dispose();
	                    if (material.metalnessMap)
	                        material.metalnessMap.dispose();
	                    if (material.roughnessMap)
	                        material.roughnessMap.dispose();
	                    // Dispose material
	                    material.dispose();
	                }
	            }
	        });
	        // Remove from parent if attached
	        if (obj.parent) {
	            obj.parent.remove(obj);
	        }
	    }
	}

	/**
	 * A* pathfinding implementation for grid-based movement
	 * Works with both square and hexagonal grids through IGridSystem abstraction
	 */
	class Pathfinder {
	    constructor(config) {
	        this.grid = config.grid;
	        this.allowDiagonals = config.allowDiagonals ?? true;
	        this.diagonalCost = config.diagonalCost ?? 1.414; // √2
	        this.heuristic = config.heuristic ?? 'manhattan';
	        this.maxIterations = config.maxIterations ?? 1000;
	    }
	    /**
	     * Find path from start to end using A* algorithm
	     * @returns Array of coordinates forming the path, or null if no path exists
	     */
	    findPath(start, end, options) {
	        // Validate coordinates
	        if (!this.grid.isValidCoord(start) || !this.grid.isValidCoord(end)) {
	            return null;
	        }
	        if (!this.grid.isWalkable(start) || !this.grid.isWalkable(end)) {
	            return null;
	        }
	        // Check if start equals end
	        if (this.coordsEqual(start, end)) {
	            return [start];
	        }
	        // Convert avoid coords to set for faster lookup
	        const avoidSet = new Set();
	        if (options?.avoidCoords) {
	            options.avoidCoords.forEach((coord) => {
	                avoidSet.add(gridCoordToKey(coord));
	            });
	        }
	        const openSet = [];
	        const closedSet = new Set();
	        const cameFrom = new Map();
	        const gScore = new Map();
	        const startKey = gridCoordToKey(start);
	        const endKey = gridCoordToKey(end);
	        // Initialize start node
	        gScore.set(startKey, 0);
	        openSet.push({
	            coord: start,
	            gScore: 0,
	            fScore: this.calculateHeuristic(start, end),
	        });
	        let iterations = 0;
	        while (openSet.length > 0 && iterations < this.maxIterations) {
	            iterations++;
	            // Get node with lowest fScore
	            openSet.sort((a, b) => a.fScore - b.fScore);
	            const current = openSet.shift();
	            const currentKey = gridCoordToKey(current.coord);
	            // Check if we reached the goal
	            if (currentKey === endKey) {
	                return this.reconstructPath(cameFrom, current.coord);
	            }
	            closedSet.add(currentKey);
	            // Check neighbors
	            const neighbors = this.grid.getNeighbors(current.coord);
	            for (const neighbor of neighbors) {
	                const neighborKey = gridCoordToKey(neighbor);
	                // Skip if already evaluated
	                if (closedSet.has(neighborKey)) {
	                    continue;
	                }
	                // Skip if should avoid
	                if (avoidSet.has(neighborKey)) {
	                    continue;
	                }
	                // Skip if not walkable
	                if (!this.grid.isWalkable(neighbor)) {
	                    continue;
	                }
	                // Calculate tentative gScore
	                const movementCost = this.grid.getMovementCost(current.coord, neighbor);
	                if (movementCost === Infinity) {
	                    continue;
	                }
	                const tentativeGScore = current.gScore + movementCost;
	                // Check max cost constraint
	                if (options?.maxCost !== undefined && tentativeGScore > options.maxCost) {
	                    continue;
	                }
	                // Check if this path to neighbor is better
	                const neighborGScore = gScore.get(neighborKey) ?? Infinity;
	                if (tentativeGScore < neighborGScore) {
	                    // This is a better path
	                    cameFrom.set(neighborKey, current.coord);
	                    gScore.set(neighborKey, tentativeGScore);
	                    const hScore = this.calculateHeuristic(neighbor, end);
	                    const fScore = tentativeGScore + hScore;
	                    // Add to or update in open set
	                    const existingIndex = openSet.findIndex((node) => gridCoordToKey(node.coord) === neighborKey);
	                    if (existingIndex === -1) {
	                        openSet.push({
	                            coord: neighbor,
	                            gScore: tentativeGScore,
	                            fScore,
	                        });
	                    }
	                    else {
	                        openSet[existingIndex].gScore = tentativeGScore;
	                        openSet[existingIndex].fScore = fScore;
	                    }
	                }
	            }
	        }
	        // No path found
	        return null;
	    }
	    /**
	     * Check if end is reachable from start (faster than findPath)
	     */
	    canReach(start, end, options) {
	        // Simple check - try to find path with reduced iterations
	        const originalMaxIterations = this.maxIterations;
	        this.maxIterations = Math.min(100, this.maxIterations);
	        const path = this.findPath(start, end, options);
	        this.maxIterations = originalMaxIterations;
	        return path !== null;
	    }
	    /**
	     * Get all cells reachable from start within maxCost
	     * Useful for showing movement range
	     */
	    getReachableCells(start, maxCost) {
	        if (!this.grid.isValidCoord(start) || !this.grid.isWalkable(start)) {
	            return [];
	        }
	        const reachable = [];
	        const visited = new Set();
	        const queue = [{ coord: start, cost: 0 }];
	        visited.add(gridCoordToKey(start));
	        while (queue.length > 0) {
	            const current = queue.shift();
	            reachable.push(current.coord);
	            const neighbors = this.grid.getNeighbors(current.coord);
	            for (const neighbor of neighbors) {
	                const neighborKey = gridCoordToKey(neighbor);
	                if (visited.has(neighborKey)) {
	                    continue;
	                }
	                if (!this.grid.isWalkable(neighbor)) {
	                    continue;
	                }
	                const movementCost = this.grid.getMovementCost(current.coord, neighbor);
	                if (movementCost === Infinity) {
	                    continue;
	                }
	                const totalCost = current.cost + movementCost;
	                if (totalCost <= maxCost) {
	                    visited.add(neighborKey);
	                    queue.push({ coord: neighbor, cost: totalCost });
	                }
	            }
	        }
	        return reachable;
	    }
	    /**
	     * Create a visual debug line for a path
	     */
	    createPathLine(path, options) {
	        const color = options?.color ?? 0x00ff00;
	        const lineWidth = options?.lineWidth ?? 2;
	        const yOffset = options?.yOffset ?? 0.1;
	        const points = [];
	        for (const coord of path) {
	            const worldPos = this.grid.cellToWorld(coord);
	            points.push(new THREE__namespace.Vector3(worldPos.x, worldPos.y + yOffset, worldPos.z));
	        }
	        const geometry = new THREE__namespace.BufferGeometry().setFromPoints(points);
	        const material = new THREE__namespace.LineBasicMaterial({
	            color,
	            linewidth: lineWidth,
	        });
	        return new THREE__namespace.Line(geometry, material);
	    }
	    /**
	     * Reconstruct path from came-from map
	     */
	    reconstructPath(cameFrom, current) {
	        const path = [current];
	        let currentKey = gridCoordToKey(current);
	        while (cameFrom.has(currentKey)) {
	            current = cameFrom.get(currentKey);
	            path.unshift(current);
	            currentKey = gridCoordToKey(current);
	        }
	        return path;
	    }
	    /**
	     * Calculate heuristic distance between two coordinates
	     */
	    calculateHeuristic(from, to) {
	        // For hex grids, use cube distance
	        if ('q' in from && 'q' in to) {
	            const fromHex = from;
	            const toHex = to;
	            return (Math.abs(fromHex.q - toHex.q) +
	                Math.abs(fromHex.r - toHex.r) +
	                Math.abs(fromHex.s - toHex.s)) / 2;
	        }
	        // For square grids, use selected heuristic
	        const fromGrid = from;
	        const toGrid = to;
	        const dx = Math.abs(fromGrid.x - toGrid.x);
	        const dy = Math.abs(fromGrid.y - toGrid.y);
	        switch (this.heuristic) {
	            case 'manhattan':
	                return dx + dy;
	            case 'euclidean':
	                return Math.sqrt(dx * dx + dy * dy);
	            case 'chebyshev':
	                return Math.max(dx, dy);
	            default:
	                return dx + dy;
	        }
	    }
	    /**
	     * Check if two coordinates are equal
	     */
	    coordsEqual(a, b) {
	        return gridCoordToKey(a) === gridCoordToKey(b);
	    }
	    /**
	     * Update configuration
	     */
	    setConfig(config) {
	        if (config.grid !== undefined) {
	            this.grid = config.grid;
	        }
	        if (config.allowDiagonals !== undefined) {
	            this.allowDiagonals = config.allowDiagonals;
	        }
	        if (config.diagonalCost !== undefined) {
	            this.diagonalCost = config.diagonalCost;
	        }
	        if (config.heuristic !== undefined) {
	            this.heuristic = config.heuristic;
	        }
	        if (config.maxIterations !== undefined) {
	            this.maxIterations = config.maxIterations;
	        }
	    }
	    /**
	     * Get current configuration
	     */
	    getConfig() {
	        return {
	            grid: this.grid,
	            allowDiagonals: this.allowDiagonals,
	            diagonalCost: this.diagonalCost,
	            heuristic: this.heuristic,
	            maxIterations: this.maxIterations,
	        };
	    }
	}

	/**
	 * Per-entity instance of a state machine.
	 * Manages state transitions, lifecycle callbacks, and history tracking.
	 * @template T - The entity type this instance operates on
	 */
	class StateMachineInstance extends EventEmitter {
	    /**
	     * Creates a new state machine instance for an entity
	     * @param entity - The entity this state machine controls
	     * @param config - The state machine configuration
	     */
	    constructor(entity, config) {
	        super();
	        this.stateHistory = [];
	        this.maxHistorySize = 10;
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
	    update(deltaTime) {
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
	    trigger(event) {
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
	    getCurrentState() {
	        return this.currentState;
	    }
	    /**
	     * Gets the state history (most recent first)
	     * @returns Array of recent state names
	     */
	    getStateHistory() {
	        return [...this.stateHistory];
	    }
	    /**
	     * Checks if a trigger event can cause a transition from current state
	     * @param event - The trigger event name
	     * @returns true if transition is possible
	     */
	    canTrigger(event) {
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
	    forceState(stateName) {
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
	    transitionTo(nextState, trigger) {
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
	    enterState(stateName) {
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
	    exitState(stateName) {
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
	    addToHistory(stateName) {
	        this.stateHistory.unshift(stateName);
	        if (this.stateHistory.length > this.maxHistorySize) {
	            this.stateHistory.pop();
	        }
	    }
	    /**
	     * Gets the entity this state machine controls
	     * @returns The entity instance
	     */
	    getEntity() {
	        return this.entity;
	    }
	    /**
	     * Destroys the state machine instance and removes all listeners
	     */
	    destroy() {
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
	class StateMachine {
	    /**
	     * Creates a new state machine definition
	     * @param config - The state machine configuration
	     */
	    constructor(config) {
	        this.config = config;
	        this.validateConfig();
	    }
	    /**
	     * Creates a new state machine instance for an entity
	     * @param entity - The entity this state machine will control
	     * @returns A new state machine instance
	     */
	    createInstance(entity) {
	        return new StateMachineInstance(entity, this.config);
	    }
	    /**
	     * Validates the state machine configuration
	     * @throws Error if configuration is invalid
	     */
	    validateConfig() {
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
	                    console.warn(`State '${stateName}' has transition '${trigger}' to undefined state '${targetState}'`);
	                }
	            }
	        }
	    }
	    /**
	     * Gets the configuration of this state machine
	     * @returns The state machine configuration
	     */
	    getConfig() {
	        return this.config;
	    }
	}

	/**
	 * Three.js Version Detection Utilities
	 *
	 * Provides runtime detection of Three.js version and feature availability
	 * This file is part of the Three.js toolkit bundle (gamebyte-three.umd.js)
	 */
	/**
	 * Detect Three.js version and available features
	 */
	class ThreeVersionDetector {
	    /**
	     * Get Three.js version (revision number)
	     */
	    static getVersion() {
	        if (this.cachedVersion) {
	            return this.cachedVersion;
	        }
	        try {
	            if (THREE__namespace && THREE__namespace.REVISION) {
	                const revision = parseInt(THREE__namespace.REVISION, 10);
	                // Three.js uses revision numbers like "150", "160", "180"
	                // Convert to semantic version for consistency
	                this.cachedVersion = {
	                    major: 0,
	                    minor: revision,
	                    patch: 0,
	                    raw: `0.${revision}.0`
	                };
	            }
	            else {
	                // Fallback
	                this.cachedVersion = { major: 0, minor: 180, patch: 0, raw: '0.180.0' };
	            }
	        }
	        catch (error) {
	            // Default to r180
	            this.cachedVersion = { major: 0, minor: 180, patch: 0, raw: '0.180.0' };
	        }
	        return this.cachedVersion;
	    }
	    /**
	     * Get revision number
	     */
	    static getRevision() {
	        return this.getVersion().minor;
	    }
	    /**
	     * Check if Three.js is r180 or higher
	     */
	    static isR180OrHigher() {
	        return this.getRevision() >= 180;
	    }
	    /**
	     * Check if Three.js is r160 or higher
	     */
	    static isR160OrHigher() {
	        return this.getRevision() >= 160;
	    }
	    /**
	     * Check if Three.js is below r160
	     */
	    static isLegacy() {
	        return this.getRevision() < 160;
	    }
	    /**
	     * Detect available rendering features
	     */
	    static getFeatureSupport() {
	        if (this.cachedFeatures) {
	            return this.cachedFeatures;
	        }
	        this.cachedFeatures = {
	            webgpu: this.hasWebGPUSupport(),
	            webgl2: this.hasWebGL2Support(),
	            webgl: this.hasWebGLSupport()
	        };
	        return this.cachedFeatures;
	    }
	    /**
	     * Check if WebGPURenderer might be available (version check only)
	     * WebGPURenderer is in examples/jsm, not main Three.js export
	     */
	    static hasWebGPURenderer() {
	        // WebGPURenderer available from r160+
	        // Actual availability requires runtime dynamic import check
	        return this.getRevision() >= 160;
	    }
	    /**
	     * Attempt to load WebGPURenderer dynamically
	     * Returns true if WebGPURenderer can be imported
	     */
	    static async canLoadWebGPURenderer() {
	        if (this.getRevision() < 160) {
	            return false;
	        }
	        try {
	            // @ts-expect-error - WebGPURenderer is in examples/jsm, not in main type definitions
	            await import('three/examples/jsm/renderers/webgpu/WebGPURenderer.js');
	            return true;
	        }
	        catch {
	            return false;
	        }
	    }
	    /**
	     * Check if browser supports WebGPU
	     */
	    static hasWebGPUSupport() {
	        if (typeof navigator === 'undefined') {
	            return false;
	        }
	        return 'gpu' in navigator && this.hasWebGPURenderer();
	    }
	    /**
	     * Check if WebGL2 is available
	     */
	    static hasWebGL2Support() {
	        if (typeof document === 'undefined') {
	            return false;
	        }
	        try {
	            const canvas = document.createElement('canvas');
	            return !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'));
	        }
	        catch {
	            return false;
	        }
	    }
	    /**
	     * Check if WebGL is available
	     */
	    static hasWebGLSupport() {
	        if (typeof document === 'undefined') {
	            return false;
	        }
	        try {
	            const canvas = document.createElement('canvas');
	            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
	        }
	        catch {
	            return false;
	        }
	    }
	    /**
	     * Check if instanced rendering is available
	     */
	    static hasInstancedMesh() {
	        try {
	            return typeof THREE__namespace.InstancedMesh !== 'undefined';
	        }
	        catch {
	            return false;
	        }
	    }
	    /**
	     * Check if LOD (Level of Detail) is available
	     */
	    static hasLOD() {
	        try {
	            return typeof THREE__namespace.LOD !== 'undefined';
	        }
	        catch {
	            return false;
	        }
	    }
	}
	ThreeVersionDetector.cachedVersion = null;
	ThreeVersionDetector.cachedFeatures = null;
	/**
	 * Three.js Framework compatibility (includes browser features)
	 */
	class ThreeFrameworkCompatibility {
	    /**
	     * Get Three.js compatibility report
	     */
	    static getCompatibilityReport() {
	        return {
	            three: {
	                version: ThreeVersionDetector.getVersion(),
	                revision: ThreeVersionDetector.getRevision(),
	                isR180Plus: ThreeVersionDetector.isR180OrHigher(),
	                isR160Plus: ThreeVersionDetector.isR160OrHigher(),
	                features: ThreeVersionDetector.getFeatureSupport(),
	                hasWebGPURenderer: ThreeVersionDetector.hasWebGPURenderer(),
	                hasInstancedMesh: ThreeVersionDetector.hasInstancedMesh(),
	                hasLOD: ThreeVersionDetector.hasLOD()
	            },
	            browser: {
	                hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
	                hasWebGL2: this.hasWebGL2(),
	                hasWebGL: this.hasWebGL(),
	                bestContext: this.getBestRenderingContext()
	            }
	        };
	    }
	    static hasWebGL2() {
	        if (typeof document === 'undefined')
	            return false;
	        try {
	            const canvas = document.createElement('canvas');
	            return canvas.getContext('webgl2') !== null;
	        }
	        catch {
	            return false;
	        }
	    }
	    static hasWebGL() {
	        if (typeof document === 'undefined')
	            return false;
	        try {
	            const canvas = document.createElement('canvas');
	            return (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) !== null;
	        }
	        catch {
	            return false;
	        }
	    }
	    static getBestRenderingContext() {
	        if (typeof navigator !== 'undefined' && 'gpu' in navigator)
	            return 'webgpu';
	        if (this.hasWebGL2())
	            return 'webgl2';
	        if (this.hasWebGL())
	            return 'webgl';
	        return null;
	    }
	    /**
	     * Log compatibility report to console
	     */
	    static logCompatibilityReport() {
	        const report = this.getCompatibilityReport();
	        console.group('🔍 GameByte Three.js Toolkit - Compatibility Report');
	        console.log('Three.js:', report.three);
	        console.log('Browser:', report.browser);
	        console.groupEnd();
	    }
	}

	/**
	 * Base scene implementation for 3D games (Three.js)
	 *
	 * This is part of the Three.js toolkit bundle (gamebyte-three.umd.js)
	 */
	/**
	 * Base scene implementation for 3D games (Three.js)
	 *
	 * Provides:
	 * - Three.js scene management
	 * - Camera management
	 * - Lifecycle methods
	 * - Ready-to-extend base for 3D game scenes
	 *
	 * @example
	 * ```typescript
	 * class Gameplay3DScene extends BaseScene3D {
	 *     constructor() {
	 *         super('gameplay3d', 'Gameplay 3D Scene');
	 *     }
	 *
	 *     async initialize() {
	 *         await super.initialize();
	 *
	 *         // Setup camera
	 *         this.setupCamera(75, 800/600, 0.1, 1000);
	 *         this.camera.position.z = 5;
	 *
	 *         // Add objects to scene
	 *         const geometry = new THREE.BoxGeometry();
	 *         const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	 *         const cube = new THREE.Mesh(geometry, material);
	 *         this.scene.add(cube);
	 *     }
	 * }
	 * ```
	 */
	class BaseScene3D extends EventEmitter {
	    constructor(id, name) {
	        super();
	        this._isActive = false;
	        this.camera = null;
	        this.initialized = false;
	        this.id = id;
	        this.name = name;
	        this.scene = new THREE__namespace.Scene();
	    }
	    /**
	     * Whether the scene is currently active
	     */
	    get isActive() {
	        return this._isActive;
	    }
	    /**
	     * Get the Three.js scene
	     */
	    getScene() {
	        return this.scene;
	    }
	    /**
	     * Get the camera
	     */
	    getCamera() {
	        return this.camera;
	    }
	    /**
	     * Setup a perspective camera
	     */
	    setupCamera(fov = 75, aspect = 1, near = 0.1, far = 1000) {
	        this.camera = new THREE__namespace.PerspectiveCamera(fov, aspect, near, far);
	    }
	    /**
	     * Setup an orthographic camera
	     */
	    setupOrthographicCamera(left, right, top, bottom, near = 0.1, far = 1000) {
	        this.camera = new THREE__namespace.OrthographicCamera(left, right, top, bottom, near, far);
	    }
	    /**
	     * Initialize the scene
	     * Override this in your scene to add initialization logic
	     */
	    async initialize() {
	        if (this.initialized) {
	            return;
	        }
	        this.emit('initializing');
	        // Override in subclass to add game objects and setup camera
	        this.initialized = true;
	        this.emit('initialized');
	    }
	    /**
	     * Called when the scene becomes active
	     * Override this to add activation logic
	     */
	    activate() {
	        this._isActive = true;
	        this.emit('activated');
	    }
	    /**
	     * Called when the scene becomes inactive
	     * Override this to add deactivation logic
	     */
	    deactivate() {
	        this._isActive = false;
	        this.emit('deactivated');
	    }
	    /**
	     * Update the scene logic
	     * Override this to add game logic
	     *
	     * @param deltaTime Time since last frame in milliseconds
	     */
	    update(deltaTime) {
	        if (!this._isActive) {
	            return;
	        }
	        this.emit('update', deltaTime);
	    }
	    /**
	     * Render the scene
	     * Default implementation sets the scene and camera on the renderer
	     *
	     * @param renderer The renderer instance
	     */
	    render(renderer) {
	        if (!this._isActive || !this.scene || !this.camera) {
	            return;
	        }
	        // Set scene and camera on renderer
	        if (renderer.setScene) {
	            renderer.setScene(this.scene);
	        }
	        if (renderer.setCamera && this.camera) {
	            renderer.setCamera(this.camera);
	        }
	        this.emit('render', renderer);
	    }
	    /**
	     * Clean up scene resources
	     * Override this to add cleanup logic
	     */
	    destroy() {
	        this.emit('destroying');
	        // Dispose of Three.js objects
	        this.scene.traverse((object) => {
	            if (object instanceof THREE__namespace.Mesh) {
	                if (object.geometry) {
	                    object.geometry.dispose();
	                }
	                if (object.material) {
	                    if (Array.isArray(object.material)) {
	                        object.material.forEach(mat => mat.dispose());
	                    }
	                    else {
	                        object.material.dispose();
	                    }
	                }
	            }
	        });
	        this.scene.clear();
	        this.camera = null;
	        this.removeAllListeners();
	        this.initialized = false;
	        this._isActive = false;
	        this.emit('destroyed');
	    }
	}

	exports.BaseScene3D = BaseScene3D;
	exports.Billboard = Billboard;
	exports.CameraController = CameraController;
	exports.DragController = DragController;
	exports.FloatingText = FloatingText;
	exports.GestureHandler3D = GestureHandler3D;
	exports.GridRenderer = GridRenderer;
	exports.HealthBar3D = HealthBar3D;
	exports.HexGrid = HexGrid;
	exports.IsometricCamera = IsometricCamera;
	exports.Object3DPicker = Object3DPicker;
	exports.ObjectPool3D = ObjectPool3D;
	exports.Pathfinder = Pathfinder;
	exports.SelectionIndicator = SelectionIndicator;
	exports.SquareGrid = SquareGrid;
	exports.StateMachine = StateMachine;
	exports.StateMachineInstance = StateMachineInstance;
	exports.StrategyCamera = StrategyCamera;
	exports.ThreeFrameworkCompatibility = ThreeFrameworkCompatibility;
	exports.ThreeVersionDetector = ThreeVersionDetector;

}));
//# sourceMappingURL=gamebyte-three.umd.js.map
