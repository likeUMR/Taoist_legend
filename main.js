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
import { AuraManager } from './src/logic/AuraManager.js';
import { AuraUIRenderer } from './src/display/AuraUIRenderer.js';
import { SkillManager } from './src/logic/SkillManager.js';
import { SkillUIRenderer } from './src/display/SkillUIRenderer.js';
import { VideoRewardManager } from './src/logic/VideoRewardManager.js';
import { ScrollController } from './src/logic/ScrollController.js';
import { TaskManager } from './src/logic/TaskManager.js';
import { TaskUIRenderer } from './src/display/TaskUIRenderer.js';
import { StatManager } from './src/logic/StatManager.js';
import { AFKManager } from './src/logic/AFKManager.js';
import { AFKUIRenderer } from './src/display/AFKUIRenderer.js';
import { OnlineRewardManager } from './src/logic/OnlineRewardManager.js';
import { OnlineRewardUIRenderer } from './src/display/OnlineRewardUIRenderer.js';
import { AddDesktopManager } from './src/logic/AddDesktopManager.js';
import { AddDesktopUIRenderer } from './src/display/AddDesktopUIRenderer.js';
import { formatNumber } from './src/utils/format.js';

// --- 界面控制逻辑 ---
const petModal = document.getElementById('pet-modal');
const bonusModal = document.getElementById('bonus-modal');
const speedModal = document.getElementById('speed-modal');
const cultivationModal = document.getElementById('cultivation-modal');
const auraModal = document.getElementById('aura-modal');
const skillModal = document.getElementById('skill-modal');
const afkModal = document.getElementById('afk-modal');
const desktopModal = document.getElementById('desktop-modal');
const autoStrikeModal = document.getElementById('auto-strike-modal');
const manaModal = document.getElementById('mana-modal');
const onlineModal = document.getElementById('online-modal');
const adventureModal = document.getElementById('adventure-modal');
const settingsModal = document.getElementById('settings-modal');
const storyModal = document.getElementById('story-modal');

// 初始化管理器
const statManager = new StatManager();
const currencyManager = new CurrencyManager();
const videoManager = new VideoRewardManager();
const cultivationManager = new CultivationManager(currencyManager);
const auraManager = new AuraManager(currencyManager);
const skillManager = new SkillManager(currencyManager);
const petCollection = new PetCollection(cultivationManager, auraManager);
const engine = new CombatEngine();
const renderer = new DOMRenderer('battle-wrap');
const enemyManager = new EnemyManager(engine);
const petManager = new PetManager(engine);
const taskManager = new TaskManager(currencyManager);
const taskRenderer = new TaskUIRenderer('.quest-scroll', taskManager);
const onlineRewardManager = new OnlineRewardManager(currencyManager);
const onlineRewardRenderer = new OnlineRewardUIRenderer(onlineModal.querySelector('.pet-list-content'), onlineRewardManager);

const desktopManager = new AddDesktopManager(currencyManager);
const desktopRenderer = new AddDesktopUIRenderer('#desktop-modal', desktopManager);
desktopRenderer.bindEvents();

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
window.onlineRewardManager = onlineRewardManager;

// 同步初始加成状态
engine.setCombatTimeScale(statManager.combatTimeScale);
currencyManager.setGoldMultiplier(statManager.goldMultiplier);
// 精华恢复现在只使用真实时间，不再需要 setTimeScale

const petNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(1)'); // 第一个是战宠按钮
const auraNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(2)'); // 第二个是光环按钮
const cultNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(4)'); // 第四个是修炼按钮
const skillNavBtn = document.querySelector('.nav-bar .nav-btn:nth-child(5)'); // 第五个是技能按钮
const combatSpeedBtn = document.querySelector('.col-right .buff-btn:nth-child(1)'); // 右侧第一个是加速
const goldBonusBtn = document.querySelector('.col-right .buff-btn:nth-child(2)'); // 右侧第二个是金币加成
const afkRewardBtn = document.getElementById('afk-reward-btn');
const desktopEntryBtn = document.getElementById('desktop-entry-btn');
const autoStrikeBtn = document.getElementById('auto-strike-btn');
const manaRefillBtn = document.getElementById('mana-refill-btn');
const onlineRewardBtn = document.getElementById('online-reward-btn');

