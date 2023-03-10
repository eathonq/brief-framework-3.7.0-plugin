/**
 * brief-framework
 * reference = https://github.com/melkir/A-Star-Python
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

//#region Graph

// export class SimpleGraph {
//     edges: any[][];
//     constructor() {
//         this.edges = [];
//     }
//     neighbors(id: { x: number; y: number; }) {
//         return this.edges[id.x][id.y] || {};
//     }
// }

/** 方格数据 */
export class SquareGrid {
    /**
     * 初始化方格数据
     * @param width 宽度
     * @param height 高度
     * @param walls 墙体数据
     */
    constructor(width: number, height: number, walls?: { x: number, y: number }[]) {
        this._width = width;
        this._height = height;
        this._walls = {};
        if (walls) {
            for (let wall of walls) {
                this._walls[`${wall.x}_${wall.y}`] = true;
            }
        }
    }

    private _width: number;
    private _height: number;
    private _walls: {};

    private inBounds(id: { x: number; y: number; }) {
        return id.x >= 0 && id.x < this._width && id.y >= 0 && id.y < this._height;
    }

    private passable(id: { x: number; y: number; }) {
        return !this._walls[`${id.x}_${id.y}`];
    }

    neighbors(id: { x: number; y: number; }) {
        const { x, y } = id;
        const results = [{ x: x + 1, y }, { x, y: y - 1 }, { x: x - 1, y }, { x, y: y + 1 }];
        if ((x + y) % 2 == 0) {
            results.reverse();
        }
        return results.filter(id => this.inBounds(id) && this.passable(id));
    }
}

/** 带权重的方格数据 */
export class GridWithWeights extends SquareGrid {
    /**
     * 初始化带权重的方格数据
     * @param width 宽度
     * @param height 高度
     * @param walls 墙体数据
     * @param weights 权重数据，格式为 { x: number, y: number, weight: number }，weight 默认为1
     */
    constructor(width: number, height: number, walls?: { x: number, y: number }[], weights?: { x: number, y: number, weight: number }[]) {
        super(width, height, walls);
        this._weights = weights;

        this._weights = {};
        if (weights) {
            for (let weight of weights) {
                this._weights[`${weight.x}_${weight.y}`] = weight.weight;
            }
        }
    }

    private _weights: {};

    cost(from: { x: number; y: number; }, to: { x: number; y: number; }) {
        return this._weights[`${to.x}_${to.y}`] || 1;
    }
}
//#endregion

//#region Queue

/** 队列 */
export class Queue {
    /** 队列 */
    constructor() {
        this._elements = [];
    }

    private _elements: any[];

    empty() {
        return this._elements.length == 0;
    }

    put(item: { x: number; y: number; }) {
        this._elements.push(item);
    }

    get() {
        return this._elements.shift();
    }
}

/** 优先队列 */
export class PriorityQueue {
    /** 优先队列 */
    constructor() {
        this._elements = [];
    }

    private _elements: any[];

    empty() {
        return this._elements.length == 0;
    }

    put(item: { x: number; y: number; }, priority: number) {
        // 最小priority 排在前面
        for (let i = 0; i < this._elements.length; i++) {
            if (this._elements[i].priority >= priority) {
                this._elements.splice(i, 0, { item, priority });
                return;
            }
        }
        this._elements.push({ item, priority });
    }

    get() {
        return this._elements.shift().item;
    }
}

//#endregion

//#region Algorithms

/** 寻路算法 */
export class Algorithms {
    /**
     * 广度优先搜索
     * @param graph 数据图表
     * @param start 起点
     * @param goal 终点
     * @returns 路径(Map)
     */
    static breadth_first_search(graph: SquareGrid, start: { x: number; y: number; }, goal: { x: number; y: number; }) {
        let frontier = new Queue();
        frontier.put(start);
        let came_from = {};
        came_from[`${start.x}_${start.y}`] = {};

        while (!frontier.empty()) {
            let current = frontier.get();

            if (current.x == goal.x && current.y == goal.y)
                break;

            for (let next of graph.neighbors(current)) {
                if (!came_from[`${next.x}_${next.y}`]) {
                    frontier.put(next);
                    came_from[`${next.x}_${next.y}`] = current;
                }
            }
        }

        return came_from;
    }

