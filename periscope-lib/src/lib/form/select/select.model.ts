export interface PsSelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  parentId?: string;
  items?: PsSelectOptionItem[];
}

export interface PsSelectOptionItem extends Pick<PsSelectOption, 'label' | 'value' | 'disabled' | 'parentId'> {

};
