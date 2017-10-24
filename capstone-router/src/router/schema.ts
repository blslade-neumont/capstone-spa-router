

export type TemplateMetaT = string | { dep: string; } | { factory: string };

export interface RouteEntryT {
    path: string;
    template: TemplateMetaT;
    title?: string;
    children?: RouteEntryT[];
}
