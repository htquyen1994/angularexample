
export enum OverlayShapeType {
    Point,
    MultiPoint,

    LineString,
    MultiLineString,

    Polygon,
    MultiPolygon,

    Circle,
    Rectangle
}

export enum OverlayShapeChangeType {
    DRAGSTART,
    DRAGEND,
    SET_AT,
    INSERT_AT,
    RADIUS_CHANGED,
    CENTER_CHANGED,
    BOUNDS_CHANGED
}

export enum OverlayShapeClass {
    POINT,
    LINE,
    POLYGON,
    CIRCLE,
    RECTANGLE,
    DRAWING
}