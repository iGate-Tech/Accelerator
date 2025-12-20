/**
 * Accelerator Enhanced File Upload System
 * Advanced file upload handling with drag & drop, progress tracking, and validation
 */

Accelerator.FileUpload = {
  instances: new Map(),

  /**
   * Initialize file upload for an element
   */
  init(selector, options = {}) {
    const element = document.querySelector(selector);
    if (!element) return null;

    const uploadId = options.id || Accelerator.Utils.generateId("upload");
    const uploader = new FileUploader(uploadId, element, options);

    this.instances.set(uploadId, uploader);
    return uploader;
  },

  /**
   * Get upload instance
   */
  get(uploadId) {
    return this.instances.get(uploadId);
  },
};

class FileUploader {
  constructor(id, element, options) {
    this.id = id;
    this.element = element;
    this.options = {
      endpoint: "/api/upload",
      maxFiles: 5,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/*", "application/pdf", "text/*"],
      showPreview: true,
      showProgress: true,
      dragDrop: true,
      multiple: false,
      ...options,
    };

    this.files = [];
    this.uploadQueue = [];
    this.isUploading = false;

    this.init();
  }

  /**
   * Initialize the uploader
   */
  init() {
    this.createUploadUI();
    this.bindEvents();
  }

  /**
   * Create upload UI
   */
  createUploadUI() {
    const uploadHTML = `
      <div class="file-uploader" data-uploader-id="${this.id}">
        <!-- Hidden file input -->
        <input type="file" id="file-input-${this.id}" class="hidden"
               ${this.options.multiple ? "multiple" : ""}
               accept="${this.options.allowedTypes.join(",")}">

        <!-- Upload area -->
        <div class="upload-area border-2 border-dashed border-base-300 rounded-lg p-6 text-center transition-colors cursor-pointer
                    ${this.options.dragDrop ? "hover:border-primary hover:bg-primary/5" : ""}">
          <div class="upload-content">
            <svg class="w-12 h-12 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <div class="upload-text">
              <p class="text-lg font-medium text-base-content mb-2">
                ${this.options.multiple ? "Drop files here or click to browse" : "Drop file here or click to browse"}
              </p>
              <p class="text-sm text-muted-foreground">
                ${this.getAllowedTypesText()} • Max ${this.formatFileSize(this.options.maxFileSize)}
                ${this.options.multiple ? ` • Up to ${this.options.maxFiles} files` : ""}
              </p>
            </div>
            <button type="button" class="btn btn-primary mt-4 browse-btn">
              Browse Files
            </button>
          </div>
        </div>

        <!-- File list -->
        <div class="file-list mt-4 space-y-2"></div>

        <!-- Progress container -->
        <div class="progress-container mt-4 hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Uploading...</span>
            <span class="text-sm text-muted-foreground progress-text">0%</span>
          </div>
          <div class="w-full bg-base-200 rounded-full h-2">
            <div class="bg-primary h-2 rounded-full progress-bar transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
      </div>
    `;

    this.element.innerHTML = uploadHTML;
    this.bindUIElements();
  }

  /**
   * Bind UI elements
   */
  bindUIElements() {
    this.fileInput = this.element.querySelector(`#file-input-${this.id}`);
    this.uploadArea = this.element.querySelector(".upload-area");
    this.uploadContent = this.element.querySelector(".upload-content");
    this.fileList = this.element.querySelector(".file-list");
    this.progressContainer = this.element.querySelector(".progress-container");
    this.progressBar = this.element.querySelector(".progress-bar");
    this.progressText = this.element.querySelector(".progress-text");
    this.browseBtn = this.element.querySelector(".browse-btn");
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Browse button click
    this.browseBtn.addEventListener("click", () => {
      this.fileInput.click();
    });

    // Upload area click
    this.uploadArea.addEventListener("click", (e) => {
      if (!e.target.closest(".browse-btn")) {
        this.fileInput.click();
      }
    });

    // File input change
    this.fileInput.addEventListener("change", (e) => {
      this.handleFiles(Array.from(e.target.files));
    });

    // Drag and drop events
    if (this.options.dragDrop) {
      this.uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.uploadArea.classList.add("drag-over");
      });

      this.uploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        this.uploadArea.classList.remove("drag-over");
      });

