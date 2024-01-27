import {
  array,
  literal,
  number,
  object,
  optional,
  parse,
  picklist,
  string,
  transform,
  url,
} from "https://esm.sh/valibot@0.26.0";

const pillarId = optional(picklist([
  "pillar/news",
  "pillar/opinion",
  "pillar/sport",
  "pillar/lifestyle",
  "pillar/arts",
]));

const element = object({
  id: string(),
  relation: string(),
  type: string(),
  assets: array(object({
    type: string(),
    file: string(),
    // typeData: object({}),
  })),
});

const tag = object({
  id: string(),
  type: string(),
  // sectionId: string(),
  webTitle: string(),
  description: optional(string(), ""),
});

const result = object({
  pillarId,
  id: string(),
  type: string(), // ["tag", "article", "picture", "liveblog"]
  webPublicationDate: transform(string(), (input) => new Date(input)),
  webTitle: string(),
  tags: optional(array(tag), []),
  webUrl: transform(string([url()]), (input) => new URL(input)),
  elements: optional(array(element), []),
});

const search_schema = object({
  response: object({
    status: literal("ok"),
    currentPage: number(),
    pages: number(),
    pageSize: number(),
    total: number(),
    results: array(result),
  }),
});

const content_schema = object({
  response: object({
    status: literal("ok"),
    total: literal(1),
    content: result,
  }),
});

/** @typedef {ReturnType<typeof search>} Search */
/**
 * @param {unknown} response
 */
const search = (response) => parse(search_schema, response);

/** @typedef {ReturnType<typeof content>} Content */
/**
 * @param {unknown} response
 */
const content = (response) => parse(content_schema, response);

const base = "https://content.guardianapis.com/";

export { base, content, search };
