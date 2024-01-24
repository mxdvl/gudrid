import { follow } from "./threads.js";
import { key } from "./key.js";
import { get_images, resized, width } from "./images.js";
import { base, content } from "./capi.js";

/** Setup **/
key;
const lightbox = document.querySelector("ul#lightbox");
const [previous, next] = document
  .querySelector("nav")
  ?.querySelectorAll("button") ?? [];

if (!(lightbox instanceof HTMLUListElement) || !previous || !next) {
  throw ("No lightbox");
}

const article = new URLSearchParams(window.location.search).get("article") ??
  "/world/picture/2016/nov/20/eyewitness-seoul";

const params = new URLSearchParams({
  "show-elements": ["image", "cartoon"].join(","), // maybe `all`
  "show-tags": ["series"].join(","), // maybe `all`
  "api-key": key.value,
});
const url = new URL(`${article}?${params.toString()}`, base);
const { response } = await fetch(url, { "mode": "cors" })
  .then((response) => response.json())
  .then((json) => content(json));

const date = response.content.webPublicationDate;
const tag = response.content.tags.find(({ type }) => type === "series")?.id ??
  "world/series/eyewitness";

/**
 * @param {object} image
 * @param {string} image.src
 * @param {URL} image.url
 * @param {string} image.title
 */
const create_li = (image) => {
  const li = document.createElement("li");
  const img = document.createElement("img");
  img.src = resized(image.src);
  img.width = width;
  img.loading = "lazy"; 
  const a = document.createElement("a");
  a.href = image.url.href;
  a.innerText = image.title;
  li.append(a, img);
  return li;
};

const lis = get_images(response.content.elements).map((src) =>
  create_li({
    src,
    url: response.content.webUrl,
    title: response.content.webTitle,
  })
);
let [current] = lis;
lightbox.append(...lis);

/** Events **/

const event = new Event("lightbox:scrolled");

/** @type {number} */
let timer;
lightbox.addEventListener("scroll", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    document.dispatchEvent(event);
    clearTimeout(timer);
  }, 60);
});

const toggleButtons = () => {
  previous.disabled = !current?.previousSibling;
  next.disabled = !current?.nextElementSibling;
};

const before = follow({ tag, date, key: key.value, direction: "past" });
const prepend = async () => {
  const { done, value } = await before.next();
  if (done) return toggleButtons();
  const lis = get_images(value.elements).map((src) =>
    create_li({ src, url: value.webUrl, title: value.webTitle })
  );
  lightbox.prepend(...lis);
  current?.scrollIntoView();
  toggleButtons();
};

const past = () => {
  current?.previousElementSibling?.scrollIntoView();
  document.dispatchEvent(event);
};

const after = follow({ tag, date, key: key.value, direction: "future" });
const append = async () => {
  const { done, value } = await after.next();
  if (done) return toggleButtons();
  const lis = get_images(value.elements).map((src) =>
    create_li({ src, url: value.webUrl, title: value.webTitle })
  );
  lightbox.append(...lis);
  current?.scrollIntoView();
  toggleButtons();
};
const future = () => {
  current?.nextElementSibling?.scrollIntoView();
  document.dispatchEvent(event);
};

// fill with some initial images
await Promise.all([
  append(),
  append(),
  append(),
  prepend(),
  prepend(),
  prepend(),
]);

document.addEventListener("click", (event) => {
  switch (event.target) {
    case previous:
      return requestAnimationFrame(past);
    case next:
      return requestAnimationFrame(future);
  }
});

document.addEventListener(event.type, () => {
  const lis = lightbox.querySelectorAll("li");
  const position = Math.round(
    lis.length * lightbox.scrollLeft / lightbox.scrollWidth,
  );
  current = lis[position];

  const left = position;
  const right = lis.length - 1 - position;

  void Promise.all(Array.from({ length: 6 - left }, () => prepend()));
  void Promise.all(Array.from({ length: 6 - right }, () => append()));
});

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      return requestAnimationFrame(past);
    case "ArrowRight":
      return requestAnimationFrame(future);
  }
});

const input = document.querySelector("input#article");
if (!(input instanceof HTMLInputElement)) throw Error("No article input");
input.value = tag;

document.querySelector("header")?.addEventListener("input", (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;

  const params = new URLSearchParams(location.search);
  params.set(event.target.id, event.target.value.trim());
  window.location.search = params.toString();
});
