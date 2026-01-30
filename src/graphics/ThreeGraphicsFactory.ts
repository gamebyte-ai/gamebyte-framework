/**
 * Three.js Graphics Factory Implementation
 *
 * Provides Three.js-based implementations of framework graphics primitives.
 * Uses CSS2DRenderer for UI elements, allowing HTML/CSS-based UI in 3D scenes.
 */

import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EventEmitter } from 'eventemitter3';
import {
  IGraphicsFactory,
  IContainer,
  IGraphics,
  IText,
  ITextStyle,
  ISprite,
  ITexture,
  IDisplayObject,
} from '../contracts/Graphics';

/**
 * Base Three.js Display Object Wrapper
 */
abstract class ThreeDisplayObjectBase extends EventEmitter implements IDisplayObject {
  protected element: HTMLElement;
  protected css2dObject: CSS2DObject;

  constructor(element: HTMLElement) {
    super();
    this.element = element;
    this.css2dObject = new CSS2DObject(element);

    // Apply default styles for consistent behavior
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'auto';
  }

  get x(): number {
    return this.css2dObject.position.x;
  }

  set x(value: number) {
    this.css2dObject.position.x = value;
  }

  get y(): number {
    return this.css2dObject.position.y;
  }

  set y(value: number) {
    this.css2dObject.position.y = value;
  }

  get rotation(): number {
    return this.css2dObject.rotation.z;
  }

  set rotation(value: number) {
    this.css2dObject.rotation.z = value;
  }

  get scale(): { x: number; y: number } {
    return {
      x: this.css2dObject.scale.x,
      y: this.css2dObject.scale.y,
    };
  }

  set scale(value: { x: number; y: number }) {
    this.css2dObject.scale.set(value.x, value.y, 1);
  }

  get alpha(): number {
    return parseFloat(this.element.style.opacity || '1');
  }

  set alpha(value: number) {
    this.element.style.opacity = value.toString();
  }

  get visible(): boolean {
    return this.css2dObject.visible;
  }

  set visible(value: boolean) {
    this.css2dObject.visible = value;
    this.element.style.display = value ? 'block' : 'none';
  }

  get interactive(): boolean {
    return this.element.style.pointerEvents === 'auto';
  }

  set interactive(value: boolean) {
    this.element.style.pointerEvents = value ? 'auto' : 'none';
  }

  get cursor(): string | undefined {
    return this.element.style.cursor;
  }

  set cursor(value: string | undefined) {
    this.element.style.cursor = value || 'default';
  }

  getCSS2DObject(): CSS2DObject {
    return this.css2dObject;
  }

  destroy(): void {
    this.element.remove();
    this.removeAllListeners();
  }
}

/**
 * Three.js Container Wrapper
 */
class ThreeContainerWrapper extends ThreeDisplayObjectBase implements IContainer {
  children: IDisplayObject[] = [];

  constructor() {
    const div = document.createElement('div');
    div.style.transformStyle = 'preserve-3d';
    super(div);
  }

  addChild(child: IDisplayObject): IDisplayObject {
    this.children.push(child);

    // Add CSS2D object if it's a Three wrapper
    if ((child as any).getCSS2DObject) {
      this.css2dObject.add((child as any).getCSS2DObject());
    }

    return child;
  }

  removeChild(child: IDisplayObject): IDisplayObject {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);

      if ((child as any).getCSS2DObject) {
        this.css2dObject.remove((child as any).getCSS2DObject());
      }
    }
    return child;
  }

  removeChildren(): void {
    while (this.children.length > 0) {
      this.removeChild(this.children[0]);
    }
  }

  getChildAt(index: number): IDisplayObject {
    return this.children[index];
  }

  getChildIndex(child: IDisplayObject): number {
    return this.children.indexOf(child);
  }

  setChildIndex(child: IDisplayObject, index: number): void {
    const currentIndex = this.children.indexOf(child);
    if (currentIndex !== -1) {
      this.children.splice(currentIndex, 1);
      this.children.splice(index, 0, child);
    }
  }
}

/**
 * Three.js Graphics Wrapper (HTML Canvas-based)
 * Implements Pixi v8 modern API using HTML5 Canvas
 */
