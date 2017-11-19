import { Router } from '../router';
import { RouteEntryT } from '../schema';

export abstract class PreloadStrategy {
    constructor() { }
    
    private _router: Router;
    protected get router() {
        return this._router;
    }
    
    init(router: Router): Promise<void> {
        if (!router) throw new Error(`Invalid router. Can't initialize preload strategy.`);
        if (this._router) throw new Error(`This preload strategy has already been initialized.`);
        this._router = router;
        return Promise.resolve(this.initImpl());
    }
    protected abstract initImpl(): Promise<void> | void;
    
    async preloadRoute(routes: RouteEntryT[]): Promise<void> {
        if (!this.router) throw new Error(`Can't preload routes. The preload strategy is not initialized.`);
        try {
            let deps: string[] = [];
            for (let route of routes) {
                if (route.template && typeof route.template !== 'string') {
                    if ((<any>route.template).dep) deps.push((<any>route.template).dep);
                    else if ((<any>route.template).factory) deps.push((<any>route.template).factory);
                }
                if (route.title && typeof route.title !== 'string') {
                    if ((<any>route.title).dep) deps.push((<any>route.title).dep);
                    else if ((<any>route.title).factory) deps.push((<any>route.title).factory);
                }
            }
            await Promise.all(deps.map(name => this.router.dependencyLoader.get(name)));
        }
        catch (e) {
            this.logError(`Failed to preload route: ${routes.map(rt => rt.path).join('/')}`, e);
        }
    }
    private logError(...args: any[]): void {
        console.error(...args);
    }
}
