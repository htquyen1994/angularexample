import { Component, OnInit, ChangeDetectionStrategy, ViewChild, Inject, NgZone } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { EFeatureShare, ERecipientType } from '../../enums';
import { ShareFeatureUser, ShareFeatureForm, ShareFeatureDialogModel } from '../../interfaces';
import { DialogComponent } from '@client/app/shared/components';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { switchMap, map, startWith, takeUntil, withLatestFrom } from 'rxjs/operators';
import { TenantUserService, FeatureShareService } from '../../services';
import { ActionMessageService } from '../../action-message.service';
import { decorateError } from '../../http.util';
import { AccountService } from '../../account.service';
import { LayerSource } from '../../LayerSource';

@Component({
  selector: 'ps-feature-share-form',
  templateUrl: './feature-share-form.component.html',
  styleUrls: ['./feature-share-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureShareFormComponent implements OnInit {
  @ViewChild('dialog', { static: true }) dialog: DialogComponent;

  public titleDialog: string;
  public titleText: string;
  public form: FormGroup;
  public type: EFeatureShare;
  public optionsTable: { [userId: string]: string } = {};
  public submitting$ = new BehaviorSubject<boolean>(false)
  public filteredOptions$: Observable<ShareFeatureUser[]>;
  public isValid$: Observable<boolean>;

  public get users() {
    return this.form ? this.form.get('users') as FormArray : undefined;
  }

  public get usersLength() {
    return this.users ? this.users.value.length : 0;
  }

  private data: ShareFeatureForm;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogModel: ShareFeatureDialogModel,
    private dialogRef: MatDialogRef<FeatureShareFormComponent>,
    private tenantUserService: TenantUserService,
    private ngZone: NgZone,
    private featureShareService: FeatureShareService,
    private actionMessageService: ActionMessageService,
    private accountService: AccountService,
  ) {
  }


  ngOnInit(): void {
    // this.tenantUserService.getUserList();
    const { titleDialog, titleText, data } = this.dialogModel;
    this.data = data;
    this.titleDialog = titleDialog;
    this.titleText = titleText;
    this.initForm();

    const getUsers$ = data.recipientType == ERecipientType.ALL
    ? this.tenantUserService.getUserList()
    : this.tenantUserService.getSharedLayerUsers(this.accountService.accountStore.username, this.data.key, LayerSource.USER);

    this.filteredOptions$ = this.form.get('autocomplete').valueChanges
      .pipe(
        takeUntil(this.unsubscribe$),
        startWith(''),
        switchMap((value) => {
          return getUsers$.pipe(
            map(options => options
              .filter(user => this.accountService.accountStore.username !== user.username && !user.enabled)
              .map(user => {
              const name = `${user.forename} ${user.surname}`;
              this.optionsTable[user.username] = name;
              return {
                userId: user.username,
                name
              };
            })),
            map(options => {
              const filterValue = value.toLowerCase();
              const users: string[] = this.form.getRawValue().users.map(user => user.userId);
              return options.filter(user => user.name.toLowerCase().includes(filterValue) && !users.includes(user.userId))
            })
          )
        }),
      );

    this.isValid$ = this.filteredOptions$.pipe(
      withLatestFrom(
        this.form.get('autocomplete').valueChanges
      ),
      map(([options, value]) => {
        if (value && options && options.length == 1) {
          return options[0].name === value;
        }
        return false;
      })
    )
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initForm(data?: any) {
    if (!this.form) {
      this.form = new FormGroup({
        autocomplete: new FormControl(''),
        users: new FormArray([], Validators.required),
      })
    }
    if (data) {
      this.form.patchValue(data);
    }
  }

  onClose(data?: any) {
    this.ngZone.run(() => {
      this.dialogRef.close(data);
    })
  }

  deleteUser(index: number) {
    (<FormArray>this.form.get('users')).removeAt(index);
    this.form.get('autocomplete').setValue('');
  }

  addUser(_user: ShareFeatureUser) {
    const user = new FormGroup({
      userId: new FormControl(_user.userId),
    });
    this.users.push(user);
    this.form.get('autocomplete').setValue('');
  }

  onComplete() {
    this.submitting$.next(true);
    const users = this.form.getRawValue().users.map(user => user.userId);

    this.featureShareService.copyToUsers(this.data, users)
      .subscribe(
        data => {
          this.submitting$.next(false);
          this.actionMessageService.sendInfo(`${this.titleText} successfully copied to ${data.length} users`);
          this.onClose(true);
        },
        error => {
          const _error = decorateError(error);
          this.submitting$.next(false);
          this.actionMessageService.sendError(_error.error.message);
        });
  }
}
