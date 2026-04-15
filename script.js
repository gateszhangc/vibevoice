const topbar = document.querySelector("[data-topbar]");
const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const wallpaperCards = Array.from(document.querySelectorAll(".wallpaper-card"));
const resultsCount = document.querySelector("[data-results-count]");
const yearNode = document.querySelector("#current-year");

const updateResults = (filter) => {
  let visible = 0;

  wallpaperCards.forEach((card) => {
    const tags = (card.dataset.tags || "").split(" ");
    const matches = filter === "all" || tags.includes(filter);
    card.hidden = !matches;
    if (matches) visible += 1;
  });

  if (resultsCount) {
    resultsCount.textContent = `Showing ${visible} wallpaper${visible === 1 ? "" : "s"}`;
  }
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((entry) => entry.classList.remove("is-active"));
    button.classList.add("is-active");
    updateResults(button.dataset.filter || "all");
  });
});

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const handleScroll = () => {
  if (!topbar) return;
  topbar.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", handleScroll, { passive: true });
handleScroll();
updateResults("all");
