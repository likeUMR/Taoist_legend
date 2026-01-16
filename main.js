import { CombatEngine } from './src/logic/CombatEngine.js';
import { DOMRenderer } from './src/display/DOMRenderer.js';
import { EnemyManager } from './src/logic/EnemyManager.js';
import { PetManager } from './src/logic/PetManager.js';
import { LevelManager } from './src/logic/LevelManager.js';
import { CurrencyManager } from './src/logic/CurrencyManager.js';
import { PetCollection } from './src/logic/PetCollection.js';
import { PetUIRenderer } from './src/display/PetUIRenderer.js';
import { BonusUIRenderer } from './src/display/BonusUIRenderer.js';
import { SpeedUIRenderer } from './src/display/SpeedUIRenderer.js';
import { CultivationManager } from './src/logic/CultivationManager.js';
import { CultivationUIRenderer } from './src/display/CultivationUIRenderer.js';
import { VideoRewardManager } from './src/logic/VideoRewardManager.js';
import { ScrollController } from './src/logic/ScrollController.js';
import { TaskManager } from './src/logic/TaskManager.js';
import { TaskUIRenderer } from './src/display/TaskUIRenderer.js';
import { StatManager } from './src/logic/StatManager.js';
import { formatNumber } from './src/utils/format.js';

// 初始化管理器
const statManager = new StatManager();
const currencyManager = new CurrencyManager();
const videoManager = new VideoRewardManager();
const cultivationManager = new CultivationManager(currencyManager);
const petCollection = new PetCollection(cultivationManager);
const engine = new CombatEngine();
const renderer = new DOMRenderer('battle-wrap');
const enemyManager = new EnemyManager(engine);
const petManager = new PetManager(engine);
const taskManager = new TaskManager(currencyManager);
const taskRenderer = new TaskUIRenderer('.quest-scroll', taskManager);

// 链接强化成功到任务系统
petCollection.onUpgradeSuccess = () => {
  taskManager.recordUpgrade();
};

// 任务更新时触发 UI 渲染
taskManager.onUpdate = () => {
  taskRenderer.render();
};

// 暴露给全局，方便 UI 渲染器访问 (也可以通过构造函数传递，但这里为了方便直接挂在 window)
window.currencyManager = currencyManager;
window.statManager = statManager;
window.videoManager = videoManager;

// 同步初始加成状态
engine.setCombatTimeScale(statManager.combatTimeScale);
currencyManager.setGoldMultiplier(statManager.goldMultiplier);
// 精华恢复现在只使用真实时间，不再需要 setTimeScale

// --- 界面控制逻辑 ---
const petModal = document.getElementById('pet-modal');
const bonusModal = document.getElementById('bonus-modal');
const speedModal = document.getElementById('speed-modal');
const cultivationModal = document.getElementById('cultivation-modal');

const petNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(1)'); // 第一个是战宠按钮
const cultNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(4)'); // 第四个是修炼按钮
const combatSpeedBtn = document.querySelector('.col-right .buff-btn:nth-child(1)'); // 右侧第一个是加速
const goldBonusBtn = document.querySelector('.col-right .buff-btn:nth-child(2)'); // 右侧第二个是金币加成

const closePetBtn = petModal.querySelector('.close-btn');
const closeBonusBtn = bonusModal.querySelector('.close-btn');
const closeBonusActionBtn = bonusModal.querySelector('.close-action-btn');
const closeSpeedBtn = speedModal.querySelector('.close-btn');
const closeSpeedActionBtn = speedModal.querySelector('.close-action-btn');
const closeCultBtn = cultivationModal.querySelector('.close-btn');

const petModalBody = petModal.querySelector('.modal-body');
const bonusModalBody = bonusModal.querySelector('.modal-body');
const speedModalBody = speedModal.querySelector('.modal-body');
const cultModalBody = cultivationModal.querySelector('.modal-body');

const goldDisplay = document.getElementById('gold-val');

