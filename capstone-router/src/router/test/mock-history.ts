import { EventEmitter } from './event-emitter';

export class MockHistory extends EventEmitter {
    constructor() {
        super();
    }
    
    pushState(data: any, title: string, url?: string) { }
    replaceState(data: any, title: string, url?: string) { }
}

export function createMockHistory(): History {
    return <any>new MockHistory();
}
