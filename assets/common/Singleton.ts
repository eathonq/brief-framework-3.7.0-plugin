/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

/**
 * 单例模版方法
 * @example
 * class A extends Singleton<A>() {}
 */
export function Singleton<T>() {
    class SingletonT {
        protected constructor() { }
        private static _instance: SingletonT = null;
        static get instance(): T {
            if (SingletonT._instance == null) {
                SingletonT._instance = new this();
            }
            return SingletonT._instance as T;
        }
    }

    return SingletonT;
}