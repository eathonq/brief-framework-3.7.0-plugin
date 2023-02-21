/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-02 17:15
 */

/**
 * object 数据转换成 http 请求参数字符串
 * @param obj object 数据
 * @returns http 请求参数字符串
 * @example
 * let obj = { a: 1, b: 2, c: 3 };
 * let str = objectToKeyValue(obj);
 * console.log(str); // a=1&b=2&c=3
 */
export let objectToKeyValue = (obj: any) => {
    let str = "";
    for (let key in obj) {
        if (obj[key] != null) {
            str += key + "=" + obj[key] + "&";
        }
    }
    return str.substring(0, str.length - 1);
}

/**
 * 打开本地文件
 * @param callback 回调函数 
 */
export let openLocalFile = (callback: (file: File) => void) => {
    let inputEl: HTMLInputElement = <HTMLInputElement>document.getElementById('file_input');// 类型转行 HTMLInputElement ，方便下面的 inputEl.files 调用
    if (!inputEl) {
        // 只创建一次
        inputEl = document.createElement('input');
        inputEl.id = 'file_input';
        inputEl.setAttribute('id', 'file_input');
        inputEl.setAttribute('type', 'file');
        inputEl.setAttribute('class', 'fileToUpload');
        inputEl.style.opacity = '0';// 不可见
        inputEl.style.position = 'absolute';
        document.body.appendChild(inputEl);
    }
    // 这个和 inputEl.onchange 的效果是一样的，2选1就可以了
    // inputEl.addEventListener('change', (event) => {
    //    console.log('xxx onchange1', event, inputEl.value);
    // });
    inputEl.onchange = (event) => {
        // console.log('xxx onchange2', event, inputEl.files);
        let files = inputEl.files;
        if (files && files.length > 0) {
            var file = files[0];
            if (callback) callback(file);
        }
    }
    inputEl.click();// 模拟点击，触发文件选择弹出框，据说有的浏览器不支持，chrome是没问题的
}

// 加载远程资源和设备资源
// https://docs.cocos.com/creator/manual/zh/asset/dynamic-load-resources.html?h=%E8%B5%84%E6%BA%90#%E5%8A%A0%E8%BD%BD%E8%BF%9C%E7%A8%8B%E8%B5%84%E6%BA%90%E5%92%8C%E8%AE%BE%E5%A4%87%E8%B5%84%E6%BA%90

// 参考
// https://blog.csdn.net/grimraider/article/details/106378809

class HttpHelper {

    static isNative = false;

