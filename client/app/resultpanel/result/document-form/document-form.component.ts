import {
    Component,
    EventEmitter,
    AfterContentInit,
    ViewChild,
    Output,
    Input,
    Inject,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    ViewEncapsulation,
    NgZone
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    HttpService,
    FileUploader,
    API_BASE_HREF,
    AccountService,
    createSimpleError,
    IErrorResponse,
    FILETYPEs,
    FILETYPE,
    ICONSLIST
} from '../../../shared';


import { IAccount, ILayer, DocumentFile } from '../../../shared/interfaces';
import { LayerType } from '../../../shared/enums';
import { FileItem } from '../../../shared/file-upload/file-item.class';
import { ModalService } from '../../../shared/services/modal.service';
import { decorateError } from '../../../shared/http.util';
import { DeleteConfirmComponent } from '@client/app/shared/containers';

import { first } from 'rxjs/operators';
import { ResultStatus } from '../../../shared/models/modal.model';
import { FileLikeObject } from 'src/client/app/shared/file-upload/file-like-object.class';

@Component({
    selector: 'go-document-form',
    moduleId: module.id,
    templateUrl: 'document-form.component.html',
    styleUrls: ['document-form.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DocumentFormComponent {
    @Output() save = new EventEmitter<{ file: any, description: string }>();
    @Output() delete = new EventEmitter<{ file: any }>();
    @Input() files: DocumentFile[] = [];
    @Input() loading = false;
    @Input() showPreview = true;
    // @Input()
    // set layer(layer: ILayer) {
    //     if (layer) {

    //         this.activeLayer = Object.assign({}, layer);

    //         this.activeLayer.columnGroups.map(item => {
    //             item.expanded = true;
    //             return item.children = [];
    //         });
    //         this.activeLayer.columns.forEach((item) => {

    //             if (item.groupId >= 0) {
    //                 if (!(item.notFilterable || item.notSelectable)) {
    //                     this.activeLayer.columnGroups[item.groupId].children.push(item);
    //                 }
    //                 item.expanded = true;
    //             }
    //         });
    //     }
    // }
    @Input() allowImages = false;
    @Input() allowDocuments = true;
    @Input() error: IErrorResponse;
    accept: {
        value: string;
        display: string;
    }[] = [];
    form: FormGroup;
    isNotComplete = true;
    username: string;

    uploader: FileUploader;
    private layerType = LayerType;
    private uploadedResponses: {
        file: string;
        status: string;
        uploadedFile: string;
    }[] = [];
    private lastFileName: string = null;
    // private editLayerDataSubscription: Subscription;
    get getAccept() {
        return this.accept.map(e => e.value).join(',')
    }
    get getAcceptDisplay() {
        return this.accept.map(e => e.display).join(' ')
    }
    iconList = ICONSLIST();
    constructor(
        private formBuilder: FormBuilder,
        private httpService: HttpService,
        private accountService: AccountService,
        public changeDetectorRef: ChangeDetectorRef,
        private modalService: ModalService,
        private ngZone: NgZone) {

        this.uploader = new FileUploader({
            headers: [
                { name: 'X-Requested-With', value: 'XMLHttpRequest' },
                { name: 'enctype', value: 'multipart/form-data' }
            ],
            url: '/api' + API_BASE_HREF + 'DocumentImport/createfile',
            autoUpload: true
        });

        this.uploader.onProgressItem = () => {
            this.changeDetectorRef.detectChanges();
        }
        this.uploader.onWhenAddingFileFailed = (item: FileLikeObject) => {
          this.error = createSimpleError(`Please upload supported file type.`);
          this.detectChange();
        }

        this.uploader.onBeforeUploadItem = (item: FileItem) => {
          this.error = null;
          this.detectChange();
        }

        this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
            try { // try catch because of respone = ""
                const data = JSON.parse(response);
                if (data.status === 'failed') {
                    throw createSimpleError(data)
                } else {
                    this.lastFileName = data.uploadedFile;
                }
                this.form.controls['file'].updateValueAndValidity();
                this.changeDetectorRef.detectChanges();
            } catch (error) {
                this.error = decorateError(error)
                this.lastFileName = null;
                this.changeDetectorRef.detectChanges();
            }
        };

        this.uploader.onCompleteAll = () => {
            if (this.lastFileName) {
                this.form.controls['file'].setValue(this.lastFileName);
            }
            this.form.controls['file'].updateValueAndValidity();

            this.isNotComplete = false;
            this.changeDetectorRef.detectChanges();
        };
    }

    ngOnInit() {
        const allowedFileType = []
        if (this.allowImages) {
            this.accept = [...this.accept, ...FILETYPEs.filter(e => e.type === FILETYPE.IMAGE)];
            allowedFileType.push('image');
        }
        if (this.allowDocuments) {
            this.accept = [...this.accept, ...FILETYPEs.filter(e => e.type === FILETYPE.DOCUMENT)]
            allowedFileType.push(...['doc','xls','ppt', 'pdf']);
        }
        this.uploader.setOptions({
          allowedFileType
        })
        this.createForm();
        this.accountService.account.subscribe((item: IAccount) => {
            this.username = item.username;
        });
    }

    onComplete() {
        this.error = null;
        const formValue = this.form.getRawValue();
        this.save.next(formValue);
    }

    createForm() {
        this.form = this.formBuilder.group({
            file: ['', [Validators.required]],
            description: ['', [Validators.required]]
        });
        this.form.valueChanges.subscribe(e => this.changeDetectorRef.detectChanges())
    }

    clearForm() {
        this.uploader.clearQueue();
        this.form.reset();
    }

    onDownload(file: DocumentFile) {
        this.httpService.downloadFile(file.uri);
    }

    onDelete(file: DocumentFile) {
        this.openModal(() => {
            this.delete.next({ file })
        })
    }
    onDeleteFile(item: FileItem) {
        this.openModal(() => {
            this.form.controls['file'].reset();
            this.form.controls['file'].updateValueAndValidity();
            this.uploader.removeFromQueue(item);
            this.changeDetectorRef.detectChanges();
        })
    }

    openModal(success: Function, cancel?: Function) {
        this.ngZone.run(() => {
            const ref = this.modalService.openModal(DeleteConfirmComponent, { deleteModel: { title: 'Delete Document', content: 'Are you sure you want to delete this document?' } })
            ref.afterClosed().pipe(first()).subscribe(res => {
                if (res) {
                    if (res.status == ResultStatus.OK) {
                        success();
                    } else {
                        cancel();
                    }
                }
            })
        })
    }
    onExpand(file) {
        file.isExpanded = !file.isExpanded;
        this.changeDetectorRef.detectChanges();
    }

    getUri(file: DocumentFile) {
        if (this.isImageName(file.name)) {
            return file.uri
        } else {
            return this.getFileExtension(file.name);
        }
    }

    getFileExtension(filename: string) {
        let ext = filename.split(".").pop();
        let obj = this.iconList.filter(row => {
            if (ext.startsWith(row.type)) {
                return true;
            }
        });
        if (obj.length > 0) {
            let icon = obj[0].icon;
            return icon;
        } else {
            return "client/assets/images/image_unrecognize.png";
        }
    }
    isImageName(name: string) {
        if (!name) return false;
        return (name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null);
    }
    checkFileType(file: DocumentFile){

    }
    detectChange(){
      this.changeDetectorRef.detectChanges();
    }
}