// 初始化 UI 渲染器
const petUIRenderer = new PetUIRenderer(petModalBody, petCollection);
const bonusUIRenderer = new BonusUIRenderer(bonusModalBody, statManager);
const speedUIRenderer = new SpeedUIRenderer(speedModalBody, statManager);
const cultUIRenderer = new CultivationUIRenderer(cultModalBody.querySelector('.pet-list-content'), cultivationManager);

// 获取等级角标元素
const speedLevelBadge = document.querySelector('.col-right .buff-btn:nth-child(1) .level-badge-diamond span');
const goldLevelBadge = document.querySelector('.col-right .buff-btn:nth-child(2) .level-badge-diamond span');

function updateBuffLevelUI() {
  if (speedLevelBadge) speedLevelBadge.textContent = statManager.speedLevel;
  if (goldLevelBadge) goldLevelBadge.textContent = statManager.goldBonusLevel;
}
let petScrollController = null;

// 设置金币 UI 更新回调
currencyManager.onUpdate = (val) => {
  if (goldDisplay) {
    goldDisplay.textContent = formatNumber(val, true);
  }
  // 金币变化时，如果战宠界面打开，则触发重新渲染以更新按钮状态
  if (petModal && !petModal.classList.contains('hidden')) {
    petUIRenderer.render();
  }
  // 金币变化时，如果修炼界面打开，也触发重新渲染
  if (cultivationModal && !cultivationModal.classList.contains('hidden')) {
    cultUIRenderer.render();
  }
};

// 设置精华 UI 更新回调
currencyManager.onEssenceUpdate = (current, timeToNext) => {
  petUIRenderer.updateEssence(current, currencyManager.maxEssence, timeToNext);
  
  // 精华数值变化时（不仅仅是倒计时），也需要重新判断强化/突破按钮状态
  if (currencyManager._lastEssence !== current) {
    if (petModal && !petModal.classList.contains('hidden')) {
      petUIRenderer.render();
    }
    currencyManager._lastEssence = current;
  }
};

// --- 战宠面板逻辑 ---
function openPetModal() {
  petModal.classList.remove('hidden');
  petUIRenderer.render(); // 每次打开重新渲染最新数据
  
  // 初始化精华显示
  petUIRenderer.updateEssence(
    currencyManager.essence, 
    currencyManager.maxEssence, 
    currencyManager.getTimeToNext()
  );
  
  // 初始化或更新滚动控制
  const scrollView = petModalBody.querySelector('.pet-scroll-view');
  const scrollContent = petModalBody.querySelector('.pet-list-content');
  
  if (!petScrollController) {
    petScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });
  }
  
  // 必须延迟一帧等待 DOM 渲染完成才能获取准确高度
  requestAnimationFrame(() => {
    petScrollController.updateBounds();
  });
}

function closePetModal() {
  petModal.classList.add('hidden');
}

// --- 金币加成面板逻辑 ---
function openBonusModal() {
  bonusModal.classList.remove('hidden');
  bonusUIRenderer.render();
}

function closeBonusModal() {
  bonusModal.classList.add('hidden');
}

// --- 战斗加速面板逻辑 ---
function openSpeedModal() {
  speedModal.classList.remove('hidden');
  speedUIRenderer.render();
}

function closeSpeedModal() {
  speedModal.classList.add('hidden');
}

// --- 修炼面板逻辑 ---
let cultScrollController = null;

function openCultModal() {
  cultivationModal.classList.remove('hidden');
  cultUIRenderer.render();
  
  const scrollView = cultModalBody.querySelector('.pet-scroll-view');
  const scrollContent = cultModalBody.querySelector('.pet-list-content');
  
  if (!cultScrollController) {
    cultScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });
  }
  
  requestAnimationFrame(() => {
    cultScrollController.updateBounds();
  });
}

function closeCultModal() {
  cultivationModal.classList.add('hidden');
}

