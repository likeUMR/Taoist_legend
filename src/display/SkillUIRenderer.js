import { formatNumber } from '../utils/format.js';

/**
 * 技能界面渲染器：负责将技能数据渲染为 HTML 列表
 * 实现方法参考 PetUIRenderer.js
 */
export class SkillUIRenderer {
  constructor(container, skillManager) {
    this.container = container; // 通常是 .modal-body
    this.skillManager = skillManager;
  }

  /**
   * 渲染技能列表
   */
  render() {
    const listData = this.skillManager.getSkillListData();
    const videoManager = window.videoManager;

    const listHTML = listData.map(skill => {
      let showAdBtn = false;
      let canUpgrade = false;

      if (!skill.hasMaxLevel) {
        if (skill.canAfford) {
          canUpgrade = true;
        } else if (videoManager && videoManager.getRemaining('skill') > 0) {
          // 新增：检查价格许可限制
          if (videoManager.isUpgradeAllowed(skill.upgradeCost)) {
            showAdBtn = true;
            canUpgrade = true;
          }
        }
      }

      const adClass = showAdBtn ? 'ad-style' : '';
      const videoIcon = showAdBtn ? '<i class="icon-video"></i> ' : '';
      const btnText = skill.hasMaxLevel ? '已满级' : (showAdBtn ? '免费升级' : '升级');
      const rateText = (skill.hasMaxLevel || showAdBtn) ? '' : `(${Math.floor(skill.successRate * 100)}%)`;

      return `
        <div class="pet-item" data-name="${skill.baseName}">
          <div class="pet-item-main">
            <div class="pet-icon-wrap">
              <div class="pet-icon-placeholder">📜</div>
            </div>
            <div class="pet-info">
              <h3>${skill.displayName} <span class="plus-text">+${skill.level}</span></h3>
              <div class="attr-row">
                强度系数 ${skill.currentAttr.toFixed(2)} ${skill.nextAttr ? `<span class="arrow">→</span> <span class="up">${skill.nextAttr.toFixed(2)}</span>` : ''}
              </div>
            </div>
            <div class="pet-action">
              <button class="upgrade-btn ${adClass}" 
                data-name="${skill.baseName}" 
                data-ad="${showAdBtn}"
                ${(!canUpgrade && !skill.hasMaxLevel) || skill.hasMaxLevel ? 'disabled' : ''}>
                <span class="rate">${videoIcon}${btnText}${rateText}</span>
                ${skill.hasMaxLevel ? '' : `<span class="cost">${formatNumber(skill.upgradeCost, true)}</span>`}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 初始结构注入
    if (!this.container.querySelector('.pet-scroll-view')) {
      this.container.innerHTML = `
        <div class="pet-scroll-view">
          <div class="pet-list-content"></div>
        </div>
        <div class="ad-count-footer">
          本日视频升级次数: <span class="ad-val">0/10</span>
        </div>
      `;
    }

    // 更新列表内容
    this.container.querySelector('.pet-list-content').innerHTML = listHTML;

    // 更新广告次数显示
    if (videoManager) {
      const remaining = videoManager.getRemaining('skill');
      const limit = videoManager.getLimit('skill');
      this.container.querySelector('.ad-val').textContent = `${remaining}/${limit}`;
    }
  }
}
