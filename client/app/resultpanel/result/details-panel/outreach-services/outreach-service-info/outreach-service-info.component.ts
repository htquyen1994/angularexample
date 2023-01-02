import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { DirectionsService } from 'src/client/app/shared/services/directions.service';
import { UnitTypeId } from 'src/client/app/shared/meassure-tool/UnitTypeId';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard'
import { ActionMessageService } from 'src/client/app/shared';
@Component({
  selector: 'ps-outreach-service-info',
  templateUrl: './outreach-service-info.component.html',
  styleUrls: ['./outreach-service-info.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OutreachServiceInfoComponent implements OnInit {
  @ViewChild('directionContent', { static: false }) directionContent: ElementRef
  @Input("selectedTravelMode")
  public selectedTravelMode$: Observable<google.maps.TravelMode>;
  @Input("reverseDirection")
  public reverseDirection$: Observable<boolean>;
  @Input("selectedRoute")
  public selectedRouteData$: Observable<any>;
  @Input() unit = UnitTypeId.METRIC;
  @Input() showReverse = true;
  @Input() showClipboard = true;
  @Output() selected = new EventEmitter<google.maps.TravelMode>()
  @Output() reverseDirection = new EventEmitter<void>();
  public TravelMode = google.maps.TravelMode;
  constructor(
    private domSanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    private clipboard: Clipboard,
    private actionMessageService: ActionMessageService,
  ) { }

  ngOnInit(): void {
    if (this.selectedRouteData$)
      this.selectedRouteData$.subscribe(e => setTimeout(() => {
        this.cd.detectChanges()
      }, 0))
  }

  onSelected(mode: google.maps.TravelMode) {
    this.selected.next(mode);
    // this.directionsService.selectTravelMode(mode);
  }

  onReverse() {
    this.reverseDirection.next();
    // this.directionsService.onReverseDirection();
  }
  bypassSecurityTrustHtml(value) {
    return this.domSanitizer.bypassSecurityTrustHtml(value);
  }
  copyDirections() {
    if (!this.directionContent) return;
    const pending = this.clipboard.beginCopy(this.directionContent.nativeElement.innerText);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        this.actionMessageService.sendSuccess("Directions were copied to the clipboard");
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    attempt();
  }
}
