# Taoist Legend main.js 重构计划 (Refactor Plan)

## **核心原则 (Core Principle)**
**本次重构仅涉及逻辑的移动与拆分，严格遵循以下原则：**
1. **完全复制**：所有逻辑代码从 `main.js` 复制到目标模块，不做任何逻辑修改。
2. **不增删改**：不增加新功能，不删除现有逻辑，不修改运行逻辑（仅调整引用路径）。
3. **逻辑与显示分离**：进一步明确 Manager（逻辑）与 Renderer/UI（显示）的界限。
4. **增量开发**：分阶段执行，每个阶段只拆分一个模块，确保每步可回溯。

---

## **拆分模块分配映射表 (Code Mapping)**

| 目标模块 | `main.js` 对应行范围 | 主要功能职责 |
| :--- | :--- | :--- |
| **SkinManager.js** | L39 - L121, L678 - L938 | 皮肤数据定义、加成计算、皮肤列表/详情渲染、抽取逻辑。 |
| **Registry.js** | L141 - L196 | 全局实例注册表，管理所有 Manager 实例。 |
| **UIManager.js** | L123 - L138, L223 - L556, L1039 - L1673 | DOM 选取、弹窗控制、主界面 UI 更新、点击事件委托。 |
| **GameInitializer.js** | L140 - L197, L1823 - L1940 | 实例初始化顺序、依赖注入、异步加载、教程/开始界面逻辑。 |
| **GameLoop.js** | L1965 - L2013, L1675 - L1696 | 主循环更新、各管理器 update 调用、核心事件监听。 |

---

## **分阶段执行计划 (Phased Implementation)**

### **阶段 1: 提取皮肤逻辑 - SkinManager.js**
*   **迁移内容**：
    *   `SKIN_NAMES`, `SKINS` 数据及 `calculateSkinBonuses` 等计算函数。
    *   `openSkinModal`, `renderSkinList`, `drawSkin` 等 UI 交互逻辑。
*   **目标位置**：`src/logic/SkinManager.js`
*   **预期结果**：`main.js` 减少约 350 行。

### **阶段 2: 建立注册中心 - Registry.js**
*   **迁移内容**：
    *   将 `window.currencyManager` 等全局挂载点统一改为注册到 `Registry` 类。
*   **目标位置**：`src/core/Registry.js`
*   **预期结果**：实现各模块间的解耦，消除对 `window` 的直接依赖。

### **阶段 3: 提取 UI 总管 - UIManager.js**
*   **迁移内容**：
    *   所有弹窗的 DOM 定义、开关逻辑。
    *   主界面血条、法力条、倒计时等 UI 更新逻辑。
    *   L1483 开始的所有点击事件监听与分发（Event Delegation）。
*   **目标位置**：`src/display/UIManager.js`
*   **预期结果**：`main.js` 减少约 1000 行，UI 逻辑高度内聚。

### **阶段 4: 提取启动器 - GameInitializer.js**
*   **迁移内容**：
    *   `initGame` 函数及内部的 `Promise.all` 加载逻辑。
    *   管理器之间的依赖绑定代码。
*   **目标位置**：`src/core/GameInitializer.js`
*   **预期结果**：启动流程清晰，`main.js` 入口仅负责调用。

### **阶段 5: 提取心脏循环 - GameLoop.js**
*   **迁移内容**：
    *   `gameLoop` 函数及其包含的每帧更新逻辑。
    *   `enemyManager.onEnemyDeath` 等核心事件处理。
*   **目标位置**：`src/core/GameLoop.js`
*   **预期结果**：`main.js` 缩减至 20 行以内，仅作为引导程序。

---

## **验证标准 (Verification)**
1. **功能对齐**：重构后游戏的战斗、强化、抽取、奖励领取等功能必须与重构前完全一致。
2. **无报错**：控制台无 ReferenceError 或路径引用错误。
3. **性能一致**：主循环帧率保持稳定。
