/**
 * 战斗引擎：处理逻辑更新循环
 */
export class CombatEngine {
  constructor() {
    this.entities = [];
    this.lastTime = performance.now();
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
    const activeEntities = this.entities.filter(e => !e.isDead);

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

  update() {
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000; // 秒
    this.lastTime = now;

    // 限制 dt 最大值为 0.1 秒，防止切屏恢复或大幅掉帧导致的逻辑跳跃/瞬移
    dt = Math.min(dt, 0.1);

    // 1. 逻辑更新
    for (const entity of this.entities) {
      entity.update(dt, this);
    }

    // 2. 物理修正 (挤开重叠)
    this.resolveSeparation();
  }
}
