import {
  Directive,
  Input,
  OnInit, 
  Renderer2, ElementRef
} from '@angular/core';

@Directive({ selector: '[spinnerbtn]' })
export class SpinnerBtnDirective implements OnInit {
  elRef:any;
  @Input()
  set spinnerbtn(loading) {
    if (loading) {
      this.elRef = this.renderer.createElement("i");
      this.renderer.addClass(this.elRef, "fa");
      this.renderer.addClass(this.elRef, "fa-spinner");
      this.renderer.addClass(this.elRef, "fa-spin");
      this.renderer.addClass(this.elRef, "fa-fw");
      this.renderer.setStyle(this.elRef, 'margin-right', '5px');
      this.renderer.insertBefore(this.el.nativeElement, this.elRef, this.el.nativeElement.firstChild);
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
    }
    else {
      if(this.elRef)
      {
        this.renderer.removeChild(this.el.nativeElement, this.elRef);
        this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
      }
    }
  };

  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  ngOnInit() {
    
  }
}
