import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { INotification, INotificationItem, IFilterNotification } from '../../interfaces';
import { Observable, fromEvent } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'ps-notification-wrapper',
  templateUrl: './notification-wrapper.component.html',
  styleUrls: ['./notification-wrapper.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NotificationWrapperComponent implements OnInit {
  @Output() selected = new EventEmitter<INotificationItem>();

  public notifications$: Observable<INotificationItem[]>;
  public loading$: Observable<boolean>;
  public selectedItem: INotificationItem;
  public filter$: Observable<IFilterNotification>;
  public pageNum = 1;
  constructor(
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {
    this.notifications$ = this.notificationService.filteredNotification$;
    this.loading$ = this.notificationService.loading$;
    this.filter$ = this.notificationService.filter$;
  }

  ngOnInit(): void {
  }

  onItemSelect(item: INotificationItem): void {
    this.selectedItem = item;
    this.selected.emit(this.selectedItem);
    this.notificationService.markedAsRead(item.id, true)
    this.cd.detectChanges();
  }

  onToggleHideRead(value: MatSlideToggleChange) {
    const { checked } = value;
    this.notificationService.filterNotification({ hideRead: checked })
  }

  onMarkAllAsRead() {
    this.notificationService.markedAllAsRead()
  }

  onMarkAsRead(item: INotificationItem) {
    this.notificationService.markedAsRead(item.id, item.markAsRead);
    this.cd.detectChanges();
  }

  onScrollDown(currentPage) {
    this.notificationService.filterNotification({ page: currentPage ? currentPage + 1 : 1 })
  }
}
