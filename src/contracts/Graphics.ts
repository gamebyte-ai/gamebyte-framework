/**
 * Graphics Abstraction Layer
 *
 * Framework-agnostic graphics primitives that work with both 2D (Pixi.js) and 3D (Three.js) renderers.
 * This allows UI components and game objects to be renderer-independent.
 */

import { EventEmitter } from 'eventemitter3';

/**
 * Blend modes for compositing graphics (Pixi.js v8)
 * Matches PIXI.BLEND_MODES exactly
 */
export type BlendMode =
  | 'inherit'
  | 'normal'
  | 'add'
  | 'multiply'
  | 'screen'
  | 'darken'
  | 'lighten'
  | 'erase'
  | 'color-dodge'
  | 'color-burn'
  | 'linear-burn'
  | 'linear-dodge'
  | 'linear-light'
  | 'hard-light'
  | 'soft-light'
  | 'pin-light'
  | 'difference'
  | 'exclusion'
  | 'overlay'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'normal-npm'
  | 'add-npm'
  | 'screen-npm'
  | 'none'
  | 'subtract'
  | 'divide'
  | 'vivid-light'
  | 'hard-mix'
  | 'negation'
  | 'min'
  | 'max';

/**
 * Filter interface for visual effects
 */
export interface IFilter {
  readonly type: string;
  enabled: boolean;
  /** Native filter object */
  readonly native: any;
  destroy(): void;
}

/**
 * Blur filter options
 */
export interface IBlurFilterOptions {
  strength?: number;
  quality?: number;
  kernelSize?: number;
}

/**
 * Color matrix filter options
 */
export interface IColorMatrixFilterOptions {
  matrix?: number[];
}

/**
 * Drop shadow filter options
 */
export interface IDropShadowFilterOptions {
  offset?: { x: number; y: number };
  color?: number;
  alpha?: number;
  blur?: number;
  quality?: number;
}

/**
 * Glow filter options
 */
export interface IGlowFilterOptions {
  distance?: number;
  outerStrength?: number;
  innerStrength?: number;
  color?: number;
  quality?: number;
}

/**
 * Outline filter options
 */
export interface IOutlineFilterOptions {
  thickness?: number;
  color?: number;
  quality?: number;
}

/**
 * Mask interface for clipping
 */
export interface IMask {
  readonly type: 'graphics' | 'sprite' | 'color';
  /** Native mask object */
  readonly native: any;
  /** Inverted mask */
  inverted?: boolean;
  destroy(): void;
}

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

  /** Blend mode for compositing */
  blendMode?: BlendMode;

  /**
   * Filters applied to this display object
   * Can be native Pixi.js filters or wrapped IFilter objects
   */
  filters?: any;

  destroy(options?: any): void;
}

/**
 * Container interface - can hold other display objects
 */
export interface IContainer extends IDisplayObject {
  children: IDisplayObject[];
  hitArea?: { contains(x: number, y: number): boolean } | any;

  /**
   * Mask for clipping children
   * Can be a graphics object, sprite, IMask wrapper, or native mask value
   */
  mask?: IMask | IGraphics | ISprite | any;

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
 * Color stop for gradients
 */
export interface IColorStop {
  offset: number;
  color: number | string;
}

/**
 * Linear gradient configuration
 */
export interface ILinearGradientConfig {
  start: { x: number; y: number };
  end: { x: number; y: number };
  colorStops: IColorStop[];
  textureSpace?: 'local' | 'global';
}

/**
 * Radial gradient configuration
 */
export interface IRadialGradientConfig {
  center: { x: number; y: number };
  innerRadius: number;
  outerCenter?: { x: number; y: number };
  outerRadius: number;
  colorStops: IColorStop[];
  textureSpace?: 'local' | 'global';
}

/**
 * Fill gradient interface (Pixi v8 FillGradient abstraction)
 */
export interface IFillGradient {
  readonly type: 'linear' | 'radial';
  /** Get the native gradient object for use with graphics.fill() */
  readonly native: any;
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

  // Gradient creation (Pixi v8 FillGradient)
  createLinearGradient(config: ILinearGradientConfig): IFillGradient;
  createRadialGradient(config: IRadialGradientConfig): IFillGradient;

  // Filter creation (Pixi v8)
  createBlurFilter(options?: IBlurFilterOptions): IFilter;
  createColorMatrixFilter(options?: IColorMatrixFilterOptions): IFilter;
  createDropShadowFilter(options?: IDropShadowFilterOptions): IFilter;
  createGlowFilter(options?: IGlowFilterOptions): IFilter;
  createOutlineFilter(options?: IOutlineFilterOptions): IFilter;

  // Mask creation
  createMaskFromGraphics(graphics: IGraphics): IMask;
  createMaskFromSprite(sprite: ISprite): IMask;
}

/**
 * Graphics engine interface
 * Provides access to the graphics factory based on current renderer
 */
export interface IGraphicsEngine {
  readonly factory: IGraphicsFactory;
  readonly type: 'PIXI' | 'THREE';
}
