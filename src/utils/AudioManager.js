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
   * 开启背景音乐 (生成式氛围音乐)
   */
  startBGM() {
    if (!this.context || this.bgmTimer) return;

    const playNote = () => {
      if (!this.musicEnabled) {
        this.bgmTimer = null;
        return;
      }

      const now = this.context.currentTime;
      // 宫商角徵羽 (C4, D4, E4, G4, A4) 的频率
      const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // 极长的淡入淡出，营造空灵感
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 1);
      gain.gain.linearRampToValueAtTime(0, now + 4);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(now);
      osc.stop(now + 4);

      // 每隔 2-4 秒播放下一个音符
      const nextDelay = 2000 + Math.random() * 2000;
      this.bgmTimer = setTimeout(playNote, nextDelay);
    };

    playNote();
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
