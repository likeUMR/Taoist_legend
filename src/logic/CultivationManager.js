/**
 * 修炼管理类：负责加载 upgrades.csv 中“加点-”开头的配置并管理进度
 */
export class CultivationManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    this.upgrades = new Map(); // name -> [levelData]
    this.currentLevels = new Map(); // name -> level
    this.isLoaded = false;
    
    // 描述映射 (根据图片信息补全)
    this.descriptions = {
      '金币产出': '增加金币获取数量',
      '强化成功率': '增加强化的成功率',
      '体力上限': '增加挖矿体力上限',
      '强化消耗': '减少强化消耗的金币数量',
      '离线奖励': '增加离线收益时长和倍率',
      '全队攻击': '增加所有战宠的攻击力',
      '全队生命': '增加所有战宠的生命值',
      '双倍强化': '强化成功时有几率额外提升一级',
      '双倍掉落': '击败敌人时有几率掉落双倍金币',
      '金币消耗': '减少战宠强化所需的金币'
    };
  }

  async init() {
    try {
      const response = await fetch('/data/upgrades.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [system, level, value, atkM, hpM, costGold, costStamina, success, isBreak] = line.split(',');
        
        if (system.startsWith('加点-')) {
          // 提取核心名称，例如 "加点-金币产出_v1" -> "金币产出"
          const cleanName = system.replace('加点-', '').split('_')[0];
          
          if (!this.upgrades.has(cleanName)) {
            this.upgrades.set(cleanName, []);
            this.currentLevels.set(cleanName, 0);
          }
          
          this.upgrades.get(cleanName).push({
            level: parseInt(level),
            value: parseFloat(value),
            costGold: parseFloat(costGold) || 0
          });
        }
      }
      
      this.isLoaded = true;
      
      // 初始化被动金币加成
      if (this.upgrades.has('金币产出')) {
        const level = this.currentLevels.get('金币产出');
        const data = this.upgrades.get('金币产出').find(d => d.level === level);
        if (data) {
          this.currencyManager.setPassiveGoldMultiplier(data.value);
        }
      }

      console.log(`【系统】成功加载修炼数据: ${this.upgrades.size} 个项目`);
    } catch (err) {
      console.error('【系统】加载修炼数据失败:', err);
    }
  }

  /**
   * 获取所有修炼项的当前状态
   */
  getUpgradeList() {
    const list = [];
    for (const [name, data] of this.upgrades.entries()) {
      const currentLevel = this.currentLevels.get(name);
      const currentData = data.find(d => d.level === currentLevel) || data[0];
      const nextData = data.find(d => d.level === currentLevel + 1);
      
      list.push({
        name,
        description: this.descriptions[name] || '提升相关属性',
        level: currentLevel,
        currentValue: currentData.value,
        nextValue: nextData ? nextData.value : null,
        cost: nextData ? nextData.costGold : null,
        isMax: !nextData
      });
    }
    return list;
  }

  /**
   * 获取某个项目的当前生效值 (AttributeValue)
   * @param {string} name 
   * @returns {number}
   */
  getEffect(name) {
    if (!this.isLoaded) return 1.0;
    const data = this.upgrades.get(name);
    if (!data) return 1.0;
    const level = this.currentLevels.get(name) || 0;
    const levelData = data.find(d => d.level === level);
    return levelData ? levelData.value : 1.0;
  }

  /**
   * 升级某个项目
   * @param {string} name 
   * @param {boolean} isFreeAd 是否使用免费广告升级
   */
  upgrade(name, isFreeAd = false) {
    if (!this.isLoaded) return { success: false, reason: "数据未加载" };
    
    const currentLevel = this.currentLevels.get(name);
    const data = this.upgrades.get(name);
    const nextData = data.find(d => d.level === currentLevel + 1);
    
    if (!nextData) return { success: false, reason: "已达到最高等级" };
    
    if (isFreeAd || this.currencyManager.spendGold(nextData.costGold)) {
      this.currentLevels.set(name, currentLevel + 1);
      
      // 如果升级的是金币产出，立即同步给货币管理器
      if (name === '金币产出') {
        this.currencyManager.setPassiveGoldMultiplier(nextData.value);
      }
      
      return { success: true, newLevel: currentLevel + 1 };
    } else {
      return { success: false, reason: "金币不足" };
    }
  }
}
