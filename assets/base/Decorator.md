# 装饰器

## demo
```ts
/**
 * 类装饰器
 * @example
 * \@decorateClass
 * export class MyClass {}
 */
export function decorateClass(target: any) {
    console.log(`class ${target.name}`);
}

/**
 * 方法装饰器
 * @example
 * class MyClass {
 *    \@decorateMethod
 *    myFunc() {}
 * }
 */
export function decorateMethod(target: any, key: string, descriptor: PropertyDescriptor) {
    console.log(`class ${target.name} func ${key}`);
    //console.log('descriptor', descriptor)  // 成员的属性描述符 Object.getOwnPropertyDescriptor
}

/**
 * 访问器装饰器
 * @example
 * class MyClass {
 *    private _a = 0;
 *    \@decorateAccessor
 *    get a() {
 *       return this._a;
 *    }
 * }
 */
export function decorateAccessor(target: any, key: string, descriptor: PropertyDescriptor) {
    console.log(`class ${target.name} accessor ${key}`);
    //console.log('descriptor', descriptor)  // 成员的属性描述符 Object.getOwnPropertyDescriptor
};

/**
 * 属性装饰器
 * @example
 * class MyClass {
 *    \@decorateProperty
 *    myData = 0;
 * }
 */
export function decorateProperty(target: any, key: string) {
    console.log(`class ${target.name} property ${key}`);
}

/**
 * 工厂装饰器（属性装饰器的工厂）
 * @example
 * class MyClass {
 *    \@decoratePropertyFactory('test')
 *    myData = 0;
 * } 
 */
export function decoratePropertyFactory(name: string) {
    return function (target: any, key: string) {
        console.log(`class ${target.name} property ${key} param ${name}`);
    }
}

// /**
//  * 参数装饰器
//  * @example
//  * class MyClass {
//  *    myFunc(@decorateParameter a: number) {}
//  * }
//  */
// export function decorateParameter(target: any, key: string, index: number) {
//     console.log('parameter');
//     //console.log('target', target);
//     console.log('key', key); // 方法名
//     console.log('index', index); // 参数索引
// }

// 完整示例
@decorateClass
class MyClass {
    @decorateMethod
    myFunc() { }

    private _a = 0;
    @decorateAccessor
    get a() {
        return this._a;
    }

    @decorateProperty
    myData = 0;

    @decorateFactory('test')
    myData2 = 0;
}
```