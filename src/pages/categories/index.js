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
      this.subElements.categoriesContainer.append(this.getCategoryItem(category))
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

  // TODO: такие методы лучше стараться дробить на более мелкие: один метод отвечает за хранение
  // тимплейта, другой за создание элемента, третий за добавление обработчиков событий и т.д
  getCategoryItem(category) {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = `
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

    const element = wrapper.firstElementChild;

    element.querySelector('.category__header').addEventListener('click', event => {
      event.target.closest('div').classList.toggle('category_open');
    });

    const subcategoryItems = category.subcategories.map(subcategory => this.getSubcategoryItem(subcategory));
    const sortableList = new SortableList({items: subcategoryItems});
    this.components.push(sortableList);

    element.querySelector('.subcategory-list').append(sortableList.element);

    return element;
  }

  getSubcategoryItem(subcategory) {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = `
      <li class="categories__sortable-list-item sortable-list__item" data-grab-handle=""
          data-id=${subcategory.id}>
        <strong>${subcategory.title}</strong>
        <span><b>${subcategory.count}</b> products</span>
      </li>
    `;

    return wrapper.firstElementChild;
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners() {
    document.addEventListener('sortable-list-reorder', this.onListReorder)
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

      // TODO: было бы неплохо вынести показ сообщения в отдельный метод, избавит от повторяющегося кода
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
    document.removeEventListener('sortable-list-reorder', this.onListReorder)

    for (const list of this.components) {
      list.destroy();
    }
  }
}

