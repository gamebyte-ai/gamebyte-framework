/**
 * UI Components Module - GameByte Framework
 *
 * Individual UI components for building game interfaces.
 *
 * @module ui/components
 * @example
 * ```typescript
 * import { UIButton, GameStyleButton, TopBar } from '@gamebyte/framework/ui/components';
 * ```
 */

// Base Components
export { UIContainer } from './UIContainer.js';
export { UIButton } from './UIButton.js';
export { UIText } from './UIText.js';
export { UIPanel } from './UIPanel.js';
export { UIProgressBar } from './UIProgressBar.js';
export { TopBar, TopBarItemType } from './TopBar.js';
export type { TopBarConfig, TopBarItemConfig, TopBarTheme } from './TopBar.js';

// Game Style Components
export { GameStyleButton, GameButtons } from './GameStyleButton.js';
export type { GameStyleButtonConfig, GameButtonColorScheme } from './GameStyleButton.js';

export { HexagonLevelButton } from './HexagonLevelButton.js';
export type { HexagonLevelButtonConfig, HexagonColorScheme, LevelState } from './HexagonLevelButton.js';

export { GameTopBar } from './GameTopBar.js';
export type { GameTopBarConfig, ResourceItemConfig, ResourceType } from './GameTopBar.js';

export { LevelPath } from './LevelPath.js';
export type { LevelPathConfig, LevelData } from './LevelPath.js';

export { GameBottomNav } from './GameBottomNav.js';
export type { GameBottomNavConfig, NavItemConfig, NavItemType } from './GameBottomNav.js';

export { GameStylePanel } from './GameStylePanel.js';
export type { GameStylePanelConfig, GamePanelColorScheme } from './GameStylePanel.js';

export { GameToggle, GameToggleColors } from './GameToggle.js';
export type { GameToggleConfig, GameToggleColorScheme } from './GameToggle.js';

export { GameCheckBox, GameCheckBoxColors } from './GameCheckBox.js';
export type { GameCheckBoxConfig, GameCheckBoxColorScheme } from './GameCheckBox.js';

export { GameSlider, GameSliderColors } from './GameSlider.js';
export type { GameSliderConfig, GameSliderColorScheme } from './GameSlider.js';

export { GameTooltip, GameTooltipColors } from './GameTooltip.js';
export type { GameTooltipConfig, GameTooltipColorScheme, TooltipTailPosition } from './GameTooltip.js';

export { GameScrollBox, GameScrollBoxColors } from './GameScrollBox.js';
export type { GameScrollBoxConfig, GameScrollBoxColorScheme } from './GameScrollBox.js';

export { GameInput, GameInputColors } from './GameInput.js';
export type { GameInputConfig, GameInputColorScheme } from './GameInput.js';

export { GameList } from './GameList.js';
export type { GameListConfig } from './GameList.js';

export { GameRadioGroup, GameRadioColors } from './GameRadioGroup.js';
export type { GameRadioGroupConfig, GameRadioColorScheme, GameRadioOption } from './GameRadioGroup.js';

export { GameSelect, GameSelectColors } from './GameSelect.js';
export type { GameSelectConfig, GameSelectColorScheme, GameSelectOption } from './GameSelect.js';

// Virtual Controls
export { VirtualJoystick } from './VirtualJoystick.js';
export type {
  VirtualJoystickConfig,
  JoystickMoveData,
  JoystickDirection,
  JoystickStyle,
  ActivationZone
} from './VirtualJoystick.js';

// Merge Components
export { MergeGrid, MergeCell, MergeItem } from './merge/index.js';
export type {
  MergeGridConfig,
  MergeGridEvents,
  MergeCellConfig,
  MergeCellEvents,
  MergeItemConfig,
  MergeItemEvents
} from './merge/index.js';
