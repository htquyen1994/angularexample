import { Injectable } from '@angular/core';
import { BehaviorSubject, zip, combineLatest, of, Observable, Subject } from 'rxjs';
import { INotification, INotificationItem, INotificationData, IFilterNotification } from '../interfaces';
import { HttpService } from '../../shared';
import { debounceTime, takeUntil, switchMap, withLatestFrom } from 'rxjs/operators';
import { ArrayUtils } from '@periscope-lib/commons/utils/array.utils';
import { string_to_slug } from '@periscope-lib/commons/utils/helper';


@Injectable()
export class NotificationService {
  private notificationSource = new BehaviorSubject<INotification>({ list: [] });
  private filterSource = new BehaviorSubject<IFilterNotification>({ hideRead: false, page: 1, pageSize: 10 })
  private loadingSource = new BehaviorSubject<boolean>(false);
  private updateNotificationUserData$ = new Subject<void>();
  private markAsReadStoreTemp: INotificationData;
  private destroy$ = new Subject<void>();

  public filter$ = this.filterSource.asObservable();
  public loading$ = this.loadingSource.asObservable();
  public notification$ = this.notificationSource.asObservable()
  public filteredNotification$ = this.filter$.pipe(
    withLatestFrom(this.notification$),
    switchMap(([filter, notification]) => {
      const { hideRead, page, pageSize } = filter;
      const { list } = notification;
      const filtered = list.filter(e => hideRead ? !e.markAsRead : true);
      return of(filtered.slice(0, page * pageSize))
    }))
  constructor(
    private httpService: HttpService
  ) {
    this.getNotifications();
    this.updateNotificationUserData$.pipe(
      takeUntil(this.destroy$),
      debounceTime(1000),
      switchMap(() => {
        if (this.markAsReadStoreTemp) {
          return this.updateNotificationUserData(this.markAsReadStoreTemp);
        }
        return of(null);
      })
    ).subscribe(() => {
      this.markAsReadStoreTemp = null;
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  markedAsRead(id: string, value: boolean) {
    const notifications = this.notificationSource.getValue();
    const { list } = notifications;
    const itemIndex = list.findIndex(e => e.id === id);
    if (itemIndex > -1) {
      list[itemIndex].markAsRead = value;
      this.notificationSource.next(notifications);
      this.updateStoreTemp(list.filter(e => e.markAsRead).map(e => e.id));
      this.nextFilteredNotification();
    }
  }

  markedAllAsRead() {
    const notifications = this.notificationSource.getValue();
    const { list } = notifications;
    this.notificationSource.next({
      ...notifications,
      list: [...list.map(e => ({ ...e, markAsRead: true }))]
    });
    this.updateStoreTemp(list.map(e => e.id));
    this.nextFilteredNotification();
  }

  filterNotification(_filter: IFilterNotification) {
    const filter = this.filterSource.getValue();
    this.nextFilteredNotification({
      ...filter,
     ..._filter
    })
  }

  private nextFilteredNotification(_filter?: IFilterNotification) {
    if (!_filter) {
      const filter = this.filterSource.getValue();
      this.filterSource.next({
        ...filter,
      })
    } else {
      this.filterSource.next({
        ..._filter,
      })
    }
  }

  private getNotifications() {
    this.loadingSource.next(true);
    combineLatest(
      this.getNotificationsRequest(),
      this.getNotificationUserData()
    ).subscribe(([_notifications, userData]) => {
      this.loadingSource.next(false);
      const [tenants, reference] = _notifications;
      const { markAsReadIds } = userData;
      const items: INotificationItem[] = [];

      items.push(...this.convertToNotificationItems(tenants.list, markAsReadIds))
      items.push(...this.convertToNotificationItems(reference.list, markAsReadIds))
      // for test
      // Array.from({length: 50}).forEach(e=>items.push({id: Math.random().toString(), message: {caption: "abc_caption",detail: 'abc'}, title: "ABC", type: NotificationType.UI_CHANGE, updated: new Date().toString(), markAsRead: true}))

      if (items.length) {
        const list = ArrayUtils.sortArrayByDate(items, 'DESC', 'dd/MM/yyyy', 'updated');
        this.notificationSource.next({ list });
        this.filterNotification({hideRead: false}); //init
      }
    })
  }

  private getNotificationsRequest(): Observable<[INotification, INotification]> {
    return zip(
      this.httpService.get(`TenantSettings/?settingCollection=notifications&settingName=notifications`),
      this.httpService.get(`ReferenceDataSettings/?settingCollection=notifications&settingName=notifications`),
    )
  }

  private getNotificationUserData(): Observable<INotificationData> {
    return this.httpService.get(`UserSettings/?settingCollection=notifications&settingName=notifications`)
  }

  private updateNotificationUserData(data: INotificationData): Observable<INotificationData> {
    return this.httpService.postJSON(`UserSettings/?settingCollection=notifications&settingName=notifications`, data)
  }

  private updateStoreTemp(markAsReadIds: string[]) {
    this.markAsReadStoreTemp = { markAsReadIds };
    this.updateNotificationUserData$.next();
  }

  private convertToNotificationItems(items: INotificationItem[] = [], markAsReadIds: string[] = []): INotificationItem[] {
    const _items = [];
    items.forEach((e, i) => {
      const id = string_to_slug(e.title);
      _items.push({
        ...e,
        id,
        markAsRead: (markAsReadIds || []).includes(id)
      })
    })
    return _items;
  }
}
