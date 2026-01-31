import { GameConfig } from './GameConfig.js';

/**
 * 货币管理类：负责金币等资源的逻辑计算
 */
export class CurrencyManager {
  constructor() {
    this.gold = 0;
    this.ingot = 0;   // 元宝
    this.lingfu = 0;  // 灵符
    
    // 神兽精华相关
    this.essence = 15;
    this.maxEssence = 15;
    this.recoveryInterval = 60000; // 1分钟 = 60000ms
    this.lastRecoveryTime = Date.now();
    
    this.onUpdate = null; // 金币 UI 更新回调
    this.onIngotUpdate = null; // 元宝 UI 更新回调
    this.onLingfuUpdate = null; // 灵符 UI 更新回调
    this.onEssenceUpdate = null; // 精华 UI 更新回调
    this._lastUIRemain = -1; // 上次发送给 UI 的剩余秒数，用于性能优化
    this._lastEssence = 15; // 上次发送给 UI 的精华数值，用于性能优化
    
    this.goldMultiplier = 1.0; // 金币加成 (来自 StatManager)
    this.passiveGoldMultiplier = 1.0; // 来自修炼系统的被动加成
    this.recoveryAccumulator = 0; // 毫秒累积器，用于处理 dt 恢复 (基于真实时间)

    this.load();
  }

  load() {
    const saved = GameConfig.getStorageItem('taoist_currency_data');
    if (saved) {
      const data = JSON.parse(saved);
      this.gold = data.gold || 0;
      this.ingot = data.ingot || 0;
      this.lingfu = data.lingfu || 0;
      this.essence = data.essence !== undefined ? data.essence : 15;
      this.lastRecoveryTime = data.lastRecoveryTime || Date.now();
    }
  }

  save() {
    GameConfig.setStorageItem('taoist_currency_data', JSON.stringify({
      gold: this.gold,
      ingot: this.ingot,
      lingfu: this.lingfu,
      essence: this.essence,
      lastRecoveryTime: this.lastRecoveryTime
    }));
  }

  setGoldMultiplier(multiplier) {
    this.goldMultiplier = multiplier;
  }

  setPassiveGoldMultiplier(multiplier) {
    this.passiveGoldMultiplier = multiplier;
  }

  /**
   * 更新恢复逻辑
   * @param {number} dt 真实秒数 (不受战斗倍速影响)
   */
  updateRecovery(dt = 0) {
    // 如果没有传 dt，回退到基于真实时间的逻辑
    if (dt === 0) {
      this._updateRecoveryRealTime();
      return;
    }

    if (this.essence >= this.maxEssence) {
      this.lastRecoveryTime = Date.now();
      this.recoveryAccumulator = 0;
      if (this._lastUIRemain !== 0) {
        this._notifyEssenceUpdate(0);
      }
      return;
    }

    // 基于真实 dt 的累积逻辑 (不乘以 timeScale)
    this.recoveryAccumulator += dt * 1000;
    
    if (this.recoveryAccumulator >= this.recoveryInterval) {
      const pointsToAdd = Math.floor(this.recoveryAccumulator / this.recoveryInterval);
      this.essence = Math.min(this.maxEssence, this.essence + pointsToAdd);
      this.recoveryAccumulator %= this.recoveryInterval;
      this.lastRecoveryTime = Date.now();
      
      this.save();
      this._notifyEssenceUpdate(this.getTimeToNext());
    } else {
      const remain = this.getTimeToNext();
      if (remain !== this._lastUIRemain) {
        this._notifyEssenceUpdate(remain);
      }
    }
  }

  /**
   * 原有的基于真实时间的恢复逻辑 (私有)
   */
  _updateRecoveryRealTime() {
    const remain = this.getTimeToNext();
    const needsUIUpdate = remain !== this._lastUIRemain;

    if (this.essence < this.maxEssence) {
      const now = Date.now();
      const elapsed = now - this.lastRecoveryTime;
      
      if (elapsed >= this.recoveryInterval) {
        const pointsToAdd = Math.floor(elapsed / this.recoveryInterval);
        this.essence = Math.min(this.maxEssence, this.essence + pointsToAdd);
        this.lastRecoveryTime = now - (elapsed % this.recoveryInterval);
        this._notifyEssenceUpdate(this.getTimeToNext());
      } else if (needsUIUpdate) {
        this._notifyEssenceUpdate(remain);
      }
    } else if (needsUIUpdate) {
      this.lastRecoveryTime = Date.now();
      this._notifyEssenceUpdate(0);
    }
  }

