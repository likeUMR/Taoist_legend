import { formatNumber } from '../utils/format.js';

/**
 * 挂机界面渲染器：负责挂机弹窗的内容渲染与交互显示
 */
export class AFKUIRenderer {
  constructor(container, afkManager) {
    this.container = container;
    this.afkManager = afkManager;
  }

  /**
   * 初始化显示基准关卡
   */
  initBaseStage() {
    // 弹窗打开时，默认预览当前产出等级对应的关卡
    const afkLevel = this.afkManager.getAFKLevel();
    this.afkManager.setSelectedStage(afkLevel * 10);
  }

  /**
   * 渲染整个面板
   */
  render() {
    const afkLevel = this.afkManager.getAFKLevel();
    const rewards = this.afkManager.calculateRewards();
    const efficiency = this.afkManager.getGoldEfficiency();
    const afkTime = this.afkManager.getFormattedAFKTime();
    const selectedStage = this.afkManager.selectedStage;

    // 1. 更新等级信息
    const levelInfo = this.container.querySelector('.afk-level-info');
    if (levelInfo) {
      levelInfo.innerHTML = `
        <div class="afk-lv-badge">当前等级 : <span class="highlight">LV.${afkLevel}</span></div>
        <p class="afk-sub-text">根据挂机时长获得相应奖励</p>
      `;
    }

    // 2. 更新关卡选择器
    this.renderStageSelector(selectedStage, afkLevel);

    // 3. 更新金币效率
    const efficiencyCard = this.container.querySelector('.afk-efficiency-card');
    if (efficiencyCard) {
      efficiencyCard.innerHTML = `
        <div class="efficiency-title">金币效率 (预览第${selectedStage}关)</div>
        <div class="efficiency-value">
          <i class="icon-coin-large"></i>
          <span class="value-text">${formatNumber(efficiency, true)}/h</span>
        </div>
      `;
    }
// ... (rest of the render function)

    // 4. 更新额外奖励
    const extraRewards = this.container.querySelector('.afk-extra-rewards');
    if (extraRewards) {
      extraRewards.innerHTML = `
        <div class="extra-title">额外获得奖励</div>
        <div class="rewards-row">
          <div class="reward-item">
            <div class="reward-icon coin"></div>
            <div class="reward-amount">${formatNumber(rewards.gold, true)}</div>
          </div>
          <div class="reward-item">
            <div class="reward-icon ingot"></div>
            <div class="reward-amount">${formatNumber(rewards.ingot, true)}</div>
          </div>
          <div class="reward-item">
            <div class="reward-icon stone"></div>
            <div class="reward-amount">${formatNumber(rewards.lingfu, true)}</div>
          </div>
        </div>
      `;
    }

    // 5. 更新挂机时间
    const timeDisplay = this.container.querySelector('.afk-time-display');
    if (timeDisplay) {
      timeDisplay.innerHTML = `挂机时间 : <span class="time-val">${afkTime}</span>`;
    }

    // 6. 更新金币奖励数值（虽然图片没直接显示，但领取按钮可能需要反馈，这里暂只更新时间）
  }

  /**
   * 渲染关卡选择部分
   */
  renderStageSelector(selectedStage, afkLevel) {
    const stageItemsContainer = this.container.querySelector('.stage-items');
    if (!stageItemsContainer) return;

    // 以 selectedStage 为中心
    const base = selectedStage;
    const stages = [base - 10, base, base + 10];
    
    // 当前已通关关卡决定的最高挂机产出关卡 (Production Stage)
    const productionStage = afkLevel * 10;

    stageItemsContainer.innerHTML = stages.map(s => {
      if (s < 0) return '<div class="stage-item disabled">-</div>';
      
      const isReached = s <= productionStage;
      const statusClass = isReached ? 'reached' : 'locked';
      const activeClass = s === selectedStage ? 'active' : '';
      
      return `<div class="stage-item ${statusClass} ${activeClass}" data-stage="${s}">${s}关</div>`;
    }).join('');
  }

  /**
   * 处理关卡切换逻辑
   * @param {string} direction 'left' | 'right'
   */
  shiftStage(direction) {
    const currentSelected = this.afkManager.selectedStage;
    let newSelected;
    if (direction === 'left') {
      newSelected = Math.max(0, currentSelected - 10);
    } else {
      newSelected = currentSelected + 10;
    }
    this.afkManager.setSelectedStage(newSelected);
    this.render();
  }
}
