import { formatNumber } from '../utils/format.js';
import { audioManager } from '../utils/AudioManager.js';

/**
 * 试炼 UI 渲染类：负责试炼列表的动态生成和交互
 */
export class TrialUIRenderer {
  constructor(options) {
    this.trialManager = options.trialManager;
    this.modal = document.getElementById('adventure-modal');
    
    // 分页内容容器
    this.fortuneContent = this.modal.querySelector('#fortune-trial-page .pet-list-content');
    this.speedContent = this.modal.querySelector('#speed-trial-page .pet-list-content');
    this.manaContent = this.modal.querySelector('#mana-trial-page .pet-list-content');
    
    this.trialManager.onUpdateUI = () => this.render();
  }

  /**
   * 渲染所有试炼列表
   */
  render() {
    this.renderTrialList('retry', this.fortuneContent);
    this.renderTrialList('speed', this.speedContent);
    this.renderTrialList('mana', this.manaContent);
  }

  /**
   * 渲染指定类型的试炼列表
   */
  renderTrialList(type, container) {
    if (!container) return;
    
    const levels = this.trialManager.getTrialList(type);
    let typeTitle = '强运试炼';
    if (type === 'speed') typeTitle = '速度试炼';
    if (type === 'mana') typeTitle = '法力试炼';
    
    container.innerHTML = levels.map((level, i) => {
      const isLocked = !level.isUnlocked;
      const isCompleted = level.isCompleted;
      
      let rewardText = '';
      if (type === 'retry') {
        const prevProb = i > 0 ? levels[i-1].retryProb : 0;
        const diff = level.retryProb - prevProb;
        rewardText = `重试概率 +${(diff * 100).toFixed(1)}%`;
      } else if (type === 'speed') {
        const prevMult = i > 0 ? levels[i-1].speedMultiplier : 1.0;
        const diff = level.speedMultiplier - prevMult;
        rewardText = `移速加成 +${(diff * 100).toFixed(1)}%`;
      } else if (type === 'mana') {
        const prevCap = i > 0 ? levels[i-1].manaCap : 0;
        const diff = level.manaCap - prevCap;
        rewardText = `法力上限 +${diff.toFixed(1)}`;
      }
      
      return `
        <div class="adventure-item ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}">
          <div class="adventure-item-header">
            ${typeTitle} - 第 ${i + 1} 关
            ${isCompleted ? '<span class="status-tag check-mark">✓ 已通关</span>' : ''}
            ${isLocked ? '<span class="status-tag">未解锁</span>' : ''}
          </div>
          <div class="adventure-item-body">
            <div class="adventure-rewards">
              <div class="adv-reward-slot">🎁<span>${rewardText}</span></div>
            </div>
            <button class="adv-challenge-btn" 
                    ${isLocked ? 'disabled' : ''} 
                    data-type="${type}" 
                    data-index="${i}">
              ${isLocked ? '锁定' : (isCompleted ? '重复挑战' : '挑战')}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 绑定事件
    container.querySelectorAll('.adv-challenge-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audioManager.playClick();
        const type = e.target.dataset.type;
        const index = parseInt(e.target.dataset.index);
        
        if (this.trialManager.startTrial(type, index)) {
          // 关闭弹窗
          this.modal.classList.add('hidden');
        }
      });
    });
  }
}
