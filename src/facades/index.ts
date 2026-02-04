/**
 * Facades Module - GameByte Framework
 *
 * Static accessor classes for framework services.
 *
 * @module facades
 * @example
 * ```typescript
 * import { Renderer, Scenes, UI, Audio, Input, Physics } from '@gamebyte/framework/facades';
 *
 * Renderer.start();
 * await Scenes.switchTo('game');
 * Audio.playMusic('background');
 * ```
 */

export { Facade } from './Facade.js';
export { Renderer } from './Renderer.js';
export { Scenes } from './Scenes.js';
export { Plugins } from './Plugins.js';
export { UI, Animations, Themes } from './UI.js';
export { Input } from './Input.js';
export { Physics } from './Physics.js';
export { Performance } from './Performance.js';
export { Audio, Music, SFX, Spatial } from './Audio.js';
export { Assets } from './Assets.js';
export { Merge } from './Merge.js';
