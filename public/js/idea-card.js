// idea-card.js - Handle interactions for idea cards

// Toggle card details expansion
function toggleCardDetails(card) {
  const details = card.querySelector(".card-details");
  const expandBtn = card.querySelector(".expand-btn");

  if (details.style.maxHeight && details.style.maxHeight !== "0px") {
    // Collapse
    details.style.maxHeight = "0px";
    expandBtn.style.transform = "rotate(0deg)";
  } else {
    // Expand
    details.style.maxHeight = details.scrollHeight + "px";
    expandBtn.style.transform = "rotate(180deg)";
  }
}

// Update idea status
async function updateIdeaStatus(button, ideaId, newStatus) {
  try {
    const response = await fetch(`/api/ideas/${ideaId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      const data = await response.json();
      // Update the card's data-status attribute
      button.closest(".idea-card").setAttribute("data-status", newStatus);
      // Update status badge
      const statusBadge = button
        .closest(".idea-card")
        .querySelector(".status-badge");
      if (statusBadge) {
        statusBadge.textContent = newStatus.replace("_", " ");
        statusBadge.className = `status-badge status-${newStatus}`;
      }
      showToast("Status updated successfully", "success");
    } else {
      showToast("Failed to update status", "error");
    }
  } catch (error) {
    console.error("Error updating status:", error);
    showToast("Failed to update status", "error");
  }
}

// Share private idea
function shareIdea(button) {
  const ideaId = button.getAttribute("data-id");
  const shareUrl = `${window.location.origin}/idea/${ideaId}`;

  if (navigator.share) {
    navigator.share({
      title: "Check out this idea",
      url: shareUrl,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        showToast("Link copied to clipboard!", "success");
      })
      .catch(() => {
        showToast("Failed to copy link", "error");
      });
  }
}

// Open team modal (placeholder - implement based on your modal system)
function openTeamModal(button) {
  const ideaId = button.getAttribute("data-id");
  // Implement your team modal opening logic here
  showToast("Team management feature coming soon!", "info");
}

// Update idea privacy
async function updateIdeaPrivacy(button, ideaId, newPrivacy) {
  try {
    const response = await fetch(`/api/ideas/${ideaId}/privacy`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ privacy: newPrivacy }),
    });

    if (response.ok) {
      showToast(`Idea is now ${newPrivacy}`, "success");
      // Optionally refresh the page or update UI
      location.reload();
    } else {
      showToast("Failed to update privacy", "error");
    }
  } catch (error) {
    console.error("Error updating privacy:", error);
    showToast("Failed to update privacy", "error");
  }
}

// Handle star rating
document.addEventListener("DOMContentLoaded", function () {
  // Delegate event for star ratings
  document.addEventListener("click", async function (e) {
    if (e.target.classList.contains("star-btn")) {
      e.preventDefault();
      const button = e.target;
      const rating = parseInt(button.getAttribute("data-rating"));
      const ideaId = button
        .closest(".star-rating")
        .getAttribute("data-idea-id");

      try {
        const response = await fetch(`/api/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idea_id: ideaId, rating }),
        });

        if (response.ok) {
          showToast("Rating submitted!", "success");
          // Optionally refresh the page to update ratings
          location.reload();
        } else {
          showToast("Failed to submit rating", "error");
        }
      } catch (error) {
        console.error("Error submitting rating:", error);
        showToast("Failed to submit rating", "error");
      }
    }
  });

  // Handle favorite toggling
  document.addEventListener("click", async function (e) {
    if (e.target.closest(".favorite-btn")) {
      e.preventDefault();
      const button = e.target.closest(".favorite-btn");
      const ideaId = button.getAttribute("data-favorite-id");
      const isCurrentlyFavorite = button
        .querySelector(".fa-heart")
        .classList.contains("text-red-500");

      try {
        const response = await fetch(`/api/ideas/${ideaId}/favorite`, {
          method: isCurrentlyFavorite ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const heartIcon = button.querySelector(".fa-heart");
          if (isCurrentlyFavorite) {
            heartIcon.classList.remove("text-red-500", "fill-current");
            showToast("Removed from favorites", "info");
          } else {
            heartIcon.classList.add("text-red-500", "fill-current");
            showToast("Added to favorites!", "success");
          }
          // Update data attribute
          button
            .closest(".idea-card")
            .setAttribute("data-favorite", !isCurrentlyFavorite);
        } else {
          showToast("Failed to update favorite", "error");
        }
      } catch (error) {
        console.error("Error updating favorite:", error);
        showToast("Failed to update favorite", "error");
      }
    }
  });

  // Handle populate template
  document.addEventListener("click", async function (e) {
    if (e.target.closest(".populate-btn")) {
      e.preventDefault();
      const button = e.target.closest(".populate-btn");
      const ideaId = button.getAttribute("data-populate-id");

      try {
        const response = await fetch(`/api/ideas/${ideaId}`);
        if (response.ok) {
          const idea = await response.json();
          // Redirect to new idea page with template data
          window.location.href = `/ideas/new?template=${ideaId}`;
        } else {
          showToast("Failed to load template", "error");
        }
      } catch (error) {
        console.error("Error loading template:", error);
        showToast("Failed to load template", "error");
      }
    }
  });
});
