import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { IAccount } from '@admin-shared/models/account';
import { IDropdownItem } from '@admin-shared/components/periscope-dropdown/periscope-dropdown';
import { FunctionalityFilterState } from '@admin-modules/functionality/interfaces';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ps-functionality-filter',
  templateUrl: './functionality-filter.component.html',
  styleUrls: ['./functionality-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FunctionalityFilterComponent implements OnInit {
  @Input() filterData: any;
  @Input() tenantLoading: boolean;
  @Input() tenantOptions: IDropdownItem[];
  @Input() disabledDownload: boolean;
  @Input() loadingDownload: boolean;
  @Output() download = new EventEmitter<any>();
  @Output() changed = new EventEmitter<FunctionalityFilterState>();
  private unsubscribe$: Subject<void> = new Subject<void>();
  public formGroup: FormGroup;
  constructor() { }

  ngOnInit(): void {
    this.initForm(this.filterData);
  }

  initForm(data?: any){
    if(!this.formGroup){
      this.formGroup = new FormGroup({
        tenantId: new FormControl(null, Validators.required)
      })
      this.formGroup.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value=>{
        this.changed.emit(value)
      })
    }
    if(data){
      this.formGroup.patchValue(data, { emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onDownload() {
    this.download.emit();
  }

}
