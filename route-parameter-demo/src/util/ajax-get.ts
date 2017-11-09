

export function ajaxGet(url: string, headers?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (isResolved) throw new Error(`A request that has been resolved has changed after the fact!`);
            if (this.readyState == XMLHttpRequest.DONE) {
                isResolved = true;
                if (this.status == 200) {
                    let result = this.responseText;
                    try { result = JSON.parse(result); }
                    catch (e) {}
                    resolve(result);
                    return;
                }
                else {
                    reject(this.responseText);
                    return;
                }
            }
        };
        xhttp.open("GET", url, true);
        for (let key of Object.keys(headers || {})) {
            if (headers.hasOwnProperty(key)) {
                let value = headers[key];
                xhttp.setRequestHeader(key, value);
            }
        }
        xhttp.send();
    });
}
