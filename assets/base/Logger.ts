/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-28 17:55
 */

/** 控制台日志输出类 */
class Logger {
    /** 日志标签 */
    static get TAGS() {
        return {
            /** 调试日志 */
            DEBUG: 1 << 0,
            /** 信息日志 */
            INFO: 1 << 1,
            /** 警告日志 */
            WARN: 1 << 2,
            /** 错误日志 */
            ERROR: 1 << 3,
            /** 断言日志 */
            ASSERT: 1 << 4,
            /** 颜色日志 */
            COLOR: 1 << 5,
            /** 所有日志 */
            ALL: 0xffffffff
        }
    }

    /** 显示的日志标签 */
    private static _tags: number =
        this.TAGS.DEBUG |
        this.TAGS.INFO |
        this.TAGS.WARN |
        this.TAGS.ERROR |
        this.TAGS.COLOR;

    /**
     * 设置显示的日志标签
     * @param tags 日志标签
     * @example
     * logger.tags = logger.TAGS.DEBUG | logger.TAGS.INFO;
     */
    static set tags(tags: number) {
        this._tags = tags;
    }

    private static isTag(tag: number) {
        return (this._tags & tag) !== 0;
    }

    /**
     * 开始日志计时
     * @param label 标签
     * @example
     * logger.time();
     * // do something
     * logger.timeEnd();
     * // count time: 100ms
     */
    static time(label: string = "count time") {
        console.time(label);
    }

    /**
     * 结束日志计时，并打印持续时间
     * @param label 标签
     * @example
     * logger.time();
     * // do something
     * logger.timeEnd();
     * // count time: 100ms
     */
    static timeEnd(label: string = "count time") {
        console.timeEnd(label);
    }

    /**
     * 打印表格日志
     * @param data 
     * @param columns
     * @example
     * logger.table([{a:1, b:2}, {a:3, b:4}]);
     * // ┌─────────┬─────┬─────┐
     * // │ (index) │  a  │  b  │
     * // ├─────────┼─────┼─────┤
     * // │    0    │  1  │  2  │
     * // │    1    │  3  │  4  │
     * // └─────────┴─────┴─────┘ 
     */
    static table(data: any, columns?: string[]) {
        console.table(data, columns);
    }

    /** 默认颜色 */
    static get COLORS() {
        return {
            /** 灰色 */
            GRAY: "color:gray",
            /** 蓝色 */
            BLUE: "color:#3a5fcd",
            /** 橙色 */
            ORANGE: "color:orange",
            /** 红色 */
            RED: "color:red",
            /** 紫色 */
            PURPLE: "color:purple",
            /** 绿色 */
            GREEN: "color:green",
            /** 黄色 */
            YELLOW: "color:yellow",
        }
    }

    static debug(...args: any[]) {
        this.print(this.TAGS.DEBUG, this.COLORS.GRAY, ...args);
    }

    static info(...args: any[]) {
        this.print(this.TAGS.INFO, this.COLORS.BLUE, ...args);
    }

    static warn(...args: any[]) {
        this.print(this.TAGS.WARN, this.COLORS.ORANGE, ...args);
    }

    static error(...args: any[]) {
        this.print(this.TAGS.ERROR, this.COLORS.RED, ...args);
    }

    static assert(...args: any[]) {
        this.print(this.TAGS.ASSERT, this.COLORS.PURPLE, ...args);
    }

    static gray(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.GRAY, ...args);
    }

    static blue(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.BLUE, ...args);
    }

    static orange(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.ORANGE, ...args);
    }

    static red(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.RED, ...args);
    }

    static purple(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.PURPLE, ...args);
    }

    static green(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.GREEN, ...args);
    }

    static yellow(...args: any[]) {
        this.print(this.TAGS.COLOR, this.COLORS.YELLOW, ...args);
    }

    static print(tag: number, color: string, ...args: any[]) {
        if (this.isTag(tag)) {
            let formate = "%s";
            let isObject = false;
            for (let i = 0; i < args.length; i++) {
                if (typeof args[i] == "object") {
                    isObject = true;
                    formate += " %o";
                }
                else {
                    formate += " %s";
                }
            }
            if (isObject) {
                console.log.call(console, formate, `${this.getDateString()}${this.getTagName(tag)}`, ...args);
            }
            else {
                formate = `%c${formate}`;
                console.log.call(console, formate, `${color}`, `${this.getDateString()}${this.getTagName(tag)}`, ...args);
            }
        }
    }

    private static getDateString(): string {
        let d = new Date();
        let str = d.getHours().toString();
        let timeStr = "";
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = d.getMinutes().toString();
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = d.getSeconds().toString();
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = d.getMilliseconds().toString();
        if (str.length == 1) str = "00" + str;
        if (str.length == 2) str = "0" + str;
        timeStr += str;

        timeStr = "[" + timeStr + "]";
        return timeStr;
    }

    private static getTagName(tag: number): string {
        if (tag == this.TAGS.COLOR) return "";
        const tags = Object.keys(this.TAGS);
        for (let i = 0; i < tags.length; i++) {
            if (this.TAGS[tags[i]] == tag) {
                return `[${tags[i].toLocaleLowerCase()}]`;
            }
        }
        return `[${tag}]`;
    }
}

/**
 * 控制台日志输出类
 */
export const logger = Logger;