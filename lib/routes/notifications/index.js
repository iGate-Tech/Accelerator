import express from "express";
import { requireAuth } from "../../session.js";
import config from "../../config.js";

const router = express.Router();

// Voting & Rewards Dashboard
router.get("/voting-reward", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    const userId = req.user.id;

    // Get user's profile data including credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return res.status(500).render("error", {
        title: "Error",
        message: "Failed to load profile data",
      });
    }

    // Get user's ideas with ratings and completion data
    const { data: userIdeas, error: ideasError } = await supabase
      .from("ideas")
      .select(
        `
        *,
        votes (
          rating,
          created_at
        ),
        model_instances (
          model_type,
          status,
          model_sections (
            is_completed
          )
        )
      `,
      )
      .eq("user_id", userId);

    if (ideasError) {
      console.error("Ideas fetch error:", ideasError);
    }

    // Calculate completion percentages and overall status for each idea
    const processedIdeas = (userIdeas || []).map((idea) => {
      const completedSections =
        idea.model_instances?.flatMap(
          (mi) => mi.model_sections?.filter((ms) => ms.is_completed) || [],
        ).length || 0;
      const totalSections =
        idea.model_instances?.flatMap((mi) => mi.model_sections || []).length ||
        0;
      const completionPercentage =
        totalSections > 0
          ? Math.round((completedSections / totalSections) * 100)
          : 0;

      let overallStatus = "draft";
      if (completionPercentage > 0 && completionPercentage < 100)
        overallStatus = "in_progress";
      else if (completionPercentage === 100) overallStatus = "completed";

      // Calculate average rating
      const ratings = idea.votes?.map((v) => v.rating) || [];
      const averageRating =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;

      return {
        ...idea,
        completion_percentage: completionPercentage,
        overall_status: overallStatus,
        rating: averageRating,
        votes_count: ratings.length,
      };
    });

    // Get recent voting activity (where user voted on others' ideas)
    const { data: userVotes } = await supabase
      .from("votes")
      .select(
        `
        *,
        ideas (
          title,
          user_id
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get rewards earned by this user
    const { data: rewardsEarned, error: rewardsEarnedError } = await supabase
      .from("voting_rewards")
      .select(
        `
        *,
        ideas (
          title
        )
      `,
      )
      .eq("voter_id", userId)
      .order("distributed_at", { ascending: false })
      .limit(10);

    // Get rewards distributed for user's ideas
    const { data: rewardsDistributed, error: rewardsDistributedError } =
      await supabase
        .from("voting_rewards")
        .select(
          `
        *,
        ideas (
          title
        ),
        profiles:voter_id (
          name
        )
      `,
        )
        .eq("ideas.user_id", userId)
        .order("distributed_at", { ascending: false })
        .limit(10);

    // Get top ideas leaderboard (public ideas with high ratings and their rewards)
    const { data: topIdeasRaw, error: topIdeasError } = await supabase
      .from("ideas")
      .select(
        `
        *,
        profiles:user_id (
          name,
          avatar_url
        ),
        votes (
          rating
        ),
        voting_rewards (
          reward_amount
        )
      `,
      )
      .eq("privacy", "public")
      .order("rating", { ascending: false })
      .limit(5);

    // Process top ideas with rewards
    const topIdeas = (topIdeasRaw || [])
      .map((idea) => {
        const ratings = idea.votes?.map((v) => v.rating) || [];
        const averageRating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0;
        const totalRewards =
          idea.voting_rewards?.reduce((sum, r) => sum + r.reward_amount, 0) ||
          0;
        return {
          ...idea,
          rating: averageRating,
          votes_count: ratings.length,
          reward_amount: totalRewards,
        };
      })
      .sort((a, b) => b.reward_amount - a.reward_amount);

    // Process top ideas with average ratings
    const processedTopIdeas = (topIdeas || []).map((idea) => {
      const ratings = idea.votes?.map((v) => v.rating) || [];
      const averageRating =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;
      return {
        ...idea,
        rating: averageRating,
        votes_count: ratings.length,
      };
    });

    // Get credit transaction history for rewards
    const { data: creditTransactions, error: creditError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .in("transaction_type", ["reward_earned", "reward_given"])
      .order("created_at", { ascending: false })
      .limit(20);

    // Get recent notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Calculate stats for dashboard cards
    const totalRewardsEarned = (rewardsEarned || []).reduce(
      (sum, r) => sum + r.reward_amount,
      0,
    );
    const totalRewardsDistributed = (rewardsDistributed || []).reduce(
      (sum, r) => sum + r.reward_amount,
      0,
    );
    const averageRating =
      processedIdeas.length > 0
        ? (
            processedIdeas.reduce(
              (sum, idea) => sum + parseFloat(idea.rating),
              0,
            ) / processedIdeas.length
          ).toFixed(1)
        : 0;

    // Get current credit balance
    const currentCredits = profile?.credit_balance || 0;

    // Mock some additional stats for the template
    const monthlyVotingGoal = 50;
    const currentMonthVotes = (userVotes || []).filter((vote) => {
      const voteDate = new Date(vote.created_at);
      const now = new Date();
      return (
        voteDate.getMonth() === now.getMonth() &&
        voteDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const monthlyCreditGoal = 100;
    const currentMonthCredits = (creditTransactions || [])
      .filter((tx) => {
        const txDate = new Date(tx.created_at);
        const now = new Date();
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear() &&
          tx.transaction_type === "reward_earned"
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.render("notifications/voting-reward", {
      title: "Voting & Rewards Dashboard - Accelerator",
      bodyClass: "voting-reward-page",
      user: req.user,
      profile,
      ideas: processedIdeas,
      recentVotes: userVotes || [],
      rewardsEarned: rewardsEarned || [],
      rewardsDistributed: rewardsDistributed || [],
      topIdeas: processedTopIdeas,
      creditTransactions: creditTransactions || [],
      notifications: notifications || [],
      stats: {
        rewardsEarned: totalRewardsEarned,
        currentCredits,
        overallRating: averageRating,
        rewardsReceived: totalRewardsEarned, // Same as earned for display
        rewardsDistributed: totalRewardsDistributed,
        monthlyVotingGoal,
        currentMonthVotes,
        monthlyCreditGoal,
        currentMonthCredits,
        ideasCount: processedIdeas.length,
      },
      flash: res.locals.flash,
    });
  } catch (error) {
    console.error("Voting reward page error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load voting rewards dashboard",
    });
  }
});

// Voting Rewards Stats API
router.get("/api/voting-rewards/stats", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    const userId = req.user.id;

    // Get credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    // Get total votes given
    const { count: votesGiven } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get total earned from rewards
    const { data: rewardTransactions } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("transaction_type", "reward_earned");

    const totalEarned =
      rewardTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // Get earned in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentRewards } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("transaction_type", "reward_earned")
      .gte("created_at", thirtyDaysAgo.toISOString());

    const earned30d =
      recentRewards?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // Calculate success rate (ideas that reached validation threshold)
    const { data: userIdeas } = await supabase
      .from("ideas")
      .select("validation_threshold_met")
      .eq("user_id", userId);

    const totalIdeas = userIdeas?.length || 0;
    const successfulIdeas =
      userIdeas?.filter((idea) => idea.validation_threshold_met).length || 0;
    const successRate =
      totalIdeas > 0 ? Math.round((successfulIdeas / totalIdeas) * 100) : 0;

    // Get rewarding votes (votes that led to rewards)
    const { data: rewardingVotesData } = await supabase
      .from("voting_rewards")
      .select("reward_amount")
      .eq("voter_id", userId);

    const rewardingVotes = rewardingVotesData?.length || 0;
    const earned30dAmount = earned30d;

    // Return HTML for HTMX
    const html = `
      <!-- Credit Balance -->
      <div class="rounded-lg bg-card px-4 py-6 text-card-foreground shadow-sm border border-border">
        <div class="flex items-center justify-between px-3 py-1">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-medium text-muted-foreground">Credit Balance</h3>
            <p class="text-2xl font-semibold text-foreground">${profile?.credit_balance || 0}</p>
          </div>
          <div>
            <div class="bg-primary/20 rounded-lg">
              <div class="w-10 h-10 bg-primary/20 rounded-lg relative">
                <div class="flex items-center justify-center w-9 h-9 bg-primary rounded-lg absolute top-0.5 left-0.5">
                  <svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="flex items-center gap-1 text-sm font-medium text-muted-foreground mt-2">
          <span class="text-success">+${earned30d}</span>
          Earned (30d)
        </p>
      </div>

      <!-- Total Votes Given -->
      <div class="rounded-lg bg-card px-4 py-6 text-card-foreground shadow-sm border border-border">
        <div class="flex items-center justify-between px-3 py-1">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-medium text-muted-foreground">Votes Given</h3>
            <p class="text-2xl font-semibold text-foreground">${votesGiven || 0}</p>
          </div>
          <div>
            <div class="bg-info/20 rounded-lg">
              <div class="w-10 h-10 bg-info/20 rounded-lg relative">
                <div class="flex items-center justify-center w-9 h-9 bg-info rounded-lg absolute top-0.5 left-0.5">
                  <svg class="w-4 h-4 text-info-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="flex items-center gap-1 text-sm font-medium text-muted-foreground mt-2">
          <span class="text-success">${rewardingVotes}</span>
          Rewarding votes
        </p>
      </div>

      <!-- Total Earned -->
      <div class="rounded-lg bg-card px-4 py-6 text-card-foreground shadow-sm border border-border">
        <div class="flex items-center justify-between px-3 py-1">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-medium text-muted-foreground">Total Earned</h3>
            <p class="text-2xl font-semibold text-foreground">${totalEarned}</p>
          </div>
          <div>
            <div class="bg-success/20 rounded-lg">
              <div class="w-10 h-10 bg-success/20 rounded-lg relative">
                <div class="flex items-center justify-center w-9 h-9 bg-success rounded-lg absolute top-0.5 left-0.5">
                  <svg class="w-4 h-4 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="flex items-center gap-1 text-sm font-medium text-muted-foreground mt-2">
          <span class="text-success">+${earned30dAmount}</span>
          Earned (30d)
        </p>
      </div>

      <!-- Success Rate -->
      <div class="rounded-lg bg-card px-4 py-6 text-card-foreground shadow-sm border border-border">
        <div class="flex items-center justify-between px-3 py-1">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-medium text-muted-foreground">Success Rate</h3>
            <p class="text-2xl font-semibold text-foreground">${successRate}%</p>
          </div>
          <div>
            <div class="bg-warning/20 rounded-lg">
              <div class="w-10 h-10 bg-warning/20 rounded-lg relative">
                <div class="flex items-center justify-center w-9 h-9 bg-warning rounded-lg absolute top-0.5 left-0.5">
                  <svg class="w-4 h-4 text-warning-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="flex items-center gap-1 text-sm font-medium text-muted-foreground mt-2">
          Idea validation rate
        </p>
      </div>
    `;

    res.send(html);
  } catch (error) {
    console.error("Stats API error:", error);
    res
      .status(500)
      .send(
        '<div class="text-center py-4 text-red-600">Failed to load stats</div>',
      );
  }
});

// Voting Rewards Transactions API
router.get(
  "/api/voting-rewards/transactions",
  requireAuth,
  async (req, res) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceKey,
      );

      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .in("transaction_type", ["reward_earned", "reward_given"])
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Return HTML for HTMX
      let html = "";
      if (!transactions || transactions.length === 0) {
        html = `
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="lucide lucide-coins text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="8" r="6"></circle>
              <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
              <path d="M7 6h1v4"></path>
              <path d="m16.71 13.88.71.71-1.42 1.42"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">No reward transactions yet</h3>
          <p class="text-muted-foreground">Earn rewards by voting on ideas that reach validation threshold</p>
        </div>
      `;
      } else {
        transactions.forEach((transaction) => {
          const isEarned = transaction.transaction_type === "reward_earned";
          const amountClass = isEarned ? "text-success" : "text-destructive";
          const amountPrefix = isEarned ? "+" : "-";

          html += `
          <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 ${isEarned ? "bg-success/20" : "bg-destructive/20"} rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 ${amountClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-foreground">${getTransactionDescription(transaction)}</p>
                <p class="text-xs text-muted-foreground">${formatDate(transaction.created_at)}</p>
              </div>
            </div>
            <div class="text-sm font-semibold ${amountClass}">
              ${amountPrefix}${transaction.amount}
            </div>
          </div>
        `;
        });
      }

      res.send(html);
    } catch (error) {
      console.error("Transactions API error:", error);
      res
        .status(500)
        .send(
          '<div class="text-center py-4 text-red-600">Failed to load transactions</div>',
        );
    }
  },
);

// Voting Rewards Activity API
router.get("/api/voting-rewards/activity", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const { data: activity, error: activityError } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .in("action_type", ["vote_cast", "reward_earned", "shared_idea_voted"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Fetch idea titles separately since there's no direct foreign key relationship
    if (activity && activity.length > 0) {
      for (const item of activity) {
        if (item.details?.idea_id) {
          const { data: idea } = await supabase
            .from("ideas")
            .select("title")
            .eq("id", item.details.idea_id)
            .single();
          item.ideas = idea
            ? { title: idea.title }
            : { title: "Idea no longer available" };
        }
      }
    }

    if (activityError) {
      console.error(
        `Voting activity query error for user ${userId}:`,
        activityError,
      );
    }

    console.log(
      `Voting activity for user ${userId}: ${activity?.length || 0} items found`,
    );

    let html = "";
    if (!activity || activity.length === 0) {
      html = `
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="lucide lucide-star text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">No voting activity yet</h3>
          <p class="text-muted-foreground mb-4">Start voting on public ideas to earn rewards</p>
          <a href="/explore-idea" class="btn btn-primary">Explore Ideas</a>
        </div>
      `;
    } else {
      activity.forEach((item) => {
        html += `
          <div class="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm text-foreground">
                ${item.action_type === "vote_cast" ? "Voted on" : "Earned reward for"} <strong>"${item.ideas?.title || "Unknown Idea"}"</strong>
              </p>
              <p class="text-xs text-muted-foreground">${formatDate(item.created_at)}</p>
              ${item.details?.reward_amount ? `<p class="text-xs text-success font-medium">+${item.details.reward_amount} credits earned</p>` : ""}
            </div>
          </div>
        `;
      });
    }

    res.send(html);
  } catch (error) {
    console.error("Activity API error:", error);
    res
      .status(500)
      .send(
        '<div class="text-center py-4 text-red-600">Failed to load activity</div>',
      );
  }
});

// Ideas API for votable ideas
router.get("/api/ideas", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    const userId = req.user.id;
    const votable = req.query.votable === "true";
    const limit = parseInt(req.query.limit) || 10;

    let query = supabase
      .from("ideas")
      .select(
        `
        *,
        profiles:user_id (
          name
        ),
        votes (
          rating
        )
      `,
      )
      .neq("user_id", userId); // Exclude user's own ideas

    if (votable) {
      query = query.eq("privacy", "public");
    }

    const { data: ideas } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    // Process ideas with ratings
    const processedIdeas =
      ideas?.map((idea) => {
        const ratings = idea.votes?.map((v) => v.rating) || [];
        const averageRating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0;

        return {
          ...idea,
          average_rating: averageRating,
          votes_count: ratings.length,
        };
      }) || [];

    let html = "";
    if (processedIdeas.length === 0) {
      html = `
        <div class="text-center py-4">
          <p class="text-sm text-muted-foreground">No votable ideas available</p>
          <a href="/explore-idea" class="text-sm text-primary hover:underline">Explore more ideas</a>
        </div>
      `;
    } else {
      processedIdeas.forEach((idea) => {
        html += `
          <div class="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-foreground truncate">${idea.title}</h4>
              <p class="text-xs text-muted-foreground mb-2">${idea.category || "Uncategorized"}</p>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                  <span class="text-xs text-muted-foreground">${idea.average_rating}</span>
                </div>
                <button onclick="voteOnIdea('${idea.id}')" class="btn btn-primary btn-sm">
                  Vote
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }

    res.send(html);
  } catch (error) {
    console.error("Ideas API error:", error);
    res
      .status(500)
      .send(
        '<div class="text-center py-4 text-red-600">Failed to load ideas</div>',
      );
  }
});

