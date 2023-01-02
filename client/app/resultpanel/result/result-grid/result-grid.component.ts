import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ElementRef, ViewChildren } from '@angular/core';
import { Subscription, BehaviorSubject, combineLatest, merge, Subject, ReplaySubject } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import {
  ActionMessageService, AppInsightsService,
  FilterService,
  LayerDataService,
  AccountService,
  MapService,
  OverlayService,
  SelectionService,
  PanelService
} from '../../../shared';
import { TabName } from '../../../shared/models/resultpanel.model';
import { ILayer, ILayerColumn, IFilter, ISelection, ILayerData, ILabelStyleChange } from '../../../shared/interfaces';
import { ILayerColumnType } from '../../../shared/enums';
import { decorateError } from '../../../shared/http.util';
import { LabelService } from 'src/client/app/shared/services/label.service';

interface IColumnDef {
  id: string;
  type: ILayerColumnType,
  name: string;
  isIdentifier: boolean,
  isPercentage: boolean,
  formatPipe: string,
  format: string[],
  // width: number;
  align: string,
  groupId: number
}
@Component({
  selector: 'go-result-grid',
  moduleId: module.id,
  templateUrl: 'result-grid.component.html',
  styleUrls: ['result-grid.component.less']
})
export class ResultGridComponent implements OnInit, OnDestroy {
  @ViewChild('tableWrapScroll') tableWrapScroll: ElementRef;
  @ViewChild('tableWrapper') tableWrapper: ElementRef;
  @Input() isShowGroup: boolean = false;
  @Input()
  set layer(layer: ILayer) {

    if (layer) {
      this.rowSelected = this.selectionService.selectionStore.get(layer.id) || new Set<string>();
      this.rowActive = this.selectionService.getLayerActiveShapeId(layer.id);
      this.pageNumber = 0;
      this.pageNumberNext = 2;
    }

    this.layerInput = layer ? Object.assign({}, layer) : null;

    if (this.layerInput) {
      let activeFilter = this.filterService.filterActiveStore[this.layerInput.id];

      if (!activeFilter) {
        if (this.filterService.filterListStore[this.layerInput.id] && this.filterService.filterListStore[this.layerInput.id][0]) {
          activeFilter = this.filterService.filterListStore[this.layerInput.id][0];
        } else {
          activeFilter = null;
        }
      }
      if (activeFilter) {
        this.sortColumnId = activeFilter.sortColumn;
        this.sortDirectionASC = activeFilter.sortDirection === 'ASC';

      }

      this.filterInput = activeFilter;
      this.updateGridColumns();
    }
    this.records = null;
    this.updateData();
  }

  @Input()
  set pinSelected(pinSelected: boolean) {
    this.pinSelectedInput = pinSelected;
    this.pageNumber = 0;
    this.pageNumberNext = 2;
    this.updateData();
  }

  @Input()
  set filterByMap(filterByMap: boolean) {
    this.filterByMapInput = filterByMap;
    this.pageNumber = 0;
    this.pageNumberNext = 2;
    this.updateData();
  }

  @Output() openShape = new EventEmitter<string>();

  thWapperwidth(index) {
    return this.columnDef[index] && this.columnDef[index]['thWapperwidth'] ? this.columnDef[index]['thWapperwidth'] + 'px' : 'unset';
  }

  thwidth(index) {
    return this.columnDef[index] && this.columnDef[index]['thwidth'] ? this.columnDef[index]['thwidth'] + 'px' : 'unset';
  }

  tdwidth(index) {
    return this.columnDef[index] && this.columnDef[index]['tdwidth'] ? this.columnDef[index]['tdwidth'] + 'px' : 'unset';
  }
  thWapperWidthGroup(index) {
    return this.groupDef[index] && this.groupDef[index]['width'] ? this.groupDef[index]['width'] + 'px' : 'unset';
  }

