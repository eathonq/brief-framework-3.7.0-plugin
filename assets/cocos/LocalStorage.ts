/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-03 14:58
 */

import { sys } from "cc";
import { IStorage, storageInit } from "../common/Configuration";

/** 本地存储 */
class LocalStorage implements IStorage {
    getItem(key: string, def?: any): any {
        let value = sys.localStorage.getItem(key);
        if (value === null) {
            if (def !== undefined)
                return def;
            else
                return null;
        }
        return value;
    }

    setItem(key: string, data: any): void {
        sys.localStorage.setItem(key, String(data));
    }

    removeItem(key: string): void {
        sys.localStorage.removeItem(key);
    }

    hasItem(key: string): boolean {
        return sys.localStorage.getItem(key) !== null;
    }

    keys(): string[] {
        let keyArray: string[] = [];
        for (let i = 0; i < sys.localStorage.length; i++) {
            keyArray.push(sys.localStorage.key(i));
        }
        return keyArray;
    }

    clear(): void {
        sys.localStorage.clear();
    }
}

storageInit(new LocalStorage, 0);