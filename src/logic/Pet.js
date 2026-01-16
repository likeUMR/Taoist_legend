import { Entity } from './Entity.js';

/**
 * 战宠对象类：锁定最近敌人并追击
 */
export class Pet extends Entity {
  constructor(options = {}) {
    super({ ...options, side: 'player', name: '狗' });
    this.attackRange = 40;
    this.attackCooldown = 0;
    this.atkSpeed = options.atkSpeed || 1.0; // 攻击间隔(秒)，默认1秒一次
    this.deployDelay = options.deployDelay || 0; // 出击延迟(秒)
  }

  update(dt, engine) {
    if (this.isDead) return;

    // 处理出击延迟
    if (this.deployDelay > 0) {
      this.deployDelay -= dt;
      return; // 延迟未结束，不执行任何逻辑
    }

    // 寻找最近的敌人
    const enemies = engine.entities.filter(e => e.side === 'enemy' && !e.isDead);
    if (enemies.length === 0) return;

    let nearest = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      const d = this.getDistance(enemy);
      if (d < minDist) {
        minDist = d;
        nearest = enemy;
      }
    }

    if (nearest) {
      if (minDist > this.attackRange) {
        // 追击
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        this.x += (dx / minDist) * this.speed * dt;
        this.y += (dy / minDist) * this.speed * dt;
      } else {
        // 攻击
        if (this.attackCooldown <= 0) {
          nearest.takeDamage(this.atk, this); // 传入自身作为攻击者
          this.attackCooldown = this.atkSpeed; 
          console.log(`战宠攻击了敌人！造成伤害: ${this.atk}，敌人剩余血量: ${nearest.hp}`);
        }
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // 出击后执行边界限制
    this.clampPosition();
  }

  /**
   * 战宠重写边界限制：待机状态不限制
   */
  clampPosition() {
    if (this.deployDelay > 0) return;
    super.clampPosition();
  }
}
