/**
 * Accelerator Real-Time Updates System
 * WebSocket and polling-based real-time updates
 */

Accelerator.Realtime = {
  connections: new Map(),
  subscribers: new Map(),
  pollIntervals: new Map(),

  /**
   * Initialize real-time system
   */
  init() {
    this.initWebSocket();
    this.initPolling();
  },

  /**
   * Initialize WebSocket connection
   */
  initWebSocket() {
    if (!window.WebSocket) {
      console.warn("WebSocket not supported, falling back to polling");
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      this.connections.set("main", ws);

      ws.onopen = () => {
        console.log("WebSocket connected");
        this.onConnect(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, retrying in 5 seconds...");
        setTimeout(() => this.initWebSocket(), 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("WebSocket initialization failed:", error);
    }
  },

  /**
   * Initialize polling fallbacks
   */
  initPolling() {
    // Poll for notifications
    this.startPolling(
      "notifications",
      "/api/notifications/poll",
      30000,
      (data) => {
        this.handleNotifications(data);
      },
    );

    // Poll for activity updates
    this.startPolling("activity", "/api/activity/poll", 60000, (data) => {
      this.handleActivity(data);
    });

    // Poll for credit balance updates
    this.startPolling("credits", "/api/credits/poll", 120000, (data) => {
      this.handleCredits(data);
    });
  },

  /**
   * Start polling for a resource
   */
  startPolling(name, endpoint, interval, handler) {
    const poll = async () => {
      try {
        const response = await fetch(endpoint, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "same-origin",
        });

        if (response.ok) {
          const data = await response.json();
          handler(data);
        }
      } catch (error) {
        console.warn(`Polling error for ${name}:`, error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.pollIntervals.set(name, intervalId);
  },

  /**
   * Stop polling for a resource
   */
  stopPolling(name) {
    const intervalId = this.pollIntervals.get(name);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollIntervals.delete(name);
    }
  },

  /**
   * Handle WebSocket connection established
   */
  onConnect(ws) {
    // Subscribe to user-specific channels
    const userId = this.getCurrentUserId();
    if (userId) {
      this.send("subscribe", { channel: `user:${userId}` });
    }

    // Subscribe to general channels
    this.send("subscribe", { channel: "notifications" });
    this.send("subscribe", { channel: "activity" });
  },

  /**
   * Send message via WebSocket
   */
  send(type, data) {
    const ws = this.connections.get("main");
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, ...data }));
    }
  },

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case "notification":
        this.handleNotification(message.data);
        break;
      case "activity":
        this.handleActivityUpdate(message.data);
        break;
      case "credit_update":
        this.handleCreditUpdate(message.data);
        break;
      case "idea_update":
        this.handleIdeaUpdate(message.data);
        break;
      default:
        this.triggerSubscribers(message.type, message.data);
    }
  },

  /**
   * Handle notification via polling
   */
  handleNotifications(data) {
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach((notification) => {
        this.handleNotification(notification);
      });
    }
  },

  /**
   * Handle single notification
   */
  handleNotification(notification) {
    // Show toast notification
    if (window.showToast) {
      const type =
        notification.type === "error"
          ? "error"
          : notification.type === "warning"
            ? "warning"
            : notification.type === "success"
              ? "success"
              : "info";

      window.showToast(notification.message, type);
    }

    // Update notification badge
    this.updateNotificationBadge(notification);

    // Trigger subscribers
    this.triggerSubscribers("notification", notification);
  },

  /**
   * Handle activity updates
   */
  handleActivity(data) {
    if (data.activities && data.activities.length > 0) {
      this.updateActivityFeed(data.activities);
    }
  },

  /**
   * Handle activity update
   */
  handleActivityUpdate(activity) {
    this.addActivityItem(activity);
    this.triggerSubscribers("activity", activity);
  },

  /**
   * Handle credits update
   */
  handleCredits(data) {
    if (data.balance !== undefined) {
      this.updateCreditBalance(data.balance);
    }
  },

  /**
   * Handle credit update
   */
  handleCreditUpdate(data) {
    this.updateCreditBalance(data.balance);

    // Show credit change notification
    if (data.change && window.showToast) {
      const message =
        data.change > 0
          ? `Credits added: +${data.change}`
          : `Credits used: ${data.change}`;

      window.showToast(message, data.change > 0 ? "success" : "info");
    }

    this.triggerSubscribers("credit_update", data);
  },

  /**
   * Handle idea update
   */
  handleIdeaUpdate(data) {
    this.updateIdeaStatus(data);
    this.triggerSubscribers("idea_update", data);
  },

  /**
   * Subscribe to real-time events
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
  },

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(event, callback) {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  },

  /**
   * Trigger subscribers for an event
   */
  triggerSubscribers(event, data) {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Subscriber callback error:", error);
        }
      });
    }
  },

  /**
   * Update notification badge
   */
  updateNotificationBadge(notification) {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      let count = parseInt(badge.textContent) || 0;
      if (notification.is_read === false) {
        count++;
        badge.textContent = count;
        badge.classList.remove("hidden");
      }
    }
  },

  /**
   * Update activity feed
   */
  updateActivityFeed(activities) {
    const feed = document.querySelector(".activity-feed");
    if (feed) {
      activities.forEach((activity) => {
        this.addActivityItem(activity, feed);
      });
    }
  },

  /**
   * Add activity item to feed
   */
  addActivityItem(activity, feed = null) {
    if (!feed) {
      feed = document.querySelector(".activity-feed");
    }

    if (feed) {
      const item = document.createElement("div");
      item.className =
        "activity-item flex items-start space-x-3 p-3 rounded-lg bg-base-100 border border-base-200";
      item.innerHTML = `
        <div class="activity-icon flex-shrink-0">
          ${this.getActivityIcon(activity.action_type)}
        </div>
        <div class="activity-content flex-1">
          <p class="text-sm text-base-content">${activity.description}</p>
          <p class="text-xs text-muted-foreground">${Accelerator.Utils.formatRelativeTime(activity.created_at)}</p>
        </div>
      `;

      feed.insertBefore(item, feed.firstChild);

      // Limit to 10 items
      while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
      }
    }
  },

  /**
   * Get activity icon
   */
  getActivityIcon(actionType) {
    const icons = {
      create:
        '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>',
      update:
        '<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
      delete:
        '<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
      report_generated:
        '<svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      credits_purchased:
        '<svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>',
    };

    return (
      icons[actionType] ||
      '<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    );
  },

  /**
   * Update credit balance display
   */
  updateCreditBalance(balance) {
    const balanceElements = document.querySelectorAll(".credit-balance");
    balanceElements.forEach((element) => {
      element.textContent = balance;
    });

    // Update any credit progress bars or indicators
    const progressElements = document.querySelectorAll(".credit-progress");
    progressElements.forEach((element) => {
      const maxCredits =
        parseInt(element.getAttribute("data-max-credits")) || 1000;
      const percentage = Math.min((balance / maxCredits) * 100, 100);
      element.style.width = `${percentage}%`;
    });
  },

  /**
   * Update idea status
   */
  updateIdeaStatus(data) {
    const ideaElement = document.querySelector(
      `[data-idea-id="${data.idea_id}"]`,
    );
    if (ideaElement) {
      // Update validation status
      if (data.validation_threshold_met !== undefined) {
        ideaElement.classList.toggle(
          "validated",
          data.validation_threshold_met,
        );
        const statusEl = ideaElement.querySelector(".idea-status");
        if (statusEl) {
          statusEl.textContent = data.validation_threshold_met
            ? "Validated"
            : "Draft";
          statusEl.className = `idea-status badge ${data.validation_threshold_met ? "badge-success" : "badge-warning"}`;
        }
      }

      // Update completion percentage
      if (data.completion_percentage !== undefined) {
        const progressEl = ideaElement.querySelector(".completion-progress");
        if (progressEl) {
          progressEl.style.width = `${data.completion_percentage}%`;
        }
        const percentEl = ideaElement.querySelector(".completion-percentage");
        if (percentEl) {
          percentEl.textContent = `${data.completion_percentage}%`;
        }
      }
    }
  },

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    // Try to get from global state or meta tag
    const userMeta = document.querySelector('meta[name="user-id"]');
    return userMeta ? userMeta.getAttribute("content") : null;
  },

  /**
   * Send heartbeat to keep WebSocket alive
   */
  startHeartbeat() {
    setInterval(() => {
      this.send("ping", {});
    }, 30000); // 30 seconds
  },

  /**
   * Cleanup on page unload
   */
  cleanup() {
    // Close WebSocket connections
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    // Clear polling intervals
    this.pollIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });

    this.connections.clear();
    this.pollIntervals.clear();
    this.subscribers.clear();
  },
};

// Initialize real-time system
document.addEventListener("DOMContentLoaded", () => {
  Accelerator.Realtime.init();
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  Accelerator.Realtime.cleanup();
});

// Export for global access
window.Realtime = Accelerator.Realtime;
