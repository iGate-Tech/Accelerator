/**
 * Accelerator Frontend Framework
 * Base JavaScript utilities for common interactions, HTMX integration, and UI enhancements
 */

// Global app namespace
window.Accelerator = window.Accelerator || {};

// Core utilities
Accelerator.Utils = {
  /**
   * Debounce function calls
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  },

  /**
   * Throttle function calls
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Format currency
   */
  formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
      { label: "second", seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count > 0) {
        return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        return { success: true };
      } catch (fallbackError) {
        return { success: false, error: fallbackError };
      } finally {
        document.body.removeChild(textArea);
      }
    }
  },

  /**
   * Generate a unique ID
   */
  generateId(prefix = "accel") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Smooth scroll to element
   */
  scrollToElement(selector, offset = 0) {
    const element = document.querySelector(selector);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  },

  /**
   * Get form data as object
   */
  getFormData(form) {
    const data = {};
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  },

  /**
   * Set form data from object
   */
  setFormData(form, data) {
    Object.keys(data).forEach((key) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === "checkbox") {
          input.checked = data[key];
        } else if (input.type === "radio") {
          const radio = form.querySelector(
            `[name="${key}"][value="${data[key]}"]`,
          );
          if (radio) radio.checked = true;
        } else {
          input.value = data[key];
        }
      }
    });
  },
};

// HTMX Integration
Accelerator.HTMX = {
  /**
   * Initialize HTMX event listeners
   */
  init() {
    // Global HTMX event listeners
    document.addEventListener(
      "htmx:beforeRequest",
      this.handleBeforeRequest.bind(this),
    );
    document.addEventListener(
      "htmx:afterRequest",
      this.handleAfterRequest.bind(this),
    );
    document.addEventListener(
      "htmx:responseError",
      this.handleResponseError.bind(this),
    );
    document.addEventListener(
      "htmx:beforeSwap",
      this.handleBeforeSwap.bind(this),
    );
  },

  /**
   * Handle before HTMX request
   */
  handleBeforeRequest(event) {
    const target = event.target;

    // Show loading state
    this.showLoading(target);

    // Add CSRF token if needed
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    if (csrfToken && !event.detail.requestConfig.headers["X-CSRF-Token"]) {
      event.detail.requestConfig.headers["X-CSRF-Token"] =
        csrfToken.getAttribute("content");
    }
  },

  /**
   * Handle after HTMX request
   */
  handleAfterRequest(event) {
    const target = event.target;

    // Hide loading state
    this.hideLoading(target);

    // Handle flash messages
    if (event.detail.xhr.status === 200) {
      this.handleFlashMessages(event.detail.xhr);
    }
  },

  /**
   * Handle HTMX response error
   */
  handleResponseError(event) {
    const target = event.target;
    this.hideLoading(target);

    // Show error message
    const errorMessage = event.detail.xhr.responseText || "An error occurred";
    if (window.showErrorToast) {
      window.showErrorToast("Request Failed", errorMessage);
    }
  },

  /**
   * Handle before HTMX swap
   */
  handleBeforeSwap(event) {
    // Handle redirects
    if (event.detail.xhr.status === 302 || event.detail.xhr.status === 301) {
      const redirectUrl = event.detail.xhr.getResponseHeader("HX-Redirect");
      if (redirectUrl) {
        window.location.href = redirectUrl;
        event.preventDefault();
      }
    }
  },

  /**
   * Show loading state on element
   */
  showLoading(element) {
    if (element) {
      element.classList.add("htmx-loading");
      element.style.opacity = "0.7";
      element.style.pointerEvents = "none";
    }
  },

  /**
   * Hide loading state on element
   */
  hideLoading(element) {
    if (element) {
      element.classList.remove("htmx-loading");
      element.style.opacity = "";
      element.style.pointerEvents = "";
    }
  },

  /**
   * Handle flash messages from server response
   */
  handleFlashMessages(xhr) {
    try {
      const responseText = xhr.responseText;
      const parser = new DOMParser();
      const doc = parser.parseFromString(responseText, "text/html");

      // Check for flash messages
      const flashContainer = doc.querySelector("[data-flash-messages]");
      if (flashContainer) {
        const messages = flashContainer.querySelectorAll("[data-flash-type]");
        messages.forEach((messageEl) => {
          const type = messageEl.getAttribute("data-flash-type");
          const message = messageEl.textContent.trim();

          if (message) {
            switch (type) {
              case "success":
                if (window.showSuccessToast)
                  window.showSuccessToast(null, message);
                break;
              case "error":
                if (window.showErrorToast) window.showErrorToast(null, message);
                break;
              case "warning":
                if (window.showWarningToast)
                  window.showWarningToast(null, message);
                break;
              case "info":
                if (window.showInfoToast) window.showInfoToast(null, message);
                break;
            }
          }
        });
      }
    } catch (error) {
      console.warn("Could not parse flash messages:", error);
    }
  },
};

