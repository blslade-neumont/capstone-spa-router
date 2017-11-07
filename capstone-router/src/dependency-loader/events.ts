import { SchemaT } from './schema';

export interface ResourceLoadBeginEventT {
    type: 'resource-load-begin',
    resourceType: 'text' | 'script',
    path: string
}
export interface ResourceLoadEndEventT {
    type: 'resource-load-end',
    resourceType: 'text' | 'script',
    path: string
}
export interface DependencyLoadBeginEventT {
    type: 'dep-load-begin',
    name: string
}
export interface DependencyLoadEndEventT {
    type: 'dep-load-end',
    name: string,
    content: any
}
export interface SchemaLoadBeginEventT {
    type: 'schema-load-begin',
    path: string
}
export interface SchemaLoadEndEventT {
    type: 'schema-load-end',
    path: string,
    added: SchemaT
}
export interface SchemaAddedEventT {
    type: 'schema-added',
    added: SchemaT
}

export type DependencyLoaderEventT = ResourceLoadBeginEventT
                                   | ResourceLoadEndEventT
                                   | DependencyLoadBeginEventT
                                   | DependencyLoadEndEventT
                                   | SchemaLoadBeginEventT
                                   | SchemaLoadEndEventT
                                   | SchemaAddedEventT;
