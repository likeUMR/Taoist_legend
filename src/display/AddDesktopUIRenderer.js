/**
 * 添加桌面 UI 渲染器
 */
export class AddDesktopUIRenderer {
  constructor(modalSelector, manager) {
    this.modal = document.querySelector(modalSelector);
    this.manager = manager;
    this.closeBtn = this.modal.querySelector('.close-btn');
    this.claimBtn = this.modal.querySelector('.desktop-claim-btn');
    this.stepsList = this.modal.querySelector('.steps-list');
    this.entryBtn = document.getElementById('desktop-entry-btn'); // 获取入口按钮
    
    this._init();
  }

  _init() {
    this.render();
    
    // 监听安装成功自动更新 UI
    this.manager.onInstalled = () => {
      this.render();
    };

    // 监听奖励领取状态变化 (如果有必要)
  }

  render() {
    if (!this.modal) return;

    const isClaimed = this.manager.getIsRewardClaimed();
    const platform = this.manager.platform;

    // 即使领过奖励也保持入口按钮可见
    if (this.entryBtn) {
      this.entryBtn.classList.remove('hidden');
    }

    // 根据平台更新引导步骤
    if (platform === 'ios') {
      this.stepsList.innerHTML = `
        <li>1. 点击浏览器底部的“分享”图标 <span class="ios-icon">⎋</span></li>
        <li>2. 向下滑动并点击“添加到主屏幕”</li>
        <li>3. 点击右上角的“添加”按钮</li>
      `;
    } else if (platform === 'android' || platform === 'windows') {
      this.stepsList.innerHTML = `
        <li>1. 点击下方的“领取奖励”按钮</li>
        <li>2. 在弹出的系统窗口点击“添加”或“安装”</li>
        <li>3. 若无弹窗，请点击浏览器菜单手动添加</li>
      `;
    }

    // 更新按钮状态
    if (isClaimed) {
      this.claimBtn.textContent = '已领取';
      this.claimBtn.classList.add('disabled');
    } else {
      this.claimBtn.textContent = '领取奖励';
      this.claimBtn.classList.remove('disabled');
    }
  }

  async handleClaimClick() {
    // 如果已经领过奖，点击按钮则直接关闭界面
    if (this.manager.getIsRewardClaimed()) {
      this.modal.classList.add('hidden');
      return;
    }

    // 对于支持一键添加的平台，尝试触发
    if (this.manager.platform !== 'ios') {
      await this.manager.requestInstall();
    }

    // 无论是否安装成功，点击即视为同意（或已看完引导），直接发奖（简化逻辑）
    const result = this.manager.claimReward();
    if (result.success) {
      this.render();
      if (window.showFeedback) window.showFeedback(true);
      
      // 领取成功后不再自动关闭弹窗
      console.log(`添加桌面奖励领取成功: ${result.amount} 元宝`);
    }
  }

  bindEvents() {
    this.claimBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleClaimClick();
    });

    // 移除冗余的关闭监听器，main.js 已统一处理
  }
}
