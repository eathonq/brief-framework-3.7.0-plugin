# brief-framework
![npm](https://img.shields.io/npm/v/cluster-shared-memory)
![node-current](https://img.shields.io/node/v/cluster-shared-memory)
![GitHub repo size](https://img.shields.io/github/repo-size/FinalZJY/cluster-shared-memory)

## 项目目录结构
```
├── assets              // 库资源文件夹
|   ├── cocos           // 基础组件
│   ├── common          // 常用基础
|   ├── expand          // 扩展库
│   ├── guide           // 引导管理
│   ├── i18n            // 多语言管理
│   ├── mvvm            // MVVM框架
│   ├── platform        // 平台代码管理
│   ├── uitest          // UI测试框架
```

### 技术文档
- [brief-framework](https://vangagh.gitbook.io/brief-framework-3.7.0/)

## ts-jest
### 安装相关环境
```
npm install --save-dev ts-jest @types/jest      // jest 测试框架
npm install --save-dev jest-environment-jsdom   // jsdom node环境下WebApi的js库
```

### 测试目录结构
```
├── assets                  // 库资源文件夹
├── test                    // 测试文件夹
│   ├── brief               // brief库文件夹
│   │   ├── StringFormat.test.ts    // 测试文件
├── jest.config.js          // jest配置文件
```

### 测试配置
#### jest.config.js
```js
module.exports = {
    preset: "ts-jest",         // 如果是 js 工程，则是 "jest" 
    testEnvironment: 'jsdom',  // 测试代码所运行的环境，jsdom 是一个在node环境下实现了 WebApi 的js库
    // verbose: true,          // 是否需要在测试时输出详细的测试情况
    rootDir: "./test",         // 测试文件所在的目录
    globals: {                 // 全局属性。如果你的被测试的代码中有使用、定义全局变量，那你应该在这里定义全局属性
        window: {},
        cc: {}
    }
};
```
#### tsconfig.json
```json
{
  /* Base configuration. Do not edit this field. */
  "extends": "./temp/tsconfig.cocos.json",

  /* Add your custom configuration here. */
  "compilerOptions": {
    "strict": false,
    "esModuleInterop": true // 允许使用 import * as fs from 'fs'
  }
}
```

### 测试文件 StringFormat.test.ts
```ts
import { describe, expect, test } from '@jest/globals';
import { stringFormat } from '../../assets/brief/common/StringFormat';

describe('StringFormat', () => {
    test('isNullOrWhiteSpace', () => {
        expect(stringFormat.isNullOrWhiteSpace('')).toBe(true);
        expect(stringFormat.isNullOrWhiteSpace(' ')).toBe(true);
        expect(stringFormat.isNullOrWhiteSpace('123')).toBe(false);
    });
});
```

### 运行测试 package.json
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

### vscode测试插件 Jest
- 在 vscode 扩展(Ctrl+Shift+X)中搜索 Jest 并安装。
- 在 vscode 测试插件启动测试。