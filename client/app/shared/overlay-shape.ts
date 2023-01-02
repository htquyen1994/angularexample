import { COLORS, ZINDEX, DEFAULT_ICON_SIZE, formatText, getPseudoGuid, getPointBaseOnContainer, getPointPixel, getDiffer_icon_iconSize, SHAPE_OPTIONS, toRGBA } from './global';
import { ICONS_PATH, ICONS, ICONS_SVG, ICONS_VIEWBOX, } from './models/overlayShapeIcon';
import { OverlayDataItem } from './overlay/overlay-abstact';
import { OverlayMeasurement, OverlayLabel } from './overlay-label';
import { MapToolType, OverlayShapeType, OverlayShapeChangeType, OverlayLabelType, OverlayShapeClass, NOT_DRAWING_OVERLAYS, OVERLAY_TYPE } from './enums';
import { OverlayLabelPoint, OverlayShapeOptions, OverlayShapeGeometry, OverlayShapeMeasurements, ILayer, OverlayLabelOptions, IconType } from './interfaces';
import { Subject } from 'rxjs';
import { Projection } from './map-utils/projection';
import { BASE_HREF } from './global';
import { debounceTime } from 'rxjs/operators';
import { OverlayShapeStatic } from './models/overlay-shape-static';
import { LineStyle, LayerStyleType } from './models/layer-style.model';
import { createSimpleError } from './http.util';
import { ILabelStyle, ELabelPosition } from './models/label.model';


function addDefaultOptions(opts: OverlayShapeOptions, isPoint: boolean = false): OverlayShapeOptions {
  return Object.assign({
    clickable: SHAPE_OPTIONS.clickable,
    isEditable: false,
    isActive: false,
    isSelected: false,
    isSelectable: true,
    isMeasurement: false,
    labelColumnId: null,
    isLabel: false,
    isVisible: true,

    icon: ICONS.CIRCLE,
    iconSize: DEFAULT_ICON_SIZE,

    transparency: isPoint ? 1 : COLORS.MAP_CREATION_TRANSPARENCY,
    fillColor: COLORS.MAP_CREATION,

    strokeTransparency: 1,
    strokeColor: COLORS.MAP_CREATION_STROKE,
    strokeWeight: 2,

    zIndex: 0
  }, opts);
}


export abstract class OverlayShape implements OverlayDataItem {

  public static index = 0;

  changeSource = new Subject<OverlayShapeChangeType>();
  change = this.changeSource.asObservable();

  mapRef: Array<any> = [];
  isMulti = false;

  measurement: OverlayMeasurement = null;
  zIndex = 0;
  labelZindex = this.zIndex + 1;

  private label: OverlayLabel = null;
  private gCode: string = null;
  static factory(id: string, type: OverlayShapeType, opts: OverlayShapeOptions, data = {}, layer: ILayer, overlayType?: number, overlayId?: string, havingOverlayRef?: boolean, layerIndex?: number): OverlayShape {
    let object: OverlayShape;
    switch (type) {
      case OverlayShapeType.Point:
      case OverlayShapeType.MultiPoint:
        object = new OverlayShapePoint(id, type, opts, data, layer, overlayType, OverlayShapeClass.POINT, layerIndex, overlayId, havingOverlayRef);
        break;

      case OverlayShapeType.LineString:
      case OverlayShapeType.MultiLineString:
        object = new OverlayShapeLine(id, type, opts, data, layer, overlayType, OverlayShapeClass.LINE, layerIndex, overlayId, havingOverlayRef);
        break;

      case OverlayShapeType.Polygon:
      case OverlayShapeType.MultiPolygon:
        object = new OverlayShapePolygon(id, type, opts, data, layer, overlayType, OverlayShapeClass.POLYGON, layerIndex, overlayId, havingOverlayRef);
        break;
      case OverlayShapeType.MultiPolygon:
        object = new OverlayShapePolygon(id, type, opts, data, layer, overlayType, OverlayShapeClass.POLYGON, layerIndex, overlayId, havingOverlayRef);
        break;
      case OverlayShapeType.Circle:
        object = new OverlayShapeCircle(id, type, opts, data, layer, overlayType, OverlayShapeClass.CIRCLE, layerIndex, overlayId, havingOverlayRef);
        break;

      case OverlayShapeType.Rectangle:
        object = new OverlayShapeRectangle(id, type, opts, data, layer, overlayType, OverlayShapeClass.RECTANGLE, layerIndex, overlayId, havingOverlayRef);
        break;

      default:
        console.warn('GEOMETRY TYPE NOT IMPLEMENTED', type);
        break;
    }
    return object;
  }

  static getEditShapeOptions(type: OverlayShapeType, opts: OverlayShapeOptions): OverlayShapeOptions {
    return {
      isEditable: true,
      isSelectable: false,
      fillColor: type === OverlayShapeType.Point ? COLORS.MAP_EDIT_POINT : COLORS.MAP_EDIT,
      strokeColor: type === OverlayShapeType.Point ? COLORS.MAP_EDIT_STROKE_POINT : COLORS.MAP_EDIT_STROKE,
      strokeWeight: type === OverlayShapeType.Point ? COLORS.MAP_EDIT_STROKE_WEIGHT_POINT : COLORS.MAP_EDIT_STROKE_WEIGHT,
      transparency: type === OverlayShapeType.Point ? COLORS.MAP_EDIT_TRANSPARENCY_POINT : COLORS.MAP_EDIT_TRANSPARENCY,
      zIndex: google.maps.Marker.MAX_ZINDEX * 2,
      isNotOptimized: true,
      isDisplayStrokePoint: type === OverlayShapeType.Point ? true : false,
      strokeDasharray: type === OverlayShapeType.Point ? '1 2' : null,
      ...opts,
    }
  }

