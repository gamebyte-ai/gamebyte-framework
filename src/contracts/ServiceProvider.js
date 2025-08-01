"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractServiceProvider = void 0;
/**
 * Abstract base class for service providers with common functionality.
 */
class AbstractServiceProvider {
    constructor() {
        this.deferred = false;
    }
    boot(app) {
        // Default empty implementation
    }
    provides() {
        return [];
    }
    isDeferred() {
        return this.deferred;
    }
}
exports.AbstractServiceProvider = AbstractServiceProvider;
