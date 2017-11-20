import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Router } from '../router';
import { RouteEntryT } from '../schema';
import { RouterEventT } from '../events';

export class MockRouter {
    constructor(
        private allRoutes: RouteEntryT[]
    ) { }
    
    protected eventsSubject = new Subject<RouterEventT>();
    readonly events = this.eventsSubject.asObservable();
    
    getRoutes() {
        return Promise.resolve(this.allRoutes);
    }
    
    navigateTo(url: string | string[], pushState = true, awaitRoutes = false) { }
    
    async loadRouteTemplateAndTitle(route: RouteEntryT[], path: string): Promise<[string, string]> {
        return ['tpl', 'title'];
    }
    
    private currentNavigationIndex;
    resetNavigationProgress(idx: number) {
        this.currentNavigationIndex = idx;
    }
    completeNavigationProgress(idx: number) {
        return this.currentNavigationIndex === idx;
    }
    
    findBestRoute() {
        throw new Error(`MockRouter does not support findBestRoute`);
    }
}

export function createMockRouter(routes: RouteEntryT[] = []): Router {
    return <any>new MockRouter(routes);
}
