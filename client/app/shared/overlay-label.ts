import { HttpParams } from '@angular/common/http';
import { Subject, ReplaySubject } from 'rxjs';

import { ZINDEX, formatMetric, formatText, toHex, toRGBA } from './global';

import { OverlayShapeType, OverlayLabelType, OverlayShapeClass } from './enums';
import { OverlayLabelPoint, OverlayLabelOptions, OverlayShapeMeasurements, OverlayShapeOptions, ILayer } from './interfaces';
import { OverlayShapeStatic } from './models/overlay-shape-static';
import { debounceTime } from 'rxjs/operators';
import { ILabelStyle, EFontStyle, ELabelPosition } from './models/label.model';

export class OverlayLabelBase extends google.maps.OverlayView {

    isEditable = false;
    div: HTMLElement;
    options: OverlayLabelOptions;
    positionCallback: Function;
    destroyCallback: Function;
    private changeSource = new Subject<any>();
    private change = this.changeSource.asObservable().pipe(debounceTime(100));
    constructor(private point: google.maps.LatLng, text: string, opts: OverlayLabelOptions = {}, public style?: ILabelStyle) {
        super();

        this.options = Object.assign({
            x: 0,
            y: 0,
            zIndex: '0'
        }, opts);

        this.div = document.createElement('div');
        this.div.classList.add('gm-svpc-label');
        // this.div.classList.add(this.options.type === OverlayLabelType.CENTER ? 'gm-svpc-label--center' : 'gm-svpc-label--default');
        this.div.style.zIndex = this.options.zIndex;
        if (style) {
            const { color, backgroundColor, textSize, fontStyle, position, backgroundTransparent } = style;
            if (color) {
                this.div.style.color = color;
            }
            if (backgroundColor) {
                this.div.style.backgroundColor = backgroundColor;
                if (backgroundTransparent != null) {
                    var rgbaCol = 'rgba('
                        + parseInt(backgroundColor.slice(-6, -4), 16)
                        + ',' + parseInt(backgroundColor.slice(-4, -2), 16)
                        + ',' + parseInt(backgroundColor.slice(-2), 16)
                        + ',' + backgroundTransparent + ')';
                    this.div.style.backgroundColor = toRGBA(rgbaCol);
                }
            }

            if (textSize) {
                this.div.style.fontSize = textSize + 'px';
            }
            if (fontStyle && fontStyle.length) {
                if (fontStyle.includes(EFontStyle.BOLD)) {
                    this.div.style.fontWeight = 'bold';
                }
                if (fontStyle.includes(EFontStyle.ITALIC)) {
                    this.div.style.fontStyle = 'italic';
                }
                if (fontStyle.includes(EFontStyle.UNDERLINE)) {
                    this.div.style.textDecoration = 'underline';
                }
            }
            if (position) {

            }
        }
        this.setContent(text);
        this.change.subscribe(() => {
            if (this.positionCallback) {
                this.positionCallback();
            }
        })
    }

    onAdd() {
        this.getPanes().markerLayer.appendChild(this.div);
    }

    onRemove() {
        this.positionCallback = undefined;
        if (this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            if (this.destroyCallback) {
                this.destroyCallback();
                this.destroyCallback = undefined;
            }
        }
    }

    setDestroyCallback(func: Function) {
        this.destroyCallback = func;
    }

    setPositionCallback(func: Function) {
        this.positionCallback = func
    }

    draw() {
        this.setPosition(this.point);
    }

