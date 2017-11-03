import { Router } from '@aboveyou00/capstone-router';

let router: Router;
let isLoaded = false;
(async () => {
    router = new Router();
    await router.dependencyLoader.loadSchema('/dependencies.json');
    await router.loadRoutes('routes');
    isLoaded = true;
})();

let pathInput = <HTMLInputElement>document.getElementById('pathInput');
let beginNavigationButton = <HTMLButtonElement>document.getElementById('beginNavigationButton');
pathInput.addEventListener('keyup', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    beginNavigationButton.click();
});
function beginNavigation(e) {
    if (!isLoaded) {
        alert(`Please wait for the dependency and route schema to load.`);
        return false;
    }
    let val = pathInput.value;
    console.log(val);
    pathInput.value = '';
    router.navigateTo(val);
    
    let navHistory = document.getElementById('navigationHistory');
    let anchor = document.createElement('a');
    anchor.href = '#';
    anchor.innerHTML = val;
    anchor.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        router.navigateTo(val);
    });
    if (navHistory.firstChild) navHistory.insertBefore(anchor, navHistory.firstChild);
    else navHistory.appendChild(anchor);
    
    return false;
}
beginNavigationButton.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    return beginNavigation(e);
});
