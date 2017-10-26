/// <reference types="jasmine" />

import { Router } from '../router';
import { DependencyLoader } from '../../dependency-loader/dependency-loader';
import { DummyDependencyLoader } from '../../dependency-loader/dummy-dependency-loader';
import { BrowserPlatformAdapter } from '../browser-platform-adapter';
import { createMockDocument } from './mock-document';
import { createMockWindow } from './mock-window';
import { createMockHistory } from './mock-history';
import cloneDeep = require('lodash.clonedeep');

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
        _document = (<any>platformAdapter)._document = createMockDocument();
        (<any>_document).readyState = 'loading';
        (<any>_document).location = { protocol: 'http:', host: 'localhost:8080', pathname: '/a/b/c' };
        _window = (<any>platformAdapter)._window = createMockWindow();
        _history = (<any>platformAdapter)._history = createMockHistory();
        inst = new Router(deps, platformAdapter);
    });
    
    describe('.ensureInitialized', () => {
        it('should return a promise', () => {
            let result = inst.ensureInitialized();
            expect(result instanceof Promise).toBe(true);
        });
        describe('that promise', () => {
            it('should be resolved when the router is done initializing', async () => {
                let manuallyInitialized = false;
                let otherThread = (async () => {
                    await inst.ensureInitialized();
                    expect(manuallyInitialized).toBe(true);
                })();
                manuallyInitialized = true;
                (<any>_document).emitEvent('DOMContentLoaded', {});
                await otherThread;
            });
        });
    });
    
    describe('.init', () => {
        it('should initialize the platform adapter', async () => {
            spyOn(platformAdapter, 'initRouter');
            (<any>_document).emitEvent('DOMContentLoaded', {});
            await inst.ensureInitialized();
            expect(platformAdapter.initRouter).toHaveBeenCalledWith(inst, jasmine.anything());
        });
        it('should begin navigating to the current location pathname', async () => {
            spyOn(inst, 'navigateTo');
            (<any>_document).emitEvent('DOMContentLoaded', {});
            await inst.ensureInitialized();
            expect(inst.navigateTo).toHaveBeenCalledWith('/a/b/c', false, true);
        });
    });
    
    const singleRoute = [{ path: '/', template: 'tpl', title: 'title' }];
    const singleRouteDep = JSON.stringify({ routes: singleRoute });
    
    const tripleRoutes = [
        { path: '/', template: 'Homepage!', title: 'Home' },
        { path: '/about', template: 'About!', title: 'About' },
        { path: '/contact-us', template: 'Contact us!', title: 'Contact Us' }
    ];
    
    describe('.loadRoutes', () => {
        it('should not allow users to load more than one set of routes', async () => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
            inst.loadRoutes(cloneDeep(singleRoute));
            try {
                await inst.loadRoutes(cloneDeep(singleRoute));
            }
            catch (e) {
                expect(e.message).toMatch(/only one set of routes/i);
                return;
            }
            expect(true).toBeFalsy();
        });
        it('should fetch the routes using the dependency loader if routes is a string', async () => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
            spyOn(deps, 'get').and.callFake(() => Promise.resolve(singleRouteDep));
            await inst.loadRoutes('routes');
            expect(deps.get).toHaveBeenCalledWith('routes');
        });
        it('should invoke validateRoutes on the routes passed in or fetched', async () => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
            spyOn((<any>inst), 'validateRoutes');
            let routes = cloneDeep(singleRoute);
            await inst.loadRoutes(routes);
            expect((<any>inst).validateRoutes).toHaveBeenCalledWith(routes);
        });
        it('should not resolve until after the router is initialized', async () => {
            let manuallyInitialized = false;
            let otherThread = (async () => {
                await inst.loadRoutes(cloneDeep(singleRoute));
                expect(manuallyInitialized).toBe(true);
            })();
            manuallyInitialized = true;
            (<any>_document).emitEvent('DOMContentLoaded', {});
            await otherThread;
        });
    });
    
    describe('.validateRoutes', () => {
        it('should fail if routes is is null or falsey', () => {
            expect(() => (<any>inst).validateRoutes(null)).toThrowError(/routes is falsey/i);
            expect(() => (<any>inst).validateRoutes()).toThrowError(/routes is falsey/i);
        });
        it('should fail if routes is not an array', () => {
            expect(() => (<any>inst).validateRoutes({})).toThrowError(/routes is not an array/i);
            expect(() => (<any>inst).validateRoutes(42)).toThrowError(/routes is not an array/i);
        });
        it('should invoke validateRoute on each route', () => {
            spyOn(<any>inst, 'validateRoute');
            (<any>inst).validateRoutes(cloneDeep(tripleRoutes));
            expect((<any>inst).validateRoute).toHaveBeenCalledTimes(tripleRoutes.length);
        });
        it('should fail if the routes tree structure is recursive', () => {
            let recursiveRoute = cloneDeep(singleRoute);
            recursiveRoute[0].children = recursiveRoute;
            expect(() => (<any>inst).validateRoutes(recursiveRoute)).toThrowError(/self-referential/i);
        });
    });
    
    describe('.validateRoute', () => {
        it('should fail if route is is null or falsey', () => {
            expect(() => (<any>inst).validateRoute(null)).toThrowError(/route.* is falsey/i);
            expect(() => (<any>inst).validateRoute()).toThrowError(/route.* is falsey/i);
        });
        it('should fail if route is not an object', () => {
            expect(() => (<any>inst).validateRoute(42)).toThrowError(/must be.* object/i);
        });
        it('should fail if route path is not a string', () => {
            expect(() => (<any>inst).validateRoute({ path: 42 })).toThrowError(/path value.* string/i);
        });
        it('should fail if the route does not have a valid template ref', () => {
            expect(() => (<any>inst).validateRoute({ path: '/' })).toThrowError(/must have.* template/i);
            expect(() => (<any>inst).validateRoute({ path: '/', template: 42 })).toThrowError(/template.* must be.*/i);
            expect(() => (<any>inst).validateRoute({ path: '/', template: { dep: 42 } })).toThrowError(/template.* must be.*/i);
            expect(() => (<any>inst).validateRoute({ path: '/', template: { factory: 42 } })).toThrowError(/template.* must be.*/i);
            expect(() => (<any>inst).validateRoute({ path: '/', template: 'name' })).not.toThrow();
            expect(() => (<any>inst).validateRoute({ path: '/', template: { dep: 'name' } })).not.toThrow();
            expect(() => (<any>inst).validateRoute({ path: '/', template: { factory: 'name' } })).not.toThrow();
        });
        it('should invoke validateRoute on each child route', () => {
            spyOn(<any>inst, 'validateRoute').and.callThrough();
            (<any>inst).validateRoute({ path: 'orange', template: 'myTemplate', children: cloneDeep(tripleRoutes) });
            expect((<any>inst).validateRoute).toHaveBeenCalledTimes(tripleRoutes.length + 1);
        });
    });
    
    describe('.getRoutes', () => {
        beforeEach(() => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
        });
        
        it('should fail if awaitRoutes false and loadRoutes has not been called', async () => {
            try {
                await inst.getRoutes();
            }
            catch (e) {
                expect(e.message).toMatch(/no routes.* loaded/i);
                return;
            }
            expect(true).toBeFalsy();
        });
        it('should wait for the user to call loadRoutes if awaitRoutes is true and loadRoutes has not been called', async () => {
            let loadedRoutesManually = false;
            let otherThread = (async () => {
                await inst.getRoutes(true);
                expect(loadedRoutesManually).toBe(true);
            })();
            loadedRoutesManually = true;
            await inst.loadRoutes(cloneDeep(singleRoute));
        });
        it('should wait for loadRoutes to complete and resolve with the loaded routes', async () => {
            let expected = cloneDeep(singleRoute);
            await inst.loadRoutes(expected);
            let result = await inst.getRoutes();
            expect(result).toBe(expected);
        });
    });
    
    describe('.navigateTo', () => {
        beforeEach(() => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
        });
        
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
        beforeEach(() => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
        });
        
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
        beforeEach(() => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
        });
        
        xit('should fail if no routes have been loaded', async () => {
            
        });
        xit('should return the first route that matches the path segments', async () => {
            
        });
        xit('should return null if no route matches the path segments', async () => {
            
        });
    });
});
