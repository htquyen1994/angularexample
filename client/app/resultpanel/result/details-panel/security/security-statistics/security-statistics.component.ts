import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GoTableColumn } from '@periscope-lib/table/table.model';

@Component({
  selector: 'ps-security-statistics',
  templateUrl: './security-statistics.component.html',
  styleUrls: ['./security-statistics.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SecurityStatisticsComponent implements OnInit {
  @Input() set data(value) {
    this.data$.next(value);
    this.loading$.next(false);
  }
  data$ = new BehaviorSubject<any>(null);
  loading$ = new BehaviorSubject<boolean>(true);
  crimeStatisticsHeaders: GoTableColumn[] = [
    { name: 'Crime Statistics', trackBy: 'description', class: 'w-40' },
    { name: '1 mi', trackBy: 'count1Mile',  class: 'w-15' },
    { name: '3 mi', trackBy: 'count3Mile', class: 'w-15' },
    { name: '5 mi', trackBy: 'count5Mile',  class: 'w-15'},
    { name: '10 mi', trackBy: 'count10Mile', class: 'w-15' }
  ];
  calculatedDataHeaders: GoTableColumn[] = [
    { name: 'Calculated Data', trackBy: 'description', class: 'w-55' },
    { name: 'Factor', trackBy: 'factor', class: 'w-15' },
    { name: 'Weight', trackBy: 'weight', class: 'w-15' },
    { name: 'Index', trackBy: 'index', class: 'w-15' }
  ];
  constructor() { }

  ngOnInit(): void {
  }

}
