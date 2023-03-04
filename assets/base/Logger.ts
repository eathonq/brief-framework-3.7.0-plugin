/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-28 17:55
 */

/** 日志标签 */
enum LoggerTags {
    /** 调试日志 */
    DEBUG = 1 << 0,
    /** 信息日志 */
    INFO = 1 << 1,
    /** 警告日志 */
    WARN = 1 << 2,
    /** 错误日志 */
    ERROR = 1 << 3,
    /** 断言日志 */
    ASSERT = 1 << 4,
    /** 颜色日志 */
    COLOR = 1 << 5,
    /** 所有日志 */
    ALL = 0xffffffff
}

/** 日志颜色 */
enum LoggerColors {
    /** 灰色 */
    GRAY = "color:gray",
    /** 蓝色 */
    BLUE = "color:blue",
    /** 紫色 */
    PURPLE = "color:purple",
    /** 绿色 */
    GREEN = "color:green",
    /** 橙色 */
    ORANGE = "color:orange",
    /** 红色 */
    RED = "color:red",
    /** 黄色 */
    YELLOW = "color:yellow",
    /** 白色 */
    WHITE = "color:white",
}

/** 控制台日志输出类 */
class Logger {
    /** 日志标签 */
    static Tags = LoggerTags;

    /** 默认颜色 */
    static Colors = LoggerColors;

    /** 显示的日志标签 */
    private static _tags: number =
        LoggerTags.DEBUG |
        LoggerTags.INFO |
        LoggerTags.WARN |
        LoggerTags.ERROR |
        LoggerTags.COLOR;

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

    static debug(...args: any[]) {
        this.print(LoggerTags.DEBUG, LoggerColors.GRAY, ...args);
    }

    static info(...args: any[]) {
        this.print(LoggerTags.INFO, LoggerColors.BLUE, ...args);
    }

    static warn(...args: any[]) {
        this.print(LoggerTags.WARN, LoggerColors.ORANGE, ...args);
    }

    static error(...args: any[]) {
        this.print(LoggerTags.ERROR, LoggerColors.RED, ...args);
    }

    static assert(...args: any[]) {
        this.print(LoggerTags.ASSERT, LoggerColors.PURPLE, ...args);
    }

    static gray(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.GRAY, ...args);
    }

    static blue(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.BLUE, ...args);
    }

    static orange(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.ORANGE, ...args);
    }

    static red(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.RED, ...args);
    }

    static purple(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.PURPLE, ...args);
    }

    static green(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.GREEN, ...args);
    }

    static yellow(...args: any[]) {
        this.print(LoggerTags.COLOR, LoggerColors.YELLOW, ...args);
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
        if (tag == LoggerTags.COLOR) return "";
        const tags = Object.keys(LoggerTags);
        for (let i = 0; i < tags.length; i++) {
            if (LoggerTags[tags[i]] == tag) {
                return `[${tags[i].toLocaleLowerCase()}]`;
            }
        }
        return `[${tag}]`;
    }

    /**
     * 获取调用栈信息
     * @param level 查看层级，默认为2，即调用该方法的上一层
     * @param separator 分隔符，默认为" -> "
     * @returns 返回调用栈层级信息
     */
    static stack(level: number = 2, separator: string = " -> ") {
        let stack = new Error().stack;
        let arr = stack.split("\n");
        let result = [];
        for (let i = 0; i < arr.length; i++) {
            let arr_0 = arr[i].split("at ");
            if (arr_0.length > 1) {
                let arr_1 = arr_0[1].split(" ");
                if (arr_1.length > 0) {
                    result.push(arr_1[0]);
                }
            }
        }
    
        let s = result.slice(1, level + 1).join(separator);
    
        return s;
    }
}

/**
 * 控制台日志输出类
 */
export const logger = Logger;