const key = new URLSearchParams(location.search).get("api-key") ??
  localStorage.getItem("api-key") ?? "test";

const input = document.getElementsByTagName("input").namedItem("api-key");

if (input) {
  input.value = key;

  input.addEventListener("input", () => {
    localStorage.setItem("api-key", input.value);
  });
}

export { key };
