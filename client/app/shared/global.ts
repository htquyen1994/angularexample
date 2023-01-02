import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { DynamicPipe } from '@client/app/shared/pipes';
import { ILayerColumn, OverlayShapeGeometry } from '@client/app/shared/interfaces';
import { ILayerColumnType } from './enums';
import { AbstractControl, FormGroup, FormArray, FormControl } from '@angular/forms';
import * as RGBColor from 'rgbcolor';
import { ELabelPosition } from './models/label.model';
import { SVG } from '@svgdotjs/svg.js'

// export const SETTINGS: any = (<any>window).periscopeSettings;
export const CATCHMENT_SETTINGS = {
  MIN_DURATION: 1,
  MIN_DISTANCE: 0.1, //km
  MIN_DISTANCE_CIRCLE: 0.1, //km

  MAX_DURATION_LOW: 120,
  MAX_DURATION_HIGH: 40,
  MAX_DISTANCE_LOW: 150, //km
  MAX_DISTANCE_HIGH: 30, //km
  MAX_DISTANCE_CIRCLE: 150, //km
};
export const MAX_MOBILE_WIDTH = 800;
export const MAX_LAPTOP_WIDTH = 1440;
export const MIN_RESULT_PANEL = 1236;
export const PAGE_SIZE = 5;
export enum Breakpoint {
  DESKTOP,
  LAPTOP,
  MOBILE
}
export const BRANCHES_LAYERID = '01ffd1cc-f4ad-4b1a-a760-213e36d91bdb';
export const RETAILERS_LAYERID = '56427234-448a-4663-88ff-0daddd3cde7d';
export const IS_MORRISON: boolean = '/b4782d2e-e84f-41a7-8783-114ef040c668' === location.pathname;
export const IS_POSTOFFICE: boolean = '/dd35a26b-b581-4979-a3c5-9b9b79f486d1' === location.pathname;
export const IS_ATF_UK: boolean = '/5e5b8f35-00cc-4484-a391-15b65717a73a' === location.pathname;
export function postOfficeRetailerLayers(): string[] {
  return [
    '56427234-448a-4663-88ff-0daddd3cde7d',
    '7ceb6f5f-e815-4817-95a2-e61609961b4b'
  ]
}
export const DEFAULT_ZOOM_BUFFER = {
  5: { x: 0, y: 0 },
  16: { x: 0, y: 0 },
  17: { x: 0, y: 0 },
  18: { x: 0, y: 0 }
}
export const DEFAULT_ZOOM_RENDER = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const DEFAULT_ZOOM_RENDER_POLYGONS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
export function isShowBranchDetails(layerId: string): boolean {
  return layerId === BRANCHES_LAYERID
}
export function isShowCustomEdit(layerId: string): boolean {
  return postOfficeRetailerLayers().includes(layerId);
}
export function isPostOfficeRetailer(layerId: string): boolean {
  return postOfficeRetailerLayers().includes(layerId);
}
export const GOOGLE_SCHEME = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC'];
// export const IS_MORRISON:boolean = '/f90da5b5-ecae-46d0-95c5-42ef327b652f' === location.pathname;

export const BASE_HREF = '/client/';

export const API_BASE_HREF = `${location.pathname}/`;