// Form enhancements
Accelerator.Forms = {
  /**
   * Initialize form enhancements
   */
  init() {
    this.initAutoSave();
    this.initValidation();
    this.initAutoComplete();
  },

  /**
   * Initialize auto-save functionality
   */
  initAutoSave() {
    document.addEventListener(
      "input",
      Accelerator.Utils.debounce((event) => {
        const input = event.target;
        if (input.hasAttribute("data-auto-save")) {
          this.autoSave(input);
        }
      }, 1000),
    );
  },

  /**
   * Auto-save form field
   */
  async autoSave(input) {
    const form = input.closest("form");
    if (!form) return;

    const formData = Accelerator.Utils.getFormData(form);
    const endpoint =
      form.getAttribute("data-auto-save-endpoint") || form.action;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Show subtle save indicator
        this.showSaveIndicator(input);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  },

  /**
   * Show save indicator
   */
  showSaveIndicator(input) {
    const indicator = document.createElement("span");
    indicator.className = "save-indicator text-success text-sm ml-2";
    indicator.textContent = "Saved";
    indicator.style.opacity = "0";
    indicator.style.transition = "opacity 0.3s";

    input.parentNode.appendChild(indicator);

    setTimeout(() => {
      indicator.style.opacity = "1";
      setTimeout(() => {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300);
      }, 2000);
    }, 100);
  },

  /**
   * Initialize form validation
   */
  initValidation() {
    document.addEventListener("blur", (event) => {
      const input = event.target;
      if (input.hasAttribute("data-validate")) {
        this.validateField(input);
      }
    });

    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (form.hasAttribute("data-validate")) {
        event.preventDefault();
        if (this.validateForm(form)) {
          form.submit();
        }
      }
    });
  },

  /**
   * Validate single field
   */
  validateField(input) {
    const rules = input.getAttribute("data-validate").split(",");
    let isValid = true;
    let errorMessage = "";

    for (const rule of rules) {
      const [ruleName, ruleValue] = rule.split(":");

      switch (ruleName.trim()) {
        case "required":
          if (!input.value.trim()) {
            isValid = false;
            errorMessage = "This field is required";
          }
          break;
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (input.value && !emailRegex.test(input.value)) {
            isValid = false;
            errorMessage = "Please enter a valid email address";
          }
          break;
        case "min":
          if (input.value.length < parseInt(ruleValue)) {
            isValid = false;
            errorMessage = `Minimum ${ruleValue} characters required`;
          }
          break;
        case "max":
          if (input.value.length > parseInt(ruleValue)) {
            isValid = false;
            errorMessage = `Maximum ${ruleValue} characters allowed`;
          }
          break;
      }

      if (!isValid) break;
    }

    this.showFieldValidation(input, isValid, errorMessage);
    return isValid;
  },

  /**
   * Validate entire form
   */
  validateForm(form) {
    const inputs = form.querySelectorAll("[data-validate]");
    let isValid = true;

    inputs.forEach((input) => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  },

  /**
   * Show field validation result
   */
  showFieldValidation(input, isValid, message) {
    // Remove existing validation classes
    input.classList.remove("border-error", "border-success");

    // Remove existing error message
    const existingError = input.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }

    if (!isValid) {
      input.classList.add("border-error");
      const errorEl = document.createElement("div");
      errorEl.className = "field-error text-error text-sm mt-1";
      errorEl.textContent = message;
      input.parentNode.appendChild(errorEl);
    } else if (input.value.trim()) {
      input.classList.add("border-success");
    }
  },

  /**
   * Initialize autocomplete functionality
   */
  initAutoComplete() {
    document.addEventListener(
      "input",
      Accelerator.Utils.debounce((event) => {
        const input = event.target;
        if (input.hasAttribute("data-autocomplete")) {
          this.handleAutoComplete(input);
        }
      }, 300),
    );
  },

  /**
   * Handle autocomplete for input
   */
  async handleAutoComplete(input) {
    const endpoint = input.getAttribute("data-autocomplete");
    const query = input.value.trim();

    if (query.length < 2) {
      this.hideAutocompleteDropdown(input);
      return;
    }

    try {
      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        this.showAutocompleteDropdown(input, data.suggestions);
      } else {
        this.hideAutocompleteDropdown(input);
      }
    } catch (error) {
      console.error("Autocomplete error:", error);
      this.hideAutocompleteDropdown(input);
    }
  },

  /**
   * Show autocomplete dropdown
   */
  showAutocompleteDropdown(input, suggestions) {
    let dropdown = input.parentNode.querySelector(".autocomplete-dropdown");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className =
        "autocomplete-dropdown absolute z-10 bg-base-100 border border-base-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 w-full";
      input.parentNode.style.position = "relative";
      input.parentNode.appendChild(dropdown);
    }

    dropdown.innerHTML = suggestions
      .map(
        (suggestion) => `
      <div class="autocomplete-item px-3 py-2 hover:bg-base-200 cursor-pointer text-sm" data-value="${suggestion.value}">
        ${suggestion.label}
      </div>
    `,
      )
      .join("");

    // Add click handlers
    dropdown.querySelectorAll(".autocomplete-item").forEach((item) => {
      item.addEventListener("click", () => {
        input.value = item.getAttribute("data-value");
        this.hideAutocompleteDropdown(input);
        input.focus();
      });
    });
  },

  /**
   * Hide autocomplete dropdown
   */
  hideAutocompleteDropdown(input) {
    const dropdown = input.parentNode.querySelector(".autocomplete-dropdown");
    if (dropdown) {
      dropdown.remove();
    }
  },
};

