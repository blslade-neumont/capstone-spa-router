/// <reference types="jasmine" />

import { Subject } from 'rxjs/Subject';

import { PreloadNothingStrategy } from '../preload-nothing-strategy';
import { sharedPreloadStrategyTests } from './shared-preload-strategy-tests';
import { Router } from '../../router';
import { createMockRouter } from '../../test/mock-router';
import { DependencyLoader, DummyDependencyLoader } from '../../../dependency-loader';
import { RouterEventT } from '../../events';
import { delay } from '../../../util/delay';

describe('PreloadNothingStrategy', () => {
    sharedPreloadStrategyTests(() => {
        let inst = new PreloadNothingStrategy();
        return inst;
    });
    
    describe('unique functionality', () => {
        let router: Router;
        let inst: PreloadNothingStrategy;
        let dependencyLoader: DependencyLoader;
        let eventsSubject: Subject<RouterEventT>;
        beforeEach(() => {
            inst = new PreloadNothingStrategy();
            router = createMockRouter();
            dependencyLoader = (<any>router).dependencyLoader = new DummyDependencyLoader();
            eventsSubject = (<any>router).eventsSubject;
            spyOn(dependencyLoader, 'get').and.returnValue(Promise.resolve('Here it is'));
        });
        
        it('should not preload anything before the first route has been loaded', async () => {
            spyOn(inst, 'preloadRoutes');
            await inst.init(router);
            await delay(10);
            expect(inst.preloadRoutes).not.toHaveBeenCalled();
        });
        it('should not preload anything when the first navigation end event is fired', async () => {
            await inst.init(router);
            spyOn(inst, 'preloadRoutes');
            eventsSubject.next({ type: 'end', route: [], path: '', template: '', title: '' });
            await delay(10);
            expect(inst.preloadRoutes).not.toHaveBeenCalled();
        });
    });
});
