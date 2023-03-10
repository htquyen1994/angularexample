export enum OVERLAY_TYPE {
  DRAW = "__DRAW",
  SEARCH = "__SEARCH",
  INSIGHTS = "__INSIGHTS",
  DATA = "__DATA",
  FILTER = "__FILTER",
  REPORT = "__REPORT",
  QUICKEDIT = "__QUICKEDIT",
  NEAREST = "__NEAREST"
}

export const NOT_DRAWING_OVERLAYS  = [
  OVERLAY_TYPE.DATA,
  OVERLAY_TYPE.FILTER,
  OVERLAY_TYPE.SEARCH,
  OVERLAY_TYPE.NEAREST,
  OVERLAY_TYPE.INSIGHTS
]
