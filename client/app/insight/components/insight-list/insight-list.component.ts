import { Component, OnInit, Input, Output, ViewEncapsulation, ChangeDetectionStrategy, EventEmitter } from '@angular/core';
import { IInsightPolygon } from '../../interfaces';
import { ILayer } from '@client/app/shared/interfaces';
import { DomSanitizer } from '@angular/platform-browser';
import { MapService } from '@client/app/shared';
import { FormArray, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'ps-insight-list',
  templateUrl: './insight-list.component.html',
  styleUrls: ['./insight-list.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightListComponent implements OnInit {
  @Input() showPercentage: boolean = true;
  @Input() showDensity: boolean = false;
  @Input() showComparison: boolean = false;
  @Input() showCompactView: boolean = false;
  @Input() polygons: IInsightPolygon[];
  @Input() results: any[];
  @Input() groups: any[];
  @Input() loading: boolean;
  formGroup: FormGroup = new FormGroup({
    index: new FormControl(''),
    label: new FormControl('')
  });

  @Output() located = new EventEmitter<{index: number}>()
  @Output() edited = new EventEmitter<{index: number, label: string}>()

  public get indexPolygonEditing(): string {
    return this.formGroup.get('index').value
  }

  public get labelPolygonEditing() {
    return this.formGroup.get('label')
  }

  public scrollLeft = 0;

  constructor(
    private _domSanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {
  }

  findGroup(layer: ILayer) {
    return this.groups.find(x => x.id === layer.groupId);
  }

  onLocate(index: any) {
    this.located.emit({ index })
  }

  onEdit(col: any, index: number) {
    this.formGroup.patchValue({
      index,
      label: col.label
    })
  }

  onSave() {
    const { index, label } = this.formGroup.getRawValue();
    this.edited.emit({ index, label })
    this.formGroup.reset();
  }

  getBackground(index: number, maxIndex: number) {
    const value = maxIndex ? index / maxIndex * 100 : 0;
    return this._domSanitizer.bypassSecurityTrustStyle(`linear-gradient(to right, #638ec6, #638ec6 ${value}%, #fff ${value ? value + 10 : 0}%, #fff)`)
  }
}
