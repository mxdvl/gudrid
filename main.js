// @ts-check
import { content } from "./capi.js";
import { capi } from "./capi.js";

const base = "https://content.guardianapis.com/";

const key = document.querySelector("input");

if (!key) throw Error("no key input");

/**
 * @param {string} tag
 * @param {Date} date
 * @param {'past' | 'future'} direction
 */
async function* follow(tag, date, direction) {
  const options = direction === "past"
    ? {
      "order-by": "newest",
      "to-date": date.toISOString().slice(0, 10),
    }
    : {
      "order-by": "oldest",
      "from-date": date.toISOString().slice(0, 10),
    };

  const params = new URLSearchParams({
    tag,
    ...options,
    "page-size": String(12),
    "show-elements": ["image", "cartoon"].join(","), // maybe `all`
    "api-key": key.value,
  });

  const url = new URL(`/search?${params.toString()}`, base);

  const { response } = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => capi(json));

  const isBefore = ({ webPublicationDate }) => webPublicationDate < date;
  const isAfter = ({ webPublicationDate }) => webPublicationDate > date;

  let count = 0;
  for (
    const result of response.results.filter(
      direction === "past" ? isBefore : isAfter,
    )
  ) {
    if (count > 6) return;
    count++;
    yield result;
  }
}

/** @param {number} time @returns {Promise<void>} */
const delay = (time = 120) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

/** @param {string} master */
const resized = (master) => {
  const url = new URL(master);
  const [bucket] = url.hostname.split(".");
  const path = ["img", bucket, url.pathname.replace(/^\//, "")].join("/");
  const params = new URLSearchParams({
    dpr: String(2),
    width: String(480),
    s: "none",
  });
  console.log(path);
  return new URL(`${path}?${params.toString()}`, "https://i.guim.co.uk").href;
};

document.addEventListener("DOMContentLoaded", () => {
  const value = localStorage.getItem("key");
  if (value !== null && value.length > 0) {
    key.value = value;
  }
});

key.addEventListener("input", (e) => {
  if (!(e instanceof InputEvent)) return;
  if (!(e.target instanceof HTMLInputElement)) return;
  const { value } = e.target;
  localStorage.setItem("key", value);
});

document.addEventListener("click", async (event) => {
  if (!(event.target instanceof HTMLLIElement)) return;
  if (event.target.getAttribute("data-info") !== "tag") return;

  const ul = document.createElement("ul");
  const text = event.target.innerText;
  console.log("About to fetch:", text);

  event.target.appendChild(ul);
  for await (const article of follow(text, new Date(), "past")) {
    await delay(600);

    if (!article.elements) continue;

    for (const element of article.elements) {
      if (element.relation === "thumbnail") continue;

      const asset = element.assets.find((asset) =>
        asset.file.includes("/master/")
      );
      const li = document.createElement("li");
      const img = document.createElement("img");
      if (!asset) continue;
      img.src = resized(asset.file);
      img.width = 480;
      li.appendChild(img);
      ul.appendChild(li);
    }
  }
});

document.addEventListener("click", async (event) => {
  if (!(event.target instanceof HTMLLIElement)) return;
  if (event.target.getAttribute("data-info") !== "content") return;

  const id = event.target.innerText.trim();

  const params = new URLSearchParams({
    "show-elements": ["image", "cartoon"].join(","), // maybe `all`
    "show-tags": ["series"].join(","), // maybe `all`
    "api-key": key.value,
  });

  const url = new URL(`${id}?${params.toString()}`, base);

  const { response } = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    // .then((json) => (console.log(json), json))
    .then((json) => content(json));

  const ul = document.createElement("ul");
  event.target.appendChild(ul);

  const [tag] = response.content.tags ?? [];

  if (!tag) return;

  const li = document.createElement("li");
  li.classList.add("current");
  li.innerText =
    `${response.content.webTitle} - ${response.content.webPublicationDate.toISOString()}`;
  ul.appendChild(li);

  for await (
    const article of follow(
      tag.id,
      response.content.webPublicationDate,
      "future",
    )
  ) {
    const li = document.createElement("li");
    li.innerText = `${
      article.webPublicationDate.toISOString().slice(0, 10)
    } – ${article.webTitle}`;
    ul.prepend(li);
  }

  for await (
    const article of follow(
      tag.id,
      response.content.webPublicationDate,
      "past",
    )
  ) {
    const li = document.createElement("li");
    li.innerText = `${
      article.webPublicationDate.toISOString().slice(0, 10)
    } – ${article.webTitle}`;
    ul.appendChild(li);
  }
});
