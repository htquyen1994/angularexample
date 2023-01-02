import { Component, ViewChild, EventEmitter, AfterContentInit, Output, Inject, Input, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import {
  SelectionService
} from '../../../shared';
import { DialogComponent } from '@client/app/shared/components';
import { ILayer } from '../../../shared/interfaces';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'go-download-form',
  moduleId: module.id,
  templateUrl: 'download-form.component.html',
  styleUrls: ['download-form.component.less']
})
export class DownloadFormComponent implements AfterContentInit {
  @Input('layer') layer: ILayer;
  @Input('error') error: string;
  @ViewChild('dialog', { static: true }) dialog: DialogComponent;
  @Output() close = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<Object>();

  isShapesSelected = true;
  form: FormGroup;
  isLoading = false;
  fileTypeOptions: PsSelectOption[] = [{
    value: '1',
    label: 'Excel (xlsx)'
  }, {
    value: '2',
    label: 'Shapefile (shp)'
  }]
  selectionTypeOptions: PsSelectOption[] = [{
    value: '1',
    label: 'Current page'
  }]
  constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
    private selectionService: SelectionService,
    private changeDetectorRef: ChangeDetectorRef) {
    this.form = this.formBuilder.group({
      selectionType: ['1'],
      fileType: ['1']
    });
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
    const selection = this.selectionService.selectionStore.get(this.layer.id);
    this.isShapesSelected = selection && selection.size !== 0;
    if (this.isShapesSelected) {
      this.selectionTypeOptions = [...this.selectionTypeOptions, {
        value: '2',
        label: 'Selected records'
      }];
    }
    if (this.layer.isDownloadable) {
      this.selectionTypeOptions = [...this.selectionTypeOptions, {
        value: '3',
        label: 'All records'
      }]
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    this.changeDetectorRef.detectChanges();
  }

  onClose(state: boolean) {
    this.isLoading = false;
    this.close.emit(state);
  }

  onComplete() {
    this.save.emit(this.form.getRawValue());
    this.isLoading = true;
  }
}
