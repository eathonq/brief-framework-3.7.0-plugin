/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-03-02 8:56
 */

import { _decorator, Component, Enum, CCClass } from "cc";
import { EDITOR } from "cc/env";
import { reactive } from "../base/ReactiveObserve";
import { Locator } from "../common/Locator";
import { DataContext } from "./DataContext";
import { decoratorData } from "./DecoratorData";

const { ccclass, help, executeInEditMode, menu, property } = _decorator;

@ccclass("brief.ViewModel")
@help("https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/mvvm/viewmodel")
@executeInEditMode
@menu("Brief/MVVM/ViewModel")
export class ViewModel extends DataContext {

    @property
    protected _viewModelName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get viewModelName() {
        return this._viewModelName;
    }

    protected _viewModelEnums: { name: string, value: number }[] = [];
    private _viewModel = 0;
    @property({
        type: Enum({}),
        tooltip: "视图模型",
    })
    get viewModel() {
        return this._viewModel;
    }
    set viewModel(value) {
        this._viewModel = value;
        if (this._viewModelEnums[value]) {
            this._viewModelName = this._viewModelEnums[value].name;
            this.selectedViewModel();
        }
    }

    //#region EDITOR
    onRestore() {
        this.checkEditorComponent();
        this.bindingType = this._viewModelName;
        this.path = this.bindingType;
    }

    protected checkEditorComponent() {
        this.updateEditorViewModelEnums();
    }

    private updateEditorViewModelEnums() {
        // 设置绑定属性
        const newEnums = [];
        let dataList = decoratorData.getViewModelList(this.node.name);
        if (dataList) {
            for (let i = 0; i < dataList.length; i++) {
                const data = dataList[i];
                newEnums.push({ name: data.name, value: i });
            }
        }
        // 更新绑定数据枚举
        this._viewModelEnums = newEnums;
        CCClass.Attr.setClassAttr(this, "viewModel", "enumList", newEnums);

        // 如果绑定数据枚举为空，则警告
        if (newEnums.length == 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ViewModel 绑定未找到合适的数据`);
        }

        // 设置绑定数据枚举默认值
        if (this._viewModelName !== "") {
            let findIndex = newEnums.findIndex((item) => { return item.name === this._viewModelName });
            if (findIndex !== -1) {
                this.viewModel = findIndex;
                return;
            }
        }
        this.viewModel = 0;
    }

    private selectedViewModel() {
        this.bindingType = this._viewModelName;
        this.path = this.bindingType;
    }

    //#endregion

    protected onLoad() {
        this.checkEditorComponent();
        this.isRoot = true;
        this.bindingType = this._viewModelName;
        this.path = this.bindingType;
        this.parent = this;

        super.onLoad();

        if (EDITOR) return;

        let data = viewModelManager.add(this._viewModelName, this.constructor.name);
        if (!data) {
            console.error(`ViewModel: ${this.constructor.name} onLoad data is null`);
            return;
        }

        this._data = data;
        this._data.onLoad?.call(this._data);
    }

    protected onDestroy() {
        super.onDestroy();
        if (EDITOR) return;

        if (this._data) {
            this._data.onDestroy?.call(this._data);
            this._data = null;
            viewModelManager.remove(this._viewModelName, this.constructor.name);
        }
    }
}

class ViewModelManager {
    private _dataMap: Map<string, { v: string, vm: any }[]> = new Map();

    add(name: string, v: string) {
        let vm = decoratorData.createViewModel(name);
        if (!vm) return null;

        let list = this._dataMap.get(name);
        if (!list) {
            list = [];
            this._dataMap.set(name, list);
        }
        let data = reactive(vm);
        list.push({ v, vm: data });
        return data;
    }

    remove(name: string, v: string) {
        let list = this._dataMap.get(name);
        if (!list) return;
        let index = list.findIndex(item => item.v == v);
        if (index < 0) return;
        list.splice(index, 1);
    }

    /**
     * 获取视图模型数据
     * @param name 视图模型
     * @param view 指定视图名称
     * @returns 
     */
    getWithName(name: string, view?: string): any {
        let list = this._dataMap.get(name);
        if (!list) return null;
        if (!view) {
            return list[0].vm;
        }
        else {
            let item = list.find(item => item.v == view);
            if (!item) return null;
            return item.vm;
        }
    }

    /**
     * 获取视图模型数据
     * @param constructor 视图模型构造函数
     * @param view 指定视图名称
     * @returns 
     */
    get<T>(constructor: { new(): T; }, view?: string): T {
        let name = constructor.name;
        let list = this._dataMap.get(name);
        if (!list) return null;
        if (!view) {
            return list[0].vm as T;
        }
        else {
            let item = list.find(item => item.v == view);
            if (!item) return null;
            return item.vm as T;
        }
    }
}

/** 视图模型管理器 */
export const viewModelManager = new ViewModelManager();
