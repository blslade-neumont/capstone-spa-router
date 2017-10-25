import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/distinctUntilChanged';
import { DependencyLoader, NetworkDependencyLoader } from '../dependency-loader';
import { PlatformAdapter } from './platform-adapter';
import { BrowserPlatformAdapter } from './browser-platform-adapter';
import { RouteEntryT } from './schema';
import { RouterEventT } from './events';

export class Router {
    constructor(
        private deps: DependencyLoader = new NetworkDependencyLoader(),
        private platform: PlatformAdapter = new BrowserPlatformAdapter()
    ) {
        this._navigationObservable = this._navigationSubject
            .asObservable()
            .distinctUntilChanged((lhs, rhs) => lhs[0] === rhs[0]);
        this._currentRoute = this._navigationObservable
            .map(([route]) => route);
        
        this.routesPromise = new Promise((resolve, reject) => {
            [this.resolveRoutes, this.rejectRoutes] = [resolve, reject];
        });
        
        this.initPromise = new Promise((resolve, reject) => {
            this.platform.runOnInit(() => {
                try { resolve(this.init()); }
                catch (e) { reject(e); }
            });
        });
    }
    
    protected eventsSubject = new Subject<RouterEventT>();
    readonly events = this.eventsSubject.asObservable();
    
    private initPromise: Promise<void>;
    async ensureInitialized() {
        await this.initPromise;
    }
    protected async init() {
        await this.initPlatform();
        this.initNavigation();
    }
    private async initPlatform() {
        await this.platform.initRouter(this, this.eventsSubject);
    }
    private initNavigation() {
        this._navigationObservable.subscribe(([route, path, pushState]) => {
            this.platform.performNavigation(route, path, pushState);
        });
        this.navigateTo(document.location.pathname, false, true);
    }
    
    get dependencyLoader() {
        return this.deps;
    }
    get platformAdapter() {
        return this.platform;
    }
    
    private isLoadingRoutes = false;
    private resolveRoutes: (value: RouteEntryT[] | PromiseLike<RouteEntryT[]>) => void;
    private rejectRoutes: (reason: any) => void;
    private routesPromise: Promise<RouteEntryT[]>;
    loadRoutes(content: string): Promise<RouteEntryT[]>;
    loadRoutes(routes: RouteEntryT[]): Promise<RouteEntryT[]>;
    loadRoutes(routes: string | RouteEntryT[]) {
        if (this.isLoadingRoutes) return Promise.reject(new Error('Only one set of routes can be loaded in a single router.'));
        this.isLoadingRoutes = true;
        (async () => {
            try {
                if (typeof routes === 'string') {
                    let routesStr = await this.dependencyLoader.get<string>(routes);
                    let routesJson: any;
                    try { routesJson = JSON.parse(routesStr); }
                    catch (e) {
                        throw new Error(`Failed to parse routes json. Original error: ${e.message}`);
                    }
                    if (typeof routesJson === 'object' && !!routesJson && !Array.isArray(routesJson)) {
                        routes = <RouteEntryT[]>routesJson.routes;
                    }
                    else if (Array.isArray(routesJson)) {
                        routes = <RouteEntryT[]>routesJson;
                    }
                    else throw new Error(`Invalid routes json loaded from dependency: ${routes}`);
                }
                this.validateRoutes(routes);
                await this.ensureInitialized();
                this.resolveRoutes(routes);
            }
            catch (e) { this.rejectRoutes(e); }
        })();
        return this.routesPromise;
    }
    private validateRoutes(routes: RouteEntryT[]) {
        if (!routes) throw new Error(`Routes is falsey!`);
        if (!Array.isArray(routes)) throw new Error(`Routes is not an array!`);
        for (let route of routes) {
            this.validateRoute(route);
        }
    }
    private validateRoute(route: RouteEntryT) {
        if (!route) throw new Error(`One of the routes is falsey!`);
        if ((<any>route).__referenced__) throw new Error(`The router routes cannot be self-referential!`);
        (<any>route).__referenced__ = true;
        if (typeof route !== 'object') throw new Error(`Routes must be objects! Not ${route}`);
        if (typeof route.path !== 'string') throw new Error(`Routes must have path values that are strings. Not ${route.path}`);
        if (typeof route.template !== 'string') {
            let template = route.template;
            if (!template) throw new Error(`All routes must have templates!`);
            if (typeof (<any>template).dep !== 'string' && typeof (<any>template).factory !== 'string') throw new Error(`Route templates must be strings, or { dep: string }, or { factory: string }`);
        }
        if (route.children) {
            this.validateRoutes(route.children);
            throw new Error(`Route children not implemented`);
        }
    }
    async getRoutes(awaitRoutes = false): Promise<RouteEntryT[]> {
        if (!awaitRoutes && !this.isLoadingRoutes) throw new Error(`No routes have been loaded!`);
        return await this.routesPromise;
    }
    
    private _navigationSubject: Subject<[RouteEntryT[] | null, string, boolean]> = new ReplaySubject<[RouteEntryT[] | null, string, boolean]>(1);
    private _navigationObservable: Observable<[RouteEntryT[] | null, string, boolean]>;
    private _currentRoute: Observable<RouteEntryT[] | null>;
    get currentRoute() {
        return this._currentRoute;
    }
    
    navigateTo(url: string, pushState?: boolean, awaitRoutes?: boolean): Promise<void>;
    navigateTo(segments: string[], pushState?: boolean, awaitRoutes?: boolean): Promise<void>;
    async navigateTo(url: string | string[], pushState = true, awaitRoutes = false): Promise<void> {
        let segments = typeof url === 'string' ? url.split('/') : url;
        segments = segments.filter(Boolean);
        if (segments.length === 0) segments = ['/'];
        if (awaitRoutes) await this.getRoutes(awaitRoutes);
        let newRoute = await this.findBestRoute(segments);
        let path = segments.join('/');
        if (!path.startsWith('/')) path = '/' + path;
        this._navigationSubject.next([newRoute, path, pushState]);
    }
    
    async loadRouteTemplates(route: RouteEntryT[], path: string): Promise<[string[], string]> {
        let tpl: string[];
        let title: string;
        if (!route) {
            tpl = ['Not found'];
            title = 'Not Found';
        }
        else {
            tpl = await Promise.all(route.map(async (rt) => {
                let tpl = rt.template;
                if (typeof tpl !== 'string') {
                    let dep = <string>(<any>tpl).dep,
                        factory = <string>(<any>tpl).factory;
                    let result: any;
                    if (dep) {
                        result = await this.dependencyLoader.get(dep);
                    }
                    else if (factory) {
                        result = await this.dependencyLoader.get(factory);
                        if (typeof result !== 'function') throw new Error(`Route template factory must be a function! Invalid template: '${result}'`);
                    }
                    else throw new Error(`Invalid template parameter: ${tpl}`);
                    if (typeof result === 'function') {
                        result = result(path);
                        if (result && result.then) result = await result;
                    }
                    if (typeof result !== 'string') throw new Error(`Route template must be a string! Invalid template: '${result}'`);
                    tpl = result;
                }
                return tpl;
            }));
            title = 'Untitled Page';
            for (let q = route.length - 1; q >= 0; q--) {
                if (route[q].title) {
                    title = route[q].title;
                    break;
                }
            }
        }
        return [tpl, title];
    }
    
    private async findBestRoute(segments: string[]): Promise<RouteEntryT[] | null> {
        let routes = await this.getRoutes();
        if (segments.length != 1) return null;
        for (let route of routes) {
            if (route.path === segments[0]) return [route];
        }
        return null;
    }
}
