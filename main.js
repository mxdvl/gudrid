import { capi } from "./capi.js";

const base = "https://content.guardianapis.com/";

/**
 * @param {string} tag
 * @param {'past' | 'future'} direction
 */
async function* follow(tag, direction) {
  const params = new URLSearchParams({
    tag,
    orderBy: "newest",
    "page-size": String(24),
    "show-elements": ["image", "cartoon"].join(","), // maybe `all`
    "api-key": "test",
  });

  const url = new URL(`/search?${params.toString()}`, base);

  const { response } = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => (console.log(json), json))
    .then((json) => capi(json));

  for (const result of response.results) {
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

document.addEventListener("click", async (event) => {
  if (event.target instanceof HTMLLIElement) {
    const ul = document.createElement("ul");
    const text = event.target.innerText;
    console.log("About to fetch:", text);

    event.target.appendChild(ul);
    for await (const article of follow(text, "past")) {
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
      // console.log(article.webTitle);
    }
  }
});
