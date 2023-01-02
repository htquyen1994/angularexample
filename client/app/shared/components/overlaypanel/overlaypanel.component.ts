import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, ChangeDetectionStrategy, ViewEncapsulation, Input, HostListener, NgZone, Renderer2 } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { DomHandler } from 'primeng/dom';

@Component({
  selector: 'ps-overlaypanel',
  templateUrl: './overlaypanel.component.html',
  styleUrls: ['./overlaypanel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OverlaypanelComponent implements OnInit {
  public isOpen: boolean = false;
  @ViewChild('op') op: OverlayPanel;

  @Input() styleClass = '';

  constructor(
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {

  }

  toggle(_event?) {
    const event = _event ? _event : new Event('click');
    this.op.toggle(event);
    this.cd.markForCheck();
    this.cd.detectChanges();
    this.op.isContainerClicked = false;
  }

  show(_event?) {
    const event = _event ? _event : new Event('click');
    this.op.show(event);
    this.rebindDocumentClickListener();
    this.cd.markForCheck();
    this.cd.detectChanges();
    this.op.isContainerClicked = false;
  }

  hide() {
    this.op.hide();
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
  onShow() {
    this.isOpen = true;
    this.rebindDocumentClickListener();
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
  onHide() {
    this.isOpen = false;
    this.op.ngOnDestroy();
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
  rebindDocumentClickListener() {
    var _this = this;
    this.zone.runOutsideAngular(function () {
      var documentEvent = DomHandler.isIOS() ? 'touchstart' : 'click';
      if( _this.op.documentClickListener){
        _this.op.unbindDocumentClickListener();
      }
      _this.op.documentClickListener = _this.renderer.listen('document', documentEvent, function (event) {
        if (!_this.op.container.contains(event.target) && _this.op.target !== event.target && !_this.op.target.contains(event.target)) {
          _this.zone.run(function () {
            _this.hide();
          });
        }
        _this.cd.markForCheck();
        _this.cd.detectChanges();
      });
    });
  };
}
