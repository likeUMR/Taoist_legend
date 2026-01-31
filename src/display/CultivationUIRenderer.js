import { formatNumber } from '../utils/format.js';

/**
 * 修炼 UI 渲染器：负责修炼列表的渲染与升级交互
 */
export class CultivationUIRenderer {
  constructor(container, manager) {
    this.container = container; // .pet-list-content
    this.manager = manager;
    
    // 图标映射
    this.icons = {
      '金币产出': '💰',
      '强化成功率': '🔨',
      '体力上限': '⛏️',
      '强化消耗': '✨',
      '离线奖励': '💤',
      '全队攻击': '⚔️',
      '全队生命': '❤️',
      '双倍强化': '⏫',
      '双倍掉落': '💎'
    };
  }

  /**
   * 渲染列表
   */
  render() {
    if (!this.manager.isLoaded) return;

    const list = this.manager.getUpgradeList();
    this.container.innerHTML = list.map(item => this.createItemHTML(item)).join('');
    
    // 更新广告次数显示 (如果容器有对应的 footer)
    const modalBody = this.container.closest('.modal-body');
    if (modalBody) {
      let adFooter = modalBody.querySelector('.ad-count-footer');
      if (!adFooter) {
        adFooter = document.createElement('div');
        adFooter.className = 'ad-count-footer';
        modalBody.appendChild(adFooter);
      }
      if (window.videoManager) {
        const remaining = window.videoManager.getRemaining('cultivation');
        const limit = window.videoManager.getLimit('cultivation');
        adFooter.innerHTML = `本日视频强化次数: <span class="ad-val">${remaining}/${limit}</span>`;
      }
    }
  }

  /**
   * 生成单个项目的 HTML
   */
  createItemHTML(item) {
    const icon = this.icons[item.name] || '🔮';
    const isMax = item.isMax;
    const canAfford = !isMax && window.currencyManager.gold >= item.cost;
    
    let showAdBtn = false;
    if (!isMax && !canAfford && window.videoManager && window.videoManager.getRemaining('cultivation') > 0) {
      // 新增：检查价格许可限制
      if (window.videoManager.isUpgradeAllowed(item.cost)) {
        showAdBtn = true;
      }
    }

    const adClass = showAdBtn ? 'ad-style' : '';
    const videoIcon = showAdBtn ? '<i class="icon-video"></i> ' : '';

    // 格式化数值显示
    const formatVal = (v) => {
      if (v === null) return '';
      
      if (item.name === '金币消耗') {
        // 显示为 1/v 的百分比，例如 1/1.25 = 80%
        return `${((1 / v) * 100).toFixed(0)}%`;
      }
      
      if (item.name === '双倍强化' || item.name === '双倍掉落') {
        // 显示为实际值 - 1 的百分比，例如 1.05 -> 5%
        return `${((v - 1) * 100).toFixed(0)}%`;
      }

      // 默认逻辑：如果项目名包含特定关键字，显示为百分比
      if (item.name.includes('产出') || item.name.includes('率')) {
        return `${(v * 100).toFixed(0)}%`;
      }
      return formatNumber(v);
    };

    return `
      <div class="cultivation-item">
        <div class="cult-icon-box">${icon}</div>
        <div class="cult-info">
          <div class="cult-title-row">
            <span class="cult-name">${item.name}</span>
            <span class="cult-level">+${item.level}</span>
          </div>
          <div class="cult-desc">${item.description}</div>
          <div class="cult-value-row">
            ${formatVal(item.currentValue)}
            ${!isMax ? `<span class="arrow">→</span><span class="text-green">${formatVal(item.nextValue)}</span>` : ''}
          </div>
        </div>
        <div class="cult-action">
          <button class="upgrade-btn ${adClass}" 
            data-name="${item.name}" 
            data-ad="${showAdBtn}"
            ${(!canAfford && !showAdBtn || isMax) ? 'disabled' : ''}>
            <span class="rate">${videoIcon}强化</span>
            <span class="cost">${isMax ? '已满级' : formatNumber(item.cost, true)}</span>
          </button>
        </div>
      </div>
    `;
  }
}
