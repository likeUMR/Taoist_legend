/**
 * 货币管理类：负责金币等资源的逻辑计算
 */
export class CurrencyManager {
  constructor() {
    this.gold = 0;
    
    // 神兽精华相关
    this.essence = 15;
    this.maxEssence = 15;
    this.recoveryInterval = 60000; // 1分钟 = 60000ms
    this.lastRecoveryTime = Date.now();
    
    this.onUpdate = null; // 金币 UI 更新回调
    this.onEssenceUpdate = null; // 精华 UI 更新回调
    this._lastUIRemain = -1; // 上次发送给 UI 的剩余秒数，用于性能优化
    this._lastEssence = 15; // 上次发送给 UI 的精华数值，用于性能优化
  }

  /**
   * 更新恢复逻辑 (建议在游戏主循环中调用)
   */
  updateRecovery() {
    const remain = this.getTimeToNext();
    
    // 只有当剩余秒数发生变化时，才通知 UI 更新，避免每帧操作 DOM
    const needsUIUpdate = remain !== this._lastUIRemain;

    if (this.essence < this.maxEssence) {
      const now = Date.now();
      const elapsed = now - this.lastRecoveryTime;
      
      if (elapsed >= this.recoveryInterval) {
        const pointsToAdd = Math.floor(elapsed / this.recoveryInterval);
        this.essence = Math.min(this.maxEssence, this.essence + pointsToAdd);
        this.lastRecoveryTime = now - (elapsed % this.recoveryInterval);
        
        if (this.onEssenceUpdate) {
          this.onEssenceUpdate(this.essence, this.getTimeToNext());
          this._lastUIRemain = this.getTimeToNext();
        }
      } else if (needsUIUpdate && this.onEssenceUpdate) {
        this.onEssenceUpdate(this.essence, remain);
        this._lastUIRemain = remain;
      }
    } else if (needsUIUpdate) {
      // 满值时，重置恢复计时器，并通知 UI
      this.lastRecoveryTime = Date.now();
      if (this.onEssenceUpdate) {
        this.onEssenceUpdate(this.essence, 0);
        this._lastUIRemain = 0;
      }
    }
  }

  /**
   * 获取距离下一点恢复的剩余秒数
   */
  getTimeToNext() {
    if (this.essence >= this.maxEssence) return 0;
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
      return true;
    }
    return false;
  }

  /**
   * 增加金币
   */
  addGold(amount) {
    if (amount <= 0) return;
    this.gold += amount;
    if (this.onUpdate) {
      this.onUpdate(this.gold);
    }
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
      return true;
    }
    return false;
  }

  getGold() {
    return this.gold;
  }
}
