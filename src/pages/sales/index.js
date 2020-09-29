import RangePicker from '../../components/range-picker/index.js';
import SortableTable from '../../components/sortable-table/index.js';
import header from './sales-header.js';

export default class Page {
  element;
  subElements = {};
  components = {};

  initComponents() {
    const to = new Date();
    const from = new Date(to.getTime() - (30 * 24 * 60 * 60 * 1000));

    const rangePicker = new RangePicker({
      from,
      to
    });

    const sortableTable = new SortableTable(header, {
      url: this.getTableUrl(from, to),
      sorted: {
        id: 'createdAt',
        order: 'desc',
      },
      start: 0,
      step: 30,
    });

    this.components.rangePicker = rangePicker;
    this.components.sortableTable = sortableTable;
  }

  async updateComponents(from, to) {
    const {sorted, step} = this.components.sortableTable;
    this.components.sortableTable.url = new URL(this.getTableUrl(from, to), process.env.BACKEND_URL);
    await this.components.sortableTable.sortOnServer(sorted.id, sorted.order, 0, step);
  }

  getTableUrl(from, to) {
    return `api/rest/orders?createdAt_gte=${from.toISOString()}&createdAt_lte=${to.toISOString()}`;
  }

  getTemplate() {
    return `
      <div class="sales">
        <div class="content__top-panel">
            <h2 class="page-title">Sales</h2>
            <div data-element="rangePicker"></div>
        </div>
        <div data-element="sortableTable">
        </div>
      </div>
    `;
  }

  async render () {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;

    this.subElements = this.getSubElements(this.element);

    this.initComponents();
    this.renderComponents();

    this.initEventListeners();

    return this.element;
  }

  renderComponents () {
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
    this.components.rangePicker.element.addEventListener('date-select', event => {
      const { from, to } = event.detail;
      this.updateComponents(from, to);
    });
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}

