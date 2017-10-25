import { EventEmitter } from './event-emitter';

export class MockWindow extends EventEmitter {
    constructor() {
        super();
    }
    
    scrollTo(x: number, y: number) { }
}

export function createMockWindow(): Window {
    return <any>new MockWindow();
}
