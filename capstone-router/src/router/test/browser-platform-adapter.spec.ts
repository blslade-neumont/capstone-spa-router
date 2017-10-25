/// <reference types="jasmine" />

import { BrowserPlatformAdapter } from '../browser-platform-adapter';
import { sharedPlatformAdapterTests } from './shared-platform-adapter-tests';

describe('BrowserPlatformAdapter', () => {
    sharedPlatformAdapterTests(() => {
        let inst = new BrowserPlatformAdapter();
        return inst;
    });
    
    describe('unique functionality', () => {
        let inst: BrowserPlatformAdapter;
        beforeEach(() => {
            inst = new BrowserPlatformAdapter();
        });
        
        describe('.runOnInit', () => {
            
        });
        
        describe('.initRouter', () => {
            
        });
        
        describe('.performNavigation', () => {
            
        });
    });
});
