import { dependencyLoader } from '../util/dependency-loader';
import { DependencyLoader, SchemaT, SchemaEntryT } from '@aboveyou00/capstone-router';

async function main() {
    (<any>window).dependencyLoader = dependencyLoader;
    createVisualizer(dependencyLoader);
    
    await dependencyLoader.loadSchema('router.json');
}

let schemaLoadingMsg = document.getElementById('schemaLoadingMsg');
let dependencyGridContainer = document.getElementById('dependencyGrid');
let dependencyContentName = <HTMLHeadingElement>document.getElementById('dependencyContentName');
let dependencyContent = <HTMLPreElement>document.getElementById('dependencyContent');

function createVisualizer(dependencyLoader: DependencyLoader) {
    dependencyLoader.events.subscribe(e => {
        let elements: HTMLCollectionOf<Element>;
        let className: string;
        switch (e.type) {
        case 'schema-added':
            if (schemaLoadingMsg) {
                schemaLoadingMsg.parentElement.removeChild(schemaLoadingMsg);
                schemaLoadingMsg = null;
            }
            addDependencies(dependencyLoader, e.added);
            break;
            
        case 'resource-load-begin':
            console.log('resource load begin event:', e);
            className = e.path.replace('/', '__SLASH__');
            elements = document.getElementsByClassName(`srcref-${className}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                if (!(el instanceof HTMLButtonElement)) continue;
                el.classList.remove('btn-info');
                el.classList.add('btn-warning');
                el.disabled = true;
            }
            break;
            
        case 'resource-load-end':
            console.log('resource load end event', e);
            className = e.path.replace('/', '__SLASH__');
            elements = document.getElementsByClassName(`srcref-${className}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                if (!(el instanceof HTMLButtonElement)) continue;
                el.classList.remove('btn-warning');
                el.classList.add('btn-success');
                el.disabled = false;
            }
            break;
            
        case 'dep-load-begin':
            elements = document.getElementsByClassName(`btnref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                if (!(el instanceof HTMLButtonElement)) continue;
                el.classList.remove('btn-info');
                el.classList.add('btn-warning');
                el.disabled = true;
            }
            break;
            
        case 'dep-load-end':
            elements = document.getElementsByClassName(`btnref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                if (!(el instanceof HTMLButtonElement)) continue;
                el.classList.remove('btn-warning');
                el.classList.add('btn-success');
                el.disabled = false;
            }
            break;
        }
    });
}

