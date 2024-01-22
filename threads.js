import { base, search } from "./capi.js";

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

  const results = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => search(json).response.results)
    .catch(() => []);

  /** @type {(result: typeof results[number])=> boolean} */
  const isBefore = ({ webPublicationDate }) => webPublicationDate < date;
  /** @type {(result: typeof results[number])=> boolean} */
  const isAfter = ({ webPublicationDate }) => webPublicationDate > date;

  return results.filter(direction === "future" ? isAfter : isBefore);
};

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {string} options.key
 * @param {'future' | 'past'} options.direction
 */
async function* follow({ tag, date, key, direction }) {
  const after = await fetch_content({ date, key, tag, direction });

  while (after.length > 0) {
    const next = after.shift();
    if (!next) return;
    if (after.length === 0) {
      after.push(
        ...await fetch_content({
          date: next.webPublicationDate,
          key,
          tag,
          direction,
        }),
      );
    }

    yield next;
  }
}

export { follow };
