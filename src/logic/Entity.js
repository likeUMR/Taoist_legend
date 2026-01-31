/**
 * 基础战斗对象类 (纯逻辑)
 */
export class Entity {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.hp = options.hp || 100;
    this.maxHp = options.maxHp || 100;
    this.side = options.side || 'enemy'; // 'player' | 'enemy'
    this.radius = options.radius || 20;
    this.speed = options.speed || 100; // 像素/秒
    this.atk = options.atk || 5; // 攻击力
    this.name = options.name || '对象';
    this.isDead = false;
    this.worldBounds = options.worldBounds || null; // { width, height }
    this.lootGold = options.lootGold || 0; // 死亡掉落金币
    this.onDeath = null; // 死亡回调
    this.buffs = []; // 增益/减益效果列表

    // 高级属性 (主要用于战宠)
    this.critRate = options.critRate || 0;
    this.critDmg = options.critDmg || 1.5;
    this.dodge = options.dodge || 0;
    this.combo = options.combo || 0;
  }

  /**
   * 添加一个 Buff
   * @param {Object} buff { id, type, value, duration, timer }
   */
  addBuff(buff) {
    // 如果是同类型的 Buff，尝试覆盖或刷新
    const existingIndex = this.buffs.findIndex(b => b.type === buff.type);
    if (existingIndex > -1) {
      const existing = this.buffs[existingIndex];
      // 如果是中毒，高伤害覆盖低伤害，或者刷新持续时间
      if (buff.type === 'poison') {
        if (buff.value >= existing.value) {
          this.buffs[existingIndex] = { ...buff, timer: buff.duration };
        }
      } else {
        // 其他 Buff 简单刷新时间
        existing.timer = buff.duration;
        existing.value = buff.value;
      }
    } else {
      this.buffs.push({ ...buff, timer: buff.duration });
    }
  }

  /**
   * 更新 Buff 计时器与效果
   */
  updateBuffs(combatDt, rawDt) {
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      const buff = this.buffs[i];
      
      // 处理持续性效果 (如中毒)
      if (buff.type === 'poison') {
        buff.damageTimer = (buff.damageTimer || 0) + combatDt;
        if (buff.damageTimer >= 1.0) {
          this.takeDamage(buff.value); // 这里的 value 是每秒伤害
          buff.damageTimer -= 1.0;
        }
      }

      // duration 为 -1 表示永久
      if (buff.duration !== -1) {
        // Buff 持续时间不受战斗加速影响，使用 rawDt
        buff.timer -= rawDt;
        if (buff.timer <= 0) {
          this.buffs.splice(i, 1);
        }
      }
    }
  }

  /**
   * 获取最终攻击力 (应用 Buff)
   */
  getFinalAtk() {
    let multiplier = 1.0;
    for (const buff of this.buffs) {
      if (buff.type === 'atk_mult') {
        multiplier *= buff.value;
      }
      if (buff.type === 'frenzy') {
        multiplier *= buff.value;
      }
    }
    return this.atk * multiplier;
  }

  /**
   * 获取最终移动速度 (应用 Buff)
   */
  getFinalSpeed() {
    let multiplier = 1.0;
    for (const buff of this.buffs) {
      if (buff.type === 'speed_mult') {
        multiplier *= buff.value;
      }
      if (buff.type === 'frenzy') {
        multiplier *= buff.value;
      }
    }
    return this.speed * multiplier;
  }

  /**
   * 受到伤害
   */
  takeDamage(amount, isCrit = false) {
    if (this.isDead) return;
    
    // 闪避判定
    if (this.dodge > 0 && Math.random() < this.dodge) {
      if (this.onDamage) {
        this.onDamage(0, false, true); // 0 伤害，非暴击，是闪避
      }
      return;
    }

    // 防御性检查：防止 NaN 导致锁血
    let damage = parseFloat(amount);
    if (isNaN(damage)) {
      console.warn(`【战斗】实体 ${this.name} 收到非法伤害数值:`, amount);
      return;
    }

    // 应用减伤 Buff (如神圣战甲)
    let finalAmount = damage;
    for (const buff of this.buffs) {
      if (buff.type === 'damage_reduction') {
        finalAmount *= (1 - buff.value);
      }
      if (buff.type === 'holy_armor') {
        finalAmount *= (1 - buff.value);
      }
    }

    this.hp -= finalAmount;
    
    // 触发受伤回调 (用于飘字等视觉效果)
    if (this.onDamage) {
      this.onDamage(finalAmount);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (this.onDeath) this.onDeath(this);
    }
  }

  /**
   * 限制坐标在边界内
   */
  clampPosition() {
    if (!this.worldBounds) return;
    const margin = 20; 

    // 支持两种边界格式：一种是宽高矩形(从0开始)，一种是明确的 min/max 范围
    const minX = this.worldBounds.minX !== undefined ? this.worldBounds.minX + margin : margin;
    const maxX = this.worldBounds.maxX !== undefined ? this.worldBounds.maxX - margin : this.worldBounds.width - margin;
    const minY = this.worldBounds.minY !== undefined ? this.worldBounds.minY + margin : margin;
    const maxY = this.worldBounds.maxY !== undefined ? this.worldBounds.maxY - margin : this.worldBounds.height - margin;

    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  update(combatDt, rawDt, engine) {
    // 基类不实现具体逻辑
  }

  getDistance(other) {
    return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
  }
}
