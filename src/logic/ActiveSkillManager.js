/**
 * ActiveSkillManager (主动技能管理器)
 * 负责管理技能的释放状态、冷却时间（CD）和法力消耗。
 */
export class ActiveSkillManager {
    constructor(skillManager, statManager, petManager) {
        this.skillManager = skillManager;
        this.statManager = statManager;
        this.petManager = petManager;

        // 技能配置
        this.skills = {
            '群体狂暴': {
                manaCost: 15,
                duration: 20,
                cd: 0, // 狂暴技能用户没提CD，默认为持续时间结束即可再次开启，或固定一个短CD
                effect: (intensity) => this.applyGroupFrenzy(intensity)
            },
            '毒素注入': {
                manaCost: 20,
                duration: 30,
                cd: 0,
                effect: (intensity) => this.applyPoisonInfusion(intensity)
            },
            '天降甘霖': {
                manaCost: 10,
                duration: 0, // 瞬发
                getCd: (intensity) => 10 / intensity,
                effect: (intensity) => this.applyRainOfHeaven(intensity)
            },
            '神圣战甲': {
                manaCost: 20,
                duration: 40,
                cd: 0,
                effect: (intensity) => this.applyHolyArmor(intensity)
            }
        };

        // 运行中的技能状态
        this.skillStates = {
            '群体狂暴': { cdTimer: 0, activeTimer: 0 },
            '毒素注入': { cdTimer: 0, activeTimer: 0 },
            '天降甘霖': { cdTimer: 0, activeTimer: 0 },
            '神圣战甲': { cdTimer: 0, activeTimer: 0 }
        };

        this.manaRegenTimer = 0;
    }

    /**
     * 获取技能当前强度系数 (由 SkillManager 中的 level 决定)
     */
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
     * 获取技能当前等级
     */
    getSkillLevel(skillName) {
        const skillState = this.skillManager.ownedSkills.find(s => s.baseName === skillName);
        return skillState ? skillState.level : 0;
    }

    /**
     * 尝试释放技能
     */
    useSkill(skillName) {
        const config = this.skills[skillName];
        const state = this.skillStates[skillName];

        if (!config || !state) return { success: false, reason: '技能不存在' };

        // 0. 检查等级 (必须升级过才能释放)
        if (this.getSkillLevel(skillName) <= 0) return { success: false, reason: '技能未学习' };

        // 1. 检查 CD
        if (state.cdTimer > 0) return { success: false, reason: '技能冷却中' };

        // 2. 检查法力
        if (this.statManager.mana < config.manaCost) return { success: false, reason: '法力不足' };

        // 3. 消耗法力
        this.statManager.consumeMana(config.manaCost);

        // 4. 触发效果
        const intensity = this.getSkillIntensity(skillName);
        config.effect(intensity);

        // 5. 设置 CD 和 持续时间
        const cd = config.getCd ? config.getCd(intensity) : (config.cd || config.duration);
        state.cdTimer = cd;
        state.activeTimer = config.duration;

        console.log(`【技能】释放了 [${skillName}]，消耗法力: ${config.manaCost}, 强度: ${intensity.toFixed(2)}`);
        return { success: true };
    }

    /**
     * 每帧更新
     */
    update(dt) {
        // 1. 更新技能计时器
        for (const skillName in this.skillStates) {
            const state = this.skillStates[skillName];
            
            // 更新 CD
            if (state.cdTimer > 0) {
                state.cdTimer -= dt;
                if (state.cdTimer < 0) state.cdTimer = 0;
            }

            // 更新持续时间 (如果有)
            if (state.activeTimer > 0) {
                state.activeTimer -= dt;
                if (state.activeTimer < 0) state.activeTimer = 0;
            }
        }

        // 2. 法力自然回复: 每10s自然回复1点法力
        this.manaRegenTimer += dt;
        if (this.manaRegenTimer >= 10) {
            this.manaRegenTimer -= 10;
            if (this.statManager.mana < this.statManager.maxMana) {
                this.statManager.mana = Math.min(this.statManager.maxMana, this.statManager.mana + 1);
                // 触发 UI 更新
                if (window.updateMainManaBar) {
                    window.updateMainManaBar();
                }
            }
        }
    }

