export interface ISelection {
    isAdd: boolean;
    overlayId: string;
    shapeId: string;
    shapeIds?: string[]
}

export interface IRectangleSelection {
    isAdd: boolean;
    bounds: google.maps.LatLngBounds;
}

export interface IActiveShape {
    overlayId: string;
    shapeId: string;
}
