/* 
  Promise 三种状态，两种执行过程
  pending -> fulfilled
  pending -> rejected
  一旦状态确定就不可更改
*/
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  constructor(executor) {
    try {
      // 同步执行初始化传入的方法
      // this.resolve, this.reject 这两个参数是实参，是当前promise实例的方法
      // 外部通过回调函数的形参来决定什么时候调用
      // 其实就是初始化一个promise时，定义一个变量来接收实例的这两个方法
      executor(this.resolve, this.reject)
    } catch(err) {
      this.reject(err)
    }
  }

  status = PENDING
  value = undefined // 成功之后的值
  reason = undefined // 失败的原因
  successCallback = []
  failCallback = []

  resolve = value => {
    if(this.status !== PENDING) return

    this.status = FULFILLED
    this.value = value
    while(this.successCallback.length > 0) {
      this.successCallback.shift()()
    }
  }

  reject = reason => {
    if(this.status !== PENDING) return

    this.status = REJECTED
    this.reason = reason
    while(this.failCallback.length > 0) {
      this.failCallback.shift()()
    }
  }

  then = (successCallback, failCallback) => {
    successCallback = successCallback ? successCallback : value => value
    failCallback = failCallback ? failCallback : reason => { throw reason }

    let promise2 = new MyPromise((resolve, reject) => {
      // 这里的代码和 then 方法被调用时是同步的，所以需要判断 then 方法实例的状态
      if(this.status === FULFILLED) {
        // 状态已改，在下一个时间片执行成功回调
        setTimeout(() => {
          try {
            let x = successCallback(this.value)
            // 根据返回值，决定下一步处理
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        }, 0)
      } else if(this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = failCallback(this.reason)
            // 根据返回值，决定下一步处理
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        }, 0)
      } else { // 等待，将成功回调和失败回调存储起来
        this.successCallback.push(() => {
          setTimeout(() => {
            try {
              let x = successCallback(this.value)
              // 根据返回值，决定下一步处理
              resolvePromise(promise2, x, resolve, reject)
            } catch (err) {
              reject(err)
            }
          }, 0);
        })

        this.failCallback.push(() => {
          setTimeout(() => {
            try {
              let x = failCallback(this.reason)
              // 根据返回值，决定下一步处理
              resolvePromise(promise2, x, resolve, reject)
            } catch (err) {
              reject(err)
            }
          }, 0);
        })
      }
    })

    return promise2
  }

  finally = callback => {
    return this.then(value => {
      // finally 没有自己的返回值
      return MyPromise.resolve(callback()).then(() => value)
    }, reason => {
      return MyPromise.resolve(callback()).then(() => { throw reason })
    })
  }

  catch = failCallback => {
    return this.then(undefined, failCallback)
  }

  static all = array => {
    const result = []
    let index = 0
    return new MyPromise((resolve, reject) => {
      function addData(key, value) {
        index++
        result[key] = value
        if(index === array.length) {
          resolve()
        }
      }

      for(let i = 0; i < array.length; i++) {
        const current = array[i]
        if(current instanceof MyPromise) {
          current.then(value => {
            addData(i, value)
          },reason => {
            reject(reason)
          })
        } else {
          // 普通值
          addData(i, current)
        }
      }
    })
  }

  static race = array => {
    let isReturn = false

    return new MyPromise((resolve, reject) => {
      function returnFunc(value) {
        if(!isReturn) {
          isReturn = true
          resolve(`first ${value}`)
        }
      }

      for(let i = 0; i < array.length; i++) {
        const current = array[i]
        if(current instanceof MyPromise) {
          current.then(returnFunc, returnFunc)
        } else {
          returnFunc(current)
        }
      }
    })
  }

  static resolve = value => {
    if(value instanceof MyPromise) {
      return value
    }

    return new MyPromise(resolve => resolve(value))
  }
}

/*
  判断 x 的值是普通值还是promise对象
  如果是普通值，直接调用resolve
  如果是promise对象，查看promise对象返回的结果
  再根据promise对象返回的结果，决定调用resolve还是调用reject
*/
function resolvePromise(promise2, x, resolve, reject) {
  if(promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }
  if(x instanceof MyPromise) {
    x.then(resolve, reject)
  } else {
    resolve(x)
  }
}

module.exports = MyPromise