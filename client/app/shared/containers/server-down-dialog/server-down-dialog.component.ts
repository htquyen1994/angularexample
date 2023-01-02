import { Component, OnInit, ViewChild, NgZone, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from '../../components';

@Component({
  selector: 'ps-server-down-dialog',
  templateUrl: './server-down-dialog.component.html',
  styleUrls: ['./server-down-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ServerDownDialogComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;

  constructor(
    private dialogRef: MatDialogRef<ServerDownDialogComponent>,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
  }

  onDialogClose(result?: any) {
    this.ngZone.run(() => {
      this.dialogRef.close(result);
    })
  }

}