const closePetBtn = petModal.querySelector('.close-btn');
const closeBonusBtn = bonusModal.querySelector('.close-btn');
const closeBonusActionBtn = bonusModal.querySelector('.close-action-btn');
const closeSpeedBtn = speedModal.querySelector('.close-btn');
const closeSpeedActionBtn = speedModal.querySelector('.close-action-btn');
const closeCultBtn = cultivationModal.querySelector('.close-btn');
const closeAuraBtn = auraModal.querySelector('.close-btn');
const closeSkillBtn = skillModal.querySelector('.close-btn');
const closeAfkBtn = afkModal.querySelector('.close-btn');
const closeDesktopBtn = desktopModal.querySelector('.close-btn');
const closeAutoStrikeBtn = autoStrikeModal.querySelector('.close-btn');
const closeAutoStrikeActionBtn = autoStrikeModal.querySelector('.close-action-btn');
const closeManaBtn = manaModal.querySelector('.close-btn');
const closeManaActionBtn = manaModal.querySelector('.close-action-btn');
const closeOnlineBtn = onlineModal.querySelector('.close-btn');
const closeAdventureBtn = adventureModal.querySelector('.close-btn');
const closeSettingsBtn = settingsModal.querySelector('.close-btn');

const petModalBody = petModal.querySelector('.modal-body');
const bonusModalBody = bonusModal.querySelector('.modal-body');
const speedModalBody = speedModal.querySelector('.modal-body');
const cultModalBody = cultivationModal.querySelector('.modal-body');
const skillModalBody = skillModal.querySelector('.modal-body');

const goldDisplay = document.getElementById('gold-val');
const ingotDisplay = document.getElementById('ingot-val');
const lingfuDisplay = document.getElementById('lingfu-val');

// 初始化 UI 渲染器
const petUIRenderer = new PetUIRenderer(petModalBody, petCollection);
const bonusUIRenderer = new BonusUIRenderer(bonusModalBody, statManager);
const speedUIRenderer = new SpeedUIRenderer(speedModalBody, statManager);
const cultUIRenderer = new CultivationUIRenderer(cultModalBody.querySelector('.pet-list-content'), cultivationManager);
const auraUIRenderer = new AuraUIRenderer(auraModal.querySelector('.modal-body'), auraManager);
const skillUIRenderer = new SkillUIRenderer(skillModalBody, skillManager);

// 获取等级角标元素
const speedLevelBadge = document.querySelector('.col-right .buff-btn:nth-child(1) .level-badge-diamond span');
const goldLevelBadge = document.querySelector('.col-right .buff-btn:nth-child(2) .level-badge-diamond span');
const adventureNavBtn = document.getElementById('adventure-nav-btn');
const settingsBtn = document.getElementById('settings-btn');
const storyBtn = document.getElementById('story-btn');

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
  // 金币变化时，如果技能界面打开，也触发重新渲染
  if (skillModal && !skillModal.classList.contains('hidden')) {
    skillUIRenderer.render();
  }
};

// 设置元宝 UI 更新回调
currencyManager.onIngotUpdate = (val) => {
  if (ingotDisplay) {
    ingotDisplay.textContent = formatNumber(val, true);
  }
};

// 设置灵符 UI 更新回调
currencyManager.onLingfuUpdate = (val) => {
  if (lingfuDisplay) {
    lingfuDisplay.textContent = formatNumber(val, true);
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

// --- 光环面板逻辑 ---
let auraScrollController = null;

function openAuraModal() {
  auraModal.classList.remove('hidden');
  auraUIRenderer.render();
  
  const scrollView = auraModal.querySelector('.pet-scroll-view');
  const scrollContent = auraModal.querySelector('.pet-list-content');
  
  if (!auraScrollController && scrollView && scrollContent) {
    auraScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });
  }
  
  requestAnimationFrame(() => {
    if (auraScrollController) auraScrollController.updateBounds();
  });
}

