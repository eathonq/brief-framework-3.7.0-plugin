/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-04-19 16:54
 */

/** 随机数工具 */
export class RandomUtil {
    /**
     * 获取随机整数
     * @param min 最小值
     * @param max 最大值
     * @param type 默认2，类型 0:(min, max) 1:[min, max) 2:[min, max] 3:(min, max]
     * @returns number
     * @example
     * getRandom(1, 10, 0) // (1, 10) : 1 < x < 10
     * getRandom(1, 10, 1) // [1, 10) : 1 <= x < 10
     * getRandom(1, 10, 2) // [1, 10] : 1 <= x <= 10
     * getRandom(1, 10, 3) // (1, 10] : 1 < x <= 10
     */
    static random(min: number, max: number, type = 2): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        switch (type) {
            case 0:
                // (min, max)
                return Math.floor(Math.random() * (max - min - 1)) + min + 1;
            case 1:
                // [min, max)
                return Math.floor(Math.random() * (max - min)) + min;
            case 2:
                // [min, max]
                return Math.floor(Math.random() * (max - min + 1)) + min;
            case 3:
                // (min, max]
                return Math.floor(Math.random() * (max - min)) + min + 1;
            default:
                // [min, max]
                return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }

    /**
     * 获取随机整数列表
     * @param min 最小值
     * @param max 最大值
     * @param count 随机数个数
     * @returns number[]
     */
    static randomList(min: number, max: number, count: number): number[] {
        var list: number[] = [];
        for (var i = 0; i < count; i++) {
            list.push(this.random(min, max));
        }
        return list;
    }

    /**
     * 获取随机整数列表，列表元素和为指定值
     * @param sum 和
     * @param count 随机数个数
     * @param min 最小值，默认0，条件min <= sum / count
     * @param max 最大值，默认sun，条件max >= sum / count
     * @returns number[]
     */
    static randomListBySum(sum: number, count: number, min?: number, max?: number): number[] {
        // 最小值矫正
        min = min || 0;
        if (min * count > sum) {
            min = Math.floor(sum / count);
        }
        // 最大值矫正
        max = max || sum;
        if (max * count < sum) {
            max = Math.ceil(sum / count);
        }

        let list: number[] = [];
        let residue = sum;
        let random = 0;
        let currentMin = 0;
        let currentMax = 0;
        for (let i = 0; i < count; i++) {
            if (i == count - 1) {
                random = residue;
            } else {
                // 最小值矫正
                currentMin = Math.max(min, residue - max * (count - i - 1));
                // 最大值矫正
                currentMax = Math.min(max, residue - min * (count - i - 1));
                random = this.random(currentMin, currentMax);
            }
            list.push(random);
            residue -= random;
        }

        // 随机打乱
        for (let i = 0; i < count; i++) {
            random = this.random(0, count, 1);
            [list[i], list[random]] = [list[random], list[i]];
        }

        return list;
    }

    /**
     * 获取随机打乱的列表
     * @param array 列表数据
     * @returns 
     */
    static randomArray(array: Array<any>): Array<any> {
        let tmpArray = array.concat();
        let resultArray = new Array<any>();
        while (tmpArray.length > 0) {
            let index = Math.floor(Math.random() * tmpArray.length);
            resultArray.push(tmpArray[index]);
            tmpArray.splice(index, 1);
        }
        return resultArray;
    }

    /**
     * 获取随机打乱的列表，指定个数
     * @param array 列表数据
     * @param count 指定个数
     * @returns 
     */
    static randomArrayByCount(array: Array<any>, count: number): Array<any> {
        let tmpArray = array.concat();
        let resultArray = new Array<any>();
        while (resultArray.length < count) {
            let index = Math.floor(Math.random() * tmpArray.length);
            resultArray.push(tmpArray[index]);
            tmpArray.splice(index, 1);
        }
        return resultArray;
    }

    /**
     * 获取随机打乱的列表，指定权重
     * @param array 列表数据
     * @param weightArray 权重列表
     * @returns 
     */
    static randomArrayByWeight(array: Array<any>, weightArray: Array<number>): Array<any> {
        let tmpArray = array.concat();
        let resultArray = new Array<any>();
        let weightSum = 0;
        for (let i = 0; i < weightArray.length; ++i) {
            weightSum += weightArray[i];
        }
        while (tmpArray.length > 0) {
            let random = Math.random() * weightSum;
            for (let i = 0; i < weightArray.length; ++i) {
                if (random < weightArray[i]) {
                    resultArray.push(tmpArray[i]);
                    tmpArray.splice(i, 1);
                    weightSum -= weightArray[i];
                    weightArray.splice(i, 1);
                    break;
                } else {
                    random -= weightArray[i];
                }
            }
        }
        return resultArray;
    }

    /**
     * 获取随机打乱的列表，指定权重和个数
     * @param array 列表数据
     * @param weightArray 权重列表
     * @param count 指定个数
     * @returns
     */
    static randomArrayByWeightAndCount(array: Array<any>, weightArray: Array<number>, count: number): Array<any> {
        let tmpArray = array.concat();
        let resultArray = new Array<any>();
        let weightSum = 0;
        for (let i = 0; i < weightArray.length; ++i) {
            weightSum += weightArray[i];
        }
        while (resultArray.length < count) {
            let random = Math.random() * weightSum;
            for (let i = 0; i < weightArray.length; ++i) {
                if (random < weightArray[i]) {
                    resultArray.push(tmpArray[i]);
                    tmpArray.splice(i, 1);
                    weightSum -= weightArray[i];
                    weightArray.splice(i, 1);
                    break;
                } else {
                    random -= weightArray[i];
                }
            }
        }
        return resultArray;
    }
}