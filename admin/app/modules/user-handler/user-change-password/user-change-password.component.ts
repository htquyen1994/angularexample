import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { UserService } from '../user.service';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActionMessageService } from '@admin-core/services/action-message.service';
import { decorateError } from '@admin-shared/models/error';
import { takeUntil } from 'rxjs/operators';
import { strengthPassword } from '@periscope-lib/commons/validators/strength-password.vadidator'

export class ConfirmPasswordStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidCtrl = !!(control && control.invalid && control.dirty);
    const invalidParent = !!(control && control.parent && control.parent.invalid && control.parent.dirty && control.valid);

    return (invalidCtrl || invalidParent);
  }
}
@Component({
  selector: 'ps-user-change-password',
  templateUrl: './user-change-password.component.html',
  styleUrls: ['./user-change-password.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class UserChangePasswordComponent implements OnInit {
  form: FormGroup;
  loading$ = new BehaviorSubject<boolean>(false);
  matcher = new ConfirmPasswordStateMatcher();
  userId: string;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<UserChangePasswordComponent>,
    private cd: ChangeDetectorRef,
    private actionMessageService: ActionMessageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8), strengthPassword()]),
      confirmNewPassword: new FormControl('', [Validators.required])
    }, { validator: this.checkPasswords });
  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onSubmit() {
    const { newPassword } = this.form.getRawValue();
    this.loading$.next(true);
    this.userService.changePassword(this.data.userId, newPassword).pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      this.actionMessageService.sendSuccess(`${this.data.userName} password has been updated`);
      this.loading$.next(false);
      this.onClose(data);
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
    })
  }

  onCancel() {
    this.dialogRef.close();
  }

  onClose(data: any) {
    this.dialogRef.close(data);
  }
  getErrorMessage(err) {
    const errors = err[1];
    const filedName = err[2];
    if (errors) {
      const { required, minlength, digits, lower, upper, nonWords } = errors
      if (required) {
        return `Please enter your ${filedName}`;
      }
      if (minlength) {
        return `Minimum ${minlength.requiredLength} characters required`;
      }
      if(digits){
        return `One or more numbers`;
      }
      if(lower){
        return `One or more lowercase characters`;
      }
      if(upper){
        return `One or more uppercase characters`;
      }
      if(nonWords){
        return `One or more special character e.g. # % @ *`;
      }
    }
    return null
  }
  checkPasswords(group: FormGroup) { // here we have the 'passwords' group
    const pass = group.get('newPassword').value;
    const confirmPass = group.get('confirmNewPassword').value;
    if (!confirmPass) return null;
    return pass === confirmPass ? null : { notSame: true }
  }

}
