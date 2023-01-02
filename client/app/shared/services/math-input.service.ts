import { Injectable } from '@angular/core';
import { MathInputItem } from '../interfaces';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MathInputService {
  private selectSource = new Subject<MathInputItem>();
  select = this.selectSource.asObservable();
  constructor() { }

  onSelect(item: MathInputItem){
    this.selectSource.next(item);
  }
}
