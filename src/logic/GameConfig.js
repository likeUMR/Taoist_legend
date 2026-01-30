/**
 * 游戏全局配置类：用于管理测试开关和全局参数
 */
export const GameConfig = {
  // 是否启用持久化存储（读取本地存档）
  // 设置为 false 时，每次刷新页面都会从初始状态开始，不会读取 localStorage
  USE_PERSISTENCE: false,

  /**
   * 辅助方法：获取本地存储数据
   * 如果 USE_PERSISTENCE 为 false，则直接返回 null，模拟无存档状态
   */
  getStorageItem(key) {
    if (!this.USE_PERSISTENCE) return null;
    return localStorage.getItem(key);
  },

  /**
   * 辅助方法：设置本地存储数据
   * 如果 USE_PERSISTENCE 为 false，依然允许写入（为了不破坏逻辑流），
   * 但由于读取被禁止，写入的数据在刷新后不会被应用。
   */
  setStorageItem(key, value) {
    localStorage.setItem(key, value);
  }
};
