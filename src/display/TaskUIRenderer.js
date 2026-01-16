import { formatNumber } from '../utils/format.js';

/**
 * 任务 UI 渲染器：负责任务小块的状态显示与交互
 */
export class TaskUIRenderer {
  constructor(containerSelector, taskManager) {
    this.container = document.querySelector(containerSelector);
    this.taskManager = taskManager;
    
    if (this.container) {
      this.initEvents();
    }
  }

  initEvents() {
    this.container.addEventListener('click', () => {
      const result = this.taskManager.claimReward();
      if (!result.success) {
        // 如果未完成，可以加个抖动效果或者提示
        this.container.classList.add('shake');
        setTimeout(() => this.container.classList.remove('shake'), 500);
      }
    });
  }

  render() {
    if (!this.container) return;

    const task = this.taskManager.getCurrentTask();
    const contentEl = this.container.querySelector('.quest-content');
    const rewardEl = this.container.querySelector('.quest-reward');

    if (!task) {
      contentEl.textContent = "暂无新任务";
      rewardEl.textContent = "";
      this.container.classList.remove('completed');
      return;
    }

    const isCompleted = this.taskManager.isCurrentTaskCompleted();
    const progressClass = isCompleted ? 'text-green' : 'text-red';
    
    // 获取任务描述并拆分，以便对括号部分着色
    let descBase = "";
    let current = 0;
    let target = 0;

    if (task.levelReq !== null) {
      descBase = `通关第 ${task.levelReq} 层`;
      current = Math.max(0, this.taskManager.maxLevelReached - 1);
      target = task.levelReq;
    } else if (task.upgradeReq !== null) {
      descBase = `总强化成功 ${task.upgradeReq} 次`;
      current = this.taskManager.totalUpgrades;
      target = task.upgradeReq;
    }

    contentEl.innerHTML = `${descBase} <span class="${progressClass}">(${formatNumber(current, true)}/${formatNumber(target, true)})</span>`;
    rewardEl.innerHTML = `<span class="reward-coin-icon"></span>${formatNumber(task.rewardGold, true)}`;

    // 检查是否完成并更新背景
    if (isCompleted) {
      this.container.classList.add('completed');
    } else {
      this.container.classList.remove('completed');
    }
  }
}
