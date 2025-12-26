import { createClient } from "@supabase/supabase-js";
import config from "./lib/config.js";

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
);

const ideas = [
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "AI-Powered Code Review Tool",
    category: "Technology",
    category_icon: "💻",
    description:
      "An AI tool that automatically reviews code for bugs, security issues, and best practices, integrated with GitHub.",
    tags: ["AI", "Development", "Security"],
    slug: "ai-powered-code-review-tool",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Sustainable Urban Farming Platform",
    category: "Agriculture",
    category_icon: "🌱",
    description:
      "A platform connecting urban farmers with consumers, optimizing crop yields using IoT sensors and AI.",
    tags: ["Sustainability", "IoT", "Agriculture"],
    slug: "sustainable-urban-farming-platform",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Mental Health VR Therapy App",
    category: "Healthcare",
    category_icon: "🧠",
    description:
      "Virtual reality application for immersive therapy sessions, helping users manage anxiety and PTSD.",
    tags: ["VR", "Mental Health", "Therapy"],
    slug: "mental-health-vr-therapy-app",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Blockchain-Based Supply Chain Tracker",
    category: "Logistics",
    category_icon: "🔗",
    description:
      "Transparent supply chain tracking using blockchain to verify product authenticity and origins.",
    tags: ["Blockchain", "Supply Chain", "Transparency"],
    slug: "blockchain-supply-chain-tracker",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Personalized Learning AI Tutor",
    category: "Education",
    category_icon: "🎓",
    description:
      "AI-powered tutoring system that adapts to individual student learning styles and paces.",
    tags: ["AI", "Education", "Personalization"],
    slug: "personalized-learning-ai-tutor",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Electric Vehicle Charging Network",
    category: "Energy",
    category_icon: "⚡",
    description:
      "A network of fast-charging stations for EVs with predictive maintenance and energy optimization.",
    tags: ["Electric Vehicles", "Charging", "Sustainability"],
    slug: "electric-vehicle-charging-network",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Remote Team Collaboration Hub",
    category: "Productivity",
    category_icon: "👥",
    description:
      "All-in-one platform for remote teams with integrated video, chat, project management, and analytics.",
    tags: ["Remote Work", "Collaboration", "Productivity"],
    slug: "remote-team-collaboration-hub",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Ocean Plastic Cleanup Drone Fleet",
    category: "Environment",
    category_icon: "🌊",
    description:
      "Autonomous drones that collect plastic waste from oceans and convert it into usable materials.",
    tags: ["Environment", "Drones", "Recycling"],
    slug: "ocean-plastic-cleanup-drone-fleet",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Smart Home Energy Management System",
    category: "IoT",
    category_icon: "🏠",
    description:
      "AI-driven system that optimizes home energy usage, predicts consumption, and integrates with renewable sources.",
    tags: ["IoT", "Energy", "Smart Home"],
    slug: "smart-home-energy-management-system",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
  {
    user_id: "2b8a93d7-72f5-45c2-ab4b-169756aac631",
    title: "Gamified Fitness Coaching App",
    category: "Health",
    category_icon: "💪",
    description:
      "Mobile app that turns fitness goals into games, with social challenges and AI-powered coaching.",
    tags: ["Fitness", "Gamification", "Health"],
    slug: "gamified-fitness-coaching-app",
    privacy: "public",
    validation_threshold_met: true,
    unlocked_models: [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ],
    completion_percentage: 100,
    overall_status: "completed",
  },
];

async function seedIdeas() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ideas")
      .insert(ideas)
      .select();

    if (error) {
      console.error("Error inserting ideas:", error);
    } else {
      console.log(`Inserted ${data.length} ideas successfully.`);
    }
  } catch (err) {
    console.error("Failed to seed ideas:", err);
  }
}

seedIdeas();
