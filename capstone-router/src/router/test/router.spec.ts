/// <reference types="jasmine" />

import { Router } from '../router';
import { DependencyLoader } from '../../dependency-loader/dependency-loader';
import { DummyDependencyLoader } from '../../dependency-loader/dummy-dependency-loader';
import { BrowserPlatformAdapter } from '../browser-platform-adapter';
import { createMockDocument } from './mock-document';
import { createMockWindow } from './mock-window';
import { createMockHistory } from './mock-history';

describe('Router', () => {
    let inst: Router;
    let deps: DependencyLoader;
    let platformAdapter: BrowserPlatformAdapter;
    let _document: Document;
    let _window: Window;
    let _history: History;
    beforeEach(() => {
        deps = new DummyDependencyLoader();
        platformAdapter = new BrowserPlatformAdapter();
        _document = (<any>inst)._document = createMockDocument();
        _window = (<any>inst)._window = createMockWindow();
        _history = (<any>inst)._history = createMockHistory();
        inst = new Router(deps, platformAdapter);
    });
    
    describe('.ctor', () => {
        
    });
    
    describe('.ensureInitialized', () => {
        
    });
    
    describe('.init', () => {
        
    });
    
    describe('.loadRoutes', () => {
        
    });
    
    describe('.validateRoutes', () => {
        
    });
    
    describe('.validateRoute', () => {
        
    });
    
    describe('.getRoutes', () => {
        
    });
    
    describe('.currentRoute', () => {
        
    });
    
    describe('.validateRoutes', () => {
        describe('get', () => {
            
        });
    });
    
    describe('.navigateTo', () => {
        
    });
    
    describe('.loadRouteTemplates', () => {
        
    });
    
    describe('.findBestRoute', () => {
        
    });
});
