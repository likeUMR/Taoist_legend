import { GameConfig } from './GameConfig.js';

/**
 * 添加到桌面管理器：负责 PWA 安装逻辑和跨平台引导
 */
export class AddDesktopManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.platform = this._checkPlatform();
    
    // 从 localStorage 加载是否已领取奖励
    this.isRewardClaimed = GameConfig.getStorageItem('taoist_desktop_reward_claimed') === 'true';
    
    this.onPromptAvailable = null; // 当浏览器支持一键添加时触发
    this.onInstalled = null;      // 当安装完成时触发
    
    this._init();
  }

  _init() {
    // 监听 PWA 安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认弹窗
      e.preventDefault();
      // 暂存事件
      this.deferredPrompt = e;
      console.log('PWA: beforeinstallprompt triggered');
      
      if (this.onPromptAvailable) {
        this.onPromptAvailable();
      }
    });

    // 监听安装成功事件
    window.addEventListener('appinstalled', (evt) => {
      console.log('PWA: Installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      if (this.onInstalled) {
        this.onInstalled();
      }
    });

    // 检查是否已经在独立模式运行 (PWA 已打开)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      this.isInstalled = true;
    }
  }

  _checkPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/windows/.test(ua)) return 'windows';
    return 'pc';
  }

  /**
   * 请求添加桌面
   * @returns {Promise<{success: boolean, type: 'prompt'|'guide'}>}
   */
  async requestInstall() {
    if (this.platform === 'ios') {
      return { success: true, type: 'guide' };
    }

    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`PWA: User choice: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.isInstalled = true;
        this.deferredPrompt = null;
        return { success: true, type: 'prompt' };
      }
    }

    // 如果没有 deferredPrompt 或者用户拒绝，或者是不支持的平台，返回 guide
    return { success: true, type: 'guide' };
  }

  /**
   * 领取奖励 (iOS 只要看教程就能领，Windows/Android 需要安装或看教程)
   */
  claimReward() {
    if (this.isRewardClaimed) return { success: false, reason: '已领取' };
    
    const rewardAmount = 500;
    this.currencyManager.addIngot(rewardAmount);
    this.isRewardClaimed = true;
    GameConfig.setStorageItem('taoist_desktop_reward_claimed', 'true');
    
    return { success: true, amount: rewardAmount };
  }

  getIsRewardClaimed() {
    return this.isRewardClaimed;
  }
}
