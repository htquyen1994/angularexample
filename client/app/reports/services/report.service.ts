import { HttpService } from './../../shared/http.service';
import { Injectable } from '@angular/core';
import { Observable, Observer, of, forkJoin, Subject } from 'rxjs';
import { IReport, IReportRespone, IReportRequest, ReportType } from '../models/report';
import { OverlayShape, UNITS, formatMetric, OverlayShapePoint, IsogramService, DrawingOverlay, OverlayShapePolygon, createSimpleError } from '../../shared';
import { PolygonRequest, IsogramRequest, IInsightLayer, ILayer, ISelection, OverlayShapeGeometry } from '../../shared/interfaces';
import { OverlayShapeType, IInsightCatchmentType, TravelType } from '../../shared/enums';
import { map } from 'rxjs/operators';
import { ISchema, Field, DataTypeFlags } from '../../shared/Data/Packaging';
import { TYPE, Expression } from '../../shared/QueryModel';
import { JstsOperatorService } from '../../shared/services/jsts-operator.service';


@Injectable()
export class ReportService {

    activeTool

    private polygonColors = ['#d7191c', '#e85b3a', '#f99e59', '#fec980', '#ffedaa'];
    reportShapeSource = new Subject<ISelection>();
    reportShape = this.reportShapeSource.asObservable();
    constructor(private httpService: HttpService, private jstsOperatorService: JstsOperatorService) {
    }

    setShapeReport(selection: ISelection) {
        this.reportShapeSource.next(selection);
    }

    getReportName(): Observable<IReport[]> {
        return this.httpService.get(`Report/GetReportPickList`).pipe(map((datas: IReport[]) => {
            return datas.map(e => {
                return {
                    ...e,
                    reportType: this.getTypeReport(e.id)
                } as IReport
            })
        }));
    }

    getTypeReport(id: string) {
        switch (id) {
          case 'LTARegisteredVenueReport':
                return ReportType.SELECTCLUB
            case 'LTANewVenueReport':
                return ReportType.SELECTPOINT
            case 'LTAGeographicalReport':
                return ReportType.SELECTPOLYGONUNION
            case 'ATFAreaofInterestv3':
            case 'ATFAreaofInterestRoI':
                return ReportType.SELECTPOLYGON
            default:
                return ReportType.DEFAULT
        }
    }

    getReport(reportRequest: IReportRequest): Observable<IReportRespone> {
        return this.httpService.postJSON(`Report/DownloadReport`, reportRequest);
    }

    collectShape(shapesObservables, overlay, reportType: ReportType): Observable<PolygonRequest[]> {
        return Observable.create((observer: Observer<PolygonRequest[]>) => {
            if (shapesObservables.length == 0) {
                observer.error({ msg: "Please select shape" });
                observer.complete();
            }
            forkJoin(shapesObservables)
                .pipe(map(x => x.reduce((a: any, b: any) => a.concat(b), [])))
                .subscribe((shapesSelected: OverlayShape[]) => {
                    let shapeObservables: PolygonRequest[] = [];
                    if (reportType == ReportType.SELECTPOLYGONUNION) {
                        if (shapesSelected.find(e => e instanceof OverlayShapePoint)) {
                            return observer.error({ msg: "Please select a circle, rectangle or polygon for this report." });
                        }
                        this.getShapesObservablesUnion(shapesSelected, shapeObservables, overlay);
                    } else {
                        if (reportType == ReportType.SELECTPOINT && shapesSelected.find(e => !(e instanceof OverlayShapePoint))) {
                          return observer.error({ msg: "Please select a point for this report." });
                        }
                        if(reportType == ReportType.SELECTPOLYGON && shapesSelected.find(e => (e instanceof OverlayShapePoint))){
                            return observer.error({ msg: "Please select a circle, rectangle or polygon for this report." });
                        }
                        this.getShapeObservables(shapesSelected, shapeObservables, overlay);
                    }
                    if (shapeObservables.length > 1) {
                        return observer.error({ msg: "Please select only 1 shape for this report." });
                    }
                    if (reportType == ReportType.SELECTPOINT && shapeObservables.length == 0) {
                      return observer.error({ msg: "Please select a point for this report." });
                    }
                    if (reportType == ReportType.SELECTPOLYGONUNION && shapeObservables.length == 0) {
                      return observer.error({ msg: "Please select a circle, rectangle or polygon for this report." });
                    }
                    observer.next(shapeObservables);
                    return observer.complete();
                });
        })
    }

    decoratePolygons(shapeObservables: PolygonRequest[]): Observable<{ polygons: any[], shapes: OverlayShapePolygon[] }> {
        return Observable.create((observer: Observer<any>) => {
            forkJoin(shapeObservables.map(x => x.shape)).subscribe(
                (data: OverlayShapePolygon[]) => {
                    let polygons = Object.assign([], data).map((shape, index) => {
                        if (shape instanceof OverlayShapePoint) {
                            return {
                                type: OverlayShapeType[OverlayShapeType.Point],
                                label: shapeObservables[index].label,
                                coordinates: shape.serializeGeometry(),
                                id: shapeObservables[index].id,
                                // layerId: shape.data['layerId'],
                                // shapeId: shape.data['shapeId']
                            };
                        } else {
                            return this.updatePolygon(shape, shapeObservables[index].label, shapeObservables[index].type, shapeObservables[index].id)
                        }
                    }).filter(e => e);
                    observer.next({
                        polygons: polygons,
                        shapes: data
                    }),
                        observer.complete();
                }, err => {
                    observer.error(err);
                })
        })
    }

