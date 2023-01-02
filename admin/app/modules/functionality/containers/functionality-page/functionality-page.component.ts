import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { FunctionalityFilterState, FunctionalityResultState, IFunctionalityClaim, IFunctionality } from '@admin-modules/functionality/interfaces';
import { FunctionalityStoreService } from '@admin-modules/functionality/services';
import { map } from 'rxjs/operators';
import { MasterDataStoreService } from '@admin-core/services';
import { IDropdownItem } from '@admin-shared/components/periscope-dropdown/periscope-dropdown';

@Component({
  selector: 'ps-functionality-page',
  templateUrl: './functionality-page.component.html',
  styleUrls: ['./functionality-page.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FunctionalityPageComponent implements OnInit {

  public filter$: Observable<FunctionalityFilterState>;
  public result$: Observable<FunctionalityResultState>;
  public claims$: Observable<IFunctionalityClaim[]>;
  public data$: Observable<IFunctionality[]>;
  public loading$: Observable<boolean>;
  public tenantOptions$: Observable<IDropdownItem[]>
  public tenantLoading$: Observable<boolean>;
  public downloading$: Observable<boolean>;
  constructor(
    private _functionalityStoreService: FunctionalityStoreService,
    private _masterDataStoreService: MasterDataStoreService,
  ) { }

  ngOnInit(): void {
    this.filter$ = this._functionalityStoreService.filter$;
    this.loading$ = this._functionalityStoreService.loading$;
    this.downloading$ = this._functionalityStoreService.downloading$;
    this.data$ = this._functionalityStoreService.result$.pipe(map(e=>e?.data));
    this.claims$ = this._functionalityStoreService.result$.pipe(map(e=>e?.claims));
    this.tenantOptions$ = this._masterDataStoreService.tenants$.pipe(map(e=>e.map(item=>({id: item.id, name: item.name} as IDropdownItem))));
    this.tenantLoading$ = this.tenantOptions$.pipe(map(e=>!(e && e.length)));
  }

  onChangeFilter(data: FunctionalityFilterState){
    const { tenantId } = data;
    this._functionalityStoreService.getFunctionality(tenantId);
  }

  onDownload(){
    this._functionalityStoreService.downloadFunctionality();
  }
}