  constructor(public id: string,
    public type: OverlayShapeType,
    public opts: OverlayShapeOptions,
    public data: any,
    public layer: ILayer,
    public overlayType: number,
    public overlayShapeType?: number,
    public layerIndex?: number,
    public overlayId?: string,
    public havingOverlayRef?: boolean) {
    this.gCode = getPseudoGuid();
    if (layerIndex) {
      this.zIndex = layerIndex;
    } else {
      OverlayShape.index++;
      this.zIndex = OverlayShape.index;
    }
    this.labelZindex = this.zIndex + 1;

    this.isMulti = [
      OverlayShapeType.MultiPoint,
      OverlayShapeType.MultiLineString,
      OverlayShapeType.MultiPolygon
    ].includes(type);

    if (Array.isArray(opts.geometry) || opts.geometry.lat || (opts.geometry.center && !opts.geometry.map) ||
      (opts.geometry instanceof google.maps.LatLngBounds)) {

      const geometry = this.convertGeometry(opts.geometry);
      delete opts.geometry;
      geometry.forEach((_: any) => {

        const o = Object.assign({}, this.opts);
        o.geometry = _;
        o.zIndex = (o.zIndex || 0) + this.zIndex + (this.opts.isActive ? ZINDEX.ACTIVESHAPE : 0);
        this.labelZindex = o.zIndex + 1;

        const options = this.getOptions(o);
        this.opts['optimized'] = options['optimized'];
        const ref = this.setMapRef(options);
        this.setEvents(ref);
        this.mapRef.push(ref);
      });

      // has map reference
    } else {
      const ref = opts.geometry;
      delete opts.geometry;
      this.opts = addDefaultOptions(opts);
      this.setEvents(ref);
      this.mapRef.push(ref);
    }

    this.updateLabelStyle();

    this.change.subscribe(change => {
      if (this.label) {
        if (change === OverlayShapeChangeType.DRAGSTART) {
          this.label.label.setMap(null);
          this.label.isDragging = true;
        }
        if (change === OverlayShapeChangeType.DRAGEND) {
          this.label.isDragging = false;
          this.label.label.setPosition(this.getCenter());
          this.label.label.setMap(OverlayShapeStatic.map);
        }
      }
      if (this.measurement) {
        if (change === OverlayShapeChangeType.DRAGSTART) {
          this.measurement.setMap(null);
          this.measurement.isDragging = true;
        }
        if (change === OverlayShapeChangeType.DRAGEND) {
          this.measurement.isDragging = false;
        }
      }
    });

    this.change.pipe(debounceTime(200)).subscribe(change => {
      this.gCode = getPseudoGuid();
      if (this.label) {
        if (!this.label.isDragging && this.label.label) {
          this.label.label.setPosition(this.getCenter());
        }
      }
      if (this.measurement) {
        if (!this.measurement.isDragging) {
          this.measurement.getUpdate(this.getMeasurements(), this.overlayShapeType, this.layer, this.id, this.data, this.opts, this.overlayId);
        }
      }
    });
  }

  update(opts: OverlayShapeOptions = {}, updateOptimize?: boolean, updateLabelCallback?: Function) {
    if (!updateOptimize) {
      if (opts.isMeasurement !== undefined) {
        if (opts.isMeasurement) {
          this.measurement = new OverlayMeasurement();
          this.measurement.change.subscribe(_ => {
            this.measurement.update(this.layer, this.type, () => {
              this.update({
                isMeasurement: false
              });
            });
            this.measurement.setMap(OverlayShapeStatic.map);
          });
          this.measurement.getUpdate(this.getMeasurements(), this.overlayShapeType, this.layer, this.id, this.data, this.opts, this.overlayId);

        } else {
          this.measurement.destroy();
          this.measurement = null;
        }
      }
    }

    this.opts = Object.assign({}, this.opts, opts);

    const o = Object.assign({}, this.getOptions(this.opts));
    o.zIndex = o.zIndex + this.zIndex + (this.opts.isActive ? ZINDEX.ACTIVESHAPE : 0);
    this.labelZindex = o.zIndex + 1;

    delete o.paths;
    OverlayShapeStatic.overlayService.ngZone.runOutsideAngular(() => {
      this.mapRef.forEach((ref: any) => {
        ref.setOptions(o);
      });
      if (!updateOptimize) {
        this.updateLabelStyle(updateLabelCallback);
      }
    });
  }

  updateMeasurement() {
    if (this.measurement) {
      this.measurement.getUpdate(this.getMeasurements(), this.overlayShapeType, this.layer, this.id, this.data, this.opts, this.overlayId);
    }
  }

  setLabelStyle(style: ILabelStyle, updatelabelCallback?: Function) {
    this.opts.labelStyle = style;
    this.updateLabelStyle(updatelabelCallback);
  }

  updateLabelStyle(updatelabelCallback: Function = null) {
    OverlayShapeStatic.overlayService.ngZone.runOutsideAngular(() => {
      const { labelStyle, labelType, isVisible } = this.opts;
      if (labelStyle && isVisible) {
        let value = this.data[labelStyle.columnName];
        if (this.layer) {
          const column = this.layer.columns.find(_ => _.id === labelStyle.columnName);
          value = formatText(value, column);
        }
        if (this.label) {
          this.label.destroy();
        }
        const { position } = labelStyle;
        const labelOption = this.getLabelOption(position);
        this.label = new OverlayLabel(this.getCenter(), this.labelZindex, value, this.type, labelOption, labelStyle);
        this.label.label.setPositionCallback(() => { // set callback
          OverlayShapeStatic.labelgunService.addLabel(this.label.label, this.id, updatelabelCallback);
          this.label.label.setPositionCallback(undefined);
        })
        this.label.label.setDestroyCallback(() => {
          OverlayShapeStatic.labelgunService.removeLabel(this.id);
        })
        this.setOptimize(false);
      } else if (this.label) {
        this.label.destroy();
        this.label = null;
        this.setOptimize(true);
      } else {
        this.setOptimize(true);
      }
    });
  }

  getZIndex(): number {
    return this.mapRef[0].get('zIndex');
  }

  clean() {
    this.mapRef.forEach((x: any) => x.setMap(null));

    if (this.measurement) {
      this.measurement.destroy();

    }
    if (this.label) {
      this.label.destroy();
    }
    this.changeSource.unsubscribe();
  }

  setOptimize(value) {
    if (this.opts['optimized'] == undefined || this.opts.isNotOptimized) {
      return;
    }
    if (!this.mapRef.find(e => e.optimized == value)) {
      this.opts['optimized'] = value
      this.update(undefined, true)
    }
  }
  abstract convertGeometry(shape: any): any;

  abstract serializeGeometry(): any;

  abstract getBounds(): google.maps.LatLngBounds;

  abstract setMapRef(opts: OverlayShapeOptions): any;

  abstract getCenter(): google.maps.LatLng;

  abstract getLabelOption(position: ELabelPosition): OverlayLabelOptions;

  abstract getAreaSize(): number;

  abstract contains(bounds: google.maps.LatLngBounds): boolean;

  abstract containsPolygon(polygon: google.maps.Polygon): boolean;

  abstract getMeasurements(): OverlayShapeMeasurements;

  abstract getOptions(opts: OverlayShapeOptions): any;

