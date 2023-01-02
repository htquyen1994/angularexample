import {ISchema} from "./ISchema";
import {IDataInteraction}  from "./IDataInteraction";
import {IVisualizationSettings} from "./IVisualizationSettings";

export interface IDataView {
    ProgramaticName: string;
    Schema: ISchema;
    Security: IDataInteraction;
    VisualizationSettings: { [name: string]: IVisualizationSettings };
}
