import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import { DependencyLoader, NetworkDependencyLoader } from '../dependency-loader';
import { PlatformAdapter } from './platform-adapter';
import { BrowserPlatformAdapter } from './browser-platform-adapter';
import { RouteEntryT } from './schema';
import { RouterEventT, NavigationProgressEventT } from './events';
import { unescapeHtml } from '../util/unescape-html';

export class Router {
    constructor(
        private _dependencyLoader: DependencyLoader = new NetworkDependencyLoader(),
        private _platformAdapter: PlatformAdapter = new BrowserPlatformAdapter()
    ) {
        this._navigationObservable = this._navigationSubject
            .asObservable();
        this._currentRoute = this._navigationObservable
            .map(([route]) => route);
        
        this.routesPromise = new Promise((resolve, reject) => {
            [this.resolveRoutes, this.rejectRoutes] = [resolve, reject];
        });
        
        this.initPromise = new Promise((resolve, reject) => {
            this._platformAdapter.runOnInit(() => {
                try { resolve(this.init()); }
                catch (e) { reject(e); }
            });
        });
        
        this.progressSubject.map(progress => (<NavigationProgressEventT>{
            type: 'progress',
            progress: progress
        })).subscribe(this.eventsSubject);
    }
    
    protected progressSubject = new Subject<number>();
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
        await this._platformAdapter.initRouter(this, this.eventsSubject);
    }
    private initNavigation() {
        this._navigationObservable.subscribe(([route, path, pushState]) => {
            this._platformAdapter.performNavigation(route, path, pushState);
        });
        let location = this.platformAdapter.location;
        this.navigateTo(location.pathname, false, true);
    }
    
    get dependencyLoader() {
        return this._dependencyLoader;
    }
    get platformAdapter() {
        return this._platformAdapter;
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
        if (typeof route !== 'object') throw new Error(`Routes must be objects! Not ${route}`);
        if ((<any>route).__referenced__) throw new Error(`The router routes cannot be self-referential!`);
        (<any>route).__referenced__ = true;
        if (typeof route.path !== 'string') throw new Error(`Routes must have path values that are strings. Not ${route.path}`);
        this.validateReference(route.template, 'template', false);
        this.validateReference(route.title, 'title', true);
        if (route.children) {
            this.validateRoutes(route.children);
        }
    }
    private validateReference(ref: any, semantics: string, allowNull: boolean) {
        if (!ref) {
            if (!allowNull) throw new Error(`All routes must have ${semantics}s`);
            return;
        }
        if (typeof ref !== 'string') {
            if (typeof ref.dep !== 'string' && typeof ref.factory !== 'string') throw new Error(`Route ${semantics}s must be strings, or { dep: string }, or { factory: string }`);
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
    
    async loadRouteTemplateAndTitle(route: RouteEntryT[] | null, path: string, navIdx: number): Promise<[string, string]> {
        if (!route) {
            return ['Not found', 'Not Found'];
        }
        else {
            let allPathSegments = path.split('/').filter(Boolean);
            let [tpls, titles] = await this.resolveRouteTemplatesAndTitles(route, path, allPathSegments, navIdx);
            return [this.mergeTemplates(tpls), this.mergeTitles(titles)];
        }
    }
    private async resolveRouteTemplatesAndTitles(route: RouteEntryT[] | null, path: string, allPathSegments: string[], navIdx: number): Promise<[string[], string[]]> {
         let routeTemplateTitles = await Promise.all(route.map(async (rt, idx) => {
            let allRouteSegments = (<string[]>[]).concat(...route.slice(0, idx + 1).map(rt => rt.path.split('/').filter(Boolean)));
            let params = this.calculateRouteParams(allRouteSegments, allPathSegments);
            let [tpl, title] = await Promise.all([
                this.resolveReference(rt.template, 'Route template', path, params, navIdx),
                this.resolveReference(rt.title, 'Route title', path, params, navIdx)
            ]);
            tpl = tpl && this.replaceRouteParamReferences(tpl, params);
            title = title && unescapeHtml(this.replaceRouteParamReferences(title, params));
            return <[string, string]>[tpl, title];
        }));
        return [
            routeTemplateTitles.map(([tpl, _]) => tpl),
            routeTemplateTitles.map(([_, title]) => title).filter(Boolean)
        ];
    }
    private calculateRouteParams(routeSegments: string[], pathSegments: string[]): { [key: string]: string } {
        let params: { [key: string]: string } = {};
        let pathIdx = 0;
        for (let q = 0; q < routeSegments.length; q++) {
            let routeSeg = routeSegments[q];
            if (routeSeg === '**') {
                params['**'] = pathSegments.slice(pathIdx).join('/');
                pathIdx = pathSegments.length;
                break;
            }
            if (pathIdx >= pathSegments.length) throw new Error(`Too few path segments passed into 'calculateRouteParams'.`);
            if (routeSeg.startsWith(':')) params[routeSeg.substr(1)] = pathSegments[pathIdx];
            pathIdx++;
        }
        return params;
    }
    private async resolveReference(ref: any, semantics: string, path: string, params: { [key: string]: string }, navIdx: number): Promise<string> {
        if (!ref) return ref;
        if (typeof ref !== 'string') {
            let dep = <string>(<any>ref).dep,
                factory = <string>(<any>ref).factory;
            let result: any;
            this.addNavigationDependency(navIdx, 2);
            if (dep) {
                result = await this.dependencyLoader.get(dep);
            }
            else if (factory) {
                result = await this.dependencyLoader.get(factory);
                if (typeof result !== 'function') throw new Error(`${semantics} factory must be a function! Invalid reference: '${result}'`);
            }
            else throw new Error(`Invalid template parameter: ${ref}`);
            this.completeNavigationDependency(navIdx, 1);
            if (typeof result === 'function') {
                result = result(path, params);
                if (result && result.then) result = await result;
            }
            if (typeof result !== 'string') throw new Error(`${semantics} must be a string! Invalid reference: '${result}'`);
            this.completeNavigationDependency(navIdx, 1);
            ref = result;
        }
        return <string>ref;
    }
    private replaceRouteParamReferences(body: string, params: { [key: string]: string }): string {
        let keys = Object.keys(params);
        for (let key of keys) {
            let regex = new RegExp(`\\bROUTE[_\\-]?PARAM(ETER)?:${this.escapeRegex(key)}`, 'g');
            body = body.replace(regex, this.escapeHTML(params[key]));
        }
        return body;
    }
    private escapeRegex(str: string) {
        //Taken from https://makandracards.com/makandra/15879-javascript-how-to-generate-a-regular-expression-from-a-string
        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    private static readonly escapeHtmlMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    private escapeHTML(str: string) {
        return str.replace(/[&<>"']/g, m => Router.escapeHtmlMap[m]);
    }
    private mergeTemplates(templates: string[]): string {
        let routerOutletEl = '<router-outlet></router-outlet>';
        let html = routerOutletEl;
        let firstIdx: number;
        for (let tpl of templates) {
            if (!tpl || tpl.trim() === routerOutletEl) continue;
            firstIdx = html.indexOf(routerOutletEl);
            let before: string, after: string;
            if (firstIdx === -1) {
                before = html;
                after = '';
            }
            else {
                before = html.substr(0, firstIdx);
                after = html.substr(firstIdx + routerOutletEl.length);
                firstIdx = after.indexOf(routerOutletEl);
                if (firstIdx !== -1) throw new Error(`Invalid template, contains multiple router-outlet elements.`);
            }
            html = before + tpl + after;
        }
        if (html === routerOutletEl) throw new Error(`Invalid route template, no route provides a substantial template.`);
        firstIdx = html.indexOf(routerOutletEl);
        if (firstIdx !== -1) throw new Error(`Invalid route template, router-outlet in leaf node.`);
        return html;
    }
    private mergeTitles(titles: string[]): string {
        let title = titles.reduce((prev, curr) => curr.replace(/{}/g, prev), '{}');
        if (title === '{}') title = 'Untitled Page';
        return title;
    }
    
    private currentNavigationIdx = -1;
    private navigationNumerator = 0;
    private navigationDenominator = 1;
    resetNavigationProgress(navigationIdx: number) {
        this.currentNavigationIdx = navigationIdx;
        this.navigationNumerator = 0;
        this.navigationDenominator = 1;
        this.progressSubject.next(this.navigationNumerator / this.navigationDenominator);
    }
    private addNavigationDependency(navigationIdx: number, count = 1) {
        if (this.currentNavigationIdx !== navigationIdx) return;
        this.navigationDenominator += count;
        this.progressSubject.next(this.navigationNumerator / this.navigationDenominator);
    }
    private completeNavigationDependency(navigationIdx: number, count = 1) {
        if (this.currentNavigationIdx !== navigationIdx) return;
        this.navigationNumerator += count;
        this.progressSubject.next(this.navigationNumerator / this.navigationDenominator);
    }
    completeNavigationProgress(navigationIdx: number) {
        if (this.currentNavigationIdx !== navigationIdx) return false;
        this.navigationNumerator = this.navigationDenominator;
        this.progressSubject.next(this.navigationNumerator / this.navigationDenominator);
        this.currentNavigationIdx = -1;
        return true;
    }
    
    private async findBestRoute(segments: string[]): Promise<RouteEntryT[] | null> {
        let routes = await this.getRoutes();
        return this.findFirstMatch(segments, routes, true);
    }
    private findFirstMatch(segments: string[], routes: RouteEntryT[], allowRoot = false): RouteEntryT[] | null {
        for (let route of routes) {
            let split = route.path.split('/').filter(Boolean);
            if (split.length === 0 && route.path.startsWith('/')) {
                if (allowRoot) split.push('/');
                else continue;
            }
            let isMatch = true;
            let matchedTo = 0;
            for (let q = 0; q < split.length; q++) {
                if (split[q] === '**') {
                    matchedTo = segments.length;
                    break;
                }
                if (matchedTo >= segments.length) {
                    isMatch = false;
                    break;
                }
                if (!this.pathSegmentsMatch(segments[matchedTo], split[q])) {
                    isMatch = false;
                    break;
                }
                matchedTo++;
            }
            if (!isMatch) continue;
            let childSegments = segments.slice(matchedTo);
            if (route.children) {
                let bestChildMatch = this.findFirstMatch(childSegments, route.children, allowRoot && split.length === 0);
                if (!bestChildMatch) continue;
                return [route, ...bestChildMatch];
            }
            else if (childSegments.length !== 0) continue;
            return [route];
        }
        return null;
    }
    private pathSegmentsMatch(segment: string, routeSegment: string) {
        return segment === routeSegment || routeSegment.startsWith(':');
    }
}
