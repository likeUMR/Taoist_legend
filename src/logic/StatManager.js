/**
 * 属性与加成管理类：统一管理全局倍速、金币加成等
 */
export class StatManager {
  constructor() {
    this.combatTimeScale = 1.0; // 战斗倍速：仅影响战斗逻辑 (移动、攻击、关卡切换延迟)
    this.goldMultiplier = 1.0;  // 金币加成倍率

    // 金币加成升级相关
    this.goldBonusLevel = 0;
    this.maxGoldBonusLevel = 10;
    this.bonusPerLevel = 0.2; // 20%
    this.baseMultiplier = 1.0;

    // 战斗倍速升级相关
    this.speedLevel = 0;
    this.maxSpeedLevel = 11; // 1 + 10 = 11 次升级到达 2.5
    this.baseSpeed = 1.0;
  }

  /**
   * 升级战斗倍速
   */
  upgradeCombatSpeed() {
    if (this.speedLevel < this.maxSpeedLevel) {
      this.speedLevel++;
      if (this.speedLevel === 1) {
        this.combatTimeScale = this.baseSpeed + 0.5; // 第一次 +50%
      } else {
        this.combatTimeScale += 0.1; // 之后每次 +10%
      }
      // 保证精度并限制上限
      this.combatTimeScale = Math.min(2.5, parseFloat(this.combatTimeScale.toFixed(2)));
      
      console.log(`【系统】战斗倍速升级！当前等级: ${this.speedLevel}, 倍率: ${this.combatTimeScale}x`);
      return { success: true, newLevel: this.speedLevel, newScale: this.combatTimeScale };
    }
    return { success: false, reason: "已达到最高等级" };
  }

  /**
   * 获取战斗倍速升级信息
   */
  getCombatSpeedInfo() {
    const currentPercent = (this.combatTimeScale * 100).toFixed(0);
    let nextScale = this.combatTimeScale;
    if (this.speedLevel < this.maxSpeedLevel) {
      if (this.speedLevel === 0) {
        nextScale = this.baseSpeed + 0.5;
      } else {
        nextScale = this.combatTimeScale + 0.1;
      }
    }
    const nextPercent = (Math.min(2.5, nextScale) * 100).toFixed(0);

    return {
      level: this.speedLevel,
      maxLevel: this.maxSpeedLevel,
      currentPercent,
      nextPercent,
      isMax: this.speedLevel >= this.maxSpeedLevel
    };
  }

  /**
   * 升级金币加成
   */
  upgradeGoldBonus() {
    if (this.goldBonusLevel < this.maxGoldBonusLevel) {
      this.goldBonusLevel++;
      this.goldMultiplier = this.baseMultiplier + (this.goldBonusLevel * this.bonusPerLevel);
      console.log(`【系统】金币加成升级！当前等级: ${this.goldBonusLevel}, 倍率: ${this.goldMultiplier}x`);
      return { success: true, newLevel: this.goldBonusLevel, newMultiplier: this.goldMultiplier };
    }
    return { success: false, reason: "已达到最高等级" };
  }

  /**
   * 获取当前和下一级的加成数据
   */
  getGoldBonusInfo() {
    const currentBonus = (this.goldMultiplier - 1) * 100;
    const nextLevel = this.goldBonusLevel + 1;
    const nextMultiplier = this.baseMultiplier + (nextLevel * this.bonusPerLevel);
    const nextBonus = (nextMultiplier - 1) * 100;

    return {
      level: this.goldBonusLevel,
      maxLevel: this.maxGoldBonusLevel,
      currentPercent: currentBonus.toFixed(0),
      nextPercent: nextBonus.toFixed(0),
      isMax: this.goldBonusLevel >= this.maxGoldBonusLevel
    };
  }

  /**
   * 设置战斗倍速
   * @param {number} scale 
   */
  setCombatTimeScale(scale) {
    this.combatTimeScale = Math.max(0, scale);
    console.log(`【系统】战斗倍速已调整为: ${this.combatTimeScale}x`);
  }

  /**
   * 设置金币加成
   * @param {number} multiplier 
   */
  setGoldMultiplier(multiplier) {
    this.goldMultiplier = Math.max(0, multiplier);
    console.log(`【系统】金币加成已调整为: ${((this.goldMultiplier - 1) * 100).toFixed(0)}%`);
  }

  /**
   * 计算应用加成后的金币掉落
   * @param {number} baseAmount 
   */
  applyGoldBonus(baseAmount) {
    return Math.floor(baseAmount * this.goldMultiplier);
  }
}
