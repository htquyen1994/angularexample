import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter, ViewChild, ElementRef, HostBinding, ChangeDetectorRef } from '@angular/core';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

export interface ISelectionButton {
  id: any,
  label: string,
  tooltip?: string,
  placeHolder?:string,
  selected?: boolean,
  disable?: boolean
}

@Component({
  selector: 'ps-selection-button',
  templateUrl: './selection-button.component.html',
  styleUrls: ['./selection-button.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SelectionButtonComponent implements OnInit {
  @Input() activeMode = true;
  @Input('model') set _model(value: ISelectionButton[]) {
    this.innitModel(value)
  };
  @Input('active') set active(value) {
    this.buttonActive = value;
  };
  @Input('disabled') set disabled(value) {
    this.buttonDisabled = value;
  };
  get disabled(){
    return this.buttonDisabled
  }
  @Input('selectedId') set selectedId(value: any) {
    if(this._selectedId && this._selectedId != value){
      const selected = this.model.find(e => e.id === value);
      this.onSelectButton(selected);
    }
    this._selectedId = value;
  }
  @Input() style: any;
  @Input() styleClass: string;
  @Input() menuStyle: any;
  @Input() menuStyleClass: string;
  @Input() tooltipPosition: string = 'bottom';
  @HostBinding('attr.aria-selected') get _buttonActive(){
    return this.activeMode && !!this.buttonActive
  };
  @HostBinding('attr.aria-disabled') buttonDisabled: boolean;
  @Output() clicked = new EventEmitter<ISelectionButton>();
  @Output() selected = new EventEmitter<ISelectionButton>();
  @ViewChild('container') containerViewChild: ElementRef;
  @ViewChild('defaultbtn') buttonViewChild: ElementRef;
  @ViewChild('menu') menu: Menu;

  // get selected(){
  //   return  this.model ? this.model.find(e=>e.selected) : null;
  // }
  buttonActive: boolean;
  _selected: ISelectionButton;
  _selectedId: any;
  menuModel: MenuItem[];
  model: ISelectionButton[];
  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  }

  innitModel(value = []) {
    if (value) {
      this.model = [...value];
      const selected = this.model.find(e=>e.id === this._selectedId);
      this.onSelectButton(selected);
      this.menuModelChanged();
    }
  }


  onSelectButton(button: ISelectionButton) {
    if (!(this.model && this.model.length)) return;
    const id = button ? button.id : null
    this.model = [... this.model.map(e => ({ ...e, selected: false }))]
    const index = this.model.findIndex(e => e.id == id);
    if (index != -1) {
      this.model[index].selected = true;
    } else {
      this.model[0].selected = true;
    }
    this._selected = this.model.find(e => e.selected);
    this._selectedId = this._selected.id;
    this.selected.next(this._selected);
  }

  menuModelChanged() {
    if (!(this.model && this.model.length)) return;
    const menuItems: MenuItem[] = this.model.filter(e => e != this._selected).map(e => ({
      id: e.id,
      label: e.label,
      command: (event) => this.onMenuSelect(event, e)
    }));
    this.menuModel = [...menuItems];
  }

  onMenuSelect(event, e: ISelectionButton) {
    this.onSelectButton(e);
    this.menuModelChanged();
    if (this.buttonActive) {
      this.onSelection();
    }
  }

  onDropdownButtonClick(event: Event) {
    // this.onDropdownClick.emit(event);
    this.menu.toggle({ currentTarget: this.containerViewChild.nativeElement, relativeAlign: false });
    this.cd.detectChanges();
  }

  onDefaultButtonClick(event: Event) {
    if (!this.buttonActive) {
      this.onSelection();
    } else if(this.menu) {
      this.onDropdownButtonClick(event);
    }
  }

  onSelection() {
    this.clicked.next(this._selected)
  }
}
