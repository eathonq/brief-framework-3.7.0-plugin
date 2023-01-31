/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { Node } from 'cc';

/** 定位器 */
export class Locator {
    /**
     * 定位解析
     * @param locator 定位地址
     * @returns {Array} 名称数组
     */
    private static parse(locator: string): Array<{ symbol: string, name: string }> {
        //使用正则表达示分隔名字
        let names = locator.split(/[.,//,>,#]/g);
        let segments = names.map(function (name) {
            let index = locator.indexOf(name);
            let symbol = locator[index - 1] || '>';
            return { symbol: symbol, name: name.trim() };
        });
        return segments;
    }

    /** 定位超时时间10s */
    static timeout: number = 10 * 1000;
    private static locating: boolean = false;
    private static startTime: number = 0;
    /**
     * 定位节点(支持超时定位)
     * @param root 根节点
     * @param locator 定位地址
     * @returns {Promise<Node>} 节点
     * @example
     * let node = await Locator.locateNode(this.node, 'Content/Label'); // 等价于 this.node.getChildByName('Content').getChildByName('Label')
     * let node = await Locator.locateNode(this.node, 'Content>Label2'); // 等价于 this.node.getChildByName('Content').getChildByName('Item').getChildByName('Label2')
     */
    static async locateNode(root: Node | any, locator: string): Promise<Node> {
        if (!this.locating) {
            this.startTime = Date.now();
            this.locating = true;
        }

        let segments = this.parse(locator);
        let child: Node;
        let node = root;

        for (let i = 0; i < segments.length; i++) {
            let item = segments[i];
            switch (item.symbol) {
                case '/':
                    child = node.getChildByName(item.name);
                    break;
                case '.':
                    child = node[item.name];
                    break;
                case '>':
                    child = this.seekNodeByName(node, item.name);
                    break;
                case '#':
                    child = this.seekNodeByTag(node, item.name);
                    break;
            }

            if (!child) {
                node = null;
                break;
            }
            node = child;
        }


        // 正常定位
        // return new Promise<Node>((resolve, reject) => {
        //     this.locating = true;
        //     resolve(node);
        // });

        // 超时定位
        if (node && node.active) {
            return new Promise<Node>((resolve, reject) => {
                this.locating = false;
                resolve(node);
            });
        }
        else {
            if (Date.now() - this.startTime > this.timeout) {
                console.log('Locator timeout ' + locator);
                return null;
            }
            return await new Promise((resolve, reject) => {
                let timer = setTimeout(() => {
                    clearTimeout(timer);
                    resolve(this.locateNode(root, locator));
                }, 100);
            });
        }
    }

    /**
     * 寻找节点
     * @param root 根节点 
     * @param name 节点名称
     * @returns Node 节点
     */
    static seekNodeByName(root: Node, name: string): Node {
        if (root.name == name) {
            return root;
        }

        let children = root.children;
        for (let i = 0; i < children.length; i++) {
            let node = this.seekNodeByName(children[i], name);
            if (node) {
                return node;
            }
        }
    }

    /**
     * 寻找节点
     * @param root 根节点
     * @param tag 节点标签
     * @returns Node 节点
     */
    static seekNodeByTag(root: Node, tag: string): Node {
        if (root[tag]) {
            return root;
        }

        let children = root.children;
        for (let i = 0; i < children.length; i++) {
            let node = this.seekNodeByTag(children[i], tag);
            if (node) {
                return node;
            }
        }
    }

    /**
     * 获取节点全路径
     * @param node 
     * @returns 节点全路径
     */
    static getNodeFullPath(node: Node): string {
        let array = [];
        let temp = node;
        do {
            array.unshift(temp.name);
            temp = temp.parent;
        } while (temp && temp.name !== 'Canvas')

        // let fullPath = array.join('/');
        // // 如果头部是 New Node/ 则去掉
        // if (fullPath.indexOf('New Node/') == 0) {
        //     fullPath = fullPath.replace('New Node/', '');
        // }
        // return fullPath;

        return array.join('/');
    }
}