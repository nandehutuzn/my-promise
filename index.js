const MyPromise = require('./src/index.js')

const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
    console.log(resolve === promise.resolve)
  }, 1000);
})

promise.then(value => {
  console.log(`value是 ${value}`)
})