/// <reference types="jasmine" />

import cloneDeep = require('lodash.clonedeep');

import { Router } from '../router';
import { DummyDependencyLoader } from '../../dependency-loader/dummy-dependency-loader';
import { BrowserPlatformAdapter } from '../browser-platform-adapter';
import { RouteEntryT } from '../schema';
import { createMockDocument } from './mock-document';
import { createMockWindow } from './mock-window';
import { createMockHistory } from './mock-history';
import { delay } from '../../util/delay';

describe('Router', () => {
    let inst: Router;
    let deps: DummyDependencyLoader;
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
        beforeEach(async () => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
        });
        
        it('should not fail if awaitRoutes is true and loadRoutes has not yet been called', async () => {
            let loadedRoutesManually = false;
            let otherThread = (async () => {
                await inst.navigateTo('/about', true, true);
                expect(loadedRoutesManually).toBe(true);
            })();
            loadedRoutesManually = true;
            await inst.loadRoutes(cloneDeep(tripleRoutes));
        });
        it('should invoke findBestRoute with the url split into segments', async () => {
            spyOn(<any>inst, 'findBestRoute');
            await inst.loadRoutes(cloneDeep(tripleRoutes));
            await inst.navigateTo('/about/some/thing');
            expect((<any>inst).findBestRoute).toHaveBeenCalledWith(['about', 'some', 'thing']);
        });
        it('should treat the root as a single forward slash path segment', async () => {
            spyOn(<any>inst, 'findBestRoute');
            await inst.loadRoutes(cloneDeep(tripleRoutes));
            await inst.navigateTo('/');
            expect((<any>inst).findBestRoute).toHaveBeenCalledWith(['/']);
        });
        it('should try to navigate to the matched path (or null if none matched)', async () => {
            let navs: any[] = [];
            let subscription = (<any>inst)._navigationObservable.subscribe(vals => navs.push(vals));
            let routes = cloneDeep(tripleRoutes);
            await inst.loadRoutes(routes);
            await delay(0);
            await inst.navigateTo(routes[0].path);
            expect(navs[1]).toEqual([[routes[0]], routes[0].path, true]);
        });
        it('should not start a navigation if the route is identical to the previous route', async () => {
            let navs: any[] = [];
            let subscription = (<any>inst)._navigationObservable.subscribe(vals => navs.push(vals));
            let routes = cloneDeep(tripleRoutes);
            await inst.loadRoutes(routes);
            await delay(0);
            await inst.navigateTo(routes[0].path);
            await inst.navigateTo(routes[0].path);
            expect(navs[1]).toEqual([[routes[0]], routes[0].path, true]);
            expect(navs[2]).toBeUndefined();
        });
    });
    
    describe('.areSameNavigation', () => {
        let fn: (lhs: [any[] | null, string], rhs: [any[] | null, string]) => boolean;
        beforeEach(() => {
            fn = (<any>inst).areSameNavigation.bind(inst);
        });
        
        describe('when both routes are not found', () => {
            it('should return true if both paths are the same', () => {
                expect(fn([null, '/abc'], [null, '/abc'])).toBe(true);
            });
            it('should return false if the paths are different', () => {
                expect(fn([null, '/abc'], [null, '/xyz'])).toBe(false);
            });
        });
        
        describe('when only one route is not found', () => {
            it('should return false', () => {
                expect(fn([[{}], '/abc'], [null, '/abc'])).toBe(false);
                expect(fn([null, '/abc'], [[{}], '/abc'])).toBe(false);
            });
        });
        
        describe('when both routes are found', () => {
            const segs = [{ a: 'a' }, { b: 'b' }, { c: 'c' }];
            
            it('should return false if any of the segments are not the same', () => {
                expect(fn([[segs[0]], '/abc'], [[segs[0], segs[1]], '/abc'])).toBe(false);
                expect(fn([[segs[0], segs[1]], '/abc'], [[segs[0]], '/abc'])).toBe(false);
                expect(fn([[segs[0], segs[1]], '/abc'], [[segs[1], segs[0]], '/abc'])).toBe(false);
            });
            it('should return true if all of the segments are the same', () => {
                expect(fn([[segs[0]], '/abc'], [[segs[0]], '/abc'])).toBe(true);
                expect(fn([[...segs], '/abc'], [[...segs], '/abc'])).toBe(true);
                expect(fn([[segs[0]], '/abc'], [[segs[0]], '/xyz'])).toBe(true);
                expect(fn([[...segs], '/abc'], [[...segs], '/xyz'])).toBe(true);
            });
        });
    });
    
    describe('.loadRouteTemplates', () => {
        beforeEach(() => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
        });
        
        describe('when the route is null', () => {
            it(`should return 'Not found' for the title and template`, async () => {
                let [tpl, title] = await inst.loadRouteTemplates(null, '/a/b/c');
                expect(tpl).toEqual('Not found');
                expect(title).toBe('Not Found');
            });
        });
        
        describe('when the route is not null', () => {
            it('should load all route segment templates through the dependency loader', async () => {
                deps.addSchema([
                    { name: 'tpl-one', src: 'one.tpl.html', type: 'text' },
                    { name: 'tpl-two', src: 'two.tpl.html', type: 'text' },
                    { name: 'tpl-three', src: 'three.tpl.html', type: 'text' }
                ]);
                deps.provide('tpl-one', 'One!');
                deps.provide('tpl-two', 'Two!');
                deps.provide('tpl-three', 'Three!');
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { dep: 'tpl-one' } },
                    { path: 'two', template: { dep: 'tpl-two' } },
                    { path: 'three', template: { dep: 'tpl-three' }, title: 'Title!' }
                ], '/a/b/c');
                expect(tpl).toEqual('One!Two!Three!');
            });
            it('should allow inline templates', async () => {
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: 'One!!!' }
                ], '/a/b/c');
                expect(tpl).toEqual('One!!!');
            });
            it('should allow dependency-loaded templates', async () => {
                deps.addSchema([{ name: 'tpl-one', src: 'one.tpl.html', type: 'text' }]);
                deps.provide('tpl-one', 'One!');
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { dep: 'tpl-one' } }
                ], '/a/b/c');
                expect(tpl).toEqual('One!');
            });
            it('should allow dependency-loaded template factories', async () => {
                deps.addSchema([{ name: 'tpl-one', src: 'one.js', type: 'script', methodName: 'getOneFactory' }]);
                deps.provide('tpl-one', (path: string) => `((${path}))`);
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { factory: 'tpl-one' } }
                ], '/a/b/c');
                expect(tpl).toEqual('((/a/b/c))');
            });
            it('should fail if a template factory dependency is not a function', async () => {
                deps.addSchema([{ name: 'tpl-one', src: 'one.js', type: 'script', methodName: 'getOneFactory' }]);
                deps.provide('tpl-one', 'One!!!');
                try {
                    await inst.loadRouteTemplates([
                        { path: 'one', template: { factory: 'tpl-one' } }
                    ], '/a/b/c');
                }
                catch (e) {
                    expect(e.message).toMatch(/must be a function/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it('should fail if a template is not a valid template reference', async () => {
                try {
                    await inst.loadRouteTemplates([
                        { path: 'one', template: <any>{ purple: 'tpl-one' } }
                    ], '/a/b/c');
                }
                catch (e) {
                    expect(e.message).toMatch(/invalid template parameter/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it('should allow template factories to return promises', async () => {
                deps.addSchema([{ name: 'tpl-one', src: 'one.js', type: 'script', methodName: 'getOneFactory' }]);
                deps.provide('tpl-one', (path: string) => delay(10).then(() => `((${path}))`));
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { factory: 'tpl-one' } }
                ], '/a/b/c');
                expect(tpl).toEqual('((/a/b/c))');
            });
            it('should fail if the template does not resolve to be a string', async () => {
                deps.addSchema([{ name: 'tpl-one', src: 'one.js', type: 'script', methodName: 'getOneFactory' }]);
                deps.provide('tpl-one', 42);
                try {
                    await inst.loadRouteTemplates([
                        { path: 'one', template: { dep: 'tpl-one' } }
                    ], '/a/b/c');
                }
                catch (e) {
                    expect(e.message).toMatch(/must be a string/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it(`should return 'Untitled Page' as the title if none of the routes specify a title`, async () => {
                deps.addSchema([
                    { name: 'tpl-one', src: 'one.tpl.html', type: 'text' },
                    { name: 'tpl-two', src: 'two.tpl.html', type: 'text' },
                    { name: 'tpl-three', src: 'three.tpl.html', type: 'text' }
                ]);
                deps.provide('tpl-one', 'One!');
                deps.provide('tpl-two', 'Two!');
                deps.provide('tpl-three', 'Three!');
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { dep: 'tpl-one' } },
                    { path: 'two', template: { dep: 'tpl-two' } },
                    { path: 'three', template: { dep: 'tpl-three' } }
                ], '/a/b/c');
                expect(title).toEqual('Untitled Page');
            });
            it(`should return the title of the most granular route segment that specifies a title`, async () => {
                deps.addSchema([
                    { name: 'tpl-one', src: 'one.tpl.html', type: 'text' },
                    { name: 'tpl-two', src: 'two.tpl.html', type: 'text' },
                    { name: 'tpl-three', src: 'three.tpl.html', type: 'text' }
                ]);
                deps.provide('tpl-one', 'One!');
                deps.provide('tpl-two', 'Two!');
                deps.provide('tpl-three', 'Three!');
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { dep: 'tpl-one' }, title: 'Title-One!' },
                    { path: 'two', template: { dep: 'tpl-two' }, title: 'Title-Two!' },
                    { path: 'three', template: { dep: 'tpl-three' } }
                ], '/a/b/c');
                expect(title).toEqual('Title-Two!');
            });
            it('should merge the templates from nested routes', async () => {
                deps.addSchema([
                    { name: 'tpl-one', src: 'one.tpl.html', type: 'text' },
                    { name: 'tpl-two', src: 'two.tpl.html', type: 'text' },
                    { name: 'tpl-three', src: 'three.tpl.html', type: 'text' }
                ]);
                deps.provide('tpl-one', 'one(<router-outlet></router-outlet>)eno');
                deps.provide('tpl-two', 'two(<router-outlet></router-outlet>)owt');
                deps.provide('tpl-three', 'three(!!!)eerht');
                let [tpl, title] = await inst.loadRouteTemplates([
                    { path: 'one', template: { dep: 'tpl-one' } },
                    { path: 'two', template: { dep: 'tpl-two' } },
                    { path: 'three', template: { dep: 'tpl-three' }, title: 'Title!' }
                ], '/a/b/c');
                expect(tpl).toEqual('one(two(three(!!!)eerht)owt)eno');
            });
        });
    });
    
    describe('.mergeTemplates', () => {
        let fn: (templates: string[]) => string;
        beforeEach(() => {
            fn = (<any>inst).mergeTemplates.bind(inst);
        });
        
        it('should transclude a single template', () => {
            let expected = 'Hello, World!';
            let result = fn([expected]);
            expect(result).toBe(expected);
        });
        it('should append templates if there is no router outlet', () => {
            let tpls: string[] = ['One', 'Two'];
            let result = fn(tpls);
            expect(result).toBe(tpls.join(''));
        });
        it('should transclude templates if there is a router outlet', () => {
            let tpls: string[] = ['one(<router-outlet></router-outlet>)eno', 'two'];
            let expected = 'one(two)eno';
            let result = fn(tpls);
            expect(result).toBe(expected);
        });
        it('should mix transcluding and appending templates', () => {
            let tpls: string[] = [
                'one(<router-outlet></router-outlet>)eno',
                'two',
                'three(<router-outlet></router-outlet>)eerht',
                'four'
            ];
            let expected = 'one(two)enothree(four)eerht';
            let result = fn(tpls);
            expect(result).toBe(expected);
        });
        it('should fail if a template includes more than one router outlet', () => {
            let tpls: string[] = ['one(<router-outlet></router-outlet>)eno <router-outlet></router-outlet>', 'two'];
            expect(() => fn(tpls)).toThrowError(/multiple router-outlet/i);
        });
        it('should fail if no templates are appended or transcluded', () => {
            let tpls: string[] = ['', '', ''];
            expect(() => fn(tpls)).toThrowError(/no.* substantial template/i);
        });
        it('should fail if the last template includes a router-outlet', () => {
            let tpls: string[] = ['one', 'two', 'three <router-outlet></router-outlet>'];
            expect(() => fn(tpls)).toThrowError(/router-outlet in leaf/i);
        });
    });
    
    describe('.findBestRoute', () => {
        let fn: (segments: string[]) => Promise<any[] | null>;
        beforeEach(() => {
            (<any>_document).emitEvent('DOMContentLoaded', {});
            fn = (<any>inst).findBestRoute.bind(inst);
        });
        
        it('should fail if no routes have been loaded', async () => {
            try {
                await fn(['/']);
            }
            catch (e) {
                expect(e.message).toMatch(/no routes.* loaded/i);
                return;
            }
            expect(true).toBeFalsy();
        });
        it('should return the first route that matches the path segments', async () => {
            let single = cloneDeep(singleRoute)[0];
            await inst.loadRoutes([single, cloneDeep(single)]);
            let result = await fn(['/']);
            expect(result).toEqual([single]);
        });
        it('should return null if no route matches the path segments', async () => {
            await inst.loadRoutes(cloneDeep(tripleRoutes));
            let result = await fn(['fish', 'kisses']);
            expect(result).toEqual(null);
        });
    });
    
    describe('.findFirstMatch', () => {
        let fn: (segments: string[], routes: RouteEntryT[], allowRoot?: boolean) => RouteEntryT[] | null;
        beforeEach(() => {
            fn = (<any>inst).findFirstMatch.bind(inst);
        });
        
        it('should match a single segment to a single matching route', () => {
            const routes: RouteEntryT[] = [{ path: 'apple', template: '' }];
            let result = fn(['apple'], routes, true);
            expect(result).toEqual([routes[0]]);
        });
        it('should not match a single segment to a non-matching route', () => {
            const routes: RouteEntryT[] = [{ path: 'orange', template: '' }];
            let result = fn(['apple'], routes, true);
            expect(result).toBeNull();
        });
        it('should match a single segment to a single matching route starting with a forward slash', () => {
            const routes: RouteEntryT[] = [{ path: '/apple', template: '' }];
            let result = fn(['apple'], routes, true);
            expect(result).toEqual([routes[0]]);
        });
        it('should match a single segment as a nested route with to ancestor path segments', () => {
            const routes: RouteEntryT[] = [
                {path: '', template: 'layout 1', children: [
                    {path: '', template: 'distraction'},
                    {path: '', template: 'layout 2', children: [
                        {path: 'apple', template: 'homepage'}
                    ]}
                ]}
            ];
            let result = fn(['apple'], routes, true);
            expect(result).toEqual([routes[0], routes[0].children[1], routes[0].children[1].children[0]]);
        });
        it('should match a single segment with descendent routes with empty path segments', () => {
            const routes: RouteEntryT[] = [
                {path: 'orange', template: 'distraction'},
                {path: 'apple', template: 'root', children: [
                    {path: '', template: 'layout 1', children: [
                        {path: '', template: 'homepage'}
                    ]}
                ]}
            ];
            let result = fn(['apple'], routes, true);
            expect(result).toEqual([routes[1], routes[1].children[0], routes[1].children[0].children[0]]);
        });
        it('should match a single segment with surrounding routes with empty path segments', () => {
            const routes: RouteEntryT[] = [
                {path: '', template: 'root', children: [
                    {path: 'orange', template: 'distraction'},
                    {path: 'apple', template: 'layout 1', children: [
                        {path: '', template: 'homepage'}
                    ]},
                    {path: 'peach', template: 'distraction'}
                ]}
            ];
            let result = fn(['apple'], routes, true);
            expect(result).toEqual([routes[0], routes[0].children[1], routes[0].children[1].children[0]]);
        });
        it('should match multiple segments to multiple matching routes', () => {
            const routes: RouteEntryT[] = [
                {path: 'one', template: 'one', children: [
                    {path: 'two', template: 'two', children: [
                        {path: 'three', template: 'three'}
                    ]}
                ]}
            ];
            let result = fn(['one', 'two', 'three'], routes, true);
            expect(result).toEqual([routes[0], routes[0].children[0], routes[0].children[0].children[0]]);
        });
        it('should match multiple segments to a single matching route', () => {
            const routes: RouteEntryT[] = [{path: 'one/two/three', template: 'one, two, and three'}];
            let result = fn(['one', 'two', 'three'], routes, true);
            expect(result).toEqual([routes[0]]);
        });
        it('should match multiple segments to a single matching route with a forward slash', () => {
            const routes: RouteEntryT[] = [{path: '/one/two/three', template: 'one, two, and three'}];
            let result = fn(['one', 'two', 'three'], routes, true);
            expect(result).toEqual([routes[0]]);
        });
        it('should match multiple segments to multiple matching routes surrounded by routes with empty path segments', () => {
            const routes: RouteEntryT[] = [
                {path: '', template: 'layout', children: [
                    {path: 'one', template: 'distraction', children: [
                        {path: 'three', template: 'three'}
                    ]},
                    {path: 'one/two', template: 'one and two', children: [
                        {path: '', template: 'layout 2', children: [
                            {path: 'three', template: 'three', children: [
                                {path: '', template: 'layout 3'}
                            ]}
                        ]}
                    ]}
                ]}
            ];
            let result = fn(['one', 'two', 'three'], routes, true);
            expect(result).toEqual([
                routes[0],
                routes[0].children[1],
                routes[0].children[1].children[0],
                routes[0].children[1].children[0].children[0],
                routes[0].children[1].children[0].children[0].children[0]
            ]);
        });
        
        describe('when allowRoot is true', () => {
            it('should match the root', () => {
                const routes: RouteEntryT[] = [{ path: '/', template: '' }];
                let result = fn(['/'], routes, true);
                expect(result).toEqual([routes[0]]);
            });
            it('should not match the root if there are unused segments', () => {
                const routes: RouteEntryT[] = [{ path: '/', template: '' }];
                let result = fn(['/', 'orange'], routes, true);
                expect(result).toBeNull();
            });
            it('should match the root as a nested route with to ancestor path segments', () => {
                const routes: RouteEntryT[] = [
                    {path: '', template: 'layout 1', children: [
                        {path: '', template: 'layout 2', children: [
                            {path: '/', template: 'homepage'}
                        ]}
                    ]}
                ];
                let result = fn(['/'], routes, true);
                expect(result).toEqual([routes[0], routes[0].children[0], routes[0].children[0].children[0]]);
            });
            it('should match the root with descendent routes with empty path segments', () => {
                const routes: RouteEntryT[] = [
                    {path: '/', template: 'root', children: [
                        {path: '', template: 'layout 1', children: [
                            {path: '', template: 'homepage'}
                        ]}
                    ]}
                ];
                let result = fn(['/'], routes, true);
                expect(result).toEqual([routes[0], routes[0].children[0], routes[0].children[0].children[0]]);
            });
            it('should match the root with surrounding routes with empty path segments', () => {
                const routes: RouteEntryT[] = [
                    {path: '', template: 'root', children: [
                        {path: '/', template: 'layout 1', children: [
                            {path: '', template: 'homepage'}
                        ]}
                    ]}
                ];
                let result = fn(['/'], routes, true);
                expect(result).toEqual([routes[0], routes[0].children[0], routes[0].children[0].children[0]]);
            });
        });
        
        describe('when allowRoot is false', () => {
            it('should not match the root', () => {
                const routes: RouteEntryT[] = [{ path: '/', template: '' }];
                let result = fn(['/'], routes, false);
                expect(result).toBeNull();
            });
        });
    });
    
    describe('.pathSegmentsMatch', () => {
        let fn: (segment: string, routeSegment: string) => boolean;
        beforeEach(() => {
            fn = (<any>inst).pathSegmentsMatch.bind(inst);
        });
        
        it('should return true if both segments are an exact match', () => {
            expect(fn('fish', 'fish')).toBe(true);
        });
        it('should return false if the segments do not match', () => {
            expect(fn('fish', 'horse')).toBe(false);
        });
    });
});
