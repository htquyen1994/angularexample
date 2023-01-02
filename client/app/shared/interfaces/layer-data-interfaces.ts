export interface ILayerData {
  results: any[];
  notSetWidth?: boolean;
  shapeId?: any
}

export interface ColumnStatistics {
  min: number;
  max: number;
}


export interface PicklistEntry {
  Field: string;
  ValueFormat: string;
  ValueDescription: string;
  ValueOrder: number;
}

export interface ColumnDivide {
  Min: number;
  Max: number;
  SD: number;
  Step: number;
  Tiles: {
    Count: number,
    Tile: number
  }[];
}