// Modal system
Accelerator.Modal = {
  /**
   * Show modal
   */
  show(content, options = {}) {
    const modalId = options.id || Accelerator.Utils.generateId("modal");
    const size = options.size || "md";
    const closable = options.closable !== false;

    const modalHTML = `
      <div id="${modalId}" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
        <div class="modal-content bg-base-100 rounded-lg shadow-xl max-w-${size === "sm" ? "md" : size === "lg" ? "4xl" : "2xl"} w-full mx-4 max-h-[90vh] overflow-hidden">
          ${closable ? '<button class="modal-close absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10" onclick="Accelerator.Modal.hide(\'' + modalId + "')\">&times;</button>" : ""}
          <div class="modal-body p-6 overflow-y-auto max-h-[80vh]">
            ${content}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add ESC key handler
    if (closable) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.hide(modalId);
        }
      });
    }

    return modalId;
  },

  /**
   * Hide modal
   */
  hide(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 300);
    }
  },

  /**
   * Show confirmation modal
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const content = `
        <div class="text-center">
          <div class="mb-4">
            <svg class="mx-auto h-12 w-12 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p class="text-lg mb-6">${message}</p>
          <div class="flex justify-center space-x-4">
            <button class="btn btn-outline btn-neutral px-6" onclick="this.closest('.modal-overlay').remove(); resolve(false)">Cancel</button>
            <button class="btn btn-primary px-6" onclick="this.closest('.modal-overlay').remove(); resolve(true)">Confirm</button>
          </div>
        </div>
      `;

      const modalId = this.show(content, { size: "sm" });

      // Override the buttons to resolve the promise
      setTimeout(() => {
        const modal = document.getElementById(modalId);
        const cancelBtn = modal.querySelector("button:first-of-type");
        const confirmBtn = modal.querySelector("button:last-of-type");

        cancelBtn.onclick = () => {
          this.hide(modalId);
          resolve(false);
        };

        confirmBtn.onclick = () => {
          this.hide(modalId);
          resolve(true);
        };
      }, 100);
    });
  },
};

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  Accelerator.HTMX.init();
  Accelerator.Forms.init();

  // Add loading class styles
  const style = document.createElement("style");
  style.textContent = `
    .htmx-loading {
      position: relative;
    }
    .htmx-loading::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = Accelerator;
}
