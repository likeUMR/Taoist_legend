/**
 * 被动技能管理器：处理攻击时触发的逻辑
 */
import { audioManager } from '../utils/AudioManager.js';

export class PassiveSkillManager {
    constructor(skillManager, engine, renderer) {
        this.skillManager = skillManager;
        this.engine = engine;
        this.renderer = renderer;

        this.passives = {
            '战争践踏': {
                chance: 0.2,
                radius: 60,
                multiplier: 3,
                execute: (pet, intensity) => this.executeWarStomp(pet, intensity)
            },
            '飓风之息': {
                chance: 0.2,
                multiplier: 4,
                execute: (pet, intensity, target) => this.executeHurricane(pet, intensity, target)
            },
            '流星火雨': {
                chance: 0.2,
                multiplier: 1,
                execute: (pet, intensity) => this.executeMeteorRain(pet, intensity)
            },
            '蚀骨冰刺': {
                chance: 0.2,
                multiplier: 1,
                radius: 100,
                angle: Math.PI / 3, // 60度
                execute: (pet, intensity, target) => this.executeIceSpike(pet, intensity, target)
            }
        };
    }

    /**
     * 战宠攻击时调用此钩子
     */
    triggerPassive(pet, target) {
        // 遍历所有被动技能，检查是否触发
        for (const skillName in this.passives) {
            const level = this.getSkillLevel(skillName);
            if (level <= 0) continue;

            const config = this.passives[skillName];
            if (Math.random() < config.chance) {
                const intensity = this.getSkillIntensity(skillName);
                console.log(`【被动技能】触发了 [${skillName}]`);
                
                // 触发特效：战宠闪金
                this.renderer.applyVfxToEntity(pet.id, 'skill-trigger-flash');
                
                // 触发特效：主界面图标闪金
                if (window.flashSkillIcon) {
                    window.flashSkillIcon(skillName);
                }
                
                // 播放音效
                audioManager.playPassiveSkill();
                
                config.execute(pet, intensity, target);
            }
        }
    }

    getSkillLevel(skillName) {
        const skill = this.skillManager.ownedSkills.find(s => s.baseName === skillName);
        return skill ? skill.level : 0;
    }

    getSkillIntensity(skillName) {
        const skillState = this.skillManager.ownedSkills.find(s => s.baseName === skillName);
        if (!skillState) return 1.0;
        
        const meta = this.skillManager.skillMetadata.get(skillName);
        if (!meta) return 1.0;

        const configs = this.skillManager.upgradeConfigs.get(meta.originalKey);
        if (!configs) return 1.0;

        const cfg = configs.get(skillState.level);
        return cfg ? cfg.attr : 1.0;
    }

    /**
     * 1. 战争践踏: AOE 伤害
     */
    executeWarStomp(pet, intensity) {
        const config = this.passives['战争践踏'];
        const damage = pet.getFinalAtk() * (intensity - 1) * config.multiplier;
        
        // 视觉效果
        if (this.renderer) {
            this.renderer.createVfx('war-stomp', pet.x, pet.y, { radius: config.radius });
        }

        // 逻辑伤害
        const targets = this.engine.getEntitiesInRadius(pet.x, pet.y, config.radius, 'enemy');
        targets.forEach(t => t.takeDamage(damage));
    }

    /**
     * 2. 飓风之息: 穿透飞行物
     */
    executeHurricane(pet, intensity, target) {
        const config = this.passives['飓风之息'];
        const damage = pet.getFinalAtk() * (intensity - 1) * config.multiplier;
        
        // 计算方向
        const dx = target.x - pet.x;
        const dy = target.y - pet.y;
        const angle = Math.atan2(dy, dx);

        // 创建飞行物 (视觉 + 逻辑)
        if (this.renderer) {
            this.renderer.createProjectile('hurricane', pet.x, pet.y, angle, {
                damage: damage,
                speed: 200,
                radius: 30,
                piercing: true
            });
        }
    }

    /**
     * 3. 流星火雨: 随机落点伤害
     */
    executeMeteorRain(pet, intensity) {
        const config = this.passives['流星火雨'];
        const damage = pet.getFinalAtk() * (intensity - 1) * config.multiplier;
        const count = 3; // 陨石数量
        const spawnRadius = 150; // y1: 随机生成范围半径
        const damageRadius = 50; // y2: 爆炸伤害半径

        for (let i = 0; i < count; i++) {
            // 随机落点 (圆形范围内)
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * spawnRadius;
            const targetX = pet.x + Math.cos(angle) * dist;
            const targetY = pet.y + Math.sin(angle) * dist;

            // 视觉效果 (下落 + 爆炸)
            if (this.renderer) {
                setTimeout(() => {
                    this.renderer.createVfx('meteor', targetX, targetY, { 
                        damage: damage,
                        radius: damageRadius 
                    });
                    
                    // 实际伤害在延迟后产生 (落地瞬间)
                    const targets = this.engine.getEntitiesInRadius(targetX, targetY, damageRadius, 'enemy');
                    targets.forEach(t => t.takeDamage(damage));
                }, i * 200); // 错开下落时间
            }
        }
    }

    /**
     * 4. 蚀骨冰刺: 扇形 AOE
     */
    executeIceSpike(pet, intensity, target) {
        const config = this.passives['蚀骨冰刺'];
        const damage = pet.getFinalAtk() * (intensity - 1) * config.multiplier;

        // 计算方向
        const dx = target.x - pet.x;
        const dy = target.y - pet.y;
        const angle = Math.atan2(dy, dx);

        // 视觉效果
        if (this.renderer) {
            this.renderer.createVfx('ice-spike', pet.x, pet.y, { 
                angle: angle, 
                radius: config.radius,
                sectorAngle: config.angle
            });
        }

        // 逻辑伤害
        const targets = this.engine.getEntitiesInSector(pet.x, pet.y, config.radius, angle, config.angle, 'enemy');
        targets.forEach(t => t.takeDamage(damage));
    }
}
