import { ValiError } from "https://esm.sh/valibot@0.36.0";
import { key } from "./key.js";
import { base } from "./capi.js";
import { search } from "./capi.js";

const all_articles = get_all_articles();

const commentable = document.querySelector("ul#commentable");
const non_commentable = document.querySelector("ul#non-commentable");

if (!(commentable instanceof HTMLUListElement)) throw "Invalid UL";
if (!(non_commentable instanceof HTMLUListElement)) throw "Invalid UL";

document.querySelector("button#more")?.addEventListener("click", () => {
  void append(120);
});

const append = async (count = 120) => {
  const { done, value } = await all_articles.next();
  if (done || !value) return;
  const target = value.commentable ? commentable : non_commentable;
  target.append(
    create_li({
      url: new URL(
        `https://www.theguardian.com/${value.id}`,
      ),
      title: value.id,
    }),
  );

  if (target.previousSibling) {
    target.previousSibling.nodeValue = String(target.children.length);
  }
  if (count > 0) await append(count - 1);
};

/** @type {
  ()
=>
  AsyncGenerator<{id: string, commentable: boolean}>
} */
async function* get_all_articles() {
  let { next_page, results } = await get_articles(1);

  while (next_page) {
    yield* results;

    ({ next_page, results } = await get_articles(next_page));
  }
}

/** @type {
  (page?: number)
=>
  Promise<{
    results: Array<{ id: string, commentable: boolean }>
    next_page: number | undefined
  }>
} */
async function get_articles(page = 1) {
  const params = new URLSearchParams({
    "api-key": key,
    "page": String(page),
    pageSize: String(200),
    "show-fields": ["commentable"].join(","),
  });

  const url = new URL(`search?${params.toString()}`, base);
  3;

  const { currentPage, results, pages } = await fetch(url, {
    "mode": "cors",
  })
    .then((response) => response.json())
    .then((json) => search(json))
    .catch((error) => {
      if (error instanceof ValiError) {
        console.error(error.issues);
      }
      return /** @satisfies {import('./capi.js').Atoms} */ ({
        status: "ok",
        currentPage: 1,
        pages: 1,
        total: 0,
        results: [],
      });
    });

  return {
    results: results.map(({ id, fields }) => ({
      id,
      commentable: !!fields?.commentable,
    })),
    next_page: currentPage < pages ? currentPage + 1 : undefined,
  };
}

/** @type {
  (interactive: Readonly<{
    url: Readonly<URL>,
    title: string,
  }>)
=>
  HTMLLIElement
} */
function create_li(article) {
  const li = document.createElement("li");
  li.innerHTML = `<a href="${article.url}">${article.title}</a>`;
  return li;
}
