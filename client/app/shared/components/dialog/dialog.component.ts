import { Component, Input, HostBinding, ElementRef, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, SkipSelf, Renderer2, NgZone, ViewChild, ContentChild, TemplateRef, Directive, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'go-dialog',
  moduleId: module.id,
  templateUrl: 'dialog.component.html',
  styleUrls: ['dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DialogComponent {
  @ViewChild('dialog') dialog: ElementRef;
  @ViewChild('dragHandle') dragHandle: ElementRef;

  @Input() title: string;
  @Input() wide: boolean;
  @Input() footerText: string;
  @Input() resize: boolean = false;
  @Input() isDrag: boolean = false;
  @Input() styleClass: any;
  @Input() styles: any;
  @Input() iconClose: boolean = true;
  @Input('position') _position: { x: any, y: any } = { x: 0, y: 0 };
  @Input() headerTemplate: TemplateRef<HTMLElement>
  @Input() minWidth = 492;
  @Input() minHeight = 300;
  @Input() instructionsHTML: string;
  @Output() close = new EventEmitter<boolean>();
  @Output() positionChanged = new EventEmitter<{ top: number, left: number }>();
  dimension: { width: any, height: any } = { height: 0, width: 0 };
  position: { x: any, y: any } = { x: 0, y: 0 };
  currentPosition: { top: number, left: number } = { top: 0, left: 0 }
  hidden: boolean;
  mouseMoveListener: any;
  mouseUpListener: any;
  private _positionChanged = false;
  // iconPosition = adrConfig.iconPosition
  constructor(
    public elRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private renderer2: Renderer2,
    private zone: NgZone) {
    // this.isDrag = this.elRef.nativeElement.classList.contains('cdk-drag');
  }

  ngAfterViewInit() {
    this.innitDraggable();
    this.innitResize();
  }

  ngOnDestroy() {
    this.destroyMouseListeners();
  }

  onHide(value: boolean) {
    this.hidden = value;
    this.refresh();
    if (this.hidden === false) {
      this.innitDraggable();
      this.innitResize();
      this.elRef.nativeElement.focus();
    } else {
      this.close.emit(true);
    }
  }
  onHidden(value: boolean) {
    this.hidden = value;
    this.refresh();
    if (this.hidden === false) {
      this.elRef.nativeElement.focus();
    }
  }

  refresh() {
    this.renderer2.setAttribute(this.elRef.nativeElement, 'aria-hidden', this.hidden.toString());
    this.changeDetector.detectChanges();
  }

  initMouseListeners(resize) {
    this.zone.runOutsideAngular(() => {
      this.destroyMouseListeners();
      if (resize) {
        this.mouseMoveListener = this.renderer2.listen('window', 'mousemove', (event: any) => {
          this.mousemove(event);
        });
      } else {
        this.mouseMoveListener = this.renderer2.listen('window', 'mousemove', (event: any) => {
          this.mousemoveDrag(event);
          this._positionChanged = true;
        });
      }
      this.mouseUpListener = this.renderer2.listen('window', 'mouseup', (event: any) => {
        this.mouseup();
        if(!resize && this._positionChanged){
          this._positionChanged = false;
          this.positionChanged.next(this.currentPosition);
        }
      });
    });
  }
  private innitDraggable() {
    if (this.isDrag) {
      this.renderer2.addClass(this.elRef.nativeElement, 'dialog-draggale');
      const height = this.elRef.nativeElement.offsetHeight;
      const width = this.elRef.nativeElement.offsetWidth;
      const innerWidth = window.innerWidth;
      const innerHeight = window.innerHeight;
      const { x, y } = this._position;
      this.setPosition(!x ? innerWidth / 2 - width / 2 : x, !y ? innerHeight / 2 / 2 / 2 : y);
      this.renderer2.setStyle(this.elRef.nativeElement, 'touch-action', 'none');
      this.renderer2.setStyle(this.elRef.nativeElement, '-webkit-user-drag', 'none');
      this.renderer2.setStyle(this.elRef.nativeElement, '-webkit-tap-highlight-color', 'transparent');
      this.renderer2.setStyle(this.elRef.nativeElement, 'user-select', 'none');
      this.renderer2.listen(this.dragHandle.nativeElement, 'mousedown', ($event) => {
        // make others overlay close
        const event = new Event('click');
        document.dispatchEvent(event);

        $event.stopImmediatePropagation();
        const dialogY = this.elRef.nativeElement.getBoundingClientRect().top;
        const dialogX = this.elRef.nativeElement.getBoundingClientRect().left;

        this.position['x'] = $event.clientX - dialogX;
        this.position['y'] = $event.clientY - dialogY;
        this.initMouseListeners(false);
        return false;
      })
    }
  }
  private innitResize() {
    if (this.resize) {
      let btn = this.renderer2.createElement("span");
      this.renderer2.setStyle(btn, 'width', '15px');
      this.renderer2.setStyle(btn, 'height', '15px');
      this.renderer2.setProperty(btn, 'innerHTML', "<svg>\
            <circle cx='12.5' cy='2.5' r='2' fill='#777777'></circle>\
            <circle cx='7.5' cy='7.5' r='2' fill='#777777'></circle>\
            <circle cx='12.5' cy='7.5' r='2' fill='#424242'></circle>\
            <circle cx='2.5' cy='12.5' r='2' fill='#777777'></circle>\
            <circle cx='7.5' cy='12.5' r='2' fill='#424242'></circle>\
            <circle cx='12.5' cy='12.5' r='2' fill='#212121'></circle></svg>");
      this.renderer2.setStyle(btn, 'bottom', '0');
      this.renderer2.setStyle(btn, 'right', '0');
      this.renderer2.setStyle(btn, 'position', 'absolute');
      this.renderer2.setStyle(btn, 'visibility', 'hidden');
      this.renderer2.setStyle(btn, 'cursor', 'nwse-resize');
      this.renderer2.listen(btn, 'mousedown', ($event) => {
        // make others overlay close
        const event = new Event('click');
        document.dispatchEvent(event);

        $event.stopImmediatePropagation();
        this.position['x'] = $event.clientX;
        this.position['y'] = $event.clientY;
        this.dimension['width'] = this.dialog.nativeElement.offsetWidth;
        this.dimension['height'] = this.dialog.nativeElement.offsetHeight;
        this.initMouseListeners(true);
        return false;
      })

      this.renderer2.appendChild(this.dialog.nativeElement, btn);
      this.renderer2.listen(this.dialog.nativeElement, 'mouseover', (event: any) => {
        this.renderer2.setStyle(btn, 'visibility', 'visible');
      });

      this.renderer2.listen(this.dialog.nativeElement, 'mouseout', (event: any) => {
        this.renderer2.setStyle(btn, 'visibility', 'hidden');
      });

      this.renderer2.setStyle(this.dialog.nativeElement, 'width', this.minWidth);
      this.renderer2.setStyle(this.dialog.nativeElement, 'height', this.minHeight);
    }
  }
  private mousemove($event) {
    let deltaWidth = this.dimension.width - (this.position.x - $event.clientX);
    let deltaHeight = this.dimension.height - (this.position.y - $event.clientY);
    if (this.minWidth > deltaWidth) {
      deltaWidth = this.minWidth;
    }
    if (this.minHeight > deltaHeight) {
      deltaHeight = this.minHeight;
    }
    const newDimensions = {
      width: deltaWidth + 'px',
      height: deltaHeight + 'px'
    };
    this.renderer2.setStyle(this.dialog.nativeElement, 'width', newDimensions.width);
    this.renderer2.setStyle(this.dialog.nativeElement, 'height', newDimensions.height);
    return false;
  }
  private mousemoveDrag($event) {
    let deltaX = $event.clientX - this.position.x;
    let deltaY = $event.clientY - this.position.y;
    const maxX = window.innerWidth - this.dialog.nativeElement.offsetWidth;
    const minX = 0;
    const maxY = window.innerHeight - this.dialog.nativeElement.offsetHeight;
    const minY = 0;
    if(minX > deltaX){
      deltaX = minX
    }else if(maxX < deltaX){
      deltaX = maxX
    }
    if(minY > deltaY){
      deltaY = minY
    }else if(maxY < deltaY){
      deltaY = maxY
    }
    this.setPosition(deltaX, deltaY);
    return false;
  }
  private mouseup() {
    this.destroyMouseListeners()
  }
  private destroyMouseListeners() {
    if (this.mouseMoveListener) {
      this.mouseMoveListener();
    }

    if (this.mouseUpListener) {
      this.mouseUpListener();
    }
  }
  private setPosition(left, top) {
    this.renderer2.setStyle(this.elRef.nativeElement, 'top', `${top}px`);
    this.renderer2.setStyle(this.elRef.nativeElement, 'left', `${left}px`);
    this.currentPosition = { top, left };
  }
}
