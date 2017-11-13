import { Router } from '../router';
import { RouteEntryT } from '../schema';

export class MockRouter {
    constructor() { }
    
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
}

export function createMockRouter(): Router {
    return <any>new MockRouter();
}
