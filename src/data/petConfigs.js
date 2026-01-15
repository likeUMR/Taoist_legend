/**
 * 战宠静态配置数据
 * 为了测试：数值提升均为 1，消耗均为 1
 */
export const PET_CONFIGS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `战宠 No.${i + 1}`,
  baseAtk: 5,
  baseHp: 20,
  atkGrowth: 1,
  hpGrowth: 1,
  unlockCost: 1,
  description: `第 ${i + 1} 号战宠，忠诚的战斗伙伴。`
}));

/**
 * 强化消耗与成功率计算
 */
export const getUpgradeInfo = (level) => {
  return {
    cost: 1, // 测试用固定为 1
    successRate: 0.5 // 测试用 50% 成功
  };
};
