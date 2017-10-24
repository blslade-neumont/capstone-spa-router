import { Subject } from 'rxjs/Subject';
import { PlatformAdapter } from './platform-adapter';
import { Router } from './router';
import { RouteEntryT } from './schema';
import { RouterEventT } from './events';

export class BrowserPlatformAdapter extends PlatformAdapter {
    constructor() {
        super();
    }
    
    runOnInit(act: () => void) {
        switch (document.readyState) {
        case 'interactive':
        case 'complete':
            act();
            break;
        case 'loading':
        default:
            document.addEventListener('DOMContentLoaded', () => act());
            break;
        }
    }
    
    private router: Router;
    private eventsSubject: Subject<RouterEventT>;
    async initRouter(router: Router, eventsSubject: Subject<RouterEventT>) {
        if (this.router) throw new Error(`Can't init BrowserPlatformAdapter with a new router.`);
        this.router = router;
        this.eventsSubject = eventsSubject;
        this.initOutlet();
        this.initDOM();
        this.initHistory();
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
                    this.router.navigateTo(href);
                }
            }
        });
    }
    private initHistory() {
        window.addEventListener('popstate', e => {
            let { route, path } = e.state;
            this.performNavigation(route, path, false, false);
        });
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
        
        let tpl: string[];
        let title: string;
        [tpl, title] = await this.router.loadRouteTemplates(route, path);
        
        if (currentNavIdx !== this.navIdx) return;
        
        if (route.length !== 1) throw new Error(`Not implemented: nested routes`);
        this._outlet.innerHTML = tpl[0];
        document.title = title;
        if (modifyHistory) {
            let historyFn = (pushState ? history.pushState : history.replaceState);
            historyFn = historyFn.bind(history);
            historyFn({ route: route, path: path }, document.title, document.location.protocol + '//' + document.location.host + path);
        }
        if (pushState) window.scrollTo(0, 0);
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
