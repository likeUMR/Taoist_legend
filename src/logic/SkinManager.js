import { GameConfig } from './GameConfig.js';

export class SkinManager {
  constructor(currencyManager, audioManager) {
    this.currencyManager = currencyManager;
    this.audioManager = audioManager;
    
    this.SKIN_NAMES = [
      '狗', '獒', '狼', '狐', '豺', '豹', '麟', '狮', '虎', '象',
      '猿', '犼', '貔', '貅', '獬', '豸', '饕', '餮', '穷', '奇',
      '梼', '杌', '狰', '龙', '凤', '凰', '龟', '蛇', '鹤', '鹏',
      '蛟', '螭', '虬', '狻', '猊', '狴', '犴', '囚', '牛', '睚'
    ];

    this.SKINS = this.SKIN_NAMES.map((name, index) => {
      let grade;
      if (index < 16) { grade = 'C'; }
      else if (index < 28) { grade = 'B'; }
      else if (index < 36) { grade = 'A'; }
      else { grade = 'S'; }

      const points = GameConfig.SKIN_GRADE_POINTS[grade] || 0;

      // 简单的确定性随机分配点数 (基于索引)
      const bonuses = { hp: 0, atk: 0, critRate: 0, critDmg: 0, dodge: 0, combo: 0 };
      const attrKeys = Object.keys(bonuses);
      
      for (let i = 0; i < points; i++) {
        const attrIndex = (index * 7 + i * 3) % attrKeys.length;
        bonuses[attrKeys[attrIndex]]++;
      }

      return { name, grade, bonuses, unlocked: name === '狗' }; // 默认仅解锁“狗”
    });

    this.currentSkin = '狗';
    this.viewingSkinName = null;
    
    // 同步给全局，保持兼容性
    window.currentSkin = this.currentSkin;
  }

  calculateSkinBonuses() {
    const total = {
      hp: 0, atk: 0, critRate: 0, critDmg: 0, dodge: 0, combo: 0
    };

    this.SKINS.forEach(skin => {
      if (skin.unlocked) {
        total.hp += skin.bonuses.hp * 0.005;
        total.atk += skin.bonuses.atk * 0.003;
        total.critRate += skin.bonuses.critRate * 0.005;
        total.critDmg += skin.bonuses.critDmg * 0.01;
        total.dodge += skin.bonuses.dodge * 0.003;
        total.combo += skin.bonuses.combo * 0.002;
      }
    });

    return total;
  }

  updateSkinBonusUI(skinModal) {
    const bonuses = this.calculateSkinBonuses();
    const bonusGrid = skinModal.querySelector('.skin-bonus-grid');
    if (!bonusGrid) return;

    const items = bonusGrid.querySelectorAll('.bonus-item .bonus-val');
    if (items.length >= 6) {
      items[0].textContent = `x${(1 + bonuses.hp).toFixed(3)}`;
      items[1].textContent = `x${(1 + bonuses.atk).toFixed(3)}`;
      items[2].textContent = `+${(bonuses.critRate * 100).toFixed(1)}%`;
      items[3].textContent = `+${(bonuses.critDmg * 100).toFixed(1)}%`;
      items[4].textContent = `+${(bonuses.dodge * 100).toFixed(1)}%`;
      items[5].textContent = `+${(bonuses.combo * 100).toFixed(1)}%`;
    }

    // 同时更新解锁进度
    this.updateSkinProgressUI();
  }

  updateSkinProgressUI() {
    // 1. 更新主界面小图标下的进度
    const skinProgressSmall = document.querySelector('.skin-progress-small');
    const unlockedCount = this.SKINS.filter(s => s.unlocked).length;
    
    if (skinProgressSmall) {
      skinProgressSmall.textContent = `${unlockedCount}/${this.SKINS.length}`;
    }

    // 2. 更新弹窗内的状态文字 (如果弹窗已渲染)
    const statusHeader = document.querySelector('.skin-modal .skin-status-header');
    if (statusHeader) {
      statusHeader.textContent = `已解锁：${unlockedCount}/${this.SKINS.length}`;
    }

    // 3. 更新抽取按钮状态
    this.updateDrawButtonState();
  }

