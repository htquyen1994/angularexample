import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, HostListener, ElementRef } from '@angular/core';
import { INotificationItem } from '../../interfaces';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ps-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NotificationListComponent implements OnInit {
  @Input() items: INotificationItem[];
  @Output() selected = new EventEmitter<{ item: INotificationItem, index: number }>();
  @Output() markAsRead = new EventEmitter<{ item: INotificationItem, index: number }>();
  private destroy$ = new Subject<void>();
  constructor(private el: ElementRef) {
  }

  ngOnInit(): void {

  }

  onItemClick(item: INotificationItem, index: number): void {
    this.selected.emit({ item, index });
  }

  onMarkAsRead(item: INotificationItem, index: number) {
    this.markAsRead.next({ item, index });
  }

}
