import { Router } from '@aboveyou00/capstone-router';

(async () => {
    let router = new Router();
    await router.dependencyLoader.loadSchema('dependencies.json');
    await router.loadRoutes('routes');
})();
