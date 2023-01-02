import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DialogComponent } from '@client/app/shared/components';
import { MatDialogRef } from '@angular/material/dialog';
import { ResultStatus } from 'src/client/app/shared/models/modal.model';

@Component({
  selector: 'ps-setting-confirm-popup',
  templateUrl: './setting-confirm-popup.component.html',
  styleUrls: ['./setting-confirm-popup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SettingConfirmPopupComponent implements OnInit {
  @ViewChild('confirmDialog', { static: true }) confirmDialog: DialogComponent;
  notShowMeAgain = false;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SettingConfirmPopupComponent>,
  ) { }

  ngOnInit(): void {
  }

  ngAfterContentInit() {
    this.confirmDialog.onHide(false);
    this.changeDetectorRef.detectChanges();
  }

  onDialogClose(result?: any) {
    this.dialogRef.close(result);
    this.changeDetectorRef.detectChanges();
  }

  onCancel() {
    this.onDialogClose();
  }

  onConfirm() {
    this.onDialogClose({ status: ResultStatus.OK, notShowMeAgain: this.notShowMeAgain });
  }

  onSelection(value: boolean) {
    this.notShowMeAgain = value;
    this.changeDetectorRef.detectChanges();
  }
}
