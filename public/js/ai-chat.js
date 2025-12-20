/**
 * Accelerator AI Chat Interface
 * Real-time chat functionality for AI conversations
 */

Accelerator.AIChat = {
  instances: new Map(),

  /**
   * Initialize chat interface
   */
  init(containerSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return null;

    const chatId = options.id || Accelerator.Utils.generateId("chat");
    const chat = new AIChatInstance(chatId, container, options);

    this.instances.set(chatId, chat);
    return chat;
  },

  /**
   * Get chat instance
   */
  get(chatId) {
    return this.instances.get(chatId);
  },

  /**
   * Remove chat instance
   */
  remove(chatId) {
    const chat = this.instances.get(chatId);
    if (chat) {
      chat.destroy();
      this.instances.delete(chatId);
    }
  },
};

class AIChatInstance {
  constructor(id, container, options) {
    this.id = id;
    this.container = container;
    this.options = {
      endpoint: "/api/ai/chat",
      placeholder: "Ask me anything...",
      maxHeight: "400px",
      showTyping: true,
      enableVoice: false,
      enableFileUpload: false,
      ...options,
    };

    this.messages = [];
    this.isTyping = false;
    this.conversationId = null;

    this.init();
  }

  /**
   * Initialize the chat interface
   */
  init() {
    this.createChatUI();
    this.bindEvents();
    this.loadConversation();
  }

  /**
   * Create chat UI structure
   */
  createChatUI() {
    const chatHTML = `
      <div class="ai-chat flex flex-col bg-base-100 border border-base-300 rounded-lg overflow-hidden" style="max-height: ${this.options.maxHeight};">
        <!-- Chat Header -->
        <div class="chat-header bg-primary text-primary-content px-4 py-3 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <span class="font-medium">AI Assistant</span>
          </div>
          <div class="flex items-center space-x-2">
            ${this.options.enableVoice ? '<button class="voice-btn text-primary-content hover:text-white p-1 rounded" title="Voice Input"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"/></svg></button>' : ""}
            <button class="clear-btn text-primary-content hover:text-white p-1 rounded" title="Clear Chat">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Container -->
        <div class="messages flex-1 overflow-y-auto p-4 space-y-4" style="min-height: 200px;">
          <div class="welcome-message text-center text-muted-foreground py-8">
            <div class="mb-2">
              <svg class="w-12 h-12 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p class="text-sm">Hello! I'm your AI assistant. How can I help you today?</p>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div class="typing-indicator hidden px-4 py-2 text-sm text-muted-foreground">
          <div class="flex items-center space-x-2">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span>AI is typing...</span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area border-t border-base-300 p-4">
          <form class="chat-form flex items-end space-x-2">
            <div class="flex-1 relative">
              <textarea
                class="chat-input w-full px-3 py-2 bg-base-100 border border-base-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                placeholder="${this.options.placeholder}"
                rows="1"
                maxlength="1000"
                style="min-height: 40px; max-height: 120px;"
              ></textarea>
              <div class="absolute right-2 bottom-2 text-xs text-muted-foreground">
                <span class="char-count">0</span>/1000
              </div>
            </div>
            <button type="submit" class="send-btn btn btn-primary px-4 py-2 disabled:opacity-50" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </form>
          ${
            this.options.enableFileUpload
              ? `
          <div class="file-upload mt-2">
            <input type="file" id="chat-file-${this.id}" class="hidden" accept="image/*,application/pdf,text/*" multiple>
            <label for="chat-file-${this.id}" class="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary-600 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <span>Attach files</span>
            </label>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    this.container.innerHTML = chatHTML;
    this.bindElements();
  }

  /**
   * Bind DOM elements
   */
  bindElements() {
    this.messagesContainer = this.container.querySelector(".messages");
    this.chatForm = this.container.querySelector(".chat-form");
    this.chatInput = this.container.querySelector(".chat-input");
    this.sendBtn = this.container.querySelector(".send-btn");
    this.charCount = this.container.querySelector(".char-count");
    this.typingIndicator = this.container.querySelector(".typing-indicator");
    this.clearBtn = this.container.querySelector(".clear-btn");
    this.voiceBtn = this.container.querySelector(".voice-btn");
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Form submission
    this.chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Input handling
    this.chatInput.addEventListener("input", () => {
      this.updateCharCount();
      this.updateSendButton();
      this.autoResizeTextarea();
    });

    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Clear chat
    this.clearBtn.addEventListener("click", () => {
      this.clearChat();
    });

    // Voice input
    if (this.voiceBtn) {
      this.voiceBtn.addEventListener("click", () => {
        this.toggleVoiceInput();
      });
    }

    // File upload
    if (this.options.enableFileUpload) {
      const fileInput = this.container.querySelector(`#chat-file-${this.id}`);
      fileInput.addEventListener("change", (e) => {
        this.handleFileUpload(e.target.files);
      });
    }
  }

