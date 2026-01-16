/**
 * 光环管理类：从配置表加载以“光环_v1”结尾的项，管理其等级和升级
 */
export class AuraManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    this.auras = new Map(); // name -> { levels: [], currentLevel: 0 }
    this.auraNames = []; // 存储所有发现的光环名称 (不带 _v1 后缀)
  }

  /**
   * 初始化：加载升级配置表
   */
  async init() {
    try {
      const response = await fetch('/data/upgrades.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [system, level, value, atkM, hpM, costGold, costStamina, rate, isBreak] = line.split(',');
        
        // 匹配以“光环_v1”结尾的系统名
        if (system.endsWith('光环_v1')) {
          const cleanName = system.replace('_v1', '');
          
          if (!this.auras.has(cleanName)) {
            this.auras.set(cleanName, {
              levels: [],
              currentLevel: 0
            });
            this.auraNames.push(cleanName);
          }
          
          this.auras.get(cleanName).levels.push({
            level: parseInt(level),
            value: parseFloat(value),
            costGold: parseFloat(costGold),
            costStamina: parseFloat(costStamina),
            successRate: parseFloat(rate) / 100,
            isBreakthrough: isBreak.toLowerCase() === 'true'
          });
        }
      }
      console.log(`【系统】光环管理器初始化完成，共加载 ${this.auraNames.length} 种光环`);
    } catch (err) {
      console.error('【系统】加载光环数据失败:', err);
    }
  }

  /**
   * 获取所有光环的列表显示数据
   */
  getAuraListData() {
    const list = [];
    for (const name of this.auraNames) {
      const data = this.auras.get(name);
      const currentLevel = data.currentLevel;
      const currentData = data.levels.find(d => d.level === currentLevel) || data.levels[0];
      const nextData = data.levels.find(d => d.level === currentLevel + 1);

      list.push({
        name: name,
        level: currentLevel,
        currentValue: currentData ? currentData.value : 1.0,
        nextValue: nextData ? nextData.value : null,
        upgradeCost: nextData ? Math.floor(nextData.costGold) : 0,
        successRate: nextData ? nextData.successRate : 0,
        isBreakthrough: nextData ? nextData.isBreakthrough : false,
        hasMaxLevel: !nextData
      });
    }
    return list;
  }

  /**
   * 获取指定名称光环的当前加成值
   * @param {string} name 不带 _v1 的名称，如 "增伤光环"
   * @returns {number} 加成倍率 (如 1.15 代表 15% 增益)
   */
  getModifier(name) {
    const aura = this.auras.get(name);
    if (!aura) return 1.0;
    const currentData = aura.levels.find(d => d.level === aura.currentLevel);
    return currentData ? currentData.value : 1.0;
  }

  /**
   * 升级光环
   */
  upgrade(name, isFreeAd = false) {
    const aura = this.auras.get(name);
    if (!aura) return { success: false, reason: "光环不存在" };

    const nextLevel = aura.currentLevel + 1;
    const nextData = aura.levels.find(d => d.level === nextLevel);
    if (!nextData) return { success: false, reason: "已达最高等级" };

    // 消耗检查
    if (!isFreeAd) {
      if (nextData.costGold > 0) {
        if (!this.currencyManager.spendGold(nextData.costGold)) {
          return { success: false, reason: "金币不足" };
        }
      }
      // 注意：目前先不处理体力/精华消耗，只处理金币
    }

    // 概率判定 (如果是广告升级，强制 100% 成功)
    const isSuccess = isFreeAd ? true : (Math.random() <= nextData.successRate);

    if (isSuccess) {
      aura.currentLevel++;
      return { success: true, newLevel: aura.currentLevel };
    } else {
      return { success: false, reason: "强化失败" };
    }
  }
}
