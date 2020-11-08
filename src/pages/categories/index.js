import SortableList from "../../components/sortable-list";
import NotificationMessage from "../../components/notification";

import fetchJson from '../../utils/fetch-json.js';

export default class Page {
  element;
  subElements = {};
  components = [];

  async render () {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;

    this.subElements = this.getSubElements(this.element);

    await this.renderComponents();

    this.initEventListeners();

    return this.element;
  }

  async renderComponents() {
    const categoriesData = await fetchJson(
      `${process.env.BACKEND_URL}api/rest/categories?_sort=weight&_refs=subcategory`
    );

    for (const category of categoriesData) {
      this.subElements.categoriesContainer.append(this.getCategoryItem(category));
    }
  }

  getTemplate() {
    return `
      <div class="categories">
        <div class="content__top-panel">
          <h2 class="page-title">Categories</h2>
        </div>
        <div data-element="categoriesContainer">
        </div>
      </div>
    `;
  }

  getCategoryItem(category) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getCategoryTemplate(category);
    const element = wrapper.firstElementChild;

    const sortableList = this.getSubcategoriesList(category.subcategories);
    this.components.push(sortableList);
    element.querySelector('.subcategory-list').append(sortableList.element);

    return element;
  }

  getCategoryTemplate(category) {
    return `
      <div class="category category_open" data-id=${category.id}>
        <header class="category__header">
          ${category.title}
        </header>
        <div class="category__body">
          <div class="subcategory-list">
          </div>
        </div>
      </div>
    `;
  }

  getSubcategoriesList(subcategories) {
    const subcategoryItems = subcategories.map(subcategory => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this.getSubcategoryTemplate(subcategory);
      return wrapper.firstElementChild;
    });

    return new SortableList({items: subcategoryItems});
  }

  getSubcategoryTemplate(subcategory) {
    return `
      <li class="categories__sortable-list-item sortable-list__item" data-grab-handle=""
          data-id=${subcategory.id}>
        <strong>${subcategory.title}</strong>
        <span><b>${subcategory.count}</b> products</span>
      </li>
    `;
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners() {
    document.addEventListener('sortable-list-reorder', this.onListReorder);

    this.element.addEventListener('click', this.onCategoryToggle);
  }

  onCategoryToggle = (event) => {
    const element = event.target.closest('div');
    if (!element.classList.contains('category')) {
      return;
    }

    element.classList.toggle('category_open');
  }

  onListReorder = async (event) => {
    const newSubcategories = [...event.target.childNodes].map((item, index) => {
      return {id: item.dataset.id, weight: index + 1};
    });

    try {
      await fetchJson(`${process.env.BACKEND_URL}api/rest/subcategories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSubcategories),
      });

      const notification = new NotificationMessage('Category order saved', {
        duration: 1000,
        type: 'success'
      });
      notification.show(event.target.closest('div'));

    } catch {
      const notification = new NotificationMessage('Category order save error', {
        duration: 1000,
        type: 'error'
      });
      notification.show(event.target.closest('div'));
    }
  }

  destroy() {
    document.removeEventListener('sortable-list-reorder', this.onListReorder);

    for (const list of this.components) {
      list.destroy();
    }
  }
}

