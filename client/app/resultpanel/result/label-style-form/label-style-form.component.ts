import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ILabelStyle, ELabelPosition, ELabelPositionName } from 'src/client/app/shared/models/label.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { ILayerColumn, ILayer } from 'src/client/app/shared/interfaces';
import { ILayerColumnType, LayerType } from 'src/client/app/shared/enums';
import { map } from 'rxjs/operators';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'label-style-form',
  templateUrl: './label-style-form.component.html',
  styleUrls: ['./label-style-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LabelStyleFormComponent implements OnInit {
  @Input() layer: ILayer
  @Input() isLoading: boolean;
  @Input() style: ILabelStyle;
  @Input('columns') set _columns(value: ILayerColumn[]) {
    const _value = value || [];
    this.columns.next(_value.filter(e => !e.notSelectable && e.type !== ILayerColumnType.SHAPE && !e.isTextarea));
  }
  @Output() close = new EventEmitter<any>();
  form: FormGroup;
  ELabelPosition = ELabelPosition;
  columns = new BehaviorSubject<ILayerColumn[]>([]);
  columnsOptions$: Observable<PsSelectOption[]> = this.columns.asObservable().pipe(map(e=> e.map(_e=>({value: _e.id, label: _e.name}))))
  positionOptions: PsSelectOption[] = Object.keys(ELabelPosition).map(e=>{
    return {
      value: e,
      label: ELabelPositionName[e]
    }
  });
  LayerType = LayerType;
  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.innitFrom();
  }

  innitFrom() {
    if (this.style) {
      const position = this.positionOptions.find(e=>e.value == this.style.position);
      this.form = this.fb.group({
        id: [this.style.id],
        name: [this.style.name, Validators.required],
        columnName: [this.style.columnName, Validators.required],
        color: [this.style.color],
        backgroundColor: [this.style.backgroundColor],
        textSize: [this.style.textSize],
        fontStyle: [this.style.fontStyle ? this.style.fontStyle : []],
        position: [position ? position.value : ELabelPosition.CENTER],
        backgroundTransparent: [this.style.backgroundTransparent],
        isDefault: [this.style.isDefault],
        enableScaleRange: [this.style.enableScaleRange],
        rangeScale: [this.style.rangeScale ? this.style.rangeScale : [5,19]]
      })
    } else {
      this.form = this.fb.group({
        id: [null],
        name: ['', Validators.required],
        columnName: [null, Validators.required],
        color: ['#000000'],
        backgroundColor: ['#ffffff'],
        textSize: [11],
        fontStyle: [[]],
        position: [ELabelPosition.CENTER],
        backgroundTransparent: [1],
        isDefault: [false],
        enableScaleRange: [false],
        rangeScale: [[5,19]]
      })
    }
    this.form.get('rangeScale').valueChanges.subscribe(e=>this.cd.detectChanges())
  }

  onSave() {
    this.close.next({ data: this.form.getRawValue() });
  }
  onCancel() {
    this.close.next(null);
  }

  onSelectStyle(style: string) {
    const values: string[] = this.form.get('fontStyle').value;
    const index = values.findIndex(e => e == style);
    if (index != -1) {
      values.splice(index, 1);
      this.form.get('fontStyle').setValue(values);
    } else {
      values.push(style);
      this.form.get('fontStyle').setValue(values);
    }
  }
}
