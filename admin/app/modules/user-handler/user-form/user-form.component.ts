import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs/internal/observable/of';
import { User } from '../user.interface';
import { MEMBERSHIP_LEVEL, IMembershipLevel } from '../../../shared/models/membershipLevel';
import { UserService } from '../../user-handler/user.service';
import { IAccount } from '../../../shared/models/account';
import { AccountService } from '../../../core/services/account.service';
import { ReplaySubject, Observable } from 'rxjs';
import { ActionMessageService } from 'src/admin/app/core/services/action-message.service';
import { decorateError } from 'src/admin/app/shared/models/error';
import { IAppState } from 'src/admin/app/store/state/app.state';
import { Store, select } from '@ngrx/store';
import { untilDestroyed } from 'src/periscope-lib/src/lib/commons/rx-operators/until-destroyed';
import { MasterSelector } from 'src/admin/app/store/selectors';
import { Unsubscribable } from 'src/periscope-lib/src/lib/commons/decorators/unsubscribable.decorator';
import { tap } from 'rxjs/operators';
import { MasterDataService } from '@admin-core/services/master-data.service';
import { MasterDataAction } from 'src/admin/app/store/actions';

@Component({
    selector: 'go-user-form',
    templateUrl: 'user-form.component.html',
    styleUrls: ['user-form.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Unsubscribable()
export class UserFormComponent implements OnInit {

    form: FormGroup;
    loading$ = new ReplaySubject<boolean>(1);
    membershipLevel = MEMBERSHIP_LEVEL;
    membershipLevels = new Observable<IMembershipLevel[]>();
    account$: Observable<IAccount>
    isSuperUser: boolean = false;
    constructor(private fb: FormBuilder,
        private userService: UserService,
        private cd: ChangeDetectorRef,
        private actionMessageService: ActionMessageService,
        public dialogRef: MatDialogRef<UserFormComponent>,
        private masterDataService: MasterDataService,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _store: Store<IAppState>,
        private accountService: AccountService) {
        this.form = this.fb.group({
            id: null,
            tenantId: [{ value: null, disabled: true }],
            tenantName: [{ value: null, disabled: true }],
            username: [null, Validators.required],
            forename: [null, Validators.required],
            surname: [null, Validators.required],
            // template: ['0'],
            membershipLevel: [null, Validators.required],
            enabled: [false],
            notes: [null]
        });
        this.account$ = this.accountService.account$
    }

  ngOnInit() {
        this.isSuperUser = this.accountService.isSuperUser();
        const { update, tenantId, tenantName, userId } = this.data
        if (update) {
            this.loading$.next(true);
            this.userService.getUser(userId).subscribe(user => {
                this.createForm(tenantId, tenantName, user);
                this.loading$.next(false);
            });
        } else {
            this.createForm(tenantId, tenantName);
        }
        this.membershipLevels = this._store.pipe(
            untilDestroyed(this),
            select(MasterSelector.selectMemberships, { tenantId }),
            tap(e => {
                if (!e) this._store.dispatch(MasterDataAction.getMemberships({ payload: tenantId }));
            })
        );
        // const user$ = this.data.update ? this.userService.readUser(this.data.userId) : of(UserFormComponent.initValues);
        // user$.subscribe(user => this.createForm(user, this.data.update));
    }

    createForm(tenantId: string, tenantName: string, user?: User) {
        if (user) {
            this.form = this.fb.group({
                id: user.id,
                tenantId: [{ value: tenantId, disabled: true }],
                tenantName: [{ value: tenantName, disabled: true }],
                username: [{ value: user.username, disabled: true }, Validators.required],
                forename: [user.forename, Validators.required],
                surname: [user.surname, Validators.required],
                // template: ['0'],
                membershipLevel: [user.membershipLevel, Validators.required],
                enabled: [user.isEnabled],
                notes: [user.notes]
            });
        } else {
            this.form.patchValue({ tenantId, tenantName });
        }
        this.cd.detectChanges();
    }

    onSave() {
        this.loading$.next(true);
        this.userService.createUser(this.form.getRawValue()).subscribe(data => {
            this.actionMessageService.sendSuccess("Create user successful");
            this.loading$.next(false);
            this.onClose(data);
        }, err => {
            this.actionMessageService.sendError(decorateError(err).error.message);
            this.loading$.next(false);
        });
    }

    onDelete() {
    }

    onUpdate() {
        this.loading$.next(true);
        this.userService.updateUser(this.form.getRawValue()).subscribe(data => {
            this.actionMessageService.sendSuccess("Update user successful");
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

    onClose(data: any) {
        this.dialogRef.close(data);
  }

  public sendNewUserEmail() {
    this.loading$.next(true);
    this.userService.sendNewUserEmail(this.form.getRawValue()).subscribe(data => {
      this.actionMessageService.sendSuccess("Email was sent successfully");
      this.loading$.next(false);
      this.onClose(data);
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
    });
  }
}
