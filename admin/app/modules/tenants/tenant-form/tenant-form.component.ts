import { ChangeDetectionStrategy, Component, Inject, Input, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TenantService } from '../tenant.service';
import { ReplaySubject, Observable } from 'rxjs';
import { ActionMessageService } from 'src/admin/app/core/services/action-message.service';
import { IAppState } from 'src/admin/app/store/state/app.state';
import { Store, select } from '@ngrx/store';
import { Unsubscribable } from 'src/periscope-lib/src/lib/commons/decorators/unsubscribable.decorator';
import { decorateError } from 'src/admin/app/shared/models/error';
import { ITenant } from 'src/admin/app/shared/models/tenant';
import { TENANT_STATUS, ITenantStatus } from '../../../shared/models/tenantStatus';
import { untilDestroyed } from 'src/periscope-lib/src/lib/commons/rx-operators/until-destroyed';
import { MasterSelector } from 'src/admin/app/store/selectors';
import * as moment from 'moment';

@Component({
    selector: 'go-tenant-form',
    templateUrl: 'tenant-form.component.html',
    styleUrls: ['tenant-form.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Unsubscribable()
export class TenantFormComponent {
    form: FormGroup;
    loading$ = new ReplaySubject<boolean>(1);
    tenant_status = TENANT_STATUS;
    tenantStatuses = new Observable<ITenantStatus[]>();
    constructor(private fb: FormBuilder,
        private tenantService: TenantService,
        private cd: ChangeDetectorRef,
        private actionMessageService: ActionMessageService,
        public dialogRef: MatDialogRef<TenantFormComponent>,
        //@Inject(MAT_DIALOG_DATA) public data: any) {
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _store: Store<IAppState>) {
            this.form = this.fb.group({
                id: [null, Validators.required],
                legal_entity: [null],
                account_manager: [null],
                tenant_status: [null],
                notes: [null],
                tenantLicenceExpires: [null]
            });
        this.tenantStatuses = this._store.pipe(
            untilDestroyed(this),
            select(MasterSelector.selectTenantStatuses)
        );
    }

    ngOnInit() {
        const { tenantId, tenant } = this.data
        if(!tenantId){
            this.onCancel();
            return;
        }
        this.createForm(tenantId, tenant);
    }

    createForm(tenantId: string, tenant?: ITenant) {
        if (tenant) {
          this.form.patchValue({
            id: tenantId,
            legal_entity: tenant.legal_entity,
            account_manager: tenant.account_manager,
            tenant_status: tenant.tenant_status,
            notes: tenant.notes,
            tenantLicenceExpires: tenant.tenantLicenceExpires
          })
        }
        this.cd.detectChanges();
    }

    onUpdate() {
        this.loading$.next(true);
        const { tenantLicenceExpires } = this.form.getRawValue();
      this.tenantService.updateTenant({
        ...this.form.getRawValue(),
        tenantLicenceExpires: tenantLicenceExpires ? moment(tenantLicenceExpires).format('YYYY-MM-DD') : null
      }
      ).subscribe(data => {
        this.actionMessageService.sendSuccess("Update tenant successful");
        this.loading$.next(false);
        this.onClose(data);
      }, err => {
        this.actionMessageService.sendError(decorateError(err).error.message);
        this.loading$.next(false);
      });
    }

    onCancel() {
        this.dialogRef.close();
    }

    onClose(data: any){
        this.dialogRef.close(data);
    }
}
