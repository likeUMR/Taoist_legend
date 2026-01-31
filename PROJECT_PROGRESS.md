# 项目开发进度报告

本项目是一个基于“逻辑与显示分离”原则开发的网页挂机游戏《Taoist Legend Game》。

## 功能进度概览

以下是主界面各功能按钮的开发状态分析（更新日期：2026-01-30）。

### 1. 核心系统 (已完成 UI + 逻辑)

| 功能名称 | 界面位置 | UI 状态 | 逻辑状态 | 核心逻辑文件 |
| :--- | :--- | :--- | :--- | :--- |
| **资源显示** | 顶部栏 | 已实现金币、元宝、灵符显示 | 已实现数值同步与格式化 | [CurrencyManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/CurrencyManager.js) |
| **关卡系统** | 顶部进度 | 已实现层级显示与再次挑战按钮 | 已实现关卡加载、掉落、失败重试 | [LevelManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/LevelManager.js) |
| **战宠系统** | 底部导航-战宠 | 完整的滚动列表、强化/解锁界面 | 已实现战宠属性计算、强化、解锁、出战 | [PetManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/PetManager.js) |
| **修炼系统** | 底部导航-修炼 | 完整的滚动列表、数值对比界面 | 已实现各项全局属性永久提升逻辑 | [CultivationManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/CultivationManager.js) |
| **光环系统** | 底部导航-光环 | 完整的滚动列表、强化界面 | 已实现针对战宠的被动加成逻辑 | [AuraManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/AuraManager.js) |
| **任务系统** | 底部卷轴 | 动态卷轴动画、奖励显示 | 已实现击杀、强化、关卡等多种任务类型 | [TaskManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/TaskManager.js) |
| **挂机奖励** | 左侧-挂机 | 完整的关卡选择、收益计算、领取界面 | 已实现离线收益计算、视频翻倍领取 | [AFKManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/AFKManager.js) |
| **在线奖励** | 左侧-在线 | 时间进度条、奖励领取列表 | 已实现基于在线时间的阶梯奖励逻辑 | [OnlineRewardManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/OnlineRewardManager.js) |
| **添加桌面** | 左侧-添加 | 引导弹窗 | 已实现桌面入口检测与奖励逻辑 | [AddDesktopManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/AddDesktopManager.js) |
| **战斗加速** | 右侧-加速 | 数值对比弹窗、角标等级显示 | 已实现全局时间缩放控制 | [StatManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/StatManager.js) |
| **金币加成** | 右侧-金币 | 数值对比弹窗、角标等级显示 | 已实现金币获取乘法系数控制 | [StatManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/StatManager.js) |
| **设置** | 顶部-设置 | 开关列表 | 已实现基本的开关交互逻辑 | [main.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/main.js) |
| **守护沙城** | 左侧-剧情 | 已实现剧情弹窗 | 已完成基于关卡的剧情切换 | [StoryManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/StoryManager.js) |
| **补充法力** | 右侧-法力 | 已实现确认弹窗 | 已对接看广告回满逻辑 | [StatManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/StatManager.js) |
| **技能系统** | 底部导航-技能 | 完整的滚动列表、强化界面 | 已实现技能解锁、等级提升逻辑，且已经实现技能效果和特效 | [SkillManager.js](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/src/logic/SkillManager.js) |
| **自动出击** | 右侧-自动 | 已实现确认弹窗 | **已对接** | 20min内自动部署战宠 |
| **战斗特效** | 战斗区 | 基础战斗数字 | 需要增加更丰富的打击感和技能特效 |
| **试炼** | 底部导航-试炼 | 已实现基础弹窗外壳 | 已实现试炼-奖励逻辑 | 尚未开发具体的冒险关卡内容 |

### 2. 半成品功能 (仅有 UI 外壳)

| 功能名称 | 界面位置 | UI 状态 | 逻辑状态 | 说明 |
| :--- | :--- | :--- | :--- | :--- |


### 3. 待开发功能 (仅有按钮或完全缺失)

| 功能名称 | 界面位置 | 状态 | 计划 |
| :--- | :--- | :--- | :--- |
| **神器** | 左侧 | 仅有按钮，无 ID，无事件 | 需要设计神器系统及相关数值加成 |


---

## 项目结构说明

项目严格遵循**逻辑与显示分离**原则：
- `src/logic/`: 纯逻辑类（Manager/Engine），不涉及 DOM 操作。
- `src/display/`: 渲染器类（Renderer），负责将逻辑层数据映射到 DOM。
- `main.js`: 负责各模块的初始化与事件绑定。

## 持久化状态
关于存档与本地存储的详细情况，请参阅 [STORAGE_STATUS.md](file:///d:/PROJECT/VSCode/AI+Game/Taoist_Legend_Game/STORAGE_STATUS.md)。
