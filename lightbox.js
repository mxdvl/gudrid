import { key } from "./key.js";

/** Setup **/

key;
document.querySelector("#current")?.scrollIntoView();

const ul = document.querySelector("ul");

if (!ul) throw ("No lightbox");

/** Events **/

const event = new Event("lightbox:scrolled");

/** @type {number} */
let timer;
ul.addEventListener("scroll", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    document.dispatchEvent(event);
    clearTimeout(timer);
  }, 36);
});

/** @param {number} index */
const image = (index) => `https://placehold.co/1500x900?text=${index}`;

let index = 600;

const [first, middle, last] = [...ul.querySelectorAll("li")];

const past = () => {
  index--;
  const img = document.createElement("img");
  img.src = image(index - 1);
  last.replaceChildren(...middle.childNodes);
  middle.replaceChildren(...first.childNodes);
  first.replaceChildren(img);
};

const future = () => {
  index++;
  const img = document.createElement("img");
  img.src = image(index + 1);
  first.replaceChildren(...middle.childNodes);
  middle.replaceChildren(...last.childNodes);
  last.replaceChildren(img);
};

document.addEventListener(event.type, () => {
  const width = ul.clientWidth;
  const position = Math.round(2 * (ul.scrollLeft + width / 2) / ul.scrollWidth);
  switch (position) {
    case 0: {
      return requestAnimationFrame(() => {
        past();
        ul.scrollBy({ left: +width });
      });
    }
    case 1: {
      return;
    }
    case 2: {
      return requestAnimationFrame(() => {
        future();
        ul.scrollBy({ left: -width });
      });
    }
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
