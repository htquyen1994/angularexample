import { NgModule } from '@angular/core';
import { UserChangePasswordComponent } from './user-change-password/user-change-password.component';
import { UserFormComponent } from './user-form/user-form.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    UserFormComponent,
    UserChangePasswordComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    UserChangePasswordComponent,
    UserFormComponent
  ],
  providers: [],
  entryComponents: [UserChangePasswordComponent, UserFormComponent]
})
export class UserSharedModule { }
