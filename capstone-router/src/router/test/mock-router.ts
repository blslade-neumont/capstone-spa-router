import { Router } from '../router';

export class MockRouter {
    constructor() { }
    
    navigateTo(url: string | string[], pushState = true, awaitRoutes = false) { }
}

export function createMockRouter(): Router {
    return <any>new MockRouter();
}
