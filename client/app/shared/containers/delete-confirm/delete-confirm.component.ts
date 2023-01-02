import { Component, OnInit, ViewChild, ChangeDetectorRef, Inject } from '@angular/core';
import { DialogComponent } from '../../components';
import { ModalModel, ResultStatus } from '../../models/modal.model';
import { createSimpleError } from '../../http.util';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'go-delete-confirm',
  templateUrl: './delete-confirm.component.html',
  styleUrls: ['./delete-confirm.component.less']
})
export class DeleteConfirmComponent implements OnInit {
  @ViewChild('deleteConfirmDialog', { static: true }) deleteDialog: DialogComponent;
  deleteModel: ModalModel;
  constructor(
    private dialogRef: MatDialogRef<DeleteConfirmComponent>,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    let deleteModel = this.data['deleteModel'];
    if (deleteModel) {
      this.deleteModel = deleteModel;
    } else {
      this.onDialogClose(createSimpleError('ModalModel is empty'));
    }
  }

  ngAfterContentInit() {
    this.deleteDialog.onHide(false);
    this.changeDetectorRef.detectChanges();
  }

  onDialogClose(result?: any) {
    this.dialogRef.close(result);
    this.changeDetectorRef.detectChanges();
  }

  onDeleteCancel() {
    this.onDialogClose();
  }

  onDelete() {
    this.onDialogClose({ status: ResultStatus.OK });
  }
}
