/**
 * Input Module - GameByte Framework
 *
 * Touch, keyboard, gamepad input handling with virtual controls.
 *
 * @module input
 * @example
 * ```typescript
 * import { GameByteInputManager, VirtualJoystick } from '@gamebyte/framework/input';
 * ```
 */

// Core Input
export { GameByteInputManager } from './InputManager.js';
export { GameByteTouchInputHandler } from './TouchInputHandler.js';
export { GameByteVirtualControlsManager } from './VirtualControlsManager.js';
export { GameByteInputMappingManager } from './InputMappingManager.js';
export { GameByteInputPerformanceManager } from './InputPerformanceManager.js';

// Game-Specific Handlers
export { GameBytePlatformerInputHandler } from './handlers/PlatformerInputHandler.js';
export { GameByteCameraInputHandler } from './handlers/CameraInputHandler.js';
export { GameByteUINavigationHandler } from './handlers/UINavigationHandler.js';
export { GameBytePlayerMovementHandler } from './handlers/PlayerMovementHandler.js';
