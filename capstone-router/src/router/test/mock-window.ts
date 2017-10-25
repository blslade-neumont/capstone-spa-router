import { EventEmitter } from './event-emitter';

export class MockWindow extends EventEmitter {
    constructor() {
        super();
    }
}

export function createMockWindow(): Window {
    return <any>new MockWindow();
}
