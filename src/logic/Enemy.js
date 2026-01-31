import { Entity } from './Entity.js';

/**
 * 敌人对象类：随机游走 AI
 */
export class Enemy extends Entity {
  constructor(options = {}) {
    super({ ...options, side: 'enemy', name: '敌' });
    this.moveTimer = 0;
    this.targetPos = { x: this.x, y: this.y };
    this.isWaiting = false;
  }

  update(combatDt, rawDt, engine) {
    if (this.isDead) return;

    // 更新 Buff (处理中毒等)
    this.updateBuffs(combatDt, rawDt);

    this.moveTimer -= combatDt;

    if (this.moveTimer <= 0) {
      if (this.isWaiting) {
        // 结束等待，开始寻找新目标点
        const range = 100;
        this.targetPos = {
          x: this.x + (Math.random() - 0.5) * range * 2,
          y: this.y + (Math.random() - 0.5) * range * 2
        };
        this.isWaiting = false;
        this.moveTimer = 1 + Math.random() * 2; // 移动时长
      } else {
        // 结束移动，开始等待
        this.isWaiting = true;
        this.moveTimer = 0.5 + Math.random() * 1.5; // 等待时长
      }
    }

    if (!this.isWaiting) {
      // 执行移动
      const dx = this.targetPos.x - this.x;
      const dy = this.targetPos.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 2) {
        const finalSpeed = this.getFinalSpeed();
        this.x += (dx / dist) * finalSpeed * combatDt;
        this.y += (dy / dist) * finalSpeed * combatDt;
      }
    }

    this.clampPosition();
  }
}
