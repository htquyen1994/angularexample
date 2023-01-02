import { Injectable } from '@angular/core';
import * as labelgun from '../models/labelgun'
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { OverlayLabelBase } from '../overlay-label';
import { AccountService } from '../account.service';
import { IS_MORRISON } from '../global';

@Injectable({
  providedIn: 'root'
})
export class LabelgunService {
  labelEngine: any;
  nonOverlapLabelMode: boolean;
  isMorrison = IS_MORRISON;
  private changeSource = new Subject<any>();
  private change = this.changeSource.asObservable().pipe(debounceTime(50));
  constructor(private accountService: AccountService) {
    this.labelEngine = new labelgun.default(this.onHideLabel, this.onShowLabel);
    if (!this.isMorrison) {
      this.change.subscribe(e => {
        try {
          if (this.nonOverlapLabelMode) {
            this.labelEngine.update();
          }
        } catch (error) {
          console.error(error)
        }

      })
      this.accountService.account.subscribe(account => {
        this.nonOverlapLabelMode = account.nonOverlapLabelMode;
        if (account.nonOverlapLabelMode) {
          this.labelEngine.update();
        } else {
          this.labelEngine._callLabelCallbacks('show');
        }
      })
    }
  }

  addLabel(label: OverlayLabelBase, id: any, callback: Function = null) {
    if (!label || this.isMorrison) {
      return;
    }
    let rect = label.div.getBoundingClientRect();
    // We convert the container coordinates (screen space) to Lat/lng
    label.getProjection().fromContainerPixelToLatLng(new google.maps.Point(rect.left, rect.bottom))
    let bottomLeft = label.getProjection().fromContainerPixelToLatLng(new google.maps.Point(rect.left, rect.bottom));
    let topRight = label.getProjection().fromContainerPixelToLatLng(new google.maps.Point(rect.right, rect.top));
    let boundingBox = {
      bottomLeft: [bottomLeft.lng(), bottomLeft.lat()],
      topRight: [topRight.lng(), topRight.lat()]
    };
    this.labelEngine.ingestLabel(
      boundingBox,
      id, //id
      label.options.zIndex, // Weight
      label, // object labelObject
      null, // name
      false // isDragged
    );
    if(callback) callback();
  }

  removeLabel(id) {
    this.labelEngine.removeLabel(id);
  }

  reset() {
    this.labelEngine.reset();
  }

  nextChange() {
    this.changeSource.next()
  }

  private onHideLabel(label) {
    (<OverlayLabelBase>label.labelObject).onHide();
  }

  private onShowLabel(label) {
    (<OverlayLabelBase>label.labelObject).onShow();
  }
}
