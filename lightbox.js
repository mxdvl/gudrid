import { key } from "./key.js";

document.querySelector("#current")?.scrollIntoView();

const ul = document.querySelector("ul");

if (!ul) throw ("No lightbox");

const event = new Event("lightbox:scrolled");

/** @type {number} */
let timer;
ul.addEventListener("scroll", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    document.dispatchEvent(event);
    clearTimeout(timer);
  }, 60);
});

document.addEventListener(event.type, () => {
  const position = ul.scrollLeft / ul.clientWidth;
  console.log("finished scrolling", ul.scrollLeft, position);
  switch (position) {
    case 2:
    case 0: {
      ul.scrollTo(2 * ul.clientWidth / 3, 0);
      return;
    }

    case 1: {
      console.log("nothing");
      return;
    }
  }
});

// setInterval(() => {
//   console.log(scrolling);
// }, 12);
