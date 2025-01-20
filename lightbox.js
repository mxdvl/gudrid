import { follow } from "./threads.js";
import { key } from "./key.js";
import { get_images, resized, width } from "./images.js";
import { base, content } from "./capi.js";
import { default_content } from "./fallbacks.js";
import { ValiError } from "https://esm.sh/valibot@0.42.1";

/** Setup **/
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
  "show-tags": ["series", "contributor", "tone"].join(","), // maybe `all`
  "api-key": key,
});
const url = new URL(`${article}?${params.toString()}`, base);
const response = await fetch(url, { "mode": "cors" })
  .then((response) => response.json())
  .then((json) => content(json))
  .catch((error) => {
    if (error instanceof ValiError) {
      console.error(error.issues);
    }
    return default_content;
  });

const date = response.content.webPublicationDate;
const tag = response.content.tags.find(({ type }) => type === "series")?.id ??
  response.content.tags[0]?.id;

/** @type {(image: Readonly<{
 src: string;
 url: Readonly<URL>;
 title: string;
 loading?: HTMLImageElement["loading"];
}>) => HTMLLIElement} */
const create_li = ({
  src,
  url,
  title,
  loading = "lazy",
}) => {
  const li = document.createElement("li");
  const img = document.createElement("img");
  img.src = resized(src);
  img.width = width;
  img.loading = loading ?? "lazy";
  const a = document.createElement("a");
  a.href = url.href;
  a.innerText = title;
  li.append(a, img);
  return li;
};

const lis = get_images(response.content.elements).map((
  src,
  index,
  { length },
) =>
  create_li({
    src,
    url: response.content.webUrl,
    title: `${response.content.webTitle} (${index + 1} / ${length})`,
    loading: "eager",
  })
);
let [current] = lis;
lightbox.append(...lis);
current?.scrollIntoView();

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
  if (!current) return;
  const { previousElementSibling, nextElementSibling } = current;
  previous.disabled = !previousElementSibling;
  next.disabled = !nextElementSibling;

  const images = [previousElementSibling, nextElementSibling].flatMap((li) => {
    const img = li?.querySelector("img");
    return img instanceof HTMLImageElement ? [img] : [];
  });

  for (const image of images) {
    image.loading = "eager";
  }
};

/** @type {(options: Readonly<{
  tag: string,
  date: Readonly<Date>,
  key: string,
  direction: 'future' | 'past' ,
}>) => AsyncGenerator<HTMLLIElement, undefined>} */
async function* images({ tag, date, key, direction }) {
  for await (const article of follow({ tag, date, key, direction })) {
    const images = get_images(article.elements).map(
      (src, index, { length }) => ({
        src,
        url: article.webUrl,
        title: `${article.webTitle} (${index + 1} / ${length})`,
      }),
    ).map(create_li);

    if (direction === "future") images.reverse();

    for (const li of images) {
      yield li;
    }
  }
}

if (!tag) {
  console.error(content);
  const li = document.createElement("li");
  li.innerText = "Could not find a tag for this article";
  lightbox.append(li);
  throw Error("Could not find any tag");
}

const left = images({ tag, date, key, direction: "future" });
const prepend = async () => {
  const { done, value } = await left.next();
  if (done) return toggleButtons();
  lightbox.prepend(value);
  current?.scrollIntoView();
  toggleButtons();
};

const past = () => {
  current?.previousElementSibling?.scrollIntoView();
  document.dispatchEvent(event);
};

const right = images({ tag, date, key, direction: "past" });
const append = async () => {
  const { done, value } = await right.next();
  if (done) return toggleButtons();
  lightbox.append(value);
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

document.addEventListener("resize", () => {
  current?.scrollIntoView();
});

document.addEventListener(event.type, () => {
  const lis = lightbox.querySelectorAll("li");
  const position = Math.round(
    lis.length * lightbox.scrollLeft / lightbox.scrollWidth,
  );

  current?.classList.remove("current");
  current = lis[position];
  current?.classList.add("current");

  const left = position;
  const right = lis.length - 1 - position;

  void Promise.all(Array.from({ length: 6 - left }, () => prepend()));
  void Promise.all(Array.from({ length: 6 - right }, () => append()));
});

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      return requestAnimationFrame(past);
    case "ArrowRight":
      event.preventDefault();
      return requestAnimationFrame(future);
  }
});

const input = document.getElementsByTagName("input").namedItem("article");
if (input) {
  input.value = article;

  input.addEventListener("change", () => {
    const params = new URLSearchParams(location.search);
    params.set(input.name, input.value.trim());
    window.location.search = params.toString();
  });
}
