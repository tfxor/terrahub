function test() {
  return new Promise(((resolve, reject) => {
    setTimeout(() => {
      resolve('resolved');
    }, 3000);

    setTimeout(() => {
      reject('error');
    }, 1500);
  }));
}

// (async () => {
//   try {
//     await test()
//   } catch (e) {
//     console.log('handled rejection', e);
//   }
// })();

function distribute() {
  const count = 10;

  for (let i = 0; i < count; i++) {
    try {
      test().catch(e => console.log(e))
    } catch (e) {
      console.log('catched : ', e);
    }
  }
}
try {
  distribute();
} catch (e) {
  console.log('ca', e)
}
