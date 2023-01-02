import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ps-insight-tool-bar',
  templateUrl: './insight-tool-bar.component.html',
  styleUrls: ['./insight-tool-bar.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightToolBarComponent implements OnInit {

  @Input() showPercentage: boolean = true;
  @Input() showDensity: boolean = false;
  @Input() showComparison: boolean = false;
  @Input() showCompactView: boolean = false;
  @Input() loading = false;
  @Input() createMatchLoading = false;
  @Input() isCreateMatch = false;
  @Input() createMatchDisabled = false;
  @Output() toggle = new EventEmitter<{key, value}>();
  @Output() download = new EventEmitter<void>();
  @Output() createMatch = new EventEmitter<void>();
  constructor() { }

  ngOnInit(): void {
  }

  onDownload() {
    this.download.emit();
  }

  onToggle(key: string, value: boolean) {
    this.toggle.emit({key, value});
  }

  onCreateMatch(){
    this.createMatch.emit();
  }
}
