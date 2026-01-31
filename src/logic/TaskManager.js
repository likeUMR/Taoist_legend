import { GameConfig } from './GameConfig.js';

/**
 * 任务管理类：负责加载任务配置、跟踪任务进度和奖励领取
 */
export class TaskManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    this.tasks = []; // 任务配置列表
    this.currentTaskIndex = 0; // 当前进行的任务索引
    
    // 玩家数据跟踪
    this.maxLevelReached = 0; // 已到达过的最高关卡
    this.totalUpgrades = 0;    // 累计强化成功次数 (不含突破)
    
    this.isLoaded = false;
    this.onUpdate = null; // UI 更新回调

    this.load();
  }

  /**
   * 加载持久化数据
   */
  load() {
    const saved = GameConfig.getStorageItem('taoist_task_progress');
    if (saved) {
      const data = JSON.parse(saved);
      this.currentTaskIndex = data.currentTaskIndex || 0;
      this.maxLevelReached = data.maxLevelReached || 0;
      this.totalUpgrades = data.totalUpgrades || 0;
    }
  }

  /**
   * 保存持久化数据
   */
  save() {
    GameConfig.setStorageItem('taoist_task_progress', JSON.stringify({
      currentTaskIndex: this.currentTaskIndex,
      maxLevelReached: this.maxLevelReached,
      totalUpgrades: this.totalUpgrades
    }));
  }

  /**
   * 初始化：加载任务配置表
   */
  async init() {
    try {
      const response = await fetch('./data/tasks.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [id, reward, levelReq, upgradeReq] = line.split(',');
        this.tasks.push({
          id: parseInt(id),
          rewardGold: parseFloat(reward),
          levelReq: levelReq ? parseInt(levelReq) : null,
          upgradeReq: upgradeReq ? parseInt(upgradeReq) : null
        });
      }
      this.isLoaded = true;
      console.log(`【系统】成功加载 ${this.tasks.length} 条任务数据`);
      this.triggerUpdate();
    } catch (err) {
      console.error('【系统】加载任务数据失败:', err);
    }
  }

  /**
   * 记录最高到达关卡
   */
  recordLevelReached(level) {
    if (level > this.maxLevelReached) {
      this.maxLevelReached = level;
      this.save();
      this.triggerUpdate();
    }
  }

  /**
   * 记录强化成功
   */
  recordUpgrade() {
    this.totalUpgrades++;
    this.save();
    this.triggerUpdate();
  }

  /**
   * 获取当前任务对象
   */
  getCurrentTask() {
    if (!this.isLoaded || this.currentTaskIndex >= this.tasks.length) return null;
    return this.tasks[this.currentTaskIndex];
  }

  /**
   * 检查当前任务是否完成
   */
  isCurrentTaskCompleted() {
    const task = this.getCurrentTask();
    if (!task) return false;

    // 检查通关要求 (当前到达的关卡编号需要 > 要求关卡，即表示该关已通关)
    if (task.levelReq !== null && this.maxLevelReached <= task.levelReq) {
      return false;
    }

    // 检查强化要求 (累计强化成功次数 >= 要求即可)
    if (task.upgradeReq !== null && this.totalUpgrades < task.upgradeReq) {
      return false;
    }

    return true;
  }

  /**
   * 领取奖励并进入下一个任务
   */
  claimReward() {
    if (!this.isCurrentTaskCompleted()) return { success: false, reason: "任务尚未完成" };

    const task = this.getCurrentTask();
    this.currencyManager.addGold(task.rewardGold);
    
    console.log(`【任务】领取奖励: ${task.rewardGold} 金币`);
    
    this.currentTaskIndex++;
    this.save();
    this.triggerUpdate();
    
    return { success: true, reward: task.rewardGold };
  }

  /**
   * 获取任务描述文字
   */
  getTaskDescription() {
    const task = this.getCurrentTask();
    if (!task) return "全部任务已完成";

    if (task.levelReq !== null) {
      return `通关第 ${task.levelReq} 层 (${Math.max(0, this.maxLevelReached - 1)}/${task.levelReq})`;
    }
    if (task.upgradeReq !== null) {
      return `累计强化成功 ${task.upgradeReq} 次 (${this.totalUpgrades}/${task.upgradeReq})`;
    }
    return "未知任务";
  }

  triggerUpdate() {
    if (this.onUpdate) {
      this.onUpdate();
    }
  }
}
