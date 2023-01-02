import { Subscription, Subject } from 'rxjs';
import { OverlayShape } from '../../overlay-shape';
import { OverlayDataItem, OverlayAbstract } from '../../overlay/overlay-abstact';
import { ILayer } from '../../interfaces';
import { ILabelStyle } from '../label.model';

export interface IOverlayTile {
  id: string;
  shapes: Set<OverlayShape>;
  subscriptions: Set<Subscription>;
}

export interface IOverlaySubscription {
  id: string;
  subscription: Subscription;
}

export abstract class TileOverlayAbstract<T extends OverlayDataItem> extends OverlayAbstract<T> {

  constructor(public id: string, public layer: ILayer) {
    super(id);
  }

  abstract addShapeFromData(data: any, tile: IOverlayTile, labelStyle: ILabelStyle, callback?: Function);
}
