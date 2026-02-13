/**
 * Pixi.js Graphics Factory Implementation
 *
 * Provides Pixi.js-based implementations of framework graphics primitives.
 * This allows UI components to work with Pixi.js without directly importing it.
 */

import * as PIXI from 'pixi.js';
import {
  IGraphicsFactory,
  IContainer,
  IGraphics,
  IText,
  ITextStyle,
  ISprite,
  ITexture,
  IFillGradient,
  ILinearGradientConfig,
  IRadialGradientConfig,
  IFilter,
  IMask,
  IBlurFilterOptions,
  IColorMatrixFilterOptions,
  IDropShadowFilterOptions,
  IGlowFilterOptions,
  IOutlineFilterOptions,
} from '../contracts/Graphics';
import { getFrameworkFontFamily } from '../ui/utils/FontLoader';
import { Logger } from '../utils/Logger.js';

/**
 * Pixi.js Container Wrapper
 */
class PixiContainerWrapper extends PIXI.Container implements IContainer {
  // IContainer already matches PIXI.Container interface
  // Just need to ensure EventEmitter compatibility
}

/**
 * Pixi.js Graphics Wrapper
 * Uses Pixi v8 modern API only
 * PIXI.Graphics already implements all IGraphics methods, so we just extend it
 */
class PixiGraphicsWrapper extends PIXI.Graphics implements IGraphics {
  // All v8 methods are inherited from PIXI.Graphics:
  // rect(), roundRect(), circle(), ellipse(), poly(), fill(), stroke(),
  // moveTo(), lineTo(), texture(), clear()
}

// No wrapper needed - use PIXI.Text directly

/**
 * Pixi.js FillGradient Wrapper
 */
class PixiFillGradientWrapper implements IFillGradient {
  private gradient: PIXI.FillGradient;
  readonly type: 'linear' | 'radial';

  constructor(gradient: PIXI.FillGradient, type: 'linear' | 'radial') {
    this.gradient = gradient;
    this.type = type;
  }

  /** Get the native PIXI.FillGradient for use with graphics.fill() */
  get native(): PIXI.FillGradient {
    return this.gradient;
  }

  destroy(): void {
    this.gradient.destroy();
  }
}

/**
 * Pixi.js Sprite Wrapper
 */
class PixiSpriteWrapper extends PIXI.Sprite implements ISprite {
  constructor(texture: ITexture | string) {
    if (typeof texture === 'string') {
      super(PIXI.Texture.from(texture));
    } else {
      super(texture as PIXI.Texture);
    }
  }
}

/**
 * Pixi.js Filter Wrapper
 */
class PixiFilterWrapper implements IFilter {
  private filter: PIXI.Filter;
  readonly type: string;

  constructor(filter: PIXI.Filter, type: string) {
    this.filter = filter;
    this.type = type;
  }

  get enabled(): boolean {
    return this.filter.enabled;
  }

  set enabled(value: boolean) {
    this.filter.enabled = value;
  }

  get native(): PIXI.Filter {
    return this.filter;
  }

  destroy(): void {
    this.filter.destroy();
  }
}

/**
 * Pixi.js Mask Wrapper
 */
class PixiMaskWrapper implements IMask {
  private _native: PIXI.Graphics | PIXI.Sprite;
  readonly type: 'graphics' | 'sprite' | 'color';
  inverted?: boolean;

  constructor(native: PIXI.Graphics | PIXI.Sprite, type: 'graphics' | 'sprite') {
    this._native = native;
    this.type = type;
    this.inverted = false;
  }

  get native(): PIXI.Graphics | PIXI.Sprite {
    return this._native;
  }

  destroy(): void {
    this._native.destroy();
  }
}

/**
 * Pixi.js Graphics Factory
 */
export class PixiGraphicsFactory implements IGraphicsFactory {
  createContainer(): IContainer {
    return new PixiContainerWrapper();
  }

  createGraphics(): IGraphics {
    return new PixiGraphicsWrapper();
  }

  createText(text: string, style?: ITextStyle): IText {
    // Pixi v8: new PIXI.Text({ text, style })
    // Apply framework defaults: font, stroke outline, and drop shadow for readability
    const styleWithDefaults: ITextStyle = {
      fontFamily: getFrameworkFontFamily(),
      // Default stroke for text outline (improves readability on any background)
      stroke: { color: 0x000000, width: 3 },
      // Default drop shadow for depth
      dropShadow: {
        color: 0x000000,
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        distance: 2
      },
      ...style  // User styles override defaults
    };
    const pixiStyle = PixiGraphicsFactory.convertToPixiV8Style(styleWithDefaults);
    return new PIXI.Text({ text, style: pixiStyle }) as any;
  }

  createSprite(texture: ITexture | string): ISprite {
    return new PixiSpriteWrapper(texture);
  }

