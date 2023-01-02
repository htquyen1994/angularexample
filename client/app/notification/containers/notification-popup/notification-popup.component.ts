import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationStep } from '../../enums';
import { INotificationItem } from '../../interfaces';
import { DialogComponent } from '@client/app/shared/components';
import { IDynamicDialogData } from '@client/app/shared/interfaces';

@Component({
  selector: 'ps-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NotificationPopupComponent implements OnInit {
  @ViewChild('dialog', { static: true }) dialog: DialogComponent;
  public notShowMeAgain = false;
  // public innitPosition: { x: number, y: number };
  public step = NotificationStep.LIST;
  public NotificationStep = NotificationStep;
  public selectedItem: INotificationItem;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialogRef: MatDialogRef<NotificationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public _data: IDynamicDialogData,
  ) {
   }

  ngOnInit(): void {
    // const { position } = this._data;
    // if(position){
    //   this.innitPosition = {...position}
    // }
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
    this.changeDetectorRef.detectChanges();
  }

  onDialogClose(result?: any) {
    this.dialogRef.close(result);
    this.changeDetectorRef.detectChanges();
  }

  onSelectedItem(item: INotificationItem){
    this.step = NotificationStep.DETAIL;
    this.selectedItem = item;
    this.changeDetectorRef.detectChanges();
  }

  goBack(){
    this.step = NotificationStep.LIST;
    this.changeDetectorRef.detectChanges();
  }
}
