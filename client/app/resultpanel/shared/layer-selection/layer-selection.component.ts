/*
import {Component, OnInit, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs/Subscription';

import {
	LayerService,
	ILayer
} from '../../../shared/index';


@Component({
	selector: 'go-layer-selection',
	moduleId: module.id,
	templateUrl: 'layer-selection.component.html',
	styleUrls: ['layer-selection.component.less']
})
export class LayerSelectionComponent implements OnInit, OnDestroy {

	layers:ILayer[] = [];
	private layerSubscription:Subscription;

	constructor(private layerService:LayerService) {
	}

	ngOnInit() {
		this.layerSubscription = this.layerService.layer.subscribe(layers => {
			this.layers = layers;
		});
	}

	ngOnDestroy() {
		this.layerSubscription.unsubscribe();
	}
}

*/
