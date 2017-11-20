/// <reference types="jasmine" />

import { Subject } from 'rxjs/Subject';

import { FollowLinksPreloadStrategy } from '../follow-links-preload-strategy';
import { sharedPreloadStrategyTests } from './shared-preload-strategy-tests';
import { Router } from '../../router';
import { createMockRouter } from '../../test/mock-router';
import { DependencyLoader, DummyDependencyLoader } from '../../../dependency-loader';
import { RouteEntryT } from '../../schema';
import { RouterEventT } from '../../events';
import { delay } from '../../../util/delay';

describe('FollowLinksPreloadStrategy', () => {
    sharedPreloadStrategyTests(() => {
        let inst = new FollowLinksPreloadStrategy();
        return inst;
    });
    
    describe('unique functionality', () => {
        let router: Router;
        let inst: FollowLinksPreloadStrategy;
        let dependencyLoader: DependencyLoader;
        let eventsSubject: Subject<RouterEventT>;
        let routes: RouteEntryT[];
        beforeEach(() => {
            inst = new FollowLinksPreloadStrategy();
            (<any>inst)._document = {
                location: { protocol: 'http:', host: 'localhost:8080', pathname: '/' }
            };
            dependencyLoader = new DummyDependencyLoader();
            router = new Router({ dependencyLoader: dependencyLoader });
            spyOn(router, 'getRoutes').and.returnValue(Promise.resolve(routes = []));
            eventsSubject = (<any>router).eventsSubject;
            spyOn(dependencyLoader, 'get').and.returnValue(Promise.resolve('Here it is'));
        });
        
        describe('.initImpl', () => {
            beforeEach(() => {
                //Shadow the real router and eventsSubject; use its findBestRoute method
                let realRouter = router;
                router = createMockRouter(routes);
                eventsSubject = (<any>router).eventsSubject;
                spyOn(router, 'findBestRoute').and.callFake(realRouter.findBestRoute.bind(realRouter));
                
                routes.push({path: '/', template: 'ROOT'});
                routes.push({path: 'fish', template: 'FISH'});
                routes.push({path: 'donkey', template: 'DONKEY'});
            });
            
            it('should not preload anything before the first route has been loaded', async () => {
                spyOn(inst, 'preloadRoutes');
                await inst.init(router);
                await delay(10);
                expect(inst.preloadRoutes).not.toHaveBeenCalled();
            });
            it('should preload routes referenced in the template when a navigation end event is fired', async () => {
                await inst.init(router);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<a href="/">Home</a>, <a href="/donkey">donkey</a>: some more details.`;
                eventsSubject.next({ type: 'end', route: [], path: '', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([routes[0], routes[2]]);
            });
            it('should preload again upon subsequent navigation end events', async () => {
                await inst.init(router);
                eventsSubject.next({ type: 'end', route: [], path: '', template: '', title: '' });
                await delay(10);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<a href="/">Home</a>, <a href="/donkey">donkey</a>: some more details.`;
                eventsSubject.next({ type: 'end', route: [], path: 'abc', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([routes[0], routes[2]]);
            });
            it('should preload routes referenced as an absolute path', async () => {
                await inst.init(router);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<a href="/">Home</a>`;
                eventsSubject.next({ type: 'end', route: [], path: 'abc', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([routes[0]]);
            });
            it('should preload routes referenced as a full URI', async () => {
                await inst.init(router);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<a href="http://localhost:8080">Home</a>`;
                eventsSubject.next({ type: 'end', route: [], path: 'abc', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([routes[0]]);
            });
            it('should preload routes referenced as a relative path', async () => {
                await inst.init(router);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<a href="./fish">Home</a>`;
                eventsSubject.next({ type: 'end', route: [], path: 'abc', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([routes[1]]);
            });
            it('should preload routes referenced programmatically', async () => {
                await inst.init(router);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<div onclick="router.navigateTo('http://localhost:8080/donkey')">Home</a>`;
                eventsSubject.next({ type: 'end', route: [], path: 'abc', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([routes[2]]);
            });
            it('should not try to preload routes that cannot be resolved', async () => {
                await inst.init(router);
                spyOn(inst, 'preloadRoutes');
                let testTpl = `<a href="/orange">Fake page</a>`;
                eventsSubject.next({ type: 'end', route: [], path: 'abc', template: testTpl, title: '' });
                await delay(10);
                expect(inst.preloadRoutes).toHaveBeenCalledWith([]);
            });
        });
        
        describe('.extractUrlReferences', () => {
            let fn: (template: string) => string[];
            beforeEach(() => {
                fn = (<any>inst).extractUrlReferences.bind(inst);
            });
            
            it('should find urls in anchor tags', () => {
                let expectedUrl = '/one/two/three';
                expect(fn(`Before text <a href="${expectedUrl}">My link</a> after text`)).toEqual([expectedUrl]);
            });
            it('should find urls in invocations of navigateTo', () => {
                let expectedUrl = '/one/two/three';
                expect(fn(`<div onclick="event.preventDefault(); router.navigateTo('${expectedUrl}');">My div</div>`)).toEqual([expectedUrl]);
            });
            it('should find urls in subsequent regex matches', () => {
                let expected = ['/one/two', '/one/three/four'];
                expect(fn(`Before text <a href="${expected[0]}">My link</a> some more <a href="${expected[1]}">My link</a> after text`)).toEqual(expected);
            });
            it('should return an empty array if there are no references', () => {
                expect(fn(`Before text <a href="">My link</a> <div onclick="event.preventDefault(); router.navigateTo('');">My div</div>`)).toEqual([]);
            });
        });
        
        describe('.getLocalUrls', () => {
            let fn: (checkUrls: string[]) => string[];
            beforeEach(() => {
                fn = (<any>inst).getLocalUrls.bind(inst);
            });
            
            it('should invoke getLocalUrl for each url in checkUrls', () => {
                spyOn(<any>inst, 'getLocalUrl');
                let checkUrls = [
                    'http://www.google.com',
                    'mailto://some@email.address',
                    'http://localhost:8080/one/two',
                    '/one/two'
                ];
                fn(checkUrls);
                expect((<any>inst).getLocalUrl).toHaveBeenCalledTimes(checkUrls.length);
            });
            it('should strip out urls that are not local urls', () => {
                let checkUrls = [
                    'http://www.google.com',
                    'mailto://some@email.address',
                    'http://localhost:8080/one/two'
                ];
                let results = fn(checkUrls);
                expect(results).toEqual(['/one/two']);
            });
            it('should remove duplicate urls', () => {
                let checkUrls = [
                    '/three/four',
                    './three/four',
                    'http://localhost:8080/one/two',
                    '/one/two'
                ];
                let results = fn(checkUrls);
                expect(results).toEqual(['/three/four', '/one/two']);
            });
        });
        
        describe('.getLocalUrl', () => {
            let fn: (href: string) => string;
            beforeEach(() => {
                fn = (<any>inst).getLocalUrl.bind(inst);
            });
            
            it('should return null if the href is not a local url', () => {
                expect(fn('http://www.google.com')).toBeNull();
                expect(fn('http://localhost:2146')).toBeNull();
                expect(fn('data://d120497tr3')).toBeNull();
                expect(fn('mailto://some@email.address')).toBeNull();
            });
            it('should return the absolute path of the url if the argument is a local url', () => {
                expect(fn('http://localhost:8080')).toEqual('/');
                expect(fn('http://localhost:8080/')).toEqual('/');
                expect(fn('http://localhost:8080/one/two')).toEqual('/one/two');
                expect(fn('/one/two')).toEqual('/one/two');
                expect(fn('/fish/fry')).toEqual('/fish/fry');
            });
            it('should allow relative urls', () => {
                (<any>inst)._document.location.pathname = '/black/white';
                expect(fn('./orange')).toEqual('/black/orange');
                expect(fn('./')).toEqual('/black/');
            });
        });
        
        describe('.matchLocalUrls', () => {
            let fn: (localUrls: string[]) => Promise<RouteEntryT[][]>;
            beforeEach(async () => {
                fn = (<any>inst).matchLocalUrls.bind(inst);
                routes.push({path: 'one', template: { dep: 'dep-1' }, children: [
                    {path: 'two', template: { dep: 'dep-2' }},
                    {path: 'three', template: { dep: 'dep-3' }}
                ]});
                await inst.init(router);
            });
            
            it('should match each local url to a route', async () => {
                let results = await fn(['/one/two', '/one/three']);
                expect(results).toEqual([
                    [routes[0], routes[0].children[0]],
                    [routes[0], routes[0].children[1]]
                ]);
            });
            it('should ignore local urls that cannot be matched to a route', async () => {
                let results = await fn(['/one/two/three', '/', '/one/three']);
                expect(results).toEqual([
                    [routes[0], routes[0].children[1]]
                ]);
            });
            it('should ignore duplicate routes', async () => {
                let results = await fn(['/one/two', '/one/two', '/one/two', '/one/three']);
                expect(results).toEqual([
                    [routes[0], routes[0].children[0]],
                    [routes[0], routes[0].children[1]]
                ]);
            });
        });
        
        describe('.getUniqueRoutes', () => {
            let fn: (matchedRoutes: RouteEntryT[][]) => RouteEntryT[];
            beforeEach(async () => {
                fn = (<any>inst).getUniqueRoutes.bind(inst);
                routes.push({path: 'one', template: { dep: 'dep-1' }, children: [
                    {path: 'two', template: { dep: 'dep-2' }},
                    {path: 'three', template: { dep: 'dep-3' }}
                ]});
                routes.push({path: 'four', template: { dep: 'dep-4' }});
            });
            
            it('should flatten all of the routes into an array of route segments', () => {
                let results = fn([
                    [routes[0], routes[0].children[0]],
                    [routes[1]]
                ]);
                expect(results).toEqual([routes[0], routes[0].children[0], routes[1]]);
            });
            it('should ignore duplicate route segments', () => {
                let results = fn([
                    [routes[0], routes[0].children[0]],
                    [routes[0], routes[0].children[1]]
                ]);
                expect(results).toEqual([routes[0], routes[0].children[0], routes[0].children[1]]);
            });
        });
    });
});
