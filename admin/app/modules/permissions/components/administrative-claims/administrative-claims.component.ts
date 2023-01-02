import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, OnChanges, SimpleChanges, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { Unsubscribable } from '@periscope-lib/commons/decorators/unsubscribable.decorator';
import { untilDestroyed } from '@periscope-lib/commons/rx-operators/until-destroyed';
import { PermissionsService } from '@admin-modules/permissions/services/permissions.service';
import { ActionMessageService } from '@admin-core/services/action-message.service';
import { decorateError } from '@admin-shared/models/error';
import { takeUntil } from 'rxjs/operators';

@Unsubscribable()
@Component({
  selector: 'ps-administrative-claims',
  templateUrl: './administrative-claims.component.html',
  styleUrls: ['./administrative-claims.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AdministrativeClaimsComponent implements OnInit, OnChanges {
  @Input() tenantId: string;
  @Input() userId: string;
  @Input() submitting: boolean = false
  @Input() saved = new EventEmitter<any>()
  ClaimsNames = {
    'isDevMode': 'Dev Mode - Ability to view prototype features',
    'isTenantAdmin': 'Tenant Admin - Partial access to the User Management Site (for Clients to view/manage just their own users)',
    'canCopyToTenant': 'Copy to Tenant - Ability to copy filters/styles to the Tenant Settings area',
    'isSuperUser': 'Super User -  Full access to the User Management Site (Only for Newgrove)'
  }
  form: FormGroup;
  formClaims: FormGroup;
  loading$ = new BehaviorSubject<boolean>(false);
  administrativeClaimsData: any;
  private formUnSubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private permissionsService: PermissionsService,
    private cd: ChangeDetectorRef,
    private actionMessageService: ActionMessageService,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { userId, tenantId } = changes;
    if (userId || tenantId) {
      this.initForm({ tenantId: this.tenantId, userId: this.userId });
    }
  }

  initForm(data?) {
    if (!this.form) {
      this.form = this.fb.group({
        tenantId: [null, Validators.required],
        userId: [null, Validators.required],
      })
      this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((values) => {
        const { tenantId, userId } = values;
        if (tenantId && userId) {
          this.getAdministrativeClaims();
        }
      })
    }
    if (data) {
      this.form.patchValue({ ...data });
    }
  }

  onSave() {
    const adminClaims = this.formClaims.getRawValue();
    this.saved.emit(adminClaims);
  }

  getClaimsValue(){
    return this.formClaims.getRawValue();
  }

  getAdministrativeClaims() {
    const { tenantId, userId } = this.form.getRawValue();
    this.loading$.next(true)
    this.formUnSubscribe$.next();
    this.permissionsService.getAdministrativeClaims(tenantId, userId).subscribe(data => {
      this.administrativeClaimsData = Object.keys(data).map(key => {
        return {
          key,
          name: this.ClaimsNames[key]
        }
      }).sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
      this.formClaims = this.toFormGroup(data);
      this.enableSpecialLogic();
      this.loading$.next(false)
      this.cd.detectChanges();
    }, err => {
      this.loading$.next(false);
      this.actionMessageService.sendError(decorateError(err).error.message)
    })
  }

  toFormGroup(data: { [key: string]: any }) {
    const group: any = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      group[key] = new FormControl(value)
    })
    return new FormGroup(group)
  }

  enableSpecialLogic() {
    if (this.formClaims.get('isSuperUser') && this.formClaims.get('isTenantAdmin')) {
      this.checkDisableTenantAdmin(this.formClaims.get('isSuperUser').value);
      this.formClaims.get('isSuperUser').valueChanges.pipe(takeUntil(this.formUnSubscribe$)).subscribe(value => {
        this.checkDisableTenantAdmin(value);
      })
    }
  }

  checkDisableTenantAdmin(isSuperUserValue){
    if (isSuperUserValue) {
      this.formClaims.get('isTenantAdmin').disable();
      this.formClaims.get('isTenantAdmin').setValue(true);
    } else {
      this.formClaims.get('isTenantAdmin').enable();
    }
  }

}
