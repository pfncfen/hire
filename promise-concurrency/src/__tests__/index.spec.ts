import ava, {TestInterface} from 'ava'
import Sinon from 'sinon'
import {ConcurrencyResult} from "../concurrency-result";
import {PromiseConcurrencyController, Task} from '../index'

const test = ava as TestInterface<{
    timer: Sinon.SinonFakeTimers
}>

function testTaskGenerator(i: number): Task<number> {
    return () => new Promise<number>(resolve => {
        setTimeout(() => {
            resolve(i)
        }, i * 100);
    })
}


test.beforeEach((t) => {
    t.context.timer = Sinon.useFakeTimers()
})

test.afterEach((t) => {
    t.context.timer.restore()
})

test('should be able to return ConcurrencyResult', async (t) => {
    const testTasks = [testTaskGenerator(1), testTaskGenerator(2), testTaskGenerator(3)]
    const testController = new PromiseConcurrencyController(2)

    const result = testController.run(...testTasks)
    let index = 1
    for await (const value of result) {
        t.is(value, index)
        index++
    }
})

// test('should be able to stop and resume controller', async (t) => {
//     const result = new ConcurrencyResult<number>()
//     const err = new TypeError('You bad bad')
//     result.reject(err)
//     try {
//         for await (const _ of result) {
//         }
//         throw new TypeError('Unreachable error')
//     } catch (e) {
//         t.is(e, err)
//     }
// })

