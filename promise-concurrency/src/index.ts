import {ConcurrencyResult} from './concurrency-result'

export type Task<T> = () => Promise<T>

export class PromiseConcurrencyController<T> {
    activeCount = 0
    pendingCount = 0
    private concurencyMaxSize = 0
    private executingPool: Task<T>[] = []
    private tasks: Task<T>[] = []
    private isStop: Boolean = false
    private isExecuting: Boolean = false
    private result: ConcurrencyResult<T> = new ConcurrencyResult<T>()
    private pausePromise: Promise<void>

    constructor(public readonly size: number) {
        this.concurencyMaxSize = size
    }

    run(...tasks: Task<T>[]): ConcurrencyResult<T> {
        this.tasks.push(...tasks)

        debugger
        this.pendingCount += tasks.length
        if (!this.isExecuting && !this.isStop) {
            this.addTaskToPool()
        }

        return this.result
    }

    addTaskToPool() {
        if (!this.tasks.length)
            return;

        this.activeCount++
        const executingTask = this.tasks.shift()!;
        executingTask().then(res => {
            this.result.yield(res)
        }).catch(err => {
            this.result.reject(err)
        }).finally(() => {
            this.activeCount--
            this.executingPool.splice(this.executingPool.indexOf(executingTask), 1);
            if (!this.isStop) {
                this.addTaskToPool()
            }
            if (!this.executingPool.length) {
                this.isExecuting = false
            }
        })
        this.executingPool.push(executingTask);

        if (this.executingPool.length! >= this.concurencyMaxSize || !this.tasks.length) {  //when pool reach its limits or there is no left tasks to add then executing all promise
            Promise.all(this.executingPool)
            this.isExecuting = true
        } else {
            this.addTaskToPool()
        }
    }

    async stop(): Promise<void> {
        if (this.isStop) return
        this.isStop = true
        return this.pausePromise
    }

    resume() {
        if (!this.isStop) return
        this.isStop = false
        this.addTaskToPool()
        return
    }
}