export const COLORS = {
  MAP_CREATION: '#7e69eb',
  MAP_CREATION_STROKE: '#5c5cb6',
  MAP_CREATION_TRANSPARENCY: 0.7,

  MAP_SELECTED: '#00ffff',
  MAP_SELECTED_STROKE: '#00e0e0',
  MAP_SELECTED_TRANSPARENCY: 0.7,

  MAP_ACTIVE: '#00aaaa',
  MAP_ACTIVE_STROKE: '#008e8e',
  MAP_ACTIVE_TRANSPARENCY: 0.7,

  MAP_FILTER: '#ffff00',
  MAP_FILTER_STROKE: '#eeee00',
  MAP_FILTER_TRANSPARENCY: 0.3,

  MAP_EDIT: '#FF0000',
  MAP_EDIT_STROKE: '#bb0000',
  MAP_EDIT_TRANSPARENCY: 0.7,
  MAP_EDIT_STROKE_WEIGHT: 0,

  MAP_EDIT_POINT: 'rgba(255, 0, 0, 0.3)',
  MAP_EDIT_STROKE_POINT: '#000000',
  MAP_EDIT_TRANSPARENCY_POINT: 1,
  MAP_EDIT_STROKE_WEIGHT_POINT: 1,


  MAP_SELECTION: '#d6d100',
  MAP_SELECTION_STROKE: '#b0ab00',

  LOCATION: '#00e6d6',
  NEAREST: '#333333',
  SEARCH: '#d600b4',

  GRADIENT_EMPTY: '#ffffff',
  GRADIENT_START: '#ffffff',
  GRADIENT_STOP: '#ff0000'
};

export const SHAPE_OPTIONS = {
  clickable: true
};

export const DEFAULT_ICON_SIZE = 10;
export const DEFAULT_OPACITY = 0.7;
export const MATCH_DEFAULT_OPACITY = 0.5;
export const MATCH_DEFAULT_COLOR = '#fb8072';
export const MINDATE = new Date(new Date().getFullYear() - 100, 0, 1);
export const MAXDATE = new Date();

export const COLOUR_RAMPS = {
  neon: ["#3a1353", "#581d7f", "#872e93", "#c8488a", "#eb7590", "#f6b5a4"],
  cool: ["#bee0cc", "#70c3d0", "#419dc5", "#316ba7", "#223b89", "#151e5e"],
  warm: ["#fdeb73", "#f6c15b", "#ed9445", "#e66731", "#b84a29", "#6a3a2d"]
}

export const CUSTOM_NEON_GRADIENT_STYLE = {
  gradient: COLOUR_RAMPS.neon,
  transparency:  0.6,
  strokeWeight: 2,
  strokeTransparency: 0.15,
  isFilterApplied: true
}

export const differ_icon_iconSize: {
  [nam: string]: {
    BOTTOM?: { x: number, y: number },
    BOTTOM_RIGHT?: { x: number, y: number },
    BOTTOM_LEFT?: { x: number, y: number },
    TOP?: { x: number, y: number },
    TOP_RIGHT?: { x: number, y: number },
    TOP_LEFT?: { x: number, y: number },
    RIGHT?: { x: number, y: number },
    LEFT?: { x: number, y: number },
  }
} = {
  CIRCLE: {
    BOTTOM_RIGHT: { x: -6, y: -6 },
    BOTTOM_LEFT: { x: 6, y: -6 },
    TOP_RIGHT: { x: -6, y: 6 },
    TOP_LEFT: { x: 6, y: 6 },
    LEFT: { x: 3, y: 0 },
    RIGHT: { x: -3, y: 0 },
    TOP: { x: 0, y: 3 },
    BOTTOM: { x: 0, y: -3 }
  },
  CIRCLE_FULL: {
    BOTTOM_RIGHT: { x: -3, y: -3 },
    BOTTOM_LEFT: { x: 3, y: -3 },
    TOP_RIGHT: { x: -3, y: 3 },
    TOP_LEFT: { x: 3, y: 3 },
  },
  RECTANGLE: {
    BOTTOM_RIGHT: { x: -3, y: -6 },
    BOTTOM_LEFT: { x: 4, y: -6 },
    TOP_RIGHT: { x: -3, y: 6 },
    TOP_LEFT: { x: 3, y: 6 },
    BOTTOM: { x: 0, y: -6 },
    TOP: { x: 0, y: 6 },
    LEFT: { x: 3, y: 0 },
    RIGHT: { x: -3, y: 0 },
  },
  TRIANGLE: {
    BOTTOM_RIGHT: { x: -3, y: -5 },
    BOTTOM_LEFT: { x: 3, y: -5 },
    TOP_RIGHT: { x: -6, y: 8 },
    TOP_LEFT: { x: 6, y: 8 },
    LEFT: { x: 4, y: 0 },
    RIGHT: { x: -4, y: 0 },
    TOP: { x: 0, y: 4 },
    BOTTOM: { x: 0, y: -5 }
  },
  SQUARE: {
    BOTTOM_RIGHT: { x: -3, y: -3 },
    BOTTOM_LEFT: { x: 3, y: -3 },
    TOP_RIGHT: { x: -3, y: 3 },
    TOP_LEFT: { x: 3, y: 3 },
    LEFT: { x: 3, y: 0 },
    RIGHT: { x: -3, y: 0 },
    TOP: { x: 0, y: 3 },
    BOTTOM: { x: 0, y: -3 }
  }
}

