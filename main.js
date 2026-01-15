import { CombatEngine } from './src/logic/CombatEngine.js';
import { DOMRenderer } from './src/display/DOMRenderer.js';
import { EnemyManager } from './src/logic/EnemyManager.js';
import { PetManager } from './src/logic/PetManager.js';
import { LevelManager } from './src/logic/LevelManager.js';
import { CurrencyManager } from './src/logic/CurrencyManager.js';
import { PetCollection } from './src/logic/PetCollection.js';
import { PetUIRenderer } from './src/display/PetUIRenderer.js';
import { ScrollController } from './src/logic/ScrollController.js';
import { TaskManager } from './src/logic/TaskManager.js';
import { TaskUIRenderer } from './src/display/TaskUIRenderer.js';
import { formatNumber } from './src/utils/format.js';

// 初始化核心引擎和渲染器
const engine = new CombatEngine();
const renderer = new DOMRenderer('battle-wrap');

// 初始化管理器
const enemyManager = new EnemyManager(engine);
const petManager = new PetManager(engine);
const currencyManager = new CurrencyManager();
const petCollection = new PetCollection();
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

// --- 界面控制逻辑 ---
const petModal = document.getElementById('pet-modal');
const petNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(1)'); // 第一个是战宠按钮
const closeBtn = petModal.querySelector('.close-btn');
const modalBody = petModal.querySelector('.modal-body');
const goldDisplay = document.getElementById('gold-val');

// 初始化战宠 UI 渲染器
const petUIRenderer = new PetUIRenderer(modalBody, petCollection);
let petScrollController = null;

// 设置金币 UI 更新回调
currencyManager.onUpdate = (val) => {
  if (goldDisplay) {
    goldDisplay.textContent = Math.floor(val).toLocaleString();
  }
  // 金币变化时，如果战宠界面打开，则触发重新渲染以更新按钮状态
  if (petModal && !petModal.classList.contains('hidden')) {
    petUIRenderer.render();
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
  const scrollView = modalBody.querySelector('.pet-scroll-view');
  const scrollContent = modalBody.querySelector('.pet-list-content');
  
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
modalBody.addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  const unlockBtn = e.target.closest('.unlock-btn');

  if (upgradeBtn) {
    const petId = parseInt(upgradeBtn.dataset.id);
    const result = petCollection.upgradePet(petId, currencyManager);
    
    // 触发特效
    showFeedback(result.success);
    
    if (result.success) {
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

// 获取主界面生命条元素
const mainHpBarFill = document.querySelector('.player-status .stat-item .fill.green');
const mainHpBarVal = document.querySelector('.player-status .stat-item .val');

// 更新主界面生命条
function updateMainHpBar() {
  if (!mainHpBarFill || !mainHpBarVal) return;
  
  const stats = petManager.getTotalHealthStats();
  mainHpBarFill.style.width = `${stats.percent}%`;
  mainHpBarVal.textContent = `${formatNumber(stats.current)}/${formatNumber(stats.max)}`;
}

// 按钮点击
if (petNavBtn) {
  petNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPetModal();
  });
}

// 关闭按钮
if (closeBtn) {
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePetModal();
  });
}

// 点击遮罩关闭
petModal.addEventListener('click', (e) => {
  if (e.target === petModal) {
    closePetModal();
  }
});

petModal.querySelector('.pet-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

// 链接敌人死亡掉落逻辑
enemyManager.onEnemyDeath = (enemy) => {
  currencyManager.addGold(enemy.lootGold);
};

// 获取所有战宠 UI 占位符的位置
function getUIPositions() {
  const container = document.getElementById('battle-wrap');
  const containerRect = container.getBoundingClientRect();
  const petElements = document.querySelectorAll('.pet');
  
  return Array.from(petElements).map(el => {
    const rect = el.getBoundingClientRect();
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
    taskManager.init(), // 加载任务数据
    levelManager.start()
  ]);

  currencyManager.addGold(0);
  // 初始不打开战宠界面了
  gameLoop();
}

// 游戏主循环
function gameLoop() {
  engine.update();
  
  // 管理器状态监控更新
  enemyManager.update();
  petManager.update();
  levelManager.update();
  currencyManager.updateRecovery(); // 更新精华恢复逻辑
  
  renderer.render(engine.entities);
  updateMainHpBar(); // 更新主界面生命条
  requestAnimationFrame(gameLoop);
}

initGame();

console.log('Taoist Legend Combat Engine with Level Manager Started');
