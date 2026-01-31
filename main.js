import { ActiveSkillManager } from './src/logic/ActiveSkillManager.js';
import { PassiveSkillManager } from './src/logic/PassiveSkillManager.js';
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
import { TrialManager } from './src/logic/TrialManager.js';
import { TrialUIRenderer } from './src/display/TrialUIRenderer.js';
import { StatManager } from './src/logic/StatManager.js';
import { AFKManager } from './src/logic/AFKManager.js';
import { AFKUIRenderer } from './src/display/AFKUIRenderer.js';
import { OnlineRewardManager } from './src/logic/OnlineRewardManager.js';
import { OnlineRewardUIRenderer } from './src/display/OnlineRewardUIRenderer.js';
import { AddDesktopManager } from './src/logic/AddDesktopManager.js';
import { AddDesktopUIRenderer } from './src/display/AddDesktopUIRenderer.js';
import { StoryManager } from './src/logic/StoryManager.js';
import { StoryUIRenderer } from './src/display/StoryUIRenderer.js';
import { formatNumber } from './src/utils/format.js';
import { AuraVisualRenderer } from './src/display/AuraVisualRenderer.js';
import { audioManager } from './src/utils/AudioManager.js';
import { GameConfig } from './src/logic/GameConfig.js';
import { SkinManager } from './src/logic/SkinManager.js';
import { Registry } from './src/core/Registry.js';

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
const skinModal = document.getElementById('skin-modal');
const tutorialModal = document.getElementById('tutorial-modal');

// 初始化管理器
const currencyManager = new CurrencyManager();
const videoManager = new VideoRewardManager();
const skinManager = new SkinManager(currencyManager, audioManager);
const cultivationManager = new CultivationManager(currencyManager);
const auraManager = new AuraManager(currencyManager);
const skillManager = new SkillManager(currencyManager);
const trialManager = new TrialManager({ levelManager: null, currencyManager }); // 先传 null，后面关联
const statManager = new StatManager(trialManager);
const petCollection = new PetCollection(cultivationManager, auraManager, trialManager);
const engine = new CombatEngine();
const renderer = new DOMRenderer('battle-wrap');
const enemyManager = new EnemyManager(engine);
const petManager = new PetManager(engine);
const activeSkillManager = new ActiveSkillManager(skillManager, statManager, petManager);
const passiveSkillManager = new PassiveSkillManager(skillManager, engine, renderer);

// 注册到 Registry
Registry.register('currencyManager', currencyManager);
Registry.register('videoManager', videoManager);
Registry.register('skinManager', skinManager);
Registry.register('cultivationManager', cultivationManager);
Registry.register('auraManager', auraManager);
Registry.register('skillManager', skillManager);
Registry.register('trialManager', trialManager);
Registry.register('statManager', statManager);
Registry.register('petCollection', petCollection);
Registry.register('engine', engine);
Registry.register('renderer', renderer);
Registry.register('enemyManager', enemyManager);
Registry.register('petManager', petManager);
Registry.register('activeSkillManager', activeSkillManager);
Registry.register('passiveSkillManager', passiveSkillManager);
Registry.register('audioManager', audioManager);

const taskManager = new TaskManager(currencyManager);
Registry.register('taskManager', taskManager);
const taskRenderer = new TaskUIRenderer('.quest-scroll', taskManager);
const onlineRewardManager = new OnlineRewardManager(currencyManager);
Registry.register('onlineRewardManager', onlineRewardManager);
const onlineRewardRenderer = new OnlineRewardUIRenderer(onlineModal.querySelector('.pet-list-content'), onlineRewardManager);

// 覆写在线奖励渲染器的更新逻辑，增加拖拽保护
onlineRewardManager.onUpdate = () => {
  // 如果弹窗没打开，不渲染
  if (onlineModal.classList.contains('hidden')) return;
  
  // 如果正在拖拽，不渲染，避免 DOM 刷新导致拖拽中断
  if (onlineScrollController && onlineScrollController.isDragging) return;
  
  onlineRewardRenderer.render();
};

const storyManager = new StoryManager(petCollection);
Registry.register('storyManager', storyManager);
const storyUIRenderer = new StoryUIRenderer('story-modal', storyManager);

const desktopManager = new AddDesktopManager(currencyManager);
Registry.register('desktopManager', desktopManager);
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

// 初始化流程 (此处逻辑已移至文件末尾的 initGame)

// 处理页面可见性变化，失去焦点时暂停音频
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    audioManager.suspend();
  } else {
    audioManager.resume();
  }
});

// 处理窗口失去/获得焦点
window.addEventListener('blur', () => {
  audioManager.suspend();
});

