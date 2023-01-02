import { Component, ViewChild, ElementRef, EventEmitter, AfterContentInit, Output, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl, ValidatorFn } from '@angular/forms';
import {
    FileUploader,
    LayerService,
    LayerGroupService,
    API_BASE_HREF,
    AccountService,
    createSimpleError,
    IErrorResponse,
    ActionMessageService
} from '../../../shared';
import {
  DialogComponent,
} from '@client/app/shared/components'
import { FileItem } from '../../../shared/file-upload/file-item.class';
import { FileLikeObject } from '../../../shared/file-upload/file-like-object.class';
import { IAccount, ILayer, ILayerCreate, convertToILayerColumnType, convertToLongType } from '../../../shared/interfaces';
import { ILayerColumnTypeLong, LayerCreationMethod, LayerType, LayerJoinType, ILayerColumnType } from '../../../shared/enums';
import { decorateError } from '../../../shared/http.util';
import { combineLatest, ReplaySubject, Observable, TimeoutError } from 'rxjs';
import { debounceTime, map, timeout } from 'rxjs/operators';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
    selector: 'go-layer-create-form',
    moduleId: module.id,
    templateUrl: 'layer-create-form.component.html',
    styleUrls: ['layer-create-form.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerCreateFormComponent implements AfterContentInit {
    @ViewChild('dialog', { static: true }) dialog: DialogComponent;
    @ViewChild('browseFileBtn')
    browseFileBtn: ElementRef;
    @Output() close = new EventEmitter<boolean>();
    guid = 1;
    page = 1;
    form: FormGroup;
    error: IErrorResponse;
    warnings: IErrorResponse;
    formPage1: FormGroup;
    formPage2: FormGroup;
    layers: ILayer[] = [];
    layerTypes: any[] = [];
    layerColumnTypeLong = ILayerColumnTypeLong;
    creationMethod: LayerCreationMethod;
    isLoading = new ReplaySubject<boolean>();
    isCSVLayer = true;
    isDevMode = false;
    overFileSizeInQueue = false;
    typeOptions: PsSelectOption[]=[{
      value: LayerType.POINT,
      label: 'Points'
    },{
      value: LayerType.POLYLINE,
      label: 'Lines'
    },{
      value: LayerType.POLYGON,
      label: 'Polygons'
    }];
    readonly columnBasicTypeOptions: PsSelectOption[]=[{
      value: ILayerColumnTypeLong.BOOLEAN,
      label: 'True / False'
    },{
      value: ILayerColumnTypeLong.NUMBER,
      label: 'Number (Integer)'
    },{
      value: ILayerColumnTypeLong.FLOAT,
      label: 'Number (Decimal)'
    },{
      value: ILayerColumnTypeLong.DATE,
      label: 'Date'
    },{
      value: ILayerColumnTypeLong.STRING,
      label: 'Text (short)'
    },{
      value: ILayerColumnTypeLong.TEXT,
      label: 'Text (Long)'
    },{
      value: ILayerColumnTypeLong.COLOUR,
      label: 'Colour'
    }];
    readonly columnCoordinateTypeOptions: PsSelectOption[]=[{
      value: ILayerColumnTypeLong.LATITUDE,
      label: 'Latitude'
    },{
      value: ILayerColumnTypeLong.LONGITUDE,
      label: 'Longitude'
    }];
    columnPostcodeTypeOptions: PsSelectOption[] = [{
      value: ILayerColumnTypeLong.POSTCODE,
      label: 'True / False'
    }]
    get columnTypeOptions():PsSelectOption[]{
      const selectOptions = [...this.columnBasicTypeOptions];
      if (this.formPage1) {
        const { method } = this.formPage1.getRawValue();
        if (method === LayerCreationMethod.POSTCODE) {
          selectOptions.push(...this.layerTypes.map(e => ({ value: e.value, label: e.name })));
        } else if (method === LayerCreationMethod.COORDINATES) {
          selectOptions.push(...this.columnCoordinateTypeOptions);
        }
      }
      return selectOptions;
    }
    get columnIdentifierOptions():PsSelectOption[]{
      const selectOptions = [];
      if (this.formPage2) {
        const { columnGroups }=  this.formPage2.getRawValue();
        selectOptions.push(...(<any[]>columnGroups).map((group, index)=>{
          return {
            value: index,
            label: group.name,
            items: (group.columns || []).map((column)=>{
              return {
                label: column.name,
                value: column.id
              } as PsSelectOption
            })
          } as PsSelectOption
        }))
      }
      return selectOptions;
    }
    get joinLayerOptions():PsSelectOption[]{
      const selectOptions = [];
      if (this.layers && this.layers.length) {
        selectOptions.push(...this.layers.map(e=>{
          return {
            label: e.name,
            value: e.id
          } as PsSelectOption
        }))
      }
      return selectOptions;
    }
    layerGroupOptions$: Observable<PsSelectOption[]>;
    private uploader: FileUploader;
    layerCreationMethod = LayerCreationMethod;
    private lastFileName: string = null;
    private layerType = LayerType;
    constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef,
        private layerService: LayerService,
        private accountService: AccountService,
        private actionMessageService: ActionMessageService,
        private layerGroupService: LayerGroupService) {

        this.uploader = new FileUploader({
            headers: [
                { name: 'X-Requested-With', value: 'XMLHttpRequest' },
                { name: 'enctype', value: 'multipart/form-data' }
            ],
            url: '/api' + API_BASE_HREF + 'dataimport/',
            autoUpload: true,
            maxFileSize: 100 * 1024 * 1024,
            rollbackAllWhenFailed: true
        });

        this.uploader.onProgressItem = (item: any, process: any) => {
            this.changeDetectorRef.detectChanges();
        }

        this.uploader.onCompleteItem = (item: any, response: any) => {

            if (response === '') {
                return;
            }
            try {
                const data = JSON.parse(response);
                if (data.isError) {
                    const error = decorateError(JSON.parse(data.message));
                    // TODO check
                    throw error;
                } else {
                    item.error = null;
                    this.lastFileName = data.file;
                }
            } catch (error) {
                item.error = decorateError(error);
                this.lastFileName = null;
            }
            this.changeDetectorRef.detectChanges();
            // this.formPage1.controls['file'].updateValueAndValidity();
        };

        this.uploader.onCompleteAll = () => {
            if (this.lastFileName) {
                this.formPage1.controls['file'].setValue(this.lastFileName);
            }

            this.overFileSizeInQueue = false;
            // this.error = [];
            this.formPage1.controls['file'].updateValueAndValidity();
            this.changeDetectorRef.detectChanges();
        };


        this.uploader.onWhenAddingFileFailed = (fileItem: FileLikeObject, filter: any) => {
            if (filter.name === 'fileSize')
                this.overFileSizeInQueue = true;

            this.changeDetectorRef.detectChanges();
        }


        this.accountService.account.subscribe((item: IAccount) => {
            this.isDevMode = item.isDevMode;
        });
      this.layerGroupOptions$ = this.layerGroupService.groups.pipe(map(e => e.filter(e=>!e.isLocked).map((group, index) => ({ value: group.id, label: group.name }))))
    }

    ngAfterContentInit() {
        this.dialog.onHide(false);

        this.setPage1Form();
        this.setPage2Form();

        this.form = this.formBuilder.group({
            page1: this.formPage1,
            page2: this.formPage2
        });
        combineLatest(
            this.formPage1.statusChanges,
            this.formPage2.statusChanges
        ).pipe(debounceTime(50)).subscribe((value) => {
            this.form.updateValueAndValidity();
        })
    }

    ngAfterViewInit() {
        this.changeDetectorRef.detectChanges();
    }

    setPage1Form() {
        const fileValidatorFn = () => {

            let isValid = true;

            let maxFiles = 0;
            let missingValue: string[] = [];
            let tooManyValue = 0;

            if (this.formPage1.controls['method'].value !== LayerCreationMethod.EMPTY) {

                maxFiles = this.formPage1.controls['method'].value === LayerCreationMethod.FILES ? 4 : 1;
                const allowedFiles = this.formPage1.controls['method']
                    .value === LayerCreationMethod.FILES ? ['dbf', 'prj', 'shp', 'shx'] : ['csv'];
                const extensions = this.uploader.queue.map((x: any) => x.file.name.split('.').pop().toLowerCase());

                if (this.uploader.queue.length > maxFiles) {
                    tooManyValue = this.uploader.queue.length;
                }

                missingValue = allowedFiles.filter(ext => !extensions.includes(ext));
                isValid = tooManyValue === 0 && missingValue.length === 0 && this.lastFileName !== null;
            }

            return isValid ? null : {
                missing: missingValue.length === 0 ? null : {
                    value: missingValue
                },
                toomany: tooManyValue === 0 ? null : {
                    value: tooManyValue,
                    required: maxFiles
                }
            };
        };

        const groupId = this.layerGroupService.groupStore.findIndex(group => !group.isLocked);
        if (!this.formPage1) {
            this.formPage1 = this.formBuilder.group({
                id: [/*-1*/ '{00000000-0000-0000-0000-000000000000}', [Validators.required]],
                layerId: [''],
                name: ['', [Validators.required, Validators.maxLength(40)]],
                description: [''],
                groupId: [groupId, [Validators.required]],
                method: [LayerCreationMethod.EMPTY, [Validators.required]],
                type: [LayerType.POINT, [Validators.required]],
                hasHeader: ['true'],
                file: ['']
            });
        } else {
            this.formPage1.reset()
        }

        this.formPage1.controls['file'].setValidators([fileValidatorFn]);

        this.formPage1.controls['type'].valueChanges.subscribe((value: string) => {
            if ([LayerType.POLYGON, LayerType.POLYLINE].includes(parseInt(value, 10))) {
                if ([LayerCreationMethod.COORDINATES].includes(parseInt(this.formPage1.controls['method'].value, 10))) {
                    this.formPage1.controls['method'].setValue(LayerCreationMethod.EMPTY);
                }
            }
        });

        this.formPage1.controls['method'].valueChanges.subscribe(value => {
          this.creationMethod = value;
          if (value == LayerCreationMethod.COORDINATES) {
            this.typeOptions[1].disabled = true;
            this.typeOptions[2].disabled = true;
          }else{
            this.typeOptions[1].disabled = false;
            this.typeOptions[2].disabled = false;
          }
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        });
    }

    setPage2Form() {
        if (!this.formPage2) {
            this.formPage2 = this.formBuilder.group({
                columnIdentifier: [null],
                columnLabel: [''],
                joinColumn: [''],
                joinColumnList: this.formBuilder.array([]),
                joinLayer: [''],
                geographyType: ['postcode_centroid'],
                columnGroups: this.formBuilder.array([])
            });
            this.formPage2.controls['columnIdentifier'].valueChanges.subscribe(value => {
                (<FormArray>this.formPage2.controls['columnGroups']).controls.forEach((group: FormGroup) => {
                    (<FormArray>group.controls['columns']).controls.forEach((column: FormGroup) => {
                        if (column.controls['id'].value === value) {
                            column.controls['required'].setValue(true);
                        }
                    });
                });
                this.changeDetectorRef.detectChanges();
            });
            this.formPage2.controls.joinLayer.valueChanges.subscribe(layerId => {
                if (!layerId) return
                this.clearColumnFromLayer();
                this.addColumnsFromLayer(this.layers.find(layer => layer.id === layerId));
            });
            const allColumnCheckFn: ValidatorFn = (c: FormGroup) => {

                const values: any = c.getRawValue();
                const errorObject = {};
                let postcodeCount = 0;
                let latCount = 0;
                let lngCount = 0;
                if (Array.isArray(values.columnGroups)) {
                    values.columnGroups.forEach((group: any) => {
                        if (Array.isArray(group.columns)) {
                            group.columns.forEach((column: any) => {
                                if ([
                                    ILayerColumnTypeLong.POSTCODE,
                                    ILayerColumnTypeLong.POST_SECTOR,
                                    ILayerColumnTypeLong.CENSUS_OUTPUT_AREA,
                                    ILayerColumnTypeLong.ROUTE_TOWN,
                                    ILayerColumnTypeLong.POST_DISTRICT,
                                    ILayerColumnTypeLong.POST_AREA
                                ].includes(parseInt(column.type, 10))) {
                                    postcodeCount++;
                                }
                                if (parseInt(column.type, 10) === ILayerColumnTypeLong.LATITUDE) {
                                    latCount++;
                                }
                                if (parseInt(column.type, 10) === ILayerColumnTypeLong.LONGITUDE) {
                                    lngCount++;
                                }
                            });
                        }
                    });
                }

                switch (parseInt(this.formPage1.controls['method'].value, 10)) {
                    case LayerCreationMethod.POSTCODE:

                        if (postcodeCount !== 1) {
                            errorObject['postcodeCount'] = {
                                value: postcodeCount
                            };
                        }
                        break;

                    case LayerCreationMethod.COORDINATES:
                        if (latCount !== 1) {
                            errorObject['latCount'] = {
                                value: latCount
                            };
                        }

                        if (lngCount !== 1) {
                            errorObject['lngCount'] = {
                                value: lngCount
                            };
                        }

                        break;
                }

                return Object.keys(errorObject).length > 0 ? errorObject : null;
            };

            this.formPage2.setValidators([allColumnCheckFn]);
        } else {
            this.formPage2.reset()
        }
        this.formPage2.markAsTouched();
    }

    setFileMethod(type: LayerCreationMethod) {
        if (type === this.formPage1.controls['method'].value) return;
        this.overFileSizeInQueue = false;
        if (this.browseFileBtn)
            this.browseFileBtn.nativeElement.value = "";
        this.isCSVLayer = type === LayerCreationMethod.EMPTY || type === LayerCreationMethod.FILES;
        if (type === LayerCreationMethod.FILES) {
            this.formPage1.get('type').clearValidators();
            this.formPage1.updateValueAndValidity();
        } else {
            if (type === LayerCreationMethod.COORDINATES) {
                this.formPage1.get('type').setValue(LayerType.POINT);
            }
            if (!this.formPage1.get('type').validator) {
                this.formPage1.get('type').setValidators([Validators.required]);
                this.formPage1.updateValueAndValidity();
            }
        }
        if (type === LayerCreationMethod.COORDINATES) {
            this.formPage1.controls['type'].setValue(LayerType.POINT);
        }
        this.formPage1.controls['method'].setValue(type);
        this.formPage1.controls['file'].updateValueAndValidity();
        this.changeDetectorRef.detectChanges();
    }

    getNewFieldId(): string {
        return `${this.guid++}`;
    }

    onDeleteFile(file: FileItem) {
        // TODO implement delete file endpoint
        file.remove();
        this.formPage1.controls['file'].updateValueAndValidity();
    }

    onClose(state: boolean) {
        this.isLoading.next(false);
        this.close.emit(state);
    }

    onAddGroup() {
        this.addGroup();
        this.onAddColumn((<FormArray>this.formPage2.controls['columnGroups']).controls.length - 1);
    }

    addGroup(name: string = ''): number {
        const group = this.formBuilder.group({
            name: [name, [Validators.required]],
            columns: this.formBuilder.array([])
        });
        (<any>this.formPage2.controls['columnGroups']).push(group);
        return (<FormArray>this.formPage2.controls['columnGroups']).controls.length - 1;
    }

    deleteGroup(groupIndex: number) {
        (<any>this.formPage2.controls['columnGroups']).removeAt(groupIndex);
    }

    onAddColumn(groupIndex: number) {
        this.addColumn(groupIndex, this.getNewFieldId(), '', false, false, ILayerColumnTypeLong.STRING);
    }

    addColumn(groupIndex: number, id: string, name: string, required: boolean, isPicklist: boolean,
        type: ILayerColumnTypeLong, sourceName?: string, sourceIndex?: number, sourceLayer?: string) {
        const typeCheckValidator: ValidatorFn = (c: FormGroup) => {
            return parseInt(c.value, 10) !== ILayerColumnTypeLong.CENSUS_OUTPUT_AREA ? null : {
                'typeNotSupported': 'type not supported'
            };
        };

        const col = this.formBuilder.group({
            id: [id],
            name: [name, Validators.required],
            type: [type, [Validators.required, typeCheckValidator]],
            sourceName: [sourceName],
            sourceIndex: [sourceIndex],
            sourceLayer: [sourceLayer],
            required: [required],
            isPicklist: [isPicklist]
        });

        /*		col.controls.type.valueChanges.subscribe(value => {
                    console.log(value);
                });*/

        (<any>this.formPage2.controls['columnGroups']).controls[groupIndex].controls['columns'].push(col);
    }

    deleteColumn(groupIndex: number, columnIndex: number) {
        (<any>this.formPage2.controls['columnGroups']).controls[groupIndex].controls['columns'].removeAt(columnIndex);
    }

    onBack(pageNumber: number) {
        this.error = null;
        this.page = pageNumber;
        this.setPage2Form();
        if (this.page == 2) {
            this.onCompleteStep1();
        }
    }

    onCompleteStep1() {
        switch ((<any>this.formPage1.getRawValue()).method) {
            case LayerCreationMethod.EMPTY:
                this.createLayerEmptyStep1();
                break;
            case LayerCreationMethod.FILES:
                this.createLayerFilesStep1();
                break;
            case LayerCreationMethod.POSTCODE:
            case LayerCreationMethod.COORDINATES:
                this.createLayerCSVStep1();
                break;
        }
    }

    onCompleteStep2() {
        switch ((<any>this.formPage1.getRawValue()).method) {
            case LayerCreationMethod.EMPTY:
                this.createLayerEmptyStep2();
                break;
            case LayerCreationMethod.FILES:
                this.createLayerFilesStep2();
                break;
            case LayerCreationMethod.POSTCODE:
                this.createLayerCSVStep2();
                break;
            case LayerCreationMethod.COORDINATES:
                this.createLayerLatLngCSVStep2();
                break;
        }
    }

    createLayerEmptyStep1() {
        if ((<FormArray>this.formPage2.controls['columnGroups']).length === 0) {
            this.addGroup('Group 1');

            /*
                        const field_name_id = this.getNewFieldId();
                        this.addColumn(0, field_name_id, 'ID', true, false, ILayerColumnTypeLong.NUMBER);
                        this.formPage2.controls['columnIdentifier'].setValue(field_name_id);
            */

            const field_name_label = this.getNewFieldId();
            this.addColumn(0, field_name_label, 'Label', false, false, ILayerColumnTypeLong.STRING);
            this.formPage2.controls['columnLabel'].setValue(field_name_label);
        }

        this.page = 2;
        this.changeDetectorRef.detectChanges();
    }

    createLayerEmptyStep2() {
        this.isLoading.next(true);
        this.error = null;
        this.layerService.creteLayerEmpty(<ILayerCreate>this.form.getRawValue())
            .subscribe(
                response => {
                    this.isLoading.next(false);
                    this.onClose(true);
                    this.changeDetectorRef.detectChanges();
                },
                error => {
                    this.error = decorateError(error);
                    this.isLoading.next(false);
                    this.changeDetectorRef.detectChanges();
                });
    }

    createLayerFilesStep1() {
        this.isLoading.next(true);
        this.error = null;
        this.layerService.createLayerFile1(<ILayerCreate>this.form.getRawValue())
            .subscribe(
                response => {
                    this.isLoading.next(false);
                    this.formPage1.controls['id'].setValue(response.dataPackageId);
                    this.formPage1.controls['layerId'].setValue(parseInt(response.layer.id, 10));
                    this.formPage1.controls['type'].setValue(parseInt(response.type));
                    this.formPage2.controls['columnIdentifier'].setValue('');
                    this.formPage2.controls['columnLabel'].setValue('');
                    this.formPage2.controls['geographyType'].setValue('postcode_centroid');
                    (<FormArray>this.formPage2.controls['columnGroups']).clear();
                    (<FormArray>this.formPage2.controls['joinColumnList']).clear();
                    this.addGroup('Group 1');
                    this.guid = 0;
                    response.fieldNames.forEach((column: any) => {
                        this.addColumn(0, column.id, column.name, column.isNullable, false,
                            convertToLongType(convertToILayerColumnType(column.type.type)), column.sourceName, column.sourceIndex);
                    });
                    this.guid += response.fieldNames.length;

                    this.page = 2;
                    this.formPage2.updateValueAndValidity();
                    this.changeDetectorRef.detectChanges();
                },
                error => {
                    this.error = decorateError(error);
                    this.isLoading.next(false);
                    this.changeDetectorRef.detectChanges();
                });
    }

    createLayerPostcodeStep2() {
        this.isLoading.next(true);
        this.layerService.getGeographyTypeLayers().subscribe(layers => {

            (<FormArray>this.formPage2.controls['columnGroups']).controls.forEach((group: FormGroup) => {
                (<FormArray>group.controls['columns']).controls.forEach((x: FormGroup) => {
                    if ([
                        ILayerColumnTypeLong.POSTCODE,
                        ILayerColumnTypeLong.POST_SECTOR,
                        ILayerColumnTypeLong.CENSUS_OUTPUT_AREA,
                        ILayerColumnTypeLong.ROUTE_TOWN,
                        ILayerColumnTypeLong.POST_DISTRICT,
                        ILayerColumnTypeLong.POST_AREA
                    ].includes(parseInt(x.controls['type'].value, 10))) {

                        (<FormArray>this.formPage2.controls.joinColumnList).push(x);
                    }
                });
            });
            this.formPage2.controls.joinColumn.setValue(0);

            const columnType = parseInt((<FormGroup>(<FormArray>this.formPage2.controls.joinColumnList).at(0)).controls.type.value, 10);
            this.layers = layers.filter(layer => {
                const layerType = <LayerType>parseInt(this.formPage1.controls.type.value, 10);
                if (layer.type === layerType) {
                    switch (columnType) {
                        case ILayerColumnTypeLong.POSTCODE:
                            return layer.joinType === LayerJoinType.POSTCODE;
                        case ILayerColumnTypeLong.POST_SECTOR:
                            return layer.joinType === LayerJoinType.POST_SECTOR;
                        case ILayerColumnTypeLong.CENSUS_OUTPUT_AREA:
                            return layer.joinType === LayerJoinType.CENSUS_OUTPUT_AREA;
                        case ILayerColumnTypeLong.ROUTE_TOWN:
                            return layer.joinType === LayerJoinType.ROUTE_TOWN;
                        case ILayerColumnTypeLong.POST_DISTRICT:
                            return layer.joinType === LayerJoinType.POST_DISTRICT;
                        case ILayerColumnTypeLong.POST_AREA:
                            return layer.joinType === LayerJoinType.POST_AREA;
                    }
                }
                return false;
            });

            if (this.layers.length === 0) {
                this.error = createSimpleError('You cannot proceed without a Geography layer to Join onto');
                return;
            }

            this.formPage2.controls.joinLayer.setValue(this.layers[0].id);
            this.page = 3;
            this.isLoading.next(false);
            this.changeDetectorRef.detectChanges();
        });
    }

    private addColumnsFromLayer(layer: ILayer) {

        (<FormArray>this.formPage2.controls['columnGroups']).controls.forEach((group: FormGroup, groupIndex) => {
            (<FormArray>group.controls['columns']).controls.forEach((column: FormGroup, columnIndex) => {
                if (column.controls['sourceLayer'].value !== null) {
                    this.deleteColumn(groupIndex, columnIndex);
                    if ((<FormArray>group.controls['columns']).controls.length === 0) {
                        this.deleteGroup(groupIndex);
                    }
                }
            });
        });

        const groups: { [groupIndex: number]: number } = {};
        layer.columns.forEach((column, j) => {
            if (column.isJoinable) {
                if (groups[column.groupId] === undefined) {
                    groups[column.groupId] = this.addGroup(layer.columnGroups[column.groupId].Name);
                }
                this.addColumn(groups[column.groupId], column.id, column.name, true,
                    false, convertToLongType(column.type), column.id, j, layer.id);
            }
        });
    }

    private clearColumnFromLayer() {
        (<FormArray>this.formPage2.controls['columnGroups']).controls.forEach((group: FormGroup, i) => {
            (<FormArray>group.controls['columns']).controls.forEach((x: FormGroup, j) => {
                if (x.controls.sourceLayer.value !== null) {
                    (<FormArray>group.controls['columns']).removeAt(j);
                }
            });

            if ((<FormArray>group.controls['columns']).controls.length === 0) {
                (<FormArray>this.formPage2.controls['columnGroups']).removeAt(i);
            }
        });
    }

    createLayerFilesStep2() {
        this.isLoading.next(true);
        this.error = null;
        this.layerService.createLayerFile2(<ILayerCreate>this.form.getRawValue())
            .subscribe(
                reponse => {
                    this.isLoading.next(false);
                    this.onClose(true);
                    this.changeDetectorRef.detectChanges();
                },
                error => {
                    this.error = decorateError(error);
                    this.isLoading.next(false);
                    this.changeDetectorRef.detectChanges();
                });
    }

    createLayerCSVStep1() {
        this.isLoading.next(true);
        this.layerService.createCSV1(<ILayerCreate>this.form.getRawValue())
            .subscribe(
                response => {
                    this.layerService.getGeographyTypeLayers().subscribe(layers => {

                        const types = [];
                        this.layerTypes = layers
                            .filter(layer => {
                                let includes = true;
                                const layerType = <LayerType>parseInt(this.formPage1.controls.type.value, 10);
                                if (layer.joinType && layer.type === layerType) {
                                    includes = types.includes(layer.joinType);
                                    if (!includes) {
                                        types.push(layer.joinType);
                                    }
                                }
                                return !includes;
                            })
                            .map(layer => {
                                switch (layer.joinType) {
                                    case LayerJoinType.POSTCODE:
                                        return { value: ILayerColumnTypeLong.POSTCODE, name: 'Postcode' };
                                    case LayerJoinType.POST_SECTOR:
                                        return { value: ILayerColumnTypeLong.POST_SECTOR, name: 'Post Sector' };
                                    case LayerJoinType.CENSUS_OUTPUT_AREA:
                                        return { value: ILayerColumnTypeLong.CENSUS_OUTPUT_AREA, name: 'Census Output Area' };
                                    case LayerJoinType.ROUTE_TOWN:
                                        return { value: ILayerColumnTypeLong.ROUTE_TOWN, name: 'Route Town' };
                                    case LayerJoinType.POST_DISTRICT:
                                        return { value: ILayerColumnTypeLong.POST_DISTRICT, name: 'Post District' };
                                    case LayerJoinType.POST_AREA:
                                        return { value: ILayerColumnTypeLong.POST_AREA, name: 'Post Area' };
                                    default:
                                        return {};
                                }
                            });
                        this.isLoading.next(false);
                        this.formPage1.controls['id'].setValue(response.tenantId);

                        this.formPage2.controls['columnIdentifier'].setValue('');
                        this.formPage2.controls['columnLabel'].setValue('');
                        this.formPage2.controls['geographyType'].setValue('postcode_centroid');
                        (<FormArray>this.formPage2.controls['columnGroups']).clear();
                        (<FormArray>this.formPage2.controls['joinColumnList']).clear();
                        this.addGroup('Group 1');
                        this.guid = 0;
                        response.fields.forEach((column: any) => {
                            const id = column.id === undefined ? this.getNewFieldId() : column.id;
                            this.addColumn(0, id, column.name, column.isNullable, false,
                                convertToLongType(convertToILayerColumnType(column.type)), column.sourceName, column.sourceIndex);
                        });
                        this.guid += response.fields.length;
                        this.page = 2;
                        this.formPage2.updateValueAndValidity()
                        this.changeDetectorRef.detectChanges();
                    });
                },
                error => {
                    this.error = decorateError(error);
                    this.isLoading.next(false);
                    this.changeDetectorRef.detectChanges();
                });

    }

    createLayerCSVStep2() {
        this.isLoading.next(true);
        this.layerService.createCSV2(<ILayerCreate>this.form.getRawValue()).pipe(
          timeout(210000) //3.5 minute
        ).subscribe(
                (response: any) => {
                    this.isLoading.next(false);
                    this.onClose(true);
                    if (response.RejectedLines && response.RejectedLines.length > 0) {
                        this.actionMessageService.sendWarning(
                            `CSV imported.  ${response.RejectedLines.length} lines were rejected. ` +
                            `Please check the postcode or lat/long values are all valid.`);
                    }
                    this.changeDetectorRef.detectChanges();
                },
                error => {
                  if(error instanceof TimeoutError){
                    this.actionMessageService.sendInfo('Timeout exceeded. Your data took longer to process than expected, so will now run as a background task. Please check again later.');
                    this.onClose(true);
                    return
                  }
                  const err = decorateError(error);
                  this.error = err;
                  this.isLoading.next(false);
                  this.changeDetectorRef.detectChanges();
                });
    }

    createLayerLatLngCSVStep2() {
        this.isLoading.next(true);
        this.layerService.createCSVLatLng2(<ILayerCreate>this.form.getRawValue())
            .subscribe(
                (response: any) => {
                    this.isLoading.next(false);
                    this.onClose(true);
                    if (response.RejectedLines && response.RejectedLines.length > 0) {
                        this.actionMessageService.sendWarning(
                            `CSV imported.  ${response.RejectedLines.length} lines were rejected. ` +
                            `Please check the postcode or lat/long values are all valid.`);
                    }
                    this.changeDetectorRef.detectChanges();
                },
                error => {
                    this.error = decorateError(error);
                    this.isLoading.next(false);
                    this.changeDetectorRef.detectChanges();
                });
    }
}


