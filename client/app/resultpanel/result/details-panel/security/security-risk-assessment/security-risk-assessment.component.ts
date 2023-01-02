import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IGroup } from 'src/client/app/resultpanel/shared/models/detail-panel.model';

@Component({
  selector: 'ps-security-risk-assessment',
  templateUrl: './security-risk-assessment.component.html',
  styleUrls: ['./security-risk-assessment.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SecurityRiskAssessmentComponent implements OnInit {
  @Input() data: IGroup;
  constructor() { }

  ngOnInit(): void {
  }

}