  setEvents(ref: any) {
    ref.addListener('click', (event: google.maps.MouseEvent) => {
      switch (OverlayShapeStatic.selectionService.activeToolStore) {
        case MapToolType.MEASUREMENT:
          if (this.havingOverlayRef) {
            this.update({
              isMeasurement: !this.opts.isMeasurement
            });
          }
          OverlayShapeStatic.selectionService.activeToolSource.next(MapToolType.MEASUREMENT);
          break;

        case MapToolType.SHAPE_DELETE:
          if (this.overlayType == OverlayShapeClass.DRAWING && this.opts.isSelectable) {
            this.clean();
            OverlayShapeStatic.selectionService.changeSelection({
              isAdd: false,
              overlayId: this.overlayId,
              shapeId: this.id.toString()
            });
            // this.overlayRef.deleteShape(this.id);
            if(!NOT_DRAWING_OVERLAYS.includes((<OVERLAY_TYPE>this.overlayId))){
              OverlayShapeStatic.overlayService.deleteShapeByOverlayId(this.overlayId, this.id);
            }
            // OverlayShapeStatic.selectionService.activeToolSource.next(MapToolType.SHAPE_DELETE);
          } else {
            OverlayShapeStatic.actionMessageService
              .sendInfo('Cannot delete because the shape exists in a layer.' +
                ' Please use the "Delete" command on the "LAYER DATA" tab.');
          }
          break;

        case MapToolType.SELECT_EDIT_SHAPE:
        case MapToolType.SELECT_EDIT_COMBINE:
          if (this.havingOverlayRef) {
            OverlayShapeStatic.selectionService.shapeSource.next(this);
            // OverlayShape.selectionService.activeToolSource.next(null);
          }
          break;
        case MapToolType.SELECT_FILTER_SHAPE:
          if ([OverlayShapeType.MultiPolygon, OverlayShapeType.Polygon, OverlayShapeType.Circle, OverlayShapeType.Rectangle]
            .includes(this.type)) {
            OverlayShapeStatic.selectionService.shapeSource.next(this);
            OverlayShapeStatic.selectionService.activeToolSource.next(MapToolType.SELECTION);
          }
          break;
        case MapToolType.SELECTION_MAP:
          if ([OverlayShapeType.MultiPolygon, OverlayShapeType.Polygon, OverlayShapeType.Circle, OverlayShapeType.Rectangle]
            .includes(this.type)) {

            OverlayShapeStatic.selectionService.shapeSource.next(this);
            OverlayShapeStatic.selectionService.activeToolSource.next(MapToolType.SELECTION);

          } else {
            OverlayShapeStatic.actionMessageService
              .sendInfo('Please select polygon');

          }
          break;
        case MapToolType.SELECTION:
          if (this.havingOverlayRef && this.opts.isSelectable) {
            OverlayShapeStatic.selectionService.changeSelection({
              isAdd: !this.opts.isSelected,
              overlayId: this.overlayId,
              shapeId: this.id.toString()
            });
          }
        case MapToolType.CLICK_MAP:
          if (this.havingOverlayRef) {
            let location = event.latLng;
            if (this.type === OverlayShapeType.Point) {
              location = ref.getPosition();
            }
            OverlayShapeStatic.selectionService.mapClickSource.next({ latLng: event.latLng });
          }
      }

    });

    ref.addListener('dragstart', () => {
      this.changeSource.next(OverlayShapeChangeType.DRAGSTART);
    });

    ref.addListener('dragend', () => {
      this.changeSource.next(OverlayShapeChangeType.DRAGEND);
    });

    if (ref.getPath) {
      ref.getPath().addListener('set_at', () => {
        this.changeSource.next(OverlayShapeChangeType.SET_AT);
      });

      ref.getPath().addListener('insert_at', () => {
        this.changeSource.next(OverlayShapeChangeType.INSERT_AT);
      });
    }

    if (this.type === OverlayShapeType.Rectangle) {
      ref.addListener('bounds_changed', () => {
        this.changeSource.next(OverlayShapeChangeType.BOUNDS_CHANGED);
      });
    }

    if (this.type === OverlayShapeType.Circle) {
      ref.addListener('radius_changed', () => {
        this.changeSource.next(OverlayShapeChangeType.RADIUS_CHANGED);
      });
      ref.addListener('center_changed', () => {
        this.changeSource.next(OverlayShapeChangeType.CENTER_CHANGED);
      });
    }
  }

  serializeWithType(isGoogleType = false): OverlayShapeGeometry {
    let type = OverlayShapeType[this.type];
    let coordinates = this.serializeGeometry();

    if (isGoogleType) {
      if (this.type === OverlayShapeType.Rectangle) {
        coordinates = this.mapRef[0].getBounds();
      } else if (this.type === OverlayShapeType.Circle) {
        coordinates = {
          center: this.mapRef[0].getCenter(),
          radius: this.mapRef[0].getRadius()
        };
      }

    } else {
      if ([OverlayShapeType.Circle, OverlayShapeType.Rectangle].includes(this.type)) {
        type = OverlayShapeType[OverlayShapeType.Polygon];
      }
    }

    return {
      type: type,
      coordinates: coordinates
    };
  }

  getGCode() {
    return this.gCode;
  }
}

export class OverlayShapePoint extends OverlayShape {

  static getDefaultOptions(opts: OverlayShapeOptions): google.maps.MarkerOptions {
    opts = addDefaultOptions(opts, true);
    const icon = OverlayShapePoint.getIcon(opts);
    const o: any = {
      map: OverlayShapeStatic.map,
      clickable: opts.clickable,
      visible: opts.isVisible,
      isSelectable: opts.isSelectable,
      suppressUndo: true,
      draggable: opts.isEditable,
      zIndex: opts.zIndex,
      optimized: opts.isNotOptimized ? false : opts['optimized'] != undefined ? opts['optimized'] : true, // TODO needed for zIndex. otherwise icons are rendered in one image (performance hit)
      icon: icon
    };

    if (opts.geometry) {
      o.position = opts.geometry;
    }
    return o;
  }

