/* global URLSearchParams, clearTimeout */

// explore-idea.js - Handle search, filter, sort for explore ideas page

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  function updateFilters() {
    const search = searchInput.value.trim();
    const category = categoryFilter.value;
    const sort = sortSelect.value;

    const params = new URLSearchParams();
    if (search) {
      params.set("search", search);
    }
    if (category) {
      params.set("category", category);
    }
    if (sort && sort !== "newest") {
      params.set("sort", sort); // newest is default
    }

    const query = params.toString();
    window.location.href = "/explore-idea" + (query ? "?" + query : "");
  }

  // Add event listeners
  searchInput.addEventListener("input", debounce(updateFilters, 300)); // debounce for search
  categoryFilter.addEventListener("change", updateFilters);
  sortSelect.addEventListener("change", updateFilters);

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});
