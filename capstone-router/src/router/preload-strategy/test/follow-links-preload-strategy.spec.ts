/// <reference types="jasmine" />

import { FollowLinksPreloadStrategy } from '../follow-links-preload-strategy';
import { sharedPreloadStrategyTests } from './shared-preload-strategy-tests';

describe('FollowLinksPreloadStrategy', () => {
    sharedPreloadStrategyTests(() => {
        let inst = new FollowLinksPreloadStrategy();
        return inst;
    });
    
    describe('unique functionality', () => {
        let inst: FollowLinksPreloadStrategy;
        beforeEach(() => {
            inst = new FollowLinksPreloadStrategy();
        });
        
        
    });
});
