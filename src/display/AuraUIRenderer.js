import { formatNumber } from '../utils/format.js';

/**
 * 光环界面渲染器
 */
export class AuraUIRenderer {
  constructor(container, auraManager) {
    this.container = container;
    this.auraManager = auraManager;
  }

  render() {
    const listData = this.auraManager.getAuraListData();
    const currentGold = window.currencyManager ? window.currencyManager.gold : 0;

    const listHTML = listData.map(item => {
      const canAfford = currentGold >= item.upgradeCost;
      const hasAd = window.videoManager && window.videoManager.getRemaining('aura') > 0;
      const showAdBtn = !canAfford && hasAd;
      
      const btnText = item.isBreakthrough ? '突破' : '升级';
      const rateText = item.hasMaxLevel ? '已满级' : (showAdBtn ? '' : `(${Math.floor(item.successRate * 100)}%)`);
      const adClass = showAdBtn ? 'ad-style' : '';
      const videoIcon = showAdBtn ? '<i class="icon-video"></i> ' : '';

      // 解析百分比数值 (参考修炼)
      const currentPercent = ((item.currentValue - 1) * 100).toFixed(1);
      const nextPercent = item.nextValue ? ((item.nextValue - 1) * 100).toFixed(1) : null;

      // 解析描述文本
      const attrName = item.name.replace('光环', '');
      const descText = `全部战宠${attrName}增加${Math.round((item.currentValue - 1) * 100)}%`;

      return `
        <div class="pet-item aura-item">
          <div class="pet-item-main">
            <div class="cult-icon-box">✨</div>
            <div class="cult-info">
              <div class="cult-title-row">
                <span class="cult-name">${item.name}</span>
                <span class="cult-level">+${item.level}</span>
              </div>
              <div class="cult-desc">${descText}</div>
              <div class="cult-value-row">
                效果: ${currentPercent}% 
                ${nextPercent ? `<span class="arrow">→</span> <span class="text-green">${nextPercent}%</span>` : ''}
              </div>
            </div>
            <div class="pet-action">
              <button class="upgrade-btn ${adClass}" 
                data-name="${item.name}" 
                data-ad="${showAdBtn}"
                ${(item.hasMaxLevel || (!canAfford && !showAdBtn)) ? 'disabled' : ''}>
                <span class="rate">${videoIcon}${btnText}${rateText}</span>
                ${item.hasMaxLevel ? '' : `<span class="cost">${formatNumber(item.upgradeCost, true)}</span>`}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 初始结构注入或刷新列表
    if (!this.container.querySelector('.pet-list-content')) {
      this.container.innerHTML = `
        <div class="pet-scroll-view">
          <div class="pet-list-content">
            ${listHTML}
          </div>
        </div>
        <div class="ad-count-footer">
          本日视频光环升级次数: <span class="ad-val">5/5</span>
        </div>
      `;
    } else {
      this.container.querySelector('.pet-list-content').innerHTML = listHTML;
    }

    // 更新广告次数 (显示 剩余/总额)
    if (window.videoManager) {
      const remaining = window.videoManager.getRemaining('aura');
      const limit = window.videoManager.getLimit('aura');
      const adVal = this.container.querySelector('.ad-val');
      if (adVal) adVal.textContent = `${remaining}/${limit}`;
    }
  }
}
