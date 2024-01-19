import {
  array,
  coerce,
  date,
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
  description: string(),
});

const result = object({
  pillarId,
  id: string(),
  type: string(), // ["tag", "article", "picture", "liveblog"]
  webPublicationDate: coerce(date(), (input) => new Date(input)),
  webTitle: string(),
  tags: optional(array(tag)),
  webUrl: transform(string([url()]), (input) => new URL(input)),
  elements: optional(array(element)),
});

const schema = object({
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

/**
 * @param {unknown} response
 */
export const capi = (response) => parse(schema, response);

/**
 * @param {unknown} response
 */
export const content = (response) => parse(content_schema, response);
