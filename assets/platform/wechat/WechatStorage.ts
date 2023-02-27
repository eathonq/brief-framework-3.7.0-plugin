/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { sys } from 'cc';
import { IStorage, storageInit } from '../../base/Configuration';

let checkWechatGame = (): boolean => { return sys.platform == sys.Platform.WECHAT_GAME };

/** 微信存储 */
class WechatStorage implements IStorage {

    //#region IStorage 实现
    getItem(key: string, def = null): any {
        if (checkWechatGame()) {
            //@ts-ignore
            let value = wx.getStorageSync(key);
            //console.log(`-->wx get--${key} ,data-- ${data}`);
            if (!value) {
                if (def)
                    return def;
                else
                    return "";
            }
            return value;
        }

        return "";
    }

    setItem(key: string, data: any) {
        if (checkWechatGame()) {
            //@ts-ignore
            wx.setStorage({
                key: key, data: data, success(res) {
                    //console.log(`-->wx set--${key} ,data-- ${data}`);
                }
            })
        }
    }

    removeItem(key: string) {
        if (checkWechatGame()) {
            //@ts-ignore
            wx.removeStorage({
                key: key,
                success(res) {
                    //console.log(`-->wx remove--${key}`); 
                }
            });
        }
    }

    hasItem(key: string) {
        if (checkWechatGame()) {
            //@ts-ignore
            return wx.getStorage({ key: key, }) != undefined;
        }
        return false;
    }

    keys(): string[] {
        if (checkWechatGame()) {
            //@ts-ignore
            const res = wx.getStorageInfoSync();
            return res.keys;
        }
        return [];
    }

    clear(): void {
        if (checkWechatGame()) {
            //@ts-ignore
            wx.clearStorage();
        }
    }

    currentSize(): number {
        if (checkWechatGame()) {
            //@ts-ignore
            const res = wx.getStorageInfoSync();
            return res.currentSize;
        }
        return 0;
    }

    limitSize(): number {
        if (checkWechatGame()) {
            //@ts-ignore
            const res = wx.getStorageInfoSync();
            return res.limitSize;
        }
        return 0;
    }
    //#endregion

}

if (checkWechatGame()) {
    storageInit(new WechatStorage, 2);
}