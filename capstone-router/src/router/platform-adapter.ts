import { Subject } from 'rxjs/Subject';
import { RouterEventT } from './events';
import { RouteEntryT } from './schema';
import { Router } from './router';

export abstract class PlatformAdapter {
    constructor() { }
    
    abstract runOnInit(act: () => void);
    
    abstract initRouter(router: Router, eventsSubject: Subject<RouterEventT>): Promise<void>;
    
    abstract performNavigation(route: RouteEntryT[], path: string, pushState: boolean, modifyHistory?: boolean);
}
