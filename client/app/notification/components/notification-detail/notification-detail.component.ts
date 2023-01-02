import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { INotificationItem } from '../../interfaces';

@Component({
  selector: 'ps-notification-detail',
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.less'],
  changeDetection:  ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NotificationDetailComponent implements OnInit {
  @Input() item: INotificationItem;
  constructor() { }

  ngOnInit(): void {
  }

  goBack(){

  }

}
