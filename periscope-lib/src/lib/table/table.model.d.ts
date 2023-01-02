export interface GoTableColumn {
  name: string;
  trackBy: string;
  sort?: 'ASC' | 'DESC';
  class?: string;
  isDate?: boolean;
  dateFormat?: string;
}

export interface GoGroupTableData {
  groupName: string;
  isGroup: boolean;
  groupStyle?: any;
  expandGroup?: boolean;
  collapse?: boolean;
  children: Array<any>;
}

export interface ToolPanelColumns {
  id: any;
  name: string;
  visible?: boolean;
  childrens?: ToolPanelColumns[]
}
