import {FileLikeObject} from './file-like-object.class';
import {FileItem} from './file-item.class';
import {FileType} from './file-type.class';

function isFile(value:any):boolean {
  return (File && value instanceof File);
}
// function isFileLikeObject(value:any) {
export interface Headers {
  name:string;
  value:string;
}

export type ParsedResponseHeaders = {[headerFieldName:string]:string};

export type FilterFunction = {name:string, fn:(item?:FileLikeObject, options?:FileUploaderOptions)=>boolean};

export interface FileUploaderOptions {
  allowedMimeType?:Array<string>;
  allowedFileType?:Array<string>;
  autoUpload?:boolean;
  isHTML5?:boolean;
  filters?:Array<FilterFunction>;
  headers?:Array<Headers>;
  method?:string;
  authToken?:string;
  maxFileSize?:number;
  rollbackAllWhenFailed?: boolean;
  queueLimit?:number;
  removeAfterUpload?:boolean;
  url?:string;
  disableMultipart?:boolean;
}

export class FileUploader {

  public authToken:string;
  public isUploading:boolean = false;
  public queue:Array<FileItem> = [];
  public progress:number = 0;
  public _nextIndex:number = 0;
  public autoUpload:any;

  public options:FileUploaderOptions = {
    autoUpload: false,
    isHTML5: true,
    filters: [],
    removeAfterUpload: false,
    disableMultipart: false
  };

  private _failFilterIndex:number;

  public constructor(options:FileUploaderOptions) {
    this.setOptions(options);
  }

  public setOptions(options:FileUploaderOptions):void {
    this.options = Object.assign(this.options, options);

    this.authToken = options.authToken;
    this.autoUpload = options.autoUpload;
    this.options.filters.unshift({name: 'queueLimit', fn: this._queueLimitFilter});

    if (this.options.maxFileSize) {
      this.options.filters.unshift({name: 'fileSize', fn: this._fileSizeFilter});
    }

    if (this.options.allowedFileType) {
      this.options.filters.unshift({name: 'fileType', fn: this._fileTypeFilter});
    }

    if (this.options.allowedMimeType) {
      this.options.filters.unshift({name: 'mimeType', fn: this._mimeTypeFilter});
    }

    // this.options.filters.unshift({id: 'folder', fn: this._folderFilter});
  }

  public addToQueue(files:File[], options?:FileUploaderOptions, filters?:FilterFunction[]|string):void {
    let list:File[] = [];
    for (let file of files) {
      list.push(file);
    }
    let arrayOfFilters = this._getFilters(filters);
    let count = this.queue.length;
    let addedFileItems:FileItem[] = [];
    let hasFailedItem: boolean; 

    list.map((some:File) => {
      if (!options) {
        options = this.options;
      }

      let temp = new FileLikeObject(some);
      if (this._isValidFile(temp, arrayOfFilters, options)) {
        let fileItem = new FileItem(this, some, options);
        addedFileItems.push(fileItem);
        this.queue.push(fileItem);
        this._onAfterAddingFile(fileItem);
      } else {
        let filter = arrayOfFilters[this._failFilterIndex];
        this._onWhenAddingFileFailed(temp, filter, options);
        hasFailedItem = true;
      }
    });

    if (hasFailedItem && options.rollbackAllWhenFailed)
    {
      this.clearQueue();
      return;
    }

    if (this.queue.length !== count) {
      this._onAfterAddingAll(addedFileItems);
      this.progress = this._getTotalProgress();
    }
    this._render();
    if (this.options.autoUpload) {
      this.uploadAll();
    }
  }

  public removeFromQueue(value:FileItem):void {
    let index = this.getIndexOfItem(value);
    let item = this.queue[index];
    if (item.isUploading) {
      item.cancel();
    }
    this.queue.splice(index, 1);
    this.progress = this._getTotalProgress();
  }

  public clearQueue():void {
    while (this.queue.length) {
      this.queue[0].remove();
    }
    this.progress = 0;
  }

  public uploadItem(value:FileItem):void {
    let index = this.getIndexOfItem(value);
    let item = this.queue[index];
    let transport = this.options.isHTML5 ? '_xhrTransport' : '_iframeTransport';
    item._prepareToUploading();
    if (this.isUploading) {
      return;
    }
    this.isUploading = true;
    (this as any)[transport](item);
  }

  public cancelItem(value:FileItem):void {
    let index = this.getIndexOfItem(value);
    let item = this.queue[index];
    let prop = this.options.isHTML5 ? item._xhr : item._form;
    if (item && item.isUploading) {
      prop.abort();
    }
  }

  public uploadAll():void {
    let items = this.getNotUploadedItems().filter((item:FileItem) => !item.isUploading);
    if (!items.length) {
      return;
    }
    items.map((item:FileItem) => item._prepareToUploading());
    items[0].upload();
  }