class ThreeGraphicsWrapper extends ThreeDisplayObjectBase implements IGraphics {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pathStarted: boolean = false;

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    super(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  clear(): this {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    return this;
  }

  // Pixi v8 Modern API - Shape methods
  rect(x: number, y: number, width: number, height: number): this {
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.pathStarted = true;
    return this;
  }

  roundRect(x: number, y: number, width: number, height: number, radius: number): this {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.pathStarted = true;
    return this;
  }

  circle(x: number, y: number, radius: number): this {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.pathStarted = true;
    return this;
  }

  ellipse(x: number, y: number, width: number, height: number): this {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    this.pathStarted = true;
    return this;
  }

  poly(points: number[] | { x: number; y: number }[]): this {
    this.ctx.beginPath();

    if (Array.isArray(points) && typeof points[0] === 'number') {
      const numPoints = points as number[];
      this.ctx.moveTo(numPoints[0], numPoints[1]);
      for (let i = 2; i < numPoints.length; i += 2) {
        this.ctx.lineTo(numPoints[i], numPoints[i + 1]);
      }
    } else {
      const objPoints = points as { x: number; y: number }[];
      this.ctx.moveTo(objPoints[0].x, objPoints[0].y);
      for (let i = 1; i < objPoints.length; i++) {
        this.ctx.lineTo(objPoints[i].x, objPoints[i].y);
      }
    }

    this.ctx.closePath();
    this.pathStarted = true;
    return this;
  }

  // Fill and stroke
  fill(options?: { color?: number; alpha?: number } | any): this {
    if (options) {
      const color = options.color !== undefined ? options.color : 0xffffff;
      const alpha = options.alpha !== undefined ? options.alpha : 1;

      this.ctx.fillStyle = this.colorToHex(color);
      this.ctx.globalAlpha = alpha;
    }

    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    this.pathStarted = false;
    return this;
  }

  stroke(options?: { color?: number; width?: number; alpha?: number } | any): this {
    if (options) {
      if (options.color !== undefined) {
        this.ctx.strokeStyle = this.colorToHex(options.color);
      }
      if (options.width !== undefined) {
        this.ctx.lineWidth = options.width;
      }
      if (options.alpha !== undefined) {
        this.ctx.globalAlpha = options.alpha;
      }
    }

    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    this.pathStarted = false;
    return this;
  }

  // Line drawing
  moveTo(x: number, y: number): this {
    if (!this.pathStarted) {
      this.ctx.beginPath();
      this.pathStarted = true;
    }
    this.ctx.moveTo(x, y);
    return this;
  }

  lineTo(x: number, y: number): this {
    if (!this.pathStarted) {
      this.ctx.beginPath();
      this.pathStarted = true;
    }
    this.ctx.lineTo(x, y);
    return this;
  }

  // Arc and path methods
  arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this {
    if (!this.pathStarted) {
      this.ctx.beginPath();
      this.pathStarted = true;
    }
    this.ctx.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
    return this;
  }

  closePath(): this {
    this.ctx.closePath();
    return this;
  }

  // Texture support
  texture(texture: ITexture): this {
    // For Three.js/CSS2D Canvas, we can't directly use Pixi textures
    // This is a no-op for CSS-based graphics
    return this;
  }

  private colorToHex(color: number): string {
    return '#' + color.toString(16).padStart(6, '0');
  }
}

/**
 * Three.js Text Wrapper
 */
class ThreeTextWrapper extends ThreeDisplayObjectBase implements IText {
  private _text: string;
  private _style: ITextStyle;
  private _anchor?: { x: number; y: number; set(x: number, y?: number): void };

  constructor(text: string, style?: ITextStyle) {
    const div = document.createElement('div');
    super(div);

    this._text = text;
    this._style = style || {};

    this.element.textContent = text;
    this.applyStyle(this._style);
    this.initializeAnchor();
  }

  private initializeAnchor(): void {
    this._anchor = {
      x: 0,
      y: 0,
      set: (x: number, y?: number) => {
        const yVal = y !== undefined ? y : x;
        this.element.style.transformOrigin = `${x * 100}% ${yVal * 100}%`;
        this._anchor!.x = x;
        this._anchor!.y = yVal;
      }
    };
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    this.element.textContent = value;
  }

  get style(): ITextStyle {
    return this._style;
  }

  set style(value: ITextStyle) {
    this._style = value;
    this.applyStyle(value);
  }

  get width(): number {
    return this.element.offsetWidth;
  }

  get height(): number {
    return this.element.offsetHeight;
  }

  get anchor(): { x: number; y: number; set(x: number, y?: number): void } | undefined {
    return this._anchor;
  }

  set anchor(value: { x: number; y: number; set?(x: number, y?: number): void } | undefined) {
    if (value && this._anchor) {
      this._anchor.x = value.x;
      this._anchor.y = value.y;
      this.element.style.transformOrigin = `${value.x * 100}% ${value.y * 100}%`;
    }
  }

