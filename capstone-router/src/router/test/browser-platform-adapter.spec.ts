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
                xit('should begin intercepting click events on the document', () => {
                    
                });
                describe('when the click event is on an anchor element with a relative href', () => {
                    xit('should prevent default behavior', () => {
                        
                    });
                    xit('should invoke router.navigateTo with the local href', () => {
                        
                    });
                    xit('should push a state to the back stack', () => {
                        
                    });
                });
            });
            
            describe('browser history navigation', () => {
                xit(`should begin intercepting 'popstate' events`, () => {
                    
                });
                xit('should ignore the event if the state is not an object', () => {
                    
                });
                xit('should perform navigation with the specified route and path', () => {
                    
                });
                xit('should not modify the history when performing navigation', () => {
                    
                });
            });
        });
        
        describe('.performNavigation', () => {
            xit('should invoke router.loadRouteTemplates', () => {
                
            });
            xit('should send a navigation begin event', () => {
                
            });
            
            describe('when a new navigation is triggered before router.loadRouteTemplates completes', () => {
                xit('should cancel navigation', () => {
                    
                });
                xit('should not send a navigation end event', () => {
                    
                });
            });
            
            describe('when navigation is not interrupted', () => {
                xit(`should set the outlet's innerHTML with the loaded route template`, () => {
                    
                });
                xit(`should set the document's title with the loaded route title`, () => {
                    
                });
                xit(`should call history.pushState if pushState is true`, () => {
                    
                });
                xit(`should call history.replaceState if pushState is false`, () => {
                    
                });
                xit(`should not push or replace state if modifyHistory is false`, () => {
                    
                });
                xit(`should scroll to the beginning of the document`, () => {
                    
                });
                xit('should send a navigation end event', () => {
                    
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
