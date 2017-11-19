/// <reference types="jasmine" />

import { PreloadEverythingStrategy } from '../preload-everything-strategy';
import { sharedPreloadStrategyTests } from './shared-preload-strategy-tests';

describe('PreloadEverythingStrategy', () => {
    sharedPreloadStrategyTests(() => {
        let inst = new PreloadEverythingStrategy();
        return inst;
    });
    
    describe('unique functionality', () => {
        let inst: PreloadEverythingStrategy;
        beforeEach(() => {
            inst = new PreloadEverythingStrategy();
        });
        
        
    });
});
