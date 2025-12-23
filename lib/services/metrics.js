// Metrics tracking service
import cacheService from "./cache.js";

class MetricsService {
  constructor() {
    this.metrics = {};
  }

  // Track user activity
  async trackUserActivity(userId, action) {
    await cacheService.connect();
    if (!cacheService.client) return; // Skip if Redis disabled

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const key = `metrics:dau:${date}`;

    // Add user to daily active users set
    await cacheService.client.sAdd(key, userId);

    // Track specific action
    const actionKey = `metrics:action:${action}:${date}`;
    await cacheService.client.incr(actionKey);

    // Track user actions
    const userActionKey = `metrics:user:${userId}:${action}:${date}`;
    await cacheService.client.incr(userActionKey);
  }

  // Get daily active users
  async getDailyActiveUsers(date = null) {
    await cacheService.connect();
    if (!cacheService.client) return 0; // Return 0 if Redis disabled

    date = date || new Date().toISOString().split("T")[0];
    const key = `metrics:dau:${date}`;
    return await cacheService.client.sCard(key);
  }

  // Get weekly active users
  async getWeeklyActiveUsers(date = null) {
    date = date || new Date();
    let weeklyCount = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(date.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const count = await this.getDailyActiveUsers(dateStr);
      weeklyCount = Math.max(weeklyCount, count); // Union of sets, but approximate
    }
    return weeklyCount;
  }

  // Track idea completion
  async trackIdeaCompletion(userId, ideaId, completionRate) {
    await cacheService.connect();
    if (!cacheService.client) return; // Skip if Redis disabled

    const date = new Date().toISOString().split("T")[0];
    const key = `metrics:idea_completion:${date}`;

    // Increment completion count
    await cacheService.client.incr(`${key}:count`);

    // Add to completion rate sum
    await cacheService.client.incrByFloat(`${key}:rate_sum`, completionRate);

    // Track user completions
    const userKey = `metrics:user:${userId}:completions:${date}`;
    await cacheService.client.incr(userKey);
  }

  // Get idea completion rate
  async getIdeaCompletionRate(date = null) {
    await cacheService.connect();
    if (!cacheService.client) return 0; // Return 0 if Redis disabled

    date = date || new Date().toISOString().split("T")[0];
    const key = `metrics:completion:${date}`;

    const count = parseInt(
      (await cacheService.client.get(`${key}:count`)) || "0",
    );
    const rateSum = parseFloat(
      (await cacheService.client.get(`${key}:rate_sum`)) || "0",
    );

    return count > 0 ? rateSum / count : 0;
  }

  // Track report generation
  async trackReportGeneration(userId, reportType) {
    await cacheService.connect();
    if (!cacheService.client) return; // Skip if Redis disabled

    const date = new Date().toISOString().split("T")[0];
    const key = `metrics:reports:${date}`;

    await cacheService.client.incr(`${key}:total`);
    await cacheService.client.incr(`${key}:${reportType}`);
    await cacheService.client.incr(`metrics:user:${userId}:reports:${date}`);
  }

  // Get report stats
  async getReportStats(date = null) {
    await cacheService.connect();
    if (!cacheService.client)
      return {
        total: 0,
        business: 0,
        financial: 0,
        team: 0,
        legal: 0,
        marketing: 0,
      }; // Return zeros if Redis disabled

    date = date || new Date().toISOString().split("T")[0];
    const key = `metrics:reports:${date}`;

    const total = parseInt(
      (await cacheService.client.get(`${key}:total`)) || "0",
    );
    const business = parseInt(
      (await cacheService.client.get(`${key}:business`)) || "0",
    );
    const financial = parseInt(
      (await cacheService.client.get(`${key}:financial`)) || "0",
    );
    const team = parseInt(
      (await cacheService.client.get(`${key}:team`)) || "0",
    );
    const legal = parseInt(
      (await cacheService.client.get(`${key}:legal`)) || "0",
    );
    const marketing = parseInt(
      (await cacheService.client.get(`${key}:marketing`)) || "0",
    );

    return {
      total,
      business,
      financial,
      team,
      legal,
      marketing,
    };
  }

