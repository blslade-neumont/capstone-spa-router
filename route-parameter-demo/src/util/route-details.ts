import inspect = require('@aboveyou00/util-inspect');

export function routeDetails(path, opts) {
    return `
<h4>Route Details</h4>
Path: <code>${path}</code><br/>
Route Parameters: <code>${inspect(opts)}</code>`;
}
