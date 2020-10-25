export default class DoubleSlider {
  element;

  selected = {
    from: 0,
    to: 0,
  }

  position = {
    thumb: null,
    maxValue: 0,
    sliderLeft: 0,
    sliderWidth: 0,
  };

  subElements = {
    from: null,
    to: null,
    inner: null,
    progress: null,
    thumbLeft: null,
    thumbRight: null,
  }

  constructor({
    min = 100,
    max = 200,
    selected = {},
    formatValue = value => '$' + value
  } = {}) {
    this.min = min;
    this.max = max;
    this.selected.from = selected.from !== undefined ? selected.from : this.min;
    this.selected.to = selected.to !== undefined ? selected.to : this.max;
    this.formatValue = formatValue;

    this.render();
    this.renderInitialSelection();
    this.initEventListeners();
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;

    this.subElements = this.getSubElements(this.element);
  }

  renderInitialSelection() {
    if (this.selected.from) {
      const styleLeft = (this.selected.from - this.min) / (this.max - this.min) * 100;
      this.subElements.thumbLeft.style.left = `${styleLeft}%`;
      this.subElements.progress.style.left = `${styleLeft}%`;
    }
    if (this.selected.to) {
      const styleRight = (this.max - this.selected.to) / (this.max - this.min) * 100;
      this.subElements.thumbRight.style.right = `${styleRight}%`;
      this.subElements.progress.style.right = `${styleRight}%`;
    }

    this.subElements.from.innerHTML = this.formatValue(this.selected.from);
    this.subElements.to.innerHTML = this.formatValue(this.selected.to);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  getTemplate() {
    return `
      <div class="range-slider">
        <span data-element="from">${this.formatValue(this.min)}</span>
        <div data-element="inner" class="range-slider__inner">
          <span data-element="progress" class="range-slider__progress" style="left: 0; right: 0;"></span>
          <span data-element="thumbLeft" class="range-slider__thumb-left" style="left: 0;"></span>
          <span data-element="thumbRight" class="range-slider__thumb-right" style="right: 0;"></span>
        </div>
        <span data-element="to">${this.formatValue(this.max)}</span>
      </div>
    `;
  }

  initEventListeners() {
    this.subElements.thumbLeft.addEventListener('pointerdown', this.onMouseDown);
    this.subElements.thumbRight.addEventListener('pointerdown', this.onMouseDown);
  }

  onMouseDown = event => {
    // // предотвратить запуск выделения (действие браузера)
    event.preventDefault();

    let maxValue = event.target === this.subElements.thumbLeft
      ? 100 - parseFloat(this.subElements.progress.style.right)
      : 100 - parseFloat(this.subElements.progress.style.left);

    this.position = {
      thumb: event.target,
      maxValue: maxValue,
      sliderLeft: this.subElements.inner.getBoundingClientRect().left,
      sliderWidth: this.subElements.inner.getBoundingClientRect().width,
    };

    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onMouseUp);
  }


  onMouseMove = event => {
    const { clientX } = event;
    const { thumb, sliderLeft, sliderWidth, maxValue } = this.position;

    let newValue = thumb === this.subElements.thumbLeft
      ? (clientX - sliderLeft) / sliderWidth * 100
      : 100 - (clientX - sliderLeft) / sliderWidth * 100;

    if (newValue < 0) {
      newValue = 0;
    }
    if (newValue > maxValue) {
      newValue = maxValue;
    }

    if (thumb === this.subElements.thumbLeft) {
      this.subElements.thumbLeft.style.left = `${newValue}%`;
      this.subElements.progress.style.left = `${newValue}%`;
    } else {
      this.subElements.thumbRight.style.right = `${newValue}%`;
      this.subElements.progress.style.right = `${newValue}%`;
    }
    this.updateSelected();
  };

  updateSelected() {
    const rangeWidth = this.max - this.min;
    this.selected.from = Math.round(this.min + parseFloat(this.subElements.progress.style.left) / 100 * rangeWidth);
    this.selected.to = Math.round(this.max - parseFloat(this.subElements.progress.style.right) / 100 * rangeWidth);

    this.subElements.from.innerHTML = this.formatValue(this.selected.from);
    this.subElements.to.innerHTML = this.formatValue(this.selected.to);
  }

  onMouseUp = () => {
    const customEvent = new CustomEvent('range-select', { detail: this.selected, bubbles: true });
    this.element.dispatchEvent(customEvent);

    this.removeListeners();
  };

  remove () {
    this.element.remove();
  }

  removeListeners () {
    document.removeEventListener('pointerup', this.onMouseUp);
    document.removeEventListener('pointermove', this.onMouseMove);
  }

  destroy() {
    this.remove();
    this.removeListeners();
  }
}