window.addEventListener('focus', () => {
  audioManager.resume();
});

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
const skinEntryBtn = document.getElementById('skin-entry-btn');

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
const closeSkinBtn = skinModal.querySelector('.close-btn');
const closeTutorialBtn = tutorialModal.querySelector('.close-btn');

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
Registry.register('petUIRenderer', petUIRenderer);
const bonusUIRenderer = new BonusUIRenderer(bonusModalBody, statManager);
Registry.register('bonusUIRenderer', bonusUIRenderer);
const speedUIRenderer = new SpeedUIRenderer(speedModalBody, statManager);
Registry.register('speedUIRenderer', speedUIRenderer);
const cultUIRenderer = new CultivationUIRenderer(cultModalBody.querySelector('.pet-list-content'), cultivationManager);
Registry.register('cultUIRenderer', cultUIRenderer);
const auraUIRenderer = new AuraUIRenderer(auraModal.querySelector('.modal-body'), auraManager);
Registry.register('auraUIRenderer', auraUIRenderer);
const skillUIRenderer = new SkillUIRenderer(skillModalBody, skillManager);
Registry.register('skillUIRenderer', skillUIRenderer);
const auraVisualRenderer = new AuraVisualRenderer(auraManager);
Registry.register('auraVisualRenderer', auraVisualRenderer);

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
  // 联动更新皮肤抽取按钮状态
  if (typeof skinManager !== 'undefined') {
    skinManager.updateDrawButtonState();
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

// 自动出击按钮逻辑 (弹窗内部)
if (autoStrikeModal) {
  const upgradeBtn = autoStrikeModal.querySelector('.upgrade-action-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      audioManager.playClick();
      statManager.activateAutoStrike();
      showFeedback(true);
      closeAutoStrikeModal();
      updateBuffLevelUI(); // 更新主界面角标
    });
  }
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

/**
 * 让主界面对应的技能图标闪烁一下
 * @param {string} skillName 
 */
function flashSkillIcon(skillName) {
   const slot = document.querySelector(`.skill-slot[data-skill="${skillName}"]`);
   if (!slot) return;
 
   const flashClass = 'vfx-ui-skill-flash';
   slot.classList.add(flashClass);
  
  const onEnd = () => {
    slot.classList.remove(flashClass);
    slot.removeEventListener('animationend', onEnd);
  };
  slot.addEventListener('animationend', onEnd);
}

// 导出给逻辑层使用
window.flashSkillIcon = flashSkillIcon;

// --- 试炼面板逻辑 ---
let adventureScrollController = null;

function openAdventureModal() {
  adventureModal.classList.remove('hidden');
  
  // 渲染试炼列表
  if (trialUIRenderer) {
    trialUIRenderer.render();
  }

  // 默认显示第一个分页 (强运试炼)
  const tabs = adventureModal.querySelectorAll('.adv-tab');
  const pages = adventureModal.querySelectorAll('.trial-page');
  
  // 初始化或重置到第一个标签
  tabs.forEach((tab, index) => {
    if (index === 0) tab.classList.add('active');
    else tab.classList.remove('active');
  });
  pages.forEach((page, index) => {
    if (index === 0) page.classList.remove('hidden');
    else page.classList.add('hidden');
  });

  const activePage = adventureModal.querySelector('.trial-page:not(.hidden)');
  const scrollView = activePage.querySelector('.pet-scroll-view');
  const scrollContent = activePage.querySelector('.pet-list-content');
  
  if (adventureScrollController) {
    adventureScrollController.destroy();
  }

  adventureScrollController = new ScrollController({
    container: scrollView,
    content: scrollContent
  });
  
  requestAnimationFrame(() => {
    if (adventureScrollController) adventureScrollController.updateBounds();
  });
}

function closeAdventureModal() {
  adventureModal.classList.add('hidden');
  if (adventureScrollController) {
    adventureScrollController.destroy();
    adventureScrollController = null;
  }
}

// 试炼分页切换事件
const adventureTabs = adventureModal.querySelector('.adventure-tabs');
if (adventureTabs) {
  adventureTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.adv-tab');
    if (!tab) return;

    audioManager.playClick();
    const targetId = tab.dataset.target;
    const targetPage = document.getElementById(targetId);
    if (!targetPage) return;

    // 切换标签状态
    adventureModal.querySelectorAll('.adv-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // 切换页面显示
    adventureModal.querySelectorAll('.trial-page').forEach(p => p.classList.add('hidden'));
    targetPage.classList.remove('hidden');

    // 重新初始化滚动
    if (adventureScrollController) {
      adventureScrollController.destroy();
    }

    const scrollView = targetPage.querySelector('.pet-scroll-view');
    const scrollContent = targetPage.querySelector('.pet-list-content');
    
    adventureScrollController = new ScrollController({
      container: scrollView,
      content: scrollContent
    });

    requestAnimationFrame(() => {
      adventureScrollController.updateBounds();
    });
  });
}

