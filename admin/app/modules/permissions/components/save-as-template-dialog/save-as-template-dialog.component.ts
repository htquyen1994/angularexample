import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BehaviorSubject, pipe } from 'rxjs';
import { PermissionsService } from '@admin-modules/permissions/services/permissions.service';
import { takeUntil } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { untilDestroyed } from '@periscope-lib/commons/rx-operators/until-destroyed';
import { Unsubscribable } from '@periscope-lib/commons/decorators/unsubscribable.decorator';
import { ActionMessageService } from '@admin-core/services/action-message.service';
import { decorateError } from '@admin-shared/models/error';

@Unsubscribable()
@Component({
  selector: 'ps-save-as-template-dialog',
  templateUrl: './save-as-template-dialog.component.html',
  styleUrls: ['./save-as-template-dialog.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveAsTemplateDialogComponent implements OnInit {
  form: FormGroup = new FormGroup({
    name: new FormControl(null, Validators.required)
  })
  layers: any[];
  tenantId: string;
  loading$ = new BehaviorSubject<boolean>(false);
  constructor(
    private permissionsService: PermissionsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<SaveAsTemplateDialogComponent>,
    private actionMessageService: ActionMessageService,
  ) {
  }

  ngOnInit(): void {
    const { tenantId, layers } = this.data
    if (!tenantId) {
      this.onCancel();
      return;
    }
    this.layers = layers;
    this.tenantId = tenantId;
  }

  onSaveAsTemplate() {
    try {
      const { name } = this.form.getRawValue();
      this.loading$.next(true);
      const tenantId = this.tenantId
      const layers = this.layers;
      this.permissionsService.savePermissionTemplate({ tenantId, layers, name })
        .pipe(untilDestroyed(this))
        .subscribe(e => {
          this.loading$.next(false);
          this.actionMessageService.sendSuccess('Template successful updated');
          this.onClose(e);
        }, err => {
          this.loading$.next(false);
          this.actionMessageService.sendError(decorateError(err).error.message)
        });
    } catch (error) {
      this.loading$.next(false);
      this.actionMessageService.sendError(decorateError(error).error.message)
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onClose(data: any) {
    this.dialogRef.close(data);
  }

}
