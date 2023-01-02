import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation, ViewChild } from '@angular/core';
import { IAppState } from '../../store/state/app.state';
import { Store, select } from '@ngrx/store';
import { ITenant } from '../../shared/models/tenant';
import { MasterSelector, ConfigSelector } from '../../store/selectors';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from '../user-handler/user.interface';
import { MasterDataAction, ConfigAction } from '../../store/actions';
import * as PermissionSelectors from './selectors/permission.selectors';
import {permissionActions} from './actions/permission.actions';
import * as fromPermission from './reducers/permission.reducer';
import { IPermissionsGridData } from './interfaces';
import { ILayer } from '../../shared/models/layer';
import { Page } from '../../shared/models/common-table';
import { takeUntil, take, debounceTime, filter, tap, first, map } from 'rxjs/operators';
import { Subject, ReplaySubject, BehaviorSubject, combineLatest, merge, Subscription, Observable } from 'rxjs';
import { IClaim } from '../../shared/models/permisions';
import { PermissionsService } from './services/permissions.service';
import { IDropdownItem } from '../../shared/components/periscope-dropdown/periscope-dropdown';
import { ActionMessageService } from '../../core/services/action-message.service';
import { decorateError } from '../../shared/models/error';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Unsubscribable } from 'src/periscope-lib/src/lib/commons/decorators/unsubscribable.decorator';
import { untilDestroyed } from 'src/periscope-lib/src/lib/commons/rx-operators/until-destroyed';
import { PAGE_SIZE } from '../../shared/models/global';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { SaveAsTemplateDialogComponent } from './components/save-as-template-dialog/save-as-template-dialog.component';
import { ConfirmDialogModel, ConfirmDialogComponent } from '@admin-shared/components/confirm-dialog/confirm-dialog.component';
import { IPermissionTemplate } from '../../store/state/master-data.state';
import { AccountService } from '@admin-core/services/account.service';
import { IAccount } from '@admin-shared/models/account';
import { TabViewComponent } from '@periscope-lib/tab-view/tab-view.component';
import { AdministrativeClaimsComponent } from './components/administrative-claims/administrative-claims.component';
import { MasterDataStoreService } from '@admin-core/services';
import { PermissionsStoreService } from './services'
import { EditTemplateDialogComponent } from './components';
@Component({
  selector: 'go-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
@Unsubscribable()
export class PermissionsComponent implements OnInit {
  @ViewChild('tabView') tabView: TabViewComponent;
  @ViewChild('administrativeTemplate') administrativeTemplate: AdministrativeClaimsComponent;
  public pageSize = PAGE_SIZE;
  claims: IClaim[];
  tenants: ITenant[];
  tenantOptions: IDropdownItem[];
  tenantLoading: boolean;

  users: User[];
  userOptions: IDropdownItem[];
  userLoading: boolean;

  layers: ILayer[];
  layerOptions: IDropdownItem[];
  layerLoading: boolean;
  layerGroupIndex: { [layerId: string]: string } = {};

  permissionData: IPermissionsGridData[] = [];
  permissionData_notfilter: IPermissionsGridData[] = [];
  public datas$ = new ReplaySubject<IPermissionsGridData[]>(1);
  public claims$ = new ReplaySubject<IClaim[]>(1);
  public account$: Observable<IAccount>;
  form: FormGroup;
  formDataPermissions: FormGroup;
  formAdministrativeClaims: FormGroup;
  page = new Page();
  submitting = new ReplaySubject<boolean>(1);
  isSuperUser: boolean = false;

  templates: IPermissionTemplate[];
  templateOptions: IDropdownItem[];
  templatesLoading: boolean;
  allClaims: { [claimId: string]: { checked?: number, disabled?: boolean } } = {
  }
  claimsSubmitting$ = new ReplaySubject<boolean>(1);
  activeTab = 0;
  isEditingTemplate = false;
  updateAllClaimsChecked(claim: IClaim) {
    const permissionFiltered = (this.permissionData || []).filter(e => e.enabled && e.enabled[claim.id] != undefined);
    const checkedLength = permissionFiltered.filter(e => e.claimsData && e.claimsData[claim.id] == 1).length;
    const uncheckedLength = permissionFiltered.filter(e => e.claimsData && e.claimsData[claim.id] == 0).length;
    if (!this.allClaims[claim.id]) {
      this.allClaims[claim.id] = {};
    }
    this.allClaims[claim.id].checked = checkedLength == permissionFiltered.length ? 1 :
      uncheckedLength == permissionFiltered.length ? 0 : 2;
  }
  updateAllClaimsDisabled(claim: IClaim) {
    if (!this.allClaims[claim.id]) {
      this.allClaims[claim.id] = {};
    }
    this.allClaims[claim.id].disabled = !(this.permissionData && this.permissionData.filter(e => e.enabled && e.enabled[claim.id]).length > 0)
  }
  private unsubscribe$: Subject<void> = new Subject<void>();
  private templatesSubscription: Subscription;
  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private permissionsService: PermissionsService,
    private actionMessageService: ActionMessageService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private accountService: AccountService,
    private _masterDataStoreService: MasterDataStoreService,
    private _permissionsStoreService: PermissionsStoreService
  ) {
    this.account$ = this.accountService.currentAccount$;
  }

  ngOnInit() {
    this.createForm();
    this.account$.pipe(first(), takeUntil(this.unsubscribe$)).subscribe(account => {
      const { isSuperUser, isTenantAdmin, tenantId } = account;
      const _tenantId = isSuperUser ? this.route.snapshot.queryParamMap.get('tenantId') : tenantId;
      this.isSuperUser = this.accountService.isSuperUser();
      const userName = this.route.snapshot.queryParamMap.get('userName');
      if (_tenantId && userName) {
        this._permissionsStoreService.setFilterPermissions({
          selectedTenant: _tenantId,
          selectedUser: userName,
          filterLayers: []
        })

      } else if (!isSuperUser) {
        this._permissionsStoreService.setFilterPermissions({
          selectedTenant: tenantId
        })
      }
      this.router.navigate([`permissions`]);
    })


    this.tenantLoading = true;
    this._masterDataStoreService.tenants$.pipe(takeUntil(this.unsubscribe$)).subscribe(tenants => {
      if (!tenants) return;
      this.tenantLoading = tenants.length > 0 ? false : true;
      this.tenants = [...tenants];
      this.tenantOptions = [...tenants.map(e => { return { id: e.id, name: e.name } })];
      this.cd.markForCheck();
    });
    this._masterDataStoreService.claims$.pipe(takeUntil(this.unsubscribe$)).subscribe(claims => {
      if (!claims) return;
      this.claims = [...claims];
      this.claims$.next([...claims]);
      this.cd.markForCheck();
    });
    this._permissionsStoreService.usersBaseOnTenant$.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      if (!data) return;
      this.userLoading = data.isLoading;
      const userData = data.users || [];
      this.users = [...userData];
      this.userOptions = [...userData.map(e => { return { id: e.username, name: e.username } })];
      const { selectedUser } = this.form.getRawValue();
      if (data.users && this.form) {
        if (selectedUser && !this.userOptions.find(e => e.id == selectedUser)) {
          const _selectedUser = this.userOptions.length === 1 ? this.userOptions[0].name : null;
          this.form.patchValue({
            selectedUser: _selectedUser
          })
        } else {
          this.form.patchValue({
            selectedUser: this.form.get('selectedUser').value
          })
        }
      }
      this.cd.markForCheck();
    });

    this._permissionsStoreService.layersBaseOnTenant$.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      if (!data) return;
      this.layerLoading = data.isLoading;
      const { tenantId, layers, userName } = data;
      this.layers = [...layers];
      this.layerOptions = [...layers.map(e => { return { id: e.id, name: e.name, groupName: e.groupName } })];
      if (userName) {
        const user = this.users.find(e => e.username == userName);
        this.setTemplate(user.dataTemplate);
      }
      if (this.form && data.isLoading == false) {
        const previousValue: string[] = this.formDataPermissions.get('filterLayers').value || [];
        const expectedValue: string[] = this.layers.map(e => e.id).filter(e => previousValue.length > 0 ? previousValue.find(_e => _e == e) : true)
        this.formDataPermissions.patchValue({
          filterLayers: expectedValue.length > 0 ? expectedValue : this.layers.map(e => e.id)
        })
      }
      this.cd.markForCheck();
    });
    this._permissionsStoreService.filterForm$.pipe(takeUntil(this.unsubscribe$), take(1)).subscribe(data => {
      if (!data) return;
      this.createForm(data);
    });
  }

  ngOnDestroy(): void {
    if (this.form) {
      this._permissionsStoreService.setFilterPermissions(this.form.getRawValue());
    }
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._permissionsStoreService.resetLayersBaseOnTenant();
    this._permissionsStoreService.resetUserBaseOnTenant();
  }

  onTabChange(event) {
    const { index } = event;
    this.activeTab = index;
    this.cd.detectChanges();
  }

  createForm(data?) {
    if (!this.form) {
      this.form = this.fb.group({
        selectedTenant: [null, Validators.required],
        selectedUser: [null, Validators.required],
      })
      this.formDataPermissions = this.fb.group({
        filterLayers: [],
        selectedTemplate: [null]
      })
      this.form.statusChanges.pipe(debounceTime(200), takeUntil(this.unsubscribe$)).subscribe(() => {
        if (this.tabView)
          this.tabView.detectChange();
      })
      this.form.get('selectedTenant').valueChanges.pipe(takeUntil(this.unsubscribe$), debounceTime(50)).subscribe(value => {
        if (!value) return
        this._permissionsStoreService.resetLayersBaseOnTenant();
        this._permissionsStoreService.getUserBaseOnTenant(value);
        if (this.templatesSubscription) {
          this.templatesSubscription.unsubscribe();
        }
        this.templatesSubscription = this._masterDataStoreService.getTemplates(value).pipe(
          untilDestroyed(this),
          tap(e => !e ? this._masterDataStoreService.loadPermissionTemplates(value) : null),
          filter(e => !!e)
        ).subscribe(templates => {
          this.templates = templates ? [...templates] : [];
          this.templateOptions = [...this.templates.map(e => { return { id: e.templateId, name: e.templateName } })];
          const { selectedTemplate } = this.formDataPermissions.getRawValue();
          this.setTemplate(selectedTemplate);
        });
      })
      this.form.get('selectedUser').valueChanges.pipe(takeUntil(this.unsubscribe$), debounceTime(50)).subscribe(value => {
        if (!value) return
        if (this.userOptions && !this.userOptions.find(e => e.id == value)) return;
        if (this.form.get('selectedTenant').value) {
          this._permissionsStoreService.getLayersBaseOnTenant(this.form.get('selectedTenant').value, value)
        }
      })
      this.formDataPermissions.get('filterLayers').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((filterValues: string[]) => {
        if (!filterValues) {
          filterValues = [];
        }
        const groupFilter = filterValues.map(e => this.layerGroupIndex[e]).filter(e => e);
        const _permissionData = this.permissionData_notfilter.filter(e => {
          return !!groupFilter.find(v => v == e.layerId)
        }).map(e => ({ ...e, children: e.children.filter(x => !!filterValues.find(y => y == x.layerId)) }));
        this.recalculateData(_permissionData);
      })
      this.formDataPermissions.get('selectedTemplate').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
        this.updateClaimsTable(value, this.isEditingTemplate);
      })
    }
    if (data) {
      this.form.patchValue(data);
    }
    this.cd.detectChanges();
  }

  onSave() {
    try {
      this.submitting.next(true);
      const tenantId = this.form.get('selectedTenant').value;
      const userName = this.form.get('selectedUser').value;
      const dataTemplate = this.formDataPermissions.get('selectedTemplate').value;
      const layers = this.permissionData_notfilter.map(e => e.children).reduce((a, b) => [...a, ...b]).map(e => {
        const claims = {};
        Object.keys(e.claimsData).forEach(key => {
          claims[key] = !!e.claimsData[key];
        })
        return {
          layerId: e.layerId,
          claims
        }
      })
      this.permissionsService.updatePermission({ tenantId, layers, userName, dataTemplate }).pipe(takeUntil(this.unsubscribe$))
        .subscribe(e => {
          this.submitting.next(false);
          this.actionMessageService.sendSuccess('Permissions successfull updated');
          this._permissionsStoreService.getUserBaseOnTenant(tenantId);
        }, err => {
          this.submitting.next(false);
          this.actionMessageService.sendError(decorateError(err).error.message)
        });
    } catch (error) {
      this.submitting.next(false);
      this.actionMessageService.sendError(decorateError(error).error.message)
    }
  }

  onSaveClaims() {
    const adminClaims = this.administrativeTemplate.getClaimsValue();
    if (!adminClaims) {
      return;
    }
    const { selectedTenant, selectedUser } = this.form.getRawValue();
    this.claimsSubmitting$.next(true);
    this.permissionsService.updateAdministrativeClaims(selectedTenant, selectedUser, adminClaims).subscribe(() => {
      this.claimsSubmitting$.next(false);
      this.actionMessageService.sendSuccess("Administrative claims updated");
    }, err => {
      this.claimsSubmitting$.next(false);
      this.actionMessageService.sendError(decorateError(err).error.message);
    })
  }

  onSaveAsTemplate() {
    const tenantId = this.form.get('selectedTenant').value;
    const layers = this.permissionData_notfilter.map(e => e.children).reduce((a, b) => [...a, ...b]).map(e => {
      const claims = {};
      Object.keys(e.claimsData).forEach(key => {
        claims[key] = !!e.claimsData[key];
      })
      return {
        layerId: e.layerId,
        claims
      }
    })
    this.openDialog(tenantId, layers);
  }

  deleteTemplate(tenantId: string, templateId: string) {
    this.templatesLoading = true;
    this.permissionsService.deletePermissionTemplate(tenantId, templateId).subscribe(() => {
      this.actionMessageService.sendSuccess("Delete template Successful");
      this.templatesLoading = false;
      this._masterDataStoreService.loadPermissionTemplates(tenantId);
      this.cd.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.templatesLoading = false;
      this.cd.detectChanges();
    })
  }

  recalculateData(_permissionData: IPermissionsGridData[]) {
    if (!_permissionData) return;
    this.permissionData = [..._permissionData.map(e => ({ ...e, collapsed: e.children.length > 1 }))];
    this.datas$.next([...this.permissionData]);
    if (this.claims) {
      this.claims.forEach(claim => {
        this.updateAllClaimsChecked(claim);
        this.updateAllClaimsDisabled(claim);
      })
    }
    this.cd.markForCheck();
  }

  onSelectColumn(claim: IClaim, _value) {
    const value = _value ? 1 : 0;
    // let currentValue = this.getClaimChecked(claim);
    this.permissionData = [...this.permissionData.map((e) => {
      if (!(e.enabled && e.enabled[claim.id])) {
        return e
      }
      this.onSelectClaim(e, claim, value);
      return {
        ...e
      }
    })]
  }

  onSelectClaim(row: IPermissionsGridData, claim: IClaim, _value) {
    const value = _value ? 1 : 0;
    if (row.programaticName) { // child
      const key = row.programaticName + row.groupName;
      const group = this.permissionData_notfilter.find(e => e.layerId == key);
      const child = group.children.find(e => e.layerId == row.layerId);
      if (child) {
        child.claimsData[claim.id] = value
        group.claimsData[claim.id] = group.children.map(e => e.claimsData[claim.id]).reduce((a, b) => a == b ? a : 2);
      }
    } else { // group
      const group = this.permissionData_notfilter.find(e => e.layerId == row.layerId);
      group.claimsData[claim.id] = value
      group.children.forEach(e => e.claimsData[claim.id] = value);
    }
    this.updateAllClaimsChecked(claim);
  }

  onToggleGroup(row: IPermissionsGridData) {
    if (!row) return;
    row.collapsed = !row.collapsed;
    this.cd.detectChanges();
  }

  convertILayerToIPermissionsGridData(datas_: ILayer[], _enabled = false): IPermissionsGridData[] {
    let datas: IPermissionsGridData[] = [];
    this.layerGroupIndex = {}
    const groupProgramaticNames = new Map<string, IPermissionsGridData[]>();
    datas_.forEach(layer => {
      let enabled = {};
      let claimsData = {};
      layer.availableClaims.forEach(claim => {
        enabled[claim.id] = _enabled;
        claimsData[claim.id] = claim.value ? 1 : 0;
      })
      const key = layer.programaticName + layer.groupName;
      this.layerGroupIndex[layer.id] = key;
      const child: IPermissionsGridData = {
        layerName: layer.name,
        layerId: layer.id,
        enabled: enabled,
        claimsData: claimsData,
        groupId: null,
        groupName: layer.groupName,
        programaticName: layer.programaticName
      }
      if (groupProgramaticNames.has(key)) {
        const value = groupProgramaticNames.get(key);
        groupProgramaticNames.set(key, [...value, child]);
      } else {
        groupProgramaticNames.set(key, [child]);
      }
    })

    groupProgramaticNames.forEach((permissionData, key) => {
      const claimsData = {};
      const enabled = {}
      const enabledChild = permissionData.length < 2 && _enabled;
      permissionData.forEach(e => {
        Object.keys(e.claimsData).forEach(claimId => {
          if (claimsData[claimId] == undefined) {
            claimsData[claimId] = e.claimsData[claimId];
          } else {
            claimsData[claimId] = claimsData[claimId] == e.claimsData[claimId] ? claimsData[claimId] : 2
          }
        })
        Object.keys(e.enabled).forEach(claim => {
          enabled[claim] = !!enabled[claim] || e.enabled[claim];
          e.enabled[claim] = enabledChild;
        })
      })
      const groupPermission: IPermissionsGridData = {
        layerName: permissionData[0].programaticName,
        layerId: key,
        enabled,
        claimsData,
        groupId: null,
        groupName: permissionData[0].groupName,
        children: permissionData,
        programaticName: null,
        collapsed: false
      }
      datas = [...datas, groupPermission];
    })

    return datas;
  }

  unSelectedTemplate() {
    this.formDataPermissions.get('selectedTemplate').reset();
    this.permissionData_notfilter = [...this.convertILayerToIPermissionsGridData(this.layers, true)];
    this.formDataPermissions.get('filterLayers').setValue(this.layers.map(e => e.id))
  }

  public openDialog(tenantId: string, layers: any[]): void {
    const dialogRef = this.dialog.open(SaveAsTemplateDialogComponent, {
      data: {
        tenantId,
        layers
      },
      width: '500px',
    });
    dialogRef.afterClosed().pipe(first()).subscribe((data) => {
      if (data) {
        this._masterDataStoreService.loadPermissionTemplates(tenantId)
      }
    });
  }

  confirmDialogDelete(tenantId: string, template: IPermissionTemplate): void {
    const message = `Are you sure you want to delete ${template.templateName}?`;
    const dialogData = new ConfirmDialogModel("Confirm Action", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.deleteTemplate(tenantId, template.templateId)
      }
    });
  }

  onActionOptionTemplateClicked(item: IDropdownItem) {
    const { id, name } = item;
    const template = this.templates.find(e => e.templateId === id);
    if (!template) return;
    const tenantId = this.form.get('selectedTenant').value;
    this.confirmDialogDelete(tenantId, template)
  }

  setTemplate(value) {
    if (value && this.templates) {
      const template = this.templates.find(e => e.templateId == value);
      if (template) {
        this.formDataPermissions.get('selectedTemplate').setValue(template.templateId);
        this.cd.detectChanges();
        return
      }
    }
    this.formDataPermissions.get('selectedTemplate').setValue(null);
    this.cd.detectChanges();
  }

  updateClaimsTable(templateId = null, isEditingTemplate = false) {
    if (!templateId) {
      this.permissionData_notfilter = [...this.convertILayerToIPermissionsGridData(this.layers, true)];
      this.formDataPermissions.get('filterLayers').updateValueAndValidity();
      return;
    }
    const template = this.templates.find(e => e.templateId == templateId);
    if (!template) {
      return;
    }
    if(isEditingTemplate){
      const layers = this.layers.map(e => {
        const _layer = (template.layers || []).find(layer => layer.id === e.id);
        const availableClaims = e.availableClaims.map(e=>{
          if (!_layer) {
            return {
              ...e,
              value: false
            }
          }
          const claim = _layer.availableClaims.find(_e => _e.id === e.id);
          return {
            ...e,
            value: claim ? claim.value : false
          }
        });
        return {
          ...e,
          availableClaims
        }
      })
      this.permissionData_notfilter = [...this.convertILayerToIPermissionsGridData(layers, isEditingTemplate)];
      this.formDataPermissions.get('filterLayers').updateValueAndValidity();
      return;
    }
    const layers = this.layers.map(e => {
      const _layer = (template.layers || []).find(layer => layer.id === e.id);
      const availableClaims = _layer ? _layer.availableClaims : e.availableClaims;
      return {
        ...e,
        availableClaims
      }
    })
    this.permissionData_notfilter = [...this.convertILayerToIPermissionsGridData(layers, isEditingTemplate)];
    this.formDataPermissions.get('filterLayers').updateValueAndValidity();
  }

  onEditingTemplate() {
    this.isEditingTemplate = true;
    const { selectedTemplate } = this.formDataPermissions.getRawValue();
    this.formDataPermissions.get('selectedTemplate').disable({emitEvent: false});
    this.form.disable({emitEvent: false});
    this.updateClaimsTable(selectedTemplate, this.isEditingTemplate);
    this.cd.detectChanges();
  }

  onUpdateTemplate() {
    const { selectedTenant } = this.form.getRawValue();
    const { selectedTemplate } = this.formDataPermissions.getRawValue();
    const layers = this.permissionData_notfilter.map(e => e.children).reduce((a, b) => [...a, ...b]).map(e => {
      const claims = {};
      Object.keys(e.claimsData).forEach(key => {
        claims[key] = !!e.claimsData[key];
      })
      return {
        layerId: e.layerId,
        claims
      }
    })
    this._permissionsStoreService.patchTemplateState(selectedTenant, selectedTemplate, layers);
    const dialogRef = this.dialog.open(EditTemplateDialogComponent, {
      width: '500px',
      disableClose: true,
      id: 'EditTemplateDialogComponent'
    });
    dialogRef.afterClosed().pipe(first()).subscribe((data) => {
      if (data && data.reload) {
        this._permissionsStoreService.getUserBaseOnTenant(selectedTenant);
        this.onCancelUpdateTemplate();
      }
    });
  }

  onCancelUpdateTemplate() {
    this.isEditingTemplate = false;
    const { selectedTemplate } = this.formDataPermissions.getRawValue();
    this.formDataPermissions.get('selectedTemplate').enable({emitEvent: false});
    this.form.enable({emitEvent: false});
    this.updateClaimsTable(selectedTemplate, this.isEditingTemplate);
    this.cd.detectChanges();
  }
}
