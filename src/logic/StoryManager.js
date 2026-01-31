import { GameConfig } from './GameConfig.js';

/**
 * 剧情管理类：负责管理剧情对话序列、触发条件和奖励
 */
export class StoryManager {
  constructor(petCollection) {
    this.petCollection = petCollection;
    this.stories = [];
    this.isLoaded = false;
    
    // 任务状态
    this.currentStoryIndex = 0;
    this.taskStartTime = 0;
    this.taskDuration = 3 * 24 * 60 * 60 * 1000; // 3天 (毫秒)
    this.maxClassLevel = 0;
    this.isTaskClaimable = false;
    
    // 奖励配置
    this.rewardGrades = ['C', 'C', 'C', 'B', 'B', 'B', 'A', 'A', 'S', 'S'];
    
    this.onTaskUpdate = null; // 状态更新回调
  }

  /**
   * 从 JSON 文件加载剧情数据并初始化阶级要求
   */
  async loadStories() {
    try {
      const response = await fetch('./data/stories.json');
      this.stories = await response.json();
      
      // 等待 petCollection 加载完配置后计算最大阶级
      if (this.petCollection.upgradeConfigs.size === 0) {
        await this.petCollection.init();
      }
      
      this.calculateMaxClassLevel();
      this.loadState();
      this.isLoaded = true;
      console.log(`【系统】成功加载 ${this.stories.length} 条剧情数据，最大阶级: CL.${this.maxClassLevel}`);
      
      // 初始化第一个任务的时间
      if (this.taskStartTime === 0) {
        this.startNewTask();
      }
    } catch (err) {
      console.error('【系统】加载剧情数据失败:', err);
    }
  }

  /**
   * 计算配置表中的最大阶级
   */
  calculateMaxClassLevel() {
    let maxLevel = 0;
    this.petCollection.upgradeConfigs.forEach((_, level) => {
      if (level > maxLevel) maxLevel = level;
    });

    let classLevel = 0;
    for (let i = 1; i <= maxLevel; i++) {
      const cfg = this.petCollection.upgradeConfigs.get(i);
      if (cfg && cfg.isBreakthrough) {
        classLevel++;
      }
    }
    this.maxClassLevel = classLevel;
  }

  /**
   * 开始一个新任务
   */
  startNewTask() {
    this.taskStartTime = Date.now();
    this.isTaskClaimable = false;
    this.saveState();
  }

  /**
   * 获取当前任务要求的阶级
   */
  getRequiredClassLevel() {
    // 均匀分布：向上取整(当前任务序号 / 总任务数 * 最大阶级)
    const step = this.maxClassLevel / this.stories.length;
    return Math.ceil((this.currentStoryIndex + 1) * step);
  }

  /**
   * 检查任务状态
   */
  checkTaskStatus() {
    if (!this.isLoaded) return;

    const now = Date.now();
    const timeLeft = this.getTimeLeft();

    // 1. 检查是否超时
    if (timeLeft <= 0) {
      this.failTask();
      return;
    }

    // 2. 检查是否达成要求 (任意战宠达到要求阶级)
    if (!this.isTaskClaimable) {
      const requiredCL = this.getRequiredClassLevel();
      const listData = this.petCollection.getPetListData();
      const hasMetRequirement = listData.some(p => p.unlocked && p.classLevel >= requiredCL);
      
      if (hasMetRequirement) {
        this.isTaskClaimable = true;
        this.saveState();
      }
    }
  }

  /**
   * 领取奖励并切换到下一个
   */
  claimReward() {
    if (!this.isTaskClaimable) return { success: false };
    
    const grade = this.rewardGrades[this.currentStoryIndex] || 'C';
    let skinResult = null;
    
    if (window.unlockRandomSkin) {
      skinResult = window.unlockRandomSkin(grade);
    }
    
    console.log(`【剧情】领取剧情任务 ${this.currentStoryIndex + 1} 奖励 (档次: ${grade})`);
    
    this.nextStory();
    return { success: true, skinResult };
  }

  /**
   * 任务失败逻辑
   */
  failTask() {
    console.log(`【剧情】剧情任务 ${this.currentStoryIndex + 1} 超时失败`);
    this.nextStory();
  }

  /**
   * 切换到下一段剧情
   */
  nextStory() {
    this.currentStoryIndex = (this.currentStoryIndex + 1) % this.stories.length;
    this.startNewTask();
    if (this.onTaskUpdate) this.onTaskUpdate();
  }

  /**
   * 获取剩余时间 (秒)
   */
  getTimeLeft() {
    const elapsed = Date.now() - this.taskStartTime;
    return Math.max(0, Math.floor((this.taskDuration - elapsed) / 1000));
  }

  /**
   * 获取当前剧情数据
   */
  getCurrentStory() {
    return this.stories[this.currentStoryIndex];
  }

  /**
   * 持久化状态
   */
  saveState() {
    const state = {
      index: this.currentStoryIndex,
      startTime: this.taskStartTime,
      isClaimable: this.isTaskClaimable
    };
    GameConfig.setStorageItem('taoist_legend_story_state', JSON.stringify(state));
  }

  /**
   * 加载持久化状态
   */
  loadState() {
    const saved = GameConfig.getStorageItem('taoist_legend_story_state');
    if (saved) {
      const state = JSON.parse(saved);
      this.currentStoryIndex = state.index || 0;
      this.taskStartTime = state.startTime || 0;
      this.isTaskClaimable = state.isClaimable || false;
    }
  }
}
