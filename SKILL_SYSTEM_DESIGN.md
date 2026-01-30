# 技能系统设计文档

## 1. 概述
本文档旨在设计《道士传说》技能系统的具体实现，涵盖主动技能的逻辑处理、特效显示以及 UI 交互。系统需遵循“逻辑与显示分离”的原则。

## 2. 逻辑架构设计

### 2.1 ActiveSkillManager (主动技能管理器)
负责管理技能的释放状态、冷却时间（CD）和法力消耗。
- **状态维护**: 记录每个技能的 CD 剩余时间。
- **释放检查**: 检查 `StatManager` 中的法力是否足够，以及技能是否处于 CD 中。
- **效果触发**: 调用对应的技能效果函数。
- **更新循环**: 在 `gameLoop` 中更新所有技能的 CD。

### 2.2 Buff/Debuff 系统 (Entity 扩展)
为了支持持续性效果（如狂暴、减伤、中毒），需要在 `Entity` 类中引入 Buff 系统。
- **Buff 数据结构**: `{ id, type, value, duration, timer, effectClass }`。
- **Entity.updateBuffs(dt)**: 每帧更新 Buff 计时器，过期自动移除。
- **属性计算修正**: `atk` 和 `speed` 的获取将考虑 Buff 的乘算加成。

### 2.3 具体技能逻辑实现
1.  **群体狂暴 (Group Rage)**:
    - 为所有存活战宠添加 `RageBuff`。
    - 修正战宠的 `atk` 和 `speed`（乘算）。
2.  **毒素注入 (Poison Injection)**:
    - 为所有存活战宠添加 `PoisonApplierBuff`。
    - 在 `Pet.update` 的攻击判定中，若有此 Buff，则为目标敌人添加 `PoisonDebuff`。
    - `PoisonDebuff`: 永久持续，每秒触发一次伤害。更高伤害的毒素会覆盖低伤害毒素。
3.  **天降甘霖 (Heavenly Rain)**:
    - 瞬发逻辑。遍历 `petManager.pets`，按百分比恢复生命值。
4.  **神圣战甲 (Divine Armor)**:
    - 为所有存活战宠添加 `ShieldBuff`。
    - 修改 `Entity.takeDamage` 逻辑，若存在 `ShieldBuff`，按比例减免伤害。

## 3. 视觉与 UI 设计

### 2.4 PassiveSkillManager (被动技能管理器)
负责处理战宠攻击时触发的概率性技能。
- **触发时机**: 钩入 `Pet.attack()` 逻辑。每次普攻有 20% 概率触发已解锁的被动技能。
- **技能池管理**: 遍历已学习的被动技能，若触发成功，根据技能类型执行对应效果。
- **伤害计算**:
    - `伤害 = 战宠基础攻击力 * (技能强度 - 1) * 技能倍率`。
    - 倍率参考：践踏(x3)、风球(x4)、火雨(x1)、冰刺(x1)。

### 2.5 被动技能逻辑细节
1.  **战争践踏 (War Stomp)**:
    - 以战宠坐标为圆心，搜索半径 `R` 内的所有敌人。
    - 对所有命中目标应用瞬时伤害。
2.  **飓风之息 (Hurricane Breath)**:
    - 创建一个“穿透型飞行物”对象。
    - 飞行物具有位移逻辑，每帧检测碰撞，但不消失，直到超出边界。
    - 同一飞行物对同一敌人仅造成一次伤害。
3.  **流星火雨 (Meteor Rain)**:
    - 触发: 攻击时 20% 概率。
    - 效果: 以宠物为中心，随机在周围落下 3 颗陨石。
    - 伤害: 陨石落地造成半径 50 的 AOE 伤害，倍率 x1。
4.  **蚀骨冰刺 (Ice Spike)**:
    - 以战宠面向为中轴，计算 60 度扇形区域。
    - 判定区域内的敌人并施加伤害。

## 3. 视觉与 UI 设计

### 3.1 技能位状态 (UI Feedback)
... (保持原有内容)

### 3.2 战斗特效显示 (In-game VFX)
- **主动技能特效**: 
    - (原有内容...)
- **被动技能特效 (瞬时/实体)**:
    - **战争践踏**: 战宠脚下出现向外扩散的圆形震荡波（CSS `scale` + `opacity` 动画）。
    - **飓风之息**: 生成一个旋转的淡蓝色半透明风球（DOM 元素，带旋转和位移动画）。
    - **流星火雨**: 屏幕上方落下火球（DOM），落地产生火光爆炸。
    - **蚀骨冰刺**: 战宠前方出现半透明的蓝色冰晶扇形遮罩。

## 4. 模块职责划分
- **StatManager**: 提供/扣除法力值。
- **SkillManager**: 提供技能的等级和强度系数。
- **ActiveSkillManager**: 核心控制流。
- **PassiveSkillManager**: 监听攻击事件并触发效果。
- **CombatEngine**: 提供实体搜索接口（如 `findEntitiesInRadius`, `findEntitiesInSector`）。
- **DOMRenderer**: 负责创建瞬时特效 DOM（如风球、火球、震荡波）。

## 5. 开发计划
1. 修改 `Entity.js` 支持 Buff。
2. 编写 `ActiveSkillManager.js`。
3. 更新 `index.html` 和 `style.css`。
4. 在 `main.js` 中集成点击事件和更新循环。