  /**
   * Load existing conversation
   */
  async loadConversation() {
    try {
      const response = await fetch(`${this.options.endpoint}/history`);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        this.messages = data.messages;
        this.conversationId = data.conversationId;
        this.renderMessages();
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }

  /**
   * Send message
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Add user message
    const userMessage = {
      id: Accelerator.Utils.generateId("msg"),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(userMessage);
    this.renderMessages();
    this.chatInput.value = "";
    this.updateCharCount();
    this.updateSendButton();
    this.autoResizeTextarea();

    // Show typing indicator
    if (this.options.showTyping) {
      this.showTypingIndicator();
    }

    try {
      const response = await fetch(this.options.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationId: this.conversationId,
          messages: this.messages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response
        const aiMessage = {
          id: Accelerator.Utils.generateId("msg"),
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };

        this.messages.push(aiMessage);
        this.conversationId = data.conversationId;
        this.renderMessages();
        this.scrollToBottom();
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Accelerator.Utils.generateId("msg"),
        role: "system",
        content: "Sorry, I encountered an error. Please try again.",
        type: "error",
        timestamp: new Date().toISOString(),
      };
      this.messages.push(errorMessage);
      this.renderMessages();
    } finally {
      this.hideTypingIndicator();
    }
  }

  /**
   * Render messages
   */
  renderMessages() {
    const messagesHTML = this.messages
      .map((message) => this.renderMessage(message))
      .join("");
    this.messagesContainer.innerHTML = messagesHTML;
    this.scrollToBottom();
  }

  /**
   * Render single message
   */
  renderMessage(message) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const timeString = Accelerator.Utils.formatRelativeTime(message.timestamp);

    let messageClass = "flex";
    let contentClass = "max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm";

    if (isUser) {
      messageClass += " justify-end";
      contentClass += " bg-primary text-primary-content";
    } else if (isSystem) {
      messageClass += " justify-center";
      contentClass += " bg-warning/10 text-warning border border-warning/20";
    } else {
      messageClass += " justify-start";
      contentClass += " bg-base-200 text-base-content";
    }

    return `
      <div class="${messageClass} mb-4">
        <div class="${contentClass}">
          <div class="message-content">${this.formatMessage(message.content)}</div>
          <div class="text-xs opacity-70 mt-1">${timeString}</div>
        </div>
      </div>
    `;
  }

  /**
   * Format message content (support markdown-like formatting)
   */
  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-base-300 px-1 py-0.5 rounded text-xs">$1</code>',
      )
      .replace(/\n/g, "<br>");
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.typingIndicator.classList.remove("hidden");
    this.isTyping = true;
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.typingIndicator.classList.add("hidden");
    this.isTyping = false;
  }

  /**
   * Update character count
   */
  updateCharCount() {
    const count = this.chatInput.value.length;
    this.charCount.textContent = count;
    this.charCount.classList.toggle("text-error", count > 950);
  }

  /**
   * Update send button state
   */
  updateSendButton() {
    const hasContent = this.chatInput.value.trim().length > 0;
    this.sendBtn.disabled = !hasContent;
  }

  /**
   * Auto-resize textarea
   */
  autoResizeTextarea() {
    this.chatInput.style.height = "auto";
    this.chatInput.style.height =
      Math.min(this.chatInput.scrollHeight, 120) + "px";
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  /**
   * Clear chat
   */
  clearChat() {
    if (confirm("Are you sure you want to clear this conversation?")) {
      this.messages = [];
      this.conversationId = null;
      this.renderMessages();
      this.messagesContainer.innerHTML = `
        <div class="welcome-message text-center text-muted-foreground py-8">
          <div class="mb-2">
            <svg class="w-12 h-12 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <p class="text-sm">Chat cleared. How can I help you today?</p>
        </div>
      `;
    }
  }

  /**
   * Toggle voice input
   */
  toggleVoiceInput() {
    if (!("webkitSpeechRecognition" in window)) {
      window.showErrorToast(
        "Voice Input",
        "Voice input is not supported in your browser",
      );
      return;
    }

    if (this.isListening) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  /**
   * Start voice input
   */
  startVoiceInput() {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      this.isListening = true;
      this.voiceBtn.classList.add("text-error");
      this.voiceBtn.title = "Stop Voice Input";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.chatInput.value += (this.chatInput.value ? " " : "") + transcript;
      this.updateCharCount();
      this.updateSendButton();
      this.autoResizeTextarea();
    };

    recognition.onend = () => {
      this.isListening = false;
      this.voiceBtn.classList.remove("text-error");
      this.voiceBtn.title = "Voice Input";
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      this.stopVoiceInput();
    };

    recognition.start();
    this.recognition = recognition;
  }

  /**
   * Stop voice input
   */
  stopVoiceInput() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Handle file upload
   */
  handleFileUpload(files) {
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        window.showErrorToast(
          "File Upload",
          `${file.name} is too large. Maximum size is 5MB.`,
        );
        return;
      }

      // Add file message to chat
      const fileMessage = {
        id: Accelerator.Utils.generateId("msg"),
        role: "user",
        type: "file",
        content: `Uploaded file: ${file.name}`,
        file: file,
        timestamp: new Date().toISOString(),
      };

      this.messages.push(fileMessage);
      this.renderMessages();
    });
  }

  /**
   * Destroy chat instance
   */
  destroy() {
    if (this.isListening) {
      this.stopVoiceInput();
    }
    this.container.innerHTML = "";
    this.messages = [];
    this.conversationId = null;
  }
}

// Initialize AI Chat globally
window.AIChat = Accelerator.AIChat;
