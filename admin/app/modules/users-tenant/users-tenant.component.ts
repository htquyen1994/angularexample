import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { GoTableColumn } from '@periscope-lib/table/table.model';
import { PAGE_SIZE } from '@admin-shared/models/global';
import { ReplaySubject, BehaviorSubject, forkJoin, Subscription } from 'rxjs';
import { debug } from 'loglevel';
import { UserService } from '@admin-modules/user-handler/user.service';
import { AccountService } from '@admin-core/services/account.service';
import { User } from '@admin-modules/user-handler/user.interface';
import { Unsubscribable } from '@periscope-lib/commons/decorators/unsubscribable.decorator';
import { untilDestroyed } from '@periscope-lib/commons/rx-operators/until-destroyed';
import { UsersTenantService } from './users-tenant.service';
import { UserFormComponent } from '@admin-modules/user-handler/user-form/user-form.component';
import { MatDialog } from '@angular/material/dialog';
import { MasterSelector } from '../../store/selectors';
import { IAppState } from '../../store/state/app.state';
import { Store, select } from '@ngrx/store';
import { tap, filter, first } from 'rxjs/operators';
import { MasterDataAction } from '../../store/actions';
import { Router } from '@angular/router';
import { ActionMessageService } from '@admin-core/services/action-message.service';
import { decorateError } from '@admin-shared/models/error';
import { UserChangePasswordComponent } from '@admin-modules/user-handler/user-change-password/user-change-password.component';

@Component({
  selector: 'ps-users-tenant',
  templateUrl: './users-tenant.component.html',
  styleUrls: ['./users-tenant.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
@Unsubscribable()
export class UsersTenantComponent implements OnInit {
  private tenantId: string;
  public pageSize = PAGE_SIZE;
  public loading$ = new BehaviorSubject<boolean>(false);
  public datas$ = new ReplaySubject<any[]>(1);
  public users: User[] = [];
  public searchGroup: FormGroup = new FormGroup({
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
    { name: 'Last Logon', trackBy: 'last_logon', class: 'w-10' },
    { name: 'Date Created', trackBy: 'created', class: 'w-10' },
    { name: '', trackBy: '', class: 'action-column' },
  ];
  private updateStatusSub: Subscription;
  public isDownload$ = new BehaviorSubject<boolean>(false);
  constructor(
    private accountService: AccountService,
    private userService: UserService,
    public dialog: MatDialog,
    private _store: Store<IAppState>,
    private router: Router,
    private actionMessageService: ActionMessageService,
  ) { }

  ngOnInit(): void {
    const user = this.accountService.getProfile();
    const { tenantId } = user;
    this.initPage(tenantId);
  }

  initPage(tenantId) {
    this.tenantId = tenantId;
    this.getUsers();
    this.searchGroup.get('search').valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe((value: string) => {
      this.onFilterUsers(this.searchGroup.get('search').value);
    })
    this.searchGroup.get('showLockedUser').valueChanges.pipe(untilDestroyed(this),).subscribe((value) => {
      this.onFilterUsers(this.searchGroup.get('search').value);
    })
  }

  public getUsers() {
    this.loading$.next(true);
    const getTemplates$ = this._store.pipe(
      untilDestroyed(this),
      select(MasterSelector.selectTemplates, { tenantId: this.tenantId }),
      tap(e => !e ? this._store.dispatch(MasterDataAction.loadPermissionTemplates({ payload: { tenantId: this.tenantId } })) : null),
      filter(e => !!e),
      first()
    );

    forkJoin(
      this.userService.getUserList(this.tenantId, '', 0, 999),
      getTemplates$,
    ).subscribe(([response, templates]) => {
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
    const dialogRef = this.dialog.open(UserFormComponent, {
      data: {
        update: userId ? true : false,
        tenantId: this.tenantId,
        // tenantName: tenant.name,
        userId
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.getUsers();
      }
      debug('grid menu closed');
    });
  }

  openPermissions(userId) {
    try {
      const userName = this.users.find(e => e.id == userId).username;
      if (userName)
        this.router.navigate([`permissions`], { queryParams: { userName: userName } });
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
    }
  }
  onUpdateStatus($event, row) {
    if (this.updateStatusSub) this.updateStatusSub.unsubscribe();
    this.updateStatusSub = this.userService.updateStatus(row.id, $event.checked).subscribe(data => {
      this.getUsers();
      this.actionMessageService.sendSuccess('Update successfull');
    }, error => {
      $event.source.toggle(); //revert value
      this.actionMessageService.sendError(decorateError(error).error.message);
    })
  }
  public downloadUser() {
    // const { tenantId } = this.searchGroup.getRawValue();
    this.isDownload$.next(true);
    this.userService.downloadUsers(this.tenantId).subscribe(() => {
      this.actionMessageService.sendSuccess("Download successful");
      this.isDownload$.next(false);
    }, err => {
      this.actionMessageService.sendSuccess(decorateError(err).error.message);
      this.isDownload$.next(false);
    })
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
}