  public cancelAll():void {
    let items = this.getNotUploadedItems();
    items.map((item:FileItem) => item.cancel());
  }

  public isFile(value:any):boolean {
    return isFile(value);
  }

  public isFileLikeObject(value:any):boolean {
    return value instanceof FileLikeObject;
  }

  public getIndexOfItem(value:any):number {
    return typeof value === 'number' ? value : this.queue.indexOf(value);
  }

  public getNotUploadedItems():Array<any> {
    return this.queue.filter((item:FileItem) => !item.isUploaded);
  }

  public getReadyItems():Array<any> {
    return this.queue
      .filter((item:FileItem) => (item.isReady && !item.isUploading))
      .sort((item1:any, item2:any) => item1.index - item2.index);
  }

  public destroy():void {
    return void 0;
    /*forEach(this._directives, (key) => {
     forEach(this._directives[key], (object) => {
     object.destroy();
     });
     });*/
  }

  public onAfterAddingAll(fileItems:any):any {
    return {fileItems};
  }

  public onBuildItemForm(fileItem:FileItem, form:any):any {
    return {fileItem, form};
  }

  public onAfterAddingFile(fileItem:FileItem):any {
    return {fileItem};
  }

  public onWhenAddingFileFailed(item:FileLikeObject, filter:any, options:any):any {
    return {item, filter, options};
  }

  public onBeforeUploadItem(fileItem:FileItem):any {
    return {fileItem};
  }

  public onProgressItem(fileItem:FileItem, progress:any):any {
    return {fileItem, progress};
  }

  public onProgressAll(progress:any):any {
    return {progress};
  }

