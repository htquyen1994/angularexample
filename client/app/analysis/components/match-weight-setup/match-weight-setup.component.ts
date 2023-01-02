import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IInsightPolygon } from '@client/app/insight/interfaces';
import { DomSanitizer } from '@angular/platform-browser';
import { ILayer } from '@client/app/shared/interfaces';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatchItColumn } from '@client/app/resultpanel/shared/models/match-it-filter.model';

@Component({
  selector: 'ps-match-weight-setup',
  templateUrl: './match-weight-setup.component.html',
  styleUrls: ['./match-weight-setup.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchWeightSetupComponent implements OnInit {
  @Input() showPercentage: boolean = true;
  @Input() showDensity: boolean = false;
  @Input() showComparison: boolean = false;
  @Input() showCompactView: boolean = false;
  @Input() polygons: IInsightPolygon[];
  @Input() results: any[];
  @Input() groups: any[];
  @Input() loading: boolean;
  @Input() selectedPolygonIndex: number = 0;
  @Input() densityValues: any[] = [];
  @Output() located = new EventEmitter<{index: number}>();
  @Output() filterChange = new EventEmitter<any>();


  public scrollLeft = 0;
  private filterChange$: Subject<void> = new Subject<void>();
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private _domSanitizer: DomSanitizer,
    private _cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterChange$.pipe(takeUntil(this.unsubscribe$), debounceTime(100)).subscribe(()=>{
      this.filterChange.emit(this.densityValues[this.selectedPolygonIndex]);
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  findGroup(layer: ILayer) {
    return this.groups.find(x => x.id == layer.groupId);
  }

  onLocate(index: any) {
    this.located.emit({ index })
  }

  getBackground(index: number, maxIndex: number) {
    const value = maxIndex ? index / maxIndex * 100 : 0;
    return this._domSanitizer.bypassSecurityTrustStyle(`linear-gradient(to right, #638ec6, #638ec6 ${value}%, #fff ${value ? value + 10 : 0}%, #fff)`)
  }

  onFilterChange(event?){
    this.filterChange$.next()
  }

  onGroupSlideToggleChange($event: MatSlideToggleChange, layerId: string, children: MatchItColumn[]) {
    const value = this.densityValues[this.selectedPolygonIndex][layerId];
    const columnIds = children.map(e=>e.columnId);
    const newValue = {};
    const weight = $event.checked ? 1 : 0;
    Object.keys(value).filter(e=>columnIds.includes(e)).forEach(columnId => {
      const column = value[columnId];
      const isSumCol =  Object.keys(column).find(e=>e === 'density');
      if(isSumCol){
        newValue[columnId] = {
          ...value[columnId],
          weight
        }
      }else{
        const newValueKey = {}
        Object.keys(column).forEach(key=>{
          newValueKey[key] = {
            ...column[key],
            weight
          }
        })
        newValue[columnId] = {
          ...value[columnId],
          ...newValueKey
        }
      }
    });
    this.densityValues[this.selectedPolygonIndex][layerId] = {
      ...this.densityValues[this.selectedPolygonIndex][layerId],
      ...newValue
    }
    this._cd.detectChanges();
    this.filterChange$.next();
  }
}
