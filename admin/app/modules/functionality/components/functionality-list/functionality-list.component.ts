import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input } from '@angular/core';
import { IFunctionalityClaim, IFunctionality } from '../../interfaces';

@Component({
  selector: 'ps-functionality-list',
  templateUrl: './functionality-list.component.html',
  styleUrls: ['./functionality-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FunctionalityListComponent implements OnInit {
  @Input() loading: boolean;
  @Input() data: IFunctionality[];
  @Input() claims: IFunctionalityClaim[]
  constructor() { }

  ngOnInit(): void {
  }

}