// --- 设置面板逻辑 ---
function openSettingsModal() {
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

// --- 皮肤面板逻辑 ---
function openSkinModal() {
  skinManager.openSkinModal(skinModal, ScrollController);
}

function closeSkinModal() {
  skinManager.skinModal = skinModal; // 保持引用一致性（如果需要）
  skinModal.classList.add('hidden');
}

// --- 教程面板逻辑 ---
function openTutorialModal() {
  tutorialModal.classList.remove('hidden');
}

function closeTutorialModal() {
  tutorialModal.classList.add('hidden');
}

// 抽取皮肤逻辑
function drawSkin() {
  skinManager.drawSkin(skinModal, showFeedback);
}

// 暴露给外部
window.calculateSkinBonuses = () => skinManager.calculateSkinBonuses();
window.unlockRandomSkin = (grade) => skinManager.unlockRandomSkin(grade, skinModal);

// --- 主循环与更新 ---
function openStoryModal() {
  storyModal.classList.remove('hidden');
  if (storyUIRenderer) {
    storyUIRenderer.render();
  }
}

function closeStoryModal() {
  storyModal.classList.add('hidden');
}

// 显示强化反馈特效
function showFeedback(isSuccess, customMessage = null) {
  const toast = document.createElement('div');
  toast.className = `feedback-toast ${isSuccess ? 'success' : 'fail'}`;
  toast.textContent = customMessage || (isSuccess ? '强化成功！' : '强化失败');
  document.getElementById('game-container').appendChild(toast);
  
  // 播放对应的音效
  if (isSuccess) {
    audioManager.playUpgradeSuccess();
  } else {
    audioManager.playUpgradeFailure();
  }
  
  // 动画结束后移除
  setTimeout(() => {
    toast.remove();
  }, 600);
}

// 战宠面板内部点击事件委托 (处理强化和解锁)
petModalBody.addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  const unlockBtn = e.target.closest('.unlock-btn');
  const essenceAdBtn = e.target.closest('.essence-ad-btn');

  if (essenceAdBtn) {
    audioManager.playClick();
    if (videoManager.consumeVideo('essence')) {
      currencyManager.refillEssence();
      console.log('【系统】观看视频成功，神兽精华已回满');
    }
    return;
  }

  if (upgradeBtn) {
    audioManager.playClick();
    const petId = parseInt(upgradeBtn.dataset.id);
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
        // 再次检查限制逻辑，防止 UI 渲染漏洞或手动篡改
        const petData = petCollection.getPet(id);
        if (petData && !videoManager.isUpgradeAllowed(petData.upgradeCost)) {
          console.error('【系统】升级费用过高，暂时无法通过视频升级');
          return;
        }
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
    audioManager.playClick();
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

// 皮肤面板内部逻辑
if (skinModal) {
  const skinDrawBtn = skinModal.querySelector('#skin-draw-btn');
  if (skinDrawBtn) {
    skinDrawBtn.addEventListener('click', () => {
      drawSkin();
    });
  }
}

// 主动技能点击处理
const activeSkillSlots = document.querySelectorAll('.skill-slot.active-skill');
activeSkillSlots.forEach(slot => {
      slot.addEventListener('click', () => {
        audioManager.playClick();
        const skillName = slot.dataset.skill;
        const result = activeSkillManager.useSkill(skillName);
        if (result.success) {
          updateMainManaBar(); // 扣减法力后立即更新 UI
        } else {
          console.log(`【技能】释放失败: ${result.reason}`);
        }
      });
    });

/**
 * 更新主界面技能 UI 状态 (主动 + 被动)
 */
function updateSkillsUI() {
  // 1. 处理主动技能
  const activeSkillSlots = document.querySelectorAll('.skill-slot.active-skill');
  activeSkillSlots.forEach(slot => {
    const skillName = slot.dataset.skill;
    const uiState = activeSkillManager.getSkillUIState(skillName);
    if (!uiState) return;

    // 未学习的技能隐藏 (占位)
    const level = activeSkillManager.getSkillLevel(skillName);
    slot.style.visibility = level <= 0 ? 'hidden' : 'visible';

    // 更新可用状态 (金色或灰色)
    slot.classList.toggle('usable', uiState.isUsable);
    // 更新激活状态 (呼吸灯或发光特效)
    slot.classList.toggle('active', uiState.isActive);

    // 更新 CD 遮罩
    const cdOverlay = slot.querySelector('.cd-overlay');
    if (cdOverlay) {
      cdOverlay.style.height = `${uiState.cdPercent * 100}%`;
    }
  });

  // 2. 处理被动技能
  const passiveSkillSlots = document.querySelectorAll('.skill-slot.passive-skill');
  passiveSkillSlots.forEach(slot => {
    const skillName = slot.dataset.skill;
    const level = passiveSkillManager.getSkillLevel(skillName);
    
    // 0 级隐藏但占位
    slot.style.visibility = level <= 0 ? 'hidden' : 'visible';
    
    // 被动技能始终保持灰色背景，只有在触发时通过 flashSkillIcon 闪烁金色
    slot.classList.remove('usable');
  });
}

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
    audioManager.playClick();
    const name = upgradeBtn.dataset.name;
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
        // 再次检查限制逻辑
        const item = cultivationManager.getUpgradeList().find(i => i.name === name);
        if (item && !videoManager.isUpgradeAllowed(item.cost)) {
          console.error('【系统】升级费用过高，暂时无法通过视频升级');
          return;
        }
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
const auraModalBody = auraModal ? auraModal.querySelector('.modal-body') : null;
if (auraModalBody) {
  auraModalBody.addEventListener('click', (e) => {
    const upgradeBtn = e.target.closest('.upgrade-btn');
    if (upgradeBtn) {
      audioManager.playClick();
      const name = upgradeBtn.dataset.name;
      const isAd = upgradeBtn.dataset.ad === 'true';
      
      if (isAd) {
        // 再次检查限制逻辑
        const item = auraManager.getAuraListData().find(i => i.name === name);
        if (item && !videoManager.isUpgradeAllowed(item.upgradeCost)) {
          console.error('【系统】升级费用过高，暂时无法通过视频升级');
          return;
        }
        videoManager.consumeVideo('aura');
      }
      
      const result = auraManager.upgrade(name, isAd);
      
      showFeedback(result.success);
      if (result.success) {
        auraUIRenderer.render();
        auraVisualRenderer.refresh(); // 升级成功后刷新光环视觉特效
        if (auraScrollController) auraScrollController.updateBounds();
      }
    }
  });
}

// 技能面板内部点击事件委托
skillModalBody.addEventListener('click', (e) => {
  const upgradeBtn = e.target.closest('.upgrade-btn');
  if (upgradeBtn) {
    audioManager.playClick();
    const name = upgradeBtn.dataset.name;
    const isAd = upgradeBtn.dataset.ad === 'true';
    
    if (isAd) {
      // 再次检查限制逻辑
      const skill = skillManager.getSkillListData().find(s => s.baseName === name);
      if (skill && !videoManager.isUpgradeAllowed(skill.upgradeCost)) {
        console.error('【系统】升级费用过高，暂时无法通过视频升级');
        return;
      }
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

// 补充法力面板内部点击
const manaModalBody = manaModal ? manaModal.querySelector('.modal-body') : null;
if (manaModalBody) {
  manaModalBody.addEventListener('click', (e) => {
    const upgradeActionBtn = e.target.closest('.upgrade-action-btn');
    if (upgradeActionBtn) {
      audioManager.playClick();
      // 模拟看广告逻辑
      videoManager.consumeVideo('mana');
      
      const result = statManager.refillMana();
      if (result.success) {
        showFeedback(true);
        updateMainManaBar();
        closeManaModal();
      }
    }
  });
}

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

// 获取主界面法力条元素
const mainManaBarFill = document.querySelector('.player-status .stat-item:nth-child(2) .fill.blue');
const mainManaBarVal = document.querySelector('.player-status .stat-item:nth-child(2) .val');

// 更新主界面法力条
function updateMainManaBar() {
  if (!mainManaBarFill || !mainManaBarVal || !statManager) return;
  
  const percent = (statManager.mana / statManager.maxMana) * 100;
  mainManaBarFill.style.width = `${percent}%`;
  mainManaBarVal.textContent = `${statManager.mana.toFixed(1)}/${statManager.maxMana.toFixed(1)}`;
}

// 更新主界面皮肤进度
function updateSkinProgressUI() {
  skinManager.updateSkinProgressUI();
}

// 更新主界面挂机按钮时间
const afkTimeSmall = document.querySelector('.afk-time-small');
const autoStrikeTimeSmall = document.querySelector('.auto-strike-time-small');
const autoStrikeModalTimer = document.querySelector('.auto-strike-modal-timer');
const autoStrikeUpgradeBtn = document.querySelector('#auto-strike-modal .upgrade-action-btn');
const autoStrikeHint = document.querySelector('#auto-strike-modal .highlight-hint');
const autoStrikeDuration = document.querySelector('#auto-strike-modal .duration-text');

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

// 更新主界面自动出击按钮倒计时
function updateAutoStrikeButton() {
  if (!statManager || !autoStrikeTimeSmall) return;
  
  const isActive = statManager.isAutoStrikeActive();
  const totalSeconds = Math.ceil(statManager.autoStrikeTimer);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // 1. 更新主界面小按钮
  if (isActive) {
    autoStrikeTimeSmall.textContent = timeStr;
    autoStrikeTimeSmall.classList.remove('hidden');
    autoStrikeTimeSmall.classList.add('text-red');
  } else {
    autoStrikeTimeSmall.classList.add('hidden');
  }

  // 2. 更新弹窗内容 (如果弹窗打开中)
  if (autoStrikeModal && !autoStrikeModal.classList.contains('hidden')) {
    if (isActive) {
      if (autoStrikeModalTimer) {
        autoStrikeModalTimer.textContent = `剩余时间: ${timeStr}`;
        autoStrikeModalTimer.classList.remove('hidden');
      }
      if (autoStrikeUpgradeBtn) autoStrikeUpgradeBtn.classList.add('hidden');
      if (autoStrikeHint) autoStrikeHint.classList.add('hidden');
      if (autoStrikeDuration) autoStrikeDuration.classList.add('hidden');
    } else {
      if (autoStrikeModalTimer) autoStrikeModalTimer.classList.add('hidden');
      if (autoStrikeUpgradeBtn) autoStrikeUpgradeBtn.classList.remove('hidden');
      if (autoStrikeHint) autoStrikeHint.classList.remove('hidden');
      if (autoStrikeDuration) autoStrikeDuration.classList.remove('hidden');
    }
  }
}

// 更新主界面在线奖励按钮倒计时
const onlineTimeSmall = document.querySelector('.online-time-small');

function updateOnlineRewardButton() {
  if (!onlineRewardManager || !onlineTimeSmall) return;

  const nextIndex = onlineRewardManager.rewardsConfig.findIndex((_, i) => !onlineRewardManager.isClaimed(i));
  
  if (nextIndex === -1) {
    onlineTimeSmall.textContent = '已领完';
    onlineTimeSmall.classList.remove('text-red');
    return;
  }

  if (onlineRewardManager.canClaim(nextIndex)) {
    onlineTimeSmall.textContent = '可领取';
    onlineTimeSmall.classList.add('text-red');
    return;
  }

  const reward = onlineRewardManager.rewardsConfig[nextIndex];
  const targetSeconds = reward.minutes * 60;
  const remainingSeconds = Math.max(0, Math.ceil(targetSeconds - onlineRewardManager.onlineTime));

  let timeStr = "";
  if (remainingSeconds >= 60) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    timeStr = `${minutes}m${seconds}s`;
  } else {
    timeStr = `${remainingSeconds}s`;
  }

  onlineTimeSmall.textContent = timeStr;
  onlineTimeSmall.classList.remove('text-red');
}

// 按钮点击
if (petNavBtn) {
  petNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openPetModal();
  });
}

if (auraNavBtn) {
  auraNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openAuraModal();
  });
}

if (cultNavBtn) {
  cultNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openCultModal();
  });
}