  static getIcon(opts: OverlayShapeOptions): google.maps.Icon {
    let resultIcon: google.maps.Icon;
    let _icon = {
      // anchor: new google.maps.Point(opts.iconSize / 2, opts.iconSize / 2),
      scale: opts.iconSize / DEFAULT_ICON_SIZE,
      fillColor: opts.isActive ? COLORS.MAP_ACTIVE : opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      fillOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.transparency,
      strokeWeight: opts.strokeWeight ? opts.strokeWeight : 0,
      strokeColor: opts.strokeColor ? opts.strokeColor : 0,
      strokeDasharray: opts.strokeDasharray ? opts.strokeDasharray : 0
    };
    const strokeDash = opts.strokeDasharray ? `;stroke-dasharray:${_icon.strokeDasharray};stroke-linecap: round;` : ''
    const stroke = opts.isDisplayStrokePoint ? `;stroke-width: ${_icon.strokeWeight}; stroke: ${OverlayShapePoint.hexToRgbA(_icon.strokeColor)}${strokeDash}` : '';
    const style = `fill: ${OverlayShapePoint.hexToRgbA(_icon.fillColor)};opacity: ${_icon.fillOpacity};transform: scale(1)${stroke}`
    const { icon } = opts;
    if(typeof icon == 'string'){
      if (ICONS_PATH[icon]) {
        let style = `fill: ${OverlayShapePoint.hexToRgbA(_icon.fillColor)};opacity: ${_icon.fillOpacity};transform: scale(1)${stroke}`
        resultIcon = {
          url: `data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" style="${style}"><path d="${ICONS_PATH[icon]}"></path></svg>`,
          size: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
          scaledSize: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
          anchor: new google.maps.Point(24 * _icon.scale / 2, 24 * _icon.scale / 2)
        };
      } else if (ICONS_SVG[icon]) {
        let style = `fill: ${OverlayShapePoint.hexToRgbA(_icon.fillColor)};opacity: ${_icon.fillOpacity};transform: scale(1)${stroke}`
        const viewbox = ICONS_VIEWBOX[icon] ? ICONS_VIEWBOX[icon] : '0 0 24 24'
        resultIcon = {
          url: `data:image/svg+xml;utf8,<svg viewBox="${viewbox}" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" style="${style}">${ICONS_SVG[icon]}</svg>`,
          size: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
          scaledSize: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
          anchor: new google.maps.Point(24 * _icon.scale / 2, 24 * _icon.scale / 2)
        };
      } else if (icon && icon.includes("PostOffice\\Competition")) {
        resultIcon = <google.maps.Icon>{
          scaledSize: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
          anchor: new google.maps.Point(24 * _icon.scale / 2, 24 * _icon.scale / 2),
          url: opts.isSelected ? `${BASE_HREF}assets/${icon}_selected.png` : `${BASE_HREF}assets/${icon}.png`
        };
      } else {
        opts.iconSize = 32;
        resultIcon = <google.maps.Icon>{
          anchor: new google.maps.Point(opts.iconSize / 2, opts.iconSize / 2),
          size: new google.maps.Size(opts.iconSize, opts.iconSize),
          scaledSize: new google.maps.Size(opts.iconSize, opts.iconSize),
          url: opts.isSelected ? `${BASE_HREF}assets/${icon}_selected.png` : `${BASE_HREF}assets/${icon}.png`
        };
      }
    }else{
      const { path, viewbox } = icon;
      resultIcon = {
        url: `data:image/svg+xml;utf8,<svg viewBox="${viewbox}" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" style="${style}">${path}</svg>`,
        size: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
        scaledSize: new google.maps.Size(24 * _icon.scale, 24 * _icon.scale),
        anchor: new google.maps.Point(24 * _icon.scale / 2, 24 * _icon.scale / 2)
      };
    }
    return resultIcon;
  }



  getOptions(opts: OverlayShapeOptions) {
    return OverlayShapePoint.getDefaultOptions(opts);
  }

  getCenter(): google.maps.LatLng {
    return this.mapRef[0].getPosition();
  }

  getLabelOption(position: ELabelPosition): OverlayLabelOptions {
    const { width, height } = this.mapRef[0].icon.size;
    const { icon, iconSize } = this.opts;
    const scale = iconSize / DEFAULT_ICON_SIZE;
    return getPointBaseOnContainer(width, height, position, getDiffer_icon_iconSize(typeof icon == 'string' ? icon : null, scale));
  }


  getAreaSize(): number {
    return null;
  }

  getMeasurements(): OverlayShapeMeasurements {
    const heights: google.maps.LatLng[] = [];
    const info: any[] = [];

    this.mapRef.forEach((ref: google.maps.Marker) => {
      const position = ref.getPosition();
      heights.push(position);

      const bng = new Projection().ConvertWGS84toBNG(position.lat(), position.lng());

      if (bng.easting > 0 && bng.easting < 700000 && bng.northing > 0 && bng.northing < 1300000) {
        info.push({
          point: position,
          label: `<b>BNG:</b> ${bng.easting} ${bng.northing}`
        });
      }
      info.push({
        point: position,
        label: `<b>LAT:</b> ${position.lat().toFixed(3)} <b>LNG:</b> ${position.lng().toFixed(3)}`
      });

    });

    return {
      lengths: [],
      heights,
      summary: [],
      info
    };
  }

  contains(bounds: google.maps.LatLngBounds): boolean {
    return bounds.contains(this.mapRef[0].getPosition());
  }

  containsPolygon(polygon: google.maps.Polygon): boolean {
    return google.maps.geometry.poly.containsLocation(this.mapRef[0].getPosition(), polygon);
  }

  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    return shape.map((x: number[]) => {
      return new google.maps.LatLng(x[1], x[0]);
    });
  }

  serializeGeometry() {
    let geometry: any = this.mapRef.map(shape => shape.getPosition())
      .map((x: google.maps.LatLng) => {
        return [x.lng(), x.lat()];
      });

    if (!this.isMulti) {
      geometry = geometry[0];
    }

    return geometry;
  }

  getBounds() {
    const bounds = new google.maps.LatLngBounds();
    this.mapRef.map(shape => shape.getPosition())
      .forEach((x: google.maps.LatLng) => {
        return bounds.extend(x);
      });
    return bounds;
  }

  setMapRef(opts: any) {
    return OverlayShapeStatic.overlayService.ngZone.runOutsideAngular(() => {
      return new google.maps.Marker(opts);
    });
  }

  static hexToRgbA(hex) {
    const _hex = toRGBA(hex);
    if (!_hex) throw createSimpleError('Bad Hex', undefined, {
      hex: hex
    });
    return _hex;
  }
}

export class OverlayShapeLine extends OverlayShape {

