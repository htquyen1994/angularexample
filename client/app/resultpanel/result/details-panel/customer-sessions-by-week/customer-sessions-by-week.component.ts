import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, Input, AfterViewInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import * as moment from 'moment';
import { CustomerSessionsByWeekService } from '../../../shared/services/customer-sessions-by-week.service';
import { ReplaySubject, Subscription, forkJoin, Subject, BehaviorSubject } from 'rxjs';
import { ChartDataSets, ChartPoint, ChartOptions, ChartTooltipItem, ChartData, ChartTooltipOptions, ChartTooltipModel } from 'chart.js';
import { Label } from 'ng2-charts';
import { GoTableColumn } from 'src/periscope-lib/src/lib/table/table.model';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ActionMessageService, MAXDATE, MINDATE, AppInsightsService, GOOGLE_SCHEME } from 'src/client/app/shared';
import { decorateError } from 'src/client/app/shared/http.util';
import * as _ from 'lodash';
import { LineChartComponent } from '@periscope-lib/chart/line-chart/line-chart.component';
@Component({
  selector: 'ps-customer-sessions-by-week',
  templateUrl: './customer-sessions-by-week.component.html',
  styleUrls: ['./customer-sessions-by-week.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerSessionsByWeekComponent implements OnInit {
  @ViewChild('lineChart') lineChart: LineChartComponent;
  @ViewChild('tooltipEl') tooltipEl: ElementRef;
  @Input('fadCode') set _fadCode(value: string){
    if (this.form && this.fadCode != value) {
      this.fadCode = value;
      this.addedBranches = [];
      this.onUpdate([{
        fadCode: value
      }], true);
      this.getBranches();
    } else {
      this.fadCode = value;
    }
  };
  fadCode: string;
  mainFadCodeNames: string[] = [];
  public headers: GoTableColumn[] = [
    { name: 'FadCode', trackBy: 'fadCode', class: 'w-15' },
    { name: 'Place', trackBy: 'place', class: 'w-50' },
    { name: 'Type', trackBy: 'type', class: 'w-15' },
    { name: 'Historic', trackBy: 'isHistoric', class: 'w-15' },
    { name: 'Distance (km)', trackBy: 'distanceMetres', class: 'w-15' },
  ];
  public branchesData$ = new ReplaySubject<any[]>(1);
  public branchesLoading$ = new ReplaySubject<boolean>(1);
  public branchesData: any[] = [];
  public addedBranches: any[] = [];
  addBranchActive: boolean = false;
  form: FormGroup;
  formSearchBranches: FormGroup;
  minDate = MINDATE
  maxDate = MAXDATE

  data$ = new ReplaySubject<ChartDataSets[]>(1);
  labels$ = new ReplaySubject<Label[]>(1);
  graphData: {
    data: { fadCode: string, chartData: ChartDataSets }[],
    labels: Label[]
  } = {
      data: [],
      labels: []
    }
  loading$ = new ReplaySubject<boolean>(1);
  subscription: Subscription;
  loadingDownload$ = new BehaviorSubject<boolean>(false);
  subscriptionDownload: Subscription;
  subscriptionGetBranches: Subscription;
  subscriptionGetCSSummary: Subscription;
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
  chartColors = GOOGLE_SCHEME;
  maxdate: string;
  mindate: string;
  clickListenerFn: () => void;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private customerSessionsByWeekService: CustomerSessionsByWeekService,
    private actionMessageService: ActionMessageService,
    private applicationInsightsService: AppInsightsService,
    private renderer: Renderer2
  ) {
  }

  ngOnInit() {
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'By Week');
    this.innitForm();
    this.onUpdate([{
      fadCode: this.fadCode
    }], true);
    this.innitFormSearchBranches();
    this.clickListenerFn = this.renderer.listen(document, 'click', (e) => {
      this.tooltipEl.nativeElement.style.display = 'none';
    })
    this.getBranches();
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.clickListenerFn) {
      this.clickListenerFn();
    }
  }
  innitForm() {
    const today = new Date();
    const minDate = moment(today).subtract(2, 'year').toISOString().slice(0, 10);
    const maxDate = moment(today).toISOString().slice(0, 10);
    this.form = this.fb.group({
      mindate: [minDate, Validators.required],
      maxdate: [maxDate, Validators.required]
    })
    // this.form.valueChanges.subscribe(value=>{
    //   this.cd.detectChanges();
    // })
  }

  innitFormSearchBranches() {
    this.formSearchBranches = this.fb.group({
      searchTerm: [''],
      historicClosures: [false]
    })
    this.formSearchBranches.get('historicClosures').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.getBranches();
      this.cd.detectChanges();
    })
  }

  onAddBranches() {
    this.addBranchActive = !this.addBranchActive;
    this.cd.detectChanges();
  }
  onDownload() {
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'Download By Week');
    const { mindate, maxdate } = this.form.getRawValue();
    const _mindate = moment(mindate).add(moment(mindate).utcOffset() * 60).format('DD-MM-YYYY');
    const _maxdate = moment(maxdate).add(moment(maxdate).utcOffset() * 60).format('DD-MM-YYYY');
    if (this.subscriptionDownload) {
      this.subscriptionDownload.unsubscribe();
      this.subscriptionDownload = null;
    }
    this.loadingDownload$.next(true);
    this.cd.detectChanges();
    this.subscriptionDownload = this.customerSessionsByWeekService.getReport([...this.addedBranches.map(e => e.fadCode)], _mindate, _maxdate).subscribe(e => {
      this.loadingDownload$.next(false);
      this.cd.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loadingDownload$.next(false);
      this.cd.detectChanges();
    });
  }
  onUpdate(branches, reset?: boolean) {
    const { mindate, maxdate } = this.form.getRawValue();
    const _mindate = moment(mindate).add(moment(mindate).utcOffset() * 60).format('DD-MM-YYYY');
    const _maxdate = moment(maxdate).add(moment(maxdate).utcOffset() * 60).format('DD-MM-YYYY');
    if (reset) {
      this.resetGraphData();
      branches = this.addedBranches.length ? [...this.addedBranches] : [{ fadCode: this.fadCode}];
      this.addedBranches = [];
    }
    const selectedFadcode: string[] = branches.map(e => e.fadCode);

    if (!selectedFadcode.length) return;
    this.getGraphData([...selectedFadcode], _mindate, _maxdate, !reset);
  }
  onDatePickerOpened() {
    this.cd.detectChanges();
  }
  onRowSelect(event) {
    const { row, rowIndex } = event;
    const index = this.branchesData.findIndex(e => e.fadCode === row.fadCode);
    if (index != -1) {
      const currentSelected = this.branchesData[index].isSelected;
      this.branchesData[index].isSelected = !currentSelected;
      this.branchesData$.next([...this.branchesData]);
      this.cd.detectChanges();
    }
  }

  onClickLegend(event) {
    const { legendItem } = event;
    const { text } = legendItem;
    const fadCode = this.decorateNameToFadCode(text);
    if (fadCode == this.fadCode) return;
    const branch = this.addedBranches.find(e => e.fadCode == this.fadCode);
    if (branch && branch.relativefadCodes.includes(fadCode)) return;
    const removedFadcodes = this.removeAddedBranches(fadCode);
    if (removedFadcodes.length) {
      this.removeGraphData(removedFadcodes);
      this.getBranches();
      this.nextGraphData();
    }
  }

  addBranches() {
    const branches = this.branchesData.filter(e => e.isSelected);
    if (this.addedBranches.length + branches.length > 25) {
      this.actionMessageService.sendWarning('Can not select more than 25 branches')
      return;
    }
    this.onUpdate(branches);
  }

  getGraphData(fadCodes: string[], mindate, maxdate, resetBranchList = true) {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.mindate = mindate;
    this.maxdate = maxdate;
    this.loading$.next(true);
    this.cd.detectChanges();
    const errors: string[] = [];
    this.subscription = this.customerSessionsByWeekService.getCustomerSessionsByWeek(fadCodes, mindate, maxdate).subscribe(_data => {
      for (let index = 0; index < _data.length; index++) {
        const { chartData, error, fadCode } = _data[index];
        if (error) {
          errors.push(fadCode);
          continue;
        }
        const { data, labels } = this.decorateData(chartData);

        // for case having more branches e.g Burnley (006407)
        data.forEach(e => {
          const added = this.addAddedBranches({
            fadCode: e.fadCode,
            relativefadCodes: data.map(_e => _e.fadCode).filter(_e => _e != e.fadCode)
          })
          if (added) {
            this.addGraphData([e], labels);
          }
        })
      }
      if (errors.length && resetBranchList) {
        let message = `Could not get data for ${errors.join(', ')}`;
        this.actionMessageService.sendWarning(message);
      }
      this.graphData.labels = _.uniq(this.graphData.labels);
      if (resetBranchList && errors.length != fadCodes.length) {
        this.getBranches();
      }
      this.nextGraphData();
      this.loading$.next(false);
      this.cd.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
      this.cd.detectChanges();
    })
  }

  getBranches() {
    if (this.subscriptionGetBranches) {
      this.subscriptionGetBranches.unsubscribe();
      this.subscriptionGetBranches = null;
    }
    this.branchesLoading$.next(true);
    this.cd.detectChanges();
    const { searchTerm, historicClosures } = this.formSearchBranches.getRawValue();
    this.subscriptionGetBranches = this.customerSessionsByWeekService.getBranches(
      searchTerm,
      JSON.stringify([this.fadCode, ...this.addedBranches.map(e => e.fadCode)]),
      historicClosures,
      0
    ).subscribe(_data => {
      this.branchesData = _data;
      this.branchesData$.next([...this.branchesData]);
      this.branchesLoading$.next(false);
      this.cd.detectChanges();
    }, err => {
      this.branchesData$.next([]);
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.branchesLoading$.next(false);
      this.cd.detectChanges();
    })
  }

  private removeAddedBranches(fadCode) {
    const index = this.addedBranches.findIndex(e => e.fadCode == fadCode);
    if (index != -1) {
      const { relativefadCodes, fadCode } = this.addedBranches[index];
      this.addedBranches = this.addedBranches.filter(e => ![...(relativefadCodes || []), fadCode].includes(e.fadCode));
      return [...(relativefadCodes || []), fadCode];
    }
    return [];
  }

  private addAddedBranches(branch) {
    if (!branch) return;
    const index = this.addedBranches.findIndex(e => e.fadCode == branch.fadCode);
    if (index == -1) {
      this.addedBranches.push(branch);
      return true
    }
    return false
  }

  private decorateData(responeData: { [key: string]: any }[]): { data: { fadCode: string, chartData: ChartDataSets }[], labels: Label[] } {
    const data: { fadCode: string, chartData: ChartDataSets }[] = [];
    const labels: Label[] = [];
    [...responeData].forEach(_item => {
      const item = { ..._item }
      const { Label } = item;
      labels.push(Label);
      delete item.Label;
      const keys = Object.keys(item);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const fadCode = this.decorateNameToFadCode(key);
        const value = item[key];
        const chartPoint: ChartPoint = {
          x: Label,
          y: value
        }
        const _index = data.findIndex(e => e.fadCode == fadCode);
        if (_index == -1) {
          data.push({ fadCode: fadCode, chartData: { label: key, data: [chartPoint], fill: fadCode == this.fadCode ? true : false } as ChartDataSets });
        } else {
          (data[_index].chartData.data as ChartPoint[]).push(chartPoint);
        }
      }
    })
    return { data, labels };
  }

  decorateCSSummaryData(responeData: { [key: string]: any }[]) {
    const result: {
      headers: string[],
      bodies: { [key: string]: number[] }
    } = {
      headers: [''],
      bodies: {}
    };
    [...responeData].forEach(_item => {
      const item = { ..._item }
      const { Label } = item;
      delete item.Label;
      result.bodies[Label] = [];
      const keys = Object.keys(item);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const value = item[key];
        if (!result.headers.includes(key)) {
          result.headers.push(key);
        }
        result.bodies[Label].push(value)
      }
    })
    return result;
  }

  decorateNameToFadCode(str: string) {
    return str.substring(
      str.lastIndexOf("(") + 1,
      str.lastIndexOf(")")
    );
  }

  addGraphData(data, labels) {
    this.graphData.data = [
      ...this.graphData.data,
      ...data
    ];
    this.graphData.labels = [
      ...this.graphData.labels,
      ...labels
    ];
  }
  removeGraphData(fadCodes: string[]) {
    this.graphData.data = this.graphData.data.filter(e => !fadCodes.includes(e.fadCode));
  }
  nextGraphData() {
    this.data$.next(this.graphData.data.map(e => e.chartData));
    this.labels$.next(this.graphData.labels);
    this.cd.detectChanges();
  }
  resetGraphData() {
    this.graphData = {
      data: [],
      labels: []
    };
  }
  // customTooltip(tooltipModel: ChartTooltipModel) {
  //   // Tooltip Element
  //   let tooltipEl = document.getElementById('chartjs-tooltip');
  //   const { opacity, yAlign, x, y, _bodyFontFamily, bodyFontSize, _bodyFontStyle, yPadding, xPadding, backgroundColor, bodyFontColor } = tooltipModel;
  //   // Create element on first render
  //   if (!tooltipEl) {
  //     tooltipEl = document.createElement('div');
  //     tooltipEl.id = 'chartjs-tooltip';
  //     tooltipEl.innerHTML = '<table></table>';
  //     document.body.appendChild(tooltipEl);
  //     tooltipEl.style.background = backgroundColor;
  //     tooltipEl.style.color = bodyFontColor;
  //     tooltipEl.style.border = '1px solid ' + backgroundColor;
  //     tooltipEl.style.borderRadius = '2px';
  //     tooltipEl.style.fontFamily = _bodyFontFamily;
  //     tooltipEl.style.fontSize = bodyFontSize + 'px';
  //     tooltipEl.style.fontStyle = _bodyFontStyle;
  //     tooltipEl.style.padding = yPadding + 'px ' + xPadding + 'px';
  //     tooltipEl.style.pointerEvents = 'none';
  //     tooltipEl.style.textAlign = 'center'
  //   }

  //   // Hide if no tooltip
  //   if (opacity === 0) {
  //     tooltipEl.style.opacity = '0';
  //     return;
  //   }
  //   const { datasets, chart } = this.lineChart.chart;
  //   const { _datasetIndex, _index } = chart['tooltip']['_active'][0];
  //   const { label, data } = datasets[_datasetIndex];
  //   // Set caret Position
  //   tooltipEl.classList.remove('above', 'below', 'no-transform');
  //   if (yAlign) {
  //     tooltipEl.classList.add(yAlign);
  //   } else {
  //     tooltipEl.classList.add('no-transform');
  //   }

  //   if (this.subscriptionGetCSSummary) {
  //     this.subscriptionGetCSSummary.unsubscribe();
  //   }

  //   // Set Text
  //   let innerHtml = '<thead>';
  //   innerHtml += '<tr><th></th><th>' + label + '</th></tr>';
  //   innerHtml += '</thead><tbody>';
  //   innerHtml += `<tr>
  //   <div class="lds-ellipsis">
  //   <div></div>
  //   <div></div>
  //   <div></div>
  //   <div></div>
  // </div>
  // </tr>`;
  //   innerHtml += '</tbody>';
  //   var tableRoot = tooltipEl.querySelector('table');
  //   tableRoot.innerHTML = innerHtml;
  //   //call request
  //   const { fadCode } = this.graphData.data[_datasetIndex];
  //   this.subscriptionGetCSSummary = this.getCSSummary(fadCode, (<ChartPoint>data[_index]).x).subscribe(_data => {
  //     console.log(_data);
  //     const { headers, bodies } = this.decorateCSSummaryData(_data.chartData);
  //     innerHtml = '<thead>';
  //     innerHtml += '<tr>';
  //     headers.forEach(header => {
  //       innerHtml += '<th>' + header + '</th>'
  //     })
  //     innerHtml += '</tr></thead><tbody>';
  //     const mainDataDate = bodies[(<ChartPoint>data[_index]).x.toString()]; //date to com
  //     Object.keys(bodies).map((key) => {
  //       const values = bodies[key];
  //       let html = ''
  //       html += `<tr><td><strong>${key}</strong></td>`
  //       if (key == (<ChartPoint>data[_index]).x) {
  //         values.forEach(value => {
  //           html += `<td><strong>${value}</strong></td>`
  //         })
  //       } else {
  //         values.forEach((value, i) => {
  //           if (value < mainDataDate[i]) {
  //             html += `<td><strong class="color-less">${value}</strong></td>`
  //           } else if (value > mainDataDate[i]) {
  //             html += `<td><strong class="color-better">${value}</strong></td>`
  //           } else {
  //             html += `<td><strong class="color-equal">${value}</strong></td>`
  //           }
  //         })
  //       }
  //       html += '</tr>'
  //       return html;
  //     }).forEach(html => {
  //       innerHtml += html;
  //     })
  //     innerHtml += '</tbody>';
  //     var tableRoot = tooltipEl.querySelector('table');
  //     tableRoot.innerHTML = innerHtml;
  //   })
  //   // `this` will be the overall tooltip
  //   var position = this.lineChart.chart.chart.canvas.getBoundingClientRect();

  //   // Display, position, and set styles for font
  //   tooltipEl.style.opacity = '1';
  //   tooltipEl.style.position = 'absolute';
  //   tooltipEl.style.left = position.left + window.pageXOffset + x + 'px';
  //   tooltipEl.style.top = position.top + window.pageYOffset + y + 'px';
  // }

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
    if (this.subscriptionGetCSSummary) {
      this.subscriptionGetCSSummary.unsubscribe();
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
    const { fadCode } = this.graphData.data[_datasetIndex];
    this.subscriptionGetCSSummary = this.getCSSummary(fadCode, (<ChartPoint>data[_index]).x).subscribe(_data => {
      console.log(_data);
      const { headers, bodies } = this.decorateCSSummaryData(_data.chartData);
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

  getCSSummary(fadCode, selecteddate) {
    return this.customerSessionsByWeekService.getCustomerSessionsByWeekSummary(fadCode, this.mindate, this.maxdate, selecteddate);
  }

  onResizeChart(chart, newSize) {
    this.tooltipEl.nativeElement.style.display = 'none';
  }
}
