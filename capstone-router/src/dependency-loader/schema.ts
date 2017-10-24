

export interface BaseContentMetaT {
    name: string;
    type: string;
    src: string;
}
export interface SimpleContentMetaT extends BaseContentMetaT {
    type: "text";
}
export interface DynamicContentMetaT extends BaseContentMetaT {
    type: "script";
    methodName: string;
    deps?: string[];
}
export type ContentMetaT = SimpleContentMetaT | DynamicContentMetaT;

export type SchemaEntryT = ContentMetaT;
export type SchemaT = SchemaEntryT[];
