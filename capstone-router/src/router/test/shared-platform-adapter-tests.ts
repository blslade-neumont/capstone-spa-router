/// <reference types="jasmine" />

import { PlatformAdapter } from '../platform-adapter';
import { RouterEventT } from '../events';

export function sharedPlatformAdapterTests<T extends PlatformAdapter>(factoryFn: () => T, cleanupFn?: (inst: T) => void) {
    describe('shared functionality', () => {
        let inst: T;
        beforeEach(() => {
            inst = factoryFn();
        });
        afterEach(() => {
            if (cleanupFn) cleanupFn(inst);
        });
        
        
    });
}