  static getDefaultOptions(opts: OverlayShapeOptions): google.maps.PolylineOptions {
    opts = addDefaultOptions(opts);
    const o: any = {
      map: OverlayShapeStatic.map,
      clickable: opts.clickable,
      suppressUndo: true,
      visible: opts.isVisible,
      draggable: opts.isEditable,
      editable: opts.isEditable,
      isSelectable: opts.isSelectable,
      zIndex: opts.zIndex,
      strokeColor: opts.isActive ? COLORS.MAP_ACTIVE_STROKE : opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.styleType == LayerStyleType.GRADIENT ? opts.fillColor : opts.strokeColor,
      strokeOpacity: opts.strokeTransparency,
      strokeWeight: opts.strokeWeight
    };

    if (opts.lineStyle == LineStyle.DASHED) {
      o.icons = [{
        icon: {
          path: "M 0,-1 0,1",
          strokeOpacity: o.strokeOpacity,
          scale: 2,
          strokeWeight: o.strokeWeight
        },
        offset: '0',
        repeat: '20px'
      }];
      o.strokeOpacity = 0;
    } else {
      o.icons = null;
    }

    if (opts.geometry) {
      o.path = opts.geometry;
    }

    return o;
  }

  getOptions(opts: OverlayShapeOptions) {
    return OverlayShapeLine.getDefaultOptions(opts);
  }

  getCenter(): google.maps.LatLng {
    return this.mapRef[0].getPath().getArray()[0];
  }

  getLabelOption(position: ELabelPosition): OverlayLabelOptions {
    return {}
  }

  getAreaSize(): number {
    return null;
  }

  getMeasurements(): OverlayShapeMeasurements {
    const lengths: OverlayLabelPoint[] = [];
    let heights: google.maps.LatLng[] = [];
    let fullLength = 0;
    this.mapRef.forEach((ref: google.maps.Polyline) => {
      heights = <any[]>ref.getPath().getArray();

      return ref.getPath().getArray().forEach((marker, index, array) => {
        if (index + 1 < array.length) {
          const point = google.maps.geometry.spherical.interpolate(marker, array[index + 1], 0.5);
          const value = google.maps.geometry.spherical.computeDistanceBetween(marker, array[index + 1]);
          lengths.push({ point, value });
          fullLength += value;
        }
      });
    });
    return {
      lengths,
      heights,
      summary: [],
      info: [
        // {
        //   point: this.mapRef[0].getPath().getArray()[0],
        //   value: 0,
        //   label: `${formatMetric(fullLength, 1, OverlayShapeStatic.isMetric)}`
        // }
      ]
    };
  }

  contains(bounds: google.maps.LatLngBounds): boolean {
    return !!this.mapRef[0].getPath().getArray().find((element: google.maps.LatLng) => {
      return bounds.contains(element);
    });
  }

  containsPolygon(polygon: google.maps.Polygon): boolean {
    return !!this.mapRef[0].getPath().getArray().find((point: google.maps.LatLng) => {
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });
  }

  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    return shape.map((x: any) => {
      return x.map((y: any) => {
        return new google.maps.LatLng(y[1], y[0]);
      });
    });
  }

  serializeGeometry() {

    let geometry: any = this.mapRef.map(shape => shape.getPath())
      .map((array: any) => {
        return array.getArray().map((x: google.maps.LatLng) => {
          return [x.lng(), x.lat()];
        });
      });

    if (!this.isMulti) {
      geometry = geometry[0];
    }

    return geometry;
  }

  getBounds() {
    const bounds = new google.maps.LatLngBounds();
    this.mapRef.map(shape => shape.getPath())
      .map((array: any) => {
        return array.getArray().map((x: google.maps.LatLng) => {
          return bounds.extend(x);
        });
      });
    return bounds;
  }

  setMapRef(opts: OverlayShapeOptions) {
    return new google.maps.Polyline(opts);
  }
}

export class OverlayShapePolygon extends OverlayShape {

  static getDefaultOptions(opts: OverlayShapeOptions): google.maps.PolygonOptions {
    opts = addDefaultOptions(opts);
    const o: any = {
      map: OverlayShapeStatic.map,
      clickable: opts.clickable,
      visible: opts.isVisible,
      draggable: opts.isEditable,
      editable: opts.isEditable,
      isSelectable: opts.isSelectable,
      zIndex: opts.zIndex,
      suppressUndo: true,
      fillOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.transparency,
      fillColor: opts.isActive ? COLORS.MAP_ACTIVE : opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      strokeOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.strokeTransparency,
      strokeColor: opts.isActive ? COLORS.MAP_ACTIVE_STROKE : opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.strokeColor,
      strokeWeight: opts.strokeWeight
    };
    if (opts.geometry) {
      o.paths = opts.geometry;
    }
    return o;
  }

  getOptions(opts: OverlayShapeOptions) {
    return OverlayShapePolygon.getDefaultOptions(opts);
  }

  getCenter(): google.maps.LatLng {
    return this.getBounds().getCenter();
  }

  getLabelOption(position: ELabelPosition): OverlayLabelOptions {
    const ne = getPointPixel(this.getBounds().getNorthEast(), this.mapRef[0].getMap());
    const sw = getPointPixel(this.getBounds().getSouthWest(), this.mapRef[0].getMap());
    const height = Math.abs(ne.y - sw.y);
    const width = Math.abs(ne.x - sw.x);
    const result = {
      x: 0,
      y: 0
    }
    switch (position) {
      case ELabelPosition.BOTTOM:
        result.x = 0;
        result.y = -height / 2;
        break;
      case ELabelPosition.BOTTOM_LEFT:
        result.x = width / 2;
        result.y = -height / 2;
        break;
      case ELabelPosition.BOTTOM_RIGHT:
        result.x = -width / 2;
        result.y = -height / 2;
        break;
      case ELabelPosition.LEFT:
        result.x = width / 2;
        result.y = 0;
        break;
      case ELabelPosition.RIGHT:
        result.x = -width / 2;
        result.y = 0;
        break;
      case ELabelPosition.TOP:
        result.x = 0;
        result.y = height / 2;
        break;
      case ELabelPosition.TOP_LEFT:
        result.x = width / 2;
        result.y = height / 2;
        break;
      case ELabelPosition.TOP_RIGHT:
        result.x = -width / 2;
        result.y = height / 2;
        break;

      default:
        break;
    }

    return result;
  }

  getAreaSize(): number {
    let areaSize = 0;
    this.mapRef.forEach((ref: google.maps.Polygon) => {
      areaSize += google.maps.geometry.spherical.computeSignedArea(ref.getPath().getArray());
    });
    return areaSize;
  }