export function ICONSLIST(): any[] {
  return [ // array of icon class list based on type
    { type: "xls", icon: "client/assets/images/image_excel.png" },
    { type: "pdf", icon: "client/assets/images/image_pdf.png" },
    { type: "ppt", icon: "client/assets/images/image_powerpoint.png" },
    { type: "txt", icon: "client/assets/images/image_text.png" },
    { type: "doc", icon: "client/assets/images/image_word.png" },
  ];
}

export function getDiffer_icon_iconSize(iconName: string, scale: number) {
  let temp = null;
  const name = (iconName || 'circle').toLowerCase();
  if (['circle', 'location', 'circle_empty', 'hexagon', 'hexagon_empty', 'plus',
    'parking', , 'atm', 'bike', 'bus', 'petrol'].includes(name)) {
    temp = { ...differ_icon_iconSize["CIRCLE"] };
  } else if (['bridge', 'fencing', 'fish', 'house', 'info',
    'lightning', 'movie', 'star', 'surfing',
    'tower', 'vistahalf', 'waitingroom', 'walking', 'rejected_circle'].includes(name)) {
    temp = { ...differ_icon_iconSize["CIRCLE"] };
  } else if (['envelope_square', 'envelope_square_1'].includes(name)) {
    temp = { ...differ_icon_iconSize["RECTANGLE"] };
  } else if (['triangle', 'triangle_empty'].includes(name)) {
    temp = { ...differ_icon_iconSize["TRIANGLE"] };
  } else if (['square', 'square_empty'].includes(name)) {
    temp = { ...differ_icon_iconSize["SQUARE"] };
  }
  if (scale && temp) {
    Object.keys(temp).forEach(key => {
      const { x, y } = temp[key];
      temp[key] = {
        x: Math.round(x * scale),
        y: Math.round(y * scale)
      }
    })
  }
  return temp
}

export const ZINDEX = {
  OVERLAYS: 10000,
  SELECTION: 20000,
  LOCATION: 30000,
  LABEL: 40000,
  INFOWINDOW: 50000,
  ACTIVESHAPE: 60000,
  NEAREST: 200000
};

export const UNITS = {
  FOOT: { unit: 'ft', constant: 0.3048 },
  MILE: { unit: 'mi', constant: 1609.34 },
  METER: { unit: 'm', constant: 1 },
  KILOMETER: { unit: 'km', constant: 1000 },

  FOOT2: { unit: 'ft²', constant: 0.092903 },
  ACRE: { unit: 'ac', constant: 4046.86 },
  HECTAR: { unit: 'ha', constant: 10000 },
  MILE2: { unit: 'mi²', constant: 2590000 },
  METER2: { unit: 'm²', constant: 1 },
  KILOMETER2: { unit: 'km²', constant: 1000000 }
};

export enum FILETYPE {
  IMAGE,
  DOCUMENT
}

