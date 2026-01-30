import { Pet } from './Pet.js';

/**
 * 战宠管理类：负责战宠的生成、位置同步及生命周期监控
 */
export class PetManager {
  constructor(engine) {
    this.engine = engine;
    this.pets = [];
    this.allDeadLogged = false;
    this.worldBounds = null;
  }

  /**
   * 设置世界边界
   */
  setWorldBounds(bounds) {
    this.worldBounds = bounds;
  }

  /**
   * 清除所有战宠数据（包括引擎中的对象）
   */
  clear() {
    if (this.engine) {
      this.pets.forEach(pet => {
        const index = this.engine.entities.indexOf(pet);
        if (index > -1) {
          this.engine.entities.splice(index, 1);
        }
      });
    }
    this.pets = [];
    this.allDeadLogged = false;
  }

  /**
   * 生成指定数量的战宠
   * @param {Array<Object>} petsData 战宠属性列表
   * @param {Array<{x: number, y: number}>} positions 预设的坐标点列表
   * @param {number} deployInterval 出击间隔(秒)，默认为 1s
   */
  spawnPets(petsData, positions, deployInterval = 1.0) {
    const limit = Math.min(petsData.length, positions.length);
    
    // 检查是否开启了自动出击
    const isAutoStrike = window.statManager ? window.statManager.isAutoStrikeActive() : true;
    
    for (let i = 0; i < limit; i++) {
      const pos = positions[i];
      const data = petsData[i];
      
      // 如果未开启自动出击，则设置一个极大的延迟（只能通过手动点击触发）
      const delay = isAutoStrike ? (i * deployInterval) : 999999;
      
      const pet = new Pet({
        x: pos.x,
        y: pos.y,
        speed: 100,
        hp: data.hp,
        maxHp: data.maxHp,
        atk: data.atk,
        atkSpeed: data.atkSpeed || 0.8,
        name: `宠${data.id}`,
        worldBounds: this.worldBounds,
        deployDelay: delay // 设置出击延迟
      });

      this.pets.push(pet);
      this.engine.addEntity(pet);

      // 如果有激活的主动技能，重新应用效果 (用于关卡切换等场景)
      if (window.activeSkillManager) {
        window.activeSkillManager.reapplyActiveSkills(pet);
      }
    }
    this.allDeadLogged = false;
  }

  /**
   * 手动出击：让下一个处于等待状态（有延迟）的战宠立即行动
   */
  deployNextPet() {
    console.log(`【调试】当前战宠总数: ${this.pets.length}`);
    // 找到第一个 deployDelay > 0 的战宠
    const nextPet = this.pets.find(p => p.deployDelay > 0 && !p.isDead);
    if (nextPet) {
      console.log(`【调试】找到待出击战宠: ${nextPet.name}, 当前延迟: ${nextPet.deployDelay.toFixed(2)}s`);
      nextPet.deployDelay = 0;
      console.log(`【系统】手动出击：${nextPet.name} 提前加入战斗！`);
      return true;
    }
    
    // 如果没找到，打印一下所有存活战宠的状态，方便分析
    const status = this.pets.map(p => `${p.name}(delay:${p.deployDelay.toFixed(2)})`).join(', ');
    console.log(`【调试】未找到待出击战宠。当前战宠状态: ${status}`);
    return false;
  }

  /**
   * 获取战宠总体生命统计
   * @returns {{current: number, max: number, percent: number}}
   */
  getTotalHealthStats() {
    let totalHp = 0;
    let totalMaxHp = 0;

    this.pets.forEach(pet => {
      totalHp += pet.hp;
      totalMaxHp += pet.maxHp;
    });

    return {
      current: totalHp,
      max: totalMaxHp,
      percent: totalMaxHp > 0 ? (totalHp / totalMaxHp) * 100 : 0
    };
  }

  /**
   * 更新监控状态
   */
  update() {
    if (this.pets.length > 0 && !this.allDeadLogged) {
      const aliveCount = this.pets.filter(p => !p.isDead).length;
      if (aliveCount === 0) {
        console.log("【战报】我方战宠全部阵亡！");
        this.allDeadLogged = true;
      }
    }
  }
}
