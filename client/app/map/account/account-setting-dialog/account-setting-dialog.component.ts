import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AccountService, MapService, COLORS, IS_MORRISON } from '@client/app/shared';
import { PlacesService } from '@client/app/sidepanel/places/places.service';
import { IAccount, EPerformanceLevel } from '@client/app/shared/interfaces';
import { SystemBreakdownService } from '@client/app/shared/services';
import { DialogComponent } from '@client/app/shared/components';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'ps-account-setting-dialog',
  templateUrl: './account-setting-dialog.component.html',
  styleUrls: ['./account-setting-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AccountSettingDialogComponent implements OnInit {
  @ViewChild('dialog', { static: true }) dialog: DialogComponent;

  collapses: { [key: string]: boolean } = {
    globalsettings: true
  };
  zoomLevel: number;
  placesSearchGroups = [];
  isLoading = false;
  drawShapeOpacity: number;
  drawShapeFillColour: string;
  drawShapeStrokeColour: string;
  account: IAccount;
  EPerformanceLevel = EPerformanceLevel;
  isMorrison = IS_MORRISON;

  private changeSlider = new Subject<{ key: string, value: number }>();
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _accountService: AccountService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _mapService: MapService,
    private _placesService: PlacesService,
    private _systemBreakdownService: SystemBreakdownService,
    private _dialogRef: MatDialogRef<AccountSettingDialogComponent>,
  ) { }

  ngOnInit(): void {
    this._accountService.account.pipe(takeUntil(this.unsubscribe$)).subscribe((item) => {
      this.account = { ...item };
      this.drawShapeOpacity = this.account.drawShapeOpacity;
      this.drawShapeFillColour = this.account.drawShapeFillColour ? this.account.drawShapeFillColour : COLORS.MAP_CREATION
      this.drawShapeStrokeColour = this.account.drawShapeStrokeColour ? this.account.drawShapeStrokeColour : COLORS.MAP_CREATION_STROKE;
      this.account.mapType = this.account.mapType ? this.account.mapType : "terrain";
      this._changeDetectorRef.detectChanges();
    });
    this.changeSlider.pipe(takeUntil(this.unsubscribe$),debounceTime(100)).subscribe(({ key, value }) => {
      this.setValue(key, value);
    })
    this._placesService.gazetteerSettings$.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      if (!data) return;
      const { groups } = data;
      this.placesSearchGroups = [...groups];
      this._changeDetectorRef.detectChanges();
    })
    this._mapService.mapRx.pipe(takeUntil(this.unsubscribe$)).subscribe(map => {
      this.zoomLevel = map.getZoom();
      this._changeDetectorRef.detectChanges();
    });
    this._mapService.zoom.pipe(takeUntil(this.unsubscribe$)).subscribe(zoomLevel => {
      this.zoomLevel = zoomLevel;
      this._changeDetectorRef.detectChanges();
    })
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
    this._changeDetectorRef.detectChanges();
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onDialogClose(result?: any) {
    this._dialogRef.close(result);
    this._changeDetectorRef.detectChanges();
  }


  onToggle(value: string) {
    this.collapses[value] = !this.collapses[value];
  }


  onChangeColour(key) {
    const value = this[key];
    if (value != this.account[key]) {
      this.setValue(key, value);
    }
  }

  onChangeSlider(key, value) {
    this.changeSlider.next({ key, value })
  }

  toggleToRefresh(key, value){
    this.isLoading = true;
    this._changeDetectorRef.detectChanges();
    this._accountService.setSetting(key, value.toString()).subscribe(e => {
      this.isLoading = false;
      this._changeDetectorRef.detectChanges();
      this._systemBreakdownService.reloadBrowser();
    }, err => {
      console.error(err)
    });
  }


  setValue(key: string, value: any) {
    this.isLoading = true;
    this._changeDetectorRef.detectChanges();
    this._accountService.setSetting(key, value.toString()).subscribe(e => {
      this.isLoading = false;
      this._changeDetectorRef.detectChanges();
    }, err => {
      console.error(err)
    });
  }

}
