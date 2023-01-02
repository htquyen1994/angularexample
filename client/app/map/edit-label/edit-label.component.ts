import { Component, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  AccountService, DrawingOverlay,
  OverlayService,
  OverlayShapeCircle,
  UNITS, SelectionService
} from '../../shared';
import { OverlayShapeType, OverlayShapeChangeType } from '../../shared/enums';

@Component({
  selector: 'go-edit-label',
  moduleId: module.id,
  templateUrl: 'edit-label.component.html',
  styleUrls: ['edit-label.component.less']
})
export class EditLabelComponent {
  @ViewChild('wrapper') wrapper: ElementRef
  form: FormGroup;
  shape: OverlayShapeCircle;
  isRight = false;
  private changeSubscription: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    public accountService: AccountService,
    public selectionService: SelectionService,
    private changeDetectorRef: ChangeDetectorRef,
    public overlayService: OverlayService,
    private el: ElementRef) {
  }
  ngOnInit(): void {
    const minValidator = (control: AbstractControl) => {
      return control.value !== null && control.value > 0 ? null : {
        minError: 'Value must be bigger than 0'
      };
    };
    this.form = this.formBuilder.group({
      value: ['', minValidator]
    });
  }

  ngAfterViewInit() {

    this.selectionService.active.subscribe(data => {
      this.shape = null;

      const overlay = this.overlayService.overlays.get(data.overlayId);

      if (overlay) {
        this.shape = <OverlayShapeCircle>overlay.shapes.get(data.shapeId);
      }

      if (this.changeSubscription) {
        this.changeSubscription.unsubscribe();
      }

      if (data.isAdd && this.shape && overlay instanceof DrawingOverlay && this.shape.type === OverlayShapeType.Circle) {
        this.changeSubscription = this.shape.change.subscribe(change => {
          if (change === OverlayShapeChangeType.RADIUS_CHANGED) {
            this.updateRadius();
          }
        });

        this.updateRadius();
        this.form.enable();
        this.checkPosition();
      } else {
        this.form.reset();
        this.form.disable();
      }

      this.changeDetectorRef.detectChanges();
    });

    this.form.disable();

    this.form.valueChanges.subscribe(() => {
      this.changeDetectorRef.detectChanges();
    });

    this.accountService.account.subscribe(() => {
      if (this.form.enabled) {
        this.updateRadius();
      }
      this.checkPosition();
    });

  }

  onComplete() {
    const form: any = this.form.getRawValue();
    const value = this.accountService.accountStore.isMetric ?
      form.value * UNITS.KILOMETER.constant : form.value * UNITS.MILE.constant;

    this.shape.setRadius(value);
  }

  private formatLength(value: number, isMetric: boolean): number {
    return Number((value / (isMetric ? UNITS.KILOMETER.constant : UNITS.MILE.constant)).toPrecision(3));
  }

  private updateRadius() {
    const radius = this.shape.mapRef[0].getRadius();
    const value = this.formatLength(radius, this.accountService.accountStore.isMetric);
    this.form.controls['value'].setValue(value);
  }

  private checkPosition() {
    let _isRight = false;
    const { width } = this.wrapper.nativeElement.getBoundingClientRect();
    const { x } = this.el.nativeElement.getBoundingClientRect();
    if (x + width > window.innerWidth - 70) {
      _isRight = true;
    }
    if (this.isRight != _isRight) {
      this.isRight = _isRight;
      this.changeDetectorRef.detectChanges();
    }
  }
}
