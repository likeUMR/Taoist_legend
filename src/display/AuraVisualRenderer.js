/**
 * 光环视觉渲染器：负责在主界面渲染道士和战宠的光环特效
 */
export class AuraVisualRenderer {
  constructor(auraManager) {
    this.auraManager = auraManager;
    this.meditatorAuraContainer = null;
    
    // 光环类型与 CSS 类名的映射
    this.auraColorMap = {
      '攻速光环': 'aura-atk-speed',
      '加血光环': 'aura-hp',
      '增伤光环': 'aura-damage',
      '闪避光环': 'aura-dodge',
      '双攻光环': 'aura-double-atk',
      '免伤光环': 'aura-reduction'
    };

    this.init();
  }

  /**
   * 初始化：创建大光环容器
   */
  init() {
    const meditationWrap = document.querySelector('.meditation-wrap');
    if (meditationWrap) {
      // 如果已存在则不再创建
      let container = meditationWrap.querySelector('.aura-container-large');
      if (!container) {
        this.meditatorAuraContainer = document.createElement('div');
        this.meditatorAuraContainer.className = 'aura-container-large';
        meditationWrap.appendChild(this.meditatorAuraContainer);
      } else {
        this.meditatorAuraContainer = container;
      }
    }
  }

  /**
   * 刷新所有光环显示
   * 包含道士脚下的大光环和战斗区域战宠身上的小光环
   */
  refresh() {
    const auraData = this.auraManager.getAuraListData();
    this.activeAuras = auraData.filter(a => a.level > 0);

    this.updateMeditatorAuras();
    this.updatePetAuras();
  }

  /**
   * 更新道士（主角）的光环
   */
  updateMeditatorAuras() {
    if (!this.meditatorAuraContainer || !this.activeAuras) return;

    // 清空现有大光环
    this.meditatorAuraContainer.innerHTML = '';

    // 为每个激活的光环创建一个圆圈
    this.activeAuras.forEach((aura, index) => {
      const auraEl = document.createElement('div');
      const colorClass = this.auraColorMap[aura.name] || '';
      auraEl.className = `aura-large ${colorClass}`;
      
      // 嵌套效果：内圈半径变为80% (130->104)，间隔变为70% (30->21)
      const size = 104 + index * 21; 
      auraEl.style.width = `${size}px`;
      auraEl.style.height = `${size}px`;
      
      // 稍微错开动画时间，看起来更灵动
      auraEl.style.animationDelay = `${index * 0.5}s`;
      
      this.meditatorAuraContainer.appendChild(auraEl);
    });
  }

  /**
   * 更新战斗区域所有战宠的光环
   */
  updatePetAuras() {
    if (!this.activeAuras) return;

    // 找到战斗区域的所有战宠 DOM (由 DOMRenderer 生成，带有 combat-entity 和 player 类)
    const combatPets = document.querySelectorAll('.combat-entity.player');
    
    combatPets.forEach(pet => {
      // 如果战宠已经阵亡或隐藏，跳过
      if (pet.style.display === 'none') return;

      // 确保战宠有小光环容器
      let container = pet.querySelector('.aura-container-small');
      
      // 如果容器已存在且内容数量匹配，说明不需要重新渲染（简单优化）
      if (container && container.childElementCount === this.activeAuras.length) {
        return;
      }

      if (!container) {
        container = document.createElement('div');
        container.className = 'aura-container-small';
        pet.appendChild(container);
      }

      // 清空并重新渲染小光环
      container.innerHTML = '';
      this.activeAuras.forEach((aura, index) => {
        const auraEl = document.createElement('div');
        const colorClass = this.auraColorMap[aura.name] || '';
        auraEl.className = `aura-small ${colorClass}`;
        
        // 嵌套效果：使用 width/height 代替 scale，避免与 aura-pulse 动画冲突
        // 初始大小约 50px，嵌套间隔 3px 
        const size = 50 + index * 3;
        auraEl.style.width = `${size}px`;
        auraEl.style.height = `${size}px`;
        auraEl.style.animationDelay = `${index * 0.3}s`;
        
        container.appendChild(auraEl);
      });
    });
  }
}