    setPosition(point: google.maps.LatLng, isAbsolutePoint?: boolean) {
        this.point = point;
        const projection = this.getProjection();
        if (point && projection) {
            const position = projection.fromLatLngToDivPixel(point);
            const { offsetWidth, offsetHeight } = this.div;
            let deltaWidth = 0;
            let deltaHeight = 0;
            if (this.style && this.options.type != OverlayShapeType.LineString) {
                switch (this.style.position) {
                    case ELabelPosition.TOP:
                        deltaWidth = offsetWidth / 2;
                        deltaHeight = offsetHeight;
                        break;
                    case ELabelPosition.TOP_LEFT:
                        deltaWidth = offsetWidth;
                        deltaHeight = offsetHeight ;
                        break
                    case ELabelPosition.TOP_RIGHT:
                        deltaWidth = 0;
                        deltaHeight = offsetHeight;
                        break
                    case ELabelPosition.BOTTOM:
                        deltaWidth = offsetWidth / 2;
                        deltaHeight = 0;
                        break
                    case ELabelPosition.BOTTOM_LEFT:
                        deltaWidth = offsetWidth;
                        deltaHeight = 0;
                        break
                    case ELabelPosition.BOTTOM_RIGHT:
                        deltaWidth = 0;
                        deltaHeight = 0;
                        break
                    case ELabelPosition.LEFT:
                        deltaWidth = offsetWidth;
                        deltaHeight = offsetHeight / 2;
                        break
                    case ELabelPosition.RIGHT:
                        deltaWidth = 0;
                        deltaHeight = offsetHeight / 2;
                        break
                    case ELabelPosition.CENTER:
                        deltaWidth = offsetWidth / 2;
                        deltaHeight = offsetHeight / 2;
                        break;
                }

            }
            if (!isAbsolutePoint) {
                this.div.style.left = `${position.x - this.options.x - deltaWidth}px`;
                this.div.style.top = `${position.y - this.options.y - deltaHeight}px`;
            } else {
                this.div.style.left = `${position.x - deltaWidth}px`;
                this.div.style.top = `${position.y - deltaHeight}px`;
            }
        }
        this.changeSource.next();
    }

    updateText() {
        this.div.innerHTML = this.get('text');
    }

    setContent(label: string) {
        this.div.innerHTML = label;
    }

    updateLabel() {
        this.changeSource.next();
    }

    onHide() {
        if (this.div) {
            this.div.style.opacity = '0';
        }
    }
    onShow() {
        if (this.div) {
            this.div.style.opacity = '1';
        }
    }
}

export class OverlayLabel {
    label: OverlayLabelBase;
    isDragging = false;
    zIndex: number;
    constructor(center: google.maps.LatLng, labelZindex: number, private labelText: string, type: OverlayShapeType, opts: OverlayLabelOptions, style: ILabelStyle = null) {
        this.zIndex = labelZindex;
        const options = Object.assign({
            x: 0,
            y: 0,
            type: type,
            zIndex: `${labelZindex}`,
        }, opts);
        this.label = new OverlayLabelBase(center, labelText, options, style);
        this.label.setMap(OverlayShapeStatic.map);
    }

    destroy() {
        if (this.label) {
            this.label.setMap(null);
            this.label = null;
        }
    }
}

export class OverlayMeasurement {

    changeSource = new Subject<any>();
    change = this.changeSource.asObservable();

    measurements: OverlayLabelPoint[][];
    private labels: Array<Array<any>> = [[], [], [], []];

    private colors = [
        'rgba(222, 222, 0, 1)',
        'rgba(0,222, 222, 1)',
        'rgba(222, 222, 222, 1)',
        'rgba(222, 222, 222, 1)'
    ];

    private isVisible = false;
    public isDragging = false;
    private elevationService = new google.maps.ElevationService();

    constructor() {


    }

    destroy() {
        this.setMap(null);
        this.labels = this.labels.map(labelList => []);
    }

    setMap(map: google.maps.Map) {
        this.labels.forEach(labelList => {
            labelList.forEach((label: OverlayLabelBase) => label.setMap(map));
        });

        this.isVisible = map !== null;
        if (this.labels[3][0] instanceof google.maps.InfoWindow) {
            if (map === null) {
                (<any>this.labels[3][0]).close();
            }
        }
    }

    update(layer: ILayer, shapeType: OverlayShapeType, callback) {
        const hasInfo = layer && layer.hasInfo;
        if (shapeType !== OverlayShapeType.Point && !hasInfo) {
            this.measurements.forEach((labelList, labelListIndex) => {
                labelList.forEach((label, labelIndex) => {

                    if (!this.labels[labelListIndex][labelIndex]) {
                        this.labels[labelListIndex].push(new OverlayLabelBase(label.point, <string>label.label, {
                            y: 20 + (labelListIndex === 3 ? 20 * (1 + labelIndex) : 0)
                        }));
                    } else {
                        this.labels[labelListIndex][labelIndex].setPosition(label.point);
                        this.labels[labelListIndex][labelIndex].setContent(label.label);
                    }

                });
            });
        } else {
            if (!this.labels[3][0]) {
                this.labels[3][0] = new google.maps.InfoWindow({
                    content: this.measurements[3][0].label,
                    disableAutoPan: false,
                    maxWidth: 320,
                    position: this.measurements[3][0].point,
                    zIndex: ZINDEX.INFOWINDOW
                });
                this.labels[3][0].addListener('closeclick', () => {
                    this.destroy();
                    callback();
                });

            } else {
                this.labels[3][0].setPosition(<any>this.measurements[3][0].point);
                (<any>this.labels[3][0]).setContent(this.measurements[3][0].label);
            }

        }
    }

