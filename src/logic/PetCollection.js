import { PET_CONFIGS, getUpgradeInfo } from '../data/petConfigs.js';
import { GameConfig } from './GameConfig.js';

/**
 * 战宠集合管理类：管理玩家拥有的战宠状态及其数值计算
 */
export class PetCollection {
  constructor(cultivationManager = null, auraManager = null) {
    this.cultivationManager = cultivationManager;
    this.auraManager = auraManager;
    // 初始状态：只解锁第 1 个战宠
    this.ownedPets = [
      { id: 1, level: 0 } // 注意：从等级 0 开始
    ];
    this.upgradeConfigs = new Map(); // level -> config

    this.load();
  }

  load() {
    const saved = GameConfig.getStorageItem('taoist_pet_data');
    if (saved) {
      this.ownedPets = JSON.parse(saved);
    }
  }

  save() {
    GameConfig.setStorageItem('taoist_pet_data', JSON.stringify(this.ownedPets));
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
        
        // 计算阶位 (CL) 和 阶内强化等级 (+N)
        let classLevel = 0;
        let displayLevel = 0;
        for (let i = 1; i <= currentLevel; i++) {
          const cfg = this.upgradeConfigs.get(i);
          if (cfg && cfg.isBreakthrough) {
            classLevel++;
            displayLevel = 0;
          } else {
            displayLevel++;
          }
        }

        const currentCfg = this.upgradeConfigs.get(currentLevel) || { atkMult: 1, hpMult: 1 };
        const nextCfg = this.upgradeConfigs.get(nextLevel);
        
        // 应用修炼系统的金币消耗加成
        let upgradeCost = 0;
        if (nextCfg) {
          if (nextCfg.isBreakthrough) {
            upgradeCost = nextCfg.costStamina;
          } else {
            const costReduction = this.cultivationManager ? this.cultivationManager.getEffect('金币消耗') : 1.0;
            upgradeCost = Math.floor(nextCfg.costGold / costReduction);
          }
        }

        result.push({
          ...config,
          unlocked: true,
          level: currentLevel,
          classLevel: classLevel,
          displayLevel: displayLevel,
          currentAtk: config.baseAtk * currentCfg.atkMult,
          currentHp: config.baseHp * currentCfg.hpMult,
          nextAtk: nextCfg ? config.baseAtk * nextCfg.atkMult : null,
          nextHp: nextCfg ? config.baseHp * nextCfg.hpMult : null,
          upgradeCost: upgradeCost,
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
    // 获取光环加成 (数值格式如 1.15 代表 15% 增益)
    const dmgMult = this.auraManager ? this.auraManager.getModifier('增伤光环') : 1.0;
    const hpMult = this.auraManager ? this.auraManager.getModifier('加血光环') : 1.0;
    const speedMult = this.auraManager ? this.auraManager.getModifier('攻速光环') : 1.0;

    return this.ownedPets.map(state => {
      const config = PET_CONFIGS.find(c => c.id === state.id);
      const upgradeCfg = this.upgradeConfigs.get(state.level) || { atkMult: 1, hpMult: 1 };
      
      const finalAtk = config.baseAtk * upgradeCfg.atkMult * dmgMult;
      const finalHp = config.baseHp * upgradeCfg.hpMult * hpMult;

      return {
        id: config.id,
        name: config.name,
        atk: finalAtk,
        hp: finalHp,
        maxHp: finalHp,
        atkSpeed: 0.8 / speedMult // 攻速光环增加百分比，意味着攻击间隔缩短
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
   * @param {number} petId 
   * @param {CurrencyManager} currencyManager 
   * @param {boolean} isFreeAd 是否使用免费广告升级
   */
  upgradePet(petId, currencyManager, isFreeAd = false) {
    const petState = this.ownedPets.find(p => p.id === petId);
    if (!petState) return { success: false, reason: "未解锁" };

    const nextLevel = petState.level + 1;
    const nextCfg = this.upgradeConfigs.get(nextLevel);
    
    if (!nextCfg) return { success: false, reason: "已达最高等级" };

    // 消耗与条件检查
    if (nextCfg.isBreakthrough) {
      // 突破：只要精华是正数就能点，可以扣成负数 (突破不参与广告)
      if (!currencyManager.spendEssence(nextCfg.costStamina, true)) {
        return { success: false, reason: "神兽精华已枯竭" };
      }
    } else {
      // 普通强化
      if (!isFreeAd) {
        // 非广告模式：消耗金币 (考虑修炼加成)
        const costReduction = this.cultivationManager ? this.cultivationManager.getEffect('金币消耗') : 1.0;
        const finalCost = Math.floor(nextCfg.costGold / costReduction);
        
        if (!currencyManager.spendGold(finalCost)) {
          return { success: false, reason: "金币不足" };
        }
      }
      // 广告模式：不消耗，直接通过
    }

    // 概率判定：如果是广告升级，强制 100% 成功
    const isSuccess = (nextCfg.isBreakthrough || isFreeAd) ? true : (Math.random() <= nextCfg.successRate);

    if (isSuccess) {
      petState.level++;
      
      // 判定双倍强化 (广告升级也可以触发双倍强化)
      let doubleUpgraded = false;
      if (!nextCfg.isBreakthrough && this.cultivationManager) {
        const doubleRate = this.cultivationManager.getEffect('双倍强化') - 1;
        if (Math.random() <= doubleRate) {
          const superNextLevel = petState.level + 1;
          const superNextCfg = this.upgradeConfigs.get(superNextLevel);
          if (superNextCfg && !superNextCfg.isBreakthrough) {
            petState.level++;
            doubleUpgraded = true;
            console.log(`【系统】触发双倍强化！直接升级到等级: ${petState.level}`);
          }
        }
      }

      if (this.onUpgradeSuccess && !nextCfg.isBreakthrough) {
        this.onUpgradeSuccess();
      }
      this.save();
      return { success: true, newLevel: petState.level, doubleUpgraded };
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
    this.save();
    return { success: true, petId: nextConfig.id };
  }
}
