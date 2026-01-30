/**
 * Graphics Abstraction Layer
 *
 * Framework-agnostic graphics primitives that work with both 2D (Pixi.js) and 3D (Three.js) renderers.
 * This allows UI components and game objects to be renderer-independent.
 */

import { EventEmitter } from 'eventemitter3';

/**
 * Base display object interface
 */
export interface IDisplayObject extends EventEmitter {
  x: number;
  y: number;
  rotation: number;
  scale: { x: number; y: number };
  alpha: number;
  visible: boolean;
  interactive?: boolean;
  cursor?: string;
  eventMode?: 'none' | 'passive' | 'auto' | 'static' | 'dynamic';

  destroy(options?: any): void;
}

/**
 * Container interface - can hold other display objects
 */
export interface IContainer extends IDisplayObject {
  children: IDisplayObject[];
  hitArea?: { contains(x: number, y: number): boolean } | any;

  addChild(child: IDisplayObject): IDisplayObject;
  removeChild(child: IDisplayObject): IDisplayObject;
  removeChildren(): void;
  getChildAt(index: number): IDisplayObject;
  getChildIndex(child: IDisplayObject): number;
  setChildIndex(child: IDisplayObject, index: number): void;
}

/**
 * Graphics interface - for drawing shapes
 * Uses Pixi v8 modern API only
 */
export interface IGraphics extends IDisplayObject {
  tint?: number;

  clear(): this;

  // Pixi v8 Modern API
  rect(x: number, y: number, width: number, height: number): this;
  roundRect(x: number, y: number, width: number, height: number, radius: number): this;
  circle(x: number, y: number, radius: number): this;
  ellipse(x: number, y: number, width: number, height: number): this;
  poly(points: number[] | {x: number, y: number}[]): this;

  // Fill and stroke
  fill(options?: { color?: number; alpha?: number } | any): this;
  stroke(options?: { color?: number; width?: number; alpha?: number } | any): this;

  // Line drawing
  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;

  // Arc and path
  arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
  closePath(): this;

  // Texture support
  texture(texture: ITexture): this;
}

/**
 * Text interface
 */
export interface IText extends IDisplayObject {
  text: string;
  style: ITextStyle;
  anchor?: { x: number; y: number; set(x: number, y?: number): void };

  readonly width: number;
  readonly height: number;
}

/**
 * Pixi v8 stroke object format
 */
export interface IStrokeStyle {
  color?: number | string;
  width?: number;
}

/**
 * Pixi v8 drop shadow object format
 */
export interface IDropShadowStyle {
  color?: number | string;
  alpha?: number;
  angle?: number;
  blur?: number;
  distance?: number;
}

export interface ITextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique' | string;
  fill?: number | string | number[];
  align?: 'left' | 'center' | 'right';
  wordWrap?: boolean;
  wordWrapWidth?: number;
  lineHeight?: number;
  // Pixi v8 object format only
  stroke?: IStrokeStyle;
  // Pixi v8 object format only
  dropShadow?: IDropShadowStyle;
}

/**
 * Sprite interface
 */
export interface ISprite extends IDisplayObject {
  texture: ITexture;
  anchor?: { x: number; y: number; set(x: number, y: number): void };
  tint?: number;

  width: number;
  height: number;
}

/**
 * Texture interface
 */
export interface ITexture {
  readonly width: number;
  readonly height: number;

  destroy(): void;
}

/**
 * Graphics Factory interface
 * Creates renderer-agnostic graphics objects
 */
export interface IGraphicsFactory {
  createContainer(): IContainer;
  createGraphics(): IGraphics;
  createText(text: string, style?: ITextStyle): IText;
  createSprite(texture: ITexture | string): ISprite;
  createTexture(source: HTMLCanvasElement | HTMLImageElement | string): ITexture;

  // Helper to create canvas texture
  createCanvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): ITexture;
}

/**
 * Graphics engine interface
 * Provides access to the graphics factory based on current renderer
 */
export interface IGraphicsEngine {
  readonly factory: IGraphicsFactory;
  readonly type: 'PIXI' | 'THREE';
}
