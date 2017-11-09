import inspect = require('@aboveyou00/util-inspect');
import { routeDetails } from '../util/route-details';
import { githubGet } from '../util/github';
import { cache } from '../util/cache';

(<any>window).organizationTplFactory = function() {
    let cachedGithubGet = cache(path => githubGet(path));
    let getOrgRepos = (organizationName: string) => cachedGithubGet(`/orgs/${organizationName}/repos`);
    return async function(path: string, opts: { [key: string]: string | undefined }) {
        let thisRouteDetails = routeDetails(path, opts);
        try {
            let repos: any[] = await getOrgRepos(opts.organizationName);
            let reposHtml = repos.map(repo => `<h4><a href="/${repo.full_name}">${repo.full_name}</a></h4>`).join('');
            return `
<div class="mt-4 mb-4">
    <h1>${opts.organizationName}</h1>
    ${reposHtml}
    ${thisRouteDetails}
</div>`;
        }
        catch (e) {
            return `
<div class="mt-4 mb-4">
    Could not fetch organization repositories. Error: ${e.message}
    ${thisRouteDetails}
</div>`;
        }
    }
}