function closeAuraModal() {
  auraModal.classList.add('hidden');
}

// --- 技能面板逻辑 ---
let skillScrollController = null;

function openSkillModal() {
  skillModal.classList.remove('hidden');
  skillUIRenderer.render();
  
  const scrollView = skillModalBody.querySelector('.pet-scroll-view');
  const scrollContent = skillModalBody.querySelector('.pet-list-content');
  
  if (!skillScrollController && scrollView && scrollContent) {
    skillScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });
  }
  
  requestAnimationFrame(() => {
    if (skillScrollController) skillScrollController.updateBounds();
  });
}

function closeSkillModal() {
  skillModal.classList.add('hidden');
}

onlineRewardRenderer.bindEvents(onlineModal);

// --- 挂机奖励面板逻辑 ---
let afkRefreshTimer = null;

function openAfkModal() {
  afkModal.classList.remove('hidden');
  if (window.afkUIRenderer) {
    window.afkUIRenderer.initBaseStage();
    window.afkUIRenderer.render();
  }
  
  if (afkRefreshTimer) clearInterval(afkRefreshTimer);
  afkRefreshTimer = setInterval(() => {
    if (window.afkUIRenderer) window.afkUIRenderer.render();
  }, 1000);
}

function closeAfkModal() {
  afkModal.classList.add('hidden');
  if (afkRefreshTimer) {
    clearInterval(afkRefreshTimer);
    afkRefreshTimer = null;
  }
}

// --- 添加桌面奖励面板逻辑 ---
function openDesktopModal() {
  desktopModal.classList.remove('hidden');
}

function closeDesktopModal() {
  desktopModal.classList.add('hidden');
}

// --- 自动出击面板逻辑 ---
function openAutoStrikeModal() {
  autoStrikeModal.classList.remove('hidden');
}

function closeAutoStrikeModal() {
  autoStrikeModal.classList.add('hidden');
}

// --- 补充法力面板逻辑 ---
function openManaModal() {
  manaModal.classList.remove('hidden');
}

function closeManaModal() {
  manaModal.classList.add('hidden');
}

// --- 在线奖励面板逻辑 ---
let onlineScrollController = null;

function openOnlineModal() {
  onlineModal.classList.remove('hidden');
  onlineRewardRenderer.render(); // 确保打开时渲染最新数据
  
  const scrollView = onlineModal.querySelector('.pet-scroll-view');
  const scrollContent = onlineModal.querySelector('.pet-list-content');
  
  if (!onlineScrollController && scrollView && scrollContent) {
    onlineScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });
  }
  
  requestAnimationFrame(() => {
    if (onlineScrollController) onlineScrollController.updateBounds();
  });
}

function closeOnlineModal() {
  onlineModal.classList.add('hidden');
}

// --- 冒险面板逻辑 ---
let adventureScrollController = null;

function openAdventureModal() {
  adventureModal.classList.remove('hidden');
  
  const scrollView = adventureModal.querySelector('.pet-scroll-view');
  const scrollContent = adventureModal.querySelector('.pet-list-content');
  
  if (!adventureScrollController && scrollView && scrollContent) {
    adventureScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });
  }
  
  requestAnimationFrame(() => {
    if (adventureScrollController) adventureScrollController.updateBounds();
  });
}

function closeAdventureModal() {
  adventureModal.classList.add('hidden');
}

// --- 设置面板逻辑 ---
function openSettingsModal() {
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

// --- 剧情面板逻辑 ---
function openStoryModal() {
  storyModal.classList.remove('hidden');
}

function closeStoryModal() {
  storyModal.classList.add('hidden');
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

// 光环面板内部点击
auraModal.querySelector('.modal-body').addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  if (upgradeBtn) {
    const name = upgradeBtn.dataset.name;
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
      videoManager.consumeVideo('aura');
    }
    
    const result = auraManager.upgrade(name, isAd);
    
    showFeedback(result.success);
    if (result.success) {
      auraUIRenderer.render();
      if (auraScrollController) auraScrollController.updateBounds();
    }
  }
});

