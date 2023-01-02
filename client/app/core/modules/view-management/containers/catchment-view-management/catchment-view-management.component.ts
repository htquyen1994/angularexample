import { Component, OnInit, ViewChild, NgZone, Inject, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TravelType, TravelMode, TravelDirectionType, TravelUnit, TravelRevolution } from '../../enums'
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { ISelectionButton } from '@periscope-lib/buttons/selection-button/selection-button.component';
import { catchmentTravelTypes, catchmentTravelModes, catchmentDirectionTypes, catchmentOutputs } from '../../constants';
import { ICatchmentView } from '../../interface';
import { Subject, Observable, of, BehaviorSubject } from 'rxjs';
import { DialogComponent, DynamicConfirmComponent } from '@client/app/shared/components';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResultStatus } from '@client/app/shared/models/modal.model';
import { AccountService, SettingsService } from '@client/app/shared';
import { map, takeUntil, debounceTime, first, filter, catchError, withLatestFrom } from 'rxjs/operators';
import { UNITS } from 'src/client/app/shared';
import { CatchmentValidatorService } from '../../services';
import { createBehaviorSubject } from '@periscope-lib/commons/helpers';
import { ModalService } from '@client/app/shared/services';
import { InfoTemplatesHelper } from '@client/app/shared/helper';
@Component({
  selector: 'ps-catchment-view-management',
  templateUrl: './catchment-view-management.component.html',
  styleUrls: ['./catchment-view-management.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatchmentViewManagementComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;

  private unsubscribe$: Subject<void> = new Subject<void>();
  private _innitData: any;

  public travelTypes: ISelectionButton[] = catchmentTravelTypes;
  public travelModes: ISelectionButton[] = catchmentTravelModes;
  public directionTypes: ISelectionButton[] = catchmentDirectionTypes;
  public outputs: ISelectionButton[] = catchmentOutputs;
  public catchmentForm: FormGroup;
  public catchments: FormArray = new FormArray([]);
  public isMetric$: BehaviorSubject<boolean>;
  public hasAdvancedCatchments$: BehaviorSubject<boolean>;
  public isInvalid$: Observable<boolean>;
  public editingIndex = null;
  public initData: any = [];
  public readonly travelDirectionType = TravelDirectionType;
  public readonly travelRevolution = TravelRevolution;
  public readonly TravelType = TravelType;
  public readonly TravelMode = TravelMode;
  public readonly TravelUnit = TravelUnit;
  public readonly infoHTML = InfoTemplatesHelper.CATCHMENT_VIEW_DIALOG
  get catchmentsValue() {
    return this.catchments.getRawValue();
  }
  constructor(
    private _accountService: AccountService,
    private _dialogRef: MatDialogRef<CatchmentViewManagementComponent>,
    private _ngZone: NgZone,
    private _catchmentValidatorService: CatchmentValidatorService,
    private _cd: ChangeDetectorRef,
    private _modalService: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: { views: ICatchmentView[] },
  ) { }

  ngOnInit(): void {
    this.isMetric$ = createBehaviorSubject(this._accountService.account.pipe(takeUntil(this.unsubscribe$), map(e => e.isMetric)), true)
    this.hasAdvancedCatchments$ = createBehaviorSubject(this._accountService.account.pipe(takeUntil(this.unsubscribe$), map(e => e.hasAdvancedCatchments)), false)
    const { views } = this.data;
    this._initForm(views);
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  trackByIndex(index: number, _: any): number {
    return index;
  }

  onTravelTypeSelected(event: ISelectionButton) {
    const { id } = event || {};
    this.catchmentForm.get('type').setValue(id);
  }

  onTravelModeSelected(event: ISelectionButton) {
    const { id } = event || {};
    this.catchmentForm.get('mode').setValue(id);
    if (id === TravelMode.CIRCLE) {
      this.travelTypes = catchmentTravelTypes.filter(e => e.id === TravelType.DISTANCE);
      this.onTravelTypeSelected({ id: TravelType.DISTANCE } as any)
    } else {
      this.travelTypes = catchmentTravelTypes;
    }

  }

  onTravelDirectionTypeSelected(event) {
    const { id } = event || {};
    this.catchmentForm.get('toOrigin').setValue(id === TravelDirectionType.TOWARD);
  }

  onOutputChange(event) {
    const { id } = event || {};
    this.catchmentForm.get('isDetail').setValue(id === TravelRevolution.DETAILED);
    if (id === TravelRevolution.SMOOTH) {
      this.directionTypes = catchmentDirectionTypes.filter(e => e.id === TravelDirectionType.FROM);
      this.onTravelDirectionTypeSelected({id: TravelDirectionType.FROM});
    } else {
      this.directionTypes = catchmentDirectionTypes;
    }
  }

  onAddCatchment() {
    const defaultCatchment = this.getCatchmentDefaultValue();
    this.catchments.push(this._getCatchmentControl({ ...defaultCatchment }));
    this.onEdit(this.catchments.length - 1);
  }

  onDeleteCatchment(index: number) {
    this.catchments.removeAt(index);
  }

  onEdit(index: number) {
    const catchment = this.catchmentsValue[index];
    this.editingIndex = index;
    this.catchmentForm.patchValue({ ...catchment })
  }

  onCancel() {
    this.onDialogClose();
  }

  onSave() {
    const views = this.catchments.getRawValue();
    this.onDialogClose({ status: ResultStatus.OK, views });
  }

  getCatchmentMode(mode: TravelMode) {
    return catchmentTravelModes.find(e => e.id === mode).label;
  }

  onSaveCatchment() {
    const data = this.catchmentForm.getRawValue();
    if(data.mode === TravelMode.CIRCLE){
      data.toOrigin = null;
      data.isDetail = null;
    }
    const unit = data.type == TravelType.DISTANCE ? this.isMetric$.value ? TravelUnit.KILOMETER : TravelUnit.MILE : TravelUnit.MINUTE;
    this.catchments.setControl(this.editingIndex, this._getCatchmentControl({ ...data, unit }));
    this.editingIndex = null;
  }

  onCancelAdd(){
    const catchmentControl = this.catchments.at(this.editingIndex);
    if(catchmentControl.invalid){
      this.catchments.removeAt(this.editingIndex);
    }
    this.editingIndex = null;
  }

  public onDialogClose(result?: any) {
    if(this.editingIndex != null) {
      this.onCancelAdd();
    }
    if(!result){
      this.onSave();
      return;
    }
    this._ngZone.run(() => {
      this._dialogRef.close(result);
    })
  }

  private _initForm(data?: ICatchmentView[]) {
    if (!this.catchmentForm) {
      this.catchmentForm = new FormGroup({
        value: new FormControl(null, Validators.required),
        mode: new FormControl(TravelMode.CAR),
        toOrigin: new FormControl(false),
        isDetail: new FormControl(true),
        type: new FormControl(TravelType.DURATION),
      }, { asyncValidators: this._catchmentValidatorService.validate() })
      this.isInvalid$ = this.catchmentForm.statusChanges.pipe(takeUntil(this.unsubscribe$), map(e => e === "INVALID"));
    }
    if (data && data.length) {
      data.forEach(e => {
        this.catchments.push(this._getCatchmentControl(e));
      })
      this.initData = this.catchments.getRawValue();
    }
  }

  private _getCatchmentControl(data?: ICatchmentView) {
    const control = new FormGroup({
      value: new FormControl(null, [Validators.min(0.1), Validators.required]),
      mode: new FormControl(null),
      type: new FormControl(null),
      toOrigin: new FormControl(null),
      isDetail: new FormControl(null),
      unit: new FormControl(null)
    })
    if (data) {
      control.patchValue(data);
    }
    return control
  }

  private getCatchmentDefaultValue(): ICatchmentView {
    return {
      isDetail: false,
      mode: TravelMode.CAR,
      toOrigin: false,
      type: TravelType.DURATION,
      unit: null,
      value: null
    }
  }
  openModal(success: Function, cancel?: Function) {
    this._ngZone.run(() => {
      const ref = this._modalService.openModal(DynamicConfirmComponent, {
        model: {
          title: "Confirm",
          content: "Do you want to save your catchment setting?",
          yesButton: "Yes",
          noButton: "No"
        }
      })
      ref.afterClosed().pipe(first()).subscribe(res => {
        if (res) {
          if (res.status == ResultStatus.OK) {
            success();
          } else {
            if(cancel) {
              cancel();
            }
          }
        }
      })
    })
  }
}
