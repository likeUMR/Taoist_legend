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

  update(dt, engine) {
    // 基类不实现具体逻辑
  }

  /**
   * 受到伤害
   * @param {number} amount 伤害数值
   * @param {Entity} attacker 攻击者 (用于反击)
   */
  takeDamage(amount, attacker = null) {
    if (this.isDead) return;

    this.hp = Math.max(0, this.hp - amount);
    
    // 逻辑：敌人被攻击时反击
    if (attacker && this.side === 'enemy' && !this.isDead) {
      console.log(`敌人反击了 ${attacker.name}! 伤害: ${this.atk}`);
      attacker.takeDamage(this.atk); // 反击不传递攻击者，防止死循环
    }

    if (this.hp <= 0) {
      this.isDead = true;
      console.log(`${this.name} 已被击败`);
      if (this.onDeath) {
        this.onDeath(this);
      }
    }
  }

  getDistance(other) {
    return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
  }
}