  _notifyEssenceUpdate(remain) {
    if (this.onEssenceUpdate) {
      this.onEssenceUpdate(this.essence, remain);
    }
    this._lastUIRemain = remain;
  }

  /**
   * 获取距离下一点恢复的剩余秒数
   */
  getTimeToNext() {
    if (this.essence >= this.maxEssence) return 0;
    
    // 基于真实时间的累积器计算
    if (this.recoveryAccumulator > 0) {
      return Math.ceil((this.recoveryInterval - this.recoveryAccumulator) / 1000);
    }
    
    const elapsed = Date.now() - this.lastRecoveryTime;
    return Math.ceil((this.recoveryInterval - elapsed) / 1000);
  }

  /**
   * 消耗精华
   * @param {number} amount 消耗数量
   * @param {boolean} allowNegativeIfPositive 是否允许在当前值为正时扣成负数 (突破逻辑)
   */
  spendEssence(amount, allowNegativeIfPositive = false) {
    const canSpend = allowNegativeIfPositive ? (this.essence > 0) : (this.essence >= amount);
    
    if (canSpend) {
      const wasFull = this.essence >= this.maxEssence;
      this.essence -= amount;
      
      if (wasFull && this.essence < this.maxEssence) {
        this.lastRecoveryTime = Date.now();
      }
      
      if (this.onEssenceUpdate) {
        this.onEssenceUpdate(this.essence, this.getTimeToNext());
      }
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 增加金币
   * @param {number} amount 
   * @param {boolean} applyBonus 是否应用加成 (默认 false)
   */
  addGold(amount, applyBonus = false) {
    if (amount <= 0) return;
    
    const finalMultiplier = applyBonus ? (this.goldMultiplier * this.passiveGoldMultiplier) : 1.0;
    const finalAmount = Math.floor(amount * finalMultiplier);
    this.gold += finalAmount;
    
    if (this.onUpdate) {
      this.onUpdate(this.gold);
    }
    this.save();
  }

  /**
   * 消耗金币
   */
  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      if (this.onUpdate) {
        this.onUpdate(this.gold);
      }
      this.save();
      return true;
    }
    return false;
  }

  getGold() {
    return this.gold;
  }

  /**
   * 增加元宝
   */
  addIngot(amount) {
    if (amount < 0) return;
    this.ingot += amount;
    if (this.onIngotUpdate) {
      this.onIngotUpdate(this.ingot);
    }
    this.save();
  }

  /**
   * 消耗元宝
   */
  spendIngot(amount) {
    if (this.ingot >= amount) {
      this.ingot -= amount;
      if (this.onIngotUpdate) {
        this.onIngotUpdate(this.ingot);
      }
      this.save();
      return true;
    }
    return false;
  }

  getIngot() {
    return this.ingot;
  }

  /**
   * 增加灵符
   */
  addLingfu(amount) {
    if (amount < 0) return;
    this.lingfu += amount;
    if (this.onLingfuUpdate) {
      this.onLingfuUpdate(this.lingfu);
    }
    this.save();
  }

  /**
   * 消耗灵符
   */
  spendLingfu(amount) {
    if (this.lingfu >= amount) {
      this.lingfu -= amount;
      if (this.onLingfuUpdate) {
        this.onLingfuUpdate(this.lingfu);
      }
      this.save();
      return true;
    }
    return false;
  }

  getLingfu() {
    return this.lingfu;
  }

  /**
   * 回满精华 (通过看广告)
   */
  refillEssence() {
    this.essence = this.maxEssence;
    this.lastRecoveryTime = Date.now();
    this.recoveryAccumulator = 0;
    
    if (this.onEssenceUpdate) {
      this.onEssenceUpdate(this.essence, 0);
    }
    this.save();
    return true;
  }
}