    /**
     * dijkstra 算法
     * @param graph 数据图表
     * @param start 起点
     * @param goal 终点
     * @returns 路径(Map)
     */
    static dijkstra_search(graph: GridWithWeights, start: { x: number; y: number; }, goal: { x: number; y: number; }) {
        let frontier = new PriorityQueue();
        frontier.put(start, 0);
        let came_from = {};
        came_from[`${start.x}_${start.y}`] = {};
        let cost_so_far = {};
        cost_so_far[`${start.x}_${start.y}`] = 1;

        while (!frontier.empty()) {
            let current = frontier.get();

            if (current.x == goal.x && current.y == goal.y)
                break;

            for (let next of graph.neighbors(current)) {
                let new_cost = cost_so_far[`${current.x}_${current.y}`] + graph.cost(current, next);
                if (!cost_so_far[`${next.x}_${next.y}`] || new_cost < cost_so_far[`${next.x}_${next.y}`]) {
                    cost_so_far[`${next.x}_${next.y}`] = new_cost;
                    frontier.put(next, new_cost);
                    came_from[`${next.x}_${next.y}`] = current;
                }
            }
        }

        return came_from;
    }

    /**
     * 重建路径
     * @param came_from 路径(Map)
     * @param start 起点
     * @param goal 终点
     * @returns 路径(Array)
     */
    static reconstruct_path(came_from: {}, start: { x: number; y: number; }, goal: { x: number; y: number; }) {
        let current = goal;
        let path = [];
        let isStart = true;
        while (current != start) {
            path.push(current);
            current = came_from[`${current.x}_${current.y}`];
            if (current == undefined) {
                isStart = false;
                break;
            }
        }
        if (isStart) {
            path.push(start);
        }
        path.reverse();
        return path;
    }

    /**
     * heuristic 函数
     * @param a 点a
     * @param b 点b
     * @returns heuristic 值
     */
    static heuristic(a: { x: number; y: number; }, b: { x: number; y: number; }, distance_multiplier: number) {
        // 曼哈顿距离
        return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * distance_multiplier;

        // 对角距离
        // let dx = Math.abs(a.x - b.x);
        // let dy = Math.abs(a.y - b.y);
        // return (dx + dy) * distance_multiplier * 1.41421;

        // 欧几里得距离
        // return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) * distance_multiplier;
    }

    /**
     * 两个相邻点之间移动的代价
     */
    static distance_multiplier = 1;

    /**
     * A*算法
     * @param graph 数据图表
     * @param start 起点
     * @param goal 终点
     * @param distance_multiplier heuristic 函数两个相邻点之间移动的代价，默认为1
     * @returns 路径(Map)
     */
    static a_star_search(graph: GridWithWeights, start: { x: number; y: number; }, goal: { x: number; y: number; }, distance_multiplier = this.distance_multiplier) {
        let frontier = new PriorityQueue();
        frontier.put(start, 0);
        let came_from = {};
        came_from[`${start.x}_${start.y}`] = {};
        let cost_so_far = {};
        cost_so_far[`${start.x}_${start.y}`] = 1;

        while (!frontier.empty()) {
            let current = frontier.get();

            if (current.x == goal.x && current.y == goal.y)
                break;

            for (let next of graph.neighbors(current)) {
                let new_cost = cost_so_far[`${current.x}_${current.y}`] + graph.cost(current, next);
                if (!cost_so_far[`${next.x}_${next.y}`] || new_cost < cost_so_far[`${next.x}_${next.y}`]) {
                    cost_so_far[`${next.x}_${next.y}`] = new_cost;
                    frontier.put(next, new_cost + this.heuristic(goal, next, distance_multiplier));
                    came_from[`${next.x}_${next.y}`] = current;
                }
            }
        }

        return came_from;
    }
}
//#endregion