/// <reference types="jasmine" />

import { PreloadStrategy } from '../preload-strategy';

export function sharedPreloadStrategyTests<T extends PreloadStrategy>(factoryFn: () => T, cleanupFn?: (inst: T) => void) {
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