if (skillNavBtn) {
  skillNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openSkillModal();
  });
}

if (combatSpeedBtn) {
  combatSpeedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openSpeedModal();
  });
}

if (goldBonusBtn) {
  goldBonusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openBonusModal();
  });
}

if (afkRewardBtn) {
  afkRewardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openAfkModal();
  });
}

if (desktopEntryBtn) {
  desktopEntryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openDesktopModal();
  });
}

if (autoStrikeBtn) {
  autoStrikeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openAutoStrikeModal();
  });
}

if (manaRefillBtn) {
  manaRefillBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openManaModal();
  });
}

if (onlineRewardBtn) {
  onlineRewardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openOnlineModal();
  });
}

if (skinEntryBtn) {
  skinEntryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openSkinModal();
  });
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openSettingsModal();

    // 更新广告观看次数统计
    const totalAdCountSpan = document.getElementById('total-ad-count');
    if (totalAdCountSpan && videoManager) {
      totalAdCountSpan.textContent = videoManager.getTotalWatched();
    }

    // 如果设置引导还在显示，点击后移除
    if (settingsTutorialContainer) {
      settingsTutorialContainer.remove();
      settingsTutorialContainer = null;
      GameConfig.setStorageItem('taoist_tutorial_settings_done', 'true');
    }
  });
}