  getMeasurements() {
    const lengths: OverlayLabelPoint[] = [];
    const heights: google.maps.LatLng[] = [];
    const summary: OverlayLabelPoint[] = [{ point: null, value: 0, label: '' }];
    const bounds = new google.maps.LatLngBounds();

    this.mapRef.forEach((ref: google.maps.Polygon) => {
      summary[0].value += google.maps.geometry.spherical.computeSignedArea(ref.getPath().getArray());
      // heights = <any[]> ref.getPath().getArray();

      return ref.getPath().getArray().forEach((point, index, array) => {
        // Todo remove when tiling has bounding box
        bounds.extend(point);

        /*			let nextPoint = index + 1 < array.length ? array[index + 1] : array[0];

         lengths.push({
         point: google.maps.geometry.spherical.interpolate(point, nextPoint, 0.5),
         label: google.maps.geometry.spherical.computeDistanceBetween(point, nextPoint)
         });*/
      });
    });

    summary[0].point = bounds.getCenter();

    heights.push(bounds.getCenter());

    const info = [{
      point: bounds.getCenter(),
      label: ''
    }];

    return {
      lengths,
      heights,
      summary,
      info
    };
  }

  contains(bounds: google.maps.LatLngBounds): boolean {
    return !!this.mapRef[0].getPath().getArray().find((element: google.maps.LatLng) => {
      return bounds.contains(element);
    });
  }

  containsPolygon(polygon: google.maps.Polygon): boolean {
    return !!this.mapRef[0].getPath().getArray().find((point: google.maps.LatLng) => {
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });
  }

  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    //if (shape[0] && shape[0][0] && shape[0][0][0] && shape[0][0][0].lat) {
    //    return shape;
    //}
    return shape.map((x: any) => {
      return x.map((y: any) => {
        return y.map((z: any) => {
          return new google.maps.LatLng(z[1], z[0]);
        });
      });
    });
  }

  serializeGeometry() {
    let geometry: any = this.mapRef.map(shape => shape.getPaths())
      .map((array: any) => {
        return array.getArray().map((x: any) => {
          const polygon = x.getArray().map((y: google.maps.LatLng) => {
            // return [Math.round(y.lng() * 1000000) / 1000000, y.lat()];
            return [y.lng(), y.lat()];
          });
          if (polygon[0][0] !== polygon[polygon.length - 1][0]) {
            polygon.push(polygon[0]);
          }
          return polygon;
        });
      });

    if (!this.isMulti) {
      geometry = geometry[0];
    }

    return geometry;
  }

  getBounds(): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    this.mapRef.map(shape => shape.getPaths())
      .forEach((array: any) => {
        array.getArray().map((x: any) => {
          x.getArray().forEach((y: google.maps.LatLng) => {
            bounds.extend(y);
          });
        });
      });
    return bounds;
  }

  setMapRef(opts: OverlayShapeOptions) {
    return new google.maps.Polygon(opts);
  }
}
export class OverlayShapeMultiPolygon extends OverlayShape {

  static getDefaultOptions(opts: OverlayShapeOptions): google.maps.PolygonOptions {
    opts = addDefaultOptions(opts);
    const o: any = {
      map: OverlayShapeStatic.map,
      clickable: opts.clickable,
      visible: opts.isVisible,
      draggable: opts.isEditable,
      editable: opts.isEditable,
      isSelectable: opts.isSelectable,
      zIndex: opts.zIndex,
      suppressUndo: true,
      fillOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.transparency,
      fillColor: opts.isActive ? COLORS.MAP_ACTIVE : opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      strokeOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.strokeTransparency,
      strokeColor: opts.isActive ? COLORS.MAP_ACTIVE_STROKE : opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.strokeColor,
      strokeWeight: opts.strokeWeight
    };
    if (opts.geometry) {
      o.paths = opts.geometry;
    }
    return o;
  }

  getOptions(opts: OverlayShapeOptions) {
    return OverlayShapePolygon.getDefaultOptions(opts);
  }

  getCenter(): google.maps.LatLng {
    return this.getBounds().getCenter();
  }

  getLabelOption(position: ELabelPosition): OverlayLabelOptions {
    const ne = getPointPixel(this.getBounds().getNorthEast(), this.mapRef[0].getMap());
    const sw = getPointPixel(this.getBounds().getSouthWest(), this.mapRef[0].getMap());
    const height = Math.abs(ne.y - sw.y);
    const width = Math.abs(ne.x - sw.x);
    const result = {
      x: 0,
      y: 0
    }
    switch (position) {
      case ELabelPosition.BOTTOM:
        result.x = 0;
        result.y = -height / 2;
        break;
      case ELabelPosition.BOTTOM_LEFT:
        result.x = width / 2;
        result.y = -height / 2;
        break;
      case ELabelPosition.BOTTOM_RIGHT:
        result.x = -width / 2;
        result.y = -height / 2;
        break;
      case ELabelPosition.LEFT:
        result.x = width / 2;
        result.y = 0;
        break;
      case ELabelPosition.RIGHT:
        result.x = -width / 2;
        result.y = 0;
        break;
      case ELabelPosition.TOP:
        result.x = 0;
        result.y = height / 2;
        break;
      case ELabelPosition.TOP_LEFT:
        result.x = width / 2;
        result.y = height / 2;
        break;
      case ELabelPosition.TOP_RIGHT:
        result.x = -width / 2;
        result.y = height / 2;
        break;

      default:
        break;
    }

    return result;
  }

  getAreaSize(): number {
    let areaSize = 0;
    this.mapRef.forEach((ref: google.maps.Polygon) => {
      areaSize += google.maps.geometry.spherical.computeSignedArea(ref.getPath().getArray());
    });
    return areaSize;
  }

  getMeasurements() {
    const lengths: OverlayLabelPoint[] = [];
    const heights: google.maps.LatLng[] = [];
    const summary: OverlayLabelPoint[] = [{ point: null, value: 0, label: '' }];
    const bounds = new google.maps.LatLngBounds();

    this.mapRef.forEach((ref: google.maps.Polygon) => {
      summary[0].value += google.maps.geometry.spherical.computeSignedArea(ref.getPath().getArray());
      // heights = <any[]> ref.getPath().getArray();

      return ref.getPath().getArray().forEach((point, index, array) => {
        // Todo remove when tiling has bounding box
        bounds.extend(point);

        /*			let nextPoint = index + 1 < array.length ? array[index + 1] : array[0];

         lengths.push({
         point: google.maps.geometry.spherical.interpolate(point, nextPoint, 0.5),
         label: google.maps.geometry.spherical.computeDistanceBetween(point, nextPoint)
         });*/
      });
    });

    summary[0].point = bounds.getCenter();

    heights.push(bounds.getCenter());

    const info = [{
      point: bounds.getCenter(),
      label: ''
    }];

    return {
      lengths,
      heights,
      summary,
      info
    };
  }

  contains(bounds: google.maps.LatLngBounds): boolean {
    return !!this.mapRef[0].getPath().getArray().find((element: google.maps.LatLng) => {
      return bounds.contains(element);
    });
  }

