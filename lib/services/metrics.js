// Metrics tracking service
import cacheService from './cache.js';

class MetricsService {
  constructor() {
    this.metrics = {};
  }

  // Track user activity
  async trackUserActivity(userId, action) {
    await cacheService.connect();
    if (!cacheService.client) {return;} // Skip if cache disabled

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `metrics:dau:${date}`;

    // Add user to daily active users set (using simple array for in-memory)
    const dauSet = (await cacheService.get(key)) || [];
    if (!dauSet.includes(userId)) {
      dauSet.push(userId);
      await cacheService.set(key, dauSet, 86400); // 24 hours
    }

    // Track specific action (using counter)
    const actionKey = `metrics:action:${action}:${date}`;
    const actionCount = (await cacheService.get(actionKey)) || 0;
    await cacheService.set(actionKey, actionCount + 1, 86400);

    // Track user actions
    const userActionKey = `metrics:user:${userId}:${action}:${date}`;
    const userActionCount = (await cacheService.get(userActionKey)) || 0;
    await cacheService.set(userActionKey, userActionCount + 1, 86400);
  }

  // Get daily active users
  async getDailyActiveUsers(date = null) {
    await cacheService.connect();
    if (!cacheService.client) {return 0;} // Return 0 if cache disabled

    date = date || new Date().toISOString().split('T')[0];
    const key = `metrics:dau:${date}`;
    const dauSet = (await cacheService.get(key)) || [];
    return dauSet.length;
  }

  // Get weekly active users
  async getWeeklyActiveUsers(date = null) {
    date = date || new Date();
    let weeklyCount = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(date.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const count = await this.getDailyActiveUsers(dateStr);
      weeklyCount = Math.max(weeklyCount, count); // Union of sets, but approximate
    }
    return weeklyCount;
  }

  // Track idea completion
  async trackIdeaCompletion(userId, ideaId, completionRate) {
    await cacheService.connect();
    if (!cacheService.client) {return;} // Skip if cache disabled

    const date = new Date().toISOString().split('T')[0];
    const key = `metrics:idea_completion:${date}`;

    // Increment completion count
    const count = (await cacheService.get(`${key}:count`)) || 0;
    await cacheService.set(`${key}:count`, count + 1, 86400);

    // Add to completion rate sum
    const rateSum = (await cacheService.get(`${key}:rate_sum`)) || 0;
    await cacheService.set(`${key}:rate_sum`, rateSum + completionRate, 86400);

    // Track user completions
    const userKey = `metrics:user:${userId}:completions:${date}`;
    const userCount = (await cacheService.get(userKey)) || 0;
    await cacheService.set(userKey, userCount + 1, 86400);
  }

  // Get idea completion rate
  async getIdeaCompletionRate(date = null) {
    await cacheService.connect();
    if (!cacheService.client) {return 0;} // Return 0 if cache disabled

    date = date || new Date().toISOString().split('T')[0];
    const key = `metrics:idea_completion:${date}`;

    const count = parseInt((await cacheService.get(`${key}:count`)) || '0');
    const rateSum = parseFloat(
      (await cacheService.get(`${key}:rate_sum`)) || '0',
    );

    return count > 0 ? rateSum / count : 0;
  }

  // Track report generation
  async trackReportGeneration(userId, reportType) {
    await cacheService.connect();
    if (!cacheService.client) {return;} // Skip if cache disabled

    const date = new Date().toISOString().split('T')[0];
    const key = `metrics:reports:${date}`;

    const total = (await cacheService.get(`${key}:total`)) || 0;
    await cacheService.set(`${key}:total`, total + 1, 86400);

    const reportTypeCount = (await cacheService.get(`${key}:${reportType}`)) || 0;
    await cacheService.set(`${key}:${reportType}`, reportTypeCount + 1, 86400);

    const userReports =
      (await cacheService.get(`metrics:user:${userId}:reports:${date}`)) || 0;
    await cacheService.set(
      `metrics:user:${userId}:reports:${date}`,
      userReports + 1,
      86400,
    );
  }

