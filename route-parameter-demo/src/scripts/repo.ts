import inspect = require('@aboveyou00/util-inspect');
import { routeDetails } from '../util/route-details';
import { githubGet } from '../util/github';
import { cache } from '../util/cache';

(<any>window).organizationRepoTplFactory = function() {
    let cachedGithubGet = cache(path => githubGet(path));
    let getRepo = (owner: string, name: string) => cachedGithubGet(`/repos/${owner}/${name}`);
    return async function(path: string, opts: { [key: string]: string | undefined }) {
        let thisRouteDetails = routeDetails(path, opts);
        try {
            let repo = await getRepo(opts.organizationName, opts.repoName);
            return `
<div class="mt-4 mb-4">
    <h1><a href="${repo.html_url}" target="_blank">${opts.organizationName}/${opts.repoName}</a></h1>
    <h4>Repository Details</h4>
    <pre>${inspect(repo)}</pre>
    ${thisRouteDetails}
</div>`;
        }
        catch (e) {
            return `
<div class="mt-4 mb-4">
    Could not fetch repository. Error: ${e.message}
    ${thisRouteDetails}
</div>`;
        }
    }
}
