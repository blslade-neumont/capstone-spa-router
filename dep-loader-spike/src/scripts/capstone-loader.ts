

let scripts: string[] = [
    'scripts/lazy1.bundle.js',
    'scripts/lazy2.bundle.js',
    'scripts/lazy3.bundle.js'
];
scripts.forEach(src => {
    let script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
});
