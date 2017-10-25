import { Router } from '../router';
import { RouteEntryT } from '../schema';

export class MockRouter {
    constructor() { }
    
    navigateTo(url: string | string[], pushState = true, awaitRoutes = false) { }
    
    async loadRouteTemplates(route: RouteEntryT[], path: string): Promise<[string[], string]> {
        return [['tpl'], 'title'];
    }
}

export function createMockRouter(): Router {
    return <any>new MockRouter();
}
