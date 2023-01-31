/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { EDITOR } from 'cc/env';
import { DataContext } from './DataContext';
import { Observable } from './Observable';

/**
 * 视图模型基类
 * @info UI 组件绑定数据源
 * 提供 ViewModelBase 间互相通信交互功能
 */
export class ViewModelBase extends DataContext {
    /**
     * 子类重写此方法需要调用 super.onLoad()
     * @param globalObject 全局数据源
     * @example
     * protected onLoad() {
     *    super.onLoad();
     *    if(EDITOR) return;
     *    // TODO
     * }
     */
    protected onLoad(globalObject?: any) {
        this.isRoot = true;
        this.path = this.constructor.name;
        this._context = this;

        // 全局数据源重置 path
        if(globalObject) this.path = globalObject.constructor.name;

        super.onLoad();
        if (EDITOR) return;

        if (!globalObject) {
            let observable = new Observable();
            observable.init(this.path, this);
            this.observable = observable;
        }
        else {
            let observable = globalMap.get(this.path);
            if (!observable) {
                observable = new Observable();
                observable.init(this.path, globalObject);
                globalMap.set(this.path, observable);
            }
            this.observable = observable;
        }
    }

    // /**
    //  * 子类重写此方法需要调用 super.onDestroy()
    //  * @example
    //  * protected onDestroy() {
    //  *    super.onDestroy();
    //  *    if(EDITOR) return;
    //  *    // TODO
    //  * }
    //  */
    // protected onDestroy() {
    //     if (EDITOR) return;
    //     this.observable?.clean();
    // }
}

const globalMap = new Map<string, Observable>();