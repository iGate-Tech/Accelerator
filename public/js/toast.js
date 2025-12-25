// eslint-disable-next-line no-unused-vars
function showToast(message, type = "info") {
  const container = document.querySelector(".toast-container");
  if (!container) {
    const newContainer = document.createElement("div");
    newContainer.className = "toast-container";
    document.body.appendChild(newContainer);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${message} <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
  document.querySelector(".toast-container").appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
