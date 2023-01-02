import { Directive, ElementRef, HostListener, Input, Self, Optional, Attribute, AfterViewInit, NgZone, Renderer2, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

@Directive({
  selector: '[psTextOverflowTooltip]'
})
export class TextOverflowTooltipDirective implements AfterViewInit, OnDestroy {
  @Input() textOverflowLength: number
  @Input() set psTextOverflowTooltip(value) {
    if (this._text !== value) {
      this._text = value;
      this.updateTooltip();
    }
  };
  get psTextOverflowTooltip() {
    return this._text;
  }
  @Input() tooltipPosition;
  private _text: string;
  private _tooltip: Tooltip;
  private mouseEnterListener: any;
  private mouseLeaveListener: any;

  constructor(private _el: ElementRef, private _ngZone: NgZone, private _renderer2: Renderer2) { }
  ngOnDestroy(): void {
    this.destroyTooltip();
    this.destroyMouseListeners();
  }

  ngAfterViewInit(): void {
  }

  initTooltip() {
    if (this.isEllipsisActive(this._el.nativeElement) || (this.textOverflowLength && this._text.length >= this.textOverflowLength)) {
      this._tooltip = new Tooltip(this._el, this._ngZone);
      this._tooltip.text = this._text;
      this._tooltip.tooltipPosition = this.tooltipPosition ? this.tooltipPosition : undefined;
      this.initMouseListeners();
    }
  }


  updateTooltip() {
    setTimeout(() => {
      this._ngZone.run(() => {
        if (!this._tooltip) {
          this.initTooltip();
          return;
        }
        if (this.isEllipsisActive(this._el.nativeElement) || (this.textOverflowLength && this._text.length >= this.textOverflowLength)) {
          this._tooltip.text = this._text;
          this._tooltip.updateText();
        } else {
          this.destroyTooltip();
          this.destroyMouseListeners();
        }
      })
    }, 0);
  }

  destroyTooltip() {
    if (this._tooltip) {
      this._tooltip = undefined;
    }
  }

  initMouseListeners() {
    this._ngZone.runOutsideAngular(() => {
      this.destroyMouseListeners();
      this.mouseEnterListener = this._renderer2.listen(this._el.nativeElement, 'mouseenter', (event: any) => {
        this.show();
      });
      this.mouseLeaveListener = this._renderer2.listen(this._el.nativeElement, 'mouseleave', (event: any) => {
        this.hide();
      });
    });
  }

  private destroyMouseListeners() {
    if (this.mouseEnterListener) {
      this.mouseEnterListener();
    }
    if (this.mouseLeaveListener) {
      this.mouseLeaveListener();
    }
  }

  show() {
    this._tooltip.show();
  }

  hide() {
    this._tooltip.hide();
  }

  isEllipsisActive(el) {
    let e: any = $(el) ? $(el)[0] : $(el);
    return (e.offsetWidth < e.scrollWidth);
  }

}
