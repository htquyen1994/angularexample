import { Component, HostBinding, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, NgZone } from '@angular/core';
import {
  SelectionService,
  AccountService,
  IErrorResponse
} from '../../shared';

import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { Observable, Subject, merge, combineLatest } from 'rxjs';
import { map, takeUntil, withLatestFrom, first, debounceTime, filter } from 'rxjs/operators';
import { InsightStoreService, InsightLogicService } from '@client/app/insight/services';
import { ViewManagementStoreService } from '@client/app/core/modules/view-management/services';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ModalService } from '../../shared/services';
import { InsightViewManagementComponent, IInsightView } from '@client/app/core/modules';
import { LayerSource } from '@client/app/core/enums';
import { ResultStatus } from '@client/app/shared/models/modal.model';
import { DeleteConfirmComponent, FeatureShareFormComponent } from '@client/app/shared/containers';
import { EFeatureShare, ERecipientType } from '@client/app/shared/enums';
import { ShareFeatureDialogModel } from '@client/app/shared/interfaces';

@Component({
  selector: 'go-insight-tool',
  moduleId: module.id,
  templateUrl: 'insight-tool.component.html',
  styleUrls: ['insight-tool.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InsightToolComponent {

  @HostBinding('attr.tabindex') tabindex = 1;

  public isDevMode = false;
  public hideAddInsightView = false;
  public autoRun$: Observable<Boolean>;
  public selectViewOptions$: Observable<PsSelectOption[]>;
  public selectView = 0;
  public selectedShapes$: Observable<number>;
  public loading$: Observable<boolean>;
  public error$: Observable<IErrorResponse>
  public disableEdit$: Observable<boolean>;
  public formGroup: FormGroup;
  public showInstructions: boolean = false;
  public selectedView: IInsightView;
  public insightViewLoading$: Observable<boolean>;
  private unsubscribe$: Subject<void> = new Subject<void>();
  private modalRef: any;

  constructor(
    private selectionService: SelectionService,
    private accountService: AccountService,
    private _insightStoreService: InsightStoreService,
    private _insightLogicService: InsightLogicService,
    private _manageViewService: ViewManagementStoreService,
    private _modalService: ModalService,
    private _cd: ChangeDetectorRef,
    private _ngZone: NgZone
  ) {
    this.insightViewLoading$ = this._manageViewService.insightViewsLoading$
    this.loading$ = this._insightStoreService.loading$.pipe();
    this.autoRun$ = this._insightStoreService.autoRun$;
    this.error$ = this._insightStoreService.error$;

    this._initFrom();
    combineLatest(
      this._manageViewService.insightViews$.pipe(filter(e => !!e), first()),
      this._insightStoreService.selectedView$.pipe(first())
    ).subscribe(([views, view]) => {
      if (!views.length) {
        return;
      }
      if (!view) {
        const _view = views.find(e => e.isDefault);
        this._initFrom(_view ? _view.id : views[0].id)
        return;
      }
      this._initFrom(view.id);
    })

    this.disableEdit$ = this._insightStoreService.selectedView$.pipe(map(e => !e || (e && e.source !== LayerSource.USER)));
    this.selectViewOptions$ = this._manageViewService.insightViews$.pipe(
      map(views => views.map((e, index) => ({
        label: e.name,
        value: e.id
      } as PsSelectOption))));

    this.selectedShapes$ = this.selectionService.selection.pipe(map(() =>
      Array.from(this.selectionService.selectionStore).map(([layerId, shapes]) => shapes.size).reduce((a, b) => a + b)))

    this.accountService.account.pipe(
      takeUntil(this.unsubscribe$),
      withLatestFrom(
        this._insightStoreService.autoRun$
      )
    ).subscribe(([account, autoRun]) => {
      this.isDevMode = account.isDevMode;
      this.hideAddInsightView = account.hideAddInsightView;
      if(autoRun != account.insightAutoRun){
        this._insightStoreService.enableAutoRun(account.insightAutoRun);
      }
    });

    merge(
      this.selectionService.active.pipe(filter(selection => selection.isAdd)),
      this._insightLogicService.change$.asObservable()
    ).pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(200),
      withLatestFrom(
        this.autoRun$
      ),
    ).subscribe(([_, autoRun]) => {
      if (!autoRun) {
        return;
      }

      this.onRun();
      this._cd.detectChanges();
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onRun() {
    this._insightStoreService.getInsightResult();
  }

  onCancel() {
    this._insightStoreService.cancelGetInsightResult();
  }

  private _initFrom(viewId?: string): void {
    if (!this.formGroup) {
      this.formGroup = new FormGroup({
        selectedView: new FormControl(null, Validators.required)
      })
      this.formGroup.get('selectedView').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
        this._insightStoreService.selectView(value);
      })
      this._insightStoreService.selectedView$.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
        if(!value){
          return;
        }
        this.selectedView = value
        this.formGroup.get('selectedView').patchValue(value.id, { emitEvent: false })
      })
    }
    if (viewId) {
      this.formGroup.patchValue({
        selectedView: viewId
      })
    }
  }

  onAdd() {
    this.openModal();
  }

  onEdit() {
    const { selectedView } = this.formGroup.getRawValue();
    this._manageViewService.editInsightView(selectedView);
    this.openModal({ isEditing: true });
  }

  onDelete() {
    if(!this.selectedView){
      return;
    }
    const view = {...this.selectedView}
    this.openDeleteConfirmDialog(view.name, ()=>{
      this._manageViewService.deleteInsightView(view.id);
    })
  }

  onCopy() {
    if(!this.selectedView){
      return;
    }
    const view = {...this.selectedView}
    this._manageViewService.copyInsightView(view.id);
  }

  onShare() {
    if(!this.selectedView){
      return;
    }
    const view = {...this.selectedView}
    const ref = this._modalService.openModal(FeatureShareFormComponent, {
      titleDialog: 'Share View',
      titleText: `View: ${view.name}`,
      data: {
        type: EFeatureShare.INSIGHT_VIEW,
        data: view,
        name: view.name,
        key: 'insights',
        recipientType: ERecipientType.ALL
      }
    } as ShareFeatureDialogModel)
  }

  openModal(data?: { isEditing: boolean }) {
    if (this.modalRef) {
      return this.modalRef;
    }
    this.modalRef = this._modalService.openModal(InsightViewManagementComponent, data);
    this.modalRef.afterClosed().pipe(first()).subscribe(res => {
      this.modalRef = null;
    })
    return this.modalRef
  }

  openDeleteConfirmDialog(name: string, deleteFunction: Function) {
    const ref = this._modalService.openModal(DeleteConfirmComponent, {
      deleteModel: {
        title: 'Delete View',
        innerHtml: `Are you sure you want to delete <strong>${name}</strong>?`
      }
    })
    ref.afterClosed().pipe(first()).subscribe(res => {
      if (res && res.status == ResultStatus.OK) {
        deleteFunction();
      }
    })
  }

  onToggleInstructions() {
    this.showInstructions = !this.showInstructions;
  }

  onViewActionClick(id: string) {
    switch (id) {
      case 'add':
        this.onAdd();
        break;
      case 'edit':
        this.onEdit();
        break;
      case 'delete':
        this.onDelete();
        break;
      case 'copy':
        this.onCopy();
        break;
      case 'share':
        this.onShare();
        break;

      default:
        break;
    }
  }
}