if (adventureNavBtn) {
  adventureNavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openAdventureModal();
  });
}

// --- 统一面板交互逻辑 (关闭与阻止冒泡) ---
const modalConfigs = [
  { modal: petModal, panel: '.pet-panel', closer: closePetModal },
  { modal: bonusModal, panel: '.bonus-panel', closer: closeBonusModal },
  { modal: speedModal, panel: '.bonus-panel', closer: closeSpeedModal },
  { modal: cultivationModal, panel: '.modal-content', closer: closeCultModal },
  { modal: auraModal, panel: '.modal-content', closer: closeAuraModal },
  { modal: skillModal, panel: '.modal-content', closer: closeSkillModal },
  { modal: afkModal, panel: '.afk-panel', closer: closeAfkModal },
  { modal: desktopModal, panel: '.desktop-panel', closer: closeDesktopModal },
  { modal: autoStrikeModal, panel: '.auto-strike-panel', closer: closeAutoStrikeModal },
  { modal: manaModal, panel: '.mana-panel', closer: closeManaModal },
  { modal: onlineModal, panel: '.online-panel', closer: closeOnlineModal },
  { modal: adventureModal, panel: '.adventure-panel', closer: closeAdventureModal },
  { modal: settingsModal, panel: '.settings-panel', closer: closeSettingsModal },
  { modal: storyModal, panel: '.story-panel', closer: closeStoryModal },
  { modal: skinModal, panel: '.skin-panel', closer: closeSkinModal },
  { modal: tutorialModal, panel: '.tutorial-panel', closer: closeTutorialModal }
];

