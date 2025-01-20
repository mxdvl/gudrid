const width = 1200;

/** @type {
  (master: string)
=>
  string
} */
const resized = (master) => {
  const url = new URL(master);
  const [bucket] = url.hostname.split(".");
  const path = ["img", bucket, url.pathname.replace(/^\//, "")].join("/");
  const params = new URLSearchParams({
    dpr: String(2),
    width: String(width),
    s: "none",
  });

  return new URL(`${path}?${params.toString()}`, "https://i.guim.co.uk").href;
};

/** @type {
  (elements: NonNullable<import("./capi.js").Search["results"][number]["elements"]>)
=>
 string[]
} */
const get_images = (elements) =>
  elements.filter(({ relation }) => relation !== "thumbnail")
    .flatMap(({ assets }) => {
      const asset = assets.find((asset) => asset.file.includes("/master/"));
      return asset ? [asset.file] : [];
    });

export { get_images, resized, width };
