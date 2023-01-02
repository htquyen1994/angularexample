import { MapToolType } from '../enums'
import { intersection, uniq } from 'lodash';
export class MapToolHelper {
  private readonly enableTools = {
    [MapToolType[MapToolType.SAVE_LOCATION]]: [
      MapToolType.SAVE_LOCATION
    ],
    [MapToolType[MapToolType.ROUTE_TOOL]]: [
      MapToolType.ROUTE_TOOL
    ],
    [MapToolType[MapToolType.ISOGRAM]]: [
      MapToolType.ISOGRAM,
      MapToolType.SHAPE_DELETE,
      MapToolType.SHAPE_DELETE_ALL,
      MapToolType.SELECTION,
    ],
    [MapToolType[MapToolType.REPORTS]]: [
      MapToolType.REPORTS,
      MapToolType.MARKER,
      MapToolType.POLYLINE,
      MapToolType.CIRCLE,
      MapToolType.RECTANGLE,
      MapToolType.POLYGON,
      MapToolType.ISOGRAM,
      MapToolType.SHAPE_DELETE,
      MapToolType.SHAPE_DELETE_ALL,
      MapToolType.SELECTION,
      MapToolType.SELECTION_MAP,
      MapToolType.SELECTION_POLYGON,
      MapToolType.SELECTION_ADD,
      MapToolType.SELECTION_REMOVE,
      MapToolType.SELECTION_REMOVE_ALL,
    ],
    [MapToolType[MapToolType.INSIGHTS]]: [
      MapToolType.INSIGHTS,
      MapToolType.MARKER,
      MapToolType.POLYLINE,
      MapToolType.CIRCLE,
      MapToolType.RECTANGLE,
      MapToolType.POLYGON,
      MapToolType.ISOGRAM,
      MapToolType.SHAPE_DELETE,
      MapToolType.SHAPE_DELETE_ALL,
      MapToolType.SELECTION,
      MapToolType.SELECTION_MAP,
      MapToolType.SELECTION_POLYGON,
      MapToolType.SELECTION_ADD,
      MapToolType.SELECTION_REMOVE,
      MapToolType.SELECTION_REMOVE_ALL,
    ],
    [MapToolType[MapToolType.QUICKEDIT]]: [
      MapToolType.QUICKEDIT,
    ],
    [MapToolType[MapToolType.MEASUREMENT_NEW]]: [
      MapToolType.MEASUREMENT_NEW,
    ],
    [MapToolType[MapToolType.NEAREST]]: [
      MapToolType.NEAREST,
      MapToolType.MARKER,
      MapToolType.SHAPE_DELETE,
      MapToolType.SHAPE_DELETE_ALL,
      MapToolType.SELECTION,
      MapToolType.SELECTION_MAP,
      MapToolType.SELECTION_POLYGON,
      MapToolType.SELECTION_ADD,
      MapToolType.SELECTION_REMOVE,
      MapToolType.SELECTION_REMOVE_ALL,
    ]
  }
  constructor(){
  }

  getEnableTools(tools: MapToolType[]){
    const enableTools = tools.map(e=>this.enableTools[MapToolType[e]]);
    if(!enableTools.length) {
      return null;
    }
    const intersectionTools = enableTools.reduce((a,b)=> intersection(a,b));
    return intersectionTools;
  }
}
