import { Injectable, NgZone } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { getPseudoGuid } from '../global';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  components: {id: any, type: ComponentType<any>, ref: MatDialogRef<any, any>}[] = [];
  underneathComponents: {id: any, type: ComponentType<any>, ref: MatDialogRef<any, any>, position:  {x: number;y: number;}}[] = [];

  constructor(
    private dialog: MatDialog,
    private ngZone: NgZone
  ) { }
  openModal(componentType: ComponentType<any>, data: any = null, config: MatDialogConfig = null, allowMulti = false, isUnderneath: boolean= false): MatDialogRef<any> {
    if (!allowMulti && this.components.map(e=>e.type).includes(componentType)) {
      return;
    }

    const id = config && config.id ? config.id : getPseudoGuid();

    if (!config) {
      config = {
        hasBackdrop: false,
      }
    }

    config = {
      ...config,
      data: data ? data : config.data,
    }

    if(isUnderneath && this.underneathComponents.length) {
      const component = this.underneathComponents[this.underneathComponents.length - 1];
      const { x, y } = component.position;
      const { position } = config.data || { position: { x: 0, y: 0} };
      const { componentInstance } = component.ref;
      const {clientHeight} =componentInstance.dialog.elRef.nativeElement;
      const _position: any = {
        x: position ? position.x : 0,
        y: y + clientHeight + 10
      }
      config.data = {
        ...config.data,
        position: _position
      }
    }


    return this.ngZone.run(()=>{
      const ref = this.dialog.open(componentType, config);
      let subscription: Subscription;
      if(isUnderneath && ref.componentInstance && ref.componentInstance.positionChanged){
         subscription = ref.componentInstance.positionChanged.pipe(first()).subscribe((value) => {
          const index = this.underneathComponents.findIndex(e => e.id === id);
          this.underneathComponents.splice(index, 1);
          subscription = null;
        })
        this.underneathComponents.push({id, type: componentType, ref, position: config.data.position })
      }
      ref.afterClosed().pipe(first()).subscribe(() => {
        const index = this.components.findIndex(e => e.id === id);
        this.components.splice(index, 1);
        if(!isUnderneath){
          return;
        }
        const _index = this.underneathComponents.findIndex(e => e.id === id);
        if(_index == -1){
          return;
        }
        this.underneathComponents.splice(_index, 1);
        if(subscription){
          subscription.unsubscribe();
          subscription = null;
        }
      })
      this.components.push({id, type: componentType, ref });
      return ref;
    });
  }

  closeModal(componentType: ComponentType<any>, data) {
    const index = this.components.findIndex(e => e.type === componentType);
    if(index != -1){
      this.components[index].ref.close(data)
    }
  }

  closeModalById(id: string, data?: any) {
    const index = this.components.findIndex(e => e.id == id);
    if(index != -1){
      this.components[index].ref.close(data)
    }
  }
}
