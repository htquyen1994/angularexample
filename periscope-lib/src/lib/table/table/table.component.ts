import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Directive,
  ContentChild,
  TemplateRef,
  ViewEncapsulation,
  ElementRef,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import * as _ from 'lodash';
import { GoTableColumn, GoGroupTableData, ToolPanelColumns } from '../table.model';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ArrayUtils } from '../../commons/utils/array.utils';
import { ResizeService } from '../../commons/services/resize.service';

@Directive({ selector: '[goTableHeader]' })
export class GoTableHeaderDirective { }
@Directive({ selector: '[goTableFooter]' })
export class GoTableFooterDirective { }

@Directive({ selector: '[goTableRow]' })
export class GoTableRowDirective {
  public constructor(element: ElementRef) { }
}

@Directive({ selector: '[goToolPanel]' })
export class GoToolPanelDirective {
  public constructor(element: ElementRef) { }
}

@Component({
  selector: 'periscope-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnChanges {
  @Input() public columns: GoTableColumn[] = [];
  @Input() public groupStyles: any;
  @Input() public headerStyles: any;
  @Input() public tableStyles: any;
  @Input() public sorted?: boolean;
  @Input() public data: any[] = [];
  @Input() public rowTemplate: TemplateRef<HTMLElement>;
  @Input() public rowTemplate_withoutWrapper: TemplateRef<HTMLElement>;
  @Input() public headerTemplate: TemplateRef<HTMLElement>;
  @Input() public groupTemplate: TemplateRef<HTMLElement>;
  @Input() public isGroup: boolean;
  @Input() public inactive: string;
  @Input() public mouseHover: boolean;
  @Input() public isClientPaging: boolean;
  @Input() public pageSize = 10;
  @Input() public groupRowsBy: string;
  @Input() public selected: string;
  @Input() public columnTool: boolean;
  @Input() public identifier: string;
  @Input() set loading(value: boolean) {
    this.loading$.next(value);
  }
  @Output() public rowSelect = new EventEmitter<any>();
  @ContentChild(GoTableHeaderDirective, { static: true, read: TemplateRef })
  public goHeaderTemplate;
  @ContentChild(GoTableFooterDirective, { static: true, read: TemplateRef })
  public goFooterTemplate;
  @ContentChild(GoTableRowDirective, { static: true, read: TemplateRef })
  public goTableRowTemplate;
  @ContentChild(GoToolPanelDirective, { static: true, read: TemplateRef })
  public goToolPanelTemplate;
  @ViewChild('tableContent')
  public tableContent: ElementRef;

  public data$ = new BehaviorSubject<any[]>([]);
  public page$ = new BehaviorSubject<number>(1);
  public totalPage$ = new ReplaySubject<number>(1);
  public loading$ = new BehaviorSubject<boolean>(false);
  public expand = true;
  public isShowingScroll = false;
  public currentSort: { col: GoTableColumn, type: 'ASC' | 'DESC' };
  public groups: any = {};
  public scrollLeft: number;
  public toolPanelColumns: ToolPanelColumns[] = [];
  public constructor(
    private cd: ChangeDetectorRef,
    private el: ElementRef,
    private resizeService: ResizeService
  ) {
    this.data$.asObservable().pipe(
      debounceTime(10)
    ).subscribe(e => {
      this.checkScrollTable();
    })
  }
  ngOnInit() {
    this.resizeService.addResizeEventListener(this.el.nativeElement, (elem) => {
      this.checkScrollTable();
    });
  }

  ngOnDestroy() {
    this.resizeService.removeResizeEventListener(this.el.nativeElement);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.columns) {
      if (this.columns.length && this.sorted) {
        const index = this.columns.findIndex(e => e.sort);
        if (index != -1) {
          const col = this.columns[index];
          this.setCurrentSort(col, col.sort);
        }
      }
      this.toolPanelColumns = this.formatToToolPanelColumns(this.columns);
    }
    if (changes.data) {
      const _datas = this.data || [];
      let datas = this.sorted && this.currentSort ?
        this.sort([..._datas], this.currentSort.col, this.currentSort.type) : [..._datas];
      if (this.isGroup && this.groupRowsBy) {
        datas = _.orderBy([...datas], [this.groupRowsBy], ['asc']);
      }
      if (this.isClientPaging) {
        const currentpage = this.page$.value;
        this.totalPage$.next(datas.length);
        datas = this.pagingDataOnClient(currentpage, datas);
      }
      if (this.isGroup && this.groupRowsBy) {
        datas = _.chain(datas)
          .groupBy(this.groupRowsBy)
          .map((value, key) => ({ groupName: key !== 'undefined' ? key : 'Not Grouping', children: value, expandGroup: true, collapse: false } as GoGroupTableData))
          .value();
      }
      this.data$.next(datas);
    }
  }

  public trackByIndex(index: number, _: any): number {
    return index;
  }

  public trackByIdentifierColumn(identifier: string,index: number, _: any): number {
    return _[identifier];
  }

  public onSort(col: GoTableColumn) {
    if (!this.sorted) {
      return;
    }
    const { sort } = col;
    this.setCurrentSort(col, sort === 'ASC' ? 'DESC' : 'ASC');
    const datas = this.sort([...this.data], this.currentSort.col, this.currentSort.type);
    if (this.isClientPaging && !(this.isGroup && this.groupRowsBy)) {
      const currentpage = this.page$.value;
      this.data$.next(this.pagingDataOnClient(currentpage, datas));
      return;
    }
    this.data$.next(datas);
  }

  public sort(datas: any[], col: GoTableColumn, type: 'ASC' | 'DESC'): any[] {
    if (this.isGroup) {
      return [...this.sortColumnByChildren(datas, col, type)];
    }

    return [...this.sortColumn(datas, col, type)];
  }

  public pageChange(page: number): void {
    let datas = this.sorted && this.currentSort ?
      this.sort([...this.data], this.currentSort.col, this.currentSort.type) : [...this.data];
    if (this.isGroup && this.groupRowsBy) {
      datas = _.orderBy([...datas], [this.groupRowsBy], ['asc']);
    }
    datas = this.pagingDataOnClient(page, datas);
    if (this.isGroup && this.groupRowsBy) {
      datas = _.chain(datas)
        .groupBy(this.groupRowsBy)
        .map((value, key) => ({ groupName: key !== 'undefined' ? key : 'Not Grouping', children: value, expandGroup: true, collapse: false } as GoGroupTableData))
        .value();
    }
    this.data$.next(datas);
  }

  public onClickGroup(group) {
    group.collapse = !group.collapse;
    this.cd.detectChanges();
    this.checkScrollTable();
  }

  public onRowSelect(row, rowIndex, group?, groupIndex?) {
    if (group) {
      this.rowSelect.emit({ row, rowIndex, group, groupIndex });
    } else {
      this.rowSelect.emit({ row, rowIndex });
    }
  }
  public onScroll(position: number) {
    this.scrollLeft = -1 * position;
    this.cd.detectChanges();
  }

  private setCurrentSort(col, sort) {
    this.currentSort = {
      col: col,
      type: sort
    };
    this.columns = this.columns.map(column => {
      if (col.trackBy === column.trackBy) {
        column.sort = this.currentSort.type;
      } else {
        column.sort = undefined;
      }
      return column;
    });
  }

  private pagingDataOnClient(page: number, data: any[]): any[] {
    const _page = data.length / this.pageSize < page - 1 ? 1 : page;
    this.page$.next(_page);
    const newDatas = data.slice((_page * this.pageSize) - this.pageSize, _page * this.pageSize);
    return [...newDatas];
  }

  private sortColumnByChildren(datas: any[], col: GoTableColumn, type: 'ASC' | 'DESC'): any[] {
    if (col.isDate) {
      const groups: GoGroupTableData[] = [...datas].map((group: GoGroupTableData) => {
        const children = ArrayUtils.sortArrayByDate(group.children, type, col.dateFormat, col.trackBy);

        return {
          ...group,
          children: [...children]
        };
      });

      return groups;
    }

    const groupData = [...datas].map((group: GoGroupTableData) => {
      const children = _.orderBy(group.children, [col.trackBy], [type.toLowerCase()]);

      return {
        ...group,
        children: [...children]
      };
    });
    return groupData;
  }

  private sortColumn(datas: any[], col: GoTableColumn, type: 'ASC' | 'DESC') {
    if (col.isDate) {
      const sortDate = ArrayUtils.sortArrayByDate([...datas], type, col.dateFormat, col.trackBy);
      return sortDate;
    }

    const items = _.orderBy([...datas], [col.trackBy], [type.toLowerCase()]);
    return items;
  }



  private checkScrollTable() {
    if (this.tableContent) {
      const offsetHeight = this.tableContent.nativeElement.offsetHeight;
      const scrollHeight = this.tableContent.nativeElement.scrollHeight;
      if (offsetHeight < scrollHeight) {
        this.isShowingScroll = true;
      } else {
        this.isShowingScroll = false;
      }
      console.log("isShowingScroll", this.isShowingScroll);
      this.cd.detectChanges();
    }
  }

  private formatToToolPanelColumns(columns: GoTableColumn[]): ToolPanelColumns[] {
    return columns.filter(e => e.trackBy).map(e => {
      return {
        id: e.trackBy,
        name: e.name,
        visible: true
      } as ToolPanelColumns
    })
  }
}