export const FILETYPEs = [{
  value: '.gif',
  display: '.gif',
  type: FILETYPE.IMAGE
}, {
  value: '.jpg',
  display: '.jpg',
  type: FILETYPE.IMAGE
}, {
  value: '.png',
  display: '.png',
  type: FILETYPE.IMAGE
}, {
  value: '.doc',
  display: '.doc',
  type: FILETYPE.DOCUMENT
}, {
  value: '.docx',
  display: '.doc(x)',
  type: FILETYPE.DOCUMENT
}, {
  value: '.pdf',
  display: '.pdf',
  type: FILETYPE.DOCUMENT
}, {
  value: '.xls',
  display: '.xls',
  type: FILETYPE.DOCUMENT
}, {
  value: '.xlsx',
  display: '.xls(x)',
  type: FILETYPE.DOCUMENT
}, {
  value: '.ppt',
  display: '.ppt',
  type: FILETYPE.DOCUMENT
}]

export function randomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function randomNewgroveColor() {
  var items: string[];
  items = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#bc80bd', '#d2975b', '#ffed6f', '#d64f1a', '#1f78b4', '#33a02c', '#9b7f00', '#184ed6', '#e31a1c', '#d9d9d9', '#ea84be', '#4fd4b9', '#808000']
  return items[Math.floor(Math.random() * items.length)];
}
export function randomClusterColor(except: string[]) {
  var items: string[];
  items = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#bc80bd', '#d2975b', '#ffed6f', '#d64f1a', '#1f78b4', '#33a02c', '#9b7f00', '#184ed6', '#e31a1c', '#d9d9d9', '#ea84be', '#4fd4b9', '#808000'].filter(e => !except.includes(e))
  return items[Math.floor(Math.random() * items.length)];
}


export function formatText(value: any, column: ILayerColumn): string {
  if (!column) {
    return value;
  }

  let converted = value;
  if (column.format) {
    let formatPipe = column.format !== null ? column.format[0] : null;
    let format = column.format !== null ? column.format.slice(1) : null;
    converted = (new DynamicPipe()).transform(value, formatPipe, format);
  } else {
    switch (column.type) {
      case ILayerColumnType.BOOLEAN:
        converted = value ? 'true' : 'false';
        break;
      case ILayerColumnType.DATE:
        converted = (new DatePipe('en-GB')).transform(value, 'dd/MM/yyyy');
        break;
      case ILayerColumnType.FLOAT:
        converted = (new DecimalPipe('en-GB')).transform(value, '1.1-1');
        break;
      case ILayerColumnType.NUMBER:
        if (column.isPercentage) {
          converted = (new PercentPipe('en-GB')).transform(value / 100, '1.1-1');
        } else {
          converted = (new DecimalPipe('en-GB')).transform(value);
        }
        break;
    }
  }

  if (converted === undefined || converted === null) {
    converted = '';
  }

  return converted;
}

export function formatMetric(value: number, power: number, isMetric: boolean, showUnit = true): string {

  let unit: { unit: string, constant: number } = null;
  let isRounding = false;

  if (power === 2) {
    value = Math.abs(value);
  }

  if (isMetric) {
    if (power === 1) {
      if (value < UNITS.KILOMETER.constant) {
        isRounding = true;
        unit = UNITS.METER;
      } else {
        unit = UNITS.KILOMETER;
      }
    } else {
      if (value < UNITS.KILOMETER2.constant) {
        isRounding = true;
        unit = UNITS.METER2;
      } else {
        unit = UNITS.KILOMETER2;
      }
    }
  } else {
    if (power === 1) {
      /*			if (value < UNITS.MILE.constant) {
                      isRounding = true;
                      unit = UNITS.FOOT;
                  } else {
                      unit = UNITS.MILE;
                  }*/
      unit = UNITS.MILE;
    } else {
      if (value < UNITS.ACRE.constant) {
        isRounding = true;
        unit = UNITS.FOOT2;
      } else if (value < UNITS.HECTAR.constant) {
        unit = UNITS.ACRE;
      } else if (value < UNITS.MILE2.constant) {
        unit = UNITS.HECTAR;
      } else {
        unit = UNITS.MILE2;
      }
    }
  }

  value = value / unit.constant;

  if (isRounding) {
    value = Math.round(value);
  }

  let formatValue = Number(value.toPrecision(3)).toString();

  if (value >= 1000) {
    formatValue = formatValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ',').toString();
  }

  if (showUnit) {
    formatValue = `${formatValue} ${unit.unit}`;
  }
  return formatValue;
}

