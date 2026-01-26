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
} from '../contracts/Graphics';
import { getFrameworkFontFamily } from '../ui/utils/FontLoader';

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
    // Apply framework default font if not specified
    const styleWithDefaults: ITextStyle = {
      fontFamily: getFrameworkFontFamily(),
      ...style
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

  /**
   * Convert framework text style to Pixi v8 style object format
   * Pixi v8 uses object format for stroke and dropShadow in Text constructor
   * Supports both legacy format and modern Pixi v8 format
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

    // Copy fontStyle if present
    if (style.fontStyle) {
      config.fontStyle = style.fontStyle;
    }

    // Pixi v8 stroke format: { color: number, width: number }
    // Handle both legacy (stroke as color number) and modern (stroke as object) formats
    if (style.stroke !== undefined) {
      const strokeValue = style.stroke as any;
      if (typeof strokeValue === 'object' && strokeValue !== null && 'color' in strokeValue) {
        // Modern Pixi v8 format: { color, width }
        config.stroke = strokeValue;
      } else if (typeof strokeValue === 'number' || typeof strokeValue === 'string') {
        // Legacy format: stroke is a color number/string
        config.stroke = {
          color: strokeValue,
          width: style.strokeThickness ?? 0
        };
      }
    } else if (style.strokeThickness !== undefined && style.strokeThickness > 0) {
      // Legacy format with only strokeThickness
      config.stroke = {
        color: 0x000000,
        width: style.strokeThickness
      };
    }

    // Pixi v8 dropShadow format: { alpha, angle, blur, color, distance }
    // Handle both legacy (dropShadow as boolean) and modern (dropShadow as object) formats
    if (style.dropShadow !== undefined) {
      const dropShadowValue = style.dropShadow as any;
      if (typeof dropShadowValue === 'object' && dropShadowValue !== null) {
        // Modern Pixi v8 format: { alpha, angle, blur, color, distance }
        config.dropShadow = dropShadowValue;
      } else if (dropShadowValue === true) {
        // Legacy format: dropShadow is boolean, use individual properties
        config.dropShadow = {
          alpha: style.dropShadowAlpha ?? 0.8,
          angle: style.dropShadowAngle ?? 0.523599, // ~30 degrees
          blur: style.dropShadowBlur ?? 0,
          color: style.dropShadowColor ?? 0x000000,
          distance: style.dropShadowDistance ?? 5
        };
      }
    }

    return config;
  }
}
