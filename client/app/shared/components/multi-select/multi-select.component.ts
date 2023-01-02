import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Component, ChangeDetectorRef, Input, AfterViewInit, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormArray, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Observable, forkJoin, Subject } from 'rxjs';
import { LayerDataService } from '../../layer-data.service';
import { LayerService } from '../../layer.service';
import { ILayerColumn } from '../../interfaces';
import * as _ from 'lodash';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
export interface SelectionItems {
    value: string;
    description: string;
    parentValue: string;
    children?: any[];
    isParent?: boolean;
}

export const GO_MULTISELECT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MultiSelectComponent),
    multi: true
};

@Component({
    selector: 'go-multi-select',
    moduleId: module.id,
    templateUrl: 'multi-select.component.html',
    styleUrls: ['multi-select.component.less'],
    providers: [GO_MULTISELECT_VALUE_ACCESSOR]
})
export class MultiSelectComponent implements ControlValueAccessor, AfterViewInit {

    @Input() layerId: string;
    @Input() columnId: string;
    @Input() required = false;

    @Input('parentGroup') set _parent(group: FormGroup) {
        this.parentFilter = [];

        if (group) {
            const filters = <FormArray>group.controls.filters;

            if (filters) {
                filters.valueChanges.subscribe((change: any) => {
                    this.parentFilter = change && change[0] ? change[0].value : [];
                    this.selected = this.selected.filter(x => this.parentFilter.includes(x.parentValue));

                    this.model = this.selected.map(x => x.value);
                    this.onModelChange(this.model);

                    if (this.parentFilter.length === 0) {
                        this.searchGroup = '';
                    } else if (!this.parentFilter.includes(this.searchGroup)) {
                        this.searchGroup = this.parentFilter[0];
                    }
                    this.updateFilter();
                });
            }

            if (filters.controls.length > 0) {
                this.parentFilter = filters.getRawValue()[0].value;
                this.searchGroup = this.parentFilter[0];
            }
        }

        this.updateFilter();
    }

    @ViewChild(VirtualScrollerComponent) virtualScroll: VirtualScrollerComponent;

    searchTerm = '';
    searchGroup = '';

    isLoading = true;
    isDisabled = true;
    selected = [];

    showPanel = false;
    currentList = [];

    fullList = [];

    hasParent = null;
    parentPicklist = [];
    childPicklist = [];

    readonly filter$ = new Subject<string>();
    parentFilter = [];
    parentColumn: ILayerColumn = null;
    childColumn: ILayerColumn = null;
    column: ILayerColumn = null;

    private model: string[] = [];

    private onModelChange: Function = () => {
    }
    private onModelTouched: Function = () => {
    }
    realFullList = [];
    constructor(private layerDataService: LayerDataService,
        private layerService: LayerService,
        private cd: ChangeDetectorRef) {
    }

    ngAfterViewInit() {
        const layer = this.layerService.layerStore.get(this.layerId);
        const picklist = [this.layerDataService.getPicklistEntries(layer, this.columnId)];

        this.column = layer.columns.find(x => x.id === this.columnId);

        if (this.column.isParentPickList) {
            this.childColumn = layer.columns.find(x => x.id === this.column.ChildPickListColumnName);
        }

        this.hasParent = this.column.isChildPickList;
        this.isDisabled = this.hasParent !== false && this.parentFilter.length === 0;

        if (this.column.isChildPickList) {
            this.parentColumn = layer.columns.find(x => x.ChildPickListColumnName === this.columnId);
            picklist.push(this.layerDataService.getPicklistEntries(layer, this.parentColumn.id));
        }
        this.cd.markForCheck();
        this.cd.detectChanges();

        forkJoin(picklist)
            .subscribe(data => {
                this.childPicklist = _.cloneDeep(data[0]);
                this.parentPicklist = _.cloneDeep(data[1]);

                if (this.required !== true) {
                    this.childPicklist.push({
                        value: '[IS NULL]',
                        parentValue: null,
                        description: 'NULL (Missing value)',
                        isParent: false,
                        children: []
                    });
                }

                this.fullList = this.initList(this.childPicklist, this.parentPicklist);
                this.setRealFullList();
                this.selected = this.model
                    .map(item => this.childPicklist.find(x => x.value === item));

                this.isLoading = false;
                this.updateFilter();
            });

        this.filter$.pipe(
            debounceTime(300),
            distinctUntilChanged())
            .subscribe(term => {
                this.searchTerm = term;
                this.updateFilter();
            });
    }

