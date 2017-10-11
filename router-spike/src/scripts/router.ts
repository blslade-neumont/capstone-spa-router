import { routes, RouteT } from '../util/routes';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/distinctUntilChanged';

class Router {
    constructor(private routes: RouteT[]) {
        this._navigationObservable = this._navigationSubject
          .asObservable()
          .distinctUntilChanged((lhs, rhs) => lhs[0] === rhs[0]);
        this._currentRoute = this._navigationObservable
          .map(([route]) => route);
        
        switch (document.readyState) {
        case 'interactive':
        case 'complete':
            this.init();
            break;
        case 'loading':
        default:
            document.addEventListener('DOMContentLoaded', () => this.init());
            break;
        }
    }
    
    private init() {
        this.initOutlet();
        this.initDOM();
        this.initNavigation();
    }
    private initOutlet() {
        this._outlet = document.createElement('div');
        let routerOutlet = document.getElementsByTagName('router-outlet')[0];
        if (routerOutlet) {
            routerOutlet.parentElement.insertBefore(this._outlet, routerOutlet);
            routerOutlet.parentElement.removeChild(routerOutlet);
        }
        else {
            document.body.appendChild(this._outlet);
        }
    }
    private initDOM() {
        document.addEventListener('click', e => {
            if (e.target instanceof HTMLAnchorElement) {
                let href: string | null = e.target.href;
                href = this.resolveLocalHref(document.location.protocol + '//' + document.location.host, document.location.pathname, href);
                if (href) {
                    e.preventDefault();
                    this.navigateTo(href);
                }
            }
        });
    }
    private initNavigation() {
        this._navigationObservable.subscribe(([route, path, pushState]) => {
            if (!route) {
                this._outlet.innerHTML = 'Not found';
                document.title = 'Not Found';
            }
            else {
                this._outlet.innerHTML = route.template;
                document.title = route.title || 'Untitled Page';
            }
            let historyFn = (pushState ? history.pushState : history.replaceState);
            historyFn = historyFn.bind(history);
            historyFn({ route: route }, document.title, document.location.protocol + '//' + document.location.host + path);
        });
        this.navigateTo(document.location.pathname, false);
    }
    
    private _outlet: HTMLElement;
    
    private _navigationSubject: Subject<[RouteT | null, string, boolean]> = new ReplaySubject<[RouteT | null, string, boolean]>(1);
    private _navigationObservable: Observable<[RouteT | null, string, boolean]>;
    private _currentRoute: Observable<RouteT | null>;
    get currentRoute() {
        return this._currentRoute;
    }
    
    navigateTo(url: string, pushState?: boolean);
    navigateTo(segments: string[], pushState?: boolean);
    navigateTo(url: string | string[], pushState = true) {
        let segments = typeof url === 'string' ? url.split('/') : url;
        segments = segments.filter(Boolean);
        if (segments.length === 0) segments = ['/'];
        let newRoute = this.findBestRoute(segments);
        let path = segments.join('/');
        if (!path.startsWith('/')) path = '/' + path;
        this._navigationSubject.next([newRoute, path, pushState]);
    }
    
    private findBestRoute(segments: string[]): RouteT | null {
        if (segments.length != 1) return null;
        for (let route of this.routes) {
            if (route.path === segments[0]) return route;
        }
        return null;
    }
    private resolveLocalHref(host: string, path: string, href: string): string | null {
        if (href.startsWith(host)) href = href.substr(host.length);
        if (href.match(/^[a-z0-9]+\:/i)) return null;
        else if (href.startsWith('/')) return href;
        
        let lastIdx: number;
        href = '../' + href;
        while (true) {
            if (href.startsWith('../')) {
                let lastIdx = path.lastIndexOf('/');
                if (lastIdx === -1) return null;
                path = path.substr(0, lastIdx);
                href = href.substr(3);
            }
            else if (href.startsWith('./')) {
                href = href.substr(2);
            }
            else break;
        }
        
        return path + '/' + href;
    }
}

(<any>window).router = new Router(routes);