  containsPolygon(polygon: google.maps.Polygon): boolean {
    return !!this.mapRef[0].getPath().getArray().find((point: google.maps.LatLng) => {
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });
  }

  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    //if (shape[0] && shape[0][0] && shape[0][0][0] && shape[0][0][0].lat) {
    //    return shape;
    //}
    return shape.map((x: any) => {
      return x.map((y: any) => {
        return y.map((z: any) => {
          return new google.maps.LatLng(z[1], z[0]);
        });
      });
    });
  }

  serializeGeometry() {
    let geometry: any = this.mapRef.map(shape => shape.getPaths())
      .map((array: any) => {
        return array.getArray().map((x: any) => {
          const polygon = x.getArray().map((y: google.maps.LatLng) => {
            // return [Math.round(y.lng() * 1000000) / 1000000, y.lat()];
            return [y.lng(), y.lat()];
          });
          if (polygon[0][0] !== polygon[polygon.length - 1][0]) {
            polygon.push(polygon[0]);
          }
          return polygon;
        });
      });

    if (!this.isMulti) {
      geometry = geometry[0];
    }

    return geometry;
  }

  getBounds(): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    this.mapRef.map(shape => shape.getPaths())
      .forEach((array: any) => {
        array.getArray().map((x: any) => {
          x.getArray().forEach((y: google.maps.LatLng) => {
            bounds.extend(y);
          });
        });
      });
    return bounds;
  }

  setMapRef(opts: OverlayShapeOptions) {
    return new google.maps.Polygon(opts);
  }
}

export class OverlayShapeRectangle extends OverlayShape {

  static getGeometry(coordinates) {
    return new google.maps.LatLngBounds(
      new google.maps.LatLng(coordinates[0][0][1], coordinates[0][0][0]),
      new google.maps.LatLng(coordinates[0][2][1], coordinates[0][2][0])
    );
  }

  static getDefaultOptions(opts: OverlayShapeOptions): google.maps.RectangleOptions {
    opts = addDefaultOptions(opts);
    const o: any = {
      map: OverlayShapeStatic.map,
      clickable: opts.clickable,
      draggable: opts.isEditable,
      editable: opts.isEditable,
      isSelectable: opts.isSelectable,
      zIndex: opts.zIndex,
      suppressUndo: true,
      fillColor: opts.isActive ? COLORS.MAP_ACTIVE : opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      fillOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.transparency,
      strokeOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.strokeTransparency,
      strokeColor: opts.isActive ? COLORS.MAP_ACTIVE_STROKE : opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.strokeColor,

      // fillColor: opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      // fillOpacity: opts.transparency,
      // strokeColor: opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.strokeColor,
      strokeWeight: opts.strokeWeight
    };
    if (opts.geometry) {
      o.bounds = opts.geometry;
    }
    return o;
  }

  getOptions(opts: OverlayShapeOptions) {
    return OverlayShapeRectangle.getDefaultOptions(opts);
  }

  getCenter(): google.maps.LatLng {
    return this.mapRef[0].getBounds().getCenter();
  }

  getLabelOption(position: ELabelPosition): OverlayLabelOptions {
    const centerPointPixel = getPointPixel(this.getCenter(), this.mapRef[0].getMap());
    const ne = getPointPixel(this.getBounds().getNorthEast(), this.mapRef[0].getMap());
    const sw = getPointPixel(this.getBounds().getSouthWest(), this.mapRef[0].getMap());
    const height = Math.abs(ne.y - sw.y);
    const width = Math.abs(ne.x - sw.x);
    const result = {
      x: 0,
      y: 0
    }
    switch (position) {
      case ELabelPosition.BOTTOM:
        result.x = 0;
        result.y = -height / 2;
        break;
      case ELabelPosition.BOTTOM_LEFT:
        result.x = width / 2;
        result.y = -height / 2;
        break;
      case ELabelPosition.BOTTOM_RIGHT:
        result.x = -width / 2;
        result.y = -height / 2;
        break;
      case ELabelPosition.LEFT:
        result.x = width / 2;
        result.y = 0;
        break;
      case ELabelPosition.RIGHT:
        result.x = -width / 2;
        result.y = 0;
        break;
      case ELabelPosition.TOP:
        result.x = 0;
        result.y = width / 2;
        break;
      case ELabelPosition.TOP_LEFT:
        result.x = width / 2;
        result.y = height / 2;
        break;
      case ELabelPosition.TOP_RIGHT:
        result.x = -width / 2;
        result.y = height / 2;
        break;

      default:
        break;
    }

    return result;
  }

  getAreaSize(): number {
    let areaSize = 0;
    this.mapRef.forEach((ref: google.maps.Rectangle) => {
      const ne = ref.getBounds().getNorthEast();
      const sw = ref.getBounds().getSouthWest();

      const path: google.maps.LatLng[] = [
        ne,
        new google.maps.LatLng(ne.lat(), sw.lng()),
        sw,
        new google.maps.LatLng(sw.lat(), ne.lng())
      ];

      areaSize += google.maps.geometry.spherical.computeSignedArea(path);
      /*			heights = path;

       return path.forEach((point, index, array) => {

       let nextPoint = index + 1 < array.length ? array[index + 1] : array[0];

       lengths.push({
       point: google.maps.geometry.spherical.interpolate(point, nextPoint, 0.5),
       label: google.maps.geometry.spherical.computeDistanceBetween(point, nextPoint)
       });
       });*/
    });
    return areaSize;
  }

  getMeasurements() {
    const lengths: OverlayLabelPoint[] = [];
    const heights: google.maps.LatLng[] = [];
    const summary: OverlayLabelPoint[] = [{ point: null, label: '', value: 0 }];

    summary[0].value = this.getAreaSize();

    summary[0].point = this.mapRef[0].getBounds().getCenter();

    return {
      lengths,
      heights,
      summary,
      info: []
    };
  }

  contains(bounds: google.maps.LatLngBounds): boolean {
    return bounds.intersects(this.mapRef[0].getBounds());
  }

  containsPolygon(polygon: google.maps.Polygon): boolean {
    const ne = this.mapRef[0].getBounds().getNorthEast();
    const sw = this.mapRef[0].getBounds().getSouthWest();

    const path = [
      new google.maps.LatLng(ne.lat(), ne.lng()),
      new google.maps.LatLng(sw.lat(), ne.lng()),
      new google.maps.LatLng(sw.lat(), sw.lng()),
      new google.maps.LatLng(ne.lat(), sw.lng())
    ];

    return !!path.find((point: google.maps.LatLng) => {
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });
  }

  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    return shape;
  }

  serializeGeometry() {
    const ne = this.mapRef[0].getBounds().getNorthEast();
    const sw = this.mapRef[0].getBounds().getSouthWest();

    return [[[sw.lng(), sw.lat()], [sw.lng(), ne.lat()], [ne.lng(), ne.lat()], [ne.lng(), sw.lat()], [sw.lng(), sw.lat()]]];

  }

  getBounds(): google.maps.LatLngBounds {
    return this.mapRef[0].getBounds();
  }

  setMapRef(opts: OverlayShapeOptions) {
    return new google.maps.Rectangle(opts);
  }
}

