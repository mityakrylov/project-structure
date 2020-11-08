import SortableTable from '../../../components/sortable-table/index.js';
import DoubleSlider from '../../../components/double-slider/index.js';

import header from './products-header.js';

export default class Page {
  element;
  subElements = {
    filterName: null,
    filterStatus: null,
  };
  components = {};
  form;

  initComponents() {
    const minPrice = 0;
    const maxPrice = 4000;

    const sortableTable = new SortableTable(header, {
      url: this.getTableUrl(minPrice, maxPrice),
      start: 0,
      step: 30,
      rowHrefFunc: item => `/products/${item.id}`,
    });

    const slider = new DoubleSlider({
      min: minPrice,
      max: maxPrice,
    });

    this.components.sortableTable = sortableTable;
    this.components.slider = slider;
  }

  async updateComponents(priceMin, priceMax, filterName, status) {
    const { sorted } = this.components.sortableTable;
    const url = this.getTableUrl(priceMin, priceMax, filterName, status);

    this.components.sortableTable.url = new URL(url, process.env.BACKEND_URL);
    await this.components.sortableTable.sortOnServer(sorted.id, sorted.order);
  }

  getTableUrl(priceMin, priceMax, filterName, status) {
    return `api/rest/products?_embed=subcategory.category&price_gte=${priceMin}&price_lte=${priceMax}`
      + (filterName ? `&title_like=${encodeURIComponent(filterName)}` : '')
      + (status ? `&status=${status}` : '');
  }

  getTemplate() {
    return `
      <div class="products-list">
        <div class="content__top-panel">
          <h1 class="page-title">Products</h1>
          <a href="/products/add" class="button-primary">Add product</a>
        </div>
        <div class="content-box content-box_small">
          <form class="form-inline">
            <div class="form-group">
              <label class="form-label">Filter:</label>
              <input type="text" data-element="filterName" class="form-control" placeholder="Product name">
            </div>
            <div class="form-group" data-element="slider">
              <label class="form-label">Price:</label>
            </div>
            <div class="form-group">
              <label class="form-label">Status:</label>
              <select class="form-control" data-element="filterStatus">
                <option value="" selected="">Any</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </form>
        </div>
        <div class="products-list__container" data-element="sortableTable">
        </div>
      </div>
    `;
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;

    this.subElements = this.getSubElements(this.element);
    this.form = this.element.querySelector('.form-inline');

    this.initComponents();
    this.renderComponents();

    this.initEventListeners();

    return this.element;
  }

  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];

      root.append(element);
    });
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners() {
    this.components.slider.element.addEventListener('range-select', this.onFormChange);
    this.subElements.filterName.addEventListener('input', this.onFormChange);
    this.subElements.filterStatus.addEventListener('change', this.onFormChange);

    this.form.addEventListener('submit', e => e.preventDefault());
  }

  onFormChange = async () => {
    const {from, to} = this.components.slider.selected;
    const filterName = this.subElements.filterName.value;
    const filterStatus = this.subElements.filterStatus.value;

    this.updateComponents(from, to, filterName, filterStatus);
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}

