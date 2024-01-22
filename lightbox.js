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
  }, 36);
});

/** @param {number} index */
const image = (index) => `https://placehold.co/1500x900?text=${index}`;

let index = 600;

const [first, middle, last] = [...ul.querySelectorAll("li")];

document.addEventListener(event.type, () => {
  const width = ul.clientWidth;
  const position = Math.round(2 * (ul.scrollLeft + width / 2) / ul.scrollWidth);
  console.log("finished scrolling", {
    left: ul.scrollLeft,
    position,
    width,
    scroll: ul.scrollWidth,
  });
  switch (position) {
    case 0: {
      requestAnimationFrame(() => {
        index--;
        const img = document.createElement("img");
        img.src = image(index - 1);
        last.replaceChildren(...middle.childNodes);
        middle.replaceChildren(...first.childNodes);
        first.replaceChildren(img);
        ul.scrollBy({ left: +width });
      });
      return;
    }
    case 1: {
      console.log("nothing");
      return;
    }
    case 2: {
      requestAnimationFrame(() => {
        index++;
        const img = document.createElement("img");
        img.src = image(index + 1);
        first.replaceChildren(...middle.childNodes);
        middle.replaceChildren(...last.childNodes);
        last.replaceChildren(img);
        ul.scrollBy({ left: -width });
      });
      return;
    }
  }
});

// setInterval(() => {
//   console.log(scrolling);
// }, 12);
