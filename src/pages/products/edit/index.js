import ProductForm from '../../../components/product-form/index.js';

export default class Page {
  element;
  productId;
  form;

  constructor(productId = '') {
    this.productId = productId;

    this.form = new ProductForm(productId);
  }

  getTemplate() {
    return `
      <div class="products-edit">
          <div class="content__top-panel">
          <h1 class="page-title">
              <a href="/products" class="link">Products</a> / ${this.productId ? 'Edit' : 'Add'}
          </h1>
          </div>
          <div class="content-box"></div>
      </div>
    `;
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;

    await this.form.render();
    this.element.querySelector('.content-box').append(this.form.element);

    return this.element;
  }

  destroy() {
    this.form.destroy();
  }
}
