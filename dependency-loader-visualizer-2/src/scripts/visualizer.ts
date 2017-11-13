import { dependencyLoader } from '../util/dependency-loader';
import { DependencyLoader, SchemaT, SchemaEntryT } from '@aboveyou00/capstone-router';

async function main() {
    (<any>window).dependencyLoader = dependencyLoader;
    createVisualizer(dependencyLoader);
    
    await dependencyLoader.loadSchema('dependencies.json');
}

let schemaLoadingMsg = document.getElementById('schemaLoadingMsg');
let dependencyGridContainer = document.getElementById('dependencyGrid');
let dependencyContentName = <HTMLHeadingElement>document.getElementById('dependencyContentName');
let dependencyContent = <HTMLPreElement>document.getElementById('dependencyContent');

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let renderFn: () => void;

function redrawCanvas() {
    if (canvas) {
        canvas.width = canvas.scrollWidth;
        canvas.height = canvas.scrollHeight;
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (renderFn) renderFn();
    }
}
window.addEventListener('resize', () => {
    redrawCanvas();
});

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
        let allDeps = getAllDeps(dep);
        generation = allDeps
            .map(depName => getGeneration(depName) + 1)
            .reduce((prev, curr) => Math.max(prev, curr), 0);
        generationMap.set(name, generation);
        return generation;
    }
    function getAllDeps(dep: SchemaEntryT) {
        return <string[]>[...new Set([...(dep.deps || []), ...((dep.type === 'script' && (<any>dep).args) || [])])];
    }
    
    let rowMap = new Map<string, number>();
    let placementMap = new Map<string, boolean>();
    let nextAvailableGen0 = 0;
    let maxRow = 0;
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
        if (row > maxRow) maxRow = row;
        let unplaced = unplacedMap.get(gen);
        let idx = unplaced.indexOf(name);
        unplaced.splice(idx, 1);
    }
    function lastRowFromDeps(entry: SchemaEntryT) {
        let allDeps = getAllDeps(entry);
        if (!allDeps.length) return nextAvailableGen0++;
        let maxRow = -Infinity;
        for (let dep of allDeps) {
            if (!rowMap.has(dep)) emplace(dep);
            let depRow = rowMap.get(dep);
            if (depRow > maxRow) maxRow = depRow;
        }
        return maxRow;
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
    gridHeader.classList.add('mt-2');
    dependencyGridContainer.appendChild(gridHeader);
    
    let dependencyWrapper = document.createElement('div');
    dependencyWrapper.classList.add('dependency-wrapper');
    dependencyWrapper.style['grid-template-columns'] = `${maxGeneration + 2}`;
    dependencyGridContainer.appendChild(dependencyWrapper);
    
    canvas = document.createElement('canvas');
    canvas.style['grid-row'] = `1 / ${2 + Math.max(maxRow, networkResources.length)}`;
    canvas.style['grid-column'] = `1 / ${maxGeneration + 3}`;
    canvas.style['z-index'] = '-1';
    context = canvas.getContext('2d');
    dependencyWrapper.appendChild(canvas);
    
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
    
    let networkResourceBtnMap = new Map<string, HTMLButtonElement>();
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
        networkResourceBtnMap.set(source, resourceBtn);
    }
    
    let dependencyBtnMap = new Map<string, HTMLButtonElement>();
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
        dependencyBtnMap.set(dep.name, depBtn);
    }
    
    renderFn = () => {
        context.strokeStyle = 'yellow';
        context.lineWidth = 1.5;
        context.beginPath();
        for (let dep of dependencies) {
            let rightBtn = dependencyBtnMap.get(dep.name);
            let leftBtn = networkResourceBtnMap.get(dep.src);
            context.moveTo(rightBtn.offsetLeft - 5, rightBtn.offsetTop + (rightBtn.offsetHeight / 2));
            context.lineTo(leftBtn.offsetLeft + leftBtn.offsetWidth + 5, leftBtn.offsetTop + (leftBtn.offsetHeight / 2));
        }
        context.stroke();
        
        context.strokeStyle = 'green';
        context.lineWidth = 3;
        context.lineCap = 'arrow';
        context.beginPath();
        for (let dep of dependencies) {
            let rightBtn = dependencyBtnMap.get(dep.name);
            let allDeps = getAllDeps(dep);
            for (let dep2 of allDeps) {
                let leftBtn = dependencyBtnMap.get(dep2);
                context.moveTo(rightBtn.offsetLeft - 5, rightBtn.offsetTop + (rightBtn.offsetHeight / 2));
                context.lineTo(leftBtn.offsetLeft + leftBtn.offsetWidth + 5, leftBtn.offsetTop + (leftBtn.offsetHeight / 2));
            }
        }
        context.stroke();
    };
    redrawCanvas();
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
