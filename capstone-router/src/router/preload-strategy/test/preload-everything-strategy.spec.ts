/// <reference types="jasmine" />

import { Subject } from 'rxjs/Subject';

import { PreloadEverythingStrategy } from '../preload-everything-strategy';
import { sharedPreloadStrategyTests } from './shared-preload-strategy-tests';
import { Router } from '../../router';
import { createMockRouter } from '../../test/mock-router';
import { DependencyLoader, DummyDependencyLoader } from '../../../dependency-loader';
import { RouteEntryT } from '../../schema';
import { RouterEventT } from '../../events';
import { delay } from '../../../util/delay';

describe('PreloadEverythingStrategy', () => {
    sharedPreloadStrategyTests(() => {
        let inst = new PreloadEverythingStrategy();
        return inst;
    });
    
    describe('unique functionality', () => {
        let router: Router;
        let inst: PreloadEverythingStrategy;
        let dependencyLoader: DependencyLoader;
        let eventsSubject: Subject<RouterEventT>
        let routes: RouteEntryT[];
        beforeEach(() => {
            inst = new PreloadEverythingStrategy();
            router = createMockRouter(routes = []);
            dependencyLoader = (<any>router).dependencyLoader = new DummyDependencyLoader();
            eventsSubject = (<any>router).eventsSubject;
            spyOn(dependencyLoader, 'get').and.returnValue(Promise.resolve('Here it is'));
        });
        
        it('should not preload anything before the first route has been loaded', async () => {
            spyOn(inst, 'preloadRoutes');
            await inst.init(router);
            expect(inst.preloadRoutes).not.toHaveBeenCalled();
        });
        it('should preload all other routes when the first navigation end event is fired', async () => {
            await inst.init(router);
            spyOn(inst, 'preloadRoutes');
            routes.push({path: '/', template: 'ROOT'});
            routes.push({path: 'fish', template: 'FISH'});
            routes.push({path: 'donkey', template: 'DONKEY'});
            eventsSubject.next({ type: 'end', route: [], path: '' });
            await delay(10);
            expect(inst.preloadRoutes).toHaveBeenCalledWith(routes);
        });
        it('should not preload again upon subsequent navigation end events', async () => {
            await inst.init(router);
            eventsSubject.next({ type: 'end', route: [], path: '' });
            await delay(10);
            spyOn(inst, 'preloadRoutes');
            eventsSubject.next({ type: 'end', route: [], path: 'abc' });
            await delay(10);
            expect(inst.preloadRoutes).not.toHaveBeenCalled();
        });
        it('should preload dependencies for nested children', async () => {
            await inst.init(router);
            spyOn(inst, 'preloadRoutes');
            routes.push({path: '/', template: 'ROOT', children: [
                {path: 'fish', template: 'FISH'},
                {path: 'donkey', template: 'DONKEY'}
            ]});
            eventsSubject.next({ type: 'end', route: [], path: 'abc' });
            await delay(10);
            expect(inst.preloadRoutes).toHaveBeenCalledWith([...routes, ...routes[0].children]);
        });
    });
});
