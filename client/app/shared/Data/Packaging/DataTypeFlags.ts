export enum DataTypeFlags {
    Nullable = 0x1,
    Guid = Nullable << 1,
    String = Guid << 1,
    Number = String << 1,
    Int16 = Number | (Number << 1),
    Int32 = Number | ((Int16 ^ Number) << 1),
    Int64 = Number | ((Int32 ^ Number) << 1),
    Float = Number | ((Int64 ^ Number) << 1),
    Double = Number | ((Float ^ Number) << 1),
    Boolean = (Double ^ Number) << 1,
    DateTime = Boolean << 1,
    Geometry = DateTime << 1,
    Geography = Geometry << 1,
    Uri = Geography << 1,
    Text = String | (Uri << 1),
    Enumerable = (Text ^ String) << 1
}