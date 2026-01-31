/**
 * 音频管理类：使用 Web Audio API 程序化生成音效
 */
export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.bgmTimer = null;
  }

  /**
   * 设置音效是否开启
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`【系统】音效状态已设置为: ${enabled ? '开启' : '关闭'}`);
  }

  /**
   * 设置音乐是否开启
   */
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.15 : 0, this.context.currentTime, 0.1);
    }
    if (enabled) {
      if (!this.bgmTimer) this.startBGM();
    } else {
      this.stopBGM();
    }
    console.log(`【系统】音乐状态已设置为: ${enabled ? '开启' : '关闭'}`);
  }

  /**
   * 初始化音频上下文 (需在用户交互后调用)
   */
  init() {
    if (this.context) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      
      // 主音效增益
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.3;

      // 音乐专用增益
      this.musicGain = this.context.createGain();
      this.musicGain.connect(this.context.destination);
      this.musicGain.gain.value = this.musicEnabled ? 0.15 : 0;

      console.log('【系统】音频系统初始化成功');
      
      // 初始化后尝试开启 BGM
      if (this.musicEnabled) {
        this.startBGM();
      }
    } catch (e) {
      console.warn('【系统】浏览器不支持 Web Audio API');
    }
  }

  /**
   * 开启背景音乐 (传奇风格：A-A-B-C 史诗循环)
   */
  startBGM() {
    if (!this.context || this.bgmTimer) return;

    const tempo = 125;
    const stepTime = 60 / tempo / 2; // 八分音符 (约 0.24s)
    const startTime = performance.now();
    let lastStep = -1;

    // 音高定义
    const A2 = 110.00, G2 = 98.00, F2 = 87.31, E2 = 82.41;
    const E3 = 164.81, A3 = 220.00, B3 = 246.94, C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00;
    
    // A 段：英雄动机 (稳重、经典)
    const melodyA = [
      [A3, 2, 0.8], [null, 2, 0], [A3, 2, 0.8], [null, 2, 0],
      [C4, 1, 0.7], [D4, 1, 0.7], [E4, 4, 1.0], [null, 2, 0],
      [E4, 2, 0.8], [null, 2, 0], [D4, 1, 0.7], [C4, 1, 0.7],
      [B3, 2, 0.6], [G4, 2, 0.6], [A3, 8, 1.0]
    ];

    // B 段：张力变奏 (音调升高，增强情绪)
    const melodyB = [
      [A3, 2, 0.8], [null, 2, 0], [C4, 2, 0.8], [null, 2, 0],
      [D4, 1, 0.7], [E4, 1, 0.7], [G4, 4, 1.2], [null, 2, 0],
      [G4, 2, 1.0], [F4, 2, 0.9], [E4, 2, 0.8], [D4, 2, 0.7],
      [E4, 4, 0.9], [B3, 2, 0.7], [A3, 2, 0.8], [null, 2, 0]
    ];

    // C 段：回旋转场 (节奏密集，准备回到 A)
    const melodyC = [
      [E4, 1, 0.8], [D4, 1, 0.7], [C4, 1, 0.7], [B3, 1, 0.6],
      [A3, 2, 0.9], [E3, 2, 0.7], [A3, 4, 1.0], [null, 2, 0],
      [G4, 2, 0.8], [E4, 2, 0.8], [C4, 2, 0.8], [A3, 2, 0.8],
      [B3, 2, 0.7], [C4, 2, 0.7], [D4, 2, 0.7], [E4, 2, 0.7]
    ];

    const playSequence = () => {
      if (!this.musicEnabled) {
        this.bgmTimer = null;
        return;
      }

      // 使用真实时间计算当前步数，确保“错过就错过”，解决后台切回后的堆叠爆音问题
      const elapsed = (performance.now() - startTime) / 1000;
      const currentStep = Math.floor(elapsed / stepTime);

      // 只有当步数发生变化且音频上下文正常运行时才播放
      if (currentStep !== lastStep && this.context.state === 'running') {
        lastStep = currentStep;
        const now = this.context.currentTime;
        const phraseLength = 32;
        const currentPhrase = Math.floor((currentStep / phraseLength) % 4);
        const currentStepInPhrase = currentStep % phraseLength;

        // 选择当前乐句的旋律
        let currentMelody;
        if (currentPhrase === 0 || currentPhrase === 1) currentMelody = melodyA;
        else if (currentPhrase === 2) currentMelody = melodyB;
        else currentMelody = melodyC;

        // 1. 战鼓逻辑 (Kick)
        if (currentStepInPhrase % 4 === 0) {
          this.playKick(now, 0.4);
        } else if (currentStepInPhrase % 16 === 14) {
          this.playKick(now, 0.15);
        }

        // 2. 贝斯逻辑 (Bass)
        let bassFreq = A2;
        if (currentPhrase === 2 && currentStepInPhrase >= 16) bassFreq = G2;
        if (currentPhrase === 3 && currentStepInPhrase >= 24) bassFreq = E2;

        if (currentStepInPhrase % 4 === 0) {
          this.playBass(bassFreq, now, stepTime * 3.5);
        }

        // 3. 旋律逻辑
        let accumulatedSteps = 0;
        for (const [freq, duration, vol] of currentMelody) {
          if (currentStepInPhrase >= accumulatedSteps && currentStepInPhrase < accumulatedSteps + duration) {
            if (freq && currentStepInPhrase === accumulatedSteps) {
              this.playMelodyNote(freq, now, stepTime * duration * 0.9, vol);
            }
            break;
          }
          accumulatedSteps += duration;
        }
      }

      // 稍微缩短轮询间隔，确保在高 BPM 或后台恢复时能及时捕捉到 step 变化
      this.bgmTimer = setTimeout(playSequence, stepTime * 500);
    };

    playSequence();
  }

  /**
   * 播放战鼓音效 (Kick)
   */
  playKick(time, vol = 0.4) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  /**
   * 播放贝斯音效 (Bass)
   */
  playBass(freq, time, duration) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'triangle'; // 三角波更有厚度
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 播放旋律音符
   */
  playMelodyNote(freq, time, duration, volScale) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    osc.type = 'sawtooth'; // 锯齿波更有史诗感
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + duration);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2 * volScale, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 停止背景音乐
   */
  stopBGM() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * 确保上下文处于运行状态
   */
  async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
      console.log('【系统】音频上下文已恢复');
    }
  }

  /**
   * 暂停音频上下文
   */
  async suspend() {
    if (this.context && this.context.state === 'running') {
      await this.context.suspend();
      console.log('【系统】音频上下文已暂停');
    }
  }

  /**
   * 1. 普通攻击音效：短促的打击声
   */
  playAttack() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  /**
   * 2. 关卡胜利音效：上升的和谐音
   */
  playWin() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  /**
   * 3. 关卡失败音效：下降的沉闷音
   */
  playFail() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + 0.5);
  }

  /**
   * 4. 强化成功音效：清脆的叮当声
   */
  playUpgradeSuccess() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + 0.2);
  }

  /**
   * 5. 强化失败音效：短促的嗡嗡声
   */
  playUpgradeFailure() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + 0.1);
  }

  /**
   * 6. 主动技能释放音效：雄浑的爆发声
   */
  playActiveSkill() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    
    // 冲击波部分
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // 闪光部分
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc1.start();
    osc1.stop(now + 0.5);
    osc2.start();
    osc2.stop(now + 0.2);
  }

  /**
   * 7. 被动技能触发音效：短促清脆的叮当声
   */
  playPassiveSkill() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + 0.1);
  }

  /**
   * 8. 敌人死亡音效：短促的破碎声
   */
  playEnemyDeath() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    
    // 使用白噪声模拟破碎感
    const bufferSize = this.context.sampleRate * 0.1; // 0.1秒
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(now + 0.1);
  }

  /**
   * 9. 战宠死亡音效：下降的哀鸣声
   */
  playPetDeath() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + 0.4);
  }

  /**
   * 10. UI 点击音效：短促的滴答声
   */
  playClick() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + 0.05);
  }
}

// 导出单例
export const audioManager = new AudioManager();