  private applyStyle(style: ITextStyle): void {
    if (style.fontFamily) this.element.style.fontFamily = style.fontFamily;
    if (style.fontSize) this.element.style.fontSize = `${style.fontSize}px`;
    if (style.fontWeight) this.element.style.fontWeight = style.fontWeight;

    if (style.fill !== undefined) {
      if (typeof style.fill === 'number') {
        this.element.style.color = '#' + style.fill.toString(16).padStart(6, '0');
      } else {
        this.element.style.color = style.fill as string;
      }
    }

    if (style.align) this.element.style.textAlign = style.align;
    if (style.wordWrap) this.element.style.whiteSpace = 'normal';
    if (style.wordWrapWidth) this.element.style.maxWidth = `${style.wordWrapWidth}px`;

    // Handle Pixi v8 dropShadow object format
    if (style.dropShadow && typeof style.dropShadow === 'object') {
      const shadow = style.dropShadow as { color?: number | string; distance?: number; blur?: number };
      if (shadow.color !== undefined && shadow.distance !== undefined) {
        const color =
          typeof shadow.color === 'number'
            ? '#' + shadow.color.toString(16).padStart(6, '0')
            : shadow.color;

        this.element.style.textShadow = `${shadow.distance}px ${shadow.distance}px ${shadow.blur || 0}px ${color}`;
      }
    }
  }
}

/**
 * Three.js Sprite Wrapper
 */
class ThreeSpriteWrapper extends ThreeDisplayObjectBase implements ISprite {
  private _texture: ITexture;
  private img: HTMLImageElement;
  private _anchor?: { x: number; y: number; set(x: number, y: number): void };
  private _width: number = 0;
  private _height: number = 0;

  constructor(texture: ITexture | string) {
    const img = document.createElement('img');
    super(img);

    this.img = img;
    this.initializeAnchor();

    if (typeof texture === 'string') {
      this.img.src = texture;
      this._texture = { width: 0, height: 0, destroy: () => {} };
    } else {
      this._texture = texture;
      // Texture should be a canvas or image URL
    }
  }

  private initializeAnchor(): void {
    this._anchor = {
      x: 0,
      y: 0,
      set: (x: number, y: number) => {
        this.element.style.transformOrigin = `${x * 100}% ${y * 100}%`;
        this._anchor!.x = x;
        this._anchor!.y = y;
      }
    };
  }

  get texture(): ITexture {
    return this._texture;
  }

  set texture(value: ITexture) {
    this._texture = value;
  }

  get width(): number {
    return this._width || this.img.width;
  }

  set width(value: number) {
    this._width = value;
    this.img.width = value;
  }

  get height(): number {
    return this._height || this.img.height;
  }

  set height(value: number) {
    this._height = value;
    this.img.height = value;
  }

  get anchor(): { x: number; y: number; set(x: number, y: number): void } | undefined {
    return this._anchor;
  }

  set anchor(value: { x: number; y: number; set?(x: number, y: number): void } | undefined) {
    if (value && this._anchor) {
      this._anchor.x = value.x;
      this._anchor.y = value.y;
      this.element.style.transformOrigin = `${value.x * 100}% ${value.y * 100}%`;
    }
  }

  get tint(): number | undefined {
    return undefined; // TODO: Implement color filter
  }

  set tint(value: number | undefined) {
    // TODO: Implement color filter
  }
}

/**
 * Three.js Texture Wrapper
 */
class ThreeTextureWrapper implements ITexture {
  private source: HTMLCanvasElement | HTMLImageElement | string;

  constructor(source: HTMLCanvasElement | HTMLImageElement | string) {
    this.source = source;
  }

  get width(): number {
    if (typeof this.source === 'string') return 0;
    return this.source.width;
  }

  get height(): number {
    if (typeof this.source === 'string') return 0;
    return this.source.height;
  }

  destroy(): void {
    // Nothing to clean up for DOM elements
  }

  getSource(): HTMLCanvasElement | HTMLImageElement | string {
    return this.source;
  }
}

/**
 * Three.js Graphics Factory
 */
export class ThreeGraphicsFactory implements IGraphicsFactory {
  createContainer(): IContainer {
    return new ThreeContainerWrapper();
  }

  createGraphics(): IGraphics {
    return new ThreeGraphicsWrapper();
  }

  createText(text: string, style?: ITextStyle): IText {
    return new ThreeTextWrapper(text, style);
  }

  createSprite(texture: ITexture | string): ISprite {
    return new ThreeSpriteWrapper(texture);
  }

  createTexture(source: HTMLCanvasElement | HTMLImageElement | string): ITexture {
    return new ThreeTextureWrapper(source);
  }

  createCanvasTexture(
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void
  ): ITexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      draw(ctx);
    }

    return new ThreeTextureWrapper(canvas);
  }
}
