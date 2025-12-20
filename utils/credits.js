// Credit calculation utilities

export function calculateAICost(operation) {
  const costs = {
    "generate-idea": 10,
    "improve-description": 5,
    "auto-fill": 15,
    "create-business-plan": 50,
    "generate-financials": 30,
    "market-analysis": 25,
    "voting-reward": 1,
  };
  return costs[operation] || 10;
}

export function canAffordCredits(userCredits, cost) {
  return userCredits >= cost;
}

export function deductCredits(currentCredits, amount) {
  return Math.max(0, currentCredits - amount);
}

export function addCredits(currentCredits, amount) {
  return currentCredits + amount;
}

export function formatCredits(amount) {
  return `${amount.toLocaleString()} credits`;
}

export function getCreditThresholds() {
  return {
    low: 50,
    medium: 200,
    high: 1000,
  };
}

export function getCreditBonus(packageType) {
  const bonuses = {
    free: 0,
    starter: 100,
    professional: 500,
    enterprise: 2000,
  };
  return bonuses[packageType] || 0;
}
