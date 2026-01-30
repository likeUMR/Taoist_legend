import { GameConfig } from './GameConfig.js';

/**
 * 在线奖励管理类：负责累计在线时长、维护领取状态、跨天重置等
 */
export class OnlineRewardManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    
    // 奖励配置：5, 10, 15, 20, 30, 45, 60, 90, 120 分钟
    // 灵符和元宝交替
    this.rewardsConfig = [
      { minutes: 5, type: 'lingfu', amount: 200, icon: 'stone' },
      { minutes: 10, type: 'ingot', amount: 250, icon: 'ingot' },
      { minutes: 15, type: 'lingfu', amount: 400, icon: 'stone' },
      { minutes: 20, type: 'ingot', amount: 500, icon: 'ingot' },
      { minutes: 30, type: 'lingfu', amount: 600, icon: 'stone' },
      { minutes: 45, type: 'ingot', amount: 800, icon: 'ingot' },
      { minutes: 60, type: 'lingfu', amount: 1000, icon: 'stone' },
      { minutes: 90, type: 'ingot', amount: 1500, icon: 'ingot' },
      { minutes: 120, type: 'lingfu', amount: 2000, icon: 'stone' }
    ];

    this.onlineTime = 0; // 当日在线总时长 (秒)
    this.claimedIndices = []; // 已领取奖励的索引数组
    this.lastUpdateDate = new Date().toDateString(); // 上次记录日期

    this.onUpdate = null; // 时长更新回调 (用于 UI)
    
    this.load();
    this.checkDailyReset();
  }

  /**
   * 检查是否需要跨天重置
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.lastUpdateDate !== today) {
      this.onlineTime = 0;
      this.claimedIndices = [];
      this.lastUpdateDate = today;
      this.save();
    }
  }

  /**
   * 每秒/分钟更新时长
   * @param {number} dt 过去的时间 (秒)
   */
  update(dt) {
    this.checkDailyReset();
    this.onlineTime += dt;
    this.save();
    
    if (this.onUpdate) {
      this.onUpdate(this.onlineTime);
    }
  }

  /**
   * 领取奖励
   * @param {number} index 奖励索引
   */
  claimReward(index) {
    const reward = this.rewardsConfig[index];
    if (!reward) return { success: false, reason: '奖励不存在' };
    
    if (this.isClaimed(index)) {
      return { success: false, reason: '奖励已领取' };
    }
    
    if (!this.canClaim(index)) {
      return { success: false, reason: '在线时长不足' };
    }
    
    // 发放奖励
    if (reward.type === 'lingfu') {
      this.currencyManager.addLingfu(reward.amount);
    } else if (reward.type === 'ingot') {
      this.currencyManager.addIngot(reward.amount);
    }
    
    this.claimedIndices.push(index);
    this.save();
    
    return { success: true, reward };
  }

  isClaimed(index) {
    return this.claimedIndices.includes(index);
  }

  canClaim(index) {
    const reward = this.rewardsConfig[index];
    return this.onlineTime >= reward.minutes * 60;
  }

  getProgress(index) {
    const reward = this.rewardsConfig[index];
    const currentMins = Math.floor(this.onlineTime / 60);
    return {
      current: Math.min(currentMins, reward.minutes),
      target: reward.minutes,
      percent: Math.min(100, (currentMins / reward.minutes) * 100)
    };
  }

  save() {
    const data = {
      onlineTime: this.onlineTime,
      claimedIndices: this.claimedIndices,
      lastUpdateDate: this.lastUpdateDate
    };
    GameConfig.setStorageItem('taoist_online_reward_data', JSON.stringify(data));
  }

  load() {
    const saved = GameConfig.getStorageItem('taoist_online_reward_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.onlineTime = data.onlineTime || 0;
        this.claimedIndices = data.claimedIndices || [];
        this.lastUpdateDate = data.lastUpdateDate || new Date().toDateString();
      } catch (e) {
        console.error('Failed to load online reward data', e);
      }
    }
  }
}
