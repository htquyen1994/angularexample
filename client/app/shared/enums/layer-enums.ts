export enum ILayerColumnType {
    BOOLEAN,
    NUMBER,
    FLOAT,
    DATE,
    STRING,
    SHAPE,
    QUADKEY,
    DISTANCE
}

export enum ILayerColumnTypeLong {
    BOOLEAN,
    NUMBER,
    FLOAT,
    DATE,
    STRING,
    TEXT,
    ID,
    POSTCODE,
    LATITUDE,
    LONGITUDE,
    POST_SECTOR,
    CENSUS_OUTPUT_AREA,
    ROUTE_TOWN,
    POST_DISTRICT,
    POST_AREA,
    COLOUR,
    MONEY_GBP,
    MONEY_EUR,
    MONEY_USD
}

export enum LayerType {
    POINT,
    POLYLINE,
    POLYGON
}

export enum LayerJoinType {
    POSTCODE = 1,
    POST_SECTOR = 2,
    CENSUS_OUTPUT_AREA = 3,
    ROUTE_TOWN = 4,
    POST_DISTRICT = 5,
    POST_AREA = 6
}

export enum LayerCreationMethod {
    EMPTY,
    FILES,
    POSTCODE,
    COORDINATES
}


export enum DataAction {
    None = 0,
    List = 1,
    Read = List << 1,
    Write = Read << 1,
    Delete = Write << 1,
    ReadWrite = Read | Write,
    Modify = ReadWrite | Delete,
    Copy = Delete << 1,
    Compare = Copy << 1,
    Share = Compare << 1,
    Download = Share << 1,
    RestrictedDownload = Download << 1,
    Join = Read | (RestrictedDownload << 1)
}



