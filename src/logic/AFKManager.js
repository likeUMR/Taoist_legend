import { formatNumber } from '../utils/format.js';
import { GameConfig } from './GameConfig.js';

/**
 * 挂机奖励管理类：负责挂机奖励的逻辑计算与数据持久化
 */
export class AFKManager {
  constructor(currencyManager, taskManager, levelDataMap) {
    this.currencyManager = currencyManager;
    this.taskManager = taskManager;
    this.levelDataMap = levelDataMap;

    this.MAX_AFK_TIME = 5 * 3600; // 5小时上限 (秒)
    this.lastClaimTime = Date.now();
    this.selectedStage = 0;
    
    // 初始化时尝试从本地加载
    this.load();
    
    // 初始选择关卡
    const afkLevel = this.getAFKLevel();
    if (this.selectedStage === 0) {
      this.selectedStage = afkLevel * 10;
    }
  }

  /**
   * 获取挂机等级：最高通关关卡数 / 10 向下取整
   */
  getAFKLevel() {
    // maxLevelReached 表示已到达的最高关卡索引，也就等于是通关的总关卡数
    return Math.floor(this.taskManager.maxLevelReached / 10);
  }

  /**
   * 获取当前挂机时间（秒），受上限限制
   */
  getAFKTimeSeconds() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.lastClaimTime) / 1000);
    return Math.min(elapsedSeconds, this.MAX_AFK_TIME);
  }

  /**
   * 挂机奖励是否已满
   */
  isMaxed() {
    return this.getAFKTimeSeconds() >= this.MAX_AFK_TIME;
  }

  /**
   * 格式化挂机时间为 HH:MM:SS
   */
  getFormattedAFKTime() {
    const totalSeconds = this.getAFKTimeSeconds();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (this.isMaxed()) {
      timeStr += " (已满)";
    }
    return timeStr;
  }

  /**
   * 获取指定关卡的金币效率（每小时）
   */
  getGoldEfficiency(stage = this.selectedStage) {
    const config = this.levelDataMap.get(stage);
    if (!config) return 0;
    // 数值 = 对应关卡的总报酬 * 30 / h
    return config.rewardGold * 30;
  }

  /**
   * 获取累计奖励
   */
  calculateRewards() {
    const seconds = this.getAFKTimeSeconds();
    const minutes = seconds / 60;
    const hours = seconds / 3600;
    const afkLevel = this.getAFKLevel();

    // 实际金币产出：基于当前可挂机的最高等级对应的效率 (lv * 10)
    const productionStage = afkLevel * 10;
    const actualEfficiency = this.getGoldEfficiency(productionStage);
    const gold = Math.floor(actualEfficiency * hours);
    
    // 元宝：每分钟产出 lv * 0.09
    const ingot = Math.floor(minutes * afkLevel * 0.09);
    
    // 灵符：每分钟产出 lv * 0.11
    const lingfu = Math.floor(minutes * afkLevel * 0.11);

    return { gold, ingot, lingfu };
  }

  /**
   * 领取奖励
   * @param {boolean} double 是否双倍领取
   */
  claim(double = false) {
    const rewards = this.calculateRewards();
    const multiplier = double ? 2 : 1;

    const finalGold = rewards.gold * multiplier;
    const finalIngot = rewards.ingot * multiplier;
    const finalLingfu = rewards.lingfu * multiplier;

    this.currencyManager.addGold(finalGold);
    this.currencyManager.addIngot(finalIngot);
    this.currencyManager.addLingfu(finalLingfu);

    console.log(`【挂机】领取奖励: 金币 x${finalGold}, 元宝 x${finalIngot}, 灵符 x${finalLingfu}${double ? ' (双倍)' : ''}`);

    this.lastClaimTime = Date.now();
    this.save();
    
    return { gold: finalGold, ingot: finalIngot, lingfu: finalLingfu };
  }

  /**
   * 切换选中关卡
   */
  setSelectedStage(stage) {
    // 允许预览任何关卡，不再受限于已通关关卡
    this.selectedStage = Math.max(0, stage);
    this.save();
  }

  save() {
    const data = {
      lastClaimTime: this.lastClaimTime,
      selectedStage: this.selectedStage
    };
    GameConfig.setStorageItem('taoist_afk_data', JSON.stringify(data));
  }

  load() {
    const saved = GameConfig.getStorageItem('taoist_afk_data');
    if (saved) {
      const data = JSON.parse(saved);
      this.lastClaimTime = data.lastClaimTime || Date.now();
      this.selectedStage = data.selectedStage || 0;
    }
  }
}
