import { Component, OnInit, ViewChild, ChangeDetectorRef, Inject } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createSimpleError } from '../../http.util';
import { DynamicModalModel, ResultStatus } from '../../models/modal.model';

@Component({
  selector: 'go-dynamic-confirm',
  templateUrl: './dynamic-confirm.component.html',
  styleUrls: ['./dynamic-confirm.component.less']
})
export class DynamicConfirmComponent implements OnInit {
  @ViewChild('dynamicConfirmDialog', { static: true }) dynamicDialog: DialogComponent;
  model: DynamicModalModel;
  constructor(
    private dialogRef: MatDialogRef<DynamicConfirmComponent>,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    let model = this.data['model'];
    if (model) {
      this.model = model;
    } else {
      this.onDialogClose(createSimpleError('ModalModel is empty'));
    }
  }

  ngAfterContentInit() {
    this.dynamicDialog.onHide(false);
    this.changeDetectorRef.detectChanges();
  }

  onDialogClose(result?: any) {
    this.dialogRef.close(result);
    this.changeDetectorRef.detectChanges();
  }

  onNo() {
    this.onDialogClose({status: ResultStatus.CANCEL});
  }

  onYes() {
    this.onDialogClose({ status: ResultStatus.OK });
  }
}
