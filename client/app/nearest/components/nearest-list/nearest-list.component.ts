import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation, ViewChild, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Table } from 'primeng/table';
import { NearestResultColumn } from '../../interfaces';
import { orderBy } from 'lodash';

@Component({
  selector: 'ps-nearest-list',
  templateUrl: './nearest-list.component.html',
  styleUrls: ['./nearest-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NearestListComponent implements OnInit {
  @ViewChild('table') table: Table;
  @Input() isMetric: boolean = false;
  @Input('results') set _results(value: any[]){
    this.results = [...value];
    this.orderCol = null;
    this.refreshTable();
  };
  @Input() columns: NearestResultColumn[] = [];
  @Output() selected = new EventEmitter<any>()
  @Output() unSelected = new EventEmitter<any>()
  results: any[] = [];
  _refreshTableSuccessful = false;
  orderCol: {field: string, order: 'asc' | 'desc'};
  public selectedRow: any;
  constructor(
    private _cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  }

  onRowUnselect(event) {
    const {data} = event;
    this.unSelected.next(data);
  }

  onRowSelect(event) {
    const {data} = event;
    this.selected.next(data);
  }

  onOrderCol(col: NearestResultColumn, index: number) {
    const { id, orderBy } = col;
    if (this.orderCol && this.orderCol.field === id) {
      this.orderCol = { field: id, order: this.orderCol.order === 'asc' ? 'desc' : 'asc' };
    } else {
      this.orderCol = { field: id, order: 'asc' };
    }
    const rows = this.orderBy(this.results, orderBy || id, this.orderCol.order);
    this.results = [...rows];
  }

  private orderBy(rows, field: string, order: 'asc' | 'desc'){
    return orderBy(rows, [field], [order]);
  }

  private refreshTable() {
    this._refreshTableSuccessful = false;
    this._cd.detectChanges();
    setTimeout(() => {
      let headerTable = this.table.el.nativeElement.querySelector('.p-datatable-scrollable-header-table');
      let bodyTable = this.table.el.nativeElement.querySelector('.p-datatable-scrollable-body table');
      let header = headerTable.querySelector('.p-datatable-thead');
      let body = bodyTable.querySelector('.p-datatable-tbody');
      let header_clone = header.cloneNode(true);
      let body_clone = body.cloneNode(true);
      this.addClass(header_clone, 'visibility-collapse');
      this.addClass(body_clone, 'visibility-collapse');
      let oldbodyClone = headerTable.querySelector('.p-datatable-tbody');
      let oldheaderClone = bodyTable.querySelector('.p-datatable-thead');
      if (oldbodyClone) {
        headerTable.removeChild(oldbodyClone);
      }
      if (oldheaderClone) {
        bodyTable.removeChild(oldheaderClone);
      }
      bodyTable.appendChild(header_clone);
      headerTable.appendChild(body_clone);
      this._refreshTableSuccessful = true;
      this._cd.detectChanges();
    }, 0);
  }

  private addClass(element: any, className: string): void {
    if (element.classList)
      element.classList.add(className);
    else
      element.className += ' ' + className;
  }

}
