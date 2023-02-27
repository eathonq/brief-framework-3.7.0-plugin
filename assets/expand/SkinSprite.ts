/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-22 18:40
 */

import { _decorator, Component, Node, director } from 'cc';
import { EDITOR } from 'cc/env';
import { Configuration } from '../base/Configuration';
import { ResourcesUtil } from '../common/ResourcesUtil';
const { ccclass, help, menu, property } = _decorator;

const LOCAL_SKIN_KEY = 'local_skin'; // 本地皮肤 key
const SKIN_DATA_PATH = 'skin/skin'; // 皮肤数据路径

/**
 * 皮肤精灵
 */
@ccclass('SkinSprite')
@help("https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/expand/skinsprite")
@menu('Brief/Expand/SkinSprite')
export class SkinSprite extends Component {
    @property
    private _key: string = "";
    @property({
        tooltip: '皮肤数据标识',
    })
    get key() {
        return this._key;
    }
    private set key(value) {
        this._key = value;
    }

    protected onLoad(): void {
        SkinManager.instance.init();
    }

    private _path: string = "";
    protected onEnable(): void {
        let path = SkinManager.instance.getSkinPath(this.key);
        if (path != this._path) {
            this.resetSkin();
        }
    }

    /**
     * 刷新皮肤
     * @param path 皮肤路径
     */
    resetSkin() {
        this._path = SkinManager.instance.getSkinPath(this.key);
        ResourcesUtil.setSprite(this.node, this._path);
    }
}

export class SkinManager {
    //#region 
    private static _instance: SkinManager;
    public static get instance(): SkinManager {
        if (!SkinManager._instance) {
            SkinManager._instance = new SkinManager();
        }
        return SkinManager._instance;
    }
    //#endregion

    private _displayGroup: string = "";
    private _skinMap: Map<string, Map<string, string>> = new Map();

    private _isInit: boolean = false;
    /** 初始化 */
    async init() {
        if (this._isInit) return;
        this._isInit = true;

        if (EDITOR) return;

        this.loadKeyGroupData();
        await this.loadJsonSkinData(SKIN_DATA_PATH);
        this.refresh();
    }

    //#region 自定义皮肤分组
    /** 自定义皮肤分组 */
    private _keyGroupMap: Map<string, string> = new Map();
    /**
     * 设置皮肤分组
     * @param key 皮肤标识
     * @param group 皮肤分组
     */
    setKeyGroup(key: string, group: string) {
        this._keyGroupMap.set(key, group);
        this.saveKeyGroupData();
    }

    private loadKeyGroupData() {
        let localSkinGroup = Configuration.instance.getItem(LOCAL_SKIN_KEY);
        if (localSkinGroup) {
            this._keyGroupMap = new Map(Object.entries(localSkinGroup));
        }
    }

    private saveKeyGroupData() {
        Configuration.instance.setItem(LOCAL_SKIN_KEY, Object.fromEntries(this._keyGroupMap));
    }
    //#endregion

    /**
     * 获取皮肤
     * @param key 皮肤标识 
     * @param group 皮肤分组（默认为当前显示分组）
     */
    getSkinPath(key: string, group?: string) {
        // 优先使用keyGroupMap中的分组
        let keyGroup = this._keyGroupMap.get(key);
        if (keyGroup) {
            group = keyGroup;
        }

        // 获取皮肤路径
        let groupMap = this._skinMap.get(group || this._displayGroup);
        if (!groupMap) {
            return "";
        }
        return groupMap.get(key);
    }

    /**
     * 切换皮肤分组
     * @param group 皮肤分组
     */
    switchGroup(group: string) {
        this._displayGroup = group;

        const rootNodes = director.getScene()!.children;
        const allSkinSprites: SkinSprite[] = [];
        for (let i = 0; i < rootNodes.length; i++) {
            const skinSprites = rootNodes[i].getComponentsInChildren(SkinSprite);
            allSkinSprites.push(...skinSprites);
        }
        for (let i = 0; i < allSkinSprites.length; i++) {
            let sprite = allSkinSprites[i];
            if (!sprite.node.active) continue;
            sprite.resetSkin();
        }
    }

    private refresh() {
        if (this._displayGroup == "") {
            this._displayGroup = this._skinMap.keys().next().value;
        }

        this.switchGroup(this._displayGroup);
    }

    /**
     * 加载皮肤数据
     * @param path json路径（不包含后缀，相对路径从resources子目录算起）
     */
    private async loadJsonSkinData(path: string) {
        let data = await ResourcesUtil.getJson<SkinData>(path);
        if (data && data.groups && data.default) {
            this._skinMap.clear();
            data.groups.forEach((group: SkinGroup) => {
                let groupMap = new Map();
                this._skinMap.set(group.name, groupMap);
                for (let key in group.data) {
                    groupMap.set(key, group.data[key]);
                }
            });

            this._displayGroup = data.default;
        }
    }
}

type SkinGroup = {
    /** 皮肤分组名称 */
    name: string;
    /** 皮肤分组数据 */
    data: {
        [key: string]: string;
    };
}

/** 皮肤数据 */
type SkinData = {
    /** 默认皮肤分组 */
    default: string;
    /** 皮肤分组列表数据 */
    groups: SkinGroup[];
}