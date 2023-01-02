import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MapToolType } from '../enums';
import { debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapToolService {
  private defaultAvailableTools = Object.keys(MapToolType).map(e=>MapToolType[e]);
  private availableToolsSource: BehaviorSubject<MapToolType[]> = new BehaviorSubject<MapToolType[]>(this.defaultAvailableTools);

  public availableTools$ = this.availableToolsSource.asObservable().pipe(debounceTime(100));
  constructor() { }

  disableTools(tools: MapToolType[]) {
    const availableTools = this.availableToolsSource.getValue();
    const _availableTools = availableTools.filter(e => !tools.includes(e));
    this.availableToolsSource.next(_availableTools);
  }

  enableToolsOnly(tools: MapToolType[]) {
    const availableTools = [...tools];
    this.availableToolsSource.next(availableTools);
  }

  enableAllTools() {
    this.availableToolsSource.next(this.defaultAvailableTools)
  }
}