  updateDrawButtonState() {
    const drawBtn = document.getElementById('skin-draw-btn');
    if (!drawBtn) return;

    const COST = 500;
    const canAfford = this.currencyManager.getIngot() >= COST;
    
    if (canAfford) {
      drawBtn.classList.remove('disabled');
    } else {
      drawBtn.classList.add('disabled');
    }
  }

  openSkinModal(skinModal, ScrollController) {
    skinModal.classList.remove('hidden');
    
    this.updateSkinBonusUI(skinModal);
    this.updateDrawButtonState();
    
    const detailArea = document.getElementById('selected-skin-detail');
    if (detailArea) {
      detailArea.classList.add('hidden');
      detailArea.onclick = (e) => {
        if (e.target === detailArea) {
          detailArea.classList.add('hidden');
        }
      };
      const detailCard = detailArea.querySelector('.detail-card');
      if (detailCard) {
        detailCard.onclick = (e) => e.stopPropagation();
      }
    }
    
    this.renderSkinList(skinModal);
    
    const scrollView = skinModal.querySelector('.pet-scroll-view');
    const scrollContent = skinModal.querySelector('.skin-grid');
    
    if (!this.skinScrollController && scrollView && scrollContent) {
      this.skinScrollController = new ScrollController({
        container: scrollView,
        content: scrollContent
      });
    }
    
    requestAnimationFrame(() => {
      if (this.skinScrollController) this.skinScrollController.updateBounds();
    });
  }

  renderSkinList(skinModal) {
    const skinGrid = skinModal.querySelector('.skin-grid');
    if (!skinGrid) return;

    const html = this.SKINS.map((skin, index) => {
      const isCurrent = skin.name === this.currentSkin;
      const isViewing = skin.name === (this.viewingSkinName || this.currentSkin);
      const gradeClass = `grade-${skin.grade.toLowerCase()}`;
      const displayName = skin.unlocked ? skin.name : '???';
      const displayIcon = skin.unlocked ? skin.name : '?';
      const circleClass = skin.unlocked ? 'blue' : 'gray';
      
      return `
        <div class="skin-item ${isCurrent ? 'active' : ''} ${isViewing ? 'viewing' : ''} ${skin.unlocked ? '' : 'locked'}" data-skin="${skin.name}">
          <div class="skin-card ${gradeClass}">
            <div class="skin-pet-icon">
              <div class="pet-icon-circle ${circleClass}">${displayIcon}</div>
            </div>
            <div class="skin-grade-badge">${skin.grade}级</div>
            <div class="skin-no">No.${index + 1}</div>
            ${isCurrent ? '<div class="skin-equipped-badge">已穿戴</div>' : ''}
          </div>
          <div class="skin-name">${displayName}</div>
        </div>
      `;
    }).join('');

    skinGrid.innerHTML = html;

    this.updateSkinProgressUI();

    skinGrid.querySelectorAll('.skin-item').forEach(item => {
      item.addEventListener('click', () => {
        this.audioManager.playClick();
        const skinName = item.dataset.skin;
        this.viewingSkinName = skinName;
        this.renderSkinDetail(skinName);
        this.renderSkinList(skinModal);

        const skin = this.SKINS.find(s => s.name === skinName);
        if (skin && skin.unlocked) {
          this.changePetSkin(skinName, skinModal);
        }
      });
    });
  }

