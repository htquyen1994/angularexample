import { Component, OnInit, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IBranchDetail } from '../../../shared/models/detail-panel.model';

@Component({
  selector: 'ps-branch-people',
  templateUrl: './branch-people.component.html',
  styleUrls: ['./branch-people.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BranchPeopleComponent implements OnInit {
  @Input() data: IBranchDetail;
  constructor() { }

  ngOnInit(): void {
  }

}
