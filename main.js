// @ts-check
import { content } from "./capi.js";
import { capi } from "./capi.js";

const base = "https://content.guardianapis.com/";

const key = document.querySelector("input");

if (!key) throw Error("no key input");

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {'past' | 'future'} options.direction
 * @param {string} options.key
 */
async function* follow({ tag, date, direction, key }) {
  const dates = direction === "past"
    ? {
      "from-date": "1000-01-01",
      "to-date": date.toISOString().slice(0, 10),
    }
    : {
      "from-date": date.toISOString().slice(0, 10),
      "to-date": "3000-12-31",
    };

  const params = new URLSearchParams({
    tag,
    "order-by": direction === "past" ? "newest" : "oldest",
    ...dates,
    "page-size": String(12),
    "show-elements": ["image", "cartoon"].join(","), // maybe `all`
    "api-key": key,
  });

  const url = new URL(`/search?${params.toString()}`, base);

  const { response } = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => capi(json));

  /** @type {(result: typeof response.results[number])=> boolean} */
  const isBefore = ({ webPublicationDate }) => webPublicationDate < date;
  /** @type {(result: typeof response.results[number])=> boolean} */
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
  for await (
    const article of follow({
      tag: text,
      date: new Date(),
      direction: "past",
      key: key.value,
    })
  ) {
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

/**
 * @param {Date} date
 * @param {string} title
 * @returns
 */
const format = (date, title) =>
  `<time>${date.toISOString().slice(0, 10)}</time> ${title}`;

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
  li.innerHTML = format(
    response.content.webPublicationDate,
    response.content.webTitle,
  );
  ul.appendChild(li);

  for await (
    const article of follow({
      tag: tag.id,
      date: response.content.webPublicationDate,
      direction: "future",
      key: key.value,
    })
  ) {
    const li = document.createElement("li");
    li.innerHTML = format(
      article.webPublicationDate,
      article.webTitle,
    );
    ul.prepend(li);
  }

  for await (
    const article of follow(
      {
        tag: tag.id,
        date: response.content.webPublicationDate,
        direction: "past",
        key: key.value,
      },
    )
  ) {
    const li = document.createElement("li");
    li.innerHTML = format(
      article.webPublicationDate,
      article.webTitle,
    );
    ul.appendChild(li);
  }
});
