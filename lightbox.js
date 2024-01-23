import { follow } from "./threads.js";
import { key } from "./key.js";
import { resized } from "./images.js";

/** Setup **/
key;
const ul = document.querySelector("ul");
const [previous, next] = document
  .querySelector("nav")
  ?.querySelectorAll("button") ?? [];

if (!ul || !previous || !next) throw ("No lightbox");

// const id = "/world/picture/2016/nov/20/eyewitness-seoul";
const date = new Date(1479658237000);
const tag = "world/series/eyewitness";

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

const min = 0;
let index = 0;
const images = [{
  src:
    "https://media.guim.co.uk/00dc6fb9bf3c5482e6c41f11a6ea711c3d996406/0_0_5568_3712/master/5568.jpg",
  title: "Eyewitness: Seoul",
  href:
    "https://www.theguardian.com/world/picture/2016/nov/20/eyewitness-seoul",
}];

const [first, middle, last] = [...ul.querySelectorAll("li")];

middle.scrollIntoView();

const toggleButtons = () => {
  console.log({ min, index, length: images.length });
  previous.disabled = index <= min;
  next.disabled = index >= images.length - 1;
};

/** @param {NonNullable<import("./capi.js").Search["response"]["results"][number]["elements"]>} elements */
const get_images = (elements) =>
  elements.filter(({ relation }) => relation !== "thumbnail")
    .flatMap(({ assets }) => {
      const asset = assets.find((asset) => asset.file.includes("/master/"));
      return asset ? [asset.file] : [];
    });

const before = follow({ tag, date, key: key.value, direction: "past" });
const prepend = async () => {
  const next = await before.next();
  if (next.done) return;
  const extra_images = get_images(next.value.elements ?? []);
  images.unshift(
    ...extra_images.map((src) => ({
      src,
      href: next.value.webUrl.href,
      title: next.value.webTitle,
    })),
  );
  index += extra_images.length;
};
const past = async () => {
  await prepend();
  index = Math.max(index - 1, min);
  toggleButtons();
  if (index <= min) {
    first.scrollIntoView();
    return;
  } else if (index + 1 === images.length - 1) {
    middle.scrollIntoView();
    return;
  }
  last.replaceChildren(...middle.childNodes);
  middle.replaceChildren(...first.childNodes);

  const image = images[index - 1];
  const img = document.createElement("img");
  img.src = resized(image.src);
  const a = document.createElement("a");
  a.href = image.href;
  a.innerText = image.title;
  first.replaceChildren(img, a);
  middle.scrollIntoView();
};

const after = follow({ tag, date, key: key.value, direction: "future" });
const append = async () => {
  const next = await after.next();
  if (next.done) return;
  const extra_images = get_images(next.value.elements ?? []);
  images.push(
    ...extra_images.map((src) => ({
      src,
      href: next.value.webUrl.href,
      title: next.value.webTitle,
    })),
  );
};
const future = async () => {
  await append();
  index = Math.min(index + 1, images.length - 1);
  toggleButtons();
  if (index >= images.length - 1) {
    last.scrollIntoView();
    return;
  } else if (index - 1 === min) {
    middle.scrollIntoView();
    return;
  }
  first.replaceChildren(...middle.childNodes);
  middle.replaceChildren(...last.childNodes);

  const image = images[index + 1];
  const img = document.createElement("img");
  img.src = resized(image.src);
  const a = document.createElement("a");
  a.href = image.href;
  a.innerText = image.title;
  last.replaceChildren(img, a);
  middle.scrollIntoView();
};

const setup = async () => {
  await Promise.all([append(), prepend()]);

  const first_image = images[index - 1];
  const last_image = images[index + 1];
  if (first_image) {
    const img = document.createElement("img");
    img.src = resized(first_image.src);
    const a = document.createElement("a");
    a.href = first_image.href;
    a.innerText = first_image.title;
    first.replaceChildren(img, a);
  }
  if (last_image) {
    const img = document.createElement("img");
    img.src = resized(last_image.src);
    const a = document.createElement("a");
    a.href = first_image.href;
    a.innerText = first_image.title;
    last.replaceChildren(img, a);
  }
};

await setup();

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
