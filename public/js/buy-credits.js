// Buy Credits JavaScript
function _buyPackage(packageId) {
  // Show loading state
  const button = event.target;
  if (button) {
    button.disabled = true;
    button.textContent = "Processing...";
  }

  // Create form and submit
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/buy-credits";

  const packageInput = document.createElement("input");
  packageInput.type = "hidden";
  packageInput.name = "package_id";
  packageInput.value = packageId;

  form.appendChild(packageInput);
  document.body.appendChild(form);
  form.submit();
}

// Update credit balance display
async function updateCreditBalance() {
  try {
    const response = await fetch("/api/credits", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    });

    if (response.ok) {
      const data = await response.json();
      const balanceElement = document.getElementById("current-balance");
      if (balanceElement) {
        balanceElement.innerHTML = `
                    <h3 class="text-lg font-medium text-foreground mb-4">Current Balance</h3>
                    <p class="text-2xl font-bold text-foreground">${data.balance} credits</p>
                    <p class="text-sm text-muted-foreground">Total earned: ${data.total_earned || 0}, Total spent: ${data.total_spent || 0}</p>
                `;
      }
    }
  } catch (error) {
    console.error("Error updating credit balance:", error);
  }
}

// Call updateCreditBalance when page loads
document.addEventListener("DOMContentLoaded", () => {
  updateCreditBalance();
});