export const TOOLTIPPOSITION = {
  AFTER: 'right',
  BEFORE: 'left',
  ABOVE: 'top',
  BELOW: 'bottom',
  LEFT: 'left',
  RIGHT: 'right'
}
export const DEFAULT_TOOLTIPPOSITION = 'above';

export const REPORT_CONFIG = {
  INSIGHT_REPORT_API: ""
}

export function getPseudoGuid() {
  var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
  var d0 = Math.random() * 0xffffffff | 0;
  return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff];
}

export function getGuid() {
  var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
  var d0 = Math.random() * 0xffffffff | 0;
  var d1 = Math.random() * 0xffffffff | 0;
  var d2 = Math.random() * 0xffffffff | 0;
  var d3 = Math.random() * 0xffffffff | 0;
  return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
    lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
    lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
    lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}

export const H3_RESOLUTIONS = [{
  resolution: 4,
  areaKm2: 1000,
  label: 'Level 4 (largest)'
}, {
  resolution: 5,
  areaKm2: 125,
  label: 'Level 5'
}, {
  resolution: 6,
  areaKm2: 20,
  label: 'Level 6'
}, {
  resolution: 7,
  areaKm2: 3,
  label: 'Level 7'
}, {
  resolution: 8,
  areaKm2: 0.5,
  label: 'Level 8 (smallest)'
}
//,{
//  resolution: 9,
//  areaKm2: 0.05,
//  label: 'Level 9 (smallest)'
//}
]
export const MAXSLIDERSUSED = 26;
export const MAXINTERSECTED = 5;
export const MAXUNIONED = 5;
export const MAXQUICKEDIT = 10;
export const ERRORCODE = {
  UNDEFINED: 'Something went wrong'
}
export function numberWithCommastoNumber(value) {
  let havingMinus = value.toString().indexOf("-")
  let havingDot = value.toString().indexOf(".")
  let splitString: string[] = value.toString().split(".");
  let number = splitString[0].split(",").join("");
  let result = splitString[1] ? number + "." + splitString[1] : havingDot != -1 ? number + "." : number;
  result = havingMinus == 0 ? "-" + result.split("-").join("") : result;
  return result;
}
export function numbertoNumberWithCommas(value) {
  let havingMinus = value.toString().indexOf("-")
  let havingDot = value.toString().indexOf(".")
  let splitString = value.toString().split(".");
  let numWithCommas = String(splitString[0]).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let result = splitString[1] ? numWithCommas + "." + splitString[1] : havingDot != -1 ? numWithCommas + "." : numWithCommas;
  result = havingMinus == 0 ? "-" + result.split("-").join("") : result;
  return result.toString();
}
export function checkVerticesCountWithinLimit(shape: OverlayShapeGeometry): boolean {
  let coordinates = shape.coordinates;
  if (shape.type !== 'MultiPolygon') {
    coordinates = [shape.coordinates];
  }

  for (const i of coordinates) {
    for (const j of i) {
      if (j.length > 500) {
        return false;
      }
    }
  }
  return true;
}
export function cloneAbstractControl<T extends AbstractControl>(control: T): T {
  let newControl: T;

  if (control instanceof FormGroup) {
    const formGroup = new FormGroup({}, control.validator, control.asyncValidator);
    const controls = control.controls;

    Object.keys(controls).forEach(key => {
      formGroup.addControl(key, cloneAbstractControl(controls[key]));
    })

    newControl = formGroup as any;
  }
  else if (control instanceof FormArray) {
    const formArray = new FormArray([], control.validator, control.asyncValidator);

    control.controls.forEach(formControl => formArray.push(cloneAbstractControl(formControl)))

    newControl = formArray as any;
  }
  else if (control instanceof FormControl) {
    newControl = new FormControl(control.value, control.validator, control.asyncValidator) as any;
  }
  else {
    throw new Error('Error: unexpected control value');
  }

  if (control.disabled) newControl.disable({ emitEvent: false });

  return newControl;
}

