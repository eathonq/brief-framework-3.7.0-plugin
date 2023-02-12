/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 13:06
 */

import { EDITOR } from 'cc/env';
import { reactive } from '../common/ReactiveObserve';
import { DataContext } from './DataContext';

/**
 * 视图模型基类
 * @info UI 组件绑定数据源
 * 提供 ViewModelBase 间互相通信交互功能
 */
export class ViewModelBase extends DataContext {
    /**
     * 子类重写此方法需要调用 super.onLoad()
     * @param data 绑定数据源
     * @example
     * protected onLoad() {
     *    super.onLoad();
     *    if(EDITOR) return;
     *    // TODO
     * }
     */
    protected onLoad(data?: any) {
        if (!data) {
            console.error(`ViewModelBase: ${this.path} data is null`);
            return;
        }

        this._isRoot = true;
        this.path = data.constructor.name;
        this.parent = this;
        
        super.onLoad();

        if (EDITOR) return;

        this._data = reactive(data);
    }
}