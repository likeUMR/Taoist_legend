# Taoist Legend Game 持久化状态说明文档

本文档详细记录了当前项目中各项数据的持久化（本地存储）现状，以便于后续开发完善存档系统。

## 1. 已实现持久化的数据 (LocalStorage)

以下模块已实现了 `localStorage` 的读写逻辑，页面刷新后数据可恢复：

| 模块名称 | 存储键名 | 存储内容 | 核心文件 |
| :--- | :--- | :--- | :--- |
| **货币资源** | `taoist_currency_data` | 金币、元宝、灵符、神兽精华、最后恢复时间 | `CurrencyManager.js` |
| **战宠养成** | `taoist_pet_data` | 已拥有的战宠 ID 及其当前等级 | `PetCollection.js` |
| **修炼系统** | `taoist_cultivation_data` | 各项修炼（金币产出、攻击加成等）的等级 | `CultivationManager.js` |
| **光环系统** | `taoist_aura_data` | 各项光环的解锁与等级状态 | `AuraManager.js` |
| **技能系统** | `taoist_skill_data` | 已学习的主动技能及其等级 | `SkillManager.js` |
| **全局加成** | `taoist_stat_data` | 战斗倍速等级、金币加成等级、自动出击状态 | `StatManager.js` |
| **试炼进度** | `taoist_trial_progress` | 各项试炼（强运、神速、聚灵）的通关最高层数 | `TrialManager.js` |
| **广告管理** | `taoist_video_data` | 每日各项广告剩余次数、最后重置时间 | `VideoRewardManager.js` |
| **剧情系统** | `taoist_legend_story_state` | 当前进行的剧情索引 (Index) | `StoryManager.js` |
| **在线奖励** | `taoist_online_reward_data` | 当前领奖阶梯、已领奖状态、本次登录开始时间 | `OnlineRewardManager.js` |
| **挂机系统** | `taoist_afk_data` | 上次领取奖励的时间戳 | `AFKManager.js` |
| **添加桌面** | `taoist_desktop_reward_claimed` | 是否已领取过“添加桌面”奖励 (Boolean) | `AddDesktopManager.js` |
| **引导系统** | `taoist_tutorial_strike_done` | 是否完成道士点击引导 | `main.js` |
| **引导系统** | `taoist_tutorial_settings_done` | 是否完成设置/教程点击引导 | `main.js` |
| **普通关卡** | `taoist_level_progress` | 当前挑战的关卡层数 | `LevelManager.js` |
| **任务系统** | `taoist_task_progress` | 当前任务索引、最高关卡记录、累计强化次数 | `TaskManager.js` |

---

## 2. 尚未实现持久化的数据 (重置为初始值)

以下模块的数据目前仅保存在内存中，**页面刷新后会全部重置**：

### 2.1 战斗实时状态 (Real-time Combat)
- **当前法力值 (Mana)**：刷新后重置为满值。
- **生命值 (HP)**：刷新后重置为满值。
- **技能 CD 与持续时间**：刷新后重置。

---

## 3. 持久化开关 (测试专用)

为了方便测试，项目中引入了全局配置开关。你可以通过修改以下文件来控制是否读取本地存档：

- **配置文件**：[GameConfig.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/GameConfig.js)
- **开关变量**：`USE_PERSISTENCE`
  - `true` (默认)：正常读写本地存储。
  - `false`：刷新页面后不读取任何本地数据，始终从初始状态开始。

> **注意**：即使设置为 `false`，游戏在运行过程中依然会尝试向 `localStorage` 写入数据（为了保持逻辑完整），但由于读取功能被禁用，这些数据在下一次刷新时将不会被加载。

---

## 4. 下一步建议 (存档系统规划)

为了提供完整的游戏体验，建议优先实现以下数据的持久化：

1.  **普通关卡与任务同步**：这是目前最明显的体验断层，玩家刷新页面后需要重新从第 0 层开始打，且任务进度丢失。
2.  **自动存档触发器**：
    - 关卡胜利后立即保存关卡进度。
    - 任务领取奖励后立即保存任务索引。
3.  **数据版本控制**：随着开发进行，存储格式可能会变化，建议在 `taoist_currency_data` 等键中加入 `version` 字段以便平滑升级。

---
*更新日期：2026-01-31*