export function clean(arr: Array<string>) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === "") {
      arr.splice(i, 1);
    }
  }
  return arr;
}
export function isNumeric(string: any) {
  return !isNaN(parseFloat(string)) && isFinite(string);
}
export function isNumericInt(string: any) {
  return !isNaN(parseFloat(string)) && isFinite(string) && parseInt(string) == parseFloat(string);
}

export function toHex(hex) {
  if (!hex) return null;
  const color = new RGBColor(hex);
  const rbgcolor = new RGBColor(`rgb(${hex})`);
  if (color.ok) {
    return color.toHex();
  } else if (rbgcolor.ok) {
    return rbgcolor.toHex();
  } else {
    return null;
  }
}
export function toRGBA(hex) {
  if (!hex) return null;
  const color = new RGBColor(hex);
  const rbgcolor = new RGBColor(`rgb(${hex})`);
  const rbgacolor = new RGBColor(`rgba(${hex})`);
  if (color.ok) {
    return color.toRGBA();
  } else if (rbgcolor.ok) {
    return rbgcolor.toRGBA();
  } else if (rbgacolor.ok) {
    return rbgcolor.toRGBA();
  } else {
    return null;
  }
}
export function getBrowserName() {
  const agent = window.navigator.userAgent.toLowerCase()
  switch (true) {
    case agent.indexOf('edge') > -1:
      return 'edge';
    case agent.indexOf('opr') > -1 && !!(<any>window).opr:
      return 'opera';
    case agent.indexOf('chrome') > -1 && !!(<any>window).chrome:
      return 'chrome';
    case agent.indexOf('trident') > -1:
      return 'ie';
    case agent.indexOf('firefox') > -1:
      return 'firefox';
    case agent.indexOf('safari') > -1:
      return 'safari';
    default:
      return 'other';
  }
}
export function getPointBaseOnContainer(width, height, position: ELabelPosition, differ_icon_iconSize?: any) {
  let point: { x: number, y: number };
  switch (position) {
    case ELabelPosition.TOP:
      point = {
        x: 0,
        y: height / 2
      }
      break;
    case ELabelPosition.TOP_LEFT:
      point = {
        x: width / 2,
        y: height / 2
      }
      break;
    case ELabelPosition.TOP_RIGHT:
      point = {
        x: - width / 2,
        y: height / 2
      }
      break;
    case ELabelPosition.BOTTOM:
      point = {
        x: 0,
        y: - height / 2
      }
      break;
    case ELabelPosition.BOTTOM_LEFT:
      point = {
        x: width / 2,
        y: - height / 2
      }
      break;
    case ELabelPosition.BOTTOM_RIGHT:
      point = {
        x: - width / 2,
        y: - height / 2
      }
      break;
    case ELabelPosition.LEFT:
      point = {
        x: width / 2,
        y: 0
      }
      break;
    case ELabelPosition.RIGHT:
      point = {
        x: - width / 2,
        y: 0
      }
      break;
    default:
      point = {
        x: 0,
        y: 0
      }
      break;
  }
  if (differ_icon_iconSize) {
    const differ = differ_icon_iconSize[position];
    if (differ) {
      point.x -= differ.x;
      point.y -= differ.y;
    }
  }
  return { ...point }
}
export function getPointPixel(position, map) {
  var scale = Math.pow(2, map.getZoom());
  var nw = new google.maps.LatLng(
    map.getBounds().getNorthEast().lat(),
    map.getBounds().getSouthWest().lng()
  );
  var worldCoordinateNW = map.getProjection().fromLatLngToPoint(nw);
  var worldCoordinate = map.getProjection().fromLatLngToPoint(position);
  var pixelOffset = new google.maps.Point(
    Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
    Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
  );
  return pixelOffset
}
export function isImageName(name: string) {
  if (!name) return false;
  return (name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null);
}
export function getFileExtension(filename: string) {
  let ext = filename.split(".").pop();
  let obj = ICONSLIST().filter(row => {
    if (ext.startsWith(row.type)) {
      return true;
    }
  });
  if (obj.length > 0) {
    let icon = obj[0].icon;
    return icon;
  } else {
    return "client/assets/images/image_unrecognize.png";
  }
}
export function calculateVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