export class OverlayShapeCircle extends OverlayShape {

  static getGeometry(coordinates) {
    const center = new google.maps.LatLng(coordinates[0][15][1], coordinates[0][0][0]);
    const point = new google.maps.LatLng(coordinates[0][0][1], coordinates[0][0][0]);
    return {
      radius: google.maps.geometry.spherical.computeDistanceBetween(center, point),
      center: center
    };
  }

  static getDefaultOptions(opts: OverlayShapeOptions): google.maps.CircleOptions {
    opts = addDefaultOptions(opts);
    const o: any = {
      map: OverlayShapeStatic.map,
      clickable: opts.clickable,
      draggable: opts.isEditable,
      editable: opts.isEditable,
      isSelectable: opts.isSelectable,
      zIndex: opts.zIndex,
      suppressUndo: true,
      fillColor: opts.isActive ? COLORS.MAP_ACTIVE : opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      fillOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.transparency,
      strokeOpacity: opts.isActive ? COLORS.MAP_ACTIVE_TRANSPARENCY : opts.isSelected ?
        COLORS.MAP_SELECTED_TRANSPARENCY : opts.strokeTransparency,
      strokeColor: opts.isActive ? COLORS.MAP_ACTIVE_STROKE : opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.strokeColor,

      // fillColor: opts.isSelected ? COLORS.MAP_SELECTED : opts.fillColor,
      // fillOpacity: opts.transparency,
      // strokeColor: opts.isSelected ? COLORS.MAP_SELECTED_STROKE : opts.strokeColor,
      strokeWeight: opts.strokeWeight
    };

    if (opts.geometry) {
      o.center = opts.geometry.center;
      o.radius = opts.geometry.radius;
    }
    return o;
  }

  getOptions(opts: OverlayShapeOptions) {
    return OverlayShapeCircle.getDefaultOptions(opts);
  }

  getCenter(): google.maps.LatLng {
    return this.mapRef[0].getCenter();
  }

  getLabelOption(position: ELabelPosition): OverlayLabelOptions {
    const centerPointPixel = getPointPixel(this.getCenter(), this.mapRef[0].getMap());
    const ne = getPointPixel(this.getBounds().getNorthEast(), this.mapRef[0].getMap());
    const r = Math.abs(centerPointPixel.x - ne.x);

    const result = {
      x: 0,
      y: 0
    }
    switch (position) {
      case ELabelPosition.BOTTOM:
        result.x = 0;
        result.y = -r;
        break;
      case ELabelPosition.BOTTOM_LEFT:
        result.x = r;
        result.y = -r;
        break;
      case ELabelPosition.BOTTOM_RIGHT:
        result.x = -r;
        result.y = -r;
        break;
      case ELabelPosition.LEFT:
        result.x = r;
        result.y = 0;
        break;
      case ELabelPosition.RIGHT:
        result.x = -r;
        result.y = 0;
        break;
      case ELabelPosition.TOP:
        result.x = 0;
        result.y = r;
        break;
      case ELabelPosition.TOP_LEFT:
        result.x = r;
        result.y = r;
        break;
      case ELabelPosition.TOP_RIGHT:
        result.x = -r;
        result.y = r;
        break;

      default:
        break;
    }

    return result;
  }

  getAreaSize(): number {
    return Math.PI * Math.pow(this.mapRef[0].getRadius(), 2);
  }

  getMeasurements() {
    const lengths: OverlayLabelPoint[] = [];
    const heights: google.maps.LatLng[] = [];
    const summary: OverlayLabelPoint[] = [{ point: null, value: 0, label: '' }];

    this.mapRef.forEach((ref: google.maps.Circle) => {

      const center = ref.getCenter();
      const ne = ref.getBounds().getNorthEast();
      const sw = ref.getBounds().getSouthWest();

      const path: google.maps.LatLng[] = [
        ne,
        new google.maps.LatLng(ne.lat(), sw.lng()),
        sw,
        new google.maps.LatLng(sw.lat(), ne.lng())
      ];

      summary[0].value += Math.PI * Math.pow(ref.getRadius(), 2);

      lengths.push({
        point: google.maps.geometry.spherical.interpolate(path[3], path[0], 0.5),
        value: ref.getRadius(),
        label: '',
        isEditable: true
      });
    });

    summary[0].point = this.mapRef[0].getBounds().getCenter();

    return {
      lengths,
      heights,
      summary,
      info: []
    };
  }

  contains(bounds: google.maps.LatLngBounds): boolean {
    return bounds.intersects(this.mapRef[0].getBounds());
  }

  containsPolygon(polygon: google.maps.Polygon): boolean {
    const path = new Array(8).fill(null).map(
      (_, index) => google.maps.geometry.spherical.computeOffset(
        this.mapRef[0].getCenter(),
        this.mapRef[0].getRadius(),
        360 / 8 * index));

    return !!path.find((point: google.maps.LatLng) => {
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });
  }

  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    return shape;
    /*		return shape.map((x:any) => {
     return {
     center : new google.maps.LatLng(x.lat, x.lng),
     radius: x.radius
     };

     });*/
  }

  serializeGeometry() {

    const numSides = 60;
    const points: number[][] = [];
    const degreeStep = 360 / numSides;

    for (let i = 0; i < numSides; i++) {
      const gpos = google.maps.geometry.spherical
        .computeOffset(this.mapRef[0].getCenter(), this.mapRef[0].getRadius(), degreeStep * i);
      points.push([gpos.lng(), gpos.lat()]);
    }

    // Duplicate the last point to close the geojson ring
    points.push(points[0]);

    return [points];
  }

  getBounds(): google.maps.LatLngBounds {
    return this.mapRef[0].getBounds();
  }

  setMapRef(opts: OverlayShapeOptions) {
    return new google.maps.Circle(opts);
  }

  setRadius(radius: number) {
    this.mapRef[0].setRadius(radius);
    if (this.measurement) {
      this.measurement.getUpdate(this.getMeasurements(), this.overlayShapeType, this.layer, this.id, this.data, this.opts, this.overlayId);
    }
  }

}
