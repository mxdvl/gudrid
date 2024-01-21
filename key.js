const key = document.querySelector("input") ?? document.createElement("input");

document.addEventListener("DOMContentLoaded", () => {
  const value = localStorage.getItem("key");
  if (value !== null && value.length > 0) {
    key.value = value;
  }
});

export { key };
