export enum VisualizationType {
    None = 0,
    Image = 1,
    Geometry = Image << 1,
    Tile = Geometry << 1,
    Checkerboard = Tile << 1,
    Isogram = Checkerboard << 1,
    TiledGeometry = (Tile | Geometry),
}
