import { Injectable } from '@angular/core';
import { MeasureTool } from '../../shared/meassure-tool';
import { BehaviorSubject, fromEvent, Observable, combineLatest, Subject, Subscription } from 'rxjs';
import { EVENT_CHANGE } from '../../shared/meassure-tool/events';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export class MeasureToolService {
  measureToolRefs: MeasureTool[] = [];
  changesSource = new BehaviorSubject<MeasureTool[]>([]);
  events: Observable<any>[] = [];
  changes = this.changesSource.asObservable();
  eventSubscription: Subscription;
  activeMeasureTool: MeasureTool;
  mapClickListener: any;
  defaultOptions(opt: any) {
    return Object.assign({
      showSegmentLength: true,
      unit: MeasureTool.UnitTypeId.IMPERIAL,
      contextMenu: false
    }, opt)
  }
  constructor() { }

  getNumberSegmentsActiveMeasure(){
    return this.activeMeasureTool ? this.activeMeasureTool.segments.length : 0
  }

  onCreate(map, opts, onCreatedCB: Function) {
    if(this.mapClickListener) return;
    this.measureToolRefs.forEach(e => this.endMeasurement(e));
    this.mapClickListener = google.maps.event.addListenerOnce(map, 'click', (event: google.maps.MouseEvent) => {
      const measurement = this.createMeasurement(map, opts, [{...event.latLng.toJSON()}]);
      this.activeMeasureTool = measurement;
      this.mapClickListener = null;
      if(onCreatedCB) onCreatedCB(this.activeMeasureTool);
    })
  }

  createMeasurement(map, opts, initialPoints) {
    const label = String.fromCharCode(97 + this.measureToolRefs.length).toUpperCase() + (this.measureToolRefs.length + 1)
    const measurement = new MeasureTool(map, this.defaultOptions({ ...opts, label }));
    measurement.start(initialPoints);
    const data$ = new BehaviorSubject<any>(null);
    this.events.push(data$.asObservable())
    measurement.addListener(EVENT_CHANGE, (data) => {
      data$.next(data);
    })
    this.measureToolRefs.push(measurement);
    this.changesSource.next(this.measureToolRefs);
  
    return measurement;
  }

  endMeasurement(measurement: MeasureTool) {
    measurement.disableAddNode(true);
  }

  setOption(option, value) {
    this.measureToolRefs.forEach(e => e.setOption(option, value));
  }

  removeAll() {
    this.measureToolRefs.forEach(e => e.end());
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
      this.eventSubscription = null;
    }
    this.measureToolRefs = [];
    this.events = [];
    this.changesSource.next(this.measureToolRefs);
    if(this.mapClickListener) {
      google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
  }
}
