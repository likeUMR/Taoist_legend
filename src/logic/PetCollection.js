import { PET_CONFIGS, getUpgradeInfo } from '../data/petConfigs.js';

/**
 * 战宠集合管理类：管理玩家拥有的战宠状态及其数值计算
 */
export class PetCollection {
  constructor() {
    // 初始状态：只解锁第 1 个战宠
    this.ownedPets = [
      { id: 1, level: 0 } // 注意：从等级 0 开始
    ];
    this.upgradeConfigs = new Map(); // level -> config
  }

  /**
   * 初始化：加载升级配置表
   */
  async init() {
    try {
      const response = await fetch('/data/upgrades.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [system, level, attr, atkMult, hpMult, costGold, costStamina, rate, isBreak] = line.split(',');
        
        if (system === '强化_v1') {
          this.upgradeConfigs.set(parseInt(level), {
            atkMult: parseFloat(atkMult),
            hpMult: parseFloat(hpMult),
            costGold: parseFloat(costGold),
            costStamina: parseFloat(costStamina),
            successRate: parseFloat(rate) / 100, // "100%" -> 1.0
            isBreakthrough: isBreak.toLowerCase() === 'true'
          });
        }
      }
      console.log(`【系统】成功加载 ${this.upgradeConfigs.size} 条战宠升级数据`);
    } catch (err) {
      console.error('【系统】加载升级数据失败:', err);
    }
  }

  /**
   * 获取所有战宠的显示数据
   */
  getPetListData() {
    let nextLockedFound = false;
    const result = [];

    for (const config of PET_CONFIGS) {
      const state = this.ownedPets.find(p => p.id === config.id);
      
      if (state) {
        // 已解锁
        const currentLevel = state.level;
        const nextLevel = currentLevel + 1;
        
        const currentCfg = this.upgradeConfigs.get(currentLevel) || { atkMult: 1, hpMult: 1 };
        const nextCfg = this.upgradeConfigs.get(nextLevel);

        result.push({
          ...config,
          unlocked: true,
          level: currentLevel,
          currentAtk: config.baseAtk * currentCfg.atkMult,
          currentHp: config.baseHp * currentCfg.hpMult,
          nextAtk: nextCfg ? config.baseAtk * nextCfg.atkMult : null,
          nextHp: nextCfg ? config.baseHp * nextCfg.hpMult : null,
          upgradeCost: nextCfg ? (nextCfg.isBreakthrough ? nextCfg.costStamina : nextCfg.costGold) : 0,
          successRate: nextCfg ? nextCfg.successRate : 0,
          isBreakthrough: nextCfg ? nextCfg.isBreakthrough : false,
          hasMaxLevel: !nextCfg
        });
      } else if (!nextLockedFound) {
        // 第一个未解锁的
        result.push({ ...config, unlocked: false });
        nextLockedFound = true;
      } else {
        break;
      }
    }
    return result;
  }

  /**
   * 获取实时战斗属性
   */
  getBattleData() {
    return this.ownedPets.map(state => {
      const config = PET_CONFIGS.find(c => c.id === state.id);
      const upgradeCfg = this.upgradeConfigs.get(state.level) || { atkMult: 1, hpMult: 1 };
      
      const finalAtk = config.baseAtk * upgradeCfg.atkMult;
      const finalHp = config.baseHp * upgradeCfg.hpMult;

      return {
        id: config.id,
        name: config.name,
        atk: finalAtk,
        hp: finalHp,
        maxHp: finalHp,
        atkSpeed: 0.8
      };
    });
  }

  /**
   * 获取统计数据
   */
  getTotals() {
    let totalAtk = 0;
    let totalHp = 0;
    let count = this.ownedPets.length;

    this.ownedPets.forEach(state => {
      const config = PET_CONFIGS.find(c => c.id === state.id);
      const upgradeCfg = this.upgradeConfigs.get(state.level) || { atkMult: 1, hpMult: 1 };
      if (config) {
        totalAtk += config.baseAtk * upgradeCfg.atkMult;
        totalHp += config.baseHp * upgradeCfg.hpMult;
      }
    });

    return { totalAtk, totalHp, count };
  }

  /**
   * 强化逻辑
   */
  upgradePet(petId, currencyManager) {
    const petState = this.ownedPets.find(p => p.id === petId);
    if (!petState) return { success: false, reason: "未解锁" };

    const nextLevel = petState.level + 1;
    const nextCfg = this.upgradeConfigs.get(nextLevel);
    
    if (!nextCfg) return { success: false, reason: "已达最高等级" };

    // 消耗与条件检查
    if (nextCfg.isBreakthrough) {
      // 突破：只要精华是正数就能点，可以扣成负数
      if (!currencyManager.spendEssence(nextCfg.costStamina, true)) {
        return { success: false, reason: "神兽精华已枯竭" };
      }
    } else {
      // 普通强化：消耗金币
      if (!currencyManager.spendGold(nextCfg.costGold)) {
        return { success: false, reason: "金币不足" };
      }
    }

    // 概率判定
    const isSuccess = nextCfg.isBreakthrough ? true : (Math.random() <= nextCfg.successRate);

    if (isSuccess) {
      petState.level++;
      // 记录强化成功 (突破不算强化成功)
      if (this.onUpgradeSuccess && !nextCfg.isBreakthrough) {
        this.onUpgradeSuccess();
      }
      return { success: true, newLevel: petState.level };
    } else {
      return { success: false, reason: "强化失败" };
    }
  }

  /**
   * 解锁新战宠
   */
  unlockNextPet(currencyManager) {
    const nextConfig = PET_CONFIGS.find(config => !this.ownedPets.some(p => p.id === config.id));
    if (!nextConfig) return { success: false, reason: "已全部解锁" };

    if (!currencyManager.spendGold(nextConfig.unlockCost)) {
      return { success: false, reason: "金币不足" };
    }

    this.ownedPets.push({ id: nextConfig.id, level: 0 }); // 初始等级为 0
    return { success: true, petId: nextConfig.id };
  }
}
