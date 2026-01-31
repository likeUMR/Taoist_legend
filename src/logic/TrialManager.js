/**
 * 试炼管理类：管理强运试炼和速度试炼的关卡数据、进度及挑战状态
 */
export class TrialManager {
  constructor(options) {
    this.levelManager = options.levelManager;
    this.currencyManager = options.currencyManager;
    
    // 试炼数据
    this.retryLevels = []; // 强运试炼关卡
    this.speedLevels = []; // 速度试炼关卡
    this.manaLevels = [];  // 法力试炼关卡
    
    // 玩家进度
    this.progress = {
      retry: 0, // 已通关的强运试炼关卡索引
      speed: 0, // 已通关的速度试炼关卡索引
      mana: 0   // 已通关的法力试炼关卡索引
    };
    
    // 当前状态
    this.currentTrial = null; // { type: 'retry'|'speed'|'mana', levelIndex: number }
    this.normalLevelBackup = 0; // 进入试炼前备份普通关卡层数

    // 缓存奖励数值
    this.rewards = {
      retryProb: 0,
      speedMultiplier: 1.0,
      manaCapBonus: 0
    };
    
    this.loadProgress();
    this.updateRewards();
  }

  /**
   * 更新奖励数值
   */
  updateRewards() {
    // 强运试炼奖励：通关的最高关对应的概率
    if (this.progress.retry > 0) {
      const maxRetryIndex = this.progress.retry - 1;
      if (this.retryLevels[maxRetryIndex]) {
        this.rewards.retryProb = this.retryLevels[maxRetryIndex].retryProb;
      }
    } else {
      this.rewards.retryProb = 0;
    }

    // 速度试炼奖励：通关的最高试炼的提升幅度 (独立)
    if (this.progress.speed > 0) {
      const maxSpeedIndex = this.progress.speed - 1;
      if (this.speedLevels[maxSpeedIndex]) {
        this.rewards.speedMultiplier = this.speedLevels[maxSpeedIndex].speedMultiplier || 1.0;
      }
    } else {
      this.rewards.speedMultiplier = 1.0;
    }

    // 法力试炼奖励：通关的最高试炼的数值
    if (this.progress.mana > 0) {
      const maxManaIndex = this.progress.mana - 1;
      if (this.manaLevels[maxManaIndex]) {
        this.rewards.manaCapBonus = this.manaLevels[maxManaIndex].manaCap || 0;
      }
    } else {
      this.rewards.manaCapBonus = 0;
    }

    // 触发 StatManager 重新计算 (如果已经全局暴露)
    if (window.statManager) {
      window.statManager.recalculate();
    }

    console.log(`【系统】试炼奖励更新: 免费重试概率 ${ (this.rewards.retryProb * 100).toFixed(1) }%, 移速加成 x${ this.rewards.speedMultiplier.toFixed(2) }, 法力上限 +${this.rewards.manaCapBonus}`);
  }

  /**
   * 获取当前奖励
   */
  getEffect(type) {
    if (type === 'retryProb') return this.rewards.retryProb;
    if (type === 'speedMultiplier') return this.rewards.speedMultiplier;
    if (type === 'manaCap') return this.rewards.manaCapBonus;
    return 0;
  }