    /**
     * get请求
     * @param url 请求地址 
     * @param callback 回调函数
     */
    static get(url: string, callback: (response: string, errStatus?: number) => void) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        // xhr.onprogress = function () {
        //     console.log('LOADING', xhr.readyState); // readyState 为 3
        // };
        // xhr.onload = function () {
        //     console.log('DONE', xhr.readyState); // readyState 为 4
        // };
        xhr.onreadystatechange = function () {
            // xhr.readyState
            // 0: request not initialized
            // 1: server connection established
            // 2: request received
            // 3: processing request
            // 4: request finished and response is ready

            // xhr.status
            // 200: "OK"
            // 403: "Forbidden"
            // 404: "Not Found"
            // 500: "Internal Server Error"

            if (xhr.readyState == 4 && xhr.status == 200) {
                callback(xhr.responseText);
            }
            else if (xhr.status != 200) {
                callback(xhr.responseText, xhr.status);
            }
        }
        xhr.timeout = 5000;
        xhr.send();
    }

    /**
     * post请求
     * @param url 请求地址
     * @param data 请求数据, 'a=1&b=2&c=3' 或者 {a:1, b:2, c:3}
     * @param callback 回调函数
     */
    static post(url: string, data: string | object, callback: (response: string, errStatus?: number) => void) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        if (this.isNative) {
            xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
            xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET, POST');
            xhr.setRequestHeader('Access-Control-Allow-Headers', 'x-requested-with,content-type');
            xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                callback(xhr.responseText);
            }
            else if (xhr.status != 200) {
                callback(xhr.responseText, xhr.status);
            }
        }
        xhr.timeout = 5000;

        if (typeof data == "object") {
            xhr.send(objectToKeyValue(data));
        }
        else {
            xhr.send(data);
        }
    }

    /**
     * 文件上传
     * @param url 请求地址 
     * @param file 文件
     * @param callback 回调函数
     */
    static upload(url: string, file: File, callback: (response: string, errStatus?: number) => void) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                callback(xhr.responseText);
            }
            else if (xhr.status != 200) {
                callback(xhr.responseText, xhr.status);
            }
        }

        let formData: FormData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
    }

    /**
     * get请求
     * @param url 请求地址 
     * @returns Promise<{ response: string, errStatus?: number }>
     */
    static async getAsync(url: string) {
        return new Promise<{ response: string, errStatus?: number }>((resolve, reject) => {
            this.get(url, (response: string, errStatus?: number) => {
                resolve({ response, errStatus });
            });
        });
    }

    /**
     * post请求
     * @param url 请求地址
     * @param data 请求数据, 'a=1&b=2&c=3' 或者 {a:1, b:2, c:3}
     * @returns Promise<{ response: string, errStatus?: number }>
     */
    static async postAsync(url: string, data: string | object) {
        return new Promise<{ response: string, errStatus?: number }>((resolve, reject) => {
            this.post(url, data, (response: string, errStatus?: number) => {
                resolve({ response, errStatus });
            });
        });
    }

    /**
     * 文件上传
     * @param url 请求地址
     * @param file 文件
     * @returns Promise<{ response: string, errStatus?: number }>
     */
    static async uploadAsync(url: string, file: File) {
        return new Promise<{ response: string, errStatus?: number }>((resolve, reject) => {
            this.upload(url, file, (response: string, errStatus?: number) => {
                resolve({ response, errStatus });
            });
        });
    }

    /**
     * 下载文件
     * @param url 请求地址
     * @param callback 回调函数
     * @param responseType 返回类型
     */
    static download(url: string, callback: (response: string, errStatus?: number) => void, responseType: XMLHttpRequestResponseType = "text") {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = responseType;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                callback(xhr.response);
            }
            else if (xhr.status != 200) {
                callback(xhr.response, xhr.status);
            }
        }
        xhr.timeout = 5000;
        xhr.send();
    }

    /**
     * 下载文件
     * @param url 请求地址
     * @param responseType 返回类型 
     * @returns Promise<{ response: string, errStatus?: number }>
     */
    static async downloadAsync(url: string, responseType: XMLHttpRequestResponseType = "text") {
        return new Promise<{ response: string, errStatus?: number }>((resolve, reject) => {
            this.download(url, (response: string, errStatus?: number) => {
                resolve({ response, errStatus });
            }, responseType);
        });
    }
}

/** http 工具 */
export let http = HttpHelper;

/**
 * websocket item
 */
export class WebSocketItem {
    private _ws: WebSocket;
    private _url: string;
    private _key: string;
    get ws(): WebSocket {
        return this._ws;
    }
    get url(): string {
        return this._url;
    }
    get key(): string {
        return this._key;
    }
    private _onMessage: (event: MessageEvent) => void;
    private _onOpen: (event: Event) => void;
    private _onClose: (event: Event) => void;
    private _onError: (event: Event) => void;

    constructor(url: string, key?: string) {
        this._url = url;
        this._key = key;
    }

    open(onOpen: (event: Event) => void, onClose: (event: Event) => void, onMessage: (event: MessageEvent) => void, onError: (event: Event) => void) {
        this._onOpen = onOpen;
        this._onClose = onClose;
        this._onMessage = onMessage;
        this._onError = onError;

        this._ws = new WebSocket(this._url);
        this._ws.onopen = this._onOpen;
        this._ws.onclose = this._onClose;
        this._ws.onmessage = this._onMessage;
        this._ws.onerror = this._onError;
    }

    send(data: string) {
        this._ws.send(data);
    }

    close() {
        this._ws.close();
    }
}