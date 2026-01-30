/**
 * Mock for @pixi/layout
 *
 * This mock is used in Jest tests since the actual @pixi/layout
 * uses yoga-layout which has WebAssembly and ESM-specific features
 * that don't work well in Jest's CommonJS environment.
 */

// Mock export - the actual import just applies mixins to PIXI objects
export default {};

// No actual exports needed - the import is just for side effects
