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
    NgZone, ChangeDetectorRef, ViewEncapsulation, ViewChild
} from '@angular/core';

import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, Validator, NG_VALIDATORS } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { LayerDataService } from '../../layer-data.service';
import { numbertoNumberWithCommas, numberWithCommastoNumber } from '../../global';
export const FILTER_INPUT_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FilterInputComponent),
    multi: true
};

@Component({
    selector: 'go-filter-input',
    moduleId: module.id,
    templateUrl: 'filter-input.component.html',
    styleUrls: ['filter-input.component.less'],
    providers: [FILTER_INPUT_ACCESSOR,
        {
        provide: NG_VALIDATORS,
        useExisting: forwardRef(() => FilterInputComponent),
        multi: true,
      } ],

})
export class FilterInputComponent implements AfterViewInit, ControlValueAccessor,Validator {

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
    displayValue: FormGroup;
    _displayValue: any = {};

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
    realMin = 0;
    realMax = 0;
    get min() {
        return this.value[0] > this.realMin ? this.value[0] : this.realMin;
    };
    get max() {
        return this.value[1] < this.realMax ? this.value[1] : this.realMax;
    };
    activeHandleIndex = 0;
    steps: number[] = [];
    onModelChange: Function = () => {
    }
    onModelTouched: Function = () => {
    }
    validate(c: FormControl) {
        return this.displayValue.valid ? null : {
            error: true
        };
    }

    constructor(public el: ElementRef,
        public renderer: Renderer2,
        private changeDetectorRef: ChangeDetectorRef,
        private zone: NgZone,
        public layerDataService: LayerDataService) {
        this.displayValue = new FormGroup({
            minValue: new FormControl('', Validators.required),
            maxValue: new FormControl('', Validators.required)
        })
        this.displayValue.controls['minValue'].valueChanges.pipe(debounceTime(50)).subscribe(value => {
            if (this._displayValue['minValue'] != value) {
                this.onInputChange(0, value);
            }
        })
        this.displayValue.controls['maxValue'].valueChanges.pipe(debounceTime(50)).subscribe(value => {
            if (this._displayValue['maxValue'] != value) {
                this.onInputChange(1, value);
            }
        })
    }

    ngAfterViewInit() {
        if (!this.disabled) {
            if (!this._columnValueDistribution) {
                this.layerDataService.getColumnValueDistribution(this.layerId, this.columnId, 100)
                    .subscribe(
                        response => {
                            this.disabled = false;
                            this.realMin = response.min;
                            this.realMax = response.max;
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
            } else {
                this.realMin = this._columnValueDistribution.min;
                this.realMax = this._columnValueDistribution.max;
                this.steps = this._columnValueDistribution.steps;
                this.setValue(this._columnValueDistribution.sd);
                this.isLoading = false;
                this.changeDetectorRef.markForCheck();
                this.changeDetectorRef.detectChanges();
            }
        }
    }

    setValue(variance) {
        if (this.range && variance !== null && this.value[0] === this.value[1]) {
            this.value[0] = this.guardValue(Number((parseFloat(this.value[0].toString()) - variance).toFixed(2)), this.realMin, this.range ? this.value[1] : this.realMax);
            this.value[1] = this.guardValue(Number((parseFloat(this.value[1].toString()) + variance).toFixed(2)), this.value[0], this.realMax);
        }
        else {
            this.value[0] = this.guardValue(this.value[0], this.realMin, this.range ? this.value[1] : this.realMax);
            this.value[1] = this.guardValue(this.value[1] || this.realMax, this.value[0], this.realMax);
        }
        this.writeValue(this.value);
        this.onModelChange(this.value);
    }

    writeValue(value: any): void {
        if (value === null || value === '') {
            value = this.range ? [0, this.realMax ? this.realMax : 0] : [this.realMin, 0];
        } else if (!Array.isArray(value)) {
            value = [value, 0];
        }
        this.value = value;
        this.setValueDisplay();
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

    updateValue(value) {
        value = numberWithCommastoNumber(value)
        if (this.activeHandleIndex === 0) {
            this.value[0] = value;
        } else {
            this.value[1] = value;
        }
        this.writeValue(this.value);
        this.onModelChange(this.value);
    }

    onInputChange(index: number, value: any) {
        this.activeHandleIndex = index;
        this.updateValue(value);
    }

    setValueDisplay() {
        this._displayValue = {
            minValue: numbertoNumberWithCommas(this.value[0]),
            maxValue: numbertoNumberWithCommas(this.value[1])
        };
        this.changeDetectorRef.detectChanges();
        this.displayValue.patchValue(this._displayValue)
        this.displayValue.updateValueAndValidity();
        this.changeDetectorRef.detectChanges();
    }

    private guardValue(value: number, min: any, max: any): number {
        if (value < parseFloat(min)) {
            return min;
        } else if (value >= parseFloat(max)) {
            return max;
        } else {
            return value;
        }
    }
}
