import { PreloadStrategy } from './preload-strategy';
import 'rxjs/add/operator/filter';
import { NavigationEndEventT } from '../events';
import { Router, RouteEntryT } from 'src';
import { resolveLocalHref } from '../../util/resolve-local-href';
import isEqual = require('lodash.isEqual');

const hyperlinkRegex = /<a(?: [a-z]+=[^>]*?)*? href="([^">]+)"/g;
const programmaticRegex = /\.navigateTo ?\( ?["']([^"']+)["'] ?[\),]/g;
const followLinksRegexes: RegExp[] = [
    hyperlinkRegex,
    programmaticRegex
];

declare let router: Router;

export class FollowLinksPreloadStrategy extends PreloadStrategy {
    constructor() {
        super();
        this._document = document;
    }
    
    private _document: HTMLDocument;
    
    async initImpl() {
        this.router.events
            .filter(ev => ev.type === 'end')
            .subscribe(ev => this.followLinks((<NavigationEndEventT>ev).template));
    }
    
    private async followLinks(template: string) {
        let checkUrls = this.extractUrlReferences(template);
        let localUrls = this.getLocalUrls(checkUrls);
        let matchedRoutes = await this.matchLocalUrls(localUrls);
        let routes = this.getUniqueRoutes(matchedRoutes);
        await this.preloadRoutes(routes);
    }
    
    private extractUrlReferences(template: string): string[] {
        let tpl = template.replace(/[\r\n\t]/g, ' ').replace(/ +/g, ' ');
        let checkUrls: string[] = [];
        let match: RegExpExecArray;
        for (let regex of followLinksRegexes) {
            while (match = regex.exec(tpl)) {
                checkUrls.push(match[1]);
            }
        }
        return Array.from(new Set(checkUrls));
    }
    private getLocalUrls(checkUrls: string[]): string[] {
        return Array.from(new Set(checkUrls.map(url => this.getLocalUrl(url)).filter(Boolean)));
    }
    private getLocalUrl(href: string): string {
        let location = this._document.location;
        let host = location.protocol + '//' + location.host;
        let path = location.pathname;
        return resolveLocalHref(host, path, href);
    }
    private async matchLocalUrls(localUrls: string[]): Promise<RouteEntryT[][]> {
        let matchedRoutes: RouteEntryT[][] = [];
        for (let url of localUrls) {
            let segments = url.split('/').filter(Boolean);
            if (!segments.length) segments.push('/');
            let route = await this.router.findBestRoute(segments);
            if (route) matchedRoutes.push(route);
        }
        let unique: RouteEntryT[][] = [];
        for (let route of matchedRoutes) {
            let isSame = false;
            for (let toCheck of unique) {
                if (isEqual(route, toCheck)) {
                    isSame = true;
                    break;
                }
            }
            if (!isSame) unique.push(route);
        }
        return unique;
    }
    private getUniqueRoutes(matchedRoutes: RouteEntryT[][]): RouteEntryT[] {
        let routes = (<RouteEntryT[]>[]).concat(...matchedRoutes);
        return Array.from(new Set(routes));
    }
}
