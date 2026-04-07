export { DragController } from './DragController.js';
export type { DragControllerConfig, DragEventData, DragSnapGrid } from './DragController.js';

export { GestureHandler3D } from './GestureHandler3D.js';
export type {
  GestureHandler3DConfig,
  GestureEvents,
  ScreenPosition,
  TapEvent,
  DoubleTapEvent,
  LongPressEvent,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  PinchEvent,
  PinchStartEvent,
  PinchEndEvent,
  CameraController,
  // Object3DPicker and DragController from GestureHandler3D are local stub
  // interfaces; omitted here to avoid collision with the real class exports below.
} from './GestureHandler3D.js';

export { Object3DPicker } from './Object3DPicker.js';
export type { PickResult, Object3DPickerConfig } from './Object3DPicker.js';

export { WorldObject3D } from './WorldObject3D.js';
export type { WorldObject3DEvents } from './WorldObject3D.js';

export { RaycastInputManager } from './RaycastInputManager.js';
export type { RaycastInputManagerEvents } from './RaycastInputManager.js';
