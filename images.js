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

export { resized };