    getUpdate(shapeMeasurements: OverlayShapeMeasurements,
        shapeOverlayType: number,
        iLayer: ILayer,
        shapeId: string,
        shapeData: any,
        shapeOpts: OverlayShapeOptions,
        shapeOverlayId: string) { //OverlayShape
        const source = new ReplaySubject<any>(1);
        const measurements = shapeMeasurements;
        let heights: OverlayLabelPoint[] = [];
        if (!measurements.info) {
            measurements.info = [];
        }

        measurements.lengths = measurements.lengths.map((length: OverlayLabelPoint) => {
            length.label = formatMetric(length.value, 1, OverlayShapeStatic.isMetric);
            return length;
        });

        measurements.summary = measurements.summary.map((summary: OverlayLabelPoint) => {
            summary.label = formatMetric(summary.value, 2, OverlayShapeStatic.isMetric);
            return summary;
        });

        if (measurements.heights.length) {
            this.elevationService.getElevationForLocations({ locations: measurements.heights }, (response, status) => {

                if (shapeOverlayType == OverlayShapeClass.POINT) {
                    heights = response.map(point => {
                        return {
                            point: point.location,
                            value: point.elevation,
                            label: formatMetric(point.elevation, 1, OverlayShapeStatic.isMetric)
                        };
                    });
                }

                if (measurements.info[0] && iLayer) {

                    if (!shapeOpts.hasInfo && shapeOverlayType == OverlayShapeClass.POINT) {
                        const layer = iLayer;
                        let labelText = '';
                        let addressText = '';

                        if (layer) {
                            const label = layer.columns.find(column => column.isLabel);

                            if (label) {
                                labelText = `<div class="gmc-row"><b>Name:</b> ${shapeData[label.id]}</div>`;
                            }

                            const address = layer.columns.find(column => column.isAddress);
                            if (address) {
                                addressText = `<div class="gmc-row"><b>Address:</b> ${shapeData[address.id]}</div>`;
                            }
                        }

                        // const pos = (<google.maps.Marker>this.shape.mapRef[0]).getPosition();
                        const pos = measurements.info[0].point;

                        OverlayShapeStatic.overlayService.layerDataService
                            .getStreetView(shapeOverlayId, shapeId, [pos.lng(), pos.lat()])
                            .subscribe(_ => {
                                let params = new HttpParams();
                                params = params.set('location', `${_.results.geom.coordinates[1]},${_.results.geom.coordinates[0]}`);
                                params = params.set('fov', `${_.results.fov}`);
                                params = params.set('heading', `${_.results.heading}`);
                                params = params.set('pitch', `${_.results.pitch}`);

                                OverlayShapeStatic.overlayService.httpService.get(`DataPackageIndex/GetSignedGoogleUrl`, params)
                                    .subscribe((data: any) => {
                                        let image = '';
                                        if (data.returnUrl) {
                                            image = `<img src="${data.returnUrl}" width="283"/>`;
                                        }
                                        measurements.info[0].label = image + labelText + addressText
                                            + `<div class="gmc-row"><b>Elevation:</b> ${heights[0].label}</div>`
                                            + `<div class="gmc-row">${measurements.info[1].label}</div>`
                                            + `<div class="gmc-row">${measurements.info[0].label}</div>`;

                                        source.next(true);
                                        source.complete();
                                    });
                            });
                    } else {
                        const layer = iLayer;
                        let text = '';
                        layer.columns.forEach(column => {
                            if (column.isInfo) {
                                let value = '';
                                if (column.isIdentifier) {
                                    value = shapeData[column.id];
                                    if (value === null || value === undefined) {
                                        value = '';
                                    }
                                } else {
                                    value = formatText(shapeData[column.id], column);
                                }
                                text += `<div class="gmc-row"><b style="font-weight: 800">${column.name}:</b> ${value}</div>`;
                            }
                        });

                        measurements.info[0].label = text;
                        source.next(true);
                        source.complete();
                    }
                } else {
                    source.next(true);
                    source.complete();
                }
            });
        } else {
            source.next(true);
            source.complete();
        }

        source.subscribe(data => {
            this.measurements = [
                measurements.lengths,
                heights,
                measurements.summary,
                measurements.info
            ];
            this.changeSource.next(null);
        });
    }
}
