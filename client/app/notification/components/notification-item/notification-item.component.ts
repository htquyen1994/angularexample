import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, HostListener } from '@angular/core';
import { INotificationItem } from '../../interfaces';

@Component({
  selector: 'ps-notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent implements OnInit {
  @Input() item: INotificationItem;
  @Output() clicked: EventEmitter<INotificationItem> = new EventEmitter<INotificationItem>();
  @Output() markAsRead = new EventEmitter<INotificationItem>();
  constructor() { }

  ngOnInit(): void {
  }

  onClick() {
    this.clicked.emit(this.item);
  }

  onMarkAsRead(){
    this.item.markAsRead = true;
    this.markAsRead.next(this.item);
  }

  onMarkAsUnRead() {
    this.item.markAsRead = false;
    this.markAsRead.next(this.item);
  }
}
