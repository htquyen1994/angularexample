import { Component, OnInit, Input, EventEmitter, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, BehaviorSubject, Subject, Subscription, combineLatest, fromEvent } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { MeasureToolService } from '../services/measure-tool.service';
import { MapService } from '../../shared/map.service';
import { EVENT_CHANGE } from '../../shared/meassure-tool/events';
import { AccountService, OverlayService, SHAPE_OPTIONS, OverlayShape } from '../../shared';
import { IAccount } from '../../shared/interfaces';
import { UnitTypeId } from '../../shared/meassure-tool/UnitTypeId';
import { CursorType } from '@client/app/shared/enums';

@Component({
  selector: 'ps-measurement',
  templateUrl: './measurement.component.html',
  styleUrls: ['./measurement.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementComponent implements OnInit {
  @Output() close = new EventEmitter<any>();
  result$ = new BehaviorSubject<any[]>([]);
  eventsSubscriptions: Subscription;
  private unsubscribe$: Subject<void> = new Subject<void>();
  isMetric: boolean;
  numberSegmentsActiveMeasure: number;
  isCreating: boolean;
  constructor(
    private measureToolService: MeasureToolService,
    private mapService: MapService,
    private cd: ChangeDetectorRef,
    private accountService: AccountService,
    private overlayService: OverlayService,
    ) {
  }

  ngOnInit() {
    this.mapService.setMapCursor(CursorType.CROSSHAIR)
    this.setOptionAllShape(false);
    this.accountService.account.pipe(takeUntil(this.unsubscribe$)).subscribe((item: IAccount) => {
      if (this.isMetric != item.isMetric) {
        this.isMetric = item.isMetric;
        this.measureToolService.setOption('unit', this.isMetric ? UnitTypeId.METRIC : UnitTypeId.IMPERIAL);
        this.cd.detectChanges();
      }
    });
    this.newInstance();
    this.measureToolService.changes.pipe(takeUntil(this.unsubscribe$)).subscribe(e => { //new measure created
      if (e.length) {
        if (this.eventsSubscriptions) {
          this.eventsSubscriptions.unsubscribe();
        }
        //listen all measures change event
        this.eventsSubscriptions = combineLatest(this.measureToolService.events).subscribe(data => {
          this.result$.next(data);
          this.numberSegmentsActiveMeasure = this.measureToolService.getNumberSegmentsActiveMeasure();
          this.cd.detectChanges();
        })
      } else {
        this.result$.next([]);
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.mapService.setMapCursor(CursorType.DEFAULT)
    this.setOptionAllShape(true);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.clear();
  }

  onClose(data?) {
    this.close.next(data);
  }
  onNew() {
    this.newInstance();
  }

  onClear() {
    this.clear();
    this.newInstance();
  }

  setOptionAllShape(value: boolean){
    SHAPE_OPTIONS.clickable = value;
    this.overlayService.overlays.forEach(overlay=>{
      overlay.getShapes().forEach(shape=>{
        if(shape instanceof OverlayShape){
          shape.update({clickable: value})
        }
      })
    })
  }

  private newInstance() {
    this.isCreating = true;
    this.cd.detectChanges();
    this.measureToolService.onCreate(
      this.mapService.map,
      { unit: this.isMetric ? UnitTypeId.METRIC : UnitTypeId.IMPERIAL },
      (instance) => {
        this.isCreating = false;
        this.cd.detectChanges();
      }
    );
  }

  private clear() {
    this.measureToolService.removeAll();
  }
}
