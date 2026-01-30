/**
 * 战斗引擎：处理逻辑更新循环
 */
export class CombatEngine {
  constructor() {
    this.entities = [];
    this.lastTime = performance.now();
    this.combatTimeScale = 1.0; // 战斗倍速
  }

  setCombatTimeScale(scale) {
    this.combatTimeScale = scale;
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  clear() {
    this.entities = [];
  }

  /**
   * 物理层：处理实体之间的重叠挤开逻辑 (Separation)
   */
  resolveSeparation() {
    // 处理所有活跃对象之间的挤开，避免重叠
    // 排除已死亡或还在待机出击状态的实体 (待机状态不参与碰撞)
    const activeEntities = this.entities.filter(e => !e.isDead && !(e.deployDelay > 0));

    for (let i = 0; i < activeEntities.length; i++) {
      for (let j = i + 1; j < activeEntities.length; j++) {
        const a = activeEntities[i];
        const b = activeEntities[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distanceSq = dx * dx + dy * dy;
        const minDistance = a.radius + b.radius;

        if (distanceSq < minDistance * minDistance) {
          const distance = Math.sqrt(distanceSq);
          // 防止完全重合导致除零
          const overlap = distance === 0 ? minDistance : minDistance - distance;
          
          const nx = distance === 0 ? 1 : dx / distance;
          const ny = distance === 0 ? 0 : dy / distance;

          // 相互推开重叠距离的一半
          const moveX = nx * overlap * 0.5;
          const moveY = ny * overlap * 0.5;

          a.x += moveX;
          a.y += moveY;
          b.x -= moveX;
          b.y -= moveY;

          // 被推开后，如果有边界限制，则执行限制 (主要针对敌人)
          if (a.clampPosition) a.clampPosition();
          if (b.clampPosition) b.clampPosition();
        }
      }
    }
  }

  /**
   * 搜索半径内的实体
   */
  getEntitiesInRadius(centerX, centerY, radius, sideFilter = null) {
    return this.entities.filter(e => {
      if (e.isDead) return false;
      if (sideFilter && e.side !== sideFilter) return false;
      const dx = e.x - centerX;
      const dy = e.y - centerY;
      return dx * dx + dy * dy <= radius * radius;
    });
  }

  /**
   * 搜索扇形区域内的实体
   * @param {number} centerX 中心点X
   * @param {number} centerY 中心点Y
   * @param {number} radius 扇形半径
   * @param {number} direction 扇形中轴线弧度
   * @param {number} angle 扇形夹角 (弧度)
   */
  getEntitiesInSector(centerX, centerY, radius, direction, angle, sideFilter = null) {
    const halfAngle = angle / 2;
    return this.entities.filter(e => {
      if (e.isDead) return false;
      if (sideFilter && e.side !== sideFilter) return false;
      
      const dx = e.x - centerX;
      const dy = e.y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq > radius * radius) return false;

      const entityAngle = Math.atan2(dy, dx);
      let diff = entityAngle - direction;
      // 角度归一化到 [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      return Math.abs(diff) <= halfAngle;
    });
  }

  update() {
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000; // 真实流逝秒数
    this.lastTime = now;

    // 应用战斗倍速加成
    let combatDt = rawDt * this.combatTimeScale;

    // 限制 combatDt 最大值，防止逻辑跳跃
    combatDt = Math.min(combatDt, 0.1 * this.combatTimeScale);

    // 1. 逻辑更新
    for (const entity of this.entities) {
      entity.update(combatDt, this);
    }

    // 2. 物理修正 (挤开重叠)
    this.resolveSeparation();

    return { combatDt, rawDt };
  }
}
