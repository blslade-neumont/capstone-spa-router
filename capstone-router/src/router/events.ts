import { RouteEntryT } from './schema';

export type NavigationBeginEventT = {
    type: 'begin',
    route: RouteEntryT[] | null,
    path: string
};
export type NavigationProgressEventT = {
    type: 'progress',
    progress: number
};
export type NavigationEndEventT = {
    type: 'end',
    route: RouteEntryT[] | null,
    path: string
};

export type NavigationEventT = NavigationBeginEventT | NavigationProgressEventT | NavigationEndEventT;

export type RouterEventT = NavigationEventT;
