/**
 * 虚拟滚动控制器：处理拖拽位移逻辑，不依赖原生滚动条
 * 适用于 DOM，也易于移植到 Canvas
 */
export class ScrollController {
  constructor(options) {
    this.container = options.container; // 外部容器
    this.content = options.content;     // 内容容器
    
    this.scrollY = 0;
    this.isDragging = false;
    this.hasMoved = false; // 是否触发了显著位移
    this.startY = 0;
    this.startScrollY = 0;
    
    this.minY = 0; // 最大上滑位置 (负值)
    this.maxY = 0; // 初始位置
    
    this.initEvents();
  }

  destroy() {
    if (this._onStart) this.container.removeEventListener('mousedown', this._onStart);
    if (this._onMove) window.removeEventListener('mousemove', this._onMove);
    if (this._onEnd) window.removeEventListener('mouseup', this._onEnd);
    
    if (this._onStart) this.container.removeEventListener('touchstart', this._onStart);
    if (this._onMove) window.removeEventListener('touchmove', this._onMove);
    if (this._onEnd) window.removeEventListener('touchend', this._onEnd);

    if (this._onClick) this.container.removeEventListener('click', this._onClick, true);
  }

  updateBounds() {
    const containerHeight = this.container.clientHeight;
    const contentHeight = this.content.scrollHeight;
    
    this.maxY = 0;
    this.minY = Math.min(0, containerHeight - contentHeight);
    
    // 确保当前位置不越界
    this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
    this.content.style.transition = 'none'; // 布局更新导致的位移应瞬间完成
    this.applyTransform();
  }

  initEvents() {
    const onStart = (e) => {
      this.isDragging = true;
      this.hasMoved = false;
      const pageY = e.touches ? e.touches[0].pageY : e.pageY;
      this.startY = pageY;
      this.startScrollY = this.scrollY;
      this.content.style.transition = 'none'; // 确保拖拽开始时没有动画
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      
      // 阻止原生滚动和橡皮筋效果
      if (e.cancelable) e.preventDefault();
      
      const pageY = e.touches ? e.touches[0].pageY : e.pageY;
      const deltaY = pageY - this.startY;
      
      if (Math.abs(deltaY) > 5) {
        this.hasMoved = true;
      }

      let newY = this.startScrollY + deltaY;
      
      // 阻尼效果：超出边界时移动变慢
      if (newY > this.maxY) {
        newY = this.maxY + (newY - this.maxY) * 0.3;
      } else if (newY < this.minY) {
        newY = this.minY + (newY - this.minY) * 0.3;
      }
      
      this.scrollY = newY;
      this.applyTransform();
    };

    const onEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      
      // 回弹效果：只有在超出边界时才启用 transition
      if (this.scrollY > this.maxY || this.scrollY < this.minY) {
        this.content.style.transition = 'transform 0.3s ease-out';
        this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
      } else {
        // 正常范围停止，不需要 transition，避免干扰后续点击
        this.content.style.transition = 'none';
      }
      
      this.applyTransform();
      
      // hasMoved 不在这里重置，而是由 click 拦截器处理或延时重置
      // 确保后续的 click 事件能被正确拦截
      if (this.hasMoved) {
        setTimeout(() => {
          this.hasMoved = false;
        }, 100);
      }
    };

    // 拦截拖拽后的点击事件，防止误触
    this.container.addEventListener('click', (e) => {
      if (this.hasMoved) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.hasMoved = false;
      }
    }, true);

    // DOM 事件绑定
    this.container.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    
    this.container.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }

  applyTransform() {
    this.content.style.transform = `translateY(${this.scrollY}px)`;
  }
}