modalConfigs.forEach(({ modal, panel, closer }) => {
  if (!modal) return;
  
  // 点击遮罩层关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closer();
  });

  // 阻止面板内部点击冒泡到遮罩层
  const panelEl = modal.querySelector(panel);
  if (panelEl) {
    panelEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 统一处理内部的 close-btn 和 close-action-btn
  const closeBtns = modal.querySelectorAll('.close-btn, .close-action-btn');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playClick();
      closer();
    });
  });
});

// --- 特定面板内部逻辑 ---

// 挂机面板逻辑 (关卡切换与领取)
if (afkModal) {
  const afkPanel = afkModal.querySelector('.afk-panel');
  if (afkPanel) {
    afkPanel.addEventListener('click', (e) => {
      // 注意：已经在统一逻辑中处理了 e.stopPropagation()
      
      const leftArrow = e.target.closest('.arrow-btn.left');
      const rightArrow = e.target.closest('.arrow-btn.right');
      const stageItem = e.target.closest('.stage-item');
      const claimBtn = e.target.closest('.claim-btn');
      const doubleClaimBtn = e.target.closest('.double-claim-btn');

      if (leftArrow) {
        audioManager.playClick();
        if (window.afkUIRenderer) window.afkUIRenderer.shiftStage('left');
      } else if (rightArrow) {
        audioManager.playClick();
        if (window.afkUIRenderer) window.afkUIRenderer.shiftStage('right');
      } else if (stageItem && !stageItem.classList.contains('disabled')) {
        audioManager.playClick();
        const stage = parseInt(stageItem.dataset.stage);
        if (window.afkManager) {
          window.afkManager.setSelectedStage(stage);
          window.afkUIRenderer.render();
        }
      } else if (claimBtn) {
        audioManager.playClick();
        if (window.afkManager) {
          window.afkManager.claim(false);
          window.afkUIRenderer.render();
          showFeedback(true);
        }
      } else if (doubleClaimBtn) {
        audioManager.playClick();
        if (window.afkManager) {
          window.afkManager.claim(true);
          window.afkUIRenderer.render();
          showFeedback(true);
        }
      }
    });
  }
}

// 设置面板内容逻辑 (仅 UI 状态记录)
if (settingsModal) {
  const settingsModalBody = settingsModal.querySelector('.modal-body');
  if (settingsModalBody) {
    settingsModalBody.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.custom-checkbox');
      if (checkbox) {
        checkbox.classList.toggle('checked');
        const settingId = checkbox.id;
        const isChecked = checkbox.classList.contains('checked');
        console.log(`【系统】设置变更: ${settingId} = ${isChecked}`);
        
        // 联动音效开关
        if (settingId === 'setting-sound') {
          audioManager.setEnabled(isChecked);
        }
        
        // 联动音乐开关
        if (settingId === 'setting-music') {
          audioManager.setMusicEnabled(isChecked);
        }

        // 联动全屏开关
        if (settingId === 'setting-fullscreen') {
          if (isChecked) {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => {
                console.error(`无法进入全屏: ${err.message}`);
                checkbox.classList.remove('checked');
              });
            }
          } else {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          }
        }
        
        // 点击复选框也播放音效
        audioManager.playClick();
      }

      // 处理查看教程按钮
      const tutorialBtn = e.target.closest('#show-tutorial-btn');
      if (tutorialBtn) {
        audioManager.playClick();
        closeSettingsModal(); // 先关闭设置面板
        openTutorialModal();  // 再打开教程面板
      }
    });
  }
}

// 监听全屏变化事件，确保 UI 状态同步
document.addEventListener('fullscreenchange', () => {
  const fullscreenCheckbox = document.getElementById('setting-fullscreen');
  if (fullscreenCheckbox) {
    if (document.fullscreenElement) {
      fullscreenCheckbox.classList.add('checked');
    } else {
      fullscreenCheckbox.classList.remove('checked');
    }
  }
});

// 在线奖励面板内容逻辑
if (onlineModal) {
  const onlinePanel = onlineModal.querySelector('.online-panel');
  if (onlinePanel) {
    onlinePanel.addEventListener('click', (e) => {
      const claimBtn = e.target.closest('.claim-btn-small');
      if (claimBtn && !claimBtn.classList.contains('disabled')) {
        audioManager.playClick();
        const index = parseInt(claimBtn.dataset.index);
        if (onlineRewardManager) {
          const result = onlineRewardManager.claimReward(index);
          if (result.success) {
            onlineRewardRenderer.render();
            showFeedback(true);
            console.log(`【系统】在线奖励领取成功: ${result.reward.amount} ${result.reward.type}`);
          }
        }
      }
    });
  }
}

