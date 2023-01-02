import { ILayer, IFilter, ILayerGroup } from '../../shared/interfaces'

export interface ICoreLayer extends ILayer {

}

export interface ICoreFilter {
  layerId: string;
  filters: IFilter[]
}

export interface ICoreGroup {
  id: string;
  name: string;
  layers: ICoreLayer[];
}
