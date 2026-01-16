/**
 * 技能管理类：负责技能的加载、等级管理和升级逻辑
 * 实现方法参考 PetCollection.js，支持金币升级和广告升级
 */
export class SkillManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    this.ownedSkills = []; // Array of { baseName, level }
    this.upgradeConfigs = new Map(); // originalKey -> Map(level -> config)
    this.skillMetadata = new Map(); // baseName -> { type, originalKey }
  }

  /**
   * 初始化：从 upgrades.csv 加载技能数据
   */
  async init() {
    try {
      const response = await fetch('/data/upgrades.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [system, level, attr, atkMult, hpMult, costGold, costStamina, rate, isBreak] = line.split(',');

        // 匹配格式: 名字-类型(主动|被动)技能_v1
        // 例如: 天降甘霖-防御主动技能_v1, 战争践踏-伤害被动技能_v1
        const skillMatch = system.match(/^(.+)-.*(主动技能|被动技能)_v1$/);
        if (skillMatch) {
          const originalKey = system;
          const baseName = skillMatch[1];
          const type = skillMatch[2]; // "主动技能" 或 "被动技能"

          if (!this.upgradeConfigs.has(originalKey)) {
            this.upgradeConfigs.set(originalKey, new Map());
            this.skillMetadata.set(baseName, { type, originalKey });
            
            // 默认拥有所有技能，从 0 级开始
            if (!this.ownedSkills.some(s => s.baseName === baseName)) {
              this.ownedSkills.push({ baseName, level: 0 });
            }
          }

          this.upgradeConfigs.get(originalKey).set(parseInt(level), {
            attr: parseFloat(attr),
            costGold: parseFloat(costGold),
            successRate: parseFloat(rate) / 100,
            isBreakthrough: isBreak.toLowerCase() === 'true'
          });
        }
      }

      // 手动添加 3 个被动技能，复用“战争践踏”的配置数据
      const warStompMeta = this.skillMetadata.get('战争践踏');
      if (warStompMeta) {
        const extraPassives = ['飓风之息', '流星火雨', '蚀骨冰刺'];
        extraPassives.forEach(name => {
          if (!this.skillMetadata.has(name)) {
            this.skillMetadata.set(name, { 
              type: '被动技能', 
              originalKey: warStompMeta.originalKey 
            });
            this.ownedSkills.push({ baseName: name, level: 0 });
          }
        });
      }

      console.log(`【系统】技能系统初始化完成，共加载 ${this.skillMetadata.size} 个技能`);
    } catch (err) {
      console.error('【系统】加载技能升级数据失败:', err);
    }
  }

  /**
   * 获取用于 UI 列表渲染的数据
   */
  getSkillListData() {
    const currentGold = this.currencyManager ? this.currencyManager.gold : 0;

    return this.ownedSkills.map(state => {
      const meta = this.skillMetadata.get(state.baseName);
      const configs = this.upgradeConfigs.get(meta.originalKey);
      
      const currentLevel = state.level;
      const nextLevel = currentLevel + 1;
      
      const currentCfg = configs.get(currentLevel) || { attr: 1 };
      const nextCfg = configs.get(nextLevel);

      return {
        baseName: state.baseName,
        displayName: `${state.baseName}（${meta.type}）`,
        level: currentLevel,
        type: meta.type,
        currentAttr: currentCfg.attr,
        nextAttr: nextCfg ? nextCfg.attr : null,
        upgradeCost: nextCfg ? nextCfg.costGold : 0,
        successRate: nextCfg ? nextCfg.successRate : 0,
        hasMaxLevel: !nextCfg,
        canAfford: currentGold >= (nextCfg ? nextCfg.costGold : 0)
      };
    });
  }

  /**
   * 升级技能逻辑
   * @param {string} baseName 技能基础名称
   * @param {CurrencyManager} currencyManager 
   * @param {boolean} isFreeAd 是否为广告免费升级
   */
  upgradeSkill(baseName, currencyManager, isFreeAd = false) {
    const skillState = this.ownedSkills.find(s => s.baseName === baseName);
    if (!skillState) return { success: false, reason: "技能未找到" };

    const meta = this.skillMetadata.get(baseName);
    const configs = this.upgradeConfigs.get(meta.originalKey);
    const nextLevel = skillState.level + 1;
    const nextCfg = configs.get(nextLevel);

    if (!nextCfg) return { success: false, reason: "已达最高等级" };

    if (!isFreeAd) {
      // 检查金币
      if (!currencyManager.spendGold(nextCfg.costGold)) {
        return { success: false, reason: "金币不足" };
      }
    }

    // 广告升级 100% 成功，普通升级按成功率
    const isSuccess = isFreeAd ? true : (Math.random() <= nextCfg.successRate);

    if (isSuccess) {
      skillState.level++;
      return { success: true, newLevel: skillState.level };
    } else {
      return { success: false, reason: "升级失败" };
    }
  }
}
