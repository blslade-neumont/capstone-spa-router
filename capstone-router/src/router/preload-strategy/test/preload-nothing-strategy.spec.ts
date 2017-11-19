/// <reference types="jasmine" />

import { PreloadNothingStrategy } from '../preload-nothing-strategy';
import { sharedPreloadStrategyTests } from './shared-preload-strategy-tests';

describe('PreloadNothingStrategy', () => {
    sharedPreloadStrategyTests(() => {
        let inst = new PreloadNothingStrategy();
        return inst;
    });
    
    describe('unique functionality', () => {
        let inst: PreloadNothingStrategy;
        beforeEach(() => {
            inst = new PreloadNothingStrategy();
        });
        
        
    });
});
