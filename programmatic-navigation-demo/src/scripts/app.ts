import { Router } from '@aboveyou00/capstone-router';
import 'rxjs/add/operator/filter';

let router: Router;
let isLoaded = false;
(async () => {
    router = new Router({ preloadStrategy: 'follow-links' });
    router.preloadStrategy.delayPreloadMillis = 2000;
    router.addNavigationProgressBar();
    await router.dependencyLoader.loadSchema('/router-dependencies.json');
    await router.loadRoutes('routes');
    router.events.filter(e => e.type == 'begin').subscribe(navEvent => {
        let navHistory = document.getElementById('navigationHistory');
        let anchor = document.createElement('a');
        anchor.href = '#';
        anchor.innerHTML = (<any>navEvent).path;
        anchor.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            router.navigateTo((<any>navEvent).path);
        });
        if (navHistory.firstChild) navHistory.insertBefore(anchor, navHistory.firstChild);
        else navHistory.appendChild(anchor);
    });
    isLoaded = true;
})();

(<any>window).beginNavigation = function(e) {
    if (!isLoaded) {
        alert(`Please wait for the dependency and route schema to load.`);
        return false;
    }
    let pathInput = <HTMLInputElement>document.getElementById('pathInput');
    let val = pathInput.value;
    console.log(val);
    pathInput.value = '';
    router.navigateTo(val);
    
    return false;
}
