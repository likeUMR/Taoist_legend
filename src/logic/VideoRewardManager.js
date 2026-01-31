import { GameConfig } from './GameConfig.js';

/**
 * 视频奖励管理类：负责管理每日视频升级次数 (原 AdManager，避开广告拦截器)
 */
export class VideoRewardManager {
  constructor() {
    this.limits = {
      'pet': 10,
      'cultivation': 5,
      'aura': 5,
      'skill': 10,
      'mana': 99,
      'essence': 999999 // 取消限制，设为一个极大值
    };
    
    this.counts = {
      'pet': 0,
      'cultivation': 0,
      'aura': 0,
      'skill': 0,
      'mana': 0,
      'essence': 0
    };
    
    this.lastResetDate = '';
    this.totalWatched = 0; // 新增：累计观看次数
    this.load();
    this.checkDailyReset();
  }

  load() {
    const saved = GameConfig.getStorageItem('taoist_video_data');
    if (saved) {
      const data = JSON.parse(saved);
      // 合并旧数据，确保新增加的分类 (如 aura) 即使在旧存档中不存在也能初始化为 0
      if (data.counts) {
        for (const key in this.counts) {
          if (data.counts[key] !== undefined) {
            this.counts[key] = data.counts[key];
          }
        }
      }
      this.lastResetDate = data.lastResetDate || '';
      this.totalWatched = data.totalWatched || 0; // 加载累计次数
    } else {
      // 尝试兼容旧的 ad_data 键名
      const oldSaved = GameConfig.getStorageItem('taoist_ad_data');
      if (oldSaved) {
        const data = JSON.parse(oldSaved);
        this.counts = data.counts || this.counts;
        this.lastResetDate = data.lastResetDate || '';
        this.totalWatched = data.totalWatched || 0;
      }
    }
  }

  save() {
    GameConfig.setStorageItem('taoist_video_data', JSON.stringify({
      counts: this.counts,
      lastResetDate: this.lastResetDate,
      totalWatched: this.totalWatched // 保存累计次数
    }));
  }

  checkDailyReset() {
    const today = new Date().toLocaleDateString();
    if (this.lastResetDate !== today) {
      this.counts = { 'pet': 0, 'cultivation': 0, 'aura': 0, 'skill': 0, 'mana': 0, 'essence': 0 };
      this.lastResetDate = today;
      this.save();
    }
  }

  /**
   * 获取剩余次数
   * @param {string} category 'pet' | 'cultivation'
   */
  getRemaining(category) {
    this.checkDailyReset();
    return Math.max(0, this.limits[category] - this.counts[category]);
  }

  /**
   * 消耗一次机会
   * @param {string} category 
   */
  consumeVideo(category) {
    if (this.getRemaining(category) > 0) {
      this.counts[category]++;
      this.totalWatched++; // 增加累计观看次数
      this.save();
      return true;
    }
    return false;
  }

  getTotalWatched() {
    return this.totalWatched;
  }

  getLimit(category) {
    return this.limits[category];
  }

  /**
   * 检查是否允许通过视频升级（基于当前关卡产出）
   * @param {number} cost 升级所需金币
   * @returns {boolean}
   */
  isUpgradeAllowed(cost) {
     if (!window.levelManager) {
       console.warn('【系统】LevelManager 未就绪，无法检查视频升级许可');
       return false; // 严格模式：未就绪时不允许
     }
     
     const currentLevel = window.levelManager.currentLevel;
     const levelData = window.levelManager.levelDataMap.get(currentLevel);
     
     if (!levelData) {
       console.warn(`【系统】找不到第 ${currentLevel} 层的关卡数据，无法检查视频升级许可`);
       return true; // 如果找不到数据（可能是数据错误），允许升级以防卡死
     }
     
     const maxAllowedCost = levelData.rewardGold * 1000;
     const allowed = cost <= maxAllowedCost;
     
     if (!allowed) {
       // console.log(`【系统】视频升级限制：当前价格 ${cost} > 关卡上限 ${maxAllowedCost}`);
     }
     
     return allowed;
   }
}
