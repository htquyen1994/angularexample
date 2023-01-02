import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ViewChild, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label, BaseChartDirective, ThemeService } from 'ng2-charts';
import { BehaviorSubject } from 'rxjs';
@Component({
  selector: 'ps-pipe-chart',
  templateUrl: './pipe-chart.component.html',
  styleUrls: ['./pipe-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PipeChartComponent implements OnInit {
  loading$ = new BehaviorSubject<boolean>(false);
  isChartReady: boolean = false;
  @Input() set loading(value: boolean) {
    this.loading$.next(value)
  };
  @Input() set data(value: ChartDataSets[]) {
    if (!value) return;
    if (!value.length) return;
    this.chartData = [...value];
    this.update();
  }
  @Input() set labels(value: Label[]) {
    if (!value) return;
    if (!value.length) return;
    this.chartLabels = [...value];
    this.update();
  }
  @Input() customClickLegend = true
  @Input() options: ChartOptions = {};
  @Output() onClickLegend = new EventEmitter<any>();

  public chartData: ChartDataSets[];
  public chartLabels: Label[];
  public chartOptions: ChartOptions;
  @Input() public chartColors: Color[];
  // = [
  //   {
  //     borderColor: 'black',
  //     backgroundColor: 'rgba(255,0,0,0.3)',
  //   },
  // ];
  public chartLegend = true;
  @Input() public chartType: ChartType = 'pie';
  public chartPlugins = [];
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
    this.chartOptions = {
      ...this.options,
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        onClick: (event, legendItem) => this.onClickLegend.next({ event, legendItem }),
        position: "right"
      },
      plugins: {
        ...this.options.plugins,
        ...plugins
      }
    };
    if (!this.customClickLegend) {
      delete this.chartOptions.legend.onClick
    }
    this.isInit = true;
    this.update();
  }

  update() {
    if (this.chartData && this.chartLabels && this.isInit) {
      this.isChartReady = true;
      this.cd.detectChanges();
      this.chart.update();
    }
  }

}