export function generateLayerIndicatorSVG(activeLevel, totalLevel) {
  // polygon height 6, width 16
  const draw = SVG().viewbox("0 0 24 24").size(24, 24)
  const paddingX = 2;
  const paddingY = 2;
  const maxHeight = Math.min(6 * totalLevel, 24);
  const heightForEach = Math.floor((maxHeight - paddingY * 2) / totalLevel);
  for (let index = totalLevel; index > 0; index--) { // 2 1 0
    const point = { x: paddingX, y: heightForEach * index };
    if (index != activeLevel) {
      draw.path(`m${point.x},${point.y}l10,-3l10,3l-10,3l-10,-3z`).fill("#fff").stroke('#333');
    } else {
      draw.path(`m${point.x},${point.y}l10,-3l10,3l-10,3l-10,-3z`).fill("#00babb").stroke('#333');
    }
  }
  return draw.svg();
}
export function generateLayerIndicatorSVGLine(activeLevel, totalLevel) {
  // line height 1, width 16
  const draw = SVG().viewbox("0 0 24 24").size(24, 24)
  const lineLength = 16;
  const paddingX = 4;
  const containerY = 1;
  const strokeWidth = 1.5;
  const spaceWidth = 1.5;
  const totalLineHeight = totalLevel * strokeWidth + (totalLevel - 1) * spaceWidth;
  const paddingY = (22 - totalLineHeight);
  const startPosition = {
    x1: paddingX,
    y1: paddingY + strokeWidth / 2 + containerY,
    x2: paddingX + lineLength,
    y2: paddingY + strokeWidth / 2 + containerY
  }
  for (let index = 1; index <= totalLevel; index++) {
    const { x1, y1, x2, y2 } = startPosition;
    if (activeLevel == index) {
      draw.line(x1, y1, x2, y2).stroke({ color: '#00babb', width: strokeWidth })
    } else {
      draw.line(x1, y1, x2, y2).stroke({ color: '#333', width: strokeWidth })
    }
    startPosition.y1 += spaceWidth + strokeWidth;
    startPosition.y2 += spaceWidth + strokeWidth;
  }
  return draw.svg();
}

export function geoCoderResultToString(results): string {
  let postcode = '';
  let administrative3 = '';
  let administrative2 = '';
  let locality = '';
  for (let i = 0; i < results.address_components.length; i++) {
    const addr = results.address_components[i];
    if (addr.types[0] === 'postal_code') {
      postcode = addr.long_name;
    } else if (addr.types[0] === 'locality') {
      locality = addr.long_name;
    }
    if (addr.types[0] === 'administrative_area_level_3') {
      administrative3 = addr.long_name;
    }
    if (addr.types[0] === 'administrative_area_level_2') {
      administrative2 = addr.long_name;
    }
  }
  const administrative = administrative3 === '' ? administrative2 : administrative3;
  const parts = [locality, administrative, postcode];
  const filtered = parts.filter(v => v !== '');
  return filtered.join(', ')
}
export function unique(value, index, self) {
  return self.indexOf(value) === index;
}
//export function  calculateVH() {
//  let vh = window.innerHeight * 0.01;
//  document.documentElement.style.setProperty('--vh', `${vh}px`);
//}
export function isBlank(str: string) {
  return (!str || /^\s*$/.test(str));
}
