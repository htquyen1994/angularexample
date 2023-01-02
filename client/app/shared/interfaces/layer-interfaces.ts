import { ILayerColumnType, LayerType, DataAction, LayerJoinType, OverlayLabelType, LayerCreationMethod, ILayerColumnTypeLong } from "../enums";
import { LayerSource } from "../LayerSource";
import { ClientCache } from "../ClientCache";
import { ISchema, DataTypeFlags, IField, Field } from "../Data/Packaging";
import { IBufferTile } from "../../iface/IBufferTIle"

export interface IFeatureBoundsRequest {
  Ids: string[];
}

export interface ILayerColumnBase {
  id: string;
  name: string;
  type: ILayerColumnType;
  groupId: number;
  required: boolean;
}

export interface ILayerColumn extends ILayerColumnBase {
  isIndexUndefined?: boolean;
  index?: number;
  readOnly: boolean;
  minValue: number;
  maxValue: number;
  minLength: number;
  maxLength: number;
  notFilterable: boolean;
  notSelectable: boolean;
  notSortable: boolean;
  notComparable: boolean;
  isLabel: boolean;
  isIdentifier: boolean;
  isTextarea: boolean;
  isAddress: boolean;
  isPostcode: boolean;
  isLatitude: boolean;
  isLongitude: boolean;
  isJoinable: boolean;
  format: string[];

  isPicklist: boolean;
  isEditablePicklist: boolean;
  isParentPickList: boolean;
  isChildPickList: boolean;
  ChildPickListColumnName: string;
  MatchPercentageField: string;
  DensityField: string;
  isPercentage: boolean;
  isUrlFormatted: boolean;
  isCentroid: boolean;
  isDefaultGeometry: boolean;
  isColour: boolean;
  expanded?: boolean;
  isInfo?: boolean;
  defaultColumnWidth?: number;

  sourceName?: string;
  sourceIndex?: number;
  sourceLayer?: string;
}

export interface ILayerColumnGroup {
  Index: number;
  Name: string;
  Description: string;
  HasTotal: boolean;
  children?: ILayerColumn[];
  expanded?: boolean;
}

export interface ILayerBase {
  id: string;
  type: LayerType;
  owner?: string;
  joinType: LayerJoinType;
  joinLayerType: string;
  source: LayerSource;
  name: string;
  apiKey: string;
  description: string;
  columns: ILayerColumn[];
  columnGroups: ILayerColumnGroup[];
}

export interface ShareResult {
  Status: string;
}

export interface UnShareResult {
  Status: string;
}

export interface AclEntry {
  UserName: string;
  PermissableActions: DataAction[];
}


export interface ILayer extends ILayerBase {
  minZoom: number;
  maxZoom: number;
  minClusteredZoom?: number;
  maxClusteredZoom?: number;
  minHeatmapZoom?: number;
  maxHeatmapZoom?: number;

  isEditable: boolean;
  isDownloadable: boolean;
  isRestrictedDownloadable: boolean;
  hasInfo: boolean;
  showGroupHeaders?: boolean;

  // turned on by default
  defaultDisplay?: boolean;
  defaultActive?: boolean;
  hasInsight?: boolean;

  // custom properties
  isActive?: boolean;
  heatMapOnly?: boolean;
  isInsightActive?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  isCollapsed?: boolean;
  selectedRecords?: string[];
  groupId?: number;
  dataCache: ClientCache;
  schema: ISchema;
  clippingGeometryNames: string[];

  //bundle
  bundleId?: string;

  //buffer tiles
  zoomConfig?: { [key: number]: IZoomConfig }
}

export interface IZoomConfig {
  bufferTile: IBufferTile;
}

export interface ILayerCreate extends ILayerBase {
  file: string;
  layerId: string;
  groupId: number;
  method: LayerCreationMethod;
  isPicklist: boolean;
  columnLabel: string;
  columnIdentifier: string;
  hasHeader: boolean;
  joinColumnList?: any;
}



