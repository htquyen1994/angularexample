import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef, Renderer2, Inject, NgZone } from '@angular/core';
import { ILayerColumnTypeLong, ILayerColumnType } from '../../shared/enums';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ColumnManageService } from '../shared/services/column-manage.service';
import { DialogComponent } from '@client/app/shared/components';
import { DeleteConfirmComponent } from '@client/app/shared/containers';
import { ILayer, ILayerColumnGroup, convertFromILayerColumnTypeLong, convertToLongType } from '../../shared/interfaces';
import { CustomColumn, ColumnAction } from '@client/app/shared/interfaces';
import { decorateError, createSimpleError, IErrorResponse } from '../../shared/http.util';
import * as _ from 'lodash';
import { ModalService } from '../../shared/services/modal.service';
import { first } from 'rxjs/operators';
import { ResultStatus } from '../../shared/models/modal.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IFieldGroup } from '../../shared/Data/Packaging';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

interface IColumn { id: any, name: string, type: ILayerColumnType, index: number, isNotAllowDelete: boolean };
interface IGroup { id: any, name: string, columns: IColumn[], isCollapse: boolean };
@Component({
  selector: 'go-add-column',
  templateUrl: './add-column.component.html',
  styleUrls: ['./add-column.component.less']
})
export class AddColumnComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;
  @ViewChild('listEl', { static: true }) listEl: ElementRef;
  // @ViewChild('dragLabel', { static: true }) dragLabel: ElementRef;
  // @ViewChild('dragPointer', { static: true }) dragPointer: ElementRef;
  dragEl: HTMLElement = null;
  columnDraging = null;
  dragSpaceEl: any;
  layerColumnTypeLong = ILayerColumnTypeLong;
  form: FormGroup;
  loading: boolean = false;
  get formValue() {
    return this.form.getRawValue() as { groups: IGroup[] };
  }
  isNotAllowDeleteGroup(group: FormGroup) {
    let groupValue = group.value as IGroup;
    return groupValue.columns.length > 0;
  }
  totalColumn(group: FormGroup) {
    let groupValue = group.value as IGroup;
    return groupValue.columns.filter(e => !e.isNotAllowDelete).length;
  }
  activeLayer: ILayer;
  error: IErrorResponse;
  deleteColumns: { columnId: any, columnName: string }[] = [];
  deleteGroups: { groupId: any, groupName: string }[] = [];
  columnIndex = 0;
  manageGroups: boolean = false;
  columnTypeOptions: PsSelectOption[] = [
    {
      value: ILayerColumnTypeLong.FLOAT,
      label: 'Number (Decimal)'
    }, {
      value: ILayerColumnTypeLong.NUMBER,
      label: 'Number (Integer)'
    }, {
      value: ILayerColumnTypeLong.DATE,
      label: 'Date'
    }, {
      value: ILayerColumnTypeLong.STRING,
      label: 'Text (short)'
    }, {
      value: ILayerColumnTypeLong.TEXT,
      label: 'Text (Long)'
    }, {
      value: ILayerColumnTypeLong.BOOLEAN,
      label: 'True / False'
    }, {
      value: ILayerColumnTypeLong.COLOUR,
      label: 'Colour'
    }, {
      value: ILayerColumnTypeLong.MONEY_GBP,
      label: 'Money (£)'
    }, {
      value: ILayerColumnTypeLong.MONEY_EUR,
      label: 'Money (€)'
    }, {
      value: ILayerColumnTypeLong.MONEY_USD,
      label: 'Money ($)'
    }]
  private requestSubscription: Subscription;
  private groupList: any[];
  private fromGroupIndex = 0;
  private fromColumnIndex = 0;
  private toGroupIndex = 0;
  private toColumnIndex = 0;
  private dragElementPosition = 0;
  private dragEloffsetTop = 0;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private columnManageService: ColumnManageService,
    private renderer: Renderer2,
    private modalService: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddColumnComponent>,
    private ngZone: NgZone,
    public el: ElementRef
  ) { }

  ngOnInit() {
    let layer: ILayer = this.data['layer'];
    if (layer) {
      try {
        this.newForm(layer);
      } catch (error) {
        this.onDialogClose(decorateError(error));
      }
    } else {
      this.onDialogClose(createSimpleError('Please select layer'));
    }
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
  }

  onDialogClose(result?: any) {
    this.ngZone.run(() => {
      this.dialogRef.close(result);
    })
  }

  newForm(layer: ILayer) {
    let groups = this.fb.array([]);
    layer.columnGroups.forEach(item => {
      groups.push(this.fb.group({
        id: item.Index,
        name: this.fb.control(item.Name, Validators.required),
        columns: this.fb.array([]),
        isCollapse: true
      }));
    });
    layer.columns.map((e, i) => { return { ...e, index: e.index ? e.index : i } })
      .forEach(column => {
        let _groupIndex = groups.getRawValue().findIndex(e => e.id == column.groupId);
        if (_groupIndex != -1) {
          let isNotAllowDelete = false;
          if ((column.notFilterable || column.notSelectable || column.type === ILayerColumnType.SHAPE)) {
            isNotAllowDelete = true;
          }
          (<FormArray>(<FormGroup>groups.at(_groupIndex)).controls['columns']).push(this.fb.group({
            id: column.id,
            name: this.fb.control(column.name, Validators.required),
            type: this.fb.control({ value: convertToLongType(column.type, column), disabled: column.id != undefined && column.id != null ? true : false }, Validators.required),
            index: column.index,
            isNotAllowDelete: isNotAllowDelete
          }));
        } else {
          throw createSimpleError(`Cannot display dialog for ${layer.name} because one of more columns are assigned to a group that doesn't exist.`)
        }
      })
    let isExpand = true;
    let _groups = [];
    for (let index = 0; index < groups.length; index++) {
      const element = groups.at(index) as FormGroup;
      const totalVisibleColumns = this.totalColumn(element);
      const totalColumns = element.value.columns.length;
      if (totalColumns > 0) {
        if (totalVisibleColumns > 0 && isExpand) {
          isExpand = false;
          element.patchValue({
            isCollapse: false
          })
        }
      }
      _groups = [..._groups, element];
    }
    this.form = this.fb.group({
      groups: this.fb.array(_groups)
    })
    this.activeLayer = _.cloneDeep(layer);
    this.columnIndex = this.activeLayer.columns.length;
  }

  onAddGroup() {
    (<FormArray>this.form.controls['groups']).push(
      this.fb.group({
        name: this.fb.control('', Validators.required),
        columns: this.fb.array([
        ]),
        isCollapse: false
      })
    )
    this.columnIndex++;
  }

  onDeleteGroup(index: number) {
    let group = (<FormArray>this.form.controls['groups']).at(index);
    if (group) {
      if (group && group.value.id) {
        this.openDeleteConfirmDialog(group.value.name, () => {
          this.addDeleteColumns(index);
          (<FormArray>this.form.controls['groups']).removeAt(index);
        })
      } else {
        this.addDeleteColumns(index);
        (<FormArray>this.form.controls['groups']).removeAt(index);
      }
    }
  }

  onAddColumn(index: number) {
    let group = <FormGroup>(<FormArray>this.form.controls['groups']).at(index);
    (<FormArray>(group).controls['columns']).push(
      this.fb.group({
        name: this.fb.control('', Validators.required),
        type: this.fb.control(ILayerColumnTypeLong.FLOAT, Validators.required),
        index: this.columnIndex
      })
    )
    this.columnIndex++;
    if (group.value.isCollapse == true) {
      this.onToggle(index);
    }
  }

  onDeleteColumn(i, j) {
    let column = (<FormArray>(<FormGroup>(<FormArray>this.form.controls['groups']).at(i)).controls['columns']).at(j);
    if (column && column.value.id) {
      this.openDeleteConfirmDialog(column.value.name, () => {
        this.addDeleteColumns(i, j);
        (<FormArray>(<FormGroup>(<FormArray>this.form.controls['groups']).at(i)).controls['columns']).removeAt(j);
      })
    } else {
      this.addDeleteColumns(i, j);
      (<FormArray>(<FormGroup>(<FormArray>this.form.controls['groups']).at(i)).controls['columns']).removeAt(j);
    }
  }

  addDeleteColumns(index: number, columnIndex: number = null) {
    let group = ((<FormArray>this.form.controls['groups']).at(index));
    if (group) {
      let groupValue = group.value;
      if (groupValue.id != undefined) {
        let columnsValue = (<FormArray>(<FormGroup>group).controls['columns']).value as Array<IColumn>;
        if (columnIndex != null) {
          let column = columnsValue[columnIndex];
          if (column) {
            this.addDeleteColumn(groupValue.id, column.id, column.name);
          }
        } else { //delete Group
          if (columnsValue.length > 0) {
            throw createSimpleError(`Can not delete ${groupValue.name} group`);
          } else {
            this.addDeleteGoup(groupValue.id, groupValue.name);
          }
        }
      }
    }
  }

  addDeleteColumn(groupId: number, columnId: number, columnName: string) {
    if (groupId != undefined) {
      if (columnId != undefined) {
        this.deleteColumns.push({ columnId: columnId, columnName: columnName });
      }
    }
  }

  addDeleteGoup(groupId: number, groupName: string) {
    if (groupId != undefined) {
      this.deleteGroups.push({ groupId: groupId, groupName: groupName });
    }
  }

  onSubmit() {
    try {
      let layerData: ILayer = this.data['layer'];
      if (this.form.invalid || !layerData || !this.formValue) {
        return;
      }
      let customColumns: CustomColumn[] = [];
      // Add/Edit
      let isGroupEdit = false;
      let fieldGroups = [...this.activeLayer.columnGroups];
      this.formValue.groups.forEach(group => {
        let groupName = group.name;
        let groupId = group.id != undefined ? group.id : this.generateGroupId(this.activeLayer.columnGroups) //Index
        let _index = fieldGroups.findIndex(e => e.Index == groupId);
        if (group.columns.length > 0) {
          if (_index != -1) {
            if (fieldGroups[_index].Name != groupName || fieldGroups[_index].Description != groupName) {
              isGroupEdit = true;
            }
            fieldGroups[_index].Name = groupName;
            fieldGroups[_index].Description = groupName;
          } else {
            isGroupEdit = true;
            fieldGroups.push({
              Index: groupId,
              Name: group.name,
              Description: group.name,
              HasTotal: null
            })
          }
        } else {
          if (_index != -1) {
            isGroupEdit = true;
            fieldGroups.splice(_index, 1);
          }
        }
        group.columns.forEach((column, index) => {
          if (!column.id) { // add
            customColumns.push({
              columnGroupId: groupId,
              columnAction: ColumnAction.ADD,
              columnDataType: convertFromILayerColumnTypeLong({ type: column.type }),
              columnId: undefined,
              columnName: column.name,
              columnIndex: column.index
            })
          } else { // Edit
            let oldColumn = this.activeLayer.columns.find(e => e.id == column.id)
            if (oldColumn) {
              let oldGroup = this.activeLayer.columnGroups.find(e => e.Index == oldColumn.groupId);
              if (oldColumn.name != column.name || oldColumn.type != column.type
                || oldColumn.groupId != groupId || (oldGroup && oldGroup.Name != groupName)
                || oldColumn.index != column.index || oldColumn.isIndexUndefined) {
                customColumns.push({
                  columnGroupId: groupId,
                  columnAction: ColumnAction.Modify,
                  columnDataType: convertFromILayerColumnTypeLong({ ...oldColumn }),
                  columnId: column.id,
                  columnName: column.name,
                  columnIndex: column.index
                })
              }
            } else {
              throw createSimpleError(`Column ${column.name} can't find in Layer`)
            }
          }
        });
      });
      // Delete
      if (this.deleteColumns.length > 0 || this.deleteGroups.length > 0) {
        this.deleteColumns.forEach(e => {
          customColumns.push({
            columnAction: ColumnAction.Delete,
            columnGroupId: null,
            columnId: e.columnId,
            columnDataType: null,
            columnName: null,
            columnIndex: null
          })
        })
        this.deleteGroups.forEach(e => {
          let fieldIndex = fieldGroups.findIndex(g => g.Index == e.groupId);
          if (fieldIndex != -1) {
            isGroupEdit = true;
            fieldGroups.splice(fieldIndex, 1);
          }
        })
      }
      this.editColumns(customColumns, fieldGroups, isGroupEdit);
    } catch (error) {
      console.error(error);
      this.error = decorateError(error);
    }
  }

  onCancel() {
    this.onDialogClose();
  }

  editColumns(customColumns: CustomColumn[], fieldGroups: IFieldGroup[], isGroupEdit: boolean = false) {
    this.setLoading(true);
    this.cancelRequest();
    if ((customColumns && customColumns.length > 0) || isGroupEdit) {
      this.requestSubscription = this.columnManageService.columnRequest(this.activeLayer, { fieldGroups: fieldGroups, customColumnList: customColumns, layerName: this.activeLayer.name }).subscribe(res => {
        this.setLoading(false);
        this.onDialogClose({ success: true })
      }, err => {
        this.error = decorateError(err);
        this.setLoading(false);
      })
    } else {
      this.setLoading(false);
    }
  }

  cancelRequest() {
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
      this.requestSubscription = null;
    }
  }

  generateGroupId(groups: ILayerColumnGroup[], id: any = 0) {
    const maxIndex = Math.max(...groups.map(e => e.Index));
    return maxIndex + 1;
  }

  setLoading(value) {
    this.loading = value;
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.cancelRequest();
  }

  openDeleteConfirmDialog(name: string, deleteFunction: Function) {
    const ref = this.modalService.openModal(DeleteConfirmComponent, {
      deleteModel: {
        title: 'Delete Columns',
        innerHtml: `Are you sure you want to delete <strong>${name}</strong>?`
      }
    })
    ref.afterClosed().pipe(first()).subscribe(res => {
      if (res && res.status == ResultStatus.OK) {
        deleteFunction();
      }
    })
  }

  onDragStart($event: MouseEvent, group: any, groupIndex: number, column: any, columnIndex: number) {
    // if (group.isLocked) {
    //   return this.actionMessageService.sendInfo('Can not change layer position as layer group is locked');
    // }
    if (this.dragEl) {
      return;
    }
    $event.stopPropagation();
    $event.preventDefault();
    this.columnDraging = (<FormGroup>column);
    this.fromGroupIndex = groupIndex;
    this.toGroupIndex = groupIndex;

    this.fromColumnIndex = columnIndex;
    this.dragEl = (<any>$event).currentTarget.parentElement.parentElement;
    this.dragEl.classList.add('is-dragging');
    this.groupList = Array.from(this.listEl.nativeElement.querySelectorAll('.group-wrapper'));
    this.groupList.forEach(_ => {
      _.columns = Array.from(_.querySelectorAll('.column-wrapper:not(.is-dragging)'));
    });
    this.dragEloffsetTop = this.dragEl.offsetTop;
    this.dragEl.style.top = this.dragEloffsetTop + 'px';
    this.dragElementPosition = $event.pageY;
    const groupEl = this.groupList.find(group => group.getAttribute('data-index') == groupIndex);
    if (groupEl) {
      if (this.dragSpaceEl) {
        this.renderer.removeChild(this.dragSpaceEl.parentNode, this.dragSpaceEl);
      }
      this.dragSpaceEl = this.renderer.createElement('div');
      this.renderer.addClass(this.dragSpaceEl, 'dragging-space');
      const columnList = this.findColumnList(groupEl, groupIndex);
      const columnEl = groupEl.columns.find(col => col.getAttribute('data-index') == columnIndex + 1);
      this.toColumnIndex = columnIndex;
      if (columnEl) {
        this.renderer.insertBefore(columnList, this.dragSpaceEl, columnEl);
      } else {
        this.renderer.appendChild(columnList, this.dragSpaceEl);
      }
    }
    this.onDrag($event);
  }

  onDrag($event: MouseEvent) {
    if (this.dragEl) {
      $event.stopPropagation();
      $event.preventDefault();
      const scrollTop = this.listEl.nativeElement.scrollTop;
      // const offsetTop = this.listEl.nativeElement.offsetTop + this.dragEl.offsetTop - scrollTop;
      const translateY = $event.pageY - this.dragElementPosition;
      const dragElOffsetTop = this.dragEloffsetTop - scrollTop;
      this.dragEl.style.transform = `translate(0px, ${translateY}px)`;
      this.groupList.forEach((group) => {
        const groupIndex = group.getAttribute('data-index')
        group.columns.forEach((column: HTMLElement) => {
          const columnIndex = parseInt(column.getAttribute('data-index'));
          const positionTop = column.offsetTop - scrollTop - translateY;
          const positionBottom = column.offsetTop + column.offsetHeight - scrollTop - translateY;
          const distanceTop = Math.abs(dragElOffsetTop - positionTop);
          const distanceBottom = Math.abs(dragElOffsetTop - positionBottom);
          const distance = Math.abs(distanceTop - distanceBottom)
          if (distance <= 22.5) {
            if (this.dragSpaceEl) {
              this.renderer.removeChild(this.dragSpaceEl.parentNode, this.dragSpaceEl);
            }
            this.dragSpaceEl = this.renderer.createElement('div');
            this.renderer.addClass(this.dragSpaceEl, 'dragging-space');
            let top = 0;
            const columnList = this.findColumnList(group, groupIndex);
            if (!columnList) {
              return
            }
            if (distanceTop < distanceBottom) {
              top = 1;
              if (column.nextSibling) {
                this.renderer.insertBefore(columnList, this.dragSpaceEl, column.nextSibling);
              } else {
                this.renderer.appendChild(columnList, this.dragSpaceEl);
              }
            } else {
              this.renderer.insertBefore(columnList, this.dragSpaceEl, column);
            }
            this.toGroupIndex = groupIndex;
            this.toColumnIndex = columnIndex + top;
          }
        });
        if (group.columns.length === 0) {
          const groupOffsetTop = group.offsetTop - scrollTop - translateY;
          const groupOffsetBottom = group.offsetTop - scrollTop + group.offsetHeight - translateY;
          if (groupOffsetTop <= dragElOffsetTop && groupOffsetBottom >= dragElOffsetTop) {
            if (this.dragSpaceEl) {
              this.renderer.removeChild(this.dragSpaceEl.parentNode, this.dragSpaceEl);
            }
            this.dragSpaceEl = this.renderer.createElement('div');
            this.renderer.addClass(this.dragSpaceEl, 'dragging-space');
            const columnList = this.findColumnList(group, groupIndex);
            if (!columnList) return;
            this.renderer.appendChild(columnList, this.dragSpaceEl);
            this.toGroupIndex = groupIndex;
            this.toColumnIndex = 0;
          }
        }
      });
    }
  }

  onDrop($event: MouseEvent) {
    this.dragElementPosition = 0;
    if (this.dragSpaceEl) {
      this.renderer.removeChild(this.dragSpaceEl.parentNode, this.dragSpaceEl);
    }
    if (!this.dragEl) {
      return null;
    }
    this.dragEl.style.transform = '';
    this.dragEl.style.top = '';
    this.dragEl.classList.remove('is-dragging');
    this.dragEl = null;
    this.dragEloffsetTop = 0;
    this.dragSpaceEl = null;

    $event.stopPropagation();
    $event.preventDefault();

    if (this.fromGroupIndex != this.toGroupIndex || this.fromColumnIndex != this.toColumnIndex) {
      this.moveColumn(
        this.fromGroupIndex,
        this.toGroupIndex,
        this.fromColumnIndex,
        this.toColumnIndex);
    }
  }

  findColumnList(group: HTMLElement, groupIndex: number) {
    let columnList = group.querySelector('.column-list');
    if (!columnList) {
      this.onToggle(groupIndex);
      this.groupList = Array.from(this.listEl.nativeElement.querySelectorAll('.group-wrapper'));
      this.groupList.forEach(_ => {
        _.columns = Array.from(_.querySelectorAll('.column-wrapper:not(.is-dragging)'));
      });
      columnList = group.querySelector('.column-list');
    }
    return columnList
  }

  moveColumn(fromGroupIndex, toGroupIndex, fromColumnIndex, toColumnIndex) {
    const groups = <FormArray>this.form.controls['groups'];
    const group = (<FormGroup>groups.at(fromGroupIndex));
    const toGroup = (<FormGroup>groups.at(toGroupIndex));
    const columns = (<FormArray>group.controls['columns']);
    const toColumns = (<FormArray>toGroup.controls['columns']);
    const column = columns.at(fromColumnIndex);
    const toColumn = toColumns.at(toColumnIndex);
    columns.removeAt(fromColumnIndex);
    let _toColumnIndex = toColumns.length;
    if (toColumn) {
      _toColumnIndex = toColumns.controls.findIndex(e => e.value.id == toColumn.value.id);
    }
    toColumns.insert(_toColumnIndex, column);
    let valueColumns = toColumns.value as Array<IColumn>;
    const sortedNumber = valueColumns.map(e => e.index).sort((a: number, b: number): number => {
      return a < b ? -1 : 1;
    })
    for (let index = 0; index < toColumns.length; index++) {
      toColumns.at(index).patchValue({ index: sortedNumber[index] });
    }
  }

  onToggle(groupIndex: number) {
    let group = (<FormGroup>(<FormArray>this.form.controls['groups']).at(groupIndex));
    if (group) {
      group.patchValue({
        isCollapse: !group.get('isCollapse').value
      })
      this.changeDetectorRef.detectChanges();
    }
  }

  onToggleManageGroups() {
    this.manageGroups = !this.manageGroups;
    (this.form.get('groups') as FormArray).controls.length
  }
}
