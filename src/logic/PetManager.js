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
    for (let i = 0; i < limit; i++) {
      const pos = positions[i];
      const data = petsData[i];
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
        deployDelay: i * deployInterval // 设置出击延迟
      });

      this.pets.push(pet);
      this.engine.addEntity(pet);
    }
    this.allDeadLogged = false;
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