// 技能面板内部点击事件委托
skillModalBody.addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  if (upgradeBtn) {
    const name = upgradeBtn.dataset.name;
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
      videoManager.consumeVideo('skill');
    }
    
    const result = skillManager.upgradeSkill(name, currencyManager, isAd);
    
    showFeedback(result.success);
    if (result.success) {
      skillUIRenderer.render();
      if (skillScrollController) skillScrollController.updateBounds();
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

// 更新主界面挂机按钮时间
const afkTimeSmall = document.querySelector('.afk-time-small');
function updateAfkButton() {
  if (!window.afkManager || !afkTimeSmall) return;
  
  if (window.afkManager.isMaxed()) {
    afkTimeSmall.textContent = 'MAX';
    afkTimeSmall.classList.add('text-red'); // 可以加个变红的效果
  } else {
    const totalSeconds = window.afkManager.getAFKTimeSeconds();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let timeStr = "";
    if (hours > 0) {
      timeStr = `${hours}h${minutes}m`;
    } else {
      timeStr = `${minutes}m`;
    }
    afkTimeSmall.textContent = timeStr;
    afkTimeSmall.classList.remove('text-red');
  }
}

// 按钮点击
if (petNavBtn) {
  petNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPetModal();
  });
}

if (auraNavBtn) {
  auraNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAuraModal();
  });
}

if (cultNavBtn) {
  cultNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openCultModal();
  });
}

if (skillNavBtn) {
  skillNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSkillModal();
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

if (afkRewardBtn) {
  afkRewardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAfkModal();
  });
}

if (desktopEntryBtn) {
  desktopEntryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openDesktopModal();
  });
}

if (autoStrikeBtn) {
  autoStrikeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAutoStrikeModal();
  });
}

if (manaRefillBtn) {
  manaRefillBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openManaModal();
  });
}

if (onlineRewardBtn) {
  onlineRewardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openOnlineModal();
  });
}

if (adventureNavBtn) {
  adventureNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAdventureModal();
  });
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSettingsModal();
  });
}

if (storyBtn) {
  storyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openStoryModal();
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

if (closeAuraBtn) {
  closeAuraBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAuraModal();
  });
}

if (closeSkillBtn) {
  closeSkillBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSkillModal();
  });
}

if (closeAfkBtn) {
  closeAfkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAfkModal();
  });
}

if (closeDesktopBtn) {
  closeDesktopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeDesktopModal();
  });
}

if (closeAutoStrikeBtn) {
  closeAutoStrikeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAutoStrikeModal();
  });
}

if (closeAutoStrikeActionBtn) {
  closeAutoStrikeActionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAutoStrikeModal();
  });
}

if (closeManaBtn) {
  closeManaBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeManaModal();
  });
}

if (closeManaActionBtn) {
  closeManaActionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeManaModal();
  });
}

if (closeOnlineBtn) {
  closeOnlineBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeOnlineModal();
  });
}

if (closeAdventureBtn) {
  closeAdventureBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAdventureModal();
  });
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSettingsModal();
  });
}

const storyConfirmBtn = storyModal.querySelector('.story-confirm-btn');
if (storyConfirmBtn) {
  storyConfirmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeStoryModal();
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

auraModal.addEventListener('click', (e) => {
  if (e.target === auraModal) {
    closeAuraModal();
  }
});

skillModal.addEventListener('click', (e) => {
  if (e.target === skillModal) {
    closeSkillModal();
  }
});

afkModal.addEventListener('click', (e) => {
  if (e.target === afkModal) {
    closeAfkModal();
  }
});

desktopModal.addEventListener('click', (e) => {
  if (e.target === desktopModal) {
    closeDesktopModal();
  }
});

autoStrikeModal.addEventListener('click', (e) => {
  if (e.target === autoStrikeModal) {
    closeAutoStrikeModal();
  }
});

manaModal.addEventListener('click', (e) => {
  if (e.target === manaModal) {
    closeManaModal();
  }
});

onlineModal.addEventListener('click', (e) => {
  if (e.target === onlineModal) {
    closeOnlineModal();
  }
});

adventureModal.addEventListener('click', (e) => {
  if (e.target === adventureModal) {
    closeAdventureModal();
  }
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    closeSettingsModal();
  }
});

storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) {
    closeStoryModal();
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

auraModal.querySelector('.modal-content').addEventListener('click', (e) => {
  e.stopPropagation();
});

skillModal.querySelector('.modal-content').addEventListener('click', (e) => {
  e.stopPropagation();
});

afkModal.querySelector('.afk-panel').addEventListener('click', (e) => {
  e.stopPropagation();
  
  const leftArrow = e.target.closest('.arrow-btn.left');
  const rightArrow = e.target.closest('.arrow-btn.right');
  const stageItem = e.target.closest('.stage-item');
  const claimBtn = e.target.closest('.claim-btn');
  const doubleClaimBtn = e.target.closest('.double-claim-btn');

  if (leftArrow) {
    if (window.afkUIRenderer) window.afkUIRenderer.shiftStage('left');
  } else if (rightArrow) {
    if (window.afkUIRenderer) window.afkUIRenderer.shiftStage('right');
  } else if (stageItem && !stageItem.classList.contains('disabled')) {
    const stage = parseInt(stageItem.dataset.stage);
    if (window.afkManager) {
      window.afkManager.setSelectedStage(stage);
      window.afkUIRenderer.render();
    }
  } else if (claimBtn) {
    if (window.afkManager) {
      window.afkManager.claim(false);
      window.afkUIRenderer.render();
      showFeedback(true);
    }
  } else if (doubleClaimBtn) {
    // 预留广告接口，目前暂无广告直接领双倍
    if (window.afkManager) {
      window.afkManager.claim(true);
      window.afkUIRenderer.render();
      showFeedback(true);
    }
  }
});

desktopModal.querySelector('.desktop-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

autoStrikeModal.querySelector('.auto-strike-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

manaModal.querySelector('.mana-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

onlineModal.querySelector('.online-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

adventureModal.querySelector('.adventure-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

// 设置面板内部点击 (处理复选框切换)
settingsModal.querySelector('.modal-body').addEventListener('click', (e) => {
  const checkbox = e.target.closest('.custom-checkbox');
  if (checkbox) {
    checkbox.classList.toggle('checked');
    const settingId = checkbox.id;
    const isChecked = checkbox.classList.contains('checked');
    console.log(`【系统】设置变更: ${settingId} = ${isChecked}`);
    
    // 根据 ID 处理具体逻辑
    if (settingId === 'setting-sound') {
      // 处理音效开关
    } else if (settingId === 'setting-music') {
      // 处理音乐开关
    }
  }
});

settingsModal.querySelector('.settings-panel').addEventListener('click', (e) => {
  e.stopPropagation();
});

storyModal.querySelector('.story-panel').addEventListener('click', (e) => {
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

// 获取所有战宠 UI 占位符的位置 (数学计算版，确保中心点精准)
function getUIPositions() {
  const container = document.getElementById('battle-wrap');
  const petRingsWrap = document.querySelector('.pet-rings');
  
  if (!container || !petRingsWrap) return [];

  const containerRect = container.getBoundingClientRect();
  const ringsRect = petRingsWrap.getBoundingClientRect();

  // 计算 pet-rings 相对于 battle-wrap 的中心点
  const centerX = (ringsRect.left + ringsRect.width / 2) - containerRect.left;
  const centerY = (ringsRect.top + ringsRect.height / 2) - containerRect.top;

  const positions = [];
  const configs = [
    { radius: 80, count: 3 },  // 内圈
    { radius: 150, count: 5 }, // 中圈
    { radius: 220, count: 7 }  // 外圈
  ];

  configs.forEach(ring => {
    const startAngle = -60;
    const endAngle = 60;
    const angleStep = ring.count > 1 ? (endAngle - startAngle) / (ring.count - 1) : 0;

    for (let i = 0; i < ring.count; i++) {
      const angleDeg = startAngle + i * angleStep;
      const angleRad = angleDeg * (Math.PI / 180);

      // 根据 CSS transform 逻辑进行数学映射:
      // x = R * sin(theta)
      // y = -R * cos(theta)
      positions.push({
        x: centerX + ring.radius * Math.sin(angleRad),
        y: centerY - ring.radius * Math.cos(angleRad)
      });
    }
  });

  return positions;
}

const petPositions = getUIPositions();

// 获取战斗区域边界 (仅限敌人)
function getBattleBounds() {
  const container = document.getElementById('battle-wrap');
  return {
    width: container.clientWidth,
    height: container.clientHeight
  };
}

// 获取游戏总容器相对于战斗区域的边界 (用于战宠在全屏范围内活动)
function getGameContainerBounds() {
  const container = document.getElementById('game-container');
  const battleWrap = document.getElementById('battle-wrap');
  const containerRect = container.getBoundingClientRect();
  const battleRect = battleWrap.getBoundingClientRect();

  return {
    // 战宠坐标是相对于 battle-wrap 的
    minX: containerRect.left - battleRect.left,
    maxX: containerRect.right - battleRect.left,
    minY: containerRect.top - battleRect.top,
    maxY: containerRect.bottom - battleRect.top,
    width: containerRect.width,  // 保持兼容性
    height: containerRect.height // 保持兼容性
  };
}

const enemyBounds = getBattleBounds();
const petBounds = getGameContainerBounds();

enemyManager.setWorldBounds(enemyBounds);
petManager.setWorldBounds(petBounds);

// 初始化关卡管理器
const levelManager = new LevelManager({
  engine,
  renderer,
  enemyManager,
  petManager,
  petCollection,
  petPositions,
  worldBounds: enemyBounds, // 关卡管理器的世界边界通常指战斗区
  taskManager // 注入任务管理器
});

// 初始化并启动
async function initGame() {
  await Promise.all([
    petCollection.init(),
    cultivationManager.init(), // 加载修炼数据
    auraManager.init(), // 加载光环数据
    skillManager.init(), // 加载技能数据
    taskManager.init(), // 加载任务数据
    levelManager.start()
  ]);

  // 在关卡数据加载后初始化挂机管理器
  const afkManager = new AFKManager(currencyManager, taskManager, levelManager.levelDataMap);
  const afkUIRenderer = new AFKUIRenderer(afkModal, afkManager);
  window.afkManager = afkManager; // 暴露给全局或事件监听器
  window.afkUIRenderer = afkUIRenderer;

  currencyManager.addGold(0);
  currencyManager.addIngot(0);
  currencyManager.addLingfu(0);
  updateBuffLevelUI(); // 初始更新加成等级
  // 初始不打开战宠界面了
  gameLoop();
}

// 游戏主循环
let lastAfkUpdateTime = 0;
function gameLoop() {
  const { combatDt, rawDt } = engine.update();
  
  // 管理器状态监控更新
  enemyManager.update();
  petManager.update();
  levelManager.update(combatDt); // 关卡管理器也使用战斗倍速相关的 dt
  currencyManager.updateRecovery(rawDt); // 精华恢复使用真实 dt
  onlineRewardManager.update(rawDt); // 在线奖励使用真实 dt
  
  const now = Date.now();
  if (now - lastAfkUpdateTime >= 1000) {
    updateAfkButton();
    lastAfkUpdateTime = now;
  }
  
  renderer.render(engine.entities);
  updateMainHpBar(); // 更新主界面生命条
  requestAnimationFrame(gameLoop);
}

initGame();

console.log('Taoist Legend Combat Engine with Level Manager Started');
