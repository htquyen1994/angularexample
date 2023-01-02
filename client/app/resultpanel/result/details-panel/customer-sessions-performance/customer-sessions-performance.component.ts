import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Subscription, ReplaySubject } from 'rxjs';
import { ActionMessageService, AppInsightsService, GOOGLE_SCHEME } from 'src/client/app/shared';
import { CustomerSessionPerformanceService } from '../../../shared/services/customer-sessions-performance.service';
import { IGroup, IGroup_Detail } from '../../../shared/models/detail-panel.model';
import { decorateError } from 'src/client/app/shared/http.util';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Label, Color } from 'ng2-charts';
@Component({
  selector: 'ps-customer-sessions-performance',
  templateUrl: './customer-sessions-performance.component.html',
  styleUrls: ['./customer-sessions-performance.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CustomerSessionsPerformanceComponent implements OnInit {
  @Input('fadCode') set _fadCode(value: string){
    if (this.isInit && this.fadCode != value) {
      this.fadCode = value;
      this.getData();
    } else {
      this.fadCode = value;
    }
  };
  fadCode: string;
  data$ = new BehaviorSubject<IGroup[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  groupCollapse: any = { 0: true };
  dataChart$ = new BehaviorSubject<ChartDataSets[]>(null);
  labels$ = new BehaviorSubject<Label[]>(null);
  graphData: {
    data: ChartDataSets[],
    labels: Label[]
  } = {
      data: [],
      labels: []
    }
  nationalAveragesData: { [key: string]: number } = {};
  chartOptions: ChartOptions = {
    tooltips: {
      callbacks: {
        label: function (context, data) {
          const {datasetIndex, index} = context;
          const {datasets, labels } = data;
          let label = `${labels[index]}(${datasets[datasetIndex].label}): ${datasets[datasetIndex].data[index]}`;

          return label;
        }
      }
    },
  }


  chartColors = GOOGLE_SCHEME;
  isInit = false;
  constructor(
    private cd: ChangeDetectorRef,
    private customerSessionPerformanceService: CustomerSessionPerformanceService,
    private applicationInsightsService: AppInsightsService
  ) { }

  ngOnInit() {
    this.isInit = true;
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'Performance');
    this.getData();
  }

  getData() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.loading$.next(true);
    this.cd.detectChanges();
    this.subscription = this.customerSessionPerformanceService.getCustomerSessionsPerformance(this.fadCode).subscribe(_data => {
      this.data$.next(this.decorateData(_data || []));
      this.loading$.next(false);
      this.cd.detectChanges();
    }, err => {
      // this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
      this.cd.detectChanges();
    })
  }

  onToggle(index) {
    if (this.groupCollapse[index]) {
      this.groupCollapse[index] = !this.groupCollapse[index];
    } else {
      this.groupCollapse = {};
      this.groupCollapse[index] = true;
    }
    this.cd.detectChanges();
  }

  private decorateData(_data: any[]): IGroup[] {
    const data: IGroup[] = [];
    _data.forEach(item => {
      const { title, value, section } = item;
      if (section == 'Product Mix') {
        const groupIndex = data.findIndex(e => e.name == 'Product Mix');
        if (groupIndex != -1) {
          data[groupIndex].details.push({
            name: title,
            value: Number.parseFloat(value)
          })
        } else {
          const group: IGroup = {
            name: section,
            details: [{
              name: title,
              value: Number.parseFloat(value)
            }]
          }
          data.push(group);
        }
      }
      if (section == 'Product Mix National Averages') {
        this.nationalAveragesData[title] = value ? Number.parseFloat(value) : undefined;
      }
    })
    const product_mix = data.find(e => e.name === 'Product Mix');
    let product_mix_chart: { data: ChartDataSets[], labels: Label[] } = { labels: [], data: [] };
    let product_mix_national_averages_chart: { data: ChartDataSets[], labels: Label[] } = { labels: [], data: [] };
    if (product_mix) {
      Object.keys(this.nationalAveragesData).forEach((key,index)=>{//handle no data (national lottery)
        const _index = product_mix.details.findIndex(e=>e.name == key);
        if(_index === -1){
          product_mix.details.splice(index, 0, {name: key, value: undefined})
        }
      })
      product_mix_chart = this.decorateChartData(product_mix.details, 'Product Mix');
    }
    if (Object.keys(this.nationalAveragesData).length) {
      product_mix_national_averages_chart = this.decorateChartData(Object.keys(this.nationalAveragesData).map((key: string) => ({
        name: key,
        value: this.nationalAveragesData[key]
      })), 'National Averages');
    }
    if (product_mix_chart || product_mix_national_averages_chart) {
      this.graphData = {
        labels: product_mix_chart.labels,
        data: [...product_mix_chart.data, ...product_mix_national_averages_chart.data]
      }
      this.nextGraphData();
    }
    return [...data];
  }

  private nextGraphData() {
    this.dataChart$.next(this.graphData.data);
    this.labels$.next(this.graphData.labels);
    this.cd.detectChanges();
  }

  private decorateChartData(data: IGroup_Detail[], name: string): { data: ChartDataSets[], labels: Label[] } {
    const labels: Label[] = [];
    const charData: number[] = [];
    data.forEach(e => {
      labels.push(e.name);
      charData.push(Number.parseFloat(<string>e.value));
    })
    return {
      labels,
      data: [{ data: [...charData], label: name }],
    }
  }

}
