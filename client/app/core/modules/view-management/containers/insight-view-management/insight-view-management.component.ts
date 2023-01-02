import { Component, OnInit, Inject, NgZone, ViewChild, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, ElementRef } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { IInsightCatchmentType } from '@client/app/shared/enums';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { IInsightView, ILayerInsightView, IInsightLayer, ICatchmentView } from '../../interface';
import { AccountService, IErrorResponse } from '@client/app/shared';
import { ViewManagementStoreService } from '../../services';
import { shareReplay, takeUntil, map, withLatestFrom, first } from 'rxjs/operators';
import { createBehaviorSubject } from '@periscope-lib/commons/helpers'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from '@client/app/shared/components';
import { ModalService } from '@client/app/shared/services';
import { CatchmentViewManagementComponent } from '../catchment-view-management/catchment-view-management.component';
import { ResultStatus } from '@client/app/shared/models/modal.model';
import { InfoTemplatesHelper } from '@client/app/shared/helper';

@Component({
  selector: 'ps-insight-view-management',
  templateUrl: './insight-view-management.component.html',
  styleUrls: ['./insight-view-management.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InsightViewManagementComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;
  @ViewChild('ScrollEl') scrollEl: ElementRef;
  private unsubscribe$: Subject<void> = new Subject<void>();

  public form: FormGroup;
  public readonly insightCatchmentTypeOptions: PsSelectOption[] = [{
    value: IInsightCatchmentType.RADIUS,
    label: 'Circle'
  }, {
    value: IInsightCatchmentType.DRIVE_TIME,
    label: 'Drive Time'
  }, {
    value: IInsightCatchmentType.DRIVE_DISTANCE,
    label: 'Drive Distance'
  }, {
    value: IInsightCatchmentType.WALK_TIME,
    label: 'Walk Time'
  }, {
    value: IInsightCatchmentType.WALK_DISTANCE,
    label: 'Walk Distance'
  }, {
    value: IInsightCatchmentType.BICYCLE_TIME,
    label: 'Bicycle Time'
  }, {
    value: IInsightCatchmentType.BICYCLE_DISTANCE,
    label: 'Bicycle Distance'
  }];

  public isMetric = false;
  public layerGroupOptions$: Observable<PsSelectOption[]>;
  public layers$: BehaviorSubject<ILayerInsightView[]> = createBehaviorSubject(this._viewManagementStoreService.insightLayers$.pipe(takeUntil(this.unsubscribe$)), [])
  public loading$: Observable<boolean>;
  public updateError$: Observable<IErrorResponse>;
  public isShowCatchment: boolean = false;
  public readonly infoHTML = InfoTemplatesHelper.INSIGHT_VIEW_DIALOG;

  get catchments(): FormArray {
    return this.form ? this.form.get('catchments') as FormArray : null
  }

  get layers(): FormArray {
    return this.form ? this.form.get('layers') as FormArray : null;
  }

  get insightViewLayers() {
    return this.layers$.getValue()
  }
  constructor(
    private _accountService: AccountService,
    private _viewManagementStoreService: ViewManagementStoreService,
    private _dialogRef: MatDialogRef<InsightViewManagementComponent>,
    private _ngZone: NgZone,
    private _modalService: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: { isEditing: boolean },
    private _cd: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loading$ = this._viewManagementStoreService.isUpdating$;
    this.updateError$ = this._viewManagementStoreService.updateError$;
    // this._viewManagementStoreService.getInsightLayers();
    this._accountService.account.pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      this.isMetric = account.isMetric;
    });
    if (this.data && this.data.isEditing) {
      this._viewManagementStoreService.editingView$.pipe(takeUntil(this.unsubscribe$)).subscribe(view => {
        if (!view) {
          return;
        }
        this.initForm(view);
      })
    }
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  checkDisableAddLayer([selectedLayerId, layers]){
    if (!layers) {
      return false;
    }
    return !!layers.find(_e => _e.layerId == selectedLayerId);
  }

  initForm(data?: IInsightView) {
    if (!this.form) {
      this.form = new FormGroup({
        selectedLayerId: new FormControl(null),
        id: new FormControl(null),
        name: new FormControl('', [Validators.required]),
        isDefault: new FormControl(false),
        catchments: new FormArray([]),
        layers: new FormArray([], Validators.required)
      })
      this.layerGroupOptions$ = createBehaviorSubject(this.layers.valueChanges.pipe(takeUntil(this.unsubscribe$)), this.layers.value).pipe(
        withLatestFrom(
          this._viewManagementStoreService.insightLayers$,
          this._viewManagementStoreService.insightLayerGroupOptions$,
        ),
        map(([selectedLayers, layers, options]) => {
          const _options = options.slice();
          const _selectedLayer = layers.filter(e => !!selectedLayers.find(_e => _e.layerId == e.id));
          _selectedLayer.forEach(layer => {
            const index = _options.findIndex(e => e.value == layer.groupId);
            if (index != -1) {
              const opt = {
                ..._options[index],
                items: _options[index].items.map(layer => ({
                  value: layer.value,
                  label: layer.label,
                  disabled: !!this._containsLayer(layer.value)
                }))
              };
              _options.splice(index, 1, opt)
            }
          })
          return _options
        }),
        shareReplay(1)
      )
    }
    if (data) {
      const { id, name, catchments, isDefault, layers } = data;
      const _layers = (layers || []).map(insightLayer=> this._decorateInsightLayer(insightLayer)).filter(e=>!!e)
      _layers.forEach((e,i)=>{
        if(!this.layers.at(i)){
          this.layers.push(this._getLayerControl())
        }
      })
      catchments.forEach((e,i)=>{
        if(!this.catchments.at(i)){
          this.catchments.push(this._getCatchmentControl())
        }
      })
      this.form.patchValue({
        id,
        name,
        isDefault,
        catchments,
        layers: _layers
      })
    }
  }

  getColumnOptions(layerId:string) {
    const layer = this.insightViewLayers.find(e=>e.id === layerId);
    if(!layer) {
      return [];
    }
    return layer.columnGroupOptions
  }

  addCatchment() {
    const control = this._getCatchmentControl();
    if (this.catchments) {
      this.catchments.push(control);
    }
  }

  onRemoveCatchment(index: number) {
    this.catchments.removeAt(index);
  }

  addLayer() {
    const { selectedLayerId } = this.form.getRawValue();
    if (!selectedLayerId) {
      return;
    }
    const control = this._getLayerControl();
    if (!this.layers) {
      return
    }

    const layer = this.insightViewLayers.find(e=>e.id === selectedLayerId);
    if(!layer) {
      return ;
    }
    const data = {
      layerId: layer.id,
      layerName: layer.name,
      columnIds: []
    }
    control.patchValue({
      ...data
    })
    this.layers.push(control);
    this._cd.detectChanges();
    if(this.scrollEl && this.scrollEl.nativeElement){
      this.scrollEl.nativeElement.scrollTop =  this.scrollEl.nativeElement.scrollHeight;
    }
  }

  removeLayer(index){
    this.layers.removeAt(index);
  }

  public onSave() {
    const { id, name, isDefault, catchments, layers } = this.form.getRawValue();
    if (this.data && this.data.isEditing) {
      this._viewManagementStoreService.updateInsightView(id, {
        id,
        name,
        isDefault,
        catchments,
        layers: layers.map(e => ({
          layerId: e.layerId,
          columnIds: e.columnIds
        }))
      })
      return;
    } else {
      this._viewManagementStoreService.createInsightView({
        id,
        name,
        isDefault,
        catchments,
        layers: layers.map(e => ({
          layerId: e.layerId,
          columnIds: e.columnIds
        }))
      })
    }
    this.form.updateValueAndValidity
  }

  public onDialogClose(result?: any) {
    this._ngZone.run(() => {
      this._dialogRef.close(result);
    })
  }

  public onCancel() {
    this.onDialogClose();
  }

  public onToggleShowCatchMent(){
    this.isShowCatchment = !this.isShowCatchment;
  }

  public onOpenCatchmentDialog(){
    const catchmentViews = this.catchments.getRawValue();
    this._ngZone.run(() => {
      const ref = this._modalService.openModal(CatchmentViewManagementComponent, {
       views: catchmentViews
      }, {hasBackdrop: true, disableClose: true})
      ref.afterClosed().pipe(first()).subscribe(res => {
        if (res) {
          if (res.status == ResultStatus.OK) {
            const { views } = res;
            this._clearCatchments()
            views.forEach((view: ICatchmentView) => {
              this.catchments.push(this._getCatchmentControl(view))
            });
            this._cd.detectChanges();
          }
        }
      })
    })
  }

  private _clearCatchments() {
    while (this.catchments.length !== 0) {
      this.catchments.removeAt(0)
    }
  }

  private _decorateInsightLayer(insightLayer: IInsightLayer){
    const { layerId, columnIds } = insightLayer;
    const layer = this.insightViewLayers.find(e=>e.id === layerId);
    if(!layer) {
      return null;
    }
    return {
      layerId: layer.id,
      layerName: layer.name,
      columnIds
    }
  }


  private _getCatchmentControl(data?: ICatchmentView) {
    const control = new FormGroup({
      value: new FormControl(null),
      mode: new FormControl(null),
      type: new FormControl(null),
      toOrigin: new FormControl(null),
      isDetail: new FormControl(null),
      unit: new FormControl(null)
    })
    if(data){
      control.patchValue(data);
    }
    return control
  }

  private _getLayerControl(data?:any) {
    const control = new FormGroup({
      layerId: new FormControl(''),
      layerName: new FormControl(''),
      columnIds: new FormControl([], Validators.required)
    })
    if(data){
      control.patchValue(data);
    }
    return control
  }

  private _containsLayer(layerId: string) {
    return this.layers && this.layers.controls
      .find((control: FormGroup) => control.get('layerId').value === layerId);
  }

}
