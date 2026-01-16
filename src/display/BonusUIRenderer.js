/**
 * 金币加成 UI 渲染器：负责金币加成界面的显示更新
 */
export class BonusUIRenderer {
  constructor(container, statManager) {
    this.container = container;
    this.statManager = statManager;
    
    // 缓存 DOM 元素
    this.currValEl = container.querySelector('.curr-val');
    this.nextValEl = container.querySelector('.next-val');
    this.upgradeBtn = container.querySelector('.upgrade-action-btn');
    this.arrowEl = container.querySelector('.arrow');
  }

  /**
   * 渲染/更新界面内容
   */
  render() {
    const info = this.statManager.getGoldBonusInfo();
    
    // 更新数值显示
    this.currValEl.textContent = `+${info.currentPercent}%`;
    
    if (info.isMax) {
      this.nextValEl.textContent = 'MAX';
      this.upgradeBtn.disabled = true;
      this.upgradeBtn.innerHTML = '已满级';
      this.arrowEl.style.display = 'none';
    } else {
      this.nextValEl.textContent = `+${info.nextPercent}%`;
      this.upgradeBtn.disabled = false;
      this.upgradeBtn.classList.add('ad-style'); // 强制蓝色广告样式
      this.upgradeBtn.innerHTML = '<i class="icon-video"></i> 升级';
      this.arrowEl.style.display = 'inline-block';
    }
  }
}
