/**
 * DOM 渲染器：将逻辑层数据同步到 HTML
 */
export class DOMRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.elementMap = new Map(); // id -> DOM element
  }

  /**
   * 清除所有渲染的元素
   */
  clear() {
    this.elementMap.forEach(el => el.remove());
    this.elementMap.clear();
  }

  /**
   * 创建瞬时视觉特效
   */
  createVfx(type, x, y, options = {}) {
    const vfx = document.createElement('div');
    vfx.className = `vfx-instance vfx-${type}`;
    vfx.style.left = `${x}px`;
    vfx.style.top = `${y}px`;

    if (type === 'war-stomp') {
      const radius = options.radius || 60;
      vfx.style.width = `${radius * 2}px`;
      vfx.style.height = `${radius * 2}px`;
    } else if (type === 'ice-spike') {
      const angle = options.angle || 0;
      vfx.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    }

    this.container.appendChild(vfx);

    // 动画结束后移除
    vfx.addEventListener('animationend', () => vfx.remove());
    // 保险起见，2秒后强制移除
    setTimeout(() => vfx.remove(), 2000);
  }

  /**
   * 创建飞行物
   */
  createProjectile(type, x, y, angle, options = {}) {
    const proj = document.createElement('div');
    proj.className = `projectile projectile-${type}`;
    
    let curX = x;
    let curY = y;
    const speed = options.speed || 200;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    proj.style.left = `${curX}px`;
    proj.style.top = `${curY}px`;
    proj.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;

    this.container.appendChild(proj);

    // 飞行逻辑 (简单实现，通过定时器或在渲染循环中更新)
    // 这里采用定时器简单演示，实际项目中建议放入 CombatEngine 统一管理逻辑
    const startTime = performance.now();
    const hitEntities = new Set();

    const move = (now) => {
      const dt = (now - startTime) / 1000;
      const elapsed = now - lastFrameTime;
      lastFrameTime = now;
      const frameDt = elapsed / 1000;

      curX += vx * frameDt;
      curY += vy * frameDt;

      proj.style.left = `${curX}px`;
      proj.style.top = `${curY}px`;

      // 碰撞检测
      if (window.engine) {
        const targets = window.engine.getEntitiesInRadius(curX, curY, options.radius || 20, 'enemy');
        targets.forEach(t => {
          if (!hitEntities.has(t.id)) {
            t.takeDamage(options.damage);
            hitEntities.add(t.id);
            if (!options.piercing) {
              proj.remove();
              return;
            }
          }
        });
      }

      // 边界检查
      if (curX < -100 || curX > 1000 || curY < -100 || curY > 1000) {
        proj.remove();
        return;
      }

      requestAnimationFrame(move);
    };

    let lastFrameTime = performance.now();
    requestAnimationFrame(move);
  }

  /**
   * 为特定实体添加瞬时视觉类 (如闪烁)
   */
  applyVfxToEntity(entityId, className) {
    const el = this.elementMap.get(entityId);
    if (!el) return;

    const vfxClass = `vfx-${className}`;
    el.classList.add(vfxClass);
    
    // 动画结束后移除类名，以便下次触发
    const onEnd = () => {
      el.classList.remove(vfxClass);
      el.removeEventListener('animationend', onEnd);
    };
    el.addEventListener('animationend', onEnd);
  }

  /**
   * 创建伤害飘字
   */
  createDamageText(x, y, amount) {
    const el = document.createElement('div');
    el.className = 'damage-text';
    // 格式化数字，如果是整数则不保留小数
    const val = Math.floor(amount);
    el.textContent = val > 0 ? `-${val}` : '';
    if (!el.textContent) return;

    el.style.left = `${x}px`;
    el.style.top = `${y - 40}px`; // 在实体上方出现

    this.container.appendChild(el);

    // 动画结束后自动销毁
    el.onanimationend = () => el.remove();
  }

  render(entities) {
    for (const entity of entities) {
      let el = this.elementMap.get(entity.id);

      if (!el) {
        // 创建新元素
        el = this.createEntityElement(entity);
        this.container.appendChild(el);
        this.elementMap.set(entity.id, el);

        // 为新实体绑定伤害监听 (仅限敌人显示飘字，战宠受伤不显示)
        if (entity.side === 'enemy') {
          entity.onDamage = (amount) => {
            this.createDamageText(entity.x, entity.y, amount);
          };
        }
      }

      if (entity.isDead) {
        el.style.display = 'none';
        continue;
      }

      // 更新位置 (CSS transform 比 top/left 性能更好)
      el.style.transform = `translate(${entity.x}px, ${entity.y}px)`;
      
      // 更新血条
      const hpBarFill = el.querySelector('.hp-fill');
      if (hpBarFill) {
        hpBarFill.style.width = `${(entity.hp / entity.maxHp) * 100}%`;
      }

      // 更新 Buff 特效类
      this.updateVFXClasses(el, entity);
    }
  }

  /**
   * 根据 Entity 的 Buff 状态更新 DOM 元素的 CSS 类
   */
  updateVFXClasses(el, entity) {
    if (!entity.buffs) return;

    // 狂暴特效
    const hasFrenzy = entity.buffs.some(b => b.type === 'frenzy');
    el.classList.toggle('vfx-frenzy', hasFrenzy);

    // 护盾/神圣战甲特效
    const hasHolyArmor = entity.buffs.some(b => b.type === 'holy_armor');
    el.classList.toggle('vfx-holy_armor', hasHolyArmor);

    // 毒素注入特效
    const hasPoisonInfusion = entity.buffs.some(b => b.type === 'poison_infusion');
    el.classList.toggle('vfx-poison_infusion', hasPoisonInfusion);

    // 中毒特效
    const hasPoison = entity.buffs.some(b => b.type === 'poison');
    el.classList.toggle('vfx-poisoned', hasPoison);

    // 治疗特效
    el.classList.toggle('vfx-heal', !!entity.showHealEffect);
  }

  createEntityElement(entity) {
    const div = document.createElement('div');
    div.className = `combat-entity ${entity.side}`;
    
    let atkHTML = '';
    if (entity.side === 'enemy') {
      atkHTML = `<div class="entity-atk-label">攻 ${entity.atk}</div>`;
    }

    const iconText = entity.side === 'enemy' ? '敌' : (window.currentSkin || entity.name);

    div.innerHTML = `
      ${atkHTML}
      <div class="entity-hp-bar">
        <div class="hp-fill"></div>
      </div>
      <div class="entity-vfx-layer"></div>
      <div class="entity-icon">${iconText}</div>
    `;
    return div;
  }
}
