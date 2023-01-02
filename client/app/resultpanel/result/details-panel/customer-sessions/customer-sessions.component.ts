import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input, SimpleChange, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'ps-customer-sessions',
  templateUrl: './customer-sessions.component.html',
  styleUrls: ['./customer-sessions.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerSessionsComponent implements OnInit {
  @Input() data: any;
  @Input() set active(value: boolean){
    if(value && !this.isInit){
      this.isInit = true;
      this.cd.detectChanges();
    }
  }
  isInit = false;
  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
  }
  ngOnDestroy(){
  }

  trackByIndex(index: number, _: any): number {
    return index;
  }
  onTabChange(event) {
    this.cd.detectChanges();
  }

}
