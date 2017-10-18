import { dependencyLoader } from '../util/dependency-loader';
import { DependencyLoader } from '@aboveyou00/capstone-router';

async function main() {
    (<any>window).dependencyLoader = dependencyLoader;
    createVisualizer(dependencyLoader);
    
    await dependencyLoader.loadSchema('router.json');
}

let visualizerTBody: HTMLTableSectionElement;

function createVisualizer(dependencyLoader: DependencyLoader) {
    let table = document.createElement('table');
    document.body.appendChild(table);
    
    let thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th>Name</th>
      <th>Dependencies</th>
      <th>Content</th>
      <th></th>
    </tr>`;
    table.appendChild(thead);
    
    let tbody = visualizerTBody = document.createElement('tbody');
    table.appendChild(tbody);
    
    console.log(dependencyLoader);
    console.log(dependencyLoader.events);
    dependencyLoader.events.subscribe(e => {
        let elements: HTMLCollectionOf<Element>;
        
        switch (e.type) {
        case 'schema-added':
            for (let added of e.added) {
                addVisualizerRow(dependencyLoader, added.name);
            }
            break;
            
        case 'dep-load-begin':
            elements = document.getElementsByClassName(`ref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                el.classList.add('loading');
            }
            elements = document.getElementsByClassName(`btnref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                if (!(el instanceof HTMLButtonElement)) continue;
                el.classList.add('loading');
                el.disabled = true;
            }
            break;
            
        case 'dep-load-end':
            elements = document.getElementsByClassName(`ref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                el.classList.remove('loading');
                el.classList.add('loaded');
            }
            elements = document.getElementsByClassName(`btnref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                if (!(el instanceof HTMLButtonElement)) continue;
                el.classList.remove('loading');
                el.classList.add('loaded');
                el.disabled = true;
            }
            elements = document.getElementsByClassName(`contentref-${e.name}`);
            for (let q = 0; q < elements.length; q++) {
                let el = elements[q];
                el.innerHTML = e.content;
            }
            break;
        }
    });
}

function addVisualizerRow(dependencyLoader: DependencyLoader, depName: string) {
    let schemaMap: Map<string, any> = (<any>dependencyLoader).schemaMap;
    
    let tr = document.createElement('tr');
    visualizerTBody.appendChild(tr);
    
    let td_name = document.createElement('td');
    td_name.classList.add(`ref`);
    td_name.classList.add(`ref-${depName}`);
    td_name.innerHTML = depName;
    tr.appendChild(td_name);
    
    let td_deps = document.createElement('td');
    td_deps.classList.add(`depsref`);
    let schema = schemaMap.get(depName);
    if (schema.deps && schema.deps.length) {
        td_deps.innerHTML = schema.deps.map(dep => `<span class="ref-${dep}">${dep}</span>`).join(', ');
    }
    else {
        td_deps.innerHTML = '<em>(None)</em>';
    }
    tr.appendChild(td_deps);
    
    let td_content = document.createElement('td');
    td_content.classList.add(`contentref`);
    td_content.classList.add(`contentref-${depName}`);
    tr.appendChild(td_content);
    
    let td_actions = document.createElement('td');
    td_actions.classList.add(`actionsref`);
    tr.appendChild(td_actions);
    
    let btn_load = document.createElement('button');
    btn_load.classList.add(`btnref-${depName}`);
    btn_load.addEventListener('click', () => dependencyLoader.get(depName));
    btn_load.innerHTML = 'Load';
    td_actions.appendChild(btn_load);
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
