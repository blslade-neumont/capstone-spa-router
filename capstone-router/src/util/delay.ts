

export function delay(millis: number): Promise<void> {
    if (typeof millis !== 'number') throw new Error(`${millis} is not a number!`);
    return new Promise(resolve => {
        setTimeout(resolve, millis);
    });
};