// Vote on idea endpoint
router.post("/api/votes", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    const userId = req.user.id;
    const { idea_id, rating = 5 } = req.body;

    if (!idea_id) {
      return res.status(400).json({ error: "Idea ID is required" });
    }

    // Check if user already voted on this idea
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("idea_id", idea_id)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      return res
        .status(400)
        .json({ error: "You have already voted on this idea" });
    }

    // Insert vote
    const { error: voteError } = await supabase.from("votes").insert({
      idea_id,
      user_id: userId,
      rating: parseInt(rating),
    });

    if (voteError) {
      console.error("Vote insert error:", voteError);
      return res.status(500).json({ error: "Failed to cast vote" });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "vote_cast",
      entity_type: "idea",
      entity_id: idea_id,
      details: { rating },
    });

    // Check if idea reached validation threshold
    const { data: ideaVotes } = await supabase
      .from("votes")
      .select("rating")
      .eq("idea_id", idea_id);

    const averageRating =
      ideaVotes.reduce((sum, vote) => sum + vote.rating, 0) / ideaVotes.length;

    if (averageRating >= 3 && ideaVotes.length >= 3) {
      // Mark idea as validated
      await supabase
        .from("ideas")
        .update({ validation_threshold_met: true })
        .eq("id", idea_id);

      // Check if rewards already distributed
      const { data: existingRewards } = await supabase
        .from("voting_rewards")
        .select("id")
        .eq("idea_id", idea_id);

      if (!existingRewards || existingRewards.length === 0) {
        // Distribute rewards to all voters (5 credits total, shared equally)
        const rewardPerVoter = Math.floor(500 / ideaVotes.length); // 5 credits = 500 (assuming credits are stored as integers)

        for (const vote of ideaVotes) {
          await supabase.from("voting_rewards").insert({
            idea_id,
            voter_id: vote.user_id,
            reward_amount: rewardPerVoter,
          });

          // Update credit balance
          const { data: voterProfile } = await supabase
            .from("profiles")
            .select("credit_balance")
            .eq("user_id", vote.user_id)
            .single();

          const newBalance =
            (voterProfile?.credit_balance || 0) + rewardPerVoter;

          await supabase
            .from("profiles")
            .update({ credit_balance: newBalance })
            .eq("user_id", vote.user_id);

          // Record transaction
          await supabase.from("credit_transactions").insert({
            user_id: vote.user_id,
            transaction_type: "reward_earned",
            amount: rewardPerVoter,
            metadata: { idea_id, source: "voting" },
          });

          // Log reward activity
          await supabase.from("activity_log").insert({
            user_id: vote.user_id,
            action_type: "reward_earned",
            entity_type: "idea",
            entity_id: idea_id,
            details: { reward_amount: rewardPerVoter },
          });
        }
      }
    }

    res.json({ success: true, message: "Vote cast successfully!" });
  } catch (error) {
    console.error("Vote API error:", error);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

// Refresh endpoint for HTMX
router.get("/api/voting-rewards/refresh", requireAuth, (req, res) => {
  res.send(""); // Empty response for refresh trigger
});

// Helper functions
function getTransactionDescription(transaction) {
  switch (transaction.transaction_type) {
    case "reward_earned":
      return "Reward earned from voting";
    case "reward_given":
      return "Reward distributed";
    default:
      return transaction.transaction_type;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default router;
