import { Entity } from './Entity.js';
import { audioManager } from '../utils/AudioManager.js';

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

  update(combatDt, rawDt, engine) {
    if (this.isDead) return;

    // 更新 Buff
    this.updateBuffs(combatDt, rawDt);

    // 处理出击延迟
    if (this.deployDelay > 0) {
      this.deployDelay -= combatDt;
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
        this.x += (dx / minDist) * this.getFinalSpeed() * combatDt;
        this.y += (dy / minDist) * this.getFinalSpeed() * combatDt;
      } else {
        // 攻击
        if (this.attackCooldown <= 0) {
          this.performAttack(nearest);
          this.attackCooldown = this.atkSpeed; 
        }
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= combatDt;
    }

    // 出击后执行边界限制
    this.clampPosition();
  }

  /**
   * 执行一次或多次攻击 (连击判定)
   */
  performAttack(target) {
    // 基础攻击
    this.attackOnce(target);

    // 连击判定
    let comboCount = 0;
    const maxCombo = 5; // 防止死循环
    while (this.combo > 0 && Math.random() < this.combo && comboCount < maxCombo) {
      comboCount++;
      // 延迟一小会儿执行连击效果，或者直接执行
      setTimeout(() => {
        if (!target.isDead && !this.isDead) {
          this.attackOnce(target);
        }
      }, comboCount * 100);
    }
  }

  /**
   * 执行单次攻击逻辑 (包含暴击判定)
   */
  attackOnce(target) {
    if (target.isDead) return;

    let finalAtk = this.getFinalAtk();
    let isCrit = false;

    // 暴击判定
    if (this.critRate > 0 && Math.random() < this.critRate) {
      isCrit = true;
      finalAtk *= this.critDmg;
    }

    target.takeDamage(finalAtk, isCrit);
    audioManager.playAttack();

    // 战宠攻击敌人的时候，自身受到敌人攻击力的伤害 (这里保持原样，不计入暴击/连击的反伤，或者按需调整)
    this.takeDamage(target.atk);
    
    // 触发被动技能钩子
    if (window.passiveSkillManager) {
      window.passiveSkillManager.triggerPassive(this, target);
    }

    // 处理中毒注入逻辑
    const poisonInfusionBuff = this.buffs.find(b => b.type === 'poison_infusion');
    if (poisonInfusionBuff) {
      target.addBuff({
        type: 'poison',
        value: finalAtk * (poisonInfusionBuff.value - 1), 
        duration: -1, 
        id: `poison_from_${this.id}`
      });
    }

    console.log(`战宠攻击了敌人！${isCrit ? '[暴击!] ' : ''}造成伤害: ${finalAtk.toFixed(1)}，敌人剩余血量: ${target.hp.toFixed(1)}`);
  }

  /**
   * 战宠重写边界限制：待机状态不限制
   */
  clampPosition() {
    if (this.deployDelay > 0) return;
    super.clampPosition();
  }
}