  scrollLeft = 0;
  layerInput: ILayer;
  filterInput: IFilter;
  layerColumnType = ILayerColumnType;
  pageNumberNext = 0;
  identifierColumn: string;
  isLoading = false;
  disabled = false;
  columnDef: IColumnDef[] = [];
  groupDef: {
    index: number,
    name: string,
    columns: IColumnDef[]
  }[] = [];
  records: ILayerData = null;

  sortColumnId: string = null;
  sortDirectionASC: boolean = null;

  selectedSum: number = null;
  selectedSumSubscription: Subscription = null;
  labelColumnId: string = null;
  showSelectedOnly: boolean = false;
  settingWidth$ = new BehaviorSubject<boolean>(false);
  countLoading$ = new BehaviorSubject<boolean>(false);
  count: number = 0;
  private pinSelectedInput: boolean;

  private filterByMapInput: boolean;

  rowSelected: Set<string> = new Set<string>();
  rowActive: string;
  hasMaxDownload: boolean = false;
  pageNumber = 0;
  maxPages = 0;
  // private tableWidth = 0;
  visibilityHidden: string = 'hidden';
  setTimeout: any;

  updateData$ = new ReplaySubject<any>(1);
  isUpdateCount = true;
  private selectionServiceSubscription: Subscription;
  private layerDataSubscription: Subscription;
  private mapBoundsChangeSubscription: Subscription;
  private mapZoomChangeSubscription: Subscription;
  private filterSubscription: Subscription;
  private resultPanelActiveSubscription: Subscription;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(private layerDataService: LayerDataService,
    private selectionService: SelectionService,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private actionMessageService: ActionMessageService,
    private filterService: FilterService,
    private applicationInsightsService: AppInsightsService,
    private overlayService: OverlayService,
    private mapService: MapService,
    private panelService: PanelService,
    private labelService: LabelService) {

     this.accountService.account.subscribe(account => {
            this.hasMaxDownload = account.hasMaxDownload;
        });


    this.mapService.showSelectedOnly.subscribe(value => {
      if (this.showSelectedOnly == value) {
        return;
      }
      this.showSelectedOnly = value;
      if (this.showSelectedOnly) {
        this.pageNumber = 0;
        this.pageNumberNext = 2;
      }
      this.updateData();
      this.changeDetectorRef.detectChanges();
    })
  }