  public onSuccessItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):any {
    return {item, response, status, headers};
  }

  public onErrorItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):any {
    return {item, response, status, headers};
  }

  public onCancelItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):any {
    return {item, response, status, headers};
  }

  public onCompleteItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):any {
    return {item, response, status, headers};
  }

  public onCompleteAll():any {
    return void 0;
  }

  public _mimeTypeFilter(item:FileLikeObject):boolean {
    return !(this.options.allowedMimeType && this.options.allowedMimeType.indexOf(item.type) === -1);
  }

  public _fileSizeFilter(item:FileLikeObject):boolean {
    return !(this.options.maxFileSize && item.size > this.options.maxFileSize);
  }

  public _fileTypeFilter(item:FileLikeObject):boolean {
    return !(this.options.allowedFileType &&
    this.options.allowedFileType.indexOf(FileType.getMimeClass(item)) === -1);
  }

  public _onErrorItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):void {
    item._onError(response, status, headers);
    this.onErrorItem(item, response, status, headers);
  }

  public _onCompleteItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):void {
    item._onComplete(response, status, headers);
    this.onCompleteItem(item, response, status, headers);
    let nextItem = this.getReadyItems()[0];
    this.isUploading = false;
    if (nextItem) {
      nextItem.upload();
      return;
    }
    this.onCompleteAll();
    this.progress = this._getTotalProgress();
    this._render();
  }

  protected _headersGetter(parsedHeaders:ParsedResponseHeaders):any {
    return (name:any):any => {
      if (name) {
        return parsedHeaders[name.toLowerCase()] || void 0;
      }
      return parsedHeaders;
    };
  }

  protected _xhrTransport(item:FileItem):any {
    let xhr = item._xhr = new XMLHttpRequest();
    let sendable:any;
    this._onBeforeUploadItem(item);
    // todo
    /*item.formData.map(obj => {
     obj.map((value, key) => {
     form.append(key, value);
     });
     });*/
    if (typeof item._file.size !== 'number') {
      throw new TypeError('The file specified is no longer valid');
    }
    if(!this.options.disableMultipart) {
        sendable = new FormData();
        this._onBuildItemForm(item, sendable);

        sendable.append(item.alias, item._file, item.file.name);
    } else {
        sendable = item._file;
    }

    xhr.upload.onprogress = (event:any) => {
      let progress = Math.round(event.lengthComputable ? event.loaded * 100 / event.total : 0);
      this._onProgressItem(item, progress);
    };
    xhr.onload = () => {
      let headers = this._parseHeaders(xhr.getAllResponseHeaders());
      let response = this._transformResponse(xhr.response, headers);
      let gist = this._isSuccessCode(xhr.status) ? 'Success' : 'Error';
      let method = '_on' + gist + 'Item';
      (this as any)[method](item, response, xhr.status, headers);
      this._onCompleteItem(item, response, xhr.status, headers);
    };
    xhr.onerror = () => {
      let headers = this._parseHeaders(xhr.getAllResponseHeaders());
      let response = this._transformResponse(xhr.response, headers);
      this._onErrorItem(item, response, xhr.status, headers);
      this._onCompleteItem(item, response, xhr.status, headers);
    };
    xhr.onabort = () => {
      let headers = this._parseHeaders(xhr.getAllResponseHeaders());
      let response = this._transformResponse(xhr.response, headers);
      this._onCancelItem(item, response, xhr.status, headers);
      this._onCompleteItem(item, response, xhr.status, headers);
    };
    xhr.open(item.method, item.url, true);
    xhr.withCredentials = item.withCredentials;
    // todo
    /*item.headers.map((value, id) => {
     xhr.setRequestHeader(id, value);
     });*/
    if (this.options.headers) {
      for (let header of this.options.headers) {
        xhr.setRequestHeader(header.name, header.value);
      }
    }
    if (this.authToken) {
      xhr.setRequestHeader('Authorization', this.authToken);
    }
    xhr.send(sendable);
    this._render();
  }

  private _getTotalProgress(value:number = 0):number {
    if (this.options.removeAfterUpload) {
      return value;
    }
    let notUploaded = this.getNotUploadedItems().length;
    let uploaded = notUploaded ? this.queue.length - notUploaded : this.queue.length;
    let ratio = 100 / this.queue.length;
    let current = value * ratio / 100;
    return Math.round(uploaded * ratio + current);
  }

  private _getFilters(filters:FilterFunction[]|string):FilterFunction[] {
    if (!filters) {
      return this.options.filters;
    }
    if (Array.isArray(filters)) {
      return filters;
    }
    if (typeof filters === 'string') {
      let names = filters.match(/[^\s,]+/g);
      return this.options.filters
        .filter((filter:any) => names.indexOf(filter.name) !== -1);
    }
    return this.options.filters;
  }

  private _render():any {
    return void 0;
    // todo: ?
  }

  // private _folderFilter(item:FileItem):boolean {
  //   return !!(item.size || item.type);
  // }

  private _queueLimitFilter():boolean {
    return this.options.queueLimit === undefined || this.queue.length < this.options.queueLimit;
  }

  private _isValidFile(file:FileLikeObject, filters:FilterFunction[], options:FileUploaderOptions):boolean {
    this._failFilterIndex = -1;
    return !filters.length ? true : filters.every((filter:FilterFunction) => {
      this._failFilterIndex++;
      return filter.fn.call(this, file, options);
    });
  }

  private _isSuccessCode(status:number):boolean {
    return (status >= 200 && status < 300) || status === 304;
  }

  /* tslint:disable */
  private _transformResponse(response:string, headers:ParsedResponseHeaders):string {
    // todo: ?
    /*var headersGetter = this._headersGetter(headers);
     forEach($http.defaults.transformResponse, (transformFn) => {
     response = transformFn(response, headersGetter);
     });*/
    return response;
  }

  /* tslint:enable */
  private _parseHeaders(headers:string):ParsedResponseHeaders {
    let parsed:any = {};
    let key:any;
    let val:any;
    let i:any;
    if (!headers) {
      return parsed;
    }
    headers.split('\n').map((line:any) => {
      i = line.indexOf(':');
      key = line.slice(0, i).trim().toLowerCase();
      val = line.slice(i + 1).trim();
      if (key) {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    });
    return parsed;
  }

  /*private _iframeTransport(item:FileItem) {
   // todo: implement it later
   }*/

  private _onWhenAddingFileFailed(item:FileLikeObject, filter:any, options:any):void {
    this.onWhenAddingFileFailed(item, filter, options);
  }

  private _onAfterAddingFile(item:FileItem):void {
    this.onAfterAddingFile(item);
  }

  private _onAfterAddingAll(items:any):void {
    this.onAfterAddingAll(items);
  }

  private _onBeforeUploadItem(item:FileItem):void {
    item._onBeforeUpload();
    this.onBeforeUploadItem(item);
  }

  private _onBuildItemForm(item:FileItem, form:any):void {
    item._onBuildForm(form);
    this.onBuildItemForm(item, form);
  }

  private _onProgressItem(item:FileItem, progress:any):void {
    let total = this._getTotalProgress(progress);
    this.progress = total;
    item._onProgress(progress);
    this.onProgressItem(item, progress);
    this.onProgressAll(total);
    this._render();
  }

  /* tslint:disable */
  private _onSuccessItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):void {
    item._onSuccess(response, status, headers);
    this.onSuccessItem(item, response, status, headers);
  }

  /* tslint:enable */
  private _onCancelItem(item:FileItem, response:string, status:number, headers:ParsedResponseHeaders):void {
    item._onCancel(response, status, headers);
    this.onCancelItem(item, response, status, headers);
  }
}