  createTexture(source: HTMLCanvasElement | HTMLImageElement | string): ITexture {
    if (typeof source === 'string') {
      return PIXI.Texture.from(source);
    }
    return PIXI.Texture.from(source);
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

    return PIXI.Texture.from(canvas);
  }

  createLinearGradient(config: ILinearGradientConfig): IFillGradient {
    const gradient = new PIXI.FillGradient({
      type: 'linear',
      start: config.start,
      end: config.end,
      colorStops: config.colorStops,
      textureSpace: config.textureSpace || 'local',
    });
    return new PixiFillGradientWrapper(gradient, 'linear');
  }

  createRadialGradient(config: IRadialGradientConfig): IFillGradient {
    const gradient = new PIXI.FillGradient({
      type: 'radial',
      center: config.center,
      innerRadius: config.innerRadius,
      outerCenter: config.outerCenter || config.center,
      outerRadius: config.outerRadius,
      colorStops: config.colorStops,
      textureSpace: config.textureSpace || 'local',
    });
    return new PixiFillGradientWrapper(gradient, 'radial');
  }

  // ============================================
  // FILTERS (Pixi.js v8)
  // Core filters: BlurFilter, ColorMatrixFilter, DisplacementFilter, NoiseFilter, AlphaFilter
  // Extended filters require 'pixi-filters' package
  // ============================================

  createBlurFilter(options: IBlurFilterOptions = {}): IFilter {
    const filter = new PIXI.BlurFilter({
      strength: options.strength ?? 8,
      quality: options.quality ?? 4,
      kernelSize: options.kernelSize ?? 5,
    });
    return new PixiFilterWrapper(filter, 'blur');
  }

  createColorMatrixFilter(options: IColorMatrixFilterOptions = {}): IFilter {
    const filter = new PIXI.ColorMatrixFilter();
    if (options.matrix && options.matrix.length === 20) {
      // ColorMatrix requires exactly 20 values
      filter.matrix = options.matrix as any;
    }
    return new PixiFilterWrapper(filter, 'colorMatrix');
  }

  createDropShadowFilter(options: IDropShadowFilterOptions = {}): IFilter {
    // DropShadowFilter requires 'pixi-filters' package
    // Fallback: BlurFilter only (limited shadow effect)
    Logger.warn('Graphics',
      'DropShadowFilter requires pixi-filters package (npm install pixi-filters). ' +
      'Using BlurFilter as limited fallback.'
    );
    const blur = options.blur ?? 4;
    const filter = new PIXI.BlurFilter({ strength: blur });
    return new PixiFilterWrapper(filter, 'dropShadow');
  }

  createGlowFilter(options: IGlowFilterOptions = {}): IFilter {
    // GlowFilter requires 'pixi-filters' package
    // Fallback: BlurFilter only (limited glow effect)
    Logger.warn('Graphics',
      'GlowFilter requires pixi-filters package (npm install pixi-filters). ' +
      'Using BlurFilter as limited fallback.'
    );
    const distance = options.distance ?? 10;
    const filter = new PIXI.BlurFilter({ strength: distance * 0.5 });
    return new PixiFilterWrapper(filter, 'glow');
  }

  createOutlineFilter(options: IOutlineFilterOptions = {}): IFilter {
    // OutlineFilter requires 'pixi-filters' package
    // No good fallback available
    Logger.warn('Graphics',
      'OutlineFilter requires pixi-filters package (npm install pixi-filters). ' +
      'No fallback available - returning no-op filter.'
    );
    // Return a no-op filter
    const filter = new PIXI.AlphaFilter({ alpha: 1 });
    return new PixiFilterWrapper(filter, 'outline');
  }

  // ============================================
  // MASKS (Pixi.js v8)
  // ============================================

  createMaskFromGraphics(graphics: IGraphics): IMask {
    return new PixiMaskWrapper(graphics as unknown as PIXI.Graphics, 'graphics');
  }

  createMaskFromSprite(sprite: ISprite): IMask {
    return new PixiMaskWrapper(sprite as unknown as PIXI.Sprite, 'sprite');
  }

  /**
   * Convert framework text style to Pixi v8 style object format
   * Pixi v8 uses object format for stroke and dropShadow
   */
  static convertToPixiV8Style(style: ITextStyle): any {
    const config: any = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fill: style.fill,
      align: style.align,
      wordWrap: style.wordWrap,
      wordWrapWidth: style.wordWrapWidth,
      lineHeight: style.lineHeight,
    };

    if (style.fontStyle) {
      config.fontStyle = style.fontStyle;
    }

    // Pixi v8 stroke format: { color: number, width: number }
    if (style.stroke) {
      config.stroke = style.stroke;
    }

    // Pixi v8 dropShadow format: { alpha, angle, blur, color, distance }
    if (style.dropShadow) {
      config.dropShadow = style.dropShadow;
    }

    return config;
  }
}
