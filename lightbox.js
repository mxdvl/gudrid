import { key } from "./key.js";

/** Setup **/
key;
const ul = document.querySelector("ul");
const [previous, next] = document
  .querySelector("nav")
  ?.querySelectorAll("button") ?? [];

if (!ul || !previous || !next) throw ("No lightbox");

/** Events **/

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

/** @param {number} index */
const image = (index) => `https://placehold.co/1500x900?text=${index}`;

const min = 1;
const max = 30;
let index = 24;

const [first, middle, last] = [...ul.querySelectorAll("li")];

middle.scrollIntoView();

const toggleButtons = () => {
  previous.disabled = index <= min;
  next.disabled = index >= max;
};

const past = () => {
  index = Math.max(index - 1, min);
  toggleButtons();
  if (index <= min) {
    first.scrollIntoView();
    return;
  } else if (index + 1 === max) {
    middle.scrollIntoView();
    return;
  }
  const img = document.createElement("img");
  img.src = image(index - 1);
  last.replaceChildren(...middle.childNodes);
  middle.replaceChildren(...first.childNodes);
  first.replaceChildren(img);
  middle.scrollIntoView();
};

const future = () => {
  index = Math.min(index + 1, max);
  toggleButtons();
  if (index >= max) {
    last.scrollIntoView();
    return;
  } else if (index - 1 === min) {
    middle.scrollIntoView();
    return;
  }
  const img = document.createElement("img");
  img.src = image(index + 1);
  first.replaceChildren(...middle.childNodes);
  middle.replaceChildren(...last.childNodes);
  last.replaceChildren(img);
  middle.scrollIntoView();
};

document.addEventListener("click", (event) => {
  switch (event.target) {
    case previous:
      return requestAnimationFrame(past);
    case next:
      return requestAnimationFrame(future);
  }
});

document.addEventListener(event.type, () => {
  const width = ul.clientWidth;
  const position = Math.round(2 * (ul.scrollLeft + width / 2) / ul.scrollWidth);
  switch (position) {
    case 0:
      return requestAnimationFrame(past);
    case 1:
      return;
    case 2:
      return requestAnimationFrame(future);
  }
});

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      return requestAnimationFrame(past);
    case "ArrowRight":
      return requestAnimationFrame(future);
  }
});
