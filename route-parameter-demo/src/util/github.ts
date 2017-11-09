import { ajaxGet } from './ajax-get';
import merge = require('lodash.merge');

export const apiBasePath = 'https://api.github.com';

export function githubGet(path: string, headers?: any) {
    headers = merge((headers || {}), {
        'Accept': 'application/vnd.github.v3+json'
    });
    if (!path.startsWith('/')) path = '/' + path;
    return ajaxGet(apiBasePath + path, headers);
}
