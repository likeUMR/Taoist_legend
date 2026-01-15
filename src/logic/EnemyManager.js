import { Enemy } from './Enemy.js';

/**
 * 敌人管理类：负责敌人的生成算法、生命周期监控
 */
export class EnemyManager {
  constructor(engine) {
    this.engine = engine;
    this.enemies = [];
    this.allDeadLogged = false;
    this.worldBounds = null;
    this.onEnemyDeath = null; // 敌人死亡全局回调
  }

  /**
   * 设置世界边界
   */
  setWorldBounds(bounds) {
    this.worldBounds = bounds;
  }

  /**
   * 清除所有敌人数据
   */
  clear() {
    this.enemies = [];
    this.allDeadLogged = false;
  }

  /**
   * 按照正态分布生成敌人
   * @param {number} count 敌人数量
   * @param {number} centerX 中心点X
   * @param {number} centerY 中心点Y
   * @param {Object} stats 属性数据 { atk, hp, lootGold }
   * @param {number} stdDev 标准差 (控制分布离散程度)
   */
  spawnEnemies(count, centerX, centerY, stats = {}, stdDev = 50) {
    for (let i = 0; i < count; i++) {
      const x = this._gaussianRandom(centerX, stdDev);
      const y = this._gaussianRandom(centerY, stdDev);
      
      const enemy = new Enemy({
        x: x,
        y: y,
        speed: 40 + Math.random() * 40,
        hp: stats.hp || 50,
        maxHp: stats.hp || 50,
        atk: stats.atk || 5,
        name: `敌${i + 1}`,
        worldBounds: this.worldBounds,
        lootGold: stats.lootGold || 10
      });

      if (this.onEnemyDeath) {
        enemy.onDeath = this.onEnemyDeath;
      }

      this.enemies.push(enemy);
      this.engine.addEntity(enemy);
    }
    this.allDeadLogged = false;
  }

  /**
   * 更新监控状态
   */
  update() {
    if (this.enemies.length > 0 && !this.allDeadLogged) {
      const aliveCount = this.enemies.filter(e => !e.isDead).length;
      if (aliveCount === 0) {
        console.log("【战报】所有敌人已被消灭！");
        this.allDeadLogged = true;
      }
    }
  }

  /**
   * Box-Muller 变换生成正态分布随机数
   */
  _gaussianRandom(mean, stdDev) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }
}