    /**
     * 获取技能 UI 状态
     */
    getSkillUIState(skillName) {
        const config = this.skills[skillName];
        const state = this.skillStates[skillName];
        if (!config || !state) return null;

        const level = this.getSkillLevel(skillName);
        const intensity = this.getSkillIntensity(skillName);
        const cd = config.getCd ? config.getCd(intensity) : (config.cd || config.duration);
        
        return {
            isUsable: level > 0 && state.cdTimer === 0 && this.statManager.mana >= config.manaCost,
            isActive: state.activeTimer > 0,
            cdPercent: cd > 0 ? (state.cdTimer / cd) : 0,
            cdTimer: state.cdTimer
        };
    }

    /**
     * 关卡切换或生成新战宠时，重新应用激活中的技能 Buff
     */
    reapplyActiveSkills(pet) {
        for (const skillName in this.skillStates) {
            const state = this.skillStates[skillName];
            if (state.activeTimer > 0) {
                const intensity = this.getSkillIntensity(skillName);
                
                // 根据不同技能类型应用 Buff
                if (skillName === '群体狂暴') {
                    pet.addBuff({ type: 'frenzy', value: intensity, duration: state.activeTimer });
                } else if (skillName === '毒素注入') {
                    pet.addBuff({ type: 'poison_infusion', value: intensity, duration: state.activeTimer });
                } else if (skillName === '神圣战甲') {
                    pet.addBuff({ type: 'holy_armor', value: 1 - (1 / intensity), duration: state.activeTimer });
                }
            }
        }
    }

    // --- 具体技能效果实现 ---

    /**
     * 群体狂暴：持续20s，期间所有战宠的移动速度和攻击力变为（强度系数）倍
     */
    applyGroupFrenzy(intensity) {
        const pets = this.petManager.engine.entities.filter(e => e.side === 'player');
        pets.forEach(pet => {
            pet.addBuff({
                type: 'frenzy',
                value: intensity, // 倍率
                duration: 20
            });
        });
    }

    /**
     * 毒素注入：持续30s，期间战宠攻击未中毒的敌人时，会另其中毒
     */
    applyPoisonInfusion(intensity) {
        const pets = this.petManager.engine.entities.filter(e => e.side === 'player');
        pets.forEach(pet => {
            pet.addBuff({
                type: 'poison_infusion',
                value: intensity, // 强度系数，用于计算中毒伤害
                duration: 30
            });
        });
    }

    /**
     * 天降甘霖：恢复所有存活战宠生命值
     * 恢复 30 + 20 * (强度系数 - 1)% 最大生命值
     */
    applyRainOfHeaven(intensity) {
        const recoverPercent = 0.3 + 0.2 * (intensity - 1);
        const pets = this.petManager.engine.entities.filter(e => e.side === 'player' && !e.isDead);
        pets.forEach(pet => {
            const healAmount = pet.maxHp * recoverPercent;
            pet.hp = Math.min(pet.maxHp, pet.hp + healAmount);
            // 这里可以触发一个治愈特效
            pet.showHealEffect = true; 
            setTimeout(() => pet.showHealEffect = false, 1000);
        });
    }

    /**
     * 神圣战甲: 持续40s，所有战宠免疫 (1 - 1 / (强度系数 - 1))% 的伤害
     * 注意：强度系数通常从 1.0 开始增加，如果系数是 2.0，则减伤为 (1 - 1/1) = 0%? 
     * 用户公式：(1 - 1 / (强度系数 - 1))%，这里 (强度系数-1) 如果是 0 会除 0。
     * 修正理解：可能是 (1 - 1/强度系数) ? 
     * 如果强度系数是 2.0，减伤 50%。如果强度系数是 5.0，减伤 80%。这比较合理。
     * 我们先按 (1 - 1/intensity) 实现，即减伤比例。
     */
    applyHolyArmor(intensity) {
        const damageReduction = 1 - (1 / intensity);
        const pets = this.petManager.engine.entities.filter(e => e.side === 'player');
        pets.forEach(pet => {
            pet.addBuff({
                type: 'holy_armor',
                value: damageReduction,
                duration: 40
            });
        });
    }
}
