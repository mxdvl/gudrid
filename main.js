import { base, content } from "./capi.js";
import { key } from "./key.js";
import { follow } from "./threads.js";

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
