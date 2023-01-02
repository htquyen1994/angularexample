import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReportsService } from './reports.service';

@Component({
  selector: 'go-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {

  isDownload = new BehaviorSubject<boolean>(false);
  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
  }

  onDownload() {
    this.isDownload.next(true);
    this.reportsService.getReportsUser().subscribe((e) => this.isDownload.next(false));
  }
}
