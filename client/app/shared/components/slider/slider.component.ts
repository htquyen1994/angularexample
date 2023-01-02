import {
    Component,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    forwardRef,
    HostBinding,
    Renderer2,
    NgZone, ChangeDetectorRef
} from '@angular/core';

import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import {LayerDataService} from '../../layer-data.service';

export const SLIDER_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SliderComponent),
    multi: true
};

@Component({
    selector: 'go-slider',
    moduleId: module.id,
    templateUrl: 'slider.component.html',
    styleUrls: ['slider.component.less'],
    providers: [SLIDER_VALUE_ACCESSOR]
})
export class SliderComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {

    @HostBinding('class.loading') isLoading = true;
    @HostBinding('class.disabled')
    @Input() disabled: boolean;
    @Input('value')
    set _value(value: any) {
        if (!Array.isArray(value)) {
            this.value[0] = value || 0;
        } else {
            this.value = value || [0, 0];
        }
    }

    @Input('range')
    set _range(value: boolean) {
        this.range = value;
    }

    @Input() float = false;
    @Input() percent = false;
    @Input() layerId: string;
    @Input() columnId: string;
    @Input("columnValueDistribution") _columnValueDistribution: {
        min: number,
        max: number,
        steps: number[],
        sd: number
    };

    @Output() onChange: EventEmitter<any> = new EventEmitter();

    value: number[] = [0, 0];
    range: boolean;
    min = 0;
    max = 0;
    steps: number[] = [];
    dragging: boolean;
    initX = 0;
    activeHandleIndex = 0;
    path: string;

    mouseMoveListener: any;
    mouseUpListener: any;
    onModelChange: Function = () => {
    }
    onModelTouched: Function = () => {
    }

    constructor(public el: ElementRef,
                public renderer: Renderer2,
                private changeDetectorRef: ChangeDetectorRef,
                private zone: NgZone,
                public layerDataService: LayerDataService) {
    }

    onMouseDown(event: Event, index?: number) {
        if (!this.disabled) {
            this.dragging = true;
            this.initMouseListeners();
            this.activeHandleIndex = index;
            const rect = this.el.nativeElement.getBoundingClientRect();
            this.initX = rect.left + (window.pageXOffset || document.documentElement.scrollLeft) -
                (document.documentElement.clientLeft || 0);
        }
    }

    ngAfterViewInit() {
        if (!this.disabled) {
            if(!this._columnValueDistribution){
                this.layerDataService.getColumnValueDistribution(this.layerId, this.columnId, 26)
                .pipe(debounceTime(500))
                .subscribe(
                    response => {
                        this.disabled = false;
                        this.min = response.min;
                        this.max = response.max;
                        this.steps = response.steps;
                        var variance = response.sd; // 1 standard deviation each side
                        this.setValue(variance);
                        this.isLoading = false;
                        this.changeDetectorRef.markForCheck();
                        this.changeDetectorRef.detectChanges();
                    },
                    error => {
                        this.isLoading = false;
                        this.changeDetectorRef.markForCheck();
                        this.changeDetectorRef.detectChanges();
                    });
            }else{
                this.min = this._columnValueDistribution.min;
                this.max = this._columnValueDistribution.max;
                this.steps = this._columnValueDistribution.steps;
                this.setValue(this._columnValueDistribution.sd);
                this.isLoading = false;
                this.changeDetectorRef.markForCheck();
                this.changeDetectorRef.detectChanges();
            }
        }
    }

    setValue(variance){
        if (this.range && variance !== null && this.value[0] === this.value[1]) {
            this.value[0] = this.guardValue(Number((this.value[0] - variance).toFixed(2)), this.min, this.range ? this.value[1] : this.max);
            this.value[1] = this.guardValue(Number((this.value[1] + variance).toFixed(2)), this.value[0], this.max);
        }
        else {
            this.value[0] = this.guardValue(this.value[0], this.min, this.range ? this.value[1] : this.max);
            this.value[1] = this.guardValue(this.value[1] || this.max, this.value[0], this.max);
        }


        const points: string = this.steps.map((point, index) => `L${index * 4},${100 - (point * 100)}`).join('');
        this.path = `M100,100 L0,100 ${points}z`;
        this.onModelChange(this.value);
        this.writeValue(this.range ? [this.value[0] || this.min, this.value[1] || this.max] : this.value[0] || this.min);
    }

    initMouseListeners() {

        this.zone.runOutsideAngular(() => {
            this.destroyMouseListeners();
            this.mouseMoveListener = this.renderer.listen('window', 'mousemove', (event: any) => {
                if (this.dragging) {
                    this.handleChange(event);
                }
            });

            this.mouseUpListener = this.renderer.listen('window', 'mouseup', (event: any) => {
                if (this.dragging) {
                    this.dragging = false;
                    this.destroyMouseListeners();
                }
            });
        });
    }

    destroyMouseListeners() {
        if (this.mouseMoveListener) {
            this.mouseMoveListener();
        }

        if (this.mouseUpListener) {
            this.mouseUpListener();
        }
    }

    ngOnDestroy() {
        this.destroyMouseListeners();
    }

    writeValue(value: any): void {
        if (value === null || value === '') {
            value = this.range ? [0, this.max ? this.max : 0] : this.min;
        }

        if (this.range && (this.value[0] !== value[0] || this.value[1] !== value[1])) {
            this.value = value || [this.min, this.max];
            // this.onModelChange(this.value);
            // this.onModelTouched();
        } else if (!this.range && this.value[0] !== value) {
            this.value = [value || this.min, this.max];
            // this.onModelChange(this.value);
            // this.onModelTouched();

        }
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    setDisabledState(value: boolean): void {
        this.disabled = value;
    }

    handleChange(event: MouseEvent) {
        const handleValue = Math.floor(((event.pageX - this.initX) * 100) / (this.el.nativeElement.offsetWidth));
        let newValue = (this.max - this.min) * (handleValue / 100) + this.min;
        if (!this.float) {
            newValue = Math.round(newValue);
        }
        this.updateValue(newValue);
    }

    updateValue(value: number) {
        if (this.activeHandleIndex === 0) {
            this.value[0] = this.guardValue(value, this.min, this.range ? this.value[1] : this.max);
        } else {
            this.value[1] = this.guardValue(value, this.value[0], this.max);
        }
        this.onModelChange(this.value);
        this.writeValue(this.range ? this.value : this.value[0]);
    }

    onInputChange(index: number, value: number) {
        this.activeHandleIndex = index;
        this.updateValue(value);
    }

    private guardValue(value: number, min: number, max: number): number {
        if (value < min) {
            return min;
        } else if (value > max) {
            return max;
        } else {
            return value;
        }
    }
}
