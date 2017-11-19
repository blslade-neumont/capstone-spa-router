import { Subject } from 'rxjs/Subject';
import { PlatformAdapter } from './platform-adapter';
import { Router } from '../router';
import { RouteEntryT } from '../schema';
import { RouterEventT } from '../events';

export class BrowserPlatformAdapter extends PlatformAdapter {
    constructor(private debugHistory = false) {
        super();
        this._document = document;
        this._window = window;
        this._history = history;
    }
    
    private _document: Document;
    private _window: Window;
    private _history: History;
    
    runOnInit(act: () => void) {
        switch (this._document.readyState) {
        case 'interactive':
        case 'complete':
            act();
            break;
        case 'loading':
        default:
            this._document.addEventListener('DOMContentLoaded', () => act());
            break;
        }
    }
    
    private router: Router;
    private eventsSubject: Subject<RouterEventT>;
    async initRouter(router: Router, eventsSubject: Subject<RouterEventT>) {
        if (this.router) throw new Error(`Can't init BrowserPlatformAdapter that has already been initialized.`);
        if (!router) throw new Error(`Can't init BrowserPlatformAdapter without a router.`);
        this.router = router;
        this.eventsSubject = eventsSubject;
        this.initOutlet();
        this.initDOM();
        this.initHistory();
    }
    private initOutlet() {
        this._outlet = this._document.createElement('div');
        let routerOutlet = this._document.getElementsByTagName('router-outlet')[0];
        if (routerOutlet) {
            routerOutlet.parentElement.insertBefore(this._outlet, routerOutlet);
            routerOutlet.parentElement.removeChild(routerOutlet);
        }
        else {
            this._document.body.appendChild(this._outlet);
        }
    }
    private initDOM() {
        this._document.addEventListener('click', e => {
            if (e.target instanceof HTMLAnchorElement) {
                let href: string | null = e.target.href;
                let location = this._document.location;
                href = this.resolveLocalHref(location.protocol + '//' + location.host, location.pathname, href);
                if (href) {
                    e.preventDefault();
                    this.router.navigateTo(href);
                }
            }
        });
    }
    private initHistory() {
        this._window.addEventListener('popstate', e => {
            if (!e.state || typeof e.state !== 'object') return;
            let { route, path } = e.state;
            this.performNavigation(route, path, false, false);
        });
    }
    
    get location() {
        return this._document.location;
    }
    
    private _outlet: HTMLElement;
    private navIdx = 0;
    
    async performNavigation(route: RouteEntryT[], path: string, pushState: boolean, modifyHistory = true) {
        let currentNavIdx = ++this.navIdx;
        this.eventsSubject.next({
            type: 'begin',
            route: route,
            path: path
        });
        
        let activeElement = this._document.activeElement || null;
        if (activeElement && typeof (<any>activeElement).blur === 'function') (<any>activeElement).blur();
        
        this.router.resetNavigationProgress(currentNavIdx);
        let [tpl, title] = await this.router.loadRouteTemplateAndTitle(route, path, currentNavIdx);
        if (!this.router.completeNavigationProgress(currentNavIdx)) return;
        
        if (modifyHistory) {
            let historyFn = this._history[pushState ? 'pushState' : 'replaceState'];
            historyFn = historyFn.bind(this._history);
            let location = this._document.location;
            let data = { route: route, path: path };
            let newUrl = location.protocol + '//' + location.host + path;
            if (this.debugHistory) console.log((pushState ? 'Pushing' : 'Replacing') + ' state. data:', data, 'title:', title, 'url:', newUrl);
            historyFn(data, title, newUrl);
        }
        this._outlet.innerHTML = tpl;
        this._document.title = title;
        let autofocusElement = this._outlet.querySelector('[autofocus]') || null;
        if (autofocusElement && typeof (<any>autofocusElement).focus === 'function') (<any>autofocusElement).focus();
        if (pushState) this._window.scrollTo(0, 0);
        
        this.eventsSubject.next({
            type: 'end',
            route: route,
            path: path
        });
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