  /**
   * 加载试炼关卡数据
   */
  async loadTrialData() {
    try {
      const response = await fetch('./public/data/retry_speed_milestones.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      this.retryLevels = [];
      this.speedLevels = [];
      this.manaLevels = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        const type = parts[0].toLowerCase(); // retry, speed, manacap
        const levelData = {
          originalLevel: parseInt(parts[1]), // 原始关卡标识
          atk: parseFloat(parts[2]),
          hp: parseFloat(parts[3]),
          rewardGold: parseFloat(parts[4]),
          retryProb: parts[5] ? parseFloat(parts[5]) : 0,
          speedMultiplier: parts[6] ? parseFloat(parts[6]) : 0,
          manaCap: parts[5] ? parseFloat(parts[5]) : 0, // 假设 ManaCap 数据存放在第6列(RetryProb同列)
          minClearTime: parts[7] ? parseFloat(parts[7]) : 0
        };

        if (type === 'retry') {
          this.retryLevels.push(levelData);
        } else if (type === 'speed') {
          this.speedLevels.push(levelData);
        } else if (type === 'manacap') {
          this.manaLevels.push(levelData);
        }
      }
      console.log(`【系统】加载试炼数据成功: 强运 ${this.retryLevels.length} 关, 速度 ${this.speedLevels.length} 关, 法力 ${this.manaLevels.length} 关`);
      
      // 数据加载后重新计算奖励
      this.updateRewards();
    } catch (err) {
      console.error('【系统】加载试炼数据失败:', err);
    }
  }

  /**
   * 保存/读取进度
   */
  saveProgress() {
    localStorage.setItem('taoist_trial_progress', JSON.stringify(this.progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('taoist_trial_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 确保新增加的字段被初始化，防止加载旧存档时缺失
        this.progress = {
          retry: parsed.retry || 0,
          speed: parsed.speed || 0,
          mana: parsed.mana || 0
        };
      } catch (e) {
        console.error('【系统】解析试炼进度失败');
      }
    }
  }

  /**
   * 开始挑战试炼
   * @param {string} type 'retry' | 'speed'
   * @param {number} index 关卡索引 (0开始)
   */
  startTrial(type, index) {
    const levels = type === 'retry' ? this.retryLevels : (type === 'speed' ? this.speedLevels : this.manaLevels);
    if (!levels[index]) return false;
    
    // 检查解锁状态
    const currentProgress = type === 'retry' ? this.progress.retry : (type === 'speed' ? this.progress.speed : this.progress.mana);
    if (index > currentProgress) {
      console.warn('【系统】该关卡尚未解锁');
      return false;
    }

    // 备份当前普通关卡进度
    this.normalLevelBackup = this.levelManager.currentLevel;
    this.currentTrial = { type, index };
    
    // 切换 LevelManager 到试炼模式
    const config = levels[index];
    this.levelManager.enterTrialMode(config, (success) => {
      this.onTrialComplete(success);
    });

    return true;
  }

  /**
   * 试炼完成回调
   */
  onTrialComplete(success) {
    if (!this.currentTrial) return;

    const { type, index } = this.currentTrial;
    
    if (success) {
      console.log(`【系统】试炼挑战成功！`);
      // 更新进度：只有挑战当前最高进度的关卡时才推进进度
      if (type === 'retry' && index === this.progress.retry) {
        this.progress.retry++;
        this.updateRewards();
      } else if (type === 'speed' && index === this.progress.speed) {
        this.progress.speed++;
        this.updateRewards();
      } else if (type === 'mana' && index === this.progress.mana) {
        this.progress.mana++;
        this.updateRewards();
      }
      this.saveProgress();
      
      // TODO: 这里将来可以处理通关奖励
    } else {
      console.log(`【系统】试炼挑战失败！`);
    }

    // 无论胜负，回到原有关卡
    this.currentTrial = null;
    this.levelManager.exitTrialMode(this.normalLevelBackup);
    
    // 触发 UI 刷新
    if (this.onUpdateUI) this.onUpdateUI();
  }

  /**
   * 获取试炼列表数据用于渲染
   */
  getTrialList(type) {
    const levels = type === 'retry' ? this.retryLevels : (type === 'speed' ? this.speedLevels : this.manaLevels);
    const currentProgress = type === 'retry' ? this.progress.retry : (type === 'speed' ? this.progress.speed : this.progress.mana);
    
    return levels.map((l, i) => ({
      ...l,
      index: i,
      isUnlocked: i <= currentProgress,
      isCompleted: i < currentProgress
    }));
  }
}