export interface ISelectItem {
  Table: string;
  Field: string;
  Alias: string;
}

export interface ResponseLayerFieldType {
  type: DataTypeFlags;
  attributes: Array<'Identifier' | 'TextArea' | 'Postcode' | 'PostSector' | 'PostArea' |
    'PostDistrict' | 'CensusOutputArea' | 'RouteTown' | 'Latitude' | 'Longitude' |
    'CreatePickList' | 'Label' | 'Colour' | 'MoneyGbp' | 'MoneyEur' | 'MoneyUsd'>;
}

export interface ResponseLayerField {
  id: string;
  name: string;
  sourceName: string;
  sourceLayer?: string;
  sourceIndex?: number;
  required: boolean;
  type: ResponseLayerFieldType;
  fieldGroupId: number;
}

export interface ResponseLayerGroup {
  fieldGroupId: number;
  name: string;
}

export interface ResponseLayerJoin {
  sourceColumnIndex: number;
  joinLayerId: string;
}

export interface ResponseLayer {
  layerId: string;
  dataPackageId: string;
  layerDescription: string;
  file: string;
  layerGroupId: number;
  layerShortName: string;
  layerName: string;
  type: LayerType;
  modifiedFields: ResponseLayerField[];
  fields?: ResponseLayerField[];
  fieldGroups: ResponseLayerGroup[];
  joins: ResponseLayerJoin[];
  isFirstRowHeaders: boolean;
}

export function convertFromILayerColumnTypeLong(column: ILayerColumn | any, isIdentifier?: string, isLabel?: string): ResponseLayerFieldType {
  const object: ResponseLayerFieldType = {
    type: null,
    attributes: []
  };

  switch (parseInt(<any>column.type, 10)) {
    case ILayerColumnTypeLong.BOOLEAN:
      object.type = DataTypeFlags.Boolean;
      break;
    case ILayerColumnTypeLong.LATITUDE:
      object.type = DataTypeFlags.Double;
      object.attributes.push('Latitude');
      break;
    case ILayerColumnTypeLong.LONGITUDE:
      object.type = DataTypeFlags.Double;
      object.attributes.push('Longitude');
      break;
    case ILayerColumnTypeLong.FLOAT:
      object.type = DataTypeFlags.Double;
      break;
    case ILayerColumnTypeLong.NUMBER:
      object.type = DataTypeFlags.Int32;
      break;
    case ILayerColumnTypeLong.DATE:
      object.type = DataTypeFlags.DateTime;
      break;
    case ILayerColumnTypeLong.STRING:
      object.type = DataTypeFlags.String;
      break;
    case ILayerColumnTypeLong.TEXT:
      object.type = DataTypeFlags.String;
      object.attributes.push('TextArea');
      break;
    case ILayerColumnTypeLong.POSTCODE:
      object.type = DataTypeFlags.String;
      object.attributes.push('Postcode');
      break;
    case ILayerColumnTypeLong.POST_SECTOR:
      object.type = DataTypeFlags.String;
      object.attributes.push('PostSector');
      break;
    case ILayerColumnTypeLong.CENSUS_OUTPUT_AREA:
      object.type = DataTypeFlags.String;
      object.attributes.push('CensusOutputArea');
      break;
    case ILayerColumnTypeLong.ROUTE_TOWN:
      object.type = DataTypeFlags.String;
      object.attributes.push('RouteTown');
      break;
    case ILayerColumnTypeLong.POST_DISTRICT:
      object.type = DataTypeFlags.String;
      object.attributes.push('PostDistrict');
      break;
    case ILayerColumnTypeLong.POST_AREA:
      object.type = DataTypeFlags.String;
      object.attributes.push('PostArea');
      break;
    case ILayerColumnTypeLong.COLOUR:
      object.type = DataTypeFlags.String;
      object.attributes.push('Colour');
      break;
    case ILayerColumnTypeLong.MONEY_GBP:
      object.type = DataTypeFlags.Double;
      object.attributes.push('MoneyGbp');
      break;
    case ILayerColumnTypeLong.MONEY_EUR:
      object.type = DataTypeFlags.Double;
      object.attributes.push('MoneyEur');
      break;
    case ILayerColumnTypeLong.MONEY_USD:
      object.type = DataTypeFlags.Double;
      object.attributes.push('MoneyUsd');
      break;
    default:
      console.warn('Missing ILayerColumnType', column.type);

  }

  if (!column.required) {
    object.type = object.type + DataTypeFlags.Nullable;
  }

  if (isIdentifier && isIdentifier === column.id) {
    object.attributes.push('Identifier');
  }

  if (isLabel && isLabel === column.id) {
    object.attributes.push('Label');
  }

  if (column.isPicklist) {
    object.attributes.push('CreatePickList');
  }

  return object;
}

