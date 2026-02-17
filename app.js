const form = document.getElementById("review-form");
const reviewsList = document.getElementById("reviews");
const filterSelect = document.getElementById("filter-rating");
const template = document.getElementById("review-item-template");
const installButton = document.getElementById("install-btn");

const STORAGE_KEY = "bbq-reviews";

const starterReviews = [
  {
    spot: "Oak & Ember BBQ",
    dish: "Brisket Sandwich",
    rating: 5,
    notes: "Incredible bark, perfectly rendered fat, and tangy pickles.",
    createdAt: new Date().toISOString(),
  },
  {
    spot: "Hickory Haven",
    dish: "Pulled Pork Plate",
    rating: 4,
    notes: "Great smoke flavor and generous portions. Slaw was super fresh.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let deferredInstallPrompt = null;

function loadReviews() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return starterReviews;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : starterReviews;
  } catch {
    return starterReviews;
  }
}

let reviews = loadReviews();

function saveReviews() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function renderReviews() {
  const filter = filterSelect.value;
  reviewsList.innerHTML = "";

  const visible = reviews.filter((review) =>
    filter === "all" ? true : String(review.rating) === filter,
  );

  if (visible.length === 0) {
    reviewsList.innerHTML = "<li>No reviews match this filter yet.</li>";
    return;
  }

  visible
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((review) => {
      const node = template.content.cloneNode(true);
      node.querySelector("h3").textContent = review.spot;
      node.querySelector(".dish").textContent = `Dish: ${review.dish}`;
      node.querySelector(".notes").textContent = review.notes;
      node.querySelector(".stars").textContent = "★".repeat(review.rating);
      node.querySelector(".date").textContent = new Date(
        review.createdAt,
      ).toLocaleString();
      reviewsList.appendChild(node);
    });
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const newReview = {
    spot: form.spot.value.trim(),
    dish: form.dish.value.trim(),
    rating: Number(form.rating.value),
    notes: form.notes.value.trim() || "No notes added.",
    createdAt: new Date().toISOString(),
  };

  if (!newReview.spot || !newReview.dish) return;

  reviews.push(newReview);
  saveReviews();
  renderReviews();
  form.reset();
  form.spot.focus();
});

filterSelect.addEventListener("change", renderReviews);

setupInstallPrompt();
registerServiceWorker();
renderReviews();
