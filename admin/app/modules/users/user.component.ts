import { ChangeDetectionStrategy, Component, ViewEncapsulation, ChangeDetectorRef, InjectionToken } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserFormComponent } from '../user-handler/user-form/user-form.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user-handler/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PAGE_SIZE } from '../../shared/models/global';
import { User } from '../user-handler/user.interface';
import { ReplaySubject, Observable, Subscription, merge, forkJoin, BehaviorSubject } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { IAppState } from '../../store/state/app.state';
import { untilDestroyed } from 'src/periscope-lib/src/lib/commons/rx-operators/until-destroyed';
import { Unsubscribable } from 'src/periscope-lib/src/lib/commons/decorators/unsubscribable.decorator';
import { MasterSelector } from '../../store/selectors';
import { map, tap, filter, first } from 'rxjs/operators';
import { GoTableColumn } from 'src/periscope-lib/src/lib/table/table.model';
import { ActionMessageService } from '../../core/services/action-message.service';
import { IDropdownItem } from '../../shared/components/periscope-dropdown/periscope-dropdown';
import { debug } from 'loglevel';
import { decorateError } from '../../shared/models/error';
import { ITenant } from '../../shared/models/tenant';
import { MasterDataAction } from '../../store/actions';
import { UserChangePasswordComponent } from '@admin-modules/user-handler/user-change-password/user-change-password.component';

