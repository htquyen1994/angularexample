import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ps-nearest-tool-bar',
  templateUrl: './nearest-tool-bar.component.html',
  styleUrls: ['./nearest-tool-bar.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NearestToolBarComponent implements OnInit {
  @Input() canDownload: boolean = false;
  @Input() loading: boolean = false;
  @Output() download = new EventEmitter<void>()
  @Output() zoomAll = new EventEmitter<void>()

  constructor() { }

  ngOnInit(): void {
  }

  onDownload(){
    this.download.emit();
  }

  onZoomAll(){
    this.zoomAll.emit();
  }

}
