/// <reference types="jasmine" />

import { NetworkDependencyLoader } from '../network-dependency-loader';
import { sharedDependencyLoaderTests } from './shared-dependency-loader-tests';

describe('NetworkDependencyLoader', () => {
    sharedDependencyLoaderTests(() => {
        return new NetworkDependencyLoader();
    });
    
    describe('unique functionality', () => {
        let inst: NetworkDependencyLoader;
        beforeEach(() => {
            inst = new NetworkDependencyLoader();
        });
        
        describe('.loadSchema', () => {
            
        });
        
        describe('.get', () => {
            
        });
    });
});
