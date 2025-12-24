import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lucideStatic = require("lucide-static");

// Lazy loading icon cache
const iconCache = new Map();
const loadedIcons = new Set();

// Preload most frequently used icons for better performance
const preloadIcons = [
  "check-circle",
  "plus",
  "trending-up",
  "lightbulb",
  "star",
  "x",
  "users",
  "sparkles",
  "zap",
  "wand-sparkles",
];

// Initialize preload icons
preloadIcons.forEach((iconName) => {
  const capitalizedName =
    iconName.charAt(0).toUpperCase() +
    iconName.slice(1).replace(/-./g, (match) => match[1].toUpperCase());
  if (lucideStatic[capitalizedName]) {
    loadedIcons.add(iconName);
  }
});
const moment = require("moment");
import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create a DOM window for DOMPurify
const window = new JSDOM("").window;
const DOMPurifyServer = DOMPurify(window);

export default {
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  and: (a, b) => a && b,
  or: (a, b) => a || b,
  not: (a) => !a,

  // HTMX helpers
  "hx-get": (url) => `hx-get="${url}"`,
  "hx-post": (url) => `hx-post="${url}"`,
  "hx-target": (target) => `hx-target="${target}"`,
  "hx-swap": (swap) => `hx-swap="${swap}"`,

  // Conditional classes
  "class-if": (condition, className) => (condition ? className : ""),

  // JSON helpers
  json: (context) => JSON.stringify(context),
  jsonParse: (str) => {
    if (!str) return {};
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error("JSON parse error:", e);
      return {};
    }
  },

  // Array helper
  array: (...args) => args.slice(0, -1),

  // Lookup helper for dynamic property access
  lookup: (obj, key) => obj && obj[key],

  // Range helper (creates array from start to end inclusive)
  range: (start, end) => {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  },

  // Math helpers
  divide: (a, b) => (b !== 0 ? a / b : 0),
  multiply: (a, b) => a * b,
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,

  // Length helper
  len: (arr) => (Array.isArray(arr) ? arr.length : 0),

  // Helper function to format individual section content
  formatSectionContentHelper: (content) => {
    if (!content) return "";

    // Convert line breaks to paragraphs
    let formatted = content
      // Convert bullet points
      .replace(/^•\s*/gm, "<li>")
      .replace(/^-\s*/gm, "<li>")
      // Handle numbered lists
      .replace(/^\d+\.\s*/gm, "<li>")
      // Convert paragraphs (double line breaks)
      .split(/\n\s*\n/)
      .map((paragraph) => {
        paragraph = paragraph.trim();
        if (!paragraph) return "";

        // Check if it's a list
        if (paragraph.includes("<li>")) {
          return `<ul class="list-disc list-inside space-y-1 mb-4">${paragraph}</ul>`;
        }

        // Check if it's a numbered list
        if (paragraph.match(/^\d+\./m)) {
          return `<ol class="list-decimal list-inside space-y-1 mb-4">${paragraph.replace(/^\d+\.\s*/gm, "<li>")}</ol>`;
        }

        // Regular paragraph
        return `<p class="mb-4 leading-relaxed text-gray-700">${paragraph}</p>`;
      })
      .join("");

    // Handle bold text (**text** or *text*)
    formatted = formatted.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-gray-900">$1</strong>',
    );
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Handle dollar amounts and numbers
    formatted = formatted.replace(
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      '<span class="font-semibold text-green-600">$$$1</span>',
    );

    return formatted;
  },

  // Format report content helper
  formatReportContent: (content) => {
    if (!content) return "<p>No content available</p>";

    // Split content by main sections (assuming sections are marked with numbers or headers)
    const sections = content.split(
      /\n(?=\d+\.|EXECUTIVE SUMMARY|COMPANY DESCRIPTION|MARKET ANALYSIS|COMPETITIVE ANALYSIS|MARKETING|FINANCIAL|TEAM|BUSINESS MODEL|TECHNICAL|LEGAL|OPERATIONAL|RISK|VALUATION|CONCLUSION|CLOSING)/i,
    );

    let formattedContent = "";

    sections.forEach((section) => {
      if (section.trim()) {
        // Check if it's a main section header
        if (
          /^\d+\.|EXECUTIVE SUMMARY|COMPANY DESCRIPTION|MARKET ANALYSIS|COMPETITIVE ANALYSIS|MARKETING|FINANCIAL|TEAM|BUSINESS MODEL|TECHNICAL|LEGAL|OPERATIONAL|RISK|VALUATION|CONCLUSION|CLOSING/i.test(
            section,
          )
        ) {
          // Main section header
          const headerMatch = section.match(/^(.+?)(?:\n|$)/);
          if (headerMatch) {
            const header = headerMatch[1].trim();
            const content = section.substring(header.length).trim();

            formattedContent += `
              <section class="mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">${header}</h2>
                <div class="prose prose-gray max-w-none">
                  ${this.formatSectionContentHelper(content)}
                </div>
              </section>
            `;
          }
        } else if (section.trim()) {
          // Regular content section
          formattedContent += `
            <section class="mb-6">
              <div class="prose prose-gray max-w-none">
                ${this.formatSectionContentHelper(section)}
              </div>
            </section>
          `;
        }
      }
    });

    return formattedContent;
  },

  // Conditional helper
  cond: (condition, trueVal, falseVal) => (condition ? trueVal : falseVal),

  // Status class helper
  statusClass: (status) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "reported":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  },

  // Concat helper
  concat: (...args) => args.slice(0, -1).join(""),

  // Capitalize helper
  capitalize: (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : ""),

  // First name helper
  firstName: (fullName) => {
    if (!fullName || typeof fullName !== "string") return "";
    const firstName = fullName.trim().split(" ")[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1);
  },

  // Date formatting
  formatDate: (date, format = "short") => {
    if (!date) return "";
    const d = new Date(date);
    if (format === "time") {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  // Moment.js helper for advanced date formatting
  moment: (date, options) => {
    if (!date) return "";
    const m = moment(date);
    const format = options.hash.format || "MMM D, YYYY";
    if (format === "fromNow") {
      return m.fromNow();
    }
    return m.format(format);
  },

  // Truncate text helper
  truncate: (text, length) => {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  },

  icon: function (name, options) {
    if (!name || typeof name !== "string") return "";

    // Check cache first for processed icons
    const cacheKey = `${name}-${JSON.stringify(options.hash || {})}`;
    if (iconCache.has(cacheKey)) {
      return iconCache.get(cacheKey);
    }

    const capitalizedName =
      name.charAt(0).toUpperCase() +
      name.slice(1).replace(/-./g, (match) => match[1].toUpperCase());

    // Lazy load icon if not already loaded
    if (!loadedIcons.has(name)) {
      if (!lucideStatic[capitalizedName]) {
        console.log(`Icon not found: ${capitalizedName} (original: ${name})`);
        const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-off-icon lucide-circle-off"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>`;
        iconCache.set(cacheKey, errorSvg);
        return errorSvg;
      }
      loadedIcons.add(name);
    }

    let svg = lucideStatic[capitalizedName];
    const attrs = options.hash || {};
    const className = attrs.class || "";
    const size = attrs.size || 24;
    const fill = attrs.fill;
    const stroke = attrs.stroke;
    const id = attrs.id;

    // Apply transformations
    svg = svg.replace(/width="[^"]*"/, `width="${size}"`);
    svg = svg.replace(/height="[^"]*"/, `height="${size}"`);

    if (className) {
      if (svg.includes('class="')) {
        svg = svg.replace(/(class="[^"]*)"/, `$1 ${className}"`);
      } else {
        svg = svg.replace("<svg", `<svg class="${className}"`);
      }
    }

    if (id) {
      svg = svg.replace("<svg", `<svg id="${id}"`);
    }

    if (fill !== undefined) {
      svg = svg.replace(/fill="[^"]*"/, `fill="${fill}"`);
    }
    if (stroke !== undefined) {
      svg = svg.replace(/stroke="[^"]*"/, `stroke="${stroke}"`);
    }

    // Cache the processed icon
    iconCache.set(cacheKey, svg);
    return svg;
  },

  // Icon performance utilities
  preloadIcon: function (name) {
    if (!name || typeof name !== "string") return false;
    const capitalizedName =
      name.charAt(0).toUpperCase() +
      name.slice(1).replace(/-./g, (match) => match[1].toUpperCase());
    if (lucideStatic[capitalizedName] && !loadedIcons.has(name)) {
      loadedIcons.add(name);
      return true;
    }
    return false;
  },

  getIconStats: function () {
    return {
      loadedIcons: Array.from(loadedIcons),
      cachedIcons: iconCache.size,
      preloadIcons: preloadIcons,
      totalAvailableIcons: Object.keys(lucideStatic).length,
    };
  },

  // Markdown helper with sanitization
  markdown: (text) => {
    if (!text) return "";
    // Clean leading/trailing whitespace on each line
    const cleanedText = text.replace(/^\s+/gm, "").replace(/\s+$/gm, "");
    const html = marked.parse(cleanedText, { breaks: true });
    return DOMPurifyServer.sanitize(html);
  },

  // Substring helper
  substr: (str, start, length) => {
    if (!str) return "";
    return str.substring(start, start + length);
  },

  // Math helper
  math: (lvalue, operator, rvalue) => {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue,
    }[operator];
  },
};
