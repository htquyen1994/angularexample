import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ViewChild, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label, BaseChartDirective } from 'ng2-charts';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'ps-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LineChartComponent implements OnInit {
  loading$ = new ReplaySubject<boolean>(1);
  isChartReady: boolean = false;
  @Input() set loading(value: boolean) {
    this.loading$.next(value)
  };
  @Input() set data(value: ChartDataSets[]) {
    if (!value) return;
    if (!value.length) return;
    this.lineChartData = [...value];
    this.update();
  }
  @Input() set labels(value: Label[]) {
    if (!value) return;
    if (!value.length) return;
    this.lineChartLabels = [...value];
    this.update();
  }
  @Input() customClickLegend = true
  @Input() options: ChartOptions = {}
  @Input() public chartColors: Color[];
  @Output() onClickLegend = new EventEmitter<any>();
  @Output() onClick = new EventEmitter<any>();
  public lineChartData: ChartDataSets[];
  public lineChartLabels: Label[];
  public lineChartOptions: ChartOptions;
  // = [
  //   {
  //     borderColor: 'black',
  //     backgroundColor: 'rgba(255,0,0,0.3)',
  //   },
  // ];
  public lineChartLegend = true;
  public lineChartType: ChartType = 'line';
  public lineChartPlugins = [];
  private isInit = false;
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  constructor(private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    const plugins = this.chartColors ? {
      colorschemes: {
        scheme: this.chartColors
      }
    } : undefined;
    this.lineChartOptions = {
      ...this.options,
      responsive: true,
      maintainAspectRatio: false,
      legend: this.customClickLegend ? {
        onClick: (event, legendItem) => this.onClickLegend.next({ event, legendItem })
      } : {},
      plugins,
      onClick: (event, activeElement) => this.onClick.next({ event, activeElement, datasets: this.lineChartData })
    };
    this.isInit = true;
    this.update();
  }

  update() {
    if (this.lineChartData && this.lineChartLabels && this.isInit) {
      this.isChartReady = true;
      this.cd.detectChanges();
      this.chart.update();
    }
  }

}