    getPolygonsForShape(shape: OverlayShape, overlay: DrawingOverlay): PolygonRequest[] {
        let polygons: PolygonRequest[] = [];
        if (shape instanceof OverlayShapePoint) {
            polygons = [{
                label: '',
                shape: of(shape)
            }]
        } else {
            polygons = [
                {
                    label: '', // area === null ? '' : formatMetric(area, 2, OverlayShape.isMetric),
                    shape: of(
                        this.createPolygon(
                            {
                                type: shape.isMulti ? OverlayShapeType.MultiPolygon : OverlayShapeType.Polygon,
                                coordinates: shape.serializeGeometry()
                            },
                            0,
                            null,
                            overlay
                        )
                    )
                }
            ];
        }
        return polygons;
    }

    private createPolygon(shape, index, fillColor = '#BBBBBB', overlay: DrawingOverlay): OverlayShape {
        //console.log(fillColor);
        return overlay.addShapeByCoordinates(null, shape.type, shape.coordinates, {
            isActive: false,
            isSelected: false,
            isSelectable: true,
            isEditable: false,
            zIndex: 100 - index,
            fillColor,
            transparency: 0.5,
            isVisible: true
        });
    }


    private updatePolygon(shape: OverlayShapePolygon, label: string, type: string, id: string) {
        shape.data['__LABEL'] = label + (type === '' ? '' : ` (${type})`);

        shape.update({
            isLabel: true,
            labelStyle: {
                id: '__LABEL',
                columnName: '__LABEL',
                name: '__LABEL'
            },
        });

        return {
            type:
                shape.type === OverlayShapeType.MultiPolygon
                    ? OverlayShapeType[OverlayShapeType.MultiPolygon]
                    : OverlayShapeType[OverlayShapeType.Polygon],
            label: shape.data['__LABEL'],
            coordinates: shape.serializeGeometry(),
            id: id
        };
    }

    private getTypeForField(schema: ISchema, columnName: string) {
        const field = schema._fieldsByIndex[schema._indicesByKey[columnName]];
        if (!field) {
            return null;
        }
        if (Field.hasFlag(field, DataTypeFlags.Boolean)) {
            return TYPE.boolean;
        }
        if (Field.hasFlag(field, DataTypeFlags.String)) {
            return TYPE.string;
        }
        if (Field.hasFlag(field, DataTypeFlags.Number)) {
            return TYPE.number;
        }
        if (Field.hasFlag(field, DataTypeFlags.DateTime)) {
            return TYPE.datetime;
        }
        if (Field.hasFlag(field, DataTypeFlags.Geometry)) {
            return TYPE.shape;
        }

        throw new Error('notimplemented');
    }

    private getShapesObservablesUnion(shapes: OverlayShape[], shapeObservables: PolygonRequest[], overlay) {
        let _shapes: { shape: OverlayShapeGeometry, length: number, code: string }[];
        _shapes = shapes.slice(0).map(e => {
            return [{
                shape: e.serializeWithType(),
                length: 1,
                code: e.getGCode()
            }]
        }).reduce((acc, curr, i, arr) => {
            let _curr = Object.assign({}, curr[0]);
            let _acc = [...acc];
            let _reduceShapes = [];
            if (_acc) {
                for (let index = 0; index < _acc.length; index++) {
                    const element = _acc[index];
                    let _s = this.jstsOperatorService.union(element.shape, _curr.shape);
                    if (_s) {
                        _reduceShapes.push({
                            shape: _s,
                            length: element.length + 1,
                            code: element.code
                        });
                        _curr = {
                            shape: _s,
                            length: element.length + 1,
                            code: element.code
                        };
                    } else {
                        _reduceShapes.push(element);
                    }
                }
            } else {
                arr.splice(1);
            }
            return [..._reduceShapes];
        })
        if (!(_shapes && _shapes.length > 0)) {
            throw createSimpleError(`Could not detect union shape`);
        }
        _shapes.forEach((shape, index) => {
            let polygon: PolygonRequest = {
                label: '', // area === null ? '' : formatMetric(area, 2, OverlayShape.isMetric),
                shape: of(
                    this.createPolygon(
                        {
                            type: <any>OverlayShapeType[<any>shape.shape.type],
                            coordinates: shape.shape.coordinates
                        },
                        0,
                        null,
                        overlay
                    )
                )
            } as PolygonRequest;
            shapeObservables.push({
                label: String.fromCharCode(97 + index).toUpperCase() + 1,
                type: polygon.label,
                shape: polygon.shape,
                id: shape.code
            });
        })
    }

    private getShapeObservables(shapes: OverlayShape[], shapeObservables: PolygonRequest[], overlay) {
        shapes.forEach((shape, shapeIndex) => {
            this.getPolygonsForShape(shape, overlay).forEach((polygon, polygonIndex) => {
                shapeObservables.push({
                    label: String.fromCharCode(97 + shapeIndex).toUpperCase() + (polygonIndex + 1),
                    type: polygon.label,
                    shape: polygon.shape,
                    id: shape.getGCode()
                });
            });
        });
    }
}
