/** @satisfies {import("./capi.js").Content} */
const default_content = {
  status: "ok",
  total: 1,
  content: {
    elements: [],
    webPublicationDate: new Date(),
    id: "",
    type: "",
    webTitle: "",
    tags: [],
    webUrl: new URL("https://www.theguardian.com"),
  },
};

export { default_content };