// 显示强化反馈特效
function showFeedback(isSuccess) {
  const toast = document.createElement('div');
  toast.className = `feedback-toast ${isSuccess ? 'success' : 'fail'}`;
  toast.textContent = isSuccess ? '强化成功！' : '强化失败';
  document.getElementById('game-container').appendChild(toast);
  
  // 动画结束后移除
  setTimeout(() => {
    toast.remove();
  }, 600);
}

// 战宠面板内部点击事件委托 (处理强化和解锁)
petModalBody.addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  const unlockBtn = e.target.closest('.unlock-btn');

  if (upgradeBtn) {
    const petId = parseInt(upgradeBtn.dataset.id);
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
      videoManager.consumeVideo('pet');
    }
    
    const result = petCollection.upgradePet(petId, currencyManager, isAd);
    
    // 触发特效
    showFeedback(result.success);
    
    if (result.success) {
      if (result.doubleUpgraded) {
        console.log(`【系统】触发双倍强化！直接升级到等级: ${result.newLevel}`);
      }
      console.log(`强化成功！当前等级: ${result.newLevel}`);
      // 已移除立即刷新逻辑，仅在关卡切换时应用新属性
    } else {
      console.log(`强化失败: ${result.reason}`);
    }
    petUIRenderer.render(); // 重新渲染列表内容
    petScrollController.updateBounds(); // 更新滚动边界
  }

  if (unlockBtn) {
    const result = petCollection.unlockNextPet(currencyManager);
    if (result.success) {
      console.log(`解锁成功！`);
      // 已移除立即刷新逻辑
    } else {
      console.log(`解锁失败: ${result.reason}`);
    }
    petUIRenderer.render();
    petScrollController.updateBounds();
  }
});

// 金币加成面板内部点击
bonusModalBody.addEventListener('click', (e) => {
  const upgradeActionBtn = e.target.closest('.upgrade-action-btn');
  const closeActionBtn = e.target.closest('.close-action-btn');

  if (upgradeActionBtn) {
    const result = statManager.upgradeGoldBonus();
    if (result.success) {
      showFeedback(true);
      // 同步给货币管理器
      currencyManager.setGoldMultiplier(result.newMultiplier);
      bonusUIRenderer.render();
      updateBuffLevelUI(); // 更新主界面角标
    }
  }

  if (closeActionBtn) {
    closeBonusModal();
  }
});

// 战斗加速面板内部点击
speedModalBody.addEventListener('click', (e) => {
  const upgradeActionBtn = e.target.closest('.upgrade-action-btn');
  const closeActionBtn = e.target.closest('.close-action-btn');

  if (upgradeActionBtn) {
    const result = statManager.upgradeCombatSpeed();
    if (result.success) {
      showFeedback(true);
      // 同步给引擎
      engine.setCombatTimeScale(result.newScale);
      speedUIRenderer.render();
      updateBuffLevelUI(); // 更新主界面角标
    }
  }

  if (closeActionBtn) {
    closeSpeedModal();
  }
});

// 修炼面板内部点击
cultModalBody.addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  if (upgradeBtn) {
    const name = upgradeBtn.dataset.name;
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
      videoManager.consumeVideo('cultivation');
    }
    
    const result = cultivationManager.upgrade(name, isAd);
    
    showFeedback(result.success);
    if (result.success) {
      cultUIRenderer.render();
      cultScrollController.updateBounds();
    }
  }
});

// 获取主界面生命条元素
const mainHpBarFill = document.querySelector('.player-status .stat-item .fill.green');
const mainHpBarVal = document.querySelector('.player-status .stat-item .val');

// 更新主界面生命条
function updateMainHpBar() {
  if (!mainHpBarFill || !mainHpBarVal) return;
  
  const stats = petManager.getTotalHealthStats();
  mainHpBarFill.style.width = `${stats.percent}%`;
  mainHpBarVal.textContent = `${formatNumber(stats.current, true)}/${formatNumber(stats.max, true)}`;
}

// 按钮点击
if (petNavBtn) {
  petNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPetModal();
  });
}

