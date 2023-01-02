export enum TabName {
  DATA_VIEW = 'DATA_VIEW',
  INSIGHTS = 'INSIGHTS',
  NEAREST = 'NEAREST',
  STREET_VIEW = 'STREET_VIEW',
  MATCHIT = 'MATCHIT',
  FIND = 'FIND'
}

export enum TabType {
  DYNAMIC = 'dynamic',
  STATIC = 'static'
}

export interface Tab {
  id: TabName;
  label: string;
  show: boolean;
  active?: boolean;
  disabled?: boolean;
  type: TabType
}