@Component({
    selector: 'go-user',
    templateUrl: 'user.component.html',
    styleUrls: ['user.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Unsubscribable()
export class UserComponent {
    public pageSize = PAGE_SIZE;
    public loading$ = new ReplaySubject<boolean>(1);
    public tenantLoading$ = new BehaviorSubject<boolean>(true);
    public options$: Observable<IDropdownItem[]>
    public datas$ = new ReplaySubject<any[]>(1);
    public users: User[] = [];
    public searchGroup: FormGroup = new FormGroup({
        tenantId: new FormControl(null, Validators.required),
        search: new FormControl(null),
        showLockedUser: new FormControl(false)
    })
    public headers: GoTableColumn[] = [
        { name: 'Forename', trackBy: 'forename', class: 'w-10' },
        { name: 'Surname', trackBy: 'surname', class: 'w-10' },
        { name: 'Username', trackBy: 'username', class: 'w-20', sort: 'ASC' },
        { name: 'Functionality User Group', trackBy: 'membershipLevel', class: 'w-10' },
        { name: 'Data User Group', trackBy: 'templateName', class: 'w-10' },
        { name: 'Lockout', trackBy: 'isEnabled', class: 'action-column' },
        { name: 'Notes', trackBy: 'notes', class: 'w-20 pre-wrap' },
        { name: 'Last Logon', trackBy: 'last_logon', class: 'w-10', isDate: true, dateFormat: 'dd/MM/yyyy' },
        { name: 'Date Created', trackBy: 'created', class: 'w-10', isDate: true, dateFormat: 'dd/MM/yyyy' },
        { name: '', trackBy: '', class: 'action-column' },
    ];

    userId: number;
    tenants: ITenant[];
    getFormData(field) {
        return this.searchGroup.get(field) ? this.searchGroup.get(field).value : null
    }
    private updateStatusSub: Subscription;
    public isDownload$ = new BehaviorSubject<boolean>(false);
    constructor(public dialog: MatDialog,
        private userService: UserService,
        private route: ActivatedRoute,
        private actionMessageService: ActionMessageService,
        private _store: Store<IAppState>,
        private router: Router,
        private cd: ChangeDetectorRef) {
        this.options$ = this._store.pipe(
            untilDestroyed(this),
            select(MasterSelector.selectTenants),
            map(e => {
                this.tenants = [...e];
                return e.map(_e => {
                    return {
                        id: _e.id,
                        name: _e.name
                    } as IDropdownItem
                })
            }),
            tap(e => {
                this.tenantLoading$.next(e.length == 0);
            })
        );
        this.route.paramMap.subscribe(event => {
            this.searchGroup.get('tenantId').setValue(event.get('tenantId'));
            if (event.get('tenantId')) {
                this.getUsersBaseOnTenant(event.get('tenantId'));
            }
        });
        this.searchGroup.get('tenantId').valueChanges
            .subscribe((value: string) => {
                this.selectedTenant(value)
            })
        this.searchGroup.get('search').valueChanges
            .subscribe((value: string) => {
                this.onFilterUsers(this.searchGroup.get('search').value);
            })
        this.searchGroup.get('showLockedUser').valueChanges.subscribe((value) => {
            this.onFilterUsers(this.searchGroup.get('search').value);
        })

    }

    public getUsersBaseOnTenant(tenantId: string): void {
        this.loading$.next(true);
        const getTemplates$ = this._store.pipe(
            untilDestroyed(this),
            select(MasterSelector.selectTemplates,{ tenantId }),
            tap(e => !e ? this._store.dispatch(MasterDataAction.loadPermissionTemplates({ payload: { tenantId } })) : null),
            filter(e => !!e),
            first()
        );

        forkJoin(
            this.userService.getUserList(tenantId, '', 0, 999),
            getTemplates$,
            this.tenantLoading$.pipe(untilDestroyed(this),filter(e=>!e),first())
        ).subscribe(([response, templates, value]) => {
            this.loading$.next(false);
            this.users = response.data.map(e => {
                const template = templates.find(_e => _e.templateId === e.dataTemplate);
                return {
                    ...e,
                    templateName: template ? template.templateName : ''
                }
            });
            this.onFilterUsers(this.searchGroup.get('search').value);
        });
    }

    public onFilterUsers(value: string = '') {
        const showLockedUser = this.searchGroup.get('showLockedUser').value;
        const searchstring = value ? value.toLowerCase() : '';
        let _data = searchstring ? [...this.users.filter(e => e.username.toLowerCase().includes(searchstring))] : [...this.users];
        _data = !showLockedUser ? _data.filter(e => !e.isEnabled) : _data;
        this.datas$.next(_data);
    }

    public openDialog(userId?: number): void {
        const tenant = this.tenants.find(e => e.id === this.searchGroup.get('tenantId').value);
        const dialogRef = this.dialog.open(UserFormComponent, {
            data: {
                update: userId ? true : false,
                tenantId: tenant.id,
                tenantName: tenant.name,
                userId
            }
        });

        dialogRef.afterClosed().subscribe((data) => {
            if (data) {
                this.getUsersBaseOnTenant(this.searchGroup.get('tenantId').value);
            }
            this.userId = 0;
            debug('grid menu closed');
        });
    }

    openPermissions(userId) {
        try {
            const tenantId = this.searchGroup.get('tenantId').value;
            const userName = this.users.find(e => e.id == userId).username;
            if (tenantId && userName)
                this.router.navigate([`permissions`], { queryParams: { tenantId: tenantId, userName: userName } });
        } catch (error) {
            this.actionMessageService.sendError(decorateError(error).error.message);
        }
    }
    changePassword(userId) {
      try {
        console.log(userId);
        this.openDialogChangePassword(userId);
      } catch (error) {
        this.actionMessageService.sendError(decorateError(error).error.message);
      }
    }
    public openDialogChangePassword(userId?: string): void {
      const userName = this.users.find(e => e.id == userId).username;
      const dialogRef = this.dialog.open(UserChangePasswordComponent, {
          data: {
              userId,
              userName
          },
          minWidth: '300px',
          maxWidth: '400px'
      });

      dialogRef.afterClosed().subscribe((data) => {
          debug('Change Password dialog closed');
      });
  }


    openResetPassword() {
        this.actionMessageService.sendInfo('Reset Password: not implemented');
    }

    onUpdateStatus($event, row) {
        if (this.updateStatusSub) this.updateStatusSub.unsubscribe();
        this.updateStatusSub = this.userService.updateStatus(row.id, $event.checked).subscribe(data => {
            this.getUsersBaseOnTenant(this.searchGroup.get('tenantId').value);
            this.actionMessageService.sendSuccess('Update successfull');
        }, error => {
            $event.source.toggle(); //revert value
            this.actionMessageService.sendError(decorateError(error).error.message);
        })
    }

    openState() {
        this.actionMessageService.sendInfo('UI State: not implemented');
    }

    openUser() {
        this.actionMessageService.sendInfo('UI State: not implemented');
    }

    public selectedTenant(tenantId: string): void {
        this.router.navigate([`users/${tenantId}`]);
    }

    public downloadUser() {
      const { tenantId } = this.searchGroup.getRawValue();
      this.isDownload$.next(true);
      this.userService.downloadUsers(tenantId).subscribe(() => {
      this.actionMessageService.sendSuccess("Download successful");
      this.isDownload$.next(false);
      }, err => {
        this.actionMessageService.sendSuccess(decorateError(err).error.message);
        this.isDownload$.next(false);
      })
    }
}
