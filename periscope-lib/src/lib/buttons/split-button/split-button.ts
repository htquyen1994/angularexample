export enum ISplitButtonEventType {
  CLICK
}

export interface ISplitButtonItem {
  id: any;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface ISplitButtonEvent {
  type: ISplitButtonEventType,
  id: any
}
