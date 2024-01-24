const width = 1200;

/** @param {string} master */
const resized = (master) => {
  const url = new URL(master);
  const [bucket] = url.hostname.split(".");
  const path = ["img", bucket, url.pathname.replace(/^\//, "")].join("/");
  const params = new URLSearchParams({
    dpr: String(2),
    width: String(width),
    s: "none",
  });
  console.log(path);
  return new URL(`${path}?${params.toString()}`, "https://i.guim.co.uk").href;
};

/** @param {NonNullable<import("./capi.js").Search["response"]["results"][number]["elements"]>} elements */
const get_images = (elements) =>
  elements.filter(({ relation }) => relation !== "thumbnail")
    .flatMap(({ assets }) => {
      const asset = assets.find((asset) => asset.file.includes("/master/"));
      return asset ? [asset.file] : [];
    });

export { get_images, resized, width };
