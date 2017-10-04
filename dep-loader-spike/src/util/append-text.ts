

export function appendText(text: string) {
    let body = document.getElementsByTagName('body')[0];
    body.appendChild(new Text(text));
}
