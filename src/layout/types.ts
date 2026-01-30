/**
 * Layout Types
 *
 * TypeScript interfaces for the @pixi/layout integration.
 * Provides type-safe layout configuration for PixiJS display objects.
 */

/**
 * Flex direction options
 */
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/**
 * Flex wrap options
 */
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/**
 * Justify content options (main axis alignment)
 */
export type JustifyContent =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

/**
 * Align items options (cross axis alignment)
 */
export type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

/**
 * Align content options (multi-line alignment)
 */
export type AlignContent =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'stretch'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

/**
 * Align self options (per-child override)
 */
export type AlignSelf = 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

/**
 * Position type options
 */
export type PositionType = 'relative' | 'absolute';

/**
 * Overflow options
 */
export type Overflow = 'visible' | 'hidden' | 'scroll';

/**
 * Object fit options (for images/sprites)
 */
export type ObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

/**
 * Size value - can be number (pixels), string (percentage), or 'auto'/'intrinsic'
 */
export type SizeValue = number | string | 'auto' | 'intrinsic';

/**
 * Layout configuration interface
 * Maps to @pixi/layout's layout property
 */
export interface LayoutConfig {
  // Sizing
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  maxWidth?: SizeValue;
  minHeight?: SizeValue;
  maxHeight?: SizeValue;

  // Flexbox container properties
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  alignContent?: AlignContent;

  // Flexbox child properties
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: SizeValue;
  alignSelf?: AlignSelf;

  // Gap (spacing between children)
  gap?: number;
  rowGap?: number;
  columnGap?: number;

  // Positioning
  position?: PositionType;
  top?: SizeValue;
  right?: SizeValue;
  bottom?: SizeValue;
  left?: SizeValue;
  inset?: SizeValue;

  // Margin
  margin?: SizeValue;
  marginTop?: SizeValue;
  marginRight?: SizeValue;
  marginBottom?: SizeValue;
  marginLeft?: SizeValue;
  marginHorizontal?: SizeValue;
  marginVertical?: SizeValue;

  // Padding
  padding?: SizeValue;
  paddingTop?: SizeValue;
  paddingRight?: SizeValue;
  paddingBottom?: SizeValue;
  paddingLeft?: SizeValue;
  paddingHorizontal?: SizeValue;
  paddingVertical?: SizeValue;

  // Overflow & display
  overflow?: Overflow;
  display?: 'flex' | 'none';

  // Object fit (for sprites/images)
  objectFit?: ObjectFit;
  objectPosition?: string;

  // Visual styling (requires LayoutContainer/LayoutSprite)
  backgroundColor?: number | string;
  borderRadius?: number;

  // Aspect ratio
  aspectRatio?: number;
}

/**
 * LayoutSystem configuration options
 */
export interface LayoutSystemConfig {
  /** Enable automatic layout updates each frame */
  autoUpdate?: boolean;
  /** Enable debug visualization */
  enableDebug?: boolean;
  /** Throttle delay in milliseconds for batching recalculations */
  throttle?: number;
  /** Threshold for showing debug overlays */
  debugModificationCount?: number;
}

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: string;
  /** Minimum width for this breakpoint */
  minWidth: number;
  /** Maximum width for this breakpoint */
  maxWidth?: number;
  /** Scale factor for this breakpoint */
  scale?: number;
}

/**
 * Responsive layout configuration
 */
export interface ResponsiveLayoutConfig {
  /** Base design width */
  baseWidth: number;
  /** Base design height */
  baseHeight: number;
  /** Breakpoints for different screen sizes */
  breakpoints?: ResponsiveBreakpoint[];
  /** Scale mode: 'fit', 'fill', 'stretch', or 'none' */
  scaleMode?: 'fit' | 'fill' | 'stretch' | 'none';
  /** Maintain aspect ratio */
  maintainAspectRatio?: boolean;
}

/**
 * Layout preset names for common game UI patterns
 */
export type LayoutPreset =
  | 'center'
  | 'topBar'
  | 'bottomBar'
  | 'sidebar'
  | 'fullscreen'
  | 'card'
  | 'grid'
  | 'row'
  | 'column'
  | 'stack'
  | 'hud'
  | 'modal'
  | 'menu';

/**
 * Direction for stack/list layouts
 */
export type StackDirection = 'horizontal' | 'vertical';

/**
 * Spacing configuration
 */
export interface SpacingConfig {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}
