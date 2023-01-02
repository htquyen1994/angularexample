import { Component, OnInit, Inject, OnDestroy, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { PermissionsStoreService } from '@admin-modules/permissions/services';
import { first, shareReplay, map } from 'rxjs/operators';
import { PermissionTemplateState, TemplateUserState } from '@admin-modules/permissions/interfaces';
import { ConfirmDialogModel, ConfirmDialogComponent } from '@admin-shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'ps-edit-template-dialog',
  templateUrl: './edit-template-dialog.component.html',
  styleUrls: ['./edit-template-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditTemplateDialogComponent implements OnInit, OnDestroy {
  form: FormGroup = new FormGroup({
    name: new FormControl(null, Validators.required)
  })
  loading$: Observable<boolean>;
  usersUpdating$: Observable<number>;
  users$: Observable<TemplateUserState[]>;
  templateState: PermissionTemplateState;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EditTemplateDialogComponent>,
    private _permissionsStoreService: PermissionsStoreService,
    public _dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loading$ = this._permissionsStoreService.templateLoading$;
    this.usersUpdating$ = this._permissionsStoreService.templateUsers$.pipe(map(e=>e.filter(e=>e.updating).length))
    this.users$ = this._permissionsStoreService.templateUsers$;
    this._permissionsStoreService.templateState$.pipe(first()).subscribe(template=>{
      const { templateName } = template;
      this.templateState = template;
      this.form.patchValue({name: templateName})
    })
  }

  ngOnDestroy(): void {
    this._permissionsStoreService.cancelUpdatingTemplate();
  }

  save() {
    if(!this.templateState){
      return;
    }
    const {name}  =this.form.getRawValue();
    const templateState: PermissionTemplateState = {...this.templateState, templateName: name}
    this._permissionsStoreService.updateTemplate(templateState);
  }

  cancelDialog() {
    combineLatest(
      this.loading$.pipe(first()),
      this.usersUpdating$.pipe(first())
    ).subscribe(([isLoading, usersLoading])=>{
      if(!isLoading && usersLoading == 0) {
        this.dialogRef.close();
        return;
      }

      if(usersLoading > 0){
        this.confirmDialog('Users of this template are being updated, are you sure you want to cancel?')
        return;
      }

      this.confirmDialog('The template is updating, are you sure you want to cancel?')
    })
  }

  confirmDialog(message): void {
    const dialogData = new ConfirmDialogModel("Confirm Action", message);
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dialogRef.close({reload: true});
      }
    });
  }

  onUpdateTemplateUser(user: TemplateUserState){
    const { username } = user;
    this._permissionsStoreService.updateTemplateUser(username)
  }
}
