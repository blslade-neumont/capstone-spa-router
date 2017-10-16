

declare namespace jasmine {
    interface Matchers<T> {

        //toBe
        toBeNear(num: number, epsilon: number): boolean;
    }
}
