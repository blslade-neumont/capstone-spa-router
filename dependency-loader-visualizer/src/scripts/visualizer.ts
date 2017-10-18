import { dependencyLoader } from '../util/dependency-loader';

async function main() {
    console.log(`Doing something! Here's the dependency loader:`, dependencyLoader);
    
    await dependencyLoader.loadSchema('router.json');
    let result = await dependencyLoader.get('lazy3-c');
    console.log('lazy3-c', result);
}

switch (document.readyState) {
case 'interactive':
case 'complete':
    main();
    break;
case 'loading':
default:
    document.addEventListener('DOMContentLoaded', () => main());
    break;
}