    writeValue(obj: any): void {
        this.model = obj ? obj : [];
    }

    registerOnChange(fn: any): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onModelTouched = fn;
    }

    private initList(childList: SelectionItems[], parentList: SelectionItems[] = []): any[] {
        const parentIndex = {};
        const values = parentList.map((parent, index) => {
            const parenValue = parent.value ? parent.value.toLowerCase() : undefined;
            parent.children = [];
            parent.isParent = true;
            parentIndex[parenValue] = index;
            return parent;
        });
        const defaultIndex = values.length;
        values.push({
            value: '',
            description: 'Default',
            parentValue: null,
            children: [],
            isParent: true
        });

        childList.forEach(child => {
            child.isParent = false;
            const childParenValue = child.parentValue ? child.parentValue.toLowerCase() : undefined;
            if (!values[parentIndex[childParenValue]]) {
                values[defaultIndex].children.push(child);
            } else {
                values[parentIndex[childParenValue]].children.push(child);
            }
        });

        return values;
    }

    updateFilter() {

        const list = [];
        const re = new RegExp(this.searchTerm, 'gi');

        this.isDisabled = this.hasParent !== false && this.parentFilter.length === 0;

        this.fullList
            .filter(x => {
                return (this.searchGroup && this.searchGroup.length > 0 ? x.value === this.searchGroup : true) &&
                    (this.hasParent ? this.parentFilter.includes(x.value) : true);
            })
            .forEach(parent => {

                let children = parent.children;

                if (this.searchTerm !== '') {
                    children = children.filter(item => item.description.search(re) !== -1);
                }

                if (children.length > 0 && this.hasParent) {
                    list.push(parent);
                }

                children.forEach(child => {
                    list.push(child);
                });
            });

        this.currentList = list;
        this.sortCurrentList();
        this.cd.markForCheck();
        this.cd.detectChanges();
        if (this.currentList.length > 0 && (this.childColumn || this.parentColumn)) {
            this.virtualScroll.scrollInto(this.currentList[0]);
        }
    }

    removeSelection(selection) {
        const includeIndex = this.selected.findIndex(child => child === selection);
        this.selected.splice(includeIndex, 1);

        this.model = this.selected.map(x => x.value);
        this.onModelChange(this.model);

        this.cd.markForCheck();
        this.cd.detectChanges();
    }

    addSelection(selection) {
        const includeIndex = this.selected.findIndex(child => child.value === selection.id);
        if (includeIndex === -1 && selection.value) {
            this.selected.push(this.childPicklist.find(child => child.value === selection.id));
        }

        if (includeIndex !== -1 && !selection.value) {
            this.selected.splice(includeIndex, 1);
        }

        this.sortCurrentList();
        this.model = this.selected.map(x => x.value);
        this.onModelChange(this.model);
        this.cd.markForCheck();
        this.cd.detectChanges();
    }

    openPanel() {
        this.showPanel = true;
        this.virtualScroll.scrollInto(this.currentList[0]);
        this.virtualScroll.refresh();
        this.cd.markForCheck();
        this.cd.detectChanges();
    }

    closePanel() {
        this.showPanel = false;
        this.cd.markForCheck();
        this.cd.detectChanges();
    }

    sortCurrentList() {
        if (this.realFullList.length > 500 && this.currentList.length > 0 && !(this.childColumn || this.parentColumn) && this.selected && this.selected.length > 0) {
            this.currentList.sort(this.sortSelected.bind(this));
            if (this.virtualScroll)
                this.virtualScroll.refresh();
        }
    }

    setRealFullList() {
        this.fullList
            .forEach(parent => {
                let children = parent.children;
                if (children.length > 0 && this.hasParent) {
                    this.realFullList.push(parent);
                }
                children.forEach(child => {
                    this.realFullList.push(parent);
                });
            });
    }

    private sortSelected(a, b) {
        if (this.selected.find(e => e.value == a.value)) {
            if (this.selected.find(e => e.value == b.value)) {
                return 0;
            }
            return -1;
        }
        if (this.selected.find(e => e.value == b.value)) {
            return 1;
        }
        return 0;
    }
}
