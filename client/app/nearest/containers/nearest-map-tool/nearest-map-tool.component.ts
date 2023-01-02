import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, combineLatest, Subject } from 'rxjs';
import { IErrorResponse, FilterService, SelectionService } from '@client/app/shared';
import { TravelMode } from '@client/app/core/modules/view-management/enums';
import { PsSelectOption, PsSelectOptionItem } from '@periscope-lib/form/select/select.model';
import { LayerStoreService } from '@client/app/core/services';
import { NearestStoreService } from '../../services';
import { map, takeUntil, filter, first, debounceTime, withLatestFrom } from 'rxjs/operators';
import { LayerType } from '@client/app/shared/enums';

@Component({
  selector: 'ps-nearest-map-tool',
  templateUrl: './nearest-map-tool.component.html',
  styleUrls: ['./nearest-map-tool.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NearestMapToolComponent implements OnInit {
  public readonly travelModes = TravelMode
  public formGroup: FormGroup;
  public loading$: Observable<boolean>;
  public error$: Observable<IErrorResponse>;
  public selectedShapes$: Observable<number>;
  public layerGroupOptions$: Observable<PsSelectOption[]>;
  public filterOptions$: Observable<PsSelectOption[]>;
  public get travelMode() {
    return this.formGroup.get('mode')?.value
  }

  public get selectedLayerId() {
    return this.formGroup.get('layerId')?.value
  }

  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private _layerStoreService: LayerStoreService,
    private _nearestStoreService: NearestStoreService,
    private _filterService: FilterService,
    private _selectionService: SelectionService,
  ) { }

  ngOnInit(): void {
    this.layerGroupOptions$ = this._layerStoreService.layerGroups$.pipe(
      map((_groups)=>{
        const groups: PsSelectOption[] = _groups.map(group => {
          const items = group.layers.map((layer) => {
            if (layer.type === LayerType.POINT) {
              return {
                label: layer.name,
                value: layer.id,
                disabled: false
              } as PsSelectOptionItem
            }
            return null;
          }).filter(e => !!e);

          return items.length ? {
            label: group.name,
            value: group.id,
            items
          } as PsSelectOption : null
        }).filter(e=>!!e);
        return groups;
      }));
    this.filterOptions$ = this._nearestStoreService.filters$.pipe(map(e=>e.map(filter=>({ value: filter.id, label: filter.name } as PsSelectOption))));
    combineLatest(
      this.layerGroupOptions$.pipe(filter(e=>!!(e && e.length)),first()),
      this._nearestStoreService.toolPayload.pipe(first())
    ).pipe(takeUntil(this.unsubscribe$)).subscribe(([layerGroups ,payload])=>{
      const { layerId } = payload;
      if(layerId){
        this.initForm(payload)
        return;
      }
      const groups= layerGroups.filter(e=>e.items && e.items.length);
      const layers = groups[0] ? groups[0].items : []
      const _layerId = layers[0].value;
      const filter = this._filterService.filterActiveStore[_layerId];
      const filterId = filter ? filter.id : null;
      this.initForm({...payload, layerId: _layerId, filterId});
    })
    this.selectedShapes$ = this._nearestStoreService.pointShapes$.pipe(map(e=>e.length));
    this.selectedShapes$ = this._selectionService.selection.pipe(map(() =>
      Array.from(this._selectionService.selectionStore).map(([layerId, shapes]) => shapes.size).reduce((a, b) => a + b)));
    this.loading$ = this._nearestStoreService.loading$;
    this.error$ = this._nearestStoreService.error$;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onRun() {
    const data = this.formGroup.getRawValue();
    this._nearestStoreService.getNearestResult(data)
  }

  onCancel() {
    this._nearestStoreService.cancelGetResult();
  }

  onSelectedTravelMode(mode: TravelMode) {
    this.formGroup.get('mode').setValue(mode)
  }

  private initForm(data?: any) {
    if (!this.formGroup) {
      this.formGroup = new FormGroup({
        value: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(25)]),
        layerId: new FormControl(null, [Validators.required]),
        filterId: new FormControl(null, [Validators.required]),
        mode: new FormControl(TravelMode.CAR, [Validators.required])
      })
      this.formGroup.get('layerId').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(layerId=>{
        if(!layerId) {
          return;
        }
        this._nearestStoreService.changeLayer(layerId);
        const filter = this._filterService.filterActiveStore[layerId];
        const _filterId = filter ? filter.id : null;
        this.formGroup.get('filterId').setValue(_filterId);
      })
    }
    if (data) {
      this.formGroup.patchValue({ ...data });
    }
  }
}
