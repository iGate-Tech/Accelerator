/**
 * Accelerator Form Auto-Fill System
 * Intelligent form completion with AI suggestions
 */

Accelerator.AutoFill = {
  /**
   * Initialize auto-fill system
   */
  init() {
    this.bindAutoFillTriggers();
    this.initSmartSuggestions();
  },

  /**
   * Bind auto-fill triggers
   */
  bindAutoFillTriggers() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-autofill-trigger]");
      if (trigger) {
        event.preventDefault();
        this.handleAutoFillTrigger(trigger);
      }
    });

    // Auto-fill on input focus for certain fields
    document.addEventListener("focusin", (event) => {
      const input = event.target;
      if (input.hasAttribute("data-autofill-on-focus")) {
        this.handleAutoFillOnFocus(input);
      }
    });
  },

  /**
   * Handle auto-fill trigger click
   */
  async handleAutoFillTrigger(trigger) {
    const form = trigger.closest("form");
    const endpoint = trigger.getAttribute("data-autofill-trigger");
    const action = trigger.getAttribute("data-autofill-action") || "suggest";

    if (!form || !endpoint) return;

    // Show loading state
    trigger.classList.add("htmx-loading");
    trigger.disabled = true;
    const originalText = trigger.textContent;
    trigger.textContent = "Generating...";

    try {
      const formData = Accelerator.Utils.getFormData(form);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          action,
          context: trigger.getAttribute("data-context") || "",
        }),
      });

      const data = await response.json();

      if (data.success && data.suggestions) {
        this.applySuggestions(form, data.suggestions);

        if (window.showSuccessToast) {
          window.showSuccessToast(
            "Auto-Fill Complete",
            `Applied ${Object.keys(data.suggestions).length} suggestion(s)`,
          );
        }
      } else {
        throw new Error(data.error || "Auto-fill failed");
      }
    } catch (error) {
      console.error("Auto-fill error:", error);
      if (window.showErrorToast) {
        window.showErrorToast("Auto-Fill Failed", error.message);
      }
    } finally {
      // Reset loading state
      trigger.classList.remove("htmx-loading");
      trigger.disabled = false;
      trigger.textContent = originalText;
    }
  },

  /**
   * Handle auto-fill on focus
   */
  async handleAutoFillOnFocus(input) {
    const form = input.closest("form");
    if (!form) return;

    // Only trigger if input is empty or has minimal content
    if (input.value.trim().length > 10) return;

    const endpoint = input.getAttribute("data-autofill-on-focus");
    const fieldName = input.getAttribute("data-field-name") || input.name;

    try {
      const formData = Accelerator.Utils.getFormData(form);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          field: fieldName,
          action: "field_suggestion",
        }),
      });

      const data = await response.json();

      if (data.success && data.suggestion && data.suggestion[fieldName]) {
        const suggestion = data.suggestion[fieldName];

        // Show suggestion as placeholder or subtle hint
        if (!input.value.trim()) {
          input.placeholder = `Suggestion: ${suggestion}`;
          input.classList.add("has-suggestion");

          // Allow user to accept suggestion with Tab or Enter
          const acceptSuggestion = () => {
            if (input.placeholder.startsWith("Suggestion: ")) {
              input.value = input.placeholder.replace("Suggestion: ", "");
              input.placeholder =
                input.getAttribute("data-original-placeholder") || "";
              input.classList.remove("has-suggestion");
            }
          };

          const handleKeyDown = (e) => {
            if (e.key === "Tab" || e.key === "Enter") {
              e.preventDefault();
              acceptSuggestion();
            }
          };

          input.addEventListener("keydown", handleKeyDown, { once: true });

          // Clear suggestion after 10 seconds
          setTimeout(() => {
            if (input.placeholder.startsWith("Suggestion: ")) {
              input.placeholder =
                input.getAttribute("data-original-placeholder") || "";
              input.classList.remove("has-suggestion");
            }
          }, 10000);
        }
      }
    } catch (error) {
      console.error("Field auto-fill error:", error);
    }
  },

  /**
   * Apply suggestions to form
   */
  applySuggestions(form, suggestions) {
    Object.keys(suggestions).forEach((fieldName) => {
      const input =
        form.querySelector(`[name="${fieldName}"]`) ||
        form.querySelector(`[data-field-name="${fieldName}"]`);

      if (input) {
        const currentValue = input.value.trim();
        const suggestion = suggestions[fieldName];

        // Only apply if field is empty or user confirms
        if (!currentValue) {
          input.value = suggestion;
          this.showFieldHighlight(input, "success");
        } else if (currentValue !== suggestion) {
          // Show suggestion modal for non-empty fields
          this.showSuggestionModal(input, suggestion);
        }
      }
    });
  },

  /**
   * Show suggestion modal for user confirmation
   */
  showSuggestionModal(input, suggestion) {
    const modalContent = `
      <div class="suggestion-modal">
        <h3 class="text-lg font-semibold mb-4">AI Suggestion</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Current Value:</label>
          <div class="bg-base-200 p-3 rounded border text-sm">${input.value}</div>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">Suggested Value:</label>
          <div class="bg-success/10 border border-success/20 p-3 rounded text-sm">${suggestion}</div>
        </div>
        <div class="flex justify-end space-x-3">
          <button class="btn btn-outline btn-neutral px-4 py-2" onclick="Accelerator.Modal.hide('${Accelerator.Utils.generateId("modal")}')">Keep Current</button>
          <button class="btn btn-primary px-4 py-2" onclick="this.applySuggestion('${input.name}', '${suggestion.replace(/'/g, "\\'")}')">Apply Suggestion</button>
        </div>
      </div>
    `;

    const modalId = Accelerator.Modal.show(modalContent, { size: "md" });

    // Add apply suggestion method to button
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      const applyBtn = modal.querySelector("button:last-child");
      applyBtn.applySuggestion = (fieldName, value) => {
        const targetInput = document.querySelector(`[name="${fieldName}"]`);
        if (targetInput) {
          targetInput.value = value;
          this.showFieldHighlight(targetInput, "success");
          Accelerator.Modal.hide(modalId);
        }
      };
    }, 100);
  },

  /**
   * Show field highlight effect
   */
  showFieldHighlight(input, type) {
    input.classList.add(`highlight-${type}`);

    // Add subtle animation
    input.style.transition = "all 0.3s ease";
    input.style.transform = "scale(1.02)";

    setTimeout(() => {
      input.style.transform = "scale(1)";
      setTimeout(() => {
        input.classList.remove(`highlight-${type}`);
      }, 300);
    }, 200);
  },

  /**
   * Initialize smart suggestions
   */
  initSmartSuggestions() {
    // Smart category suggestions based on description
    this.initCategorySuggestions();

    // Smart tag suggestions
    this.initTagSuggestions();

    // Smart title generation
    this.initTitleSuggestions();
  },

  /**
   * Initialize category suggestions
   */
  initCategorySuggestions() {
    document.addEventListener(
      "input",
      Accelerator.Utils.debounce((event) => {
        const input = event.target;
        if (
          input.name === "description" ||
          input.getAttribute("data-field-name") === "description"
        ) {
          this.suggestCategory(input);
        }
      }, 1000),
    );
  },

  /**
   * Suggest category based on description
   */
  async suggestCategory(descriptionInput) {
    const form = descriptionInput.closest("form");
    const categoryInput =
      form.querySelector('[name="category"]') ||
      form.querySelector('[data-field-name="category"]');

    if (!categoryInput || categoryInput.value.trim()) return;

    const description = descriptionInput.value.trim();
    if (description.length < 20) return;

    try {
      const response = await fetch("/api/ai/generate-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (data.success && data.category) {
        // Show subtle suggestion
        categoryInput.placeholder = `Suggested: ${data.category}`;
        categoryInput.classList.add("has-suggestion");

        // Allow quick acceptance
        const acceptHandler = () => {
          if (categoryInput.placeholder.startsWith("Suggested: ")) {
            categoryInput.value = categoryInput.placeholder.replace(
              "Suggested: ",
              "",
            );
            categoryInput.placeholder = "";
            categoryInput.classList.remove("has-suggestion");
          }
        };

        categoryInput.addEventListener("focus", acceptHandler, { once: true });
      }
    } catch (error) {
      console.error("Category suggestion error:", error);
    }
  },

  /**
   * Initialize tag suggestions
   */
  initTagSuggestions() {
    document.addEventListener("blur", (event) => {
      const input = event.target;
      if (
        input.name === "description" &&
        !input.closest("form").querySelector('[name="tags"]')?.value.trim()
      ) {
        this.suggestTags(input);
      }
    });
  },

  /**
   * Suggest tags based on description
   */
  async suggestTags(descriptionInput) {
    const form = descriptionInput.closest("form");
    const tagsInput =
      form.querySelector('[name="tags"]') ||
      form.querySelector('[data-field-name="tags"]');

    if (!tagsInput || tagsInput.value.trim()) return;

    const description = descriptionInput.value.trim();
    if (description.length < 30) return;

    try {
      const response = await fetch("/api/ai/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (data.success && data.tags && data.tags.length > 0) {
        const suggestedTags = data.tags.join(", ");

        // Create suggestion UI
        const suggestionEl = document.createElement("div");
        suggestionEl.className =
          "tag-suggestion mt-2 p-3 bg-info/10 border border-info/20 rounded-lg text-sm";
        suggestionEl.innerHTML = `
          <div class="flex items-center justify-between">
            <span><strong>Suggested tags:</strong> ${suggestedTags}</span>
            <button class="apply-tags btn btn-xs btn-info ml-2" data-tags="${suggestedTags}">Apply</button>
          </div>
        `;

        // Remove existing suggestion
        const existing = tagsInput.parentNode.querySelector(".tag-suggestion");
        if (existing) existing.remove();

        tagsInput.parentNode.appendChild(suggestionEl);

        // Handle apply button
        suggestionEl
          .querySelector(".apply-tags")
          .addEventListener("click", () => {
            tagsInput.value = suggestedTags;
            suggestionEl.remove();
            this.showFieldHighlight(tagsInput, "success");
          });

        // Auto-remove after 15 seconds
        setTimeout(() => {
          if (suggestionEl.parentNode) {
            suggestionEl.remove();
          }
        }, 15000);
      }
    } catch (error) {
      console.error("Tag suggestion error:", error);
    }
  },

  /**
   * Initialize title suggestions
   */
  initTitleSuggestions() {
    document.addEventListener("blur", (event) => {
      const input = event.target;
      if (input.name === "description") {
        this.suggestTitle(input);
      }
    });
  },

  /**
   * Suggest title based on description
   */
  async suggestTitle(descriptionInput) {
    const form = descriptionInput.closest("form");
    const titleInput =
      form.querySelector('[name="title"]') ||
      form.querySelector('[data-field-name="title"]');

    if (!titleInput || titleInput.value.trim()) return;

    const description = descriptionInput.value.trim();
    if (description.length < 50) return;

    try {
      const response = await fetch("/api/ai/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (data.success && data.title) {
        // Show title suggestion
        const suggestionEl = document.createElement("div");
        suggestionEl.className =
          "title-suggestion mt-2 p-3 bg-success/10 border border-success/20 rounded-lg text-sm";
        suggestionEl.innerHTML = `
          <div class="flex items-center justify-between">
            <span><strong>Suggested title:</strong> "${data.title}"</span>
            <button class="apply-title btn btn-xs btn-success ml-2" data-title="${data.title.replace(/"/g, "&quot;")}">Apply</button>
          </div>
        `;

        // Remove existing suggestion
        const existing =
          titleInput.parentNode.querySelector(".title-suggestion");
        if (existing) existing.remove();

        titleInput.parentNode.appendChild(suggestionEl);

        // Handle apply button
        suggestionEl
          .querySelector(".apply-title")
          .addEventListener("click", () => {
            const title = suggestionEl
              .querySelector(".apply-title")
              .getAttribute("data-title");
            titleInput.value = title;
            suggestionEl.remove();
            this.showFieldHighlight(titleInput, "success");
          });

        // Auto-remove after 20 seconds
        setTimeout(() => {
          if (suggestionEl.parentNode) {
            suggestionEl.remove();
          }
        }, 20000);
      }
    } catch (error) {
      console.error("Title suggestion error:", error);
    }
  },
};

// Initialize auto-fill system
document.addEventListener("DOMContentLoaded", () => {
  Accelerator.AutoFill.init();
});
