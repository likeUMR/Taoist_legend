/**
 * 在线奖励 UI 渲染器
 */
export class OnlineRewardUIRenderer {
  constructor(container, manager) {
    this.container = container;
    this.manager = manager;
    
    // 监听更新
    this.manager.onUpdate = () => {
      this.render();
    };
  }

  render() {
    if (!this.container) return;
    
    const rewards = this.manager.rewardsConfig;
    let html = '';
    
    rewards.forEach((reward, index) => {
      const isClaimed = this.manager.isClaimed(index);
      const canClaim = this.manager.canClaim(index);
      const progress = this.manager.getProgress(index);
      
      html += `
        <div class="pet-item online-reward-item" data-index="${index}">
          <div class="pet-item-main">
            <div class="pet-icon-wrap">
              <i class="icon ${reward.icon}"></i>
              <div class="pet-level-badge">x${reward.amount}</div>
            </div>
            <div class="pet-info">
              <div class="reward-title">在线 <span class="highlight">${reward.minutes}</span> 分钟</div>
              <div class="reward-progress-bar">
                <div class="fill green" style="width: ${progress.percent}%"></div>
                <span class="val">${progress.current}/${progress.target}</span>
              </div>
            </div>
            <div class="pet-action">
              ${isClaimed 
                ? '<span class="claimed-text">已领取</span>' 
                : `<button class="claim-btn-small ${canClaim ? '' : 'disabled'}" data-index="${index}">领取</button>`
              }
            </div>
          </div>
        </div>
      `;
    });
    
    this.container.innerHTML = html;
  }

  /**
   * 绑定点击事件 (已废弃，改由 main.js 统一处理以复刻战宠面板行为)
   */
  bindEvents(modalElement) {
    // 统一在 main.js 处理
  }
}
