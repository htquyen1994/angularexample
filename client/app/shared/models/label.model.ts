import { LayerSource } from '../LayerSource';

export interface ILabelStyle {
    id?: string;
    name?: string;
    columnName?: string;
    source?: LayerSource
    color?: string;
    backgroundColor?: string;
    backgroundTransparent?: number;
    textSize?: number;
    fontStyle?: EFontStyle[];
    position?: ELabelPosition;
    isDefault?: boolean;
    isEditable?: boolean;
    isRemovable?: boolean;
    enableScaleRange?: boolean;
    rangeScale?: number[];
}

export enum ELabelPositionName {
    DEFAULT = "Default",
    BOTTOM = "Bottom",
    BOTTOM_RIGHT = "Bottom Right",
    BOTTOM_LEFT = "Bottom Left",
    TOP = "Top",
    TOP_RIGHT = "Top Right",
    TOP_LEFT = "Top Left",
    RIGHT = "Right",
    LEFT = "Left",
    CENTER = "Centre"
}

export enum ELabelPosition {
    // DEFAULT = "DEFAULT",
    BOTTOM = "BOTTOM",
    BOTTOM_RIGHT = "BOTTOM_RIGHT",
    BOTTOM_LEFT = "BOTTOM_LEFT",
    TOP = "TOP",
    TOP_RIGHT = "TOP_RIGHT",
    TOP_LEFT = "TOP_LEFT",
    RIGHT = "RIGHT",
    LEFT = "LEFT",
    CENTER = "CENTER"
}

export enum EFontStyle {
    BOLD = "bold",
    ITALIC = "italic",
    UNDERLINE = "underline"
}
