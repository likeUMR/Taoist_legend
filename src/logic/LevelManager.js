/**
 * 关卡管理类：控制关卡的推进、成败判定和重置逻辑
 */
export class LevelManager {
  constructor(options) {
    this.engine = options.engine;
    this.renderer = options.renderer;
    this.enemyManager = options.enemyManager;
    this.petManager = options.petManager;
    this.petCollection = options.petCollection;
    this.petPositions = options.petPositions;
    this.worldBounds = options.worldBounds;
    this.taskManager = options.taskManager;
    
    this.currentLevel = 0;
    this.levelDataMap = new Map(); // level -> { atk, hp, rewardGold }
    this.uiElement = document.querySelector('.floor-tag');
    this.retryBtn = document.querySelector('.retry-btn');
    
    this.isTransitioning = false;
    this.transitionTimer = 0; // 转换计时器
    this.transitionCallback = null; // 转换结束后的回调
    this.lastFailedLevel = -1; // 记录最近一次失败的关卡
    this.initEvents();
  }

  /**
   * 初始化事件监听
   */
  initEvents() {
    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', () => {
        if (!this.isTransitioning) {
          console.log(`【系统】挑战最高层级: 第 ${this.lastFailedLevel} 层...`);
          const targetLevel = this.lastFailedLevel;
          this.lastFailedLevel = -1; // 点击后重置失败记录，恢复晋级模式
          this.loadLevel(targetLevel);
        }
      });
      // 初始隐藏
      this.retryBtn.style.display = 'none';
    }
  }

  /**
   * 初始化/启动第一关
   */
  async start() {
    await this.loadLevelData();
    this.loadLevel(0);
  }

  /**
   * 加载 CSV 关卡数据
   */
  async loadLevelData() {
    try {
      const response = await fetch('/data/levels.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      // 跳过表头
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [level, atk, hp, reward] = line.split(',');
        this.levelDataMap.set(parseInt(level), {
          atk: parseFloat(atk),
          hp: parseFloat(hp),
          rewardGold: parseFloat(reward)
        });
      }
      console.log(`【系统】成功加载 ${this.levelDataMap.size} 条关卡数据`);
    } catch (err) {
      console.error('【系统】加载关卡数据失败:', err);
    }
  }

  /**
   * 加载指定关卡
   */
  loadLevel(level) {
    this.currentLevel = level;
    this.isTransitioning = false;
    
    // 关卡改变时，同步给任务系统
    if (this.taskManager) {
      this.taskManager.recordLevelReached(level);
    }
    this.engine.clear();
    this.renderer.clear();
    this.enemyManager.clear();
    this.petManager.clear();

    // 2. 更新 UI
    if (this.uiElement) {
      this.uiElement.textContent = `第${this.currentLevel}层`;
    }
    
    // 根据当前层级与最后失败层级的关系决定按钮显示
    if (this.retryBtn) {
      if (this.lastFailedLevel !== -1 && this.currentLevel < this.lastFailedLevel) {
        this.retryBtn.style.display = 'block';
      } else {
        this.retryBtn.style.display = 'none';
      }
    }

    // 3. 从数据中心获取最新的战宠战斗数据并生成
    const petsBattleData = this.petCollection.getBattleData();
    this.petManager.spawnPets(petsBattleData, this.petPositions);

    // 4. 生成敌方
    const centerX = this.worldBounds ? this.worldBounds.width / 2 : 200;
    const centerY = this.worldBounds ? this.worldBounds.height / 2 : 200;
    
    // 读取关卡数据
    const config = this.levelDataMap.get(level) || { atk: 5, hp: 50, rewardGold: 10 };
    
    // 敌人数量：第一关(level 0) 1个，第二关(level 1) 2个，依此类推，最多5个
    const enemyCount = Math.min(level + 1, 5);
    
    // 新手关(前5关)总血量修正：TotalHP = TableHP * (n/5), n = level + 1
    let totalHp = config.hp;
    if (level < 5) {
      totalHp = config.hp * ((level + 1) / 5);
    }
    
    // 每个敌人的属性 = 总属性 / 敌人数量 (攻击力除外)
    this.enemyManager.spawnEnemies(enemyCount, centerX, centerY, {
      atk: config.atk,
      hp: totalHp / enemyCount,
      lootGold: config.rewardGold / enemyCount
    }, 60);

    console.log(`【系统】加载第 ${this.currentLevel} 层...`);
  }

  /**
   * 每帧检查胜负
   * @param {number} dt 战斗倍速影响后的 dt
   */
  update(dt) {
    if (this.isTransitioning) {
      if (this.transitionTimer > 0) {
        this.transitionTimer -= dt;
        if (this.transitionTimer <= 0) {
          this.transitionTimer = 0;
          if (this.transitionCallback) {
            const cb = this.transitionCallback;
            this.transitionCallback = null;
            cb();
          }
        }
      }
      return;
    }

    // 检查敌人是否全灭 (胜利)
    const enemiesAlive = this.enemyManager.enemies.filter(e => !e.isDead).length;
    if (this.enemyManager.enemies.length > 0 && enemiesAlive === 0) {
      this.win();
      return;
    }

    // 检查战宠是否全灭 (失败)
    const petsAlive = this.petManager.pets.filter(p => !p.isDead).length;
    if (this.petManager.pets.length > 0 && petsAlive === 0) {
      if (this.currentLevel > 0) {
        this.fail();
      } else {
        // 第0层特殊处理：战宠全灭也重置但不降级
        this.startTransition(1.0, () => this.loadLevel(0));
      }
    }
  }

  /**
   * 启动转换过程
   * @param {number} duration 持续时间 (秒)
   * @param {Function} callback 
   */
  startTransition(duration, callback) {
    this.isTransitioning = true;
    this.transitionTimer = duration;
    this.transitionCallback = callback;
  }

  win() {
    // 如果当前层级小于最后失败的层级，则进入挂机模式
    const isRetrying = this.lastFailedLevel !== -1 && this.currentLevel < this.lastFailedLevel;

    if (isRetrying) {
      console.log(`【系统】第 ${this.currentLevel} 层挑战成功！(当前处于挂机模式，不自动晋级)`);
      this.startTransition(1.5, () => {
        this.loadLevel(this.currentLevel); // 重复本关
      });
    } else {
      console.log(`【系统】第 ${this.currentLevel} 层挑战成功！即将进入下一层...`);
      this.startTransition(1.5, () => {
        this.lastFailedLevel = -1; // 确保清除过时的记录
        this.loadLevel(this.currentLevel + 1);
      });
    }
  }

  fail() {
    console.log(`【系统】第 ${this.currentLevel} 层挑战失败！退回上一层...`);
    
    // 记录失败的关卡
    this.lastFailedLevel = this.currentLevel;

    this.startTransition(1.5, () => {
      this.loadLevel(Math.max(0, this.currentLevel - 1));
    });
  }
}
