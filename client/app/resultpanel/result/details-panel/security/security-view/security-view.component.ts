import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IGroup, IGroup_Detail } from 'src/client/app/resultpanel/shared/models/detail-panel.model';

@Component({
  selector: 'ps-security-view',
  templateUrl: './security-view.component.html',
  styleUrls: ['./security-view.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SecurityViewComponent implements OnInit {
  @Input() data: IGroup;
  constructor() { }

  ngOnInit(): void {
  }

}
