import { NotificationType } from "../enums";

export interface INotificationItem {
  id: string;
  title: string;
  updated: Date | string | number;
  type: NotificationType
  message: INotificationMessage;
  markAsRead?: boolean;
}

export interface INotificationMessage {
  detail?: string;
  caption?: string;
}

export interface INotification {
  list: INotificationItem[];
}

export interface INotificationData {
  markAsReadIds: string[];
}

export interface IFilterNotification {
  hideRead?: boolean;
  page?: number;
  pageSize?: number;
}
