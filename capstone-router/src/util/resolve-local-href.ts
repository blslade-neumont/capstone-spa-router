

export function resolveLocalHref(host: string, path: string, href: string): string | null {
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
