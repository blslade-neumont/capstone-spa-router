import { Router } from '@aboveyou00/capstone-router';

(async () => {
    let router = new Router();
    await router.dependencyLoader.loadSchema('/router-dependencies.json');
    await router.loadRoutes('routes');
})();
