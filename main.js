/**
 * @param {string} tag
 * @param {'past' | 'future'} direction
 */
async function* follow(tag, direction) {
  yield "3";
}

document.addEventListener("click", (event) => {
  if (event.target instanceof HTMLLIElement) {
    const text = event.target.innerText;
    confirm.log(text);

    for await (const article of follow(text, "past")) {
      console.log(article);
    }
  }
});