export function convertToILayerColumnType(fld: IField | number, attributes: any = {}): ILayerColumnType {

  let type: ILayerColumnType;

  if (typeof fld === 'number') {
    fld = <IField>{
      DataType: {
        Flags: fld
      }
    };
  }

  const field: IField = <IField>fld;

  if (Field.hasFlag(field, DataTypeFlags.Boolean)) {
    type = ILayerColumnType.BOOLEAN;
  } else if (Field.hasFlag(field, DataTypeFlags.Float) || Field.hasFlag(field, DataTypeFlags.Double)) {
    type = ILayerColumnType.FLOAT;
  } else if (Field.hasFlag(field, DataTypeFlags.Number)) {
    type = ILayerColumnType.NUMBER;
  } else if (Field.hasFlag(field, DataTypeFlags.String)) {
    type = ILayerColumnType.STRING;
  } else if (Field.hasFlag(field, DataTypeFlags.DateTime)) {
    type = ILayerColumnType.DATE;
  } else if (Field.hasFlag(field, DataTypeFlags.Geometry) || Field.hasFlag(field, DataTypeFlags.Geography)) {
    type = ILayerColumnType.SHAPE;
  }

  if (attributes.DefaultGeometry) {
    type = ILayerColumnType.SHAPE;
  }

  if (attributes.QuadKey) {
    type = ILayerColumnType.QUADKEY;
  }

  return type;
}

export function convertToLongType(type: ILayerColumnType, column?: ILayerColumn): ILayerColumnTypeLong {
  let x: ILayerColumnTypeLong;
  switch (type) {
    case ILayerColumnType.BOOLEAN:
      x = ILayerColumnTypeLong.BOOLEAN;
      break;
    case ILayerColumnType.NUMBER:
      x = ILayerColumnTypeLong.NUMBER;
      break;
    case ILayerColumnType.FLOAT:
      if (column && column.format) {
        const formatPipe = column.format[0];
        const format = column.format.slice(1);
        if (formatPipe == "currency") {
          x = convertToLongType_Currency(format[0]);
          break;
        }
      }
      x = ILayerColumnTypeLong.FLOAT;
      break;

    case ILayerColumnType.STRING:
      x = ILayerColumnTypeLong.STRING;
      if (column) {
        if (column.isTextarea) {
          x = ILayerColumnTypeLong.TEXT;
        } else if (column.isColour) {
          x = ILayerColumnTypeLong.COLOUR;
        }
      }
      break;
    case ILayerColumnType.DATE:
      x = ILayerColumnTypeLong.DATE;
      break;
    case ILayerColumnType.QUADKEY:
    case ILayerColumnType.SHAPE:
      break;

    default:
      console.warn('missing type', type);
  }
  return x;
}

export function convertToLongType_Currency(type: string) {
  let x: ILayerColumnTypeLong = ILayerColumnTypeLong.FLOAT;
  switch (type) {
    case 'GBP':
      x = ILayerColumnTypeLong.MONEY_GBP;
      break;
    case 'EUR':
      x = ILayerColumnTypeLong.MONEY_EUR;
      break;

    case 'USD':
      x = ILayerColumnTypeLong.MONEY_USD;
      break;

    default:
      break;
  }
  return x;
}
