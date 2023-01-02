export enum LayerSource {
    CORPORATE = 1,
    USER = CORPORATE << 1,
    SHARED = (USER << 1) | USER
}
