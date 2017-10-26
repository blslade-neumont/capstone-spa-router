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
    
    describe('.ensureInitialized', () => {
        xit('should return a promise', () => {
            
        });
        describe('that promise', () => {
            xit('should be resolved when the router is done initializing', async () => {
                
            });
        });
    });
    
    describe('.init', () => {
        xit('should initialize the platform adapter', async () => {
            
        });
        xit('should begin navigating to the current location pathname', async () => {
            
        });
    });
    
    describe('.loadRoutes', () => {
        xit('should not allow users to load more than one set of routes', async () => {
            
        });
        xit('should fetch the routes using the dependency loader if routes is a string', async () => {
            
        });
        xit('should invoke validateRoutes on the routes passed in or fetched', async () => {
            
        });
        xit('should not resolve until after the router is initialized', async () => {
            
        });
    });
    
    describe('.validateRoutes', () => {
        xit('should fail if routes is is null or falsey', () => {
            
        });
        xit('should fail if routes is not an array', () => {
            
        });
        xit('should invoke validateRoute on each route', () => {
            
        });
        xit('should fail if the routes tree structure is recursive', () => {
            
        });
    });
    
    describe('.validateRoute', () => {
        xit('should fail if route is is null or falsey', () => {
            
        });
        xit('should fail if the route tree structure is recursive', () => {
            
        });
        xit('should fail if route is not an object', () => {
            
        });
        xit('should fail if route path is not a string', () => {
            
        });
        xit('should fail if route template is not a valid template reference or inline template', () => {
            
        });
        xit('should invoke validateRoute on each child route', () => {
            
        });
    });
    
    describe('.getRoutes', () => {
        xit('should fail if awaitRoutes false and loadRoutes has not been called', async () => {
            
        });
        xit('should wait for the user to call loadRoutes if awaitRoutes is true and loadRoutes has not been called', async () => {
            
        });
        xit('should wait for loadRoutes to complete and resolve with the loaded routes', async () => {
            
        });
    });
    
    describe('.navigateTo', () => {
        xit('should not fail if awaitRoutes is true and loadRoutes has not yet been called', async () => {
            
        });
        xit('should split the url into segments without forward slashes', async () => {
            
        });
        xit('should treat the root as a single forward slash path segment', async () => {
            
        });
        xit('should invoke findBestRoute with the url split into segments', async () => {
            
        });
        xit('should not start a navigation if the route is identical to the previous route', async () => {
            
        });
        xit('should try to navigate to the matched path (or null if none matched)', async () => {
            
        });
    });
    
    describe('.loadRouteTemplates', () => {
        describe('when the route is null', () => {
            xit(`should return 'Not found' for the title and template`, async () => {
                
            });
        });
        
        describe('when the route is not null', () => {
            xit('should load all route segment templates through the dependency loader', async () => {
                
            });
            xit('should allow inline templates', async () => {
                
            });
            xit('should allow dependency-loaded templates', async () => {
                
            });
            xit('should allow dependency-loaded template factories', async () => {
                
            });
            xit('should fail if a template factory dependency is not a function', async () => {
                
            });
            xit('should fail if a template is not a valid template reference', async () => {
                
            });
            xit('should allow template factories to return promises', async () => {
                
            });
            xit('should fail if the template does not resolve to be a string', async () => {
                
            });
            xit(`should return 'Untitled Page' as the title if none of the routes specify a title`, async () => {
                
            });
            xit(`should return the title of the most granular route segment that specifies a title`, async () => {
                
            });
        });
    });
    
    describe('.findBestRoute', () => {
        xit('should fail if no routes have been loaded', async () => {
            
        });
        xit('should return the first route that matches the path segments', async () => {
            
        });
        xit('should return null if no route matches the path segments', async () => {
            
        });
    });
});
