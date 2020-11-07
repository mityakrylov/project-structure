import ProductForm from '../../../components/product-form/index.js';

export default class Page {
  element;
  productId = null; // TODO: здесь не обязательно присваивать null. Можно обойтись просто объявлением
  form;

  // TODO: было бы неплохо задать дефолтное значение для аргумента,
  // так как значение `productId` приходит в виде строки, можно задать пустую строку как значение
  // по умолчанию
  constructor(productId) {
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
