import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { EStateInsight } from '@client/app/shared/enums';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { H3_RESOLUTIONS } from '@client/app/shared';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'ps-match-tool-bar',
  templateUrl: './match-tool-bar.component.html',
  styleUrls: ['./match-tool-bar.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchToolBarComponent implements OnInit {
  private unsubscribe$: Subject<void> = new Subject<void>();
  @Input() isLoading: boolean = false;
  @Input() data: any;
  @Input() previewData: any;
  @Input() stateView: EStateInsight;
  @Input() polygonOptions: any[];
  @Input() disablePreviewMatch: boolean;
  @Input() showClearResult: boolean;
  @Output() previewMatch = new EventEmitter<any>();
  @Output() changeState = new EventEmitter<EStateInsight>();
  @Output() changeShape = new EventEmitter<number>();
  @Output() saveMatch = new EventEmitter<any>();

  public readonly EStateInsight = EStateInsight;
  public readonly resolutionOptions: PsSelectOption[] = H3_RESOLUTIONS.map(e => ({ value: e.resolution, label: e.label }));

  public matchItform: FormGroup;

  constructor() { }

  ngOnInit(): void {
    this.initForm(this.data);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initForm(data: any) {
    if (!this.matchItform) {
      this.matchItform = new FormGroup({
        desiredMatch: new FormControl(50, [Validators.required, Validators.max(25000)]),
        shape: new FormControl(0),
        resolution: new FormControl(4)
      });
      this.matchItform.get('shape').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value=>{
        this.onChangeShape(value)
      })
    }
    if (data) {
      this.matchItform.patchValue({ ...data })
    }
  }

  onPreviewMatch() {
    const data = this.matchItform.getRawValue();
    this.previewMatch.emit(data);
  }

  onChangeState(value: EStateInsight) {
    this.changeState.emit(value)
  }

  onChangeShape(value) {
    this.changeShape.emit(value);
  }

  onNewLayerFromMatch(){
    this.saveMatch.emit(this.previewData);
  }

  clearResults_Match(){

  }
}