function addDependencies(dependencyLoader: DependencyLoader, dependencies: SchemaT) {
    let depMap = new Map<string, SchemaEntryT>();
    for (let dep of dependencies) {
        depMap.set(dep.name, dep);
    }
    let networkResources = [...new Set(dependencies.map(dep => dep.src))];
    console.log(`Adding logical dependencies: [${dependencies.map(dep => dep.name).map(name => `'${name}'`).join(', ')}]`);
    let generationMap = new Map<string, number>();
    let unplacedMap = new Map<number, string[]>();
    let maxGeneration = 0;
    console.log('Calculating generations...');
    for (let dep of dependencies) {
        let gen = getGeneration(dep.name);
        if (gen > maxGeneration) maxGeneration = gen;
        
        let unplaced: string[];
        if (unplacedMap.has(gen)) unplaced = unplacedMap.get(gen);
        else unplacedMap.set(gen, unplaced = []);
        unplaced.push(dep.name);
    }
    function getGeneration(name: string) {
        if (generationMap.has(name)) return generationMap.get(name);
        let dep = depMap.get(name);
        if (!dep) throw new Error(`Unknown dependency: ${name}`);
        let generation: number;
        switch (dep.type) {
        case 'text':
            generation = 0;
            break;
        case 'script':
            generation = (dep.deps || [])
                .map(depName => getGeneration(depName) + 1)
                .reduce((prev, curr) => Math.max(prev, curr), 0);
            break;
        default:
            throw new Error(`Not supported`);
        }
        generationMap.set(name, generation);
        return generation;
    }
    
    let rowMap = new Map<string, number>();
    let placementMap = new Map<string, boolean>();
    let nextAvailableGen0 = 0;
    for (let gen = maxGeneration; gen >= 0; gen--) {
        console.log(`Emplacing generation ${gen}...`);
        let unplaced = (unplacedMap.has(gen) && unplacedMap.get(gen)) || [];
        while (unplaced.length) {
            let firstUnplaced = unplaced[0];
            emplace(firstUnplaced);
        }
    }
    function emplace(name: string) {
        let gen = getGeneration(name);
        let dep = depMap.get(name);
        let row = lastRowFromDeps(dep);
        row = findNextAvailableSlot(gen, row);
        rowMap.set(name, row);
        let unplaced = unplacedMap.get(gen);
        let idx = unplaced.indexOf(name);
        unplaced.splice(idx, 1);
    }
    function lastRowFromDeps(entry: SchemaEntryT) {
        switch (entry.type) {
        case 'text':
            return nextAvailableGen0++;
        case 'script':
            if (!entry.deps || !entry.deps.length) return nextAvailableGen0++;
            let maxRow = -Infinity;
            for (let dep of entry.deps) {
                if (!rowMap.has(dep)) emplace(dep);
                let depRow = rowMap.get(dep);
                if (depRow > maxRow) maxRow = depRow;
            }
            return maxRow;
        default:
            throw new Error(`Not supported!`);
        }
    }
    function findNextAvailableSlot(gen: number, row: number) {
        while (true) {
            let posName = `${gen}_${row}`;
            let isFilled = placementMap.has(posName) && placementMap.get(posName);
            if (!isFilled) {
                placementMap.set(posName, true);
                return row;
            }
            else row++;
        }
    }
    
    console.log(`Creating grid...`);
    let gridHeader = document.createElement('h1');
    gridHeader.innerText = 'Dependency Grid';
    dependencyGridContainer.appendChild(gridHeader);
    
    let dependencyWrapper = document.createElement('div');
    dependencyWrapper.classList.add('dependency-wrapper');
    dependencyWrapper.style['grid-template-columns'] = `${maxGeneration + 2}`;
    dependencyGridContainer.appendChild(dependencyWrapper);
    
    let networkDepLabel = document.createElement('h4');
    networkDepLabel.innerHTML = 'Network Dependencies';
    networkDepLabel.style['grid-row'] = '1';
    networkDepLabel.style['grid-column'] = '1';
    dependencyWrapper.appendChild(networkDepLabel);
    
    let logicalDepLabel = document.createElement('h4');
    logicalDepLabel.innerHTML = 'Logical Dependencies';
    logicalDepLabel.style['grid-row'] = '1';
    logicalDepLabel.style['grid-column'] = `2 / ${maxGeneration + 3}`;
    dependencyWrapper.appendChild(logicalDepLabel);
    
    for (let q = 0; q < networkResources.length; q++) {
        let source = networkResources[q];
        let resourceBtn = document.createElement('button');
        resourceBtn.style['grid-row'] = `${2 + q}`;
        resourceBtn.style['grid-column'] = '1';
        resourceBtn.disabled = true;
        resourceBtn.classList.add('btn', 'btn-info', 'network-resource');
        resourceBtn.innerHTML = source;
        resourceBtn.classList.add(`srcref-${source.replace('/', '__SLASH__')}`);
        dependencyWrapper.appendChild(resourceBtn);
    }
    
    for (let dep of dependencies) {
        let depBtn = document.createElement('button');
        let row = rowMap.get(dep.name);
        depBtn.style['grid-row'] = `${2 + row}`;
        let gen = getGeneration(dep.name);
        depBtn.style['grid-column'] = `${2 + gen}`;
        depBtn.classList.add('btn', 'btn-info');
        depBtn.innerHTML = dep.name;
        depBtn.classList.add(`btnref-${dep.name}`);
        depBtn.addEventListener('click', async () => displayContent(dep.name, await dependencyLoader.get(dep.name)));
        dependencyWrapper.appendChild(depBtn);
    }
}

function displayContent(name: string, content: any) {
    dependencyContentName.innerText = name;
    dependencyContent.innerText = content;
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
