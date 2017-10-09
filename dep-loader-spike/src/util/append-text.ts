

export function appendText(...vals: any[]) {
    let body = document.getElementsByTagName('body')[0];
    let str = vals.map(String).join(' ');
    console.log(str);
    body.appendChild(new Text(str + '\r\n'));
}
