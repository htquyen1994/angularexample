import { Component, OnInit, Input, ChangeDetectorRef, ViewChild, EventEmitter, Output, ChangeDetectionStrategy, ViewEncapsulation, NgZone } from '@angular/core';
import { IErrorResponse, SelectionService, LayerDataService, AppInsightsService, AccountService, isImageName, getFileExtension } from 'src/client/app/shared';
import { ILayer, DocumentFile, IAccount } from 'src/client/app/shared/interfaces';
import { decorateError } from 'src/client/app/shared/http.util';
import { DocumentFormComponent } from '../../document-form/document-form.component';
import { DetailPanelDocumentService } from '../../../shared/services/detail-panel-document.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { ModalService } from 'src/client/app/shared/services/modal.service';
import { DeleteConfirmComponent } from '@client/app/shared/containers';
import { ResultStatus } from 'src/client/app/shared/models/modal.model';

@Component({
  selector: 'go-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DocumentsComponent implements OnInit {
  @ViewChild('documentForm') documentForm: DocumentFormComponent;
  @Output() close = new EventEmitter<boolean>();
  @Input()
  set layer(layer: ILayer) {
    if (layer && !this._layer) {
      this._layer = Object.assign({}, layer);
      if (this.id && this._layer) {
        this.updateDocuments();
      }
    }
  }
  @Input('id')
  set _id(value: string) {
    this.id = value;
    if (this.id && this._layer) {
      this.updateDocuments();
    }
  };
  @Input() openUpload = false;
  get layer() {
    return this._layer;
  }
  error: IErrorResponse;
  _layer: ILayer;
  files: any[] = [];
  submitting: boolean = false;
  loading$ = new BehaviorSubject<boolean>(false);
  //username$: Observable<string>;
  canDeleteDocuments: boolean = false;
  username: string = "";
  private id: string;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private applicationInsightsService: AppInsightsService,
    private detailPanelDocumentService: DetailPanelDocumentService,
    private accountService: AccountService,
    private modalService: ModalService,
    private ngZone: NgZone,
  ) {

  }

  ngOnInit() {

    this.accountService.account.subscribe((item: IAccount) => {
      this.canDeleteDocuments = item.canDeleteDocuments;
      this.username = item.username;
    });

    //this.username$ = this.accountService.account.pipe(map(e => e.username));

  }

  onSave(data) {

    this.applicationInsightsService.logEvent('Details Panel', 'Documents', 'Add Document');

    this.submitting = true;
    this.error = null;
    this.changeDetectorRef.detectChanges();
    const { file, description } = data;
    this.detailPanelDocumentService.saveDocument(
      "BranchDocuments",
      this.id,
      description,
      file).subscribe(
        response => {
          this.submitting = false;
          this.updateDocuments();
          this.documentForm.clearForm();
          this.changeDetectorRef.detectChanges();
        },
        error => {
          this.error = decorateError(error);
          this.changeDetectorRef.detectChanges();
        }, () => {
          this.submitting = false;
          this.changeDetectorRef.detectChanges();
        });
  }

  onDelete(file){
    this.openModalConfirm(() => this.delete(file));
    this.changeDetectorRef.detectChanges();
  }

  delete(file) {
    this.detailPanelDocumentService.removeDocument(
      "BranchDocuments",
      this.id,
      file.name).subscribe((data: any) => {
        if (!data.success) {
          this.error = data.error;
          this.changeDetectorRef.detectChanges();
        } else {
          // rebind document list
          this.updateDocuments();
          this.changeDetectorRef.detectChanges();
        }
      }, error => {
        this.error = decorateError(error);
        this.changeDetectorRef.detectChanges();
      });
  }

  updateDocuments() {
    this.loading$.next(true);
    this.files = [];
    this.detailPanelDocumentService.getDocuments("BranchDocuments", this.id).subscribe((data: any[]) => {
      data.forEach(file => {
        this.files.push(file);
      })
      this.loading$.next(false);
      this.changeDetectorRef.detectChanges();
      // this.documentForm.detectChange();
    });
  }

  openModalConfirm(success: Function, cancel?: Function) {
    this.ngZone.run(() => {
      const ref = this.modalService.openModal(DeleteConfirmComponent, { deleteModel: { title: 'Delete Document', content: 'Are you sure you want to delete this document?' } });
      ref.afterClosed().pipe(first()).subscribe(res => {
        if (res) {
          if (res.status == ResultStatus.OK) {
            success();
          } else {
            cancel();
          }
        }
      })
    });
  }

  getUri(file: DocumentFile) {
    if (isImageName(file.name)) {
      return file.uri
    } else {
      return getFileExtension(file.name);
    }
  }
}
