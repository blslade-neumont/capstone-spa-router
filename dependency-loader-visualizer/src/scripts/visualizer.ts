import { dependencyLoader } from '../util/dependency-loader';
import { DependencyLoader } from '@aboveyou00/capstone-router';

async function main() {
    console.log(`Doing something! Here's the dependency loader:`, dependencyLoader);
    
    await dependencyLoader.loadSchema('router.json');
    
    createVisualizer(dependencyLoader);
}

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
    
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);
    
    let schemaMap: Map<string, any> = (<any>dependencyLoader).schemaMap;
    for (let key of schemaMap.keys()) {
        let tr = document.createElement('tr');
        tbody.appendChild(tr);
        
        let td_name = document.createElement('td');
        td_name.classList.add(`ref`);
        td_name.classList.add(`ref-${key}`);
        td_name.innerHTML = key;
        tr.appendChild(td_name);
        
        let td_deps = document.createElement('td');
        td_deps.classList.add(`depsref`);
        let schema = schemaMap.get(key);
        if (schema.deps && schema.deps.length) {
            td_deps.innerHTML = schema.deps.map(dep => `<span class="ref-${dep}">${dep}</span>`).join(', ');
        }
        else {
            td_deps.innerHTML = '<em>(None)</em>';
        }
        tr.appendChild(td_deps);
        
        let td_content = document.createElement('td');
        td_content.classList.add(`contentref`);
        td_content.classList.add(`contentref-${key}`);
        tr.appendChild(td_content);
        
        let td_actions = document.createElement('td');
        td_actions.classList.add(`actionsref`);
        tr.appendChild(td_actions);
        
        let btn_load = document.createElement('button');
        btn_load.classList.add(`btnref-${key}`);
        btn_load.addEventListener('click', () => dependencyLoader.get(key));
        btn_load.innerHTML = 'Load';
        td_actions.appendChild(btn_load);
    }
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
