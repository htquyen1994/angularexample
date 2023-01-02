import { SelectionService } from "../selection.service";
import { OverlayService } from "../overlay.service";
import { ActionMessageService } from "../action-message.service";
import { LabelgunService } from "../services/labelgun.service";

export class OverlayShapeStatic{
    static isMetric = false;
    static map: google.maps.Map;
    static selectionService: SelectionService;
    static overlayService: OverlayService;
    static actionMessageService: ActionMessageService;
    static labelgunService: LabelgunService
}