import { OverlayShape, OverlayShapeCircle } from '../../overlay-shape';
import { ILayer, OverlayShapeOptions } from '../../interfaces';
import { LayerStyleService } from '../../layer-style.service';
import { SelectionService } from '../../selection.service';
import { OverlayShapeType } from '../../enums';
import { TileOverlayAbstract } from './tile-overlay-abstract';
import { LayerStyle } from '../../layer-style';

export class TileOverlay extends TileOverlayAbstract<OverlayShape> {
  private setStyleTimeouts: any[] = [];
  private setLabelStyleTimeouts: any[] = [];
  constructor(id: string,
    layer: ILayer,
    private layerStyleService: LayerStyleService,
    private selectionService: SelectionService,
    public style: LayerStyle) {
    super(id, layer);
    OverlayShape.index++;
    this.layerIndex = OverlayShape.index;
  }

  setStyle(style) {
    this.style = style;
    this.allShapes(shape => {
      style.getShapeOptions(shape.data, this.id).subscribe((opts: OverlayShapeOptions) => {
        shape.update(opts);
      });
    });
  }

  setStyle_async(style, loadingCallback: Function) {
    this.cancelSetStyleTimeout();
    this.style = style;
    return this._setStyle_async(Array.from(this.shapes), style, loadingCallback)
  }

  updateLabelStyle_async(labelStyle, loadingCallback: Function) {
    this.cancelSetLabelStyleTimeout();
    return this._updateLabelStyle_async(Array.from(this.shapes), labelStyle, loadingCallback)
  }

  _setStyle_async(arrayShapes: any[], style, loadingCallback: Function) {
    const pageSize = 100;
    const loopCount = Math.ceil(arrayShapes.length / pageSize);
    for (let index = 0; index < loopCount; index++) {
      const currentIndex = index * pageSize;
      const _arrayDelete = arrayShapes.slice(currentIndex, currentIndex + pageSize);
      const timeout = setTimeout(() => {
        for (let index = 0; index < _arrayDelete.length; index++) {
          const element = _arrayDelete[index];// [key,value]
          const key = element[0];
          if (this.shapes.has(key)) {
            const shape = this.shapes.get(key);
            style.getShapeOptions(shape.data, this.id).subscribe((opts: OverlayShapeOptions) => {
              delete opts.labelStyle;
              shape.update(opts);
              if (index + 1 == _arrayDelete.length) {
                loadingCallback();
              }
            });
          } else {
            if (index + 1 == _arrayDelete.length) {
              loadingCallback();
            }
          }
        }
        let index = this.setStyleTimeouts.findIndex(e => e == timeout);
        this.setStyleTimeouts.splice(index, 1);
      }, 0);
      this.setStyleTimeouts.push(timeout);
    }
    return loopCount;
  }

  _updateLabelStyle_async(arrayShapes: any[], labelStyle, loadingCallback: Function) {
    const pageSize = 100;
    const loopCount = Math.ceil(arrayShapes.length / pageSize);
    for (let index = 0; index < loopCount; index++) {
      const currentIndex = index * pageSize;
      const _arrayDelete = arrayShapes.slice(currentIndex, currentIndex + pageSize);
      const timeout = setTimeout(() => {
        for (let index = 0; index < _arrayDelete.length; index++) {
          const element = _arrayDelete[index];// [key,value]
          const key = element[0];
          if (this.shapes.has(key)) {
            const shape = this.shapes.get(key);
            shape.setLabelStyle(labelStyle);
            if (index + 1 == _arrayDelete.length) {
              loadingCallback();
            }
          } else {
            if (index + 1 == _arrayDelete.length) {
              loadingCallback();
            }
          }
        }
        let index = this.setStyleTimeouts.findIndex(e => e == timeout);
        this.setStyleTimeouts.splice(index, 1);
      }, 0);
      this.setStyleTimeouts.push(timeout);
    }
    return loopCount;
  }

  addShapeByCoordinates(id: string, type: OverlayShapeType, geometry: any, opts: OverlayShapeOptions, data = {}, callback?) {
    id = this.generateShapeId(id);

    opts.geometry = geometry;
    var oldShape = this.getShape(id);
    // if(oldShape && (<OverlayShape>oldShape).data._tileId != data['_tileId']){
    //   oldShape = OverlayShape.factory(id, type, opts, data, this.layer, this.overlayType, this.id, true, this.layerIndex);
    // }
    // check editing
    const shape = (oldShape) ? oldShape : OverlayShape.factory(id, type, opts, data, this.layer, this.overlayType, this.id, true, this.layerIndex);
    this.addShape(id, shape);
    if (callback) {
      callback();
    }
  }

  addShapeFromData(data, tile, labelStyle, callback?) {
    const shapeId = data.shapeId;
    const style = this.layerStyleService.getActiveStyle(this.id)
    if (style) {
      style.getShapeOptions(data, this.id).subscribe(
        (opts: OverlayShapeOptions) => {
          try {
            opts.isSelected = this.selectionService.isSelected(this.id, shapeId);
            opts.isActive = this.selectionService.isActive(this.id, shapeId);
            opts.labelStyle = labelStyle;
            opts.isSelectable = true;
            opts.hasInfo = this.layer.hasInfo;
            if (data.geometry.isCircle) {
              this.addShapeByCoordinates(
                shapeId,
                OverlayShapeType.Circle,
                OverlayShapeCircle.getGeometry(data.geometry.coordinates),
                opts,
                { ...data },
                callback);
            } else {
              this.addShapeByCoordinates(
                shapeId,
                <any>OverlayShapeType[<any>data.geometry.type],
                data.geometry.coordinates,
                opts,
                { ...data },
                callback);
            }
          } catch (error) {
            if (callback) {
              callback();
            }
            throw error;
          }
        }, err => {
          if (callback) {
            callback();
          }
        });
    } else {
      console.error("Not found style");
      if (callback) {
        callback();
      }
    }
  }

  cancelSetStyleTimeout() {
    this.setStyleTimeouts.forEach(e => {
      clearTimeout(e);
    })
    this.setStyleTimeouts = [];
  }

  cancelSetLabelStyleTimeout() {
    this.setLabelStyleTimeouts.forEach(e => {
      clearTimeout(e);
    })
    this.setLabelStyleTimeouts = [];
  }

  clear() {
    super.clear();
    this.cancelSetStyleTimeout();
    this.cancelSetLabelStyleTimeout();
  }
}
