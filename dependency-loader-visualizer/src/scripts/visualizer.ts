import { dependencyLoader } from '../util/dependency-loader';

function main() {
    console.log(`Doing something! Here's the dependency loader:`, dependencyLoader);
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
