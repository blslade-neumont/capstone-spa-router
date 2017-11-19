

export type DepReference<T> = T | { dep: string; } | { factory: string };

export interface RouteEntryT {
    path: string;
    template: DepReference<string>;
    title?: DepReference<string>;
    children?: RouteEntryT[];
}
