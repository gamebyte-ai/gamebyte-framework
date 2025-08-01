"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameByteMobileOptimizer = void 0;
const eventemitter3_1 = require("eventemitter3");
/**
 * Mobile-specific physics optimization system
 */
class GameByteMobileOptimizer extends eventemitter3_1.EventEmitter {
    constructor() {
        super();
        this.cullingEnabled = false;
        this.cullingDistance = 50;
        this.lodEnabled = false;
        this.lodLevels = [
            { distance: 10, quality: 1.0 },
            { distance: 25, quality: 0.7 },
            { distance: 50, quality: 0.4 }
        ];
        this.adaptiveQualityEnabled = false;
        this.performanceTarget = 60; // Target FPS
        this.currentQualityLevel = 'medium';
        this.qualityLevels = {
            low: { timeStep: 1 / 30, iterations: 2 },
            medium: { timeStep: 1 / 60, iterations: 4 },
            high: { timeStep: 1 / 90, iterations: 6 }
        };
        this.batteryOptimizationEnabled = false;
        this.sleepThresholds = { linear: 0.1, angular: 0.1 };
        this.adaptiveSleepEnabled = false;
        this.objectPoolingEnabled = true;
        this.poolSizes = { bodies: 100, constraints: 50 };
        this.deviceTier = 'medium';
        this.performanceHistory = [];
        this.performanceMonitoringEnabled = false;
        // Performance monitoring
        this.lastFrameTime = 0;
        this.frameTimeHistory = [];
        this.maxHistoryLength = 60; // 1 second at 60fps
        this.initializePerformanceMetrics();
        this.detectDeviceTier();
    }
    /**
     * Enable or disable physics culling for off-screen objects
     */
    enableCulling(enabled) {
        this.cullingEnabled = enabled;
        this.emit('culling-changed', enabled);
    }
    /**
     * Set distance threshold for culling
     */
    setCullingDistance(distance) {
        this.cullingDistance = Math.max(0, distance);
        this.emit('culling-distance-changed', this.cullingDistance);
    }
    /**
     * Enable or disable Level of Detail (LOD) system
     */
    enableLOD(enabled) {
        this.lodEnabled = enabled;
        this.emit('lod-changed', enabled);
    }
    /**
     * Set LOD levels based on distance
     */
    setLODLevels(levels) {
        this.lodLevels = levels.sort((a, b) => a.distance - b.distance);
        this.emit('lod-levels-changed', this.lodLevels);
    }
    /**
     * Enable or disable adaptive quality scaling
     */
    enableAdaptiveQuality(enabled) {
        this.adaptiveQualityEnabled = enabled;
        this.emit('adaptive-quality-changed', enabled);
    }
    /**
     * Set target FPS for adaptive quality
     */
    setPerformanceTarget(fps) {
        this.performanceTarget = Math.max(15, Math.min(120, fps));
        this.emit('performance-target-changed', this.performanceTarget);
    }
    /**
     * Set quality levels for adaptive scaling
     */
    setQualityLevels(levels) {
        this.qualityLevels = { ...levels };
        this.emit('quality-levels-changed', this.qualityLevels);
    }
    /**
     * Enable or disable battery optimization
     */
    enableBatteryOptimization(enabled) {
        this.batteryOptimizationEnabled = enabled;
        this.emit('battery-optimization-changed', enabled);
    }
    /**
     * Set sleep thresholds for bodies
     */
    setSleepThresholds(linear, angular) {
        this.sleepThresholds = {
            linear: Math.max(0, linear),
            angular: Math.max(0, angular)
        };
        this.emit('sleep-thresholds-changed', this.sleepThresholds);
    }
    /**
     * Enable or disable adaptive sleep system
     */
    enableAdaptiveSleep(enabled) {
        this.adaptiveSleepEnabled = enabled;
        this.emit('adaptive-sleep-changed', enabled);
    }
    /**
     * Enable or disable object pooling
     */
    enableObjectPooling(enabled) {
        this.objectPoolingEnabled = enabled;
        this.emit('object-pooling-changed', enabled);
    }
    /**
     * Set object pool sizes
     */
    setPoolSizes(bodies, constraints) {
        this.poolSizes = {
            bodies: Math.max(0, bodies),
            constraints: Math.max(0, constraints)
        };
        this.emit('pool-sizes-changed', this.poolSizes);
    }
    /**
     * Force garbage collection (if available)
     */
    forceGarbageCollection() {
        // Modern browsers don't expose GC directly, but we can hint at it
        if (window.gc) {
            window.gc();
        }
        this.emit('garbage-collection-forced');
    }
    /**
     * Detect device tier based on available information
     */
    detectDeviceTier() {
        const memory = navigator.deviceMemory || 4; // GB
        const cores = navigator.hardwareConcurrency || 4;
        const userAgent = navigator.userAgent.toLowerCase();
        // Check for mobile devices
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        let tier;
        if (isMobile) {
            // Mobile device tier detection
            if (memory <= 2 || cores <= 2) {
                tier = 'low';
            }
            else if (memory <= 4 || cores <= 4) {
                tier = 'medium';
            }
            else {
                tier = 'high';
            }
        }
        else {
            // Desktop device tier detection
            if (memory <= 4 || cores <= 2) {
                tier = 'medium';
            }
            else {
                tier = 'high';
            }
        }
        this.deviceTier = tier;
        this.emit('device-tier-detected', tier);
        return tier;
    }
    /**
     * Apply optimizations based on detected device tier
     */
    optimizeForDevice() {
        switch (this.deviceTier) {
            case 'low':
                this.enableCulling(true);
                this.setCullingDistance(20);
                this.enableLOD(true);
                this.enableAdaptiveQuality(true);
                this.setPerformanceTarget(30);
                this.currentQualityLevel = 'low';
                this.enableBatteryOptimization(true);
                this.enableAdaptiveSleep(true);
                this.setSleepThresholds(0.2, 0.2);
                break;
            case 'medium':
                this.enableCulling(true);
                this.setCullingDistance(40);
                this.enableLOD(true);
                this.enableAdaptiveQuality(true);
                this.setPerformanceTarget(60);
                this.currentQualityLevel = 'medium';
                this.enableBatteryOptimization(true);
                this.enableAdaptiveSleep(true);
                this.setSleepThresholds(0.1, 0.1);
                break;
            case 'high':
                this.enableCulling(false);
                this.enableLOD(false);
                this.enableAdaptiveQuality(false);
                this.setPerformanceTarget(60);
                this.currentQualityLevel = 'high';
                this.enableBatteryOptimization(false);
                this.enableAdaptiveSleep(false);
                this.setSleepThresholds(0.05, 0.05);
                break;
        }
        this.emit('device-optimized', this.deviceTier);
    }
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    /**
     * Enable or disable performance monitoring
     */
    enablePerformanceMonitoring(enabled) {
        this.performanceMonitoringEnabled = enabled;
        if (enabled) {
            this.startPerformanceMonitoring();
        }
        else {
            this.stopPerformanceMonitoring();
        }
        this.emit('performance-monitoring-changed', enabled);
    }
    /**
     * Get current quality level
     */
    getCurrentQualityLevel() {
        return this.currentQualityLevel;
    }
    /**
     * Get current quality settings
     */
    getCurrentQualitySettings() {
        return { ...this.qualityLevels[this.currentQualityLevel] };
    }
    /**
     * Update performance metrics and adaptive systems
     */
    update(deltaTime) {
        if (this.performanceMonitoringEnabled) {
            this.updatePerformanceMetrics(deltaTime);
        }
        if (this.adaptiveQualityEnabled) {
            this.updateAdaptiveQuality();
        }
        if (this.adaptiveSleepEnabled) {
            this.updateAdaptiveSleep();
        }
    }
    /**
     * Set device tier manually
     */
    setDeviceTier(tier) {
        this.deviceTier = tier;
        this.optimizeForDevice();
        this.emit('device-tier-changed', tier);
    }
    /**
     * Initialize performance metrics
     */
    initializePerformanceMetrics() {
        this.performanceMetrics = {
            averageStepTime: 0,
            bodyCount: 0,
            constraintCount: 0,
            contactCount: 0,
            broadphaseTime: 0,
            narrowphaseTime: 0,
            solverTime: 0,
            memoryUsage: 0,
            sleepingBodies: 0,
            activeBodies: 0,
            culledBodies: 0
        };
    }
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        this.lastFrameTime = performance.now();
        this.frameTimeHistory.length = 0;
    }
    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        this.frameTimeHistory.length = 0;
    }
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(deltaTime) {
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.maxHistoryLength) {
            this.frameTimeHistory.shift();
        }
        // Calculate average frame time
        const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
        this.performanceMetrics.averageStepTime = avgFrameTime;
        this.lastFrameTime = currentTime;
    }
    /**
     * Update adaptive quality based on performance
     */
    updateAdaptiveQuality() {
        if (this.frameTimeHistory.length < 10)
            return; // Need some data first
        const avgFrameTime = this.performanceMetrics.averageStepTime;
        const currentFPS = 1000 / avgFrameTime;
        const targetFrameTime = 1000 / this.performanceTarget;
        // Determine if we need to adjust quality
        if (currentFPS < this.performanceTarget * 0.9) {
            // Performance is poor, reduce quality
            if (this.currentQualityLevel === 'high') {
                this.currentQualityLevel = 'medium';
                this.emit('quality-reduced', 'medium');
            }
            else if (this.currentQualityLevel === 'medium') {
                this.currentQualityLevel = 'low';
                this.emit('quality-reduced', 'low');
            }
        }
        else if (currentFPS > this.performanceTarget * 1.1) {
            // Performance is good, increase quality
            if (this.currentQualityLevel === 'low') {
                this.currentQualityLevel = 'medium';
                this.emit('quality-increased', 'medium');
            }
            else if (this.currentQualityLevel === 'medium' && this.deviceTier !== 'low') {
                this.currentQualityLevel = 'high';
                this.emit('quality-increased', 'high');
            }
        }
    }
    /**
     * Update adaptive sleep thresholds
     */
    updateAdaptiveSleep() {
        const avgFrameTime = this.performanceMetrics.averageStepTime;
        const currentFPS = 1000 / avgFrameTime;
        // Adjust sleep thresholds based on performance
        if (currentFPS < this.performanceTarget * 0.8) {
            // Poor performance, make bodies sleep easier
            this.sleepThresholds.linear = Math.min(0.3, this.sleepThresholds.linear * 1.1);
            this.sleepThresholds.angular = Math.min(0.3, this.sleepThresholds.angular * 1.1);
        }
        else if (currentFPS > this.performanceTarget * 1.2) {
            // Good performance, make bodies less likely to sleep
            this.sleepThresholds.linear = Math.max(0.05, this.sleepThresholds.linear * 0.9);
            this.sleepThresholds.angular = Math.max(0.05, this.sleepThresholds.angular * 0.9);
        }
    }
}
exports.GameByteMobileOptimizer = GameByteMobileOptimizer;
