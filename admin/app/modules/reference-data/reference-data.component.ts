import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ReferenceDataService, ReferenceDataStoreService } from './services';
import { BehaviorSubject, Subject, of, Observable, Observer } from 'rxjs';
import { IReferenceData, ITenantsWithAccess, ReferenceDataFilter } from './models';
import { Store, select } from '@ngrx/store';
import { ReferenceDataActions } from './store/actions';
import { ActionMessageService } from '@admin-core/services/action-message.service';
import { ISort } from '@admin-shared/models/common-table';
import { EDataType } from 'src/periscope-lib/src/lib/commons/utils/array.utils';
import { IDropdownItem } from '@admin-shared/components/periscope-dropdown/periscope-dropdown';
import { FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, takeUntil, map, tap, every, withLatestFrom } from 'rxjs/operators';
import { MasterSelector } from '../../store/selectors';
import { MatDialog } from '@angular/material/dialog';
import { DeleteCacheComponent } from './components/delete-cache/delete-cache.component';
import { DependenciesComponent, IDependenciesViewData } from './components/dependencies/dependencies.component';
import { ToolPanelColumns } from 'src/periscope-lib/src/lib/table/table.model';
import { DeleteCacheLayersComponent } from './components';
@Component({
  selector: 'go-reference-data',
  templateUrl: './reference-data.component.html',
  styleUrls: ['./reference-data.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ReferenceDataComponent implements OnInit {
  @ViewChild('tenantsHeader') tenantsHeader: ElementRef;
  @ViewChild('headerWrapper') headerWrapper: ElementRef;
  public pageSize = 100;
  public data$: Observable<IReferenceData[]>;
  public isLoading$: Observable<boolean>;

  public isLoadingGetReferencedInsightViews$ = new BehaviorSubject<boolean>(false)
  public tenants$: Observable<ITenantsWithAccess[]>;
  public activeSort$: Observable<ISort>;
  public activeFilter$: Observable<ReferenceDataFilter>;
  public tenantOptions: IDropdownItem[];
  public isTenantLoading$ = new BehaviorSubject<boolean>(false);
  public layerOptions$: Observable<IDropdownItem[]>;
  public form: FormGroup;
  public headerHeight: number = 86;
  public isDownload$ = new BehaviorSubject<boolean>(false);
  public isDownloadDefaultBuild$ = new BehaviorSubject<boolean>(false);
  public toolPanelColumns: ToolPanelColumns[] = [{
    id: '_selection',
    name: 'Selection',
    visible: true
  }, {
    id: 'id',
    name: 'Id',
    visible: true
  }, {
    id: 'layerInfo',
    name: 'Information',
    visible: true
  }, {
    id: 'insight',
    name: 'Analysis',
    visible: true
  }, {
    id: 'tenantsWithAccess',
    name: 'Tenants',
    visible: true
  }, {
    id: 'datasource',
    name: 'Data Source',
    visible: true
  }, {
      id: 'datamanagement',
      name: 'Data Management Process',
      visible: true
    }, {
    id: 'zoomLevelSettings',
    name: 'Zoom Level Settings',
    visible: true
  }, {
    id: 'databaseSettings',
    name: 'Database Settings',
    visible: true
  }, {
    id: 'actions',
    name: 'Actions',
    visible: true
  }];
  public currentActionData: IReferenceData = null;
  public highlightKeywordPatterns: string | string[];
  public allChecked$: Observable<boolean>;
  public haveChecked$: Observable<boolean>;
  public someChecked$: Observable<boolean>;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private _store: Store,
    private actionMessageService: ActionMessageService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    private referenceDataService: ReferenceDataService,
    private referenceDataStoreService: ReferenceDataStoreService
  ) {
  }

  ngOnInit() {
    this.data$ = this.referenceDataStoreService.selectReferenceFilteredData$.pipe(map(e => e ? e.data : []));
    this.tenants$ = this.referenceDataStoreService.selectReferenceFilteredData$.pipe(map(e => e ? e.tenants : []));
    this.allChecked$ = this.data$.pipe(map(e => e.filter(t => t.checked).length === 10))
    this.haveChecked$ = this.data$.pipe(map(e => e.filter(t => t.checked).length > 0))
    this.someChecked$ = this.haveChecked$.pipe(
      withLatestFrom(this.allChecked$),
      map(([haveChecked, allChecked]) => haveChecked && !allChecked)
    )
    this.isLoading$ = this.referenceDataStoreService.selectReferenceLoading$;
    this.activeFilter$ = this.referenceDataStoreService.selectReferenceFilter$;
    this.activeSort$ = this.referenceDataStoreService.selectReferenceSort$;
    this.referenceDataStoreService.selectReferenceIsRefresh$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isRefresh) => {
        if (isRefresh) {
          this.referenceDataStoreService.loadReferenceData();
        }
      })
    this._store.pipe(takeUntil(this.unsubscribe$), select(MasterSelector.selectTenants)).subscribe(tenants => {
      if (!tenants) return;
      this.isTenantLoading$.next(!(tenants.length > 0));
      this.tenantOptions = [...tenants.map(e => { return { id: e.id, name: e.name } })];
    });
    this.createForm();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCheckAll(checked: boolean) {
    this.referenceDataStoreService.selectAllReferenceData(checked)
  }

  onCheckRow(item: IReferenceData, checked: boolean) {
    this.referenceDataStoreService.selectReferenceData(item, checked)
  }

  showColumn([toolPanelColumns, value]) {
    const col = toolPanelColumns.find(e => e.id == value);
    if (col && col.visible) {
      return true;
    }
    return false;
  }

  getHeaderHeight(headerHeight) {
    return headerHeight + 'px';
  }

  getTenants(tenants) {
    this.bindingHeight();
    return tenants;
  }

  createForm() {
    this.form = this.fb.group({
      term: [null],
      selectedTenants: [[]],
      defaultBuildOnly: [false]
      // selectedLayers: [[]]
    })
    this.form.valueChanges.pipe(takeUntil(this.unsubscribe$), debounceTime(200)).subscribe(value => {
      const { term, selectedTenants, defaultBuildOnly } = value;
      this.referenceDataStoreService.changeFilter({
        term,
        selectedTenants,
        selectedLayers: [],
        defaultBuildOnly
      })
    })
  }

  onSort(_type: boolean, field: string, fieldChild?: string, dataType = EDataType.STRING) {
    const type = _type ? 'ASC' : 'DESC';
    this.referenceDataStoreService.changeSort({
      type,
      field,
      fieldChild,
      dataType
    })
  }


  onDownload() {
    this.isDownload$.next(true);
    this.referenceDataService.getDataReport().subscribe((e) => this.isDownload$.next(false));
  }

  onDownloadDefaultBuild() {
    this.isDownloadDefaultBuild$.next(true);
    this.referenceDataService.getDefaultBuildReport().subscribe((e) => this.isDownloadDefaultBuild$.next(false));
  }


  onFilterColumns(event) {
    const { cols } = event;
    this.toolPanelColumns = [...cols];
    this.cd.detectChanges();
    this.bindingHeight();
  }

  onDeleteCache(data: IReferenceData) {
    if (!data) return;
    const { dataPackageId, zoomLevelSettings, metadata } = data;
    const { datasetName } = metadata;
    const { connectionString, maxClusteredZoomLevel, minClusteredZoomLevel, maxZoomLevel, minZoomLevel } = zoomLevelSettings;
    const dialogRef = this.dialog.open(DeleteCacheComponent, {
      data: {
        connectionString,
        maxClusteredZoomLevel,
        minClusteredZoomLevel,
        maxZoomLevel,
        minZoomLevel,
        dataPackageId,
        datasetName
      }
    });
  }

  onDeleteSelectedLayersCache(referenceData: IReferenceData[]) {
    if (!(referenceData && referenceData.length)) return;
    const layers = referenceData.filter(e=>!!e.checked).map(data => {
      const { dataPackageId, zoomLevelSettings } = data;
      if (!(zoomLevelSettings && dataPackageId)) return;

      const { connectionString, maxClusteredZoomLevel, minClusteredZoomLevel, maxZoomLevel, minZoomLevel } = zoomLevelSettings;
      return {
        connectionString,
        maxClusteredZoomLevel,
        minClusteredZoomLevel,
        maxZoomLevel,
        minZoomLevel,
        dataPackageId,
      }
    })

    const dialogRef = this.dialog.open(DeleteCacheLayersComponent, {
      data: { layers }
    });
  }

  onOpenDependencies(data: IReferenceData) {
    if (!data) return;
    if (!this.tenantOptions || !this.tenantOptions.length) {
      this.actionMessageService.sendWarning("Please wait for getting tenant data completed.")
      return
    }
    this.isLoadingGetReferencedInsightViews$.next(true);
    this.getReferencedInsightViews(data.dataPackageId).subscribe(e => {
      this.isLoadingGetReferencedInsightViews$.next(false);
      const insightView = this.decorateInsightViewData(e.referencedInsightViews);
      const dialogRef = this.dialog.open(DependenciesComponent, {
        data: {
          type: 'insightView',
          insightView
        },
        minWidth: '600px'
      });
    }, err => {
      this.isLoadingGetReferencedInsightViews$.next(false);
    });
  }

  private getReferencedInsightViews(dataPackageId: string) {
    return this.referenceDataService.getReferencedInsightViews(dataPackageId);
  }

  private decorateInsightViewData(referencedInsightViews: {
    [tenantId: string]: {
      tenantInsightViews: string[];
      userInsightViews: {
        [userName: string]: string[]
      }
    }
  }): Observable<IDependenciesViewData[]> {
    return Observable.create((observer: Observer<IDependenciesViewData[]>) => {
      if (!referencedInsightViews) return null;
      const viewDatas: IDependenciesViewData[] = [];
      Object.keys(referencedInsightViews).forEach(tenantId => {
        const tenant = this.tenantOptions.find(e => e.id === tenantId);
        if (tenant) {
          const viewData: IDependenciesViewData = {
            tenantName: tenant.name,
            tenantViews: [],
            userViews: [],
            rowSpan: 1
          }
          referencedInsightViews[tenantId].tenantInsightViews.forEach(e => {
            viewData.tenantViews.push(e);
          })
          const userInsightViews = referencedInsightViews[tenantId].userInsightViews;
          if (Object.keys(userInsightViews).length) {
            viewData.rowSpan = 0;
          }
          Object.keys(userInsightViews).forEach(userName => {
            viewData.userViews.push({
              userName: userName,
              viewNames: userInsightViews[userName],
              rowSpan: userInsightViews[userName].length
            });
            viewData.rowSpan += userInsightViews[userName].length;
          })
          viewDatas.push({ ...viewData });
        }
      })
      observer.next([...viewDatas]);
      observer.complete();
    })
  }

  bindingHeight() {
    setTimeout(() => {
      if (!this.headerWrapper) return;
      if (this.headerHeight === this.headerWrapper.nativeElement.offsetHeight) return;
      this.headerHeight = this.headerWrapper.nativeElement.offsetHeight;
      this.cd.detectChanges();
    }, 0);
  }
}
