import { base, search } from "./capi.js";

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {string} options.key
 */
async function* future({ tag, date, key }) {
  /** @param {Date} date */
  const get_url = (date) => {
    const params = new URLSearchParams({
      tag,
      "order-by": "oldest",
      "from-date": date.toISOString().slice(0, 10),
      "to-date": "3000-12-31",
      "page-size": String(12),
      "show-elements": ["image", "cartoon"].join(","), // maybe `all`
      "api-key": key,
    });

    return new URL(`/search?${params.toString()}`, base);
  };

  const { response } = await fetch(get_url(date), { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => search(json));

  const after = response.results.filter(
    ({ webPublicationDate }) => webPublicationDate > date,
  );

  while (after.length > 0) {
    const next = after.shift();
    if (!next) return;
    if (after.length === 0) {
      const date = next.webPublicationDate;
      const { response } = await fetch(
        get_url(date),
        { "mode": "cors" },
      )
        .then((response) => response.json())
        .then((json) => search(json));

      after.push(...response.results
        .filter(({ webPublicationDate }) => webPublicationDate < date));
    }

    yield next;
  }
}

/**
 * @param {object} options
 * @param {string} options.tag
 * @param {Date} options.date
 * @param {string} options.key
 */
async function* past({ tag, date, key }) {
  /** @param {Date} date */
  const get_url = (date) => {
    const params = new URLSearchParams({
      tag,
      "order-by": "newest",
      "from-date": "1000-01-01",
      "to-date": date.toISOString().slice(0, 10),
      "page-size": String(60),
      "show-elements": ["image", "cartoon"].join(","), // maybe `all`
      "api-key": key,
    });

    return new URL(`/search?${params.toString()}`, base);
  };

  const { response } = await fetch(get_url(date), { "mode": "cors" })
    .then((response) => response.json())
    .then((json) => search(json));

  const before = response.results
    .filter(({ webPublicationDate }) => webPublicationDate < date);

  while (before.length > 0) {
    const next = before.shift();
    if (!next) return;
    if (before.length === 0) {
      const date = next.webPublicationDate;
      const { response } = await fetch(
        get_url(date),
        { "mode": "cors" },
      )
        .then((response) => response.json())
        .then((json) => search(json));

      before.push(...response.results
        .filter(({ webPublicationDate }) => webPublicationDate < date));
    }

    yield next;
  }
}

export { future, past };
