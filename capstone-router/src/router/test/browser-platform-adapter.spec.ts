/// <reference types="jasmine" />

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { BrowserPlatformAdapter } from '../browser-platform-adapter';
import { sharedPlatformAdapterTests } from './shared-platform-adapter-tests';
import { createMockDocument } from './mock-document';
import { createMockWindow } from './mock-window';
import { createMockHistory } from './mock-history';
import { createMockRouter } from './mock-router';
import { RouterEventT } from '../events';
import { Router } from '../router';
import { delay } from '../../util/delay';

describe('BrowserPlatformAdapter', () => {
    sharedPlatformAdapterTests(() => {
        let inst = new BrowserPlatformAdapter();
        (<any>inst)._document = createMockDocument();
        (<any>inst)._window = createMockWindow();
        (<any>inst)._history = createMockHistory();
        return inst;
    });
    
    describe('unique functionality', () => {
        let inst: BrowserPlatformAdapter;
        let _document: Document;
        let _window: Window;
        let _history: History;
        let router: Router;
        beforeEach(() => {
            inst = new BrowserPlatformAdapter();
            _document = (<any>inst)._document = createMockDocument();
            _window = (<any>inst)._window = createMockWindow();
            _history = (<any>inst)._history = createMockHistory();
            router = createMockRouter();
        });
        
        describe('.runOnInit', () => {
            it('should invoke the action immediately if the document is ready', () => {
                (<any>_document).readyState = 'complete';
                let wasRun = false;
                inst.runOnInit(() => wasRun = true);
                expect(wasRun).toBe(true);
            });
            it('should invoke the action when the DOM content is loaded if the document is not ready', () => {
                (<any>_document).readyState = 'loading';
                let wasRun = false;
                inst.runOnInit(() => wasRun = true);
                expect(wasRun).toBe(false);
                (<any>_document).emitEvent('DOMContentLoaded');
                expect(wasRun).toBe(true);
            });
            it('should enqueue and invoke all actions when the DOM content is loaded', () => {
                (<any>_document).readyState = 'loading';
                let runCount = 0;
                inst.runOnInit(() => runCount++);
                inst.runOnInit(() => runCount++);
                inst.runOnInit(() => runCount++);
                expect(runCount).toBe(0);
                (<any>_document).emitEvent('DOMContentLoaded');
                expect(runCount).toBe(3);
            });
        });
        
        describe('.initRouter', () => {
            let eventsSubject: Subject<RouterEventT>;
            let eventsObservable: Observable<RouterEventT>;
            let subscription: Subscription | null;
            beforeEach(() => {
                eventsSubject = new Subject<any>();
                eventsObservable = eventsSubject.asObservable();
                subscription = null;
            });
            afterEach(() => {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = null;
                }
            });
            
            it('should fail if no router is passed in', async () => {
                try {
                    await inst.initRouter(<any>null, eventsSubject)
                }
                catch (e) {
                    expect(e.message).toMatch(/without.* router/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it('should fail if the platform adapter has already been initialized', async () => {
                (<any>inst).router = router;
                try {
                    await inst.initRouter(router, eventsSubject)
                }
                catch (e) {
                    expect(e.message).toMatch(/already.* initialized/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it('should create an outlet element next to the router-outlet element if it exists', async () => {
                let outlet = _document.createElement('router-outlet');
                _document.body.appendChild(outlet);
                spyOn(_document.body, 'appendChild').and.callThrough();
                spyOn(_document.body, 'insertBefore').and.callThrough();
                spyOn(_document.body, 'removeChild').and.callThrough();
                await inst.initRouter(router, eventsSubject);
                expect(_document.body.appendChild).not.toHaveBeenCalled();
                expect(_document.body.insertBefore).toHaveBeenCalledWith(jasmine.anything(), outlet);
                expect(_document.body.removeChild).toHaveBeenCalledWith(outlet);
            });
            it('should create an outlet element in the body if a router-outlet element does not exist', async () => {
                spyOn(_document.body, 'appendChild').and.callThrough();
                await inst.initRouter(router, eventsSubject);
                expect(_document.body.appendChild).toHaveBeenCalled();
            });
            
            describe('hyperlink navigation', () => {
                it('should begin intercepting click events on the document', async () => {
                    spyOn(_document, 'addEventListener').and.callThrough();
                    await inst.initRouter(router, eventsSubject);
                    expect(_document.addEventListener).toHaveBeenCalledWith('click', jasmine.anything());
                });
                describe('when the click event is on an anchor element with a remote href', () => {
                    let anchor: HTMLAnchorElement;
                    let e: MouseEvent;
                    beforeEach(() => {
                        anchor = document.createElement('a');
                        anchor.href = 'http://www.google.com/';
                        (<any>_document).location = { protocol: 'http:', host: 'localhost:8080', pathname: '/' };
                        e = <any>{ target: anchor, preventDefault: () => void(0) };
                    });
                    
                    it('should not prevent default behavior', async () => {
                        await inst.initRouter(router, eventsSubject);
                        spyOn(e, 'preventDefault').and.callThrough();
                        (<any>_document).emitEvent('click', e);
                        expect(e.preventDefault).not.toHaveBeenCalled();
                    });
                    it('should not invoke router.navigateTo with the local href', async () => {
                        await inst.initRouter(router, eventsSubject);
                        spyOn(router, 'navigateTo').and.callThrough();
                        (<any>_document).emitEvent('click', e);
                        expect(router.navigateTo).not.toHaveBeenCalled();
                    });
                });
                describe('when the click event is on an anchor element with a local href', () => {
                    let anchor: HTMLAnchorElement;
                    let e: MouseEvent;
                    beforeEach(() => {
                        anchor = document.createElement('a');
                        anchor.href = 'http://localhost:8080/one/two';
                        (<any>_document).location = { protocol: 'http:', host: 'localhost:8080', pathname: '/' };
                        e = <any>{ target: anchor, preventDefault: () => void(0) };
                    });
                    
                    it('should prevent default behavior', async () => {
                        await inst.initRouter(router, eventsSubject);
                        spyOn(e, 'preventDefault').and.callThrough();
                        (<any>_document).emitEvent('click', e);
                        expect(e.preventDefault).toHaveBeenCalled();
                    });
                    it('should invoke router.navigateTo with the local href', async () => {
                        await inst.initRouter(router, eventsSubject);
                        spyOn(router, 'navigateTo').and.callThrough();
                        (<any>_document).emitEvent('click', e);
                        expect(router.navigateTo).toHaveBeenCalledWith('/one/two');
                    });
                });
            });
            
            describe('browser history navigation', () => {
                it(`should begin intercepting 'popstate' events`, async () => {
                    spyOn(_window, 'addEventListener').and.callThrough();
                    await inst.initRouter(router, eventsSubject);
                    expect(_window.addEventListener).toHaveBeenCalledWith('popstate', jasmine.anything());
                });
                it('should ignore the event if the state is not an object', async () => {
                    let e: PopStateEvent = <any>{ state: null };
                    await inst.initRouter(router, eventsSubject);
                    spyOn(inst, 'performNavigation');
                    (<any>_window).emitEvent('popstate', e);
                    expect(inst.performNavigation).not.toHaveBeenCalled();
                });
                it('should perform navigation with the specified route and path', async () => {
                    let route = ['my-route'], path = 'my-path';
                    let e: PopStateEvent = <any>{ state: { route: route, path: path } };
                    await inst.initRouter(router, eventsSubject);
                    spyOn(inst, 'performNavigation');
                    (<any>_window).emitEvent('popstate', e);
                    expect(inst.performNavigation).toHaveBeenCalledWith(route, path, false, false);
                });
            });
        });
        
        describe('.performNavigation', () => {
            let eventsSubject: Subject<RouterEventT>;
            let eventsObservable: Observable<RouterEventT>;
            let subscription: Subscription | null;
            beforeEach(async () => {
                eventsSubject = new Subject<any>();
                eventsObservable = eventsSubject.asObservable();
                subscription = null;
                await inst.initRouter(router, eventsSubject);
            });
            afterEach(() => {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = null;
                }
            });
            
            it('should invoke router.loadRouteTemplateAndTitle', async () => {
                spyOn(router, 'loadRouteTemplateAndTitle').and.callThrough();
                let route = [];
                let path = '/';
                await inst.performNavigation(route, path, true, false);
                expect(router.loadRouteTemplateAndTitle).toHaveBeenCalledWith(route, path);
            });
            it('should send a navigation begin event', async () => {
                let events: RouterEventT[] = [];
                eventsObservable.subscribe(e => events.push(e));
                let route = <any>['fish', 'one'];
                let path = '/';
                await inst.performNavigation(route, path, true, false);
                expect(events.length).toBe(2);
                expect(events[0].type).toBe('begin');
                expect(events[0].route).toBe(route);
                expect(events[0].path).toBe(path);
            });
            it('should blur the current active element', async () => {
                let route = <any>['fish', 'one'];
                let path = '/';
                let activeElement = { blur: function() { } };
                spyOn(activeElement, 'blur');
                (<any>_document).activeElement = activeElement;
                await inst.performNavigation(route, path, true, false);
                expect(activeElement.blur).toHaveBeenCalled();
            });
            
            describe('when a new navigation is triggered before router.loadRouteTemplateAndTitle completes', () => {
                beforeEach(() => {
                    spyOn(router, 'loadRouteTemplateAndTitle').and.callFake(async () => {
                        (<any>inst).navIdx++;
                        return delay(10).then(() => ['tpl', 'title']);
                    });
                });
                
                it('should cancel navigation', async () => {
                    await inst.performNavigation([], '', true, false);
                    expect((<any>inst)._outlet.innerHTML).not.toBe('tpl');
                    expect(_document.title).not.toBe('title');
                });
                it('should not send a navigation end event', async () => {
                    let events: RouterEventT[] = [];
                    eventsObservable.subscribe(e => events.push(e));
                    await inst.performNavigation([], '', true, false);
                    expect(events.length).toBe(1);
                });
            });
            
            describe('when navigation is not interrupted', async () => {
                it(`should set the outlet's innerHTML with the loaded route template`, async () => {
                    await inst.performNavigation([], '', true, false);
                    expect((<any>inst)._outlet.innerHTML).toBe('tpl');
                });
                it(`should set the document's title with the loaded route title`, async () => {
                    await inst.performNavigation([], '', true, false);
                    expect(_document.title).toBe('title');
                });
                it(`should call focus on the first element with an autofocus attribute in the route template`, async () => {
                    let outlet = (<any>inst)._outlet;
                    let autofocusEl = { focus: function() { } };
                    spyOn(outlet, 'querySelector').and.returnValue(autofocusEl);
                    spyOn(autofocusEl, 'focus');
                    await inst.performNavigation([], '', true, false);
                    expect((<any>inst)._outlet.innerHTML).toBe('tpl');
                    expect(autofocusEl.focus).toHaveBeenCalled();
                });
                it(`should call history.pushState if pushState is true`, async () => {
                    spyOn(_history, 'pushState');
                    (<any>_document).location = { protocol: 'http:', host: 'localhost:8080', pathname: '/' };
                    let route = <any[]>['orange goldfish!'];
                    let path = 'fishies!';
                    await inst.performNavigation(route, path, true);
                    expect(_history.pushState).toHaveBeenCalledWith({ route: route, path: path }, 'title', jasmine.anything());
                });
                it(`should call history.replaceState if pushState is false`, async () => {
                    spyOn(_history, 'replaceState');
                    (<any>_document).location = { protocol: 'http:', host: 'localhost:8080', pathname: '/' };
                    let route = <any[]>['orange goldfish!'];
                    let path = 'fishies!';
                    await inst.performNavigation(route, path, false);
                    expect(_history.replaceState).toHaveBeenCalledWith({ route: route, path: path }, 'title', jasmine.anything());
                });
                it(`should not push or replace state if modifyHistory is false`, async () => {
                    spyOn(_history, 'pushState');
                    spyOn(_history, 'replaceState');
                    await inst.performNavigation([], '', true, false);
                    expect(_history.pushState).not.toHaveBeenCalled();
                    expect(_history.replaceState).not.toHaveBeenCalled();
                });
                it(`should scroll to the beginning of the document if pushState is true`, async () => {
                    spyOn(_window, 'scrollTo');
                    await inst.performNavigation([], '', true, false);
                    expect(_window.scrollTo).toHaveBeenCalledWith(0, 0);
                });
                it(`should not scroll to the beginning of the document if pushState is false`, async () => {
                    spyOn(_window, 'scrollTo');
                    await inst.performNavigation([], '', false, false);
                    expect(_window.scrollTo).not.toHaveBeenCalled();
                });
                it('should send a navigation end event', async () => {
                    let events: RouterEventT[] = [];
                    eventsObservable.subscribe(e => events.push(e));
                    let route = <any>['fish', 'one'];
                    let path = '/';
                    await inst.performNavigation(route, path, true, false);
                    expect(events.length).toBe(2);
                    expect(events[1].type).toBe('end');
                    expect(events[1].route).toBe(route);
                    expect(events[1].path).toBe(path);
                });
            });
        });
        
        describe('.resolveLocalHref', () => {
            let fn: (host: string, path: string, href: string) => string | null;
            beforeEach(() => {
                fn = (<any>inst).resolveLocalHref.bind(inst);
            });
            
            it('should return the relative path if the host is the same', () => {
                expect(fn('http://localhost:8080', '/', 'http://localhost:8080/about')).toBe('/about');
                expect(fn('http://www.mysite.com', '/fish/devs', 'http://www.mysite.com/about')).toBe('/about');
                expect(fn('http://www.abc.xyz', '/', '/orange')).toBe('/orange');
                expect(fn('http://www.abc.xyz', '/one/two', 'three')).toBe('/one/three');
                expect(fn('http://www.abc.xyz', '/one/two', 'three/four')).toBe('/one/three/four');
                expect(fn('http://www.abc.xyz', '/', 'one')).toBe('/one');
            });
            it('should return null if the host is not the same', () => {
                expect(fn('http://www.abc.xyz', '/', 'http://www.google.com/')).toBe(null);
                expect(fn('http://localhost:8080', '/', 'email://some@email.com')).toBe(null);
            });
            it('should flatten ./ and ../ at the beginning of the href', () => {
                expect(fn('http://www.abc.xyz', '/one/two/three', '../four')).toBe('/one/four');
                expect(fn('http://www.abc.xyz', '/one/two/three/', '../four')).toBe('/one/two/four');
                expect(fn('http://www.abc.xyz', '/one/two', '../three/four')).toBe('/three/four');
                expect(fn('http://www.abc.xyz', '/one/two/three', '../../four/five')).toBe('/four/five');
                expect(fn('http://www.abc.xyz', '/one/two/three', './four')).toBe('/one/two/four');
            });
        });
    });
});
