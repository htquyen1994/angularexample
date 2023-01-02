import {
    Component,
    AfterViewInit,
    Input,
    HostBinding,
    Renderer2,
    ChangeDetectorRef,
    ViewChild,
    ElementRef
} from '@angular/core';

import { LayerDataService } from '@client/app/shared/layer-data.service';
import Highcharts from 'highcharts/es-modules/masters/highcharts.src';

@Component({
    selector: 'go-slider-info',
    moduleId: module.id,
    templateUrl: 'slider-info.component.html',
    styleUrls: ['slider-info.component.less']
})
export class SliderInfoComponent implements AfterViewInit {
    @ViewChild('chart') chart: ElementRef;
    @HostBinding('class.loading') isLoading = true;
    @HostBinding('class.disabled')
    @Input() disabled: boolean;

    @Input() float = false;
    @Input() percent = false;
    @Input() layerId: string;
    @Input() columnId: string;
    @Input("columnValueDistribution") _columnValueDistribution: {
        min: number,
        max: number,
        steps: number[],
        step: number,
        sd: number
    };

    min = 0;
    max = 0;
    steps: number[] = [];
    path: string;
    step: number;
    constructor(
        public renderer: Renderer2,
        private changeDetectorRef: ChangeDetectorRef,
        public layerDataService: LayerDataService) {
    }

    ngAfterViewInit() {
        if (!this._columnValueDistribution) {
            this.layerDataService.getColumnValueDistribution(this.layerId, this.columnId, 100)
                .subscribe(
                    response => {
                        this.disabled = false;
                        this.min = response.min;
                        this.max = response.max;
                        this.steps = response.steps;
                        this.step = response.step;
                        var variance = response.sd; // 1 standard deviation each side
                        this.isLoading = false;
                        this.changeDetectorRef.markForCheck();
                        this.changeDetectorRef.detectChanges();
                        this.setPath();
                    },
                    error => {
                        this.isLoading = false;
                        this.changeDetectorRef.markForCheck();
                        this.changeDetectorRef.detectChanges();
                    });
        } else {
            this.min = this._columnValueDistribution.min;
            this.max = this._columnValueDistribution.max;
            this.steps = this._columnValueDistribution.steps;
            this.step = this._columnValueDistribution.step;
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            this.changeDetectorRef.detectChanges();
            this.setPath();
        }
    }
    setPath() {
        Highcharts.chart(this.chart.nativeElement, {
            colors: ['#1b4b9533'],
            chart: {
                type: 'area',
                margin: 0,
            },
            xAxis: {
                visible: false
            },
            yAxis: {
                visible: false
            },
            title: {
                text: ''
            },
            tooltip: {
                formatter: function (value) {
                    let x = Math.round(this.x * 100) / 100;
                    let nextstep = Math.round(this.point.nextStep * 100) / 100;
                    let range = this.point.index == this.point.divideNumber - 1 ? `(${x}, ${nextstep}]` : `[${x}, ${nextstep})`
                    let body = `<span>Range value: ${range}</span><br/><span>Total count: ${this.y}</span>`
                    return `${body}`;
                },
                borderWidth: 0.5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: 4
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                area: {
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            },
            legend: {
                enabled: false
            },
            series: [{
                data: this.steps
            }]
        });
    }
}
