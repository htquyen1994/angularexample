import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { ToolPanelColumns } from '../table.model';

export enum ToolPanelButtons {
  COLUMNS = 'columns'
}

@Component({
  selector: 'ps-tool-panel',
  templateUrl: './tool-panel.component.html',
  styleUrls: ['./tool-panel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ToolPanelComponent implements OnInit {
  @Input() set columns(value: ToolPanelColumns[]) {
    this._columns = value || [];
    this.filter(this.search);
  };
  @Output() changed = new EventEmitter<{ cols: ToolPanelColumns[] }>();
  selectedTool = null;
  search: string = '';
  checkedAll: boolean = true;
  _columns: ToolPanelColumns[];
  _filtered: ToolPanelColumns[];
  ToolPanelButtons = ToolPanelButtons;
  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
  }

  onSelectedTool(tool: ToolPanelButtons) {
    if (this.selectedTool == tool) {
      this.selectedTool = null;
    } else {
      this.selectedTool = tool;
    }
    this.cd.detectChanges();
  }

  onCheckedColumn(event, index) {
    this.checkColumn(index, event);
    this.setCheckALl();
    this.changed.emit({ cols: this._columns })
  }

  onSearch(event) {
    this.filter(event);
  }

  onCheckAll(event) {
    this._columns.forEach((e, i) => {
      this.checkColumn(i, event);
    });
    this.setCheckALl();
    this.changed.emit({ cols: this._columns })
  }

  private checkColumn(index, value) {
    const i = parseInt(index);
    this._columns[i].visible = value;
  }
  private filter(str: string = '') {
    if (str) {
      this._filtered = this._columns.filter(e => e.name.toLowerCase().includes(str.toLowerCase()));
    } else {
      this._filtered = this._columns.slice(0)
    }
  }

  private setCheckALl() {
    const filter = this._columns.filter(e => e.visible);
    this.checkedAll = !!filter.length;
  }
}