  // Get report stats
  async getReportStats(date = null) {
    await cacheService.connect();
    if (!cacheService.client)
      {return {
        total: 0,
        business: 0,
        financial: 0,
        team: 0,
        legal: 0,
        marketing: 0,
      };} // Return zeros if cache disabled

    date = date || new Date().toISOString().split('T')[0];
    const key = `metrics:reports:${date}`;

    const total = parseInt((await cacheService.get(`${key}:total`)) || '0');
    const business = parseInt(
      (await cacheService.get(`${key}:business`)) || '0',
    );
    const financial = parseInt(
      (await cacheService.get(`${key}:financial`)) || '0',
    );
    const team = parseInt((await cacheService.get(`${key}:team`)) || '0');
    const legal = parseInt((await cacheService.get(`${key}:legal`)) || '0');
    const marketing = parseInt(
      (await cacheService.get(`${key}:marketing`)) || '0',
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
    if (!cacheService.client) {return;} // Skip if cache disabled

    const date = new Date().toISOString().split('T')[0];

    const used = (await cacheService.get(`metrics:credits:used:${date}`)) || 0;
    await cacheService.set(
      `metrics:credits:used:${date}`,
      used + Math.abs(amount),
      86400,
    );

    const typeUsed =
      (await cacheService.get(`metrics:credits:${type}:${date}`)) || 0;
    await cacheService.set(
      `metrics:credits:${type}:${date}`,
      typeUsed + Math.abs(amount),
      86400,
    );

    const userUsed =
      (await cacheService.get(`metrics:user:${userId}:credits_used:${date}`)) ||
      0;
    await cacheService.set(
      `metrics:user:${userId}:credits_used:${date}`,
      userUsed + Math.abs(amount),
      86400,
    );
  }

  // Get credit utilization
  async getCreditUtilization(date = null) {
    await cacheService.connect();
    if (!cacheService.client)
      {return { used: 0, purchased: 0, earned: 0, utilizationRate: 0 };} // Return zeros if cache disabled

    date = date || new Date().toISOString().split('T')[0];

    const used = parseFloat(
      (await cacheService.get(`metrics:credits:used:${date}`)) || '0',
    );
    const purchased = parseFloat(
      (await cacheService.get(`metrics:credits:purchased:${date}`)) || '0',
    );
    const earned = parseFloat(
      (await cacheService.get(`metrics:credits:earned:${date}`)) || '0',
    );

    return {
      used,
      purchased,
      earned,
      utilizationRate: purchased + earned > 0 ? used / (purchased + earned) : 0,
    };
  }

  // Get voting participation
  async getVotingParticipation(date = null) {
    await cacheService.connect();
    if (!cacheService.client) {return { totalVotes: 0, uniqueVoters: 0 };} // Return zeros if cache disabled

    date = date || new Date().toISOString().split('T')[0];

    const totalVotes = parseInt(
      (await cacheService.get(`metrics:votes:${date}`)) || '0',
    );
    const voters = (await cacheService.get(`metrics:voters:${date}`)) || [];
    const uniqueVoters = voters.length;

    return { totalVotes, uniqueVoters };
  }

  // Get user retention (simplified - users active in last 7 days who were active 30 days ago)
  async getUserRetention() {
    await cacheService.connect();
    if (!cacheService.client) {return 0;} // Return 0 if cache disabled

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const date30 = thirtyDaysAgo.toISOString().split('T')[0];
    const date7 = sevenDaysAgo.toISOString().split('T')[0];

    const users30DaysAgo =
      (await cacheService.get(`metrics:dau:${date30}`)) || [];
    const users7DaysAgo =
      (await cacheService.get(`metrics:dau:${date7}`)) || [];

    const retainedUsers = users30DaysAgo.filter((user) =>
      users7DaysAgo.includes(user),
    );

    return users30DaysAgo.length > 0
      ? (retainedUsers.length / users30DaysAgo.length) * 100
      : 0;
  }

  // Get all metrics summary
  async getMetricsSummary() {
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