if (storyBtn) {
  storyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    openStoryModal();
  });
}

const storyConfirmBtn = storyModal ? storyModal.querySelector('.story-confirm-btn') : null;
if (storyConfirmBtn) {
  storyConfirmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playClick();
    // 如果任务不可领取，点击按钮则关闭弹窗
    if (!storyManager.isTaskClaimable) {
      closeStoryModal();
    }
  });
}

// 链接敌人死亡掉落逻辑
enemyManager.onEnemyDeath = (enemy) => {
  // 基础掉落
  currencyManager.addGold(enemy.lootGold, true); 
  
  // 播放敌人死亡音效
  audioManager.playEnemyDeath();
  
  // 判定双倍掉落 (来自修炼系统)
  if (cultivationManager) {
    const doubleLootRate = cultivationManager.getEffect('双倍掉落') - 1;
    if (Math.random() <= doubleLootRate) {
      currencyManager.addGold(enemy.lootGold, true);
      console.log('【系统】触发双倍掉落！');
    }
  }
};

// 战宠死亡音效
petManager.onPetDeath = (pet) => {
  audioManager.playPetDeath();
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

// 核心点击出击逻辑：点击道士（meditator）提前让下一个战宠开始行动
const meditator = document.querySelector('.meditator');
let tutorialContainer = null;
let settingsTutorialContainer = null;

// 初始化教程提示
function initTutorial() {
  // 1. 道士点击引导
  const isTutorialDone = GameConfig.getStorageItem('taoist_tutorial_strike_done');
  if (!isTutorialDone && meditator) {
    // 创建教程容器
    tutorialContainer = document.createElement('div');
    tutorialContainer.className = 'tutorial-hint-container';
    
    // 创建标记点
    const marker = document.createElement('div');
    marker.className = 'tutorial-marker';
    
    // 创建提示文字
    const text = document.createElement('div');
    text.className = 'tutorial-text';
    text.innerText = 'CLICK';
    
    tutorialContainer.appendChild(marker);
    tutorialContainer.appendChild(text);
    meditator.parentElement.appendChild(tutorialContainer);
  }

  // 2. 设置/教程点击引导
  const isSettingsTutorialDone = GameConfig.getStorageItem('taoist_tutorial_settings_done');
  if (!isSettingsTutorialDone && settingsBtn) {
    settingsTutorialContainer = document.createElement('div');
    settingsTutorialContainer.className = 'tutorial-hint-container settings-tutorial';
    
    const marker = document.createElement('div');
    marker.className = 'tutorial-marker';
    
    const text = document.createElement('div');
    text.className = 'tutorial-text';
    text.innerText = 'TUTORIAL';
    
    settingsTutorialContainer.appendChild(marker);
    settingsTutorialContainer.appendChild(text);
    settingsBtn.appendChild(settingsTutorialContainer);
  }
}

if (meditator) {
  meditator.style.cursor = 'pointer'; // 增加手型反馈
  meditator.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止冒泡到 battle-wrap
    console.log('【系统】点击了道士，尝试提前出击战宠');
    const success = petManager.deployNextPet();
    
    // 如果教程还在显示，点击后移除
    if (tutorialContainer) {
      tutorialContainer.remove();
      tutorialContainer = null;
      GameConfig.setStorageItem('taoist_tutorial_strike_done', 'true');
    }
    
    if (!success) {
      console.log('【系统】当前没有排队中的战宠');
    }
  });
}

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
window.levelManager = levelManager; // 暴露给全局以供视频升级限制检查

// 关联 TrialManager 的 levelManager
trialManager.levelManager = levelManager;
trialManager.loadTrialData();
const trialUIRenderer = new TrialUIRenderer({ trialManager });

