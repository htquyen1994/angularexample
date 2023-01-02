import { Component, OnInit, Input, ViewChild, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, NgZone } from '@angular/core';
import { Galleria } from 'primeng/galleria';
import { DetailPanelImagesService } from '../../../shared/services/detail-panel-images.service';
import { ActionMessageService, AccountService, HttpService, AppInsightsService } from 'src/client/app/shared';
import { Subscription, BehaviorSubject } from 'rxjs';
import { decorateError, IErrorResponse } from 'src/client/app/shared/http.util';
import { ILayer, IAccount } from 'src/client/app/shared/interfaces';
import { DocumentFormComponent } from '../../document-form/document-form.component';
import { DeleteConfirmComponent } from '@client/app/shared/containers';
import { ModalService } from 'src/client/app/shared/services/modal.service';
import { first } from 'rxjs/operators';
import { ResultStatus } from 'src/client/app/shared/models/modal.model';
import { TypeOfImage } from '../../../shared/models/detail-panel.model';

export interface IImage {
  previewImageSrc: string;
  thumbnailImageSrc: string;
  alt: string;
  title: string;
}

@Component({
  selector: 'go-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ImagesComponent implements OnInit {
  @Input() type: TypeOfImage;
  @Input('id')
  set _id(value: string) {
    this.id = value;
    if (this.id) {
      this.getImages(this.id);
    }
  };
  @Input() layer: ILayer;
  @Input() openUpload = false;
  id: string;
  showThumbnails: boolean;
  fullscreen: boolean = false;
  activeIndex: number = 0;
  onFullScreenListener: any;
  @ViewChild('galleria') galleria: Galleria;
  @ViewChild('documentForm') documentForm: DocumentFormComponent;
  responsiveOptions: any[] = [
    {
      breakpoint: '1024px',
      numVisible: 5
    },
    {
      breakpoint: '768px',
      numVisible: 3
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];
  uploadedFiles: any[] = [];
  subscription: Subscription;
  loading$ = new BehaviorSubject<boolean>(false);
  files: any[] = [];
  error: IErrorResponse;
  username: string;
  canDeleteDocuments: boolean = false;
  submitting: boolean = false;
  constructor(
    private cd: ChangeDetectorRef,
    private detailPanelImagesService: DetailPanelImagesService,
    private actionMessageService: ActionMessageService,
    private accountService: AccountService,
    private httpService: HttpService,
    private modalService: ModalService,
    private ngZone: NgZone,
    private applicationInsightsService: AppInsightsService
  ) {
  }

  ngOnInit() {

    this.accountService.account.subscribe((item: IAccount) => {
      this.canDeleteDocuments = item.canDeleteDocuments;
      this.username = item.username;
    });
    this.bindDocumentListeners();
  }

  ngOnDestroy() {
    this.unbindDocumentListeners();
  }

  getImages(id, success?: Function) {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.loading$.next(true);
    this.files = [];
    this.cd.detectChanges();
    this.subscription = this.detailPanelImagesService.getImages(this.type, id).subscribe(e => {
      e.forEach(file => {
        if (this.isImageName(file.name)) {
          this.files.push(file);
        }
      })
      if (success) success();
      this.loading$.next(false);
      this.cd.detectChanges();
    }, err => {
      this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
      this.cd.detectChanges();
    });
  }

  onThumbnailButtonClick() {
    this.showThumbnails = !this.showThumbnails;
    this.cd.detectChanges();
  }

  toggleFullScreen() {
    if (this.fullscreen) {
      this.closePreviewFullScreen();
    }
    else {
      this.openPreviewFullScreen();
    }
    this.cd.detectChanges();
  }

  openPreviewFullScreen() {
    let elem = this.galleria.element.nativeElement.querySelector(".ui-galleria");
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
    else if (elem['mozRequestFullScreen']) { /* Firefox */
      elem['mozRequestFullScreen']();
    }
    else if (elem['webkitRequestFullscreen']) { /* Chrome, Safari & Opera */
      elem['webkitRequestFullscreen']();
    }
    else if (elem['msRequestFullscreen']) { /* IE/Edge */
      elem['msRequestFullscreen']();
    }
    this.cd.detectChanges();
  }

  onFullScreenChange() {
    this.fullscreen = !this.fullscreen;
    this.cd.detectChanges();
  }

  closePreviewFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    else if (document['mozCancelFullScreen']) {
      document['mozCancelFullScreen']();
    }
    else if (document['webkitExitFullscreen']) {
      document['webkitExitFullscreen']();
    }
    else if (document['msExitFullscreen']) {
      document['msExitFullscreen']();
    }
    this.cd.detectChanges();
  }

  bindDocumentListeners() {
    this.onFullScreenListener = this.onFullScreenChange.bind(this);
    document.addEventListener("fullscreenchange", this.onFullScreenListener);
    document.addEventListener("mozfullscreenchange", this.onFullScreenListener);
    document.addEventListener("webkitfullscreenchange", this.onFullScreenListener);
    document.addEventListener("msfullscreenchange", this.onFullScreenListener);
  }

  unbindDocumentListeners() {
    document.removeEventListener("fullscreenchange", this.onFullScreenListener);
    document.removeEventListener("mozfullscreenchange", this.onFullScreenListener);
    document.removeEventListener("webkitfullscreenchange", this.onFullScreenListener);
    document.removeEventListener("msfullscreenchange", this.onFullScreenListener);
    this.onFullScreenListener = null;
  }

  onActiveItemChange(event) {
    this.cd.detectChanges();
  }

  galleriaClass() {
    return `custom-galleria ${this.fullscreen ? 'fullscreen' : ''}`;
  }

  fullScreenIcon() {
    return `${this.fullscreen ? 'fullscreen-exit' : 'fullscreen'}`;
  }

  onSave(data) {
    this.applicationInsightsService.logEvent('Details Panel', 'Images', 'Add Image');

    this.submitting = true;
    this.error = null;
    this.cd.detectChanges();
    const { file, description } = data;
    // handle save file
    this.detailPanelImagesService.saveImages(this.type, this.id, description, file).subscribe(
      response => {
        this.submitting = false;
        this.getImages(this.id, () => {
          this.activeIndex = this.files.length ? this.files.length - 1 : 0;
          this.cd.detectChanges();
        });
        this.actionMessageService.sendSuccess("Upload image successful");
        this.documentForm.clearForm();
        this.cd.detectChanges();
        this.documentForm.changeDetectorRef.detectChanges();
      },
      error => {
        this.error = decorateError(error);
        this.cd.detectChanges();
      }, () => {
        this.submitting = false;
        this.cd.detectChanges();
      });
  }

  onDelete(file) {
    // handle delete file
    this.openModalConfirm(() => this.deleteFile(file));
    this.cd.detectChanges();
  }

  deleteFile(file) {
    this.loading$.next(true);
    this.detailPanelImagesService.removeImages(this.type, this.id, file.name).subscribe((data: any) => {
      this.loading$.next(false);
      if (!data.success) {
        this.actionMessageService.sendError("Delete file not successfully");
        this.cd.detectChanges();
      } else {
        this.activeIndex = 0;
        this.getImages(this.id);
        this.cd.detectChanges();
      }
    }, error => {
      this.loading$.next(false);
      this.actionMessageService.sendError(decorateError(error).error.code);
      this.cd.detectChanges();
    });
  }
  onDownload(file: any) {
    this.httpService.downloadFile(file.uri);
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

  isImageName(name: string) {
    if (!name) return false;
    return (name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null);
  }

  getUrl(file) {
    return file.uri
  }
}
