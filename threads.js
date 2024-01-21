import { base, search } from "./capi.js";

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {'past' | 'future'} options.direction
 * @param {string} options.key
 */
async function* follow({ tag, date, direction, key }) {
  const dates = direction === "past"
    ? {
      "from-date": "1000-01-01",
      "to-date": date.toISOString().slice(0, 10),
    }
    : {
      "from-date": date.toISOString().slice(0, 10),
      "to-date": "3000-12-31",
    };

  const params = new URLSearchParams({
    tag,
    "order-by": direction === "past" ? "newest" : "oldest",
    ...dates,
    "page-size": String(12),
    "show-elements": ["image", "cartoon"].join(","), // maybe `all`
    "api-key": key,
  });

  const url = new URL(`/search?${params.toString()}`, base);

  const { response } = await fetch(url, { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => search(json));

  /** @type {(result: typeof response["results"][number])=> boolean} */
  const isBefore = ({ webPublicationDate }) => webPublicationDate < date;
  /** @type {(result: typeof response["results"][number])=> boolean} */
  const isAfter = ({ webPublicationDate }) => webPublicationDate > date;

  let count = 0;
  for (
    const result of response.results.filter(
      direction === "past" ? isBefore : isAfter,
    )
  ) {
    if (count > 6) return;
    count++;
    yield result;
  }
}

export { follow };
