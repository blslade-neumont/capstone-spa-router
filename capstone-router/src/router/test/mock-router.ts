import { Router } from '../router';

export class MockRouter {
    constructor() { }
}

export function createMockRouter(): Router {
    return <any>new MockRouter();
}
