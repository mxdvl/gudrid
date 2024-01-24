/** @type {HTMLInputElement} */
const key = document.querySelector("input#key") ??
  document.createElement("input");

const value = localStorage.getItem("key");
if (value !== null && value.length > 0) {
  key.value = value;
}

export { key };
