import {Component, Output, EventEmitter, ViewChild, AfterContentInit, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { DialogComponent } from '@client/app/shared/components';
@Component({
    selector: 'go-copy-form',
    moduleId: module.id,
    templateUrl: 'copy-form.component.html',
    styleUrls: ['copy-form.component.less']
})
export class CopyFormComponent implements AfterContentInit {
    @Input() isNotComplete = false
    @ViewChild('dialog', { static: true }) dialog: DialogComponent;
    @Output() close = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<Object>();
    buildTypeOptions: PsSelectOption[] = [{
      value: "Relocation",
      label: "Relocation"
    },{
      value: "Replacement",
      label: "Replacement"
    },{
      value: "Acquisition",
      label: "Acquisition"
    }];
    form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        this.form = this.formBuilder.group({
            Build_Type: ['Relocation', Validators.required]
        });
    }

    ngAfterContentInit() {
        this.dialog.onHide(false);
    }

    onClose() {
        this.close.emit(true);
    }

    onComplete() {
        this.save.emit(this.form.getRawValue());
    }
}
