

export function cache<T>(action: (path: string) => Promise<T>) {
    let resultMap = new Map<string, T>();
    return async function(arg: string) {
        if (resultMap.has(arg)) return resultMap.get(arg);
        let result = await action(arg);
        resultMap.set(arg, result);
        return result;
    }
}
