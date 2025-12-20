// Profile initialization utilities

export function createDefaultProfile(userId) {
  return {
    user_id: userId,
    package_type: "free",
    package_status: "active",
    credit_balance: 1000,
    total_earned: 1000,
    total_spent: 0,
    name: "",
    company: "",
    role: "",
    experience_level: "",
    goals: "",
    avatar_url: "/images/avatar.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function validateProfileData(data) {
  const errors = [];

  if (data.name && data.name.length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (
    data.role &&
    ![
      "entrepreneur",
      "founder",
      "developer",
      "designer",
      "investor",
      "consultant",
      "student",
      "other",
    ].includes(data.role)
  ) {
    errors.push("Invalid role selected");
  }

  if (
    data.experience_level &&
    !["beginner", "intermediate", "advanced", "expert"].includes(
      data.experience_level,
    )
  ) {
    errors.push("Invalid experience level selected");
  }

  if (data.goals && data.goals.length > 1000) {
    errors.push("Goals must be less than 1000 characters");
  }

  return errors;
}

export function getDefaultSettings() {
  return {
    theme: "light",
    language: "en",
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
    privacy: {
      profile_visible: true,
      ideas_visible: true,
    },
  };
}

export function initializeUserProgress(userId) {
  return {
    user_id: userId,
    ideas_created: 0,
    votes_cast: 0,
    credits_earned: 0,
    credits_spent: 0,
    last_active: new Date().toISOString(),
    achievements: [],
    onboarding_completed: false,
  };
}

export function calculateProfileCompleteness(profile) {
  const fields = ["name", "role", "experience_level"];
  const completedFields = fields.filter((field) => profile[field]).length;
  return Math.round((completedFields / fields.length) * 100);
}