      this.uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        this.uploadArea.classList.remove("drag-over");
        this.handleFiles(Array.from(e.dataTransfer.files));
      });
    }
  }

  /**
   * Handle selected/dropped files
   */
  handleFiles(files) {
    const validFiles = files.filter((file) => this.validateFile(file));

    if (validFiles.length === 0) return;

    // Check total file limit
    if (
      this.options.multiple &&
      this.files.length + validFiles.length > this.options.maxFiles
    ) {
      window.showErrorToast(
        "File Limit",
        `Maximum ${this.options.maxFiles} files allowed`,
      );
      return;
    }

    validFiles.forEach((file) => {
      const fileData = {
        id: Accelerator.Utils.generateId("file"),
        file,
        status: "pending",
        progress: 0,
        preview: null,
        error: null,
      };

      if (this.options.multiple) {
        this.files.push(fileData);
      } else {
        this.files = [fileData];
      }

      this.generatePreview(fileData);
      this.renderFileList();
    });

    // Auto-upload if configured
    if (this.options.autoUpload) {
      this.uploadFiles();
    }
  }

  /**
   * Validate file
   */
  validateFile(file) {
    // Check file size
    if (file.size > this.options.maxFileSize) {
      window.showErrorToast(
        "File Too Large",
        `${file.name} exceeds the maximum file size of ${this.formatFileSize(this.options.maxFileSize)}`,
      );
      return false;
    }

    // Check file type
    const isAllowedType = this.options.allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      window.showErrorToast(
        "Invalid File Type",
        `${file.name} is not an allowed file type`,
      );
      return false;
    }

    return true;
  }

  /**
   * Generate file preview
   */
  generatePreview(fileData) {
    const file = fileData.file;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileData.preview = e.target.result;
        this.updateFilePreview(fileData);
      };
      reader.readAsDataURL(file);
    } else {
      // Generic file icon based on type
      fileData.preview = this.getFileIcon(file.type);
      this.updateFilePreview(fileData);
    }
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(type) {
    if (type === "application/pdf") {
      return `<svg class="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
      </svg>`;
    } else if (type.startsWith("text/")) {
      return `<svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
      </svg>`;
    } else {
      return `<svg class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" clip-rule="evenodd"/>
      </svg>`;
    }
  }

  /**
   * Render file list
   */
  renderFileList() {
    const fileItems = this.files
      .map((fileData) => this.renderFileItem(fileData))
      .join("");
    this.fileList.innerHTML = fileItems;
  }

  /**
   * Render file item
   */
  renderFileItem(fileData) {
    const file = fileData.file;
    const fileSize = this.formatFileSize(file.size);
    const progressStyle =
      fileData.status === "uploading" ? `width: ${fileData.progress}%` : "";

    return `
      <div class="file-item flex items-center space-x-3 p-3 bg-base-100 border border-base-300 rounded-lg" data-file-id="${fileData.id}">
        <div class="file-preview flex-shrink-0">
          ${
            fileData.preview
              ? fileData.preview.startsWith("data:")
                ? `<img src="${fileData.preview}" class="w-10 h-10 object-cover rounded" alt="${file.name}">`
                : fileData.preview
              : '<div class="w-10 h-10 bg-base-200 rounded flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>'
          }
        </div>

        <div class="file-info flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-base-content truncate">${file.name}</p>
            <button class="remove-file text-error hover:text-error/80 p-1" data-file-id="${fileData.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="flex items-center justify-between mt-1">
            <p class="text-xs text-muted-foreground">${fileSize}</p>
            <div class="file-status text-xs">
              ${
                fileData.status === "uploading"
                  ? `<span class="text-primary">${fileData.progress}%</span>`
                  : fileData.status === "completed"
                    ? '<span class="text-success">Uploaded</span>'
                    : fileData.status === "error"
                      ? `<span class="text-error">${fileData.error || "Failed"}</span>`
                      : '<span class="text-muted-foreground">Ready</span>'
              }
            </div>
          </div>

          ${
            fileData.status === "uploading"
              ? `
            <div class="w-full bg-base-200 rounded-full h-1 mt-2">
              <div class="bg-primary h-1 rounded-full transition-all duration-300" style="${progressStyle}"></div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Update file preview
   */
  updateFilePreview(fileData) {
    const fileItem = this.fileList.querySelector(
      `[data-file-id="${fileData.id}"]`,
    );
    if (fileItem) {
      const previewEl = fileItem.querySelector(".file-preview");
      if (previewEl && fileData.preview) {
        if (fileData.preview.startsWith("data:")) {
          previewEl.innerHTML = `<img src="${fileData.preview}" class="w-10 h-10 object-cover rounded" alt="${fileData.file.name}">`;
        } else {
          previewEl.innerHTML = fileData.preview;
        }
      }
    }
  }

  /**
   * Upload files
   */
  async uploadFiles() {
    if (this.isUploading || this.files.length === 0) return;

    this.isUploading = true;
    this.showProgress();

    for (const fileData of this.files) {
      if (fileData.status === "pending") {
        await this.uploadFile(fileData);
      }
    }

    this.isUploading = false;
    this.hideProgress();

    // Trigger callback if all files uploaded successfully
    const allCompleted = this.files.every((f) => f.status === "completed");
    if (allCompleted && this.options.onComplete) {
      this.options.onComplete(this.files);
    }
  }

  /**
   * Upload single file
   */
  async uploadFile(fileData) {
    fileData.status = "uploading";
    fileData.progress = 0;
    this.updateFileStatus(fileData);

    try {
      const formData = new FormData();
      formData.append("file", fileData.file);
      formData.append("context", this.options.context || "");

      const response = await fetch(this.options.endpoint, {
        method: "POST",
        body: formData,
        // Note: Can't track upload progress with fetch easily
        // Would need XMLHttpRequest for progress tracking
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        fileData.status = "completed";
        fileData.progress = 100;
        fileData.url = result.url;
        fileData.publicId = result.publicId;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      fileData.status = "error";
      fileData.error = error.message;
    }

    this.updateFileStatus(fileData);
  }

  /**
   * Update file status in UI
   */
  updateFileStatus(fileData) {
    const fileItem = this.fileList.querySelector(
      `[data-file-id="${fileData.id}"]`,
    );
    if (fileItem) {
      const statusEl = fileItem.querySelector(".file-status");
      const progressBar = fileItem.querySelector(".bg-primary");

      if (statusEl) {
        statusEl.innerHTML =
          fileData.status === "uploading"
            ? `<span class="text-primary">${fileData.progress}%</span>`
            : fileData.status === "completed"
              ? '<span class="text-success">Uploaded</span>'
              : fileData.status === "error"
                ? `<span class="text-error">${fileData.error || "Failed"}</span>`
                : '<span class="text-muted-foreground">Ready</span>';
      }

      if (progressBar && fileData.status === "uploading") {
        progressBar.style.width = `${fileData.progress}%`;
      }
    }
  }

  /**
   * Show upload progress
   */
  showProgress() {
    this.progressContainer.classList.remove("hidden");
  }

  /**
   * Hide upload progress
   */
  hideProgress() {
    this.progressContainer.classList.add("hidden");
  }

  /**
   * Remove file
   */
  removeFile(fileId) {
    const index = this.files.findIndex((f) => f.id === fileId);
    if (index > -1) {
      this.files.splice(index, 1);
      this.renderFileList();
    }
  }

  /**
   * Get allowed types text
   */
  getAllowedTypesText() {
    return this.options.allowedTypes
      .map((type) => {
        if (type === "image/*") return "Images";
        if (type === "application/pdf") return "PDFs";
        if (type === "text/*") return "Text files";
        return type;
      })
      .join(", ");
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get uploaded files data
   */
  getFiles() {
    return this.files.filter((f) => f.status === "completed");
  }

  /**
   * Clear all files
   */
  clear() {
    this.files = [];
    this.renderFileList();
  }

  /**
   * Destroy uploader
   */
  destroy() {
    this.element.innerHTML = "";
    this.files = [];
  }
}

// Bind remove file events
document.addEventListener("click", (event) => {
  const removeBtn = event.target.closest(".remove-file");
  if (removeBtn) {
    const fileId = removeBtn.getAttribute("data-file-id");
    const uploaderEl = removeBtn.closest(".file-uploader");
    const uploaderId = uploaderEl.getAttribute("data-uploader-id");
    const uploader = Accelerator.FileUpload.get(uploaderId);

    if (uploader) {
      uploader.removeFile(fileId);
    }
  }
});

// Initialize file upload system
window.FileUploader = Accelerator.FileUpload;
