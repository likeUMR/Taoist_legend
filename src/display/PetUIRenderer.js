import { formatNumber } from '../utils/format.js';

/**
 * 战宠界面渲染器：负责将战宠逻辑数据渲染为 HTML
 */
export class PetUIRenderer {
  constructor(container, collection) {
    this.container = container;
    this.collection = collection;
  }

  /**
   * 渲染整个面板内容
   */
  render() {
    const totals = this.collection.getTotals();
    const listData = this.collection.getPetListData();
    // 获取当前货币用于判断按钮状态
    const currentGold = window.currencyManager ? window.currencyManager.gold : 0;
    const currentEssence = window.currencyManager ? window.currencyManager.essence : 0;

    // 1. 构建统计头 HTML
    const headerInnerHTML = `
      <span>战宠总数量:${totals.count}</span>
      <span>战宠总攻击:${formatNumber(totals.totalAtk)}</span>
      <span>战宠总生命:${formatNumber(totals.totalHp)}</span>
    `;

    // 2. 构建列表项 HTML
    const listHTML = listData.map(pet => {
      if (!pet.unlocked) {
        const canAffordUnlock = currentGold >= pet.unlockCost;
        return `
          <div class="pet-item locked" data-id="${pet.id}">
            <div class="pet-item-main">
              <div class="pet-icon-wrap gray">
                <div class="pet-icon-placeholder">?</div>
              </div>
              <div class="pet-info">
                <h3>未解锁</h3>
                <p>${pet.description}</p>
              </div>
              <div class="pet-action">
                <button class="unlock-btn" data-id="${pet.id}" ${!canAffordUnlock ? 'disabled' : ''}>
                  <span>解锁</span>
                  <span class="cost">${formatNumber(pet.unlockCost)} 金币</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      const btnText = pet.isBreakthrough ? '突破' : '强化';
      const costClass = pet.isBreakthrough ? 'cost essence' : 'cost';
      const rateText = pet.hasMaxLevel ? '已满级' : (pet.isBreakthrough ? '' : `(${Math.floor(pet.successRate * 100)}%)`);
      
      let canAfford = false;
      if (!pet.hasMaxLevel) {
        if (pet.isBreakthrough) {
          canAfford = currentEssence > 0; // 突破逻辑：大于0即可
        } else {
          canAfford = currentGold >= pet.upgradeCost;
        }
      }

      return `
        <div class="pet-item" data-id="${pet.id}">
          <div class="pet-item-main">
            <div class="pet-icon-wrap">
              <div class="pet-level-badge">${pet.id}</div>
              <div class="pet-icon-placeholder">🐺</div>
            </div>
            <div class="pet-info">
              <h3>${pet.name} <span class="plus-text">+${pet.level}</span></h3>
              <div class="attr-row">
                攻击力 ${formatNumber(pet.currentAtk)} ${pet.nextAtk ? `<span class="arrow">→</span> <span class="up">${formatNumber(pet.nextAtk)}</span>` : ''}
              </div>
              <div class="attr-row">
                生命值 ${formatNumber(pet.currentHp)} ${pet.nextHp ? `<span class="arrow">→</span> <span class="up">${formatNumber(pet.nextHp)}</span>` : ''}
              </div>
            </div>
            <div class="pet-action">
              <button class="upgrade-btn ${pet.isBreakthrough ? 'breakthrough' : ''}" data-id="${pet.id}" ${pet.hasMaxLevel || !canAfford ? 'disabled' : ''}>
                <span class="rate">${btnText}${rateText}</span>
                ${pet.hasMaxLevel ? '' : `<span class="${costClass}">${formatNumber(pet.upgradeCost)}</span>`}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 3. 初始结构注入或增量更新
    if (!this.container.querySelector('.pet-stats-header')) {
      this.container.innerHTML = `
        <div class="pet-stats-header"></div>
        <div class="pet-scroll-view">
          <div class="pet-list-content"></div>
        </div>
        <div class="pet-essence-footer">
          <div class="essence-bar-wrap">
            <div class="essence-fill"></div>
            <div class="essence-text">神兽精华: 0/15</div>
          </div>
        </div>
      `;
    }

    // 更新内部数据，保持 DOM 结构引用稳定
    this.container.querySelector('.pet-stats-header').innerHTML = headerInnerHTML;
    this.container.querySelector('.pet-list-content').innerHTML = listHTML;
  }

  /**
   * 更新精华显示 (独立更新，避免重绘列表)
   */
  updateEssence(current, max, timeToNext) {
    const footer = this.container.querySelector('.pet-essence-footer');
    if (!footer) return;

    const fill = footer.querySelector('.essence-fill');
    const text = footer.querySelector('.essence-text');

    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    fill.style.width = `${percent}%`;
    
    let statusText = `神兽精华: ${formatNumber(current)}/${max}`;
    if (current < max) {
      const mins = Math.floor(timeToNext / 60);
      const secs = timeToNext % 60;
      statusText += ` (下一恢复 ${mins}:${secs.toString().padStart(2, '0')})`;
    } else {
      statusText += " (已满值)";
    }
    text.textContent = statusText;
  }

  formatNumber(num) {
    return formatNumber(num);
  }
}
