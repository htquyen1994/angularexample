import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IOpeningHours, OpeningHoursData } from '../../../shared/models/detail-panel.model';

@Component({
  selector: 'go-opening-hours',
  templateUrl: './opening-hours.component.html',
  styleUrls: ['./opening-hours.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OpeningHoursComponent implements OnInit {
  @Input() data: IOpeningHours;
  constructor() { }

  ngOnInit() {
  }

}
