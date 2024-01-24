/** @param {number} time @returns {Promise<void>} */
const delay = (time = 120) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

async function* foo() {
  await delay(100);
  yield 'a';
  await delay(1200);
  yield 'b';
  await delay(300);
  yield 'c';
}

let str = '';

const generated = foo();
console.log(await generated.next());
// Expected output: "abc"
