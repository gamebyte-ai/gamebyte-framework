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

/**
 * Pixi.js Container Wrapper
 */
class PixiContainerWrapper extends PIXI.Container implements IContainer {
  // IContainer already matches PIXI.Container interface
  // Just need to ensure EventEmitter compatibility
}

/**
 * Pixi.js Graphics Wrapper
 */
class PixiGraphicsWrapper extends PIXI.Graphics implements IGraphics {
  // Add convenience methods that match our interface
  drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): this {
    this.roundRect(x, y, width, height, radius);
    return this;
  }

  beginTextureFill(options: { texture: ITexture }): this {
    this.beginTextureFill({ texture: options.texture as PIXI.Texture });
    return this;
  }
}

/**
 * Pixi.js Text Wrapper
 */
class PixiTextWrapper extends PIXI.Text implements IText {
  private _customStyle: ITextStyle;

  constructor(text: string, style?: ITextStyle) {
    // Convert our style to PIXI.TextStyle
    const pixiStyle = style ? PixiGraphicsFactory.convertTextStyle(style) : undefined;
    super(text, pixiStyle);
    this._customStyle = style || {};
  }

  // Override the style getter/setter to work with our interface
  get style(): any {
    return super.style;
  }

  set style(value: any) {
    if (value && typeof value === 'object') {
      // If it looks like our ITextStyle, convert it
      const pixiStyle = PixiGraphicsFactory.convertTextStyle(value as ITextStyle);
      super.style = pixiStyle as any;
      this._customStyle = value as ITextStyle;
    } else {
      super.style = value;
    }
  }

  getCustomStyle(): ITextStyle {
    return this._customStyle;
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
    return new PixiTextWrapper(text, style);
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
   * Convert framework text style to Pixi.js TextStyle
   */
  static convertTextStyle(style: ITextStyle): PIXI.TextStyle {
    const config: any = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fill: style.fill,
      align: style.align,
      wordWrap: style.wordWrap,
      wordWrapWidth: style.wordWrapWidth,
      lineHeight: style.lineHeight,
      stroke: style.stroke,
      dropShadow: style.dropShadow,
      dropShadowColor: style.dropShadowColor,
      dropShadowBlur: style.dropShadowBlur,
      dropShadowAngle: style.dropShadowAngle,
      dropShadowDistance: style.dropShadowDistance,
    };

    // Handle strokeThickness separately for compatibility
    if (style.strokeThickness !== undefined) {
      config.strokeThickness = style.strokeThickness;
    }

    return new PIXI.TextStyle(config);
  }
}
