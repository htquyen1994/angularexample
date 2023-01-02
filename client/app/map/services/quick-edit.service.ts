import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { QuickEdit, QuickEditAction, QuickEditShape, QuickEditDTO } from '../models/map.model';
import * as _ from 'lodash'
import { HttpService } from '../../shared';
@Injectable()
export class QuickEditService {
  private queueActions: QuickEditAction[] = [];
  public queueActions$ = new BehaviorSubject<QuickEditAction[]>([])
  private dataSource = new BehaviorSubject<QuickEdit>(null);
  public data = this.dataSource.asObservable();
  private innitSource = new BehaviorSubject<QuickEdit>(null);
  public innit = this.innitSource.asObservable();
  constructor(private httpService: HttpService) { }

  getCurrentData() {
    return this.dataSource.value;
  }

  getShapesChanged() {
    if(!this.dataSource.value) return [];
    const changed: string[] = _.uniq(this.queueActions.map(e => e.id));
    return Array.from(this.dataSource.value.shapes).filter(e => changed.includes(e.id));
  }

  innitModel(model: QuickEdit) {
    this.innitSource.next(model);
  }

  innitCurrentData(model: QuickEdit) {
    this.dataSource.next(model);
  }

  updateData(_shapes: {
    id: string;
    coordinates: any[];
  }[]) {
    try {
      const currentData = this.getCurrentData();
      if (!currentData) {
        throw 'Something went wrong';
      }
      const { shapes } = currentData;
      const actions: QuickEditAction[] = []
      _shapes.forEach(shape=>{
        const index = shapes.findIndex(e => e.id == shape.id);
        const previous = [...shapes[index].geomColumnValue.coordinates];
        const current = [...shape.coordinates];
        shapes[index].geomColumnValue.coordinates = shape.coordinates;
        actions.push({
          id: shape.id,
          previous,
          current
        })
      })
      this.dataSource.next({ ...currentData, shapes });
      return actions
    } catch (error) {
      throw 'Something went wrong';
    }
  }

  move(id: string, newCoordinates: any[]) {
    try {
      const data = this.updateData([{ id, coordinates: newCoordinates }]);
      if (this.queueActions.length && this.queueActions[this.queueActions.length - 1].id == id) {
        this.queueActions[this.queueActions.length - 1].current = data[0].current;
      } else {
        this.queueActions.push(data[0])
      }
      this.queueActions$.next(this.queueActions);
    } catch (error) {
      throw 'Something went wrong';
    }
  }

  undo() {
    try {
      const previousAction = this.queueActions.pop();
      this.queueActions$.next(this.queueActions);
      const data = this.updateData([{ id: previousAction.id, coordinates: previousAction.previous }]);
      return data;
    } catch (error) {
      throw 'Something went wrong';
    }
  }

  undoAll(){
    try {
      const shapes:{
        id: string;
        coordinates: any[];
      }[]  = []
      while (this.queueActions.length > 0){
        const previousAction = this.queueActions.pop();
        const index = shapes.findIndex(e=>e.id == previousAction.id);
        if(index != -1){
          shapes[index] = { id: previousAction.id, coordinates: previousAction.previous };
        }else{
          shapes.push({ id: previousAction.id, coordinates: previousAction.previous });
        }
      }
      this.queueActions$.next([]);
      const data = this.updateData(shapes);
      return data;
    } catch (error) {
      throw 'Something went wrong';
    }
  }

  reset() {
    this.queueActions = [];
    this.queueActions$.next(this.queueActions);
    this.dataSource.next(null);
  }

  batchQuickUpdate(quickEditDTO: QuickEditDTO) {
    const { layerId, changes, owner, source } = quickEditDTO;
    if (!layerId) {
      return throwError('Layer is empty');
    }
    return this.httpService.postJSON(`DataPackage/BatchQuickUpdate/${layerId}/Default`, { changes, owner, source });
  }

}