  // Track credit utilization
  async trackCreditUsage(userId, amount, type) {
    await cacheService.connect();
    if (!cacheService.client) return; // Skip if Redis disabled

    const date = new Date().toISOString().split("T")[0];

    await cacheService.client.incrByFloat(
      `metrics:credits:used:${date}`,
      Math.abs(amount),
    );
    await cacheService.client.incrByFloat(
      `metrics:credits:${type}:${date}`,
      Math.abs(amount),
    );
    await cacheService.client.incrByFloat(
      `metrics:user:${userId}:credits_used:${date}`,
      Math.abs(amount),
    );
  }

  // Get credit utilization
  async getCreditUtilization(date = null) {
    await cacheService.connect();
    if (!cacheService.client)
      return { used: 0, purchased: 0, earned: 0, utilizationRate: 0 }; // Return zeros if Redis disabled

    date = date || new Date().toISOString().split("T")[0];

    const used = parseFloat(
      (await cacheService.client.get(`metrics:credits:used:${date}`)) || "0",
    );
    const purchased = parseFloat(
      (await cacheService.client.get(`metrics:credits:purchased:${date}`)) ||
        "0",
    );
    const earned = parseFloat(
      (await cacheService.client.get(`metrics:credits:earned:${date}`)) || "0",
    );

    return {
      used,
      purchased,
      earned,
      utilizationRate: purchased + earned > 0 ? used / (purchased + earned) : 0,
    };
  }

  // Track voting participation
  async trackVote(userId, ideaId) {
    await cacheService.connect();
    if (!cacheService.client) return; // Skip if Redis disabled

    const date = new Date().toISOString().split("T")[0];

    await cacheService.client.incr(`metrics:votes:${date}`);
    await cacheService.client.incr(`metrics:user:${userId}:votes:${date}`);
    await cacheService.client.sAdd(`metrics:voters:${date}`, userId);
  }

  // Get voting participation
  async getVotingParticipation(date = null) {
    await cacheService.connect();
    if (!cacheService.client) return { totalVotes: 0, uniqueVoters: 0 }; // Return zeros if Redis disabled

    date = date || new Date().toISOString().split("T")[0];

    const totalVotes = parseInt(
      (await cacheService.client.get(`metrics:votes:${date}`)) || "0",
    );
    const uniqueVoters = await cacheService.client.sCard(
      `metrics:voters:${date}`,
    );

    return { totalVotes, uniqueVoters };
  }

  // Get user retention (simplified - users active in last 7 days who were active 30 days ago)
  async getUserRetention() {
    await cacheService.connect();
    if (!cacheService.client) return 0; // Return 0 if Redis disabled

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const date30 = thirtyDaysAgo.toISOString().split("T")[0];
    const date7 = sevenDaysAgo.toISOString().split("T")[0];

    const users30DaysAgo = await cacheService.client.sMembers(
      `metrics:dau:${date30}`,
    );
    const users7DaysAgo = await cacheService.client.sMembers(
      `metrics:dau:${date7}`,
    );

    const retainedUsers = users30DaysAgo.filter((user) =>
      users7DaysAgo.includes(user),
    );

    return users30DaysAgo.length > 0
      ? (retainedUsers.length / users30DaysAgo.length) * 100
      : 0;
  }

  // Get all metrics summary
  async getMetricsSummary() {
    const date = new Date().toISOString().split("T")[0];

    return {
      dailyActiveUsers: await this.getDailyActiveUsers(),
      weeklyActiveUsers: await this.getWeeklyActiveUsers(),
      ideaCompletionRate: await this.getIdeaCompletionRate(),
      reportStats: await this.getReportStats(),
      creditUtilization: await this.getCreditUtilization(),
      votingParticipation: await this.getVotingParticipation(),
      userRetention: await this.getUserRetention(),
    };
  }
}

const metricsService = new MetricsService();

export default metricsService;