  renderSkinDetail(skinName) {
    const detailArea = document.getElementById('selected-skin-detail');
    if (!detailArea) return;

    const skin = this.SKINS.find(s => s.name === skinName);
    if (!skin) {
      detailArea.classList.add('hidden');
      return;
    }

    detailArea.classList.remove('hidden');

    const iconCircle = detailArea.querySelector('.pet-icon-circle');
    const nameEl = detailArea.querySelector('.detail-name');
    const gradeBadge = detailArea.querySelector('.detail-grade-badge');
    const descEl = detailArea.querySelector('.detail-desc');

    if (skin.unlocked) {
      iconCircle.textContent = skin.name;
      iconCircle.className = 'pet-icon-circle blue';
      nameEl.textContent = skin.name;
      descEl.textContent = `该皮肤已解锁，属性加成已永久生效`;
    } else {
      iconCircle.textContent = '?';
      iconCircle.className = 'pet-icon-circle gray';
      nameEl.textContent = '未解锁';
      descEl.textContent = `解锁后可获得下方属性加成`;
    }

    gradeBadge.textContent = `${skin.grade}级`;
    gradeBadge.className = `detail-grade-badge grade-${skin.grade.toLowerCase()}`;

    const bonusItems = detailArea.querySelectorAll('.detail-bonus-grid .bonus-item .bonus-val');
    if (bonusItems.length >= 6) {
      const b = skin.bonuses;
      bonusItems[0].textContent = `+${(b.hp * 0.5).toFixed(1)}%`;
      bonusItems[1].textContent = `+${(b.atk * 0.3).toFixed(1)}%`;
      bonusItems[2].textContent = `+${(b.critRate * 0.5).toFixed(1)}%`;
      bonusItems[3].textContent = `+${(b.critDmg * 1).toFixed(1)}%`;
      bonusItems[4].textContent = `+${(b.dodge * 0.3).toFixed(1)}%`;
      bonusItems[5].textContent = `+${(b.combo * 0.2).toFixed(1)}%`;
    }
  }

  changePetSkin(skinName, skinModal) {
    if (this.currentSkin === skinName) return;
    
    this.currentSkin = skinName;
    window.currentSkin = skinName;
    
    if (window.petUIRenderer) {
      window.petUIRenderer.render();
    }
    
    this.renderSkinList(skinModal);
    console.log(`已切换至皮肤: ${skinName}`);
  }

  unlockRandomSkin(grade, skinModal) {
    const possibleSkins = this.SKINS.filter(s => s.grade === grade.toUpperCase());
    if (possibleSkins.length === 0) return { success: false };

    const randomIndex = Math.floor(Math.random() * possibleSkins.length);
    const selectedSkin = possibleSkins[randomIndex];

    let isNew = false;
    let rewardLingfu = 0;

    if (!selectedSkin.unlocked) {
      selectedSkin.unlocked = true;
      isNew = true;
      this.updateSkinProgressUI();
    } else {
      const points = GameConfig.SKIN_GRADE_POINTS[selectedSkin.grade] || 0;
      rewardLingfu = points * 100;
      this.currencyManager.addLingfu(rewardLingfu);
    }

    if (skinModal && !skinModal.classList.contains('hidden')) {
      this.viewingSkinName = selectedSkin.name;
      this.renderSkinDetail(this.viewingSkinName);
      this.renderSkinList(skinModal);
      this.updateSkinBonusUI(skinModal);
    }

    return { success: true, skin: selectedSkin, isNew, rewardLingfu };
  }

  drawSkin(skinModal, showFeedback) {
    this.audioManager.playClick();
    const COST = 500;
    if (!this.currencyManager.spendIngot(COST)) {
      showFeedback(false, '元宝不足！');
      return;
    }

    const rand = Math.random() * 100;
    let grade = 'C';
    if (rand < 0.5) {
      grade = 'S';
    } else if (rand < 5.0) {
      grade = 'A';
    } else if (rand < 30.0) {
      grade = 'B';
    } else {
      grade = 'C';
    }

    const result = this.unlockRandomSkin(grade, skinModal);
    if (result.success) {
      const { skin, isNew, rewardLingfu } = result;
      let message = '';
      if (isNew) {
        message = `抽中 ${grade}级皮肤：${skin.name}！`;
      } else {
        message = `抽中重复皮肤 ${skin.name}，转化为 ${rewardLingfu} 灵符`;
      }
      showFeedback(true, message);
    }
  }
}