if (cultNavBtn) {
  cultNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openCultModal();
  });
}

if (combatSpeedBtn) {
  combatSpeedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSpeedModal();
  });
}

if (goldBonusBtn) {
  goldBonusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openBonusModal();
  });
}

// 关闭按钮
if (closePetBtn) {
  closePetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePetModal();
  });
}

if (closeBonusBtn) {
  closeBonusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeBonusModal();
  });
}

if (closeSpeedBtn) {
  closeSpeedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSpeedModal();
  });
}

if (closeCultBtn) {
  closeCultBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCultModal();
  });
}

// 点击遮罩关闭
petModal.addEventListener('click', (e) => {
  if (e.target === petModal) {
    closePetModal();
  }
});

bonusModal.addEventListener('click', (e) => {
  if (e.target === bonusModal) {
    closeBonusModal();
  }
});

speedModal.addEventListener('click', (e) => {
  if (e.target === speedModal) {
    closeSpeedModal();
  }
});

cultivationModal.addEventListener('click', (e) => {
  if (e.target === cultivationModal) {
    closeCultModal();
  }
});

petModal.querySelector('.pet-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

bonusModal.querySelector('.bonus-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

speedModal.querySelector('.bonus-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

cultivationModal.querySelector('.modal-content').addEventListener('click', (e) => {
  e.stopPropagation();
});

// 链接敌人死亡掉落逻辑
enemyManager.onEnemyDeath = (enemy) => {
  // 基础掉落
  currencyManager.addGold(enemy.lootGold, true); 
  
  // 判定双倍掉落 (来自修炼系统)
  if (cultivationManager) {
    const doubleLootRate = cultivationManager.getEffect('双倍掉落') - 1;
    if (Math.random() <= doubleLootRate) {
      currencyManager.addGold(enemy.lootGold, true);
      console.log('【系统】触发双倍掉落！');
    }
  }
};

// 获取所有战宠 UI 占位符的位置
function getUIPositions() {
  const container = document.getElementById('battle-wrap');
  const containerRect = container.getBoundingClientRect();
  const petElements = document.querySelectorAll('.pet');
  
  return Array.from(petElements).map(el => {
    // 优先使用 pet-inner-ik 作为中心点参考
    const ikElement = el.querySelector('.pet-inner-ik') || el;
    const rect = ikElement.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  });
}

const petPositions = getUIPositions();

// 获取战斗区域边界并设置给管理器
function getBattleBounds() {
  const container = document.getElementById('battle-wrap');
  return {
    width: container.clientWidth,
    height: container.clientHeight
  };
}

const bounds = getBattleBounds();
enemyManager.setWorldBounds(bounds);
petManager.setWorldBounds(bounds);

// 初始化关卡管理器
const levelManager = new LevelManager({
  engine,
  renderer,
  enemyManager,
  petManager,
  petCollection,
  petPositions,
  worldBounds: bounds,
  taskManager // 注入任务管理器
});

// 初始化并启动
async function initGame() {
  await Promise.all([
    petCollection.init(),
    cultivationManager.init(), // 加载修炼数据
    taskManager.init(), // 加载任务数据
    levelManager.start()
  ]);

  currencyManager.addGold(0);
  updateBuffLevelUI(); // 初始更新加成等级
  // 初始不打开战宠界面了
  gameLoop();
}

// 游戏主循环
function gameLoop() {
  const { combatDt, rawDt } = engine.update();
  
  // 管理器状态监控更新
  enemyManager.update();
  petManager.update();
  levelManager.update(combatDt); // 关卡管理器也使用战斗倍速相关的 dt
  currencyManager.updateRecovery(rawDt); // 精华恢复使用真实 dt
  
  renderer.render(engine.entities);
  updateMainHpBar(); // 更新主界面生命条
  requestAnimationFrame(gameLoop);
}

initGame();

console.log('Taoist Legend Combat Engine with Level Manager Started');
