import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ps-divider',
  templateUrl: './divider.component.html',
  styleUrls: ['./divider.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DividerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
