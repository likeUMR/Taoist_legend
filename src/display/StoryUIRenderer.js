/**
 * 剧情 UI 渲染类：负责将剧情数据渲染到主界面的剧情弹窗中
 */
export class StoryUIRenderer {
  constructor(modalId, storyManager) {
    this.modal = document.getElementById(modalId);
    this.storyManager = storyManager;
    
    // 主界面倒计时显示元素
    this.mainTimerEl = document.querySelector('.story-time-small');
    
    if (this.modal) {
      this.titleEl = this.modal.querySelector('.story-title');
      this.contentEl = this.modal.querySelector('.story-content');
      this.confirmBtn = this.modal.querySelector('.story-confirm-btn');
      
      // 添加倒计时和要求显示区域 (如果不存在则动态创建)
      this.ensureExtraUI();
      
      // 绑定按钮事件
      this.initEvents();
    }
  }

  /**
   * 初始化事件绑定
   */
  initEvents() {
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => {
        if (this.storyManager.isTaskClaimable) {
          const result = this.storyManager.claimReward();
          if (result.success && result.skinResult) {
            const { skin, isNew, rewardLingfu } = result.skinResult;
            let message = '';
            if (isNew) {
              message = `获得新皮肤：${skin.name}！`;
            } else {
              message = `重复获得${skin.name}，转化为${rewardLingfu}灵符`;
            }
            
            // 使用 main.js 中的 showFeedback 或自定义显示
            if (window.showFeedback) {
              window.showFeedback(true, message);
            } else {
              alert(message);
            }
          }
          this.render(); // 重新渲染下一段剧情
        }
      });
    }

    // 设置状态更新回调，以便在任务超时自动切换时刷新 UI
    this.storyManager.onTaskUpdate = () => {
      if (this.modal.style.display === 'flex' || this.modal.classList.contains('active')) {
        this.render();
      }
    };
  }

  /**
   * 确保额外的 UI 元素存在
   */
  ensureExtraUI() {
    const paper = this.modal.querySelector('.story-paper');
    if (!paper) return;

    // 1. 顶部插图/图标区域
    if (!paper.querySelector('.story-illustration')) {
      const illustration = document.createElement('div');
      illustration.className = 'story-illustration';
      illustration.style.width = '100px';
      illustration.style.height = '100px';
      illustration.style.margin = '0 auto 15px';
      illustration.style.position = 'relative';
      illustration.style.background = '#e2e8f0';
      illustration.style.border = '3px solid #000';
      illustration.style.borderRadius = '8px';
      illustration.style.overflow = 'hidden';
      
      // 使用 CSS 绘制一个简约沙城图标
      illustration.innerHTML = `
        <div style="position:absolute; bottom:0; left:10%; width:80%; height:40%; background:#d4a017; border-top:2px solid #000;"></div>
        <div style="position:absolute; bottom:40%; left:20%; width:20%; height:30%; background:#d4a017; border:2px solid #000; border-bottom:none;"></div>
        <div style="position:absolute; bottom:40%; right:20%; width:20%; height:30%; background:#d4a017; border:2px solid #000; border-bottom:none;"></div>
        <div style="position:absolute; bottom:40%; left:42.5%; width:15%; height:45%; background:#d4a017; border:2px solid #000; border-bottom:none;"></div>
        <div style="position:absolute; bottom:10%; left:45%; width:10%; height:15%; background:#000; border-radius:2px 2px 0 0;"></div>
      `;
      paper.insertBefore(illustration, this.titleEl || this.contentEl);
    }

    // 2. 顶部倒计时 (红色)
    if (!paper.querySelector('.story-meta')) {
      const meta = document.createElement('div');
      meta.className = 'story-meta';
      meta.style.textAlign = 'right';
      meta.style.marginBottom = '5px';
      meta.innerHTML = `
        <div class="story-timer" style="color: #ff4444; font-weight: bold; font-size: 14px;">
          剩余时间: <span class="time-val">00:00:00</span>
        </div>
      `;
      paper.insertBefore(meta, this.contentEl);
    }

    // 3. 剧情下方的要求文本 (居中)
    if (!paper.querySelector('.story-footer-requirement')) {
      const reqFooter = document.createElement('div');
      reqFooter.className = 'story-footer-requirement';
      reqFooter.style.textAlign = 'center';
      reqFooter.style.marginTop = '15px';
      reqFooter.style.fontSize = '14px';
      reqFooter.style.color = '#666';
      reqFooter.innerHTML = `我必须拥有 <span class="req-val" style="color: #d4a017; font-weight: bold;">CL.0</span> 的战宠才能渡过这一关`;
      paper.appendChild(reqFooter);
    }

    this.reqValEl = paper.querySelector('.req-val');
    this.timeValEl = paper.querySelector('.time-val');
  }

  /**
   * 渲染当前剧情和任务状态
   */
  render() {
    if (!this.modal || !this.storyManager) return;

    const story = this.storyManager.getCurrentStory();
    if (!story) return;

    // 1. 渲染基本内容
    if (this.titleEl) {
      this.titleEl.textContent = `沙城秘闻 · ${story.id}`;
    }

    if (this.contentEl) {
      this.contentEl.innerHTML = `<p>${story.content}</p>`;
    }

    // 2. 渲染任务要求
    if (this.reqValEl) {
      this.reqValEl.textContent = `CL.${this.storyManager.getRequiredClassLevel()}`;
    }

    // 3. 更新按钮状态 (不再在按钮上显示倒计时)
    if (this.confirmBtn) {
      if (this.storyManager.isTaskClaimable) {
        this.confirmBtn.textContent = '领取奖励';
        this.confirmBtn.classList.add('claimable');
        this.confirmBtn.disabled = false;
        this.confirmBtn.style.color = ''; 
      } else {
        this.confirmBtn.textContent = '进行中';
        this.confirmBtn.classList.remove('claimable');
        this.confirmBtn.disabled = true;
      }
    }

    // 4. 更新所有倒计时显示
    this.updateTimer();
  }

  /**
   * 仅更新倒计时显示
   */
  updateTimer() {
    if (!this.storyManager) return;

    const seconds = this.storyManager.getTimeLeft();
    
    // 1. 更新弹窗内顶部倒计时 (HH:MM:SS)
    if (this.timeValEl) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      this.timeValEl.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // 2. 更新主界面按钮下的倒计时 (Xd HH:MM)
    if (this.mainTimerEl) {
      const d = Math.floor(seconds / (24 * 3600));
      const h = Math.floor((seconds % (24 * 3600)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      
      // 格式：0d 00:00
      this.mainTimerEl.textContent = `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      // 样式设为红色 (对应挂机奖励风格)
      this.mainTimerEl.style.color = '#ff4444';
      this.mainTimerEl.style.fontSize = '10px';
      this.mainTimerEl.style.fontWeight = 'bold';
    }
  }
}
