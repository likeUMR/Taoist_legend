/**
 * 视频奖励管理类：负责管理每日视频升级次数 (原 AdManager，避开广告拦截器)
 */
export class VideoRewardManager {
  constructor() {
    this.limits = {
      'pet': 10,
      'cultivation': 5,
      'aura': 5,
      'skill': 10
    };
    
    this.counts = {
      'pet': 0,
      'cultivation': 0,
      'aura': 0,
      'skill': 0
    };
    
    this.lastResetDate = '';
    this.load();
    this.checkDailyReset();
  }

  load() {
    const saved = localStorage.getItem('taoist_video_data');
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
    } else {
      // 尝试兼容旧的 ad_data 键名
      const oldSaved = localStorage.getItem('taoist_ad_data');
      if (oldSaved) {
        const data = JSON.parse(oldSaved);
        this.counts = data.counts || this.counts;
        this.lastResetDate = data.lastResetDate || '';
      }
    }
  }

  save() {
    localStorage.setItem('taoist_video_data', JSON.stringify({
      counts: this.counts,
      lastResetDate: this.lastResetDate
    }));
  }

  checkDailyReset() {
    const today = new Date().toLocaleDateString();
    if (this.lastResetDate !== today) {
      this.counts = { 'pet': 0, 'cultivation': 0, 'aura': 0, 'skill': 0 };
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
      this.save();
      return true;
    }
    return false;
  }

  getLimit(category) {
    return this.limits[category];
  }
}
