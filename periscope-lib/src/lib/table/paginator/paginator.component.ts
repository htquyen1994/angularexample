import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { Indicator } from './indicator.model';

@Component({
  selector: 'periscope-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent implements OnInit {
  public indicators$: Observable<Indicator[]>;
  public selectedPage: number;
  private totalPages: number;
  private readonly pageSize$ = new BehaviorSubject<number>(5);
  private readonly page$ = new BehaviorSubject<number>(1);
  private readonly total$ = new ReplaySubject<number>(1);

  get currentPage(): number {
    return this.page$.value;
  }

  @Input() set page(value: number) {
    this.page$.next(value || 1);
  }

  @Input() set pageSize(value: number) {
    this.pageSize$.next(value || 5);
  }

  @Input() set total(value: number) {
    this.total$.next(value);
  }

  @Output() public pageChange = new EventEmitter<number>();

  public ngOnInit(): void {
    this.indicators$ = combineLatest(this.pageSize$, this.total$, this.page$).pipe(
      switchMap(([pageSize, total, page]) => of(this.generateIndicators(pageSize, page, total))),
      shareReplay(1)
    );
  }

  private generateIndicators(pageSize: number, page: number, total = 0): Indicator[] {
    this.totalPages = Math.ceil(total / pageSize);

    if (this.totalPages < 2) {
      return [];
    } else if (this.totalPages < 8) {
      return new Array(this.totalPages)
        .fill(undefined, 0, this.totalPages)
        .map((_, index) => ({ type: 'page', page: index + 1 }));
    } else {
      const distanceToHideMore = 3;
      const selectedPage = page;
      const hasLeft = selectedPage >= 1 + distanceToHideMore;
      const hasRight = selectedPage <= this.totalPages - distanceToHideMore;
      const left = hasLeft ? [{ type: selectedPage - 1 === distanceToHideMore ? 'page' : 'more', page: 2 }] : [];
      const right = hasRight
        ? [{ type: this.totalPages - selectedPage === distanceToHideMore ? 'page' : 'more', page: this.totalPages - 1 }]
        : [];
      const center = [selectedPage - 1, selectedPage, selectedPage + 1]
        .filter(it => it > 1 && it < this.totalPages)
        .map(it => ({ type: 'page', page: it }));

      return [
        { type: 'page', page: 1 },
        ...left,
        ...center,
        ...right,
        { type: 'page', page: this.totalPages }
      ] as Indicator[];
    }
  }

  public goToPage(): void {
    const selectedPage = Number(this.selectedPage);

    if (
      !isNaN(selectedPage) &&
      selectedPage !== this.currentPage &&
      selectedPage > 0 &&
      selectedPage <= this.totalPages
    ) {
      this.changeSelectedPage(selectedPage);
    }
  }

  public changeSelectedPage(pageNumber: number): void {
    this.pageChange.emit(pageNumber);
    this.page$.next(pageNumber);
  }
}
