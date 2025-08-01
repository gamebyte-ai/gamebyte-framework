"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsServiceProvider = void 0;
const ServiceProvider_1 = require("../contracts/ServiceProvider");
const PhysicsManager_1 = require("../physics/PhysicsManager");
/**
 * Physics service provider for the GameByte framework
 */
class PhysicsServiceProvider extends ServiceProvider_1.AbstractServiceProvider {
    /**
     * Register physics services in the container
     */
    register(app) {
        // Register the physics manager as a singleton
        app.singleton('physics', () => new PhysicsManager_1.PhysicsManager());
        // Register alias for easier access
        app.getContainer().alias('PhysicsManager', 'physics');
    }
    /**
     * Boot physics services after all providers have been registered
     */
    async boot(app) {
        const physicsManager = app.make('physics');
        // Set up event listeners for scene transitions
        const sceneManager = app.make('scene.manager');
        if (sceneManager) {
            sceneManager.on('scene-changing', this.handleSceneChange.bind(this, physicsManager));
            sceneManager.on('scene-changed', this.handleSceneChanged.bind(this, physicsManager));
        }
        // Set up render loop integration
        const renderer = app.make('renderer');
        if (renderer) {
            renderer.on('render', this.handleRenderLoop.bind(this, physicsManager));
        }
        // Emit physics service booted event
        app.emit('physics:booted', physicsManager);
    }
    /**
     * Services provided by this provider
     */
    provides() {
        return ['physics', 'PhysicsManager'];
    }
    /**
     * Handle scene change events
     */
    handleSceneChange(physicsManager, event) {
        // Pause physics when changing scenes
        const activeWorld = physicsManager.getActiveWorld();
        if (activeWorld && activeWorld.isRunning) {
            activeWorld.pause();
        }
    }
    /**
     * Handle scene changed events
     */
    handleSceneChanged(physicsManager, event) {
        // Resume physics after scene change
        const activeWorld = physicsManager.getActiveWorld();
        if (activeWorld) {
            activeWorld.resume();
        }
    }
    /**
     * Handle render loop for physics updates
     */
    handleRenderLoop(physicsManager, deltaTime) {
        // Update physics on each render frame
        if (physicsManager.isInitialized) {
            physicsManager.update(deltaTime);
        }
    }
}
exports.PhysicsServiceProvider = PhysicsServiceProvider;
