import { base, search } from "./capi.js";

/** @typedef {import('./capi.js').Search["response"]["results"][number]} Article */

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {string} options.key
 * @param {'future' | 'past'} options.direction
 */
const fetch_content = async ({
  date,
  direction,
  key,
  tag,
}) => {
  const dates = direction === "future"
    ? {
      "order-by": "oldest",
      "from-date": date.toISOString().slice(0, 10),
      "to-date": "3000-12-31",
    }
    : {
      "order-by": "newest",
      "from-date": "1000-01-01",
      "to-date": date.toISOString().slice(0, 10),
    };

  const params = new URLSearchParams({
    ...dates,
    tag,
    "page-size": String(60),
    "show-elements": ["image", "cartoon"].join(","), // maybe `all`
    "api-key": key,
  });

  const url = new URL(`/search?${params.toString()}`, base);

  const { total, results } = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => search(json).response)
    .catch(() => ({
      total: 0,
      results: /** @type {Article[]} */ ([]),
    }));

  const { before, after, same } = results.reduce((accumulator, result) => {
    if (result.webPublicationDate === date) accumulator.same.push(result);
    if (result.webPublicationDate < date) accumulator.before.push(result);
    if (result.webPublicationDate > date) accumulator.after.push(result);
    return accumulator;
  }, {
    before: /** @type {Article[]} */ ([]),
    after: /** @type {Article[]} */ ([]),
    same: /** @type {Article[]} */ ([]),
  });

  console.info({ total, after, before, same });

  const count = total - same.length -
    (direction === "future" ? before.length : after.length);

  return { articles: direction === "future" ? after : before, count };
};

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {string} options.key
 * @param {'future' | 'past'} options.direction
 */
async function* follow({ tag, date, key, direction }) {
  const { articles, count } = await fetch_content({
    date,
    key,
    tag,
    direction,
  });

  while (articles.length > 0) {
    const article = articles.shift();
    if (!article) return;
    if (articles.length === 0) {
      articles.push(
        ...await fetch_content({
          date: article.webPublicationDate,
          key,
          tag,
          direction,
        }).then(({ articles }) => articles),
      );
    }

    yield { article, count };
  }
}

export { follow };
