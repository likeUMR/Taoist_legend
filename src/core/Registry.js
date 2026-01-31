/**
 * 全局实例注册表 (Registry)
 * 用于统一管理 Manager、Renderer 等实例，减少对 window 全局对象的直接依赖。
 */
export class Registry {
  static instances = new Map();

  /**
   * 注册一个实例
   * @param {string} name 实例名称
   * @param {any} instance 实例对象
   */
  static register(name, instance) {
    this.instances.set(name, instance);
    // 为了向下兼容，暂时保留挂载到 window 的逻辑，后续逐步清理
    window[name] = instance;
    console.log(`[Registry] Registered: ${name}`);
  }

  /**
   * 获取一个实例
   * @param {string} name 实例名称
   * @returns {any}
   */
  static get(name) {
    return this.instances.get(name);
  }

  /**
   * 移除一个实例
   * @param {string} name 实例名称
   */
  static unregister(name) {
    this.instances.delete(name);
    if (window[name]) {
      delete window[name];
    }
  }
}
