import {Component, ViewChild, EventEmitter, Output, Inject, Input, AfterContentInit, ChangeDetectorRef} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {
  LayerService, IErrorResponse, AccountService, ActionMessageService
} from '@client/app/shared';
import {
  DialogComponent,
} from '@client/app/shared/components';
import {forkJoin, Observable, of, Subject} from 'rxjs';
import {startWith, map, tap, takeUntil} from 'rxjs/operators';
import { ILayer, AclEntry } from '@client/app/shared/interfaces';
import { DataAction } from '@client/app/shared/enums';
import { decorateError } from '@client/app/shared/http.util';
import { TenantUserService } from 'src/client/app/shared/services';


interface SharedUser {
  userId: string;
  name: string;
  permission?: number;
}

@Component({
  selector: 'go-layer-share-form',
  moduleId: module.id,
  templateUrl: 'layer-share-form.component.html',
  styleUrls: ['layer-share-form.component.less']
})
export class LayerShareFormComponent implements AfterContentInit {
  @ViewChild('dialog', { static: true }) dialog: DialogComponent;

  @Input() layer: ILayer;
  @Output() close = new EventEmitter<boolean>();

  form: FormGroup;
  error: IErrorResponse;
  isLoading = false;
  isValidAdd = false;

  optionsTable: { [userId: string]: string } = {};
  options: SharedUser[] = [];
  sharedOptions: string[] = [];
  filteredOptions: Observable<SharedUser[]>;
  userAddedOrRemoved = false;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
              private changeDetectorRef: ChangeDetectorRef,
              private accountService: AccountService,
              private actionMessageService: ActionMessageService,
              private layerService: LayerService,
              private tenantUserService: TenantUserService) {
  }

  ngAfterContentInit() {
    this.form = this.formBuilder.group({
      layerId: [this.layer.id],
      autocomplete: [''],
      users: this.formBuilder.array([])
    });
    this.layerService.getLayerUserList().subscribe(data => {
      this.optionsTable = {};
      this.options = data
        .filter(user => this.accountService.accountStore.username !== user.username && !user.enabled)
        .map(user => {
        const name = `${user.forename} ${user.surname}`;
        this.optionsTable[user.username] = name;
        return {
          userId: user.username,
          name
        };
      });
      this.changeDetectorRef.detectChanges();
    });

    this.tenantUserService.getSharedLayerUsers(this.layer.owner, this.layer.id, this.layer.source).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(data => {
      data.forEach(user => {
        const permission = user.permissableActions.includes(DataAction.Modify) ? 1 : 0;
        this.addUser(user.username, permission);
        this.sharedOptions.push(user.username);
        this.changeDetectorRef.detectChanges();
      });
    });

    this.filteredOptions = this.form.controls.autocomplete.valueChanges
      .pipe(
        startWith(''),
        tap(value => this.checkValidAdd(value)),
        map(value => this._filter(value))
      );

    this.dialog.onHide(false);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  checkValidAdd(value) {
    const x = this.options
      .filter(user => user.name.toLowerCase() === value.toLowerCase());

    this.isValidAdd = x.length === 1;
  }

  private _filter(value: string): SharedUser[] {
    const filterValue = value.toLowerCase();

    const users: string[] = this.form.getRawValue().users.map(user => user.userId);

    return this.options
      .filter(user => user.name.toLowerCase().includes(filterValue) && !users.includes(user.userId));
  }

  onClose(state: boolean) {
    this.close.emit(state);
  }

  onComplete() {
    this.isLoading = true;

    const readPermission = [DataAction.List, DataAction.Read, DataAction.Download];
    const modifyPermission = [DataAction.Modify, DataAction.List, DataAction.Read, DataAction.Download];

    const sharedUserIds: string[] = this.form.getRawValue().users.map(user => user.userId);
    const deletedUserIds: string[] = this.sharedOptions.filter(userId => !sharedUserIds.includes(userId));

    const aclUser: AclEntry[] = this.form.getRawValue().users.map((user: SharedUser) => ({
      UserName: user.userId,
      PermissableActions: user.permission === 0 ? readPermission : modifyPermission
    }));

    const subscriptions = [this.layerService.shareLayer(this.accountService.accountStore.username, aclUser, this.layer.id, this.layer.source)];

    if (deletedUserIds.length > 0) {
      subscriptions.push(this.layerService.unshare(this.accountService.accountStore.username, deletedUserIds, this.layer.id, this.layer.source));
    }

    forkJoin(subscriptions)
      .subscribe(
        () => {
          this.isLoading = false;
          this.actionMessageService.sendInfo(`Layer '${this.layer.name}' successfully shared`);
          this.tenantUserService.resetSharedLayerUsers(this.layer.id);
          this.onClose(true);
        },
        error => {
          this.error = decorateError(error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
  }

  addUserFromAutocomplete() {
    const user = this.options.find(x => x.name === this.form.controls.autocomplete.value);
    this.addUser(user.userId, 0);
  }

  addUser(userId, permission) {
    (<FormArray>this.form.controls.users).push(
      this.formBuilder.group({
        permission: [permission],
        userId: [userId]
      })
    );
    this.form.controls.autocomplete.setValue('');
    this.userAddedOrRemoved = true;
  }

  deleteUser(index: number) {
    (<FormArray>this.form.controls.users).removeAt(index);
    this.form.controls.autocomplete.setValue('');
    this.userAddedOrRemoved = true;
  }
}
