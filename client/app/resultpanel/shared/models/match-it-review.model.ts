import { MatchItGeometry } from "./match-it-geojson.model";

export interface ReviewModel {
  geoJsonObjects: MatchItGeometry[];
  gridRows: ReviewModelGridRow[];
  gridHeader: ReviewModelGridHeader[];
  gridHeaderGroup:ReviewModelGridHeaderGroup[];
  center?: {
  lat: number,
    lng: number
}
}
export interface ReviewModelGridRow {
  columnCells: { columnShortId: string; columnValue: string }[];
}

export interface ReviewModelGridHeader {
  columnShortId: string,
  columnValue: string,
  isHidden: boolean,
  isPercentage: boolean,
  columnFormat: any
  groupId: number
}
export interface ReviewModelGridHeaderGroup {
  groupId: number,
  groupName: string
}