  ngOnInit() {
    this.selectionServiceSubscription = this.selectionService.selection.subscribe((selection: ISelection) => {
      if (this.layerInput && selection.overlayId === this.layerInput.id) {
        this.rowSelected = this.selectionService.selectionStore.get(selection.overlayId);
        this.updateSelectedSum();
        this.changeDetectorRef.detectChanges();
      }
    });

    this.selectionServiceSubscription = this.selectionService.selection.pipe(
      filter(e => !e.overlayId.startsWith('__')),
      debounceTime(500)
    ).subscribe((selection: ISelection) => {
      if (this.pinSelectedInput && this.layerInput && selection.overlayId === this.layerInput.id) {
        this.updateData();

        this.changeDetectorRef.detectChanges();
      }
    });

    this.selectionService.active.subscribe((selection: ISelection) => {
      if (this.layerInput && selection.overlayId === this.layerInput.id) {
        this.rowActive = this.selectionService.getLayerActiveShapeId(selection.overlayId);
        this.changeDetectorRef.detectChanges();
      }
    });

    this.filterSubscription = this.filterService.filter.subscribe(filterChange => {
      if (this.layerInput && filterChange.layerId === this.layerInput.id) {
        this.filterInput = filterChange.filter;
        this.sortColumnId = this.filterInput.sortColumn;
        this.sortDirectionASC = this.filterInput.sortDirection === 'ASC';
        this.updateGridColumns();
        this.updateData();
        this.changeDetectorRef.detectChanges();
      }
    });

    this.layerDataService.layerDataCount.subscribe(data => {
      if (!data) return;
      const { isLoading, count } = data;
      this.countLoading$.next(isLoading);
      this.count = count;
      this.maxPages = Math.ceil(count / 25);
      this.changeDetectorRef.detectChanges();
    })

    this.layerDataService.layerData.subscribe(
      records => {
        if (this.setTimeout) clearTimeout(this.setTimeout);
        if (!records.results) return;
        this.setTimeout = setTimeout(() => {
          this.records = records;
          if (!records.notSetWidth && this.records.results && this.records.results.length) {
            this.refreshTable();
          }
          this.setTimeout = null;
          this.changeDetectorRef.detectChanges();
        });
      },
      () => {
        this.changeDetectorRef.detectChanges();
      });

    this.mapZoomChangeSubscription = merge(
      this.mapService.zoom,
      this.mapService.mapBoundsChange
    ).pipe(debounceTime(100)).subscribe(() => {
      this.onFilterByMapInput();
    })
    this.labelService.styleChange.subscribe((data: ILabelStyleChange) => {
      if (this.layerInput && data.overlayId === this.layerInput.id) {
        this.labelColumnId = data.style ? data.style.columnName : null;
        this.updateSelectedSum();
      }
    })


    this.updateData$.pipe(debounceTime(500),takeUntil(this.unsubscribe$)).subscribe(()=>{
      if (this.layerInput && this.filterInput && this.disabled === false) {
        this.isLoading = true;
        this.changeDetectorRef.detectChanges();
        this.layerDataSubscription = this.layerDataService.getLayerData(this.layerInput, this.filterInput, this.filterByMapInput,
          this.pinSelectedInput, this.pageNumber, 25, this.sortColumnId, this.sortDirectionASC, this.showSelectedOnly, this.isUpdateCount)
          .subscribe(
            data => {
              this.isLoading = false;
              this.changeDetectorRef.detectChanges();
            },
            error => {
              this.isLoading = false;
              $(this.tableWrapScroll.nativeElement).animate({ 'scrollLeft': Math.abs(this.scrollLeft) * -1 }, 0);
              this.actionMessageService.sendError(decorateError(error).error.message);
              this.changeDetectorRef.detectChanges();
            });
      }
      if(this.isUpdateCount){
        this.isUpdateCount = false;
      }
    })
  }

  ngOnDestroy() {
    this.selectionServiceSubscription.unsubscribe();
    this.layerDataSubscription.unsubscribe();
    this.mapBoundsChangeSubscription.unsubscribe();
    this.mapZoomChangeSubscription.unsubscribe();
    this.filterSubscription.unsubscribe();
    this.resultPanelActiveSubscription.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  updateSelectedSum() {

    if (this.selectedSumSubscription) {
      this.selectedSumSubscription.unsubscribe();
    }

    const column = this.layerInput.columns.find(x => x.id === this.labelColumnId);

    if (this.rowSelected.size === 0) {
      this.selectedSum = null;
    } else if (column && column.type === ILayerColumnType.NUMBER) {
      this.selectedSumSubscription = this.layerDataService.getLayerDataSelectedRecords(this.layerInput)
        .subscribe(data => {
          this.selectedSum = data.results.reduce((a, b) => a += b[this.labelColumnId], 0);
          this.changeDetectorRef.detectChanges();
        });
    } else {
      this.selectedSum = null;
    }

  }

  updateGridColumns() {
    if (this.layerInput && this.filterInput) {
      this.settingWidth$.next(true);
      const col = this.layerInput.columns.find(column => column.isIdentifier);
      this.identifierColumn = col ? col.id : '';
      this.columnDef = [];
      this.groupDef = [];
      this.filterInput.displayColumns.forEach(columnId => {
        const column = this.layerInput.columns.find(_ => _.id === columnId);
        if (!column) {
          return null;
        }

        const name = column.name;

        let align = 'left';
        if (column.name.indexOf(' Decile') !== -1) {
          align = 'right';
        }

        switch (column.type) {
          case ILayerColumnType.NUMBER:
          case ILayerColumnType.FLOAT:
            align = 'right';
            break;
        }
        let format;
        let formatPipe;
        if (column.format) {
          formatPipe = column.format[0];
          format = column.format.slice(1);
        } else if (column.type === ILayerColumnType.DATE) {
          formatPipe = 'date';
          format = ['dd/MM/yyyy'];
        } else if (!column.isIdentifier) {
          if (column.isPercentage) {
            formatPipe = 'percent_100';
            format = ['1.1-1'];
          }else if (column.isUrlFormatted){
            formatPipe = 'innerHTML';
            format = ['url'];
          } else if (column.type === ILayerColumnType.NUMBER) {
            formatPipe = 'number';
            format = [];
          } else if (column.type === ILayerColumnType.FLOAT) {
            formatPipe = 'number';
            format = ['1.1-2'];
          }
        }

        let _column = {
          id: columnId,
          type: column.type,
          isIdentifier: column.isIdentifier,
          isPercentage: column.isPercentage,
          formatPipe: formatPipe ? formatPipe : null,
          format: format ? format : null,
          name: name,
          align: align,
          groupId: column.groupId
        }
        const groupId = column.groupId;
        let groupIndex = this.groupDef.findIndex(e => e.index == groupId);
        if (groupIndex == -1) {
          const _group = this.layerInput.columnGroups.find(e => e.Index == groupId);
          this.groupDef.push({
            index: groupId,
            name: _group.Name,
            columns: []
          })
          this.groupDef[this.groupDef.length - 1].columns.push(_column);
        } else {
          this.groupDef[groupIndex].columns.push(_column);
        }
        this.columnDef.push(_column);
      });
    }
  }

  updateData(isUpdateCount = true) {
    if (this.layerDataSubscription) {
      this.isLoading = false;
      this.layerDataSubscription.unsubscribe();
    }
    if(isUpdateCount) {
      this.isUpdateCount = true;
    }
    this.updateData$.next();
  }

  downloadData(data: { selectionType: string, fileType: string }, isShowGroup: boolean) {
    if (this.layerInput && this.filterInput) {
      let pageNumber = 0;
      let pageSize = 25;
      let selectedId: string[] = [];
      let isPinned = false;

      isPinned = this.pinSelectedInput;
      if (data.selectionType === '2') {
        const select = this.selectionService.selectionStore.get(this.layerInput.id);
        if (select) {
          selectedId = Array.from(select.values());
        }
        isPinned = true;
        pageSize = selectedId.length;

      } else if (data.selectionType === '3') {
        const allFiltered = true;
        pageSize = (this.hasMaxDownload) ? 250000 : 25000;
      }

      return this.layerDataService.downloadData(this.layerInput, this.filterInput, this.filterByMapInput,
        isPinned, pageNumber, pageSize, data.fileType === '1', data.fileType === '2', isShowGroup);
    }
  }

  onRowSelect(row: any) {
    const idColumn = this.layerInput.columns.find(column => column.isIdentifier).id;
    const shapeId = row[idColumn];

    this.selectionService.changeSelection({
      isAdd: !this.rowSelected.has(shapeId),
      overlayId: this.layerInput.id,
      shapeId: shapeId.toString()
    });
  }

  viewRecord(row: any) {
    const idColumn = this.layerInput.columns.find(column => column.isIdentifier).id;
    const shapeId = row[idColumn];

    console.log(shapeId);
    this.openShape.emit(shapeId);
  }

  onPreviousPage() {
    if (this.pageNumber >= 1) {
      --this.pageNumber;
      this.pageNumberNext = this.pageNumber + 2;
      this.updateData(false);
      this.applicationInsightsService.logEvent('Layer Data Tab', 'Previous Page', '');
    }
  }

  onNextPage() {
    if (this.maxPages >= this.pageNumberNext && this.pageNumber != this.pageNumberNext - 1) {
      this.pageNumber = this.pageNumberNext - 1;
      this.pageNumberNext = Math.min(this.pageNumber + 2, this.maxPages);
      this.updateData(false);
      this.applicationInsightsService.logEvent('Layer Data Tab', 'Go To Page', '');
    }
  }

  onScroll(position: number) {
    this.scrollLeft = -1 * position;
    this.changeDetectorRef.detectChanges();
  }

  onSortColumn(column: ILayerColumn) {
    this.sortColumnId = column.id;
    this.sortDirectionASC = !this.sortDirectionASC;
    this.updateData(true);
  }

  setWidthGroupHeader() {
    this.groupDef.forEach(group => {
      group['width'] = group.columns.map(e => e['thWapperwidth']).reduce((a, b) => {
        return a + b;
      })
    })
    let headerGroupsArray: any[] = Array.from(this.tableWrapper.nativeElement.querySelectorAll('.header-groups .header-cell'));
    headerGroupsArray.splice(0, 1);
    headerGroupsArray.forEach((element, index) => {
      const realWidth = element.offsetWidth;
      if (realWidth > this.groupDef[index]['width']) {
        let ratioOfColumns = this.groupDef[index].columns.map(e => e['thWapperwidth'] / this.groupDef[index]['width']);
        let diferWidth = realWidth - this.groupDef[index]['width'];
        this.groupDef[index].columns.forEach((col, i) => {
          col['thWapperwidth'] = Math.ceil(diferWidth * ratioOfColumns[i] + col['thWapperwidth']);
          col['tdwidth'] = Math.ceil(diferWidth * ratioOfColumns[i] + col['tdwidth']);
        })
        this.groupDef[index]['width'] = this.groupDef[index].columns.map(e => e['thWapperwidth']).reduce((a, b) => {
          return a + b;
        })
      }
    })
  }

  refreshTable() {
    this.settingWidth$.next(true);
    this.changeDetectorRef.detectChanges();
    let headerTable = this.tableWrapper.nativeElement.querySelector('.header-body .table-wrap_header');
    let bodyTable = this.tableWrapper.nativeElement.querySelector('.table-wrap-scroll .table-wrap_body');
    let header = headerTable.querySelector('thead');
    let body = bodyTable.querySelector('tbody');
    let header_clone = header.cloneNode(true);
    let body_clone = body.cloneNode(true);
    // this.addClass(header_clone, 'visibility-collapse');
    // this.addClass(body_clone, 'visibility-collapse');
    let oldbodyClone = headerTable.querySelector('tbody');
    let oldheaderClone = bodyTable.querySelector('thead');
    if (oldbodyClone) {
      headerTable.removeChild(oldbodyClone);
    }
    if (oldheaderClone) {
      bodyTable.removeChild(oldheaderClone);
    }
    bodyTable.appendChild(header_clone);
    headerTable.appendChild(body_clone);
    this.settingWidth$.next(false);
    this.changeDetectorRef.detectChanges();
    this.scrollToSortCollumn();
  }

  scrollToSortCollumn() {
    if (this.tableWrapScroll && this.tableWrapScroll.nativeElement) {
      let scrollLeft = Math.abs(this.scrollLeft);
      if (this.sortColumnId) {
        let el = this.tableWrapScroll.nativeElement.querySelector('[data-columnId="' + this.sortColumnId + '"]')
        if (el && (el.offsetLeft + el.offsetWidth) > this.tableWrapper.nativeElement.offsetWidth) {
          let _scrollLeft = el.offsetLeft + el.offsetWidth - this.tableWrapper.nativeElement.offsetWidth;
          if (scrollLeft < _scrollLeft) {
            scrollLeft = _scrollLeft;
          }
        }
        if (!el) {
          scrollLeft = 0;
        }
      }
      let table_wapper = this.tableWrapScroll.nativeElement.querySelector('.table-wrap');
      if (table_wapper && table_wapper.offsetWidth < this.tableWrapper.nativeElement.offsetWidth) {
        scrollLeft = 0;
      }
      if(scrollLeft == 0) {
        this.scrollLeft = scrollLeft
      }else{
        this.scrollLeft = -scrollLeft;
      }
      this.tableWrapScroll.nativeElement.scrollLeft = scrollLeft;
    } else {
      this.scrollLeft = 0;
    }
  }
  onFilterByMapInput() {
    if (this.filterByMapInput) {
      this.updateData();
      this.changeDetectorRef.detectChanges();
    }
  }
}
