import { Component, OnInit, Input, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IBranchDetail } from '../../../shared/models/detail-panel.model';

@Component({
  selector: 'go-branch-details',
  templateUrl: './branch-details.component.html',
  styleUrls: ['./branch-details.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BranchDetailsComponent implements OnInit {
  @Input() data: IBranchDetail;
  groupCollapse: any = { 0: true }
  constructor( private changeDetectorRef: ChangeDetectorRef) { 
  }

  ngOnInit() {
  }

  onToggle(index) {
    if (this.groupCollapse[index]) {
      this.groupCollapse[index] = !this.groupCollapse[index];
    } else {
      this.groupCollapse = {};
      this.groupCollapse[index] = true;
    }
    this.changeDetectorRef.detectChanges();
  }

}
