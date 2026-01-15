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
    this.startY = 0;
    this.startScrollY = 0;
    
    this.minY = 0; // 最大上滑位置 (负值)
    this.maxY = 0; // 初始位置
    
    this.initEvents();
  }

  updateBounds() {
    const containerHeight = this.container.clientHeight;
    const contentHeight = this.content.scrollHeight;
    
    this.maxY = 0;
    this.minY = Math.min(0, containerHeight - contentHeight);
    
    // 确保当前位置不越界
    this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
    this.applyTransform();
  }

  initEvents() {
    const onStart = (e) => {
      this.isDragging = true;
      const pageY = e.touches ? e.touches[0].pageY : e.pageY;
      this.startY = pageY;
      this.startScrollY = this.scrollY;
      this.content.style.transition = 'none'; // 拖拽时取消动画
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      
      const pageY = e.touches ? e.touches[0].pageY : e.pageY;
      const deltaY = pageY - this.startY;
      
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
      
      // 回弹效果
      this.content.style.transition = 'transform 0.3s ease-out';
      if (this.scrollY > this.maxY) {
        this.scrollY = this.maxY;
      } else if (this.scrollY < this.minY) {
        this.scrollY = this.minY;
      }
      this.applyTransform();
    };

    // DOM 事件绑定
    this.container.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    
    this.container.addEventListener('touchstart', onStart);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }

  applyTransform() {
    this.content.style.transform = `translateY(${this.scrollY}px)`;
  }
}
