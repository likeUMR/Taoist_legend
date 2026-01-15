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

  render(entities) {
    for (const entity of entities) {
      let el = this.elementMap.get(entity.id);

      if (!el) {
        // 创建新元素
        el = this.createEntityElement(entity);
        this.container.appendChild(el);
        this.elementMap.set(entity.id, el);
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
    }
  }

  createEntityElement(entity) {
    const div = document.createElement('div');
    div.className = `combat-entity ${entity.side}`;
    
    let atkHTML = '';
    if (entity.side === 'enemy') {
      atkHTML = `<div class="entity-atk-label">攻 ${entity.atk}</div>`;
    }

    div.innerHTML = `
      ${atkHTML}
      <div class="entity-hp-bar">
        <div class="hp-fill"></div>
      </div>
      <div class="entity-icon">${entity.name}</div>
    `;
    return div;
  }
}
