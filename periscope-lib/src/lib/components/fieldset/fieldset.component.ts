import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ps-fieldset',
  templateUrl: './fieldset.component.html',
  styleUrls: ['./fieldset.component.less']
})
export class FieldsetComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() align: string = 'center'
  constructor() { }

  ngOnInit(): void {
  }

}
