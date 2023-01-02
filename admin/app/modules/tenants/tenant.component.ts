import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { TenantFormComponent } from './tenant-form/tenant-form.component';
import { FormControl } from '@angular/forms';
import { TenantService } from './tenant.service';
import { GoTableColumn } from 'src/periscope-lib/src/lib/table/table.model';
import { Unsubscribable } from 'src/periscope-lib/src/lib/commons/decorators/unsubscribable.decorator';
import { ReplaySubject, Observable, of } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { IAppState } from '../../store/state/app.state';
import { untilDestroyed } from 'src/periscope-lib/src/lib/commons/rx-operators/until-destroyed';
import { MasterSelector } from '../../store/selectors';
import { ITenant } from '../../shared/models/tenant';
import { startWith, map, tap } from 'rxjs/operators';
import { ActionMessageService } from '../../core/services/action-message.service';
import { Router } from '@angular/router';
import { debug } from 'loglevel';
import { PAGE_SIZE } from '../../shared/models/global';
import { MasterDataAction } from '../../store/actions';
import * as moment from 'moment';
import { ELicenceExpiresStatus } from '@admin-shared/enums';

@Component({
  selector: 'go-tenant',
  templateUrl: 'tenant.component.html',
  styleUrls: ['tenant.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
@Unsubscribable()
export class TenantComponent {
  public pageSize = PAGE_SIZE;
  public datas$ = new ReplaySubject<any[]>(1);
  public loading$ = new ReplaySubject<boolean>(1);
  public searchControl = new FormControl();
  public datas: ITenant[] = [];
  public tenants: ITenant[] = [];
  public options: ITenant[] = [];
  public rowIndex: any;
  public headers: GoTableColumn[] = [
    { name: 'Internal Name', trackBy: 'name', class: 'w-20', sort: 'ASC' },
    { name: 'Legal Entity', trackBy: 'legal_entity', class: 'w-20' },
    { name: 'Functionality User Groups', trackBy: '_userAllocations', class: 'w-15' },
    { name: 'URL', trackBy: 'url', class: 'w-30' },
    { name: 'Account Manager', trackBy: 'account_manager', class: 'w-15' },
    { name: 'Licence Expires', trackBy: 'tenantLicenceExpires', class: 'w-15', isDate: true, dateFormat: 'ISO' },
    { name: 'Status', trackBy: 'tenant_status', class: 'w-15' },
    { name: 'Notes', trackBy: 'notes', class: 'w-20 pre-wrap' },
    { name: '', trackBy: '', class: 'action-column' },
  ];
  public ELicenceExpiresStatus = ELicenceExpiresStatus;
  constructor(
    public dialog: MatDialog,
    private _store: Store<IAppState>,
    private actionMessageService: ActionMessageService,
    private router: Router
  ) {
    this.loading$.next(true);
    this._store.pipe(
      untilDestroyed(this),
      select(MasterSelector.selectTenants),
      tap(e => this.tenants = [...e]),
      map(e => e.map(_e => {
        const _userAllocations = _e['userAllocation'] ? _e['userAllocation'].split(', ').map(e=>{
          const _numberUserTexts = e.split(':');
          return {
            text: _numberUserTexts[0],
            value: _numberUserTexts[1]
          }
        }) : []
        const tenant = {
          ..._e,
          _userAllocations,
        }
        return tenant;
      }))
    ).subscribe(e => {
      this.datas = [...e];
      this.onFilterTenants(this.searchControl.value);
      if (this.datas.length > 0) {
        this.loading$.next(false);
      }
    });
    this.searchControl.valueChanges
      .subscribe((value: string) => {
        this.onFilterTenants(this.searchControl.value);
      })
  }
  public trackByIndex(index: number, _: any): number {
    return index;
  }
  public onOptionSelected(value: MatAutocompleteSelectedEvent): void {
    const filterValue = value.option.value.id.toLowerCase();
    this.datas$.next([this.datas.find(e => e.id == filterValue)])
  }

  public onFilterTenants(value: string = '') {
    const searchstring = value ? value.toLowerCase() : '';
    this.datas$.next(searchstring ? [...this.datas.filter(e => e.name.toLowerCase().includes(searchstring))] : [...this.datas]);
  }

  public openDialog(tenantId?: string): void {
    const tenant = this.datas.find(e => e.id === tenantId);
    if (!tenant) return;
    const dialogRef = this.dialog.open(TenantFormComponent, {
      data: {
        tenantId: tenant.id,
        tenant: tenant,
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        const { id } = data;
        const index = this.tenants.findIndex(e => e.id == id);

        if (index != -1) {
          const _data: ITenant = {
            ...this.tenants[index],
            ...data
          }
          this.tenants.splice(index, 1, _data);
          this.loading$.next(true);
          this._store.dispatch(MasterDataAction.getTenantsSuccess({ payload: [...this.tenants] }));
        }
      }
      debug('grid menu closed');
    });
  }

  public openRole(): void {
    this.actionMessageService.sendInfo('not implemented');
  }

  public openUser(): void {
    this.router.navigate([`/users/${this.rowIndex}`]);
  }

  public openState(): void {
    this.actionMessageService.sendInfo('not implemented');
  }

  public noop(): void {
    this.actionMessageService.sendInfo('not implemented');
  }
}
