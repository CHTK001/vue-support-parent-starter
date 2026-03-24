/**
 * 地图事件常量
 */
export const MAP_EVENTS = {
  MAP_CLICK: 'map-click' as const,
  MAP_RIGHT_CLICK: 'map-right-click' as const,
  MARKER_CLICK: 'marker-click' as const,
  MARKER_CREATE: 'marker-create' as const,
  MARKER_UPDATE: 'marker-update' as const,
  MARKER_DELETE: 'marker-delete' as const,
  SHAPE_CLICK: 'shape-click' as const,
  SHAPE_CREATE: 'shape-create' as const,
  SHAPE_UPDATE: 'shape-update' as const,
  SHAPE_DELETE: 'shape-delete' as const,
  UPDATE_CENTER: 'update:center' as const,
  UPDATE_ZOOM: 'update:zoom' as const,
  MAP_INITIALIZED: 'map-initialized' as const,
  TOOLBAR_TOOL_ACTIVATED: 'toolbar-tool-activated' as const,
  TOOLBAR_TOOL_DEACTIVATED: 'toolbar-tool-deactivated' as const,
  TOOLBAR_STATE_CHANGE: 'toolbar-state-change' as const,
  LAYER_CHANGE: 'layer-change' as const,
  GRID_ENABLED: 'grid-enabled' as const,
  GRID_DISABLED: 'grid-disabled' as const,
  FLIGHT_LINE_SELECTION_CHANGE: 'flight-line-selection-change' as const,
  MAP_MOVE: 'map-move' as const,
  MAP_ZOOM: 'map-zoom' as const,
  MAP_MOVE_END: 'map-move-end' as const,
  MAP_ZOOM_END: 'map-zoom-end' as const,
  MAP_MOUSE_MOVE: 'map-mouse-move' as const
}; 