import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ChangeDetectorRef, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import * as moment from 'moment';
import { ReplaySubject, Subscription } from 'rxjs';
import { ChartDataSets, ChartPoint, ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts/public_api';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { ActionMessageService, MINDATE, MAXDATE, AppInsightsService } from 'src/client/app/shared';
import { CustomerSessionsByKitService } from '../../../shared/services/customer-sessions-by-kit.service';
import * as _ from 'lodash';
import { decorateError } from 'src/client/app/shared/http.util';
import { LineChartComponent } from '@periscope-lib/chart/line-chart/line-chart.component';

@Component({
  selector: 'ps-customer-sessions-by-kit',
  templateUrl: './customer-sessions-by-kit.component.html',
  styleUrls: ['./customer-sessions-by-kit.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CustomerSessionsByKitComponent implements OnInit {
  @ViewChild('lineChart') lineChart: LineChartComponent;
  @ViewChild('tooltipEl') tooltipEl: ElementRef;
  @Input('fadCode') set _fadCode(value: string){
    if (this.form && this.fadCode != value) {
      this.fadCode = value;
      this.onUpdate();
    } else {
      this.fadCode = value;
    }
  };
  fadCode: string;
  form: FormGroup;
  data$ = new ReplaySubject<ChartDataSets[]>(1);
  labels$ = new ReplaySubject<Label[]>(1);
  graphData: {
    data: ChartDataSets[],
    labels: Label[]
  } = {
      data: [],
      labels: []
    }
  loading$ = new ReplaySubject<boolean>(1);
  subscription: Subscription;
  minDate = MINDATE
  maxDate = MAXDATE
  chartOptions: ChartOptions = {
    tooltips: {
      mode: 'point',
      intersect: true,
      // Disable the on-canvas tooltip
      enabled: false,
      // custom: this.customTooltip.bind(this),
    },
    // events: ['click'],
    onResize: this.onResizeChart.bind(this)
  }
  mindate: string;
  maxdate: string;
  onlyShowKits: boolean;
  subscriptionGetCSKitSummary: Subscription;
  clickListenerFn: () => void;
  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private customerSessionsByKitService: CustomerSessionsByKitService,
    private actionMessageService: ActionMessageService,
    private applicationInsightsService: AppInsightsService,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'By Kit');
    this.innitForm();
    this.onUpdate();
    this.clickListenerFn = this.renderer.listen(document, 'click', (e) => {
      this.tooltipEl.nativeElement.style.display = 'none';
    })
  }
  ngOnDestroy() {
    if (this.clickListenerFn) {
      this.clickListenerFn();
    }
  }

  private innitForm() {
    const today = new Date();
    const minDate = moment(today).subtract(2, 'year').toISOString().slice(0, 10);
    const maxDate = moment(today).toISOString().slice(0, 10);
    this.form = this.fb.group({
      mindate: [minDate, Validators.required],
      maxdate: [maxDate, Validators.required],
      onlyShowKits: [false]
    })
    this.form.get('onlyShowKits').valueChanges.subscribe(() => {
      this.onUpdate();
    })
  }

  private addGraphData(data, labels) {
    this.graphData.data = [
      ...this.graphData.data,
      ...data
    ];
    this.graphData.labels = [
      ...this.graphData.labels,
      ...labels
    ];
  }
  private decorateData(responeData: { [key: string]: any }[]): { data: ChartDataSets[], labels: Label[] } {
    const data: ChartDataSets[] = [];
    const labels: Label[] = [];
    [...responeData].forEach(_item => {
      const item = { ..._item }
      const { Label } = item;
      labels.push(Label);
      delete item.Label;
      const keys = Object.keys(item);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const value = item[key];
        const chartPoint: ChartPoint = {
          x: Label,
          y: value
        }
        const _index = data.findIndex(e => e.label == key);
        if (_index == -1) {
          data.push({ label: key, data: [chartPoint] });
        } else {
          (data[_index].data as ChartPoint[]).push(chartPoint);
        }
      }
    })
    return { data, labels };
  }

  private resetGraphData() {
    this.graphData = {
      data: [],
      labels: []
    };
  }

  onUpdate() {
    const { mindate, maxdate, onlyShowKits } = this.form.getRawValue();
    const _mindate = moment(mindate).add(moment(mindate).utcOffset() * 60).format('DD-MM-YYYY');
    const _maxdate = moment(maxdate).add(moment(maxdate).utcOffset() * 60).format('DD-MM-YYYY');
    this.resetGraphData();
    this.getGraphData(this.fadCode, _mindate, _maxdate, onlyShowKits);
  }

  getGraphData(fadCode: string, mindate: string, maxdate: string, onlyShowKits: boolean) {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.loading$.next(true);
    this.cd.detectChanges();
    this.subscription =
      this.customerSessionsByKitService.getCustomerSessionsByKit(
        fadCode, mindate, maxdate, onlyShowKits
      ).subscribe(_data => {
        this.mindate = mindate;
        this.maxdate = maxdate;
        this.onlyShowKits = onlyShowKits;
        const { data, labels } = this.decorateData((_data || []));
        this.addGraphData(data, labels);
        this.graphData.labels = _.uniq(this.graphData.labels);
        this.nextGraphData();
        this.loading$.next(false);
        this.cd.detectChanges();
      }, err => {
        // this.actionMessageService.sendError(decorateError(err).error.message);
        this.loading$.next(false);
        this.cd.detectChanges();
      })
  }
  nextGraphData() {
    this.data$.next(this.graphData.data);
    this.labels$.next(this.graphData.labels);
    this.cd.detectChanges();
  }

  onDatePickerOpened() {
    this.cd.detectChanges();
  }

  onClickChart(_event) {
    const { activeElement, datasets, event } = _event;
    if (!(activeElement && activeElement[0]) || !datasets) return;
    event.stopPropagation();
    const { chart } = this.lineChart.chart;
    if(!(chart['tooltip']['_active'][0])){
      return;
    }
    const { _datasetIndex, _index, _model } = chart['tooltip']['_active'][0];
    const { label, data } = datasets[_datasetIndex];
    const { x, y } = _model;
    if (this.subscriptionGetCSKitSummary) {
      this.subscriptionGetCSKitSummary.unsubscribe();
    }

    // Set Text
    let innerHtml = '<thead>';
    innerHtml += '<tr><th></th><th>' + label + '</th></tr>';
    innerHtml += '</thead><tbody>';
    innerHtml += `<tr>
    <div class="lds-ellipsis">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
  </tr>`;
    innerHtml += '</tbody>';
    var tableRoot = this.tooltipEl.nativeElement.querySelector('table');
    tableRoot.innerHTML = innerHtml;
    //call request
    this.subscriptionGetCSKitSummary = this.getCSKitSummary((<ChartPoint>data[_index]).x).subscribe(_data => {
      console.log(_data);
      const { headers, bodies } = this.decorateCSKitSummaryData(_data, label);
      innerHtml = '<thead>';
      innerHtml += '<tr>';
      headers.forEach(header => {
        innerHtml += '<th>' + header + '</th>'
      })
      innerHtml += '</tr></thead><tbody>';
      const mainDataDate = bodies[(<ChartPoint>data[_index]).x.toString()]; //date to com
      Object.keys(bodies).map((key) => {
        const values = bodies[key];
        let html = ''
        html += `<tr><td><strong>${key}</strong></td>`
        if (key == (<ChartPoint>data[_index]).x) {
          values.forEach(value => {
            html += `<td><strong>${value}</strong></td>`
          })
        } else {
          values.forEach((value, i) => {
            if (value < mainDataDate[i]) {
              html += `<td><strong class="color-less">${value}</strong></td>`
            } else if (value > mainDataDate[i]) {
              html += `<td><strong class="color-better">${value}</strong></td>`
            } else {
              html += `<td><strong class="color-equal">${value}</strong></td>`
            }
          })
        }
        html += '</tr>'
        return html;
      }).forEach(html => {
        innerHtml += html;
      })
      innerHtml += '</tbody>';
      var tableRoot = this.tooltipEl.nativeElement.querySelector('table');
      tableRoot.innerHTML = innerHtml;
      const tooltipPosition = this.getTooltipPosition(position, { width: this.tooltipEl.nativeElement.offsetWidth }, { x, y });
      this.tooltipEl.nativeElement.style.left = tooltipPosition.x + 'px';
      this.tooltipEl.nativeElement.style.top = tooltipPosition.y + 'px';
    })
    // `this` will be the overall tooltip
    var position = this.lineChart.chart.chart.canvas.getBoundingClientRect();
    // Display, position, and set styles for font

    this.tooltipEl.nativeElement.style.display = 'block';
    const tooltipPosition = this.getTooltipPosition(position, { width: this.tooltipEl.nativeElement.offsetWidth }, { x, y });
    this.tooltipEl.nativeElement.style.left = tooltipPosition.x + 'px';
    this.tooltipEl.nativeElement.style.top = tooltipPosition.y + 'px';
  }
  decorateCSKitSummaryData(responeData: { [key: string]: any }[], key) {
    const result: {
      headers: string[],
      bodies: { [key: string]: number[] }
    } = {
      headers: [''],
      bodies: {}
    };
      result.headers.push(key);
    [...responeData].forEach(_item => {
      const item = { ..._item }
      const { Label } = item;
      delete item.Label;
      result.bodies[Label] = [];
      const value = item[key];
      const keys = Object.keys(item);
      result.bodies[Label].push(value)
    })
    return result;
  }
  getTooltipPosition(canvasPosition: DOMRect, tooltipPosition: { width }, chartPoint: { x, y }) {
    const { x, y } = chartPoint;
    const { width, height } = canvasPosition;
    const tooltipWidth = tooltipPosition.width;
    // const tooltipHeight = tooltipPosition.height;
    const result = { ...chartPoint }
    if (tooltipWidth + x > width) {
      result.x = x - tooltipWidth;
    }
    return { x: result.x, y: result.y }
  }

  getCSKitSummary(selecteddate) {
    return this.customerSessionsByKitService.getCustomerSessionsByKitSummary(this.fadCode, this.mindate, this.maxdate, this.onlyShowKits, selecteddate);
  }

  onResizeChart(chart, newSize) {
    this.tooltipEl.nativeElement.style.display = 'none';
  }
}
