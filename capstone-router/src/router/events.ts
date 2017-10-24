import { RouteEntryT } from './schema';

export type BeginNavigationEventT = {
    type: 'begin',
    route: RouteEntryT[] | null,
    path: string
};
export type EndNavigationEventT = {
    type: 'end',
    route: RouteEntryT[] | null,
    path: string
};

export type NavigationEventT = BeginNavigationEventT | EndNavigationEventT;

export type RouterEventT = NavigationEventT;
