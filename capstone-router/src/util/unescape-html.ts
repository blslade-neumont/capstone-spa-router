

export function unescapeHtml(text: string) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(text, 'text/html');
    if (!doc) return text; //Fallback to old behavior
    return doc.documentElement.textContent;
}