// 初始化并启动
async function initGame() {
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-game-btn');
  const loadingBar = document.querySelector('.loading-fill');
  const loadingText = document.querySelector('.loading-text');

  // 1. 开始加载数据
  const loadPromise = Promise.all([
    storyManager.loadStories(),
    petCollection.init(),
    cultivationManager.init(), // 加载修炼数据
    auraManager.init(), // 加载光环数据
    skillManager.init(), // 加载技能数据
    taskManager.init(), // 加载任务数据
    levelManager.start()
  ]);

  // 2. 模拟/展示加载进度
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 90) progress = 90; // 留一点给真实加载完成
    if (loadingBar) loadingBar.style.width = `${progress}%`;
  }, 100);

  // 等待真实数据加载完成
  await loadPromise;
  
  // 确保进度条到 100%
  clearInterval(progressInterval);
  if (loadingBar) loadingBar.style.width = '100%';
  if (loadingText) loadingText.textContent = '神兽召唤就绪';

  // 显示开始按钮
  setTimeout(() => {
    const container = document.querySelector('.loading-container');
    if (container) container.style.display = 'none';
    if (startBtn) startBtn.classList.remove('hidden');
  }, 500);

  // 3. 在关卡数据加载后初始化挂机管理器
  const afkManager = new AFKManager(currencyManager, taskManager, levelManager.levelDataMap);
  const afkUIRenderer = new AFKUIRenderer(afkModal, afkManager);
  window.afkManager = afkManager; // 暴露给全局或事件监听器
  window.afkUIRenderer = afkUIRenderer;

  currencyManager.addGold(0);
  currencyManager.addIngot(0);
  currencyManager.addLingfu(0);

  // 初始渲染一次 UI
  petUIRenderer.render();
  cultUIRenderer.render();
  auraUIRenderer.render();
  skillUIRenderer.render();
  auraVisualRenderer.refresh(); // 初始化光环视觉特效

  updateBuffLevelUI(); // 初始更新加成等级
  updateMainManaBar(); // 初始更新法力条
  updateSkinProgressUI(); // 初始更新皮肤进度
  updateOnlineRewardButton(); // 初始更新在线奖励按钮状态

  applyScaling(); // 初始应用屏幕缩放适配

  // 4. 等待用户点击“开始游戏”
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      // 初始化音频
      const soundCheckbox = document.getElementById('setting-sound');
      const musicCheckbox = document.getElementById('setting-music');
      
      if (soundCheckbox) {
        audioManager.setEnabled(soundCheckbox.classList.contains('checked'));
      }
      if (musicCheckbox) {
        audioManager.setMusicEnabled(musicCheckbox.classList.contains('checked'));
      }
      
      audioManager.init();
      audioManager.playClick();

      // 界面淡出并启动循环
      if (startScreen) {
        startScreen.classList.add('fade-out');
        setTimeout(() => {
          startScreen.remove();
          initTutorial(); // 初始化教程
          gameLoop(); // 正式开始游戏循环
        }, 800);
      } else {
        initTutorial(); // 初始化教程
        gameLoop();
      }
    });
  } else {
    // 如果没有开始界面（可能报错或被移除），直接启动
    gameLoop();
  }
}

/**
 * 自动适配屏幕缩放
 */
function applyScaling() {
  const container = document.getElementById('game-container');
  if (!container) return;

  const baseWidth = 540;
  const baseHeight = 1200;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 计算宽高缩放比，取最小值以确保完全显示在屏幕内
  const scale = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);

  // 始终根据计算出的 scale 进行缩放，并保持居中
  container.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// 监听窗口变化
window.addEventListener('resize', applyScaling);
window.addEventListener('orientationchange', applyScaling);

// 游戏主循环
let lastAfkUpdateTime = 0;
let lastStoryUpdateTime = 0;

function gameLoop() {
  const { combatDt, rawDt } = engine.update();
  
  // 管理器状态监控更新
  enemyManager.update();
  petManager.update();
  levelManager.update(combatDt); // 关卡管理器也使用战斗倍速相关的 dt
  activeSkillManager.update(rawDt); // 主动技能 CD 和 持续时间 不受战斗加速影响，使用真实时间
  statManager.update(rawDt); // 更新全局加成计时器 (自动出击等)
  currencyManager.updateRecovery(rawDt); // 精华恢复使用真实 dt
  onlineRewardManager.update(rawDt); // 在线奖励使用真实 dt
  
  const now = Date.now();
  if (now - lastAfkUpdateTime >= 1000) {
    updateAfkButton();
    updateAutoStrikeButton(); // 更新自动出击倒计时
    updateOnlineRewardButton(); // 更新在线奖励倒计时
    lastAfkUpdateTime = now;
  }

  // 确保敌人实体订阅了伤害事件，用于显示飘字 (战宠受伤不显示飘字)
  engine.entities.forEach(entity => {
    if (entity.side === 'enemy' && !entity.onDamage) {
      entity.onDamage = (amount) => {
        renderer.createDamageText(entity.x, entity.y, amount);
      };
    }
  });

  // 更新主动技能 UI 状态
  updateSkillsUI();

  // 剧情任务状态检查 (每秒一次)
  if (now - lastStoryUpdateTime >= 1000) {
    storyManager.checkTaskStatus();
    // 无论弹窗是否打开，都更新倒计时（因为现在主界面也有倒计时）
    storyUIRenderer.updateTimer();
    lastStoryUpdateTime = now;
  }
  
  renderer.render(engine.entities);
  auraVisualRenderer.updatePetAuras(); // 每帧刷新战斗区域战宠的光环（以支持新生成的战宠）
  updateMainHpBar(); // 更新主界面生命条
  requestAnimationFrame(gameLoop);
}

initGame();

console.log('Taoist Legend Combat Engine with Level Manager Started');
