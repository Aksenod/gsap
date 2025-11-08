const projectTitleInput = document.getElementById('project-title');
const projectTypeSelect = document.getElementById('project-type');
const projectSummaryInput = document.getElementById('project-summary');
const summaryCounter = document.getElementById('summary-counter');
const seoDescriptionInput = document.getElementById('seo-description');
const ogTitleInput = document.getElementById('og-title');
const themeSelect = document.getElementById('theme-select');
const fontSelect = document.getElementById('font-select');
const blocksList = document.getElementById('blocks-list');
const addBlockButton = document.getElementById('add-block');
const publishButton = document.getElementById('publish');
const copyLinkButton = document.getElementById('copy-link');
const publishStatus = document.getElementById('publish-status');
const preview = document.getElementById('preview');
const previewBody = document.getElementById('preview-body');
const previewUrl = document.getElementById('preview-url');
const previewMeta = document.getElementById('preview-meta');
const previewCounters = document.getElementById('preview-counters');
const previewStats = {
  views: previewCounters.querySelector('[data-stat="views"]'),
  copies: previewCounters.querySelector('[data-stat="copies"]'),
  opens: previewCounters.querySelector('[data-stat="opens"]')
};

const blockTemplate = document.getElementById('block-template');
const previewBlockTemplate = document.getElementById('preview-block-template');

const fontFallbacks = {
  Inter: "'Inter', 'Segoe UI', sans-serif",
  Manrope: "'Manrope', 'Segoe UI', sans-serif",
  'PT Serif': "'PT Serif', Georgia, serif"
};

const defaultBlocks = [
  {
    title: 'Главный экран',
    role: 'Показывает ключевую ценность продукта и CTA для перехода в основной сценарий.',
    autotext: '',
    image: '',
    imageName: ''
  },
  {
    title: 'Поток онбординга',
    role: 'Пошагово знакомит пользователя с функциональностью и ускоряет активацию.',
    autotext: '',
    image: '',
    imageName: ''
  },
  {
    title: 'Система карточек',
    role: 'Унифицированный компонент для презентации контента и акций.',
    autotext: '',
    image: '',
    imageName: ''
  }
];

const state = {
  meta: {
    title: '',
    type: '',
    summary: ''
  },
  settings: {
    theme: 'light',
    font: 'Inter',
    seo: '',
    og: ''
  },
  blocks: [],
  stats: {
    views: 0,
    copies: 0,
    opens: 0
  },
  publication: null
};

const urlCache = new Map();

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function isSupportedImageType(file) {
  if (!file) return false;
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return true;
  }
  if (!file.type && file.name) {
    return /\.(png|jpe?g|webp)$/i.test(file.name);
  }
  return false;
}

function invalidatePublication(message) {
  const wasPublished = Boolean(state.publication);
  if (wasPublished) {
    state.publication = null;
    state.stats.views = 0;
    state.stats.copies = 0;
    state.stats.opens = 0;
    copyLinkButton.disabled = true;
    if (message) {
      publishStatus.style.color = '#b45309';
      publishStatus.textContent = message;
    }
  } else if (publishStatus.textContent && publishStatus.style.color === '#dc2626') {
    publishStatus.textContent = '';
  }
  updatePreview();
}

function generateId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'novyy-keis';
}

function addBlock(data = {}) {
  const block = {
    id: generateId(),
    title: data.title || '',
    role: data.role || '',
    autotext: data.autotext || '',
    image: data.image || '',
    imageName: data.imageName || ''
  };
  state.blocks.push(block);
  renderBlocks();
  invalidatePublication('Изменения сохранены как черновик. Опубликуйте снова.');
}

function removeBlock(id) {
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index === -1) return;

  const [removed] = state.blocks.splice(index, 1);
  if (removed) {
    revokeBlockImage(removed);
  }
  renderBlocks();
  invalidatePublication('Изменения сохранены как черновик. Опубликуйте снова.');
}

function swapBlocks(indexA, indexB) {
  if (indexA < 0 || indexB < 0 || indexA >= state.blocks.length || indexB >= state.blocks.length) {
    return;
  }
  const temp = state.blocks[indexA];
  state.blocks[indexA] = state.blocks[indexB];
  state.blocks[indexB] = temp;
  renderBlocks();
  invalidatePublication('Изменения сохранены как черновик. Опубликуйте снова.');
}

function updateBlockImageUI(blockElement, block) {
  if (!blockElement) return;

  const imageHint = blockElement.querySelector('[data-image-hint]');
  if (imageHint) {
    imageHint.textContent = block.imageName
      ? `Выбрано: ${block.imageName}`
      : 'Поддерживаемые форматы: PNG, JPG, WebP';
  }

  const previewImage = blockElement.querySelector('[data-image-preview]');
  if (previewImage) {
    if (block.image) {
      previewImage.src = block.image;
      previewImage.hidden = false;
    } else {
      previewImage.removeAttribute('src');
      previewImage.hidden = true;
    }
  }

  const dropzoneContent = blockElement.querySelector('[data-dropzone-content]');
  if (dropzoneContent) {
    dropzoneContent.hidden = Boolean(block.image);
  }

  const dropzone = blockElement.querySelector('[data-dropzone]');
  if (dropzone) {
    dropzone.classList.toggle('has-image', Boolean(block.image));
    dropzone.classList.remove('is-dragover');
  }

  const clearButton = blockElement.querySelector('[data-action="clear-image"]');
  if (clearButton) {
    clearButton.hidden = !block.image;
  }
}

function revokeBlockImage(block) {
  if (block.image && urlCache.has(block.image)) {
    URL.revokeObjectURL(block.image);
    urlCache.delete(block.image);
  }
}

function setBlockImageFromFile(block, file, blockElement) {
  if (!file || !isSupportedImageType(file)) {
    publishStatus.style.color = '#dc2626';
    publishStatus.textContent = 'Загрузите файл PNG, JPG или WebP.';
    if (blockElement) {
      const fileInput = blockElement.querySelector('[data-field="image"]');
      if (fileInput) {
        fileInput.value = '';
      }
    }
    return false;
  }

  revokeBlockImage(block);

  const url = URL.createObjectURL(file);
  urlCache.set(url, true);
  block.image = url;
  block.imageName = file.name;

  if (blockElement) {
    updateBlockImageUI(blockElement, block);
    const fileInput = blockElement.querySelector('[data-field="image"]');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const wasPublished = Boolean(state.publication);
  invalidatePublication('Изображение обновлено. Опубликуйте кейс заново.');
  if (!wasPublished) {
    publishStatus.style.color = '#0369a1';
    publishStatus.textContent = 'Изображение добавлено к блоку.';
  }
  return true;
}

function clearBlockImage(block, blockElement) {
  if (!block.image) {
    return;
  }

  revokeBlockImage(block);
  block.image = '';
  block.imageName = '';

  if (blockElement) {
    updateBlockImageUI(blockElement, block);
    const fileInput = blockElement.querySelector('[data-field="image"]');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const wasPublished = Boolean(state.publication);
  invalidatePublication('Изображение удалено. Опубликуйте кейс заново.');
  if (!wasPublished) {
    publishStatus.style.color = '#0369a1';
    publishStatus.textContent = 'Изображение удалено из блока.';
  }
}

function renderBlocks() {
  blocksList.innerHTML = '';
  if (!state.blocks.length) {
    const placeholder = document.createElement('div');
    placeholder.className = 'empty-placeholder';
    placeholder.textContent = 'Добавьте блок, чтобы описать ключевые части продукта.';
    blocksList.appendChild(placeholder);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.blocks.forEach((block, index) => {
    const blockElement = blockTemplate.content.firstElementChild.cloneNode(true);
    blockElement.dataset.blockId = block.id;
    blockElement.querySelector('[data-block-index]').textContent = `#${index + 1}`;
    blockElement.querySelector('[data-block-name]').textContent = block.title || 'Без названия';

    const titleInput = blockElement.querySelector('[data-field="title"]');
    titleInput.value = block.title;

    const roleInput = blockElement.querySelector('[data-field="role"]');
    roleInput.value = block.role;

    const autotextArea = blockElement.querySelector('[data-field="autotext"]');
    autotextArea.value = block.autotext;

    updateBlockImageUI(blockElement, block);

    const moveUp = blockElement.querySelector('[data-action="move-up"]');
    const moveDown = blockElement.querySelector('[data-action="move-down"]');
    moveUp.disabled = index === 0;
    moveDown.disabled = index === state.blocks.length - 1;

    fragment.appendChild(blockElement);
  });

  blocksList.appendChild(fragment);
}

function renderPreviewPlaceholder() {
  previewBody.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = 'empty-placeholder';
  placeholder.textContent = 'Заполните данные проекта и блоки, чтобы увидеть превью лендинга.';
  previewBody.appendChild(placeholder);
}

function renderPreview() {
  const { title, type, summary } = state.meta;
  const filledBlocks = state.blocks.filter((block) => block.title || block.role || block.image || block.autotext);

  if (!title && !filledBlocks.length) {
    renderPreviewPlaceholder();
    return;
  }

  previewBody.innerHTML = '';

  const hero = document.createElement('section');
  hero.className = 'preview-hero';

  const heroTitle = document.createElement('h2');
  heroTitle.textContent = title || 'Без названия';

  const heroType = document.createElement('span');
  heroType.className = 'badge';
  heroType.textContent = type ? `Тип: ${type}` : 'Тип не выбран';

  const summaryParagraph = document.createElement('p');
  summaryParagraph.className = 'preview-summary';
  summaryParagraph.textContent = summary || 'Опишите цель проекта, аудиторию и основное решение.';

  hero.append(heroTitle, heroType, summaryParagraph);
  previewBody.appendChild(hero);

  if (filledBlocks.length) {
    const blocksWrapper = document.createElement('section');
    blocksWrapper.className = 'preview-blocks';

    filledBlocks.forEach((block) => {
      const blockElement = previewBlockTemplate.content.firstElementChild.cloneNode(true);
      blockElement.querySelector('[data-preview-title]').textContent = block.title || 'Без названия';
      blockElement.querySelector('[data-preview-role]').textContent = block.role || 'Опишите функцию блока.';

      const imageElement = blockElement.querySelector('[data-preview-image]');
      if (block.image) {
        imageElement.src = block.image;
        imageElement.hidden = false;
      } else {
        imageElement.hidden = true;
      }

      const autotextElement = blockElement.querySelector('[data-preview-autotext]');
      autotextElement.textContent = block.autotext || '';
      autotextElement.hidden = !block.autotext;

      blocksWrapper.appendChild(blockElement);
    });

    previewBody.appendChild(blocksWrapper);
  }

  if (state.settings.seo || state.settings.og || state.publication) {
    const statsWrapper = document.createElement('section');
    statsWrapper.className = 'preview-stats';

    if (state.settings.seo || state.settings.og) {
      const metaCard = document.createElement('div');
      metaCard.className = 'stat-card';
      metaCard.innerHTML = `
        <strong>Meta</strong>
        <span>SEO: ${state.settings.seo ? state.settings.seo.slice(0, 120) : '—'}</span>
        <span>OG: ${state.settings.og || '—'}</span>
      `;
      statsWrapper.appendChild(metaCard);
    }

    if (state.publication) {
      const statsGrid = document.createElement('div');
      statsGrid.className = 'stats-grid';

      ['views', 'copies', 'opens'].forEach((key) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
          <span>${key === 'views' ? 'Просмотры' : key === 'copies' ? 'Копирования' : 'Открытия'}</span>
          <strong>${state.stats[key]}</strong>
        `;
        statsGrid.appendChild(card);
      });

      statsWrapper.appendChild(statsGrid);
    }

    previewBody.appendChild(statsWrapper);
  }
}

function updatePreview() {
  preview.dataset.theme = state.settings.theme;
  preview.style.setProperty('--preview-font', fontFallbacks[state.settings.font]);

  const slug = state.publication?.slug || generateSlug(state.meta.title || 'новый кейс');
  const url = state.publication?.url || `https://case.example/${slug}`;
  previewUrl.textContent = url.replace('https://', '');

  const statusText = state.publication ? 'Опубликован' : 'Черновик';
  const themeText = state.settings.theme === 'dark' ? 'тёмная' : 'светлая';
  previewMeta.textContent = `${statusText} • тема: ${themeText} • шрифт: ${state.settings.font}`;

  if (state.publication) {
    previewCounters.hidden = false;
    previewStats.views.textContent = state.stats.views;
    previewStats.copies.textContent = state.stats.copies;
    previewStats.opens.textContent = state.stats.opens;
  } else {
    previewCounters.hidden = true;
  }

  renderPreview();
}

function updateSummaryCounter() {
  const length = projectSummaryInput.value.length;
  summaryCounter.textContent = `${length} / ${projectSummaryInput.maxLength}`;
}

function handleBlockInput(event) {
  const target = event.target;
  const blockElement = target.closest('[data-block-id]');
  if (!blockElement) return;
  const blockId = blockElement.dataset.blockId;
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block) return;

  let changed = false;

  if (target.matches('[data-field="title"]')) {
    block.title = target.value;
    blockElement.querySelector('[data-block-name]').textContent = block.title || 'Без названия';
    changed = true;
  }

  if (target.matches('[data-field="role"]')) {
    block.role = target.value;
    changed = true;
  }

  if (target.matches('[data-field="autotext"]')) {
    block.autotext = target.value;
    changed = true;
  }

  if (changed) {
    invalidatePublication('Изменения сохранены как черновик. Опубликуйте снова.');
  }
}

function handleBlockChange(event) {
  const target = event.target;
  const blockElement = target.closest('[data-block-id]');
  if (!blockElement) return;
  const blockId = blockElement.dataset.blockId;
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block) return;

  if (target.matches('[data-field="image"]')) {
    const file = target.files?.[0];
    if (!file) return;

    setBlockImageFromFile(block, file, blockElement);
  }
}

function handleBlockClick(event) {
  const dropzone = event.target.closest('[data-dropzone]');
  if (dropzone && !event.target.closest('button')) {
    const blockElement = dropzone.closest('[data-block-id]');
    if (blockElement) {
      const fileInput = blockElement.querySelector('[data-field="image"]');
      if (fileInput) {
        fileInput.click();
        return;
      }
    }
  }

  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const blockElement = actionButton.closest('[data-block-id]');
  if (!blockElement) return;

  const blockId = blockElement.dataset.blockId;
  const index = state.blocks.findIndex((block) => block.id === blockId);
  if (index === -1) return;
  const block = state.blocks[index];

  const action = actionButton.dataset.action;

  switch (action) {
    case 'remove':
      removeBlock(blockId);
      break;
    case 'move-up':
      swapBlocks(index, index - 1);
      break;
    case 'move-down':
      swapBlocks(index, index + 1);
      break;
    case 'upload': {
      const fileInput = blockElement.querySelector('[data-field="image"]');
      if (fileInput) {
        fileInput.click();
      }
      break;
    }
    case 'clear-image':
      clearBlockImage(block, blockElement);
      break;
    case 'generate':
      handleAutotextGeneration(blockId, blockElement);
      break;
    default:
      break;
  }
}

function handleDropzoneDragEnter(event) {
  const dropzone = event.target.closest('[data-dropzone]');
  if (!dropzone) return;
  event.preventDefault();
  dropzone.classList.add('is-dragover');
}

function handleDropzoneDragOver(event) {
  const dropzone = event.target.closest('[data-dropzone]');
  if (!dropzone) return;
  event.preventDefault();
  dropzone.classList.add('is-dragover');
}

function handleDropzoneDragLeave(event) {
  const dropzone = event.target.closest('[data-dropzone]');
  if (!dropzone) return;
  if (event.relatedTarget && dropzone.contains(event.relatedTarget)) {
    return;
  }
  dropzone.classList.remove('is-dragover');
}

function handleDropzoneDrop(event) {
  const dropzone = event.target.closest('[data-dropzone]');
  if (!dropzone) return;
  event.preventDefault();
  dropzone.classList.remove('is-dragover');

  const blockElement = dropzone.closest('[data-block-id]');
  if (!blockElement) return;
  const blockId = blockElement.dataset.blockId;
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block) return;

  const file = event.dataTransfer?.files?.[0];
  if (!file) return;

  setBlockImageFromFile(block, file, blockElement);
}

function handleBlockKeydown(event) {
  if (!(event.key === 'Enter' || event.key === ' ')) {
    return;
  }

  const dropzone = event.target.closest('[data-dropzone]');
  if (!dropzone) {
    return;
  }

  event.preventDefault();
  const blockElement = dropzone.closest('[data-block-id]');
  if (!blockElement) return;
  const fileInput = blockElement.querySelector('[data-field="image"]');
  if (fileInput) {
    fileInput.click();
  }
}

function handleAutotextGeneration(blockId, blockElement) {
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block) return;

  const title = block.title || 'Этот блок';
  const role = block.role || 'объясняет ключевой сценарий';
  const projectType = state.meta.type || 'digital-продукта';
  const summary = state.meta.summary ? ` Решает задачу: ${state.meta.summary.slice(0, 140)}...` : '';

  block.autotext = `${title} демонстрирует, как ${role.toLowerCase()} в ${projectType}.${summary}`;

  const autotextArea = blockElement.querySelector('[data-field="autotext"]');
  if (autotextArea) {
    autotextArea.value = block.autotext;
  }

  invalidatePublication('Автотекст обновлён. Опубликуйте кейс заново.');
}

function validateBeforePublish() {
  const errors = [];

  if (!state.meta.title.trim()) {
    errors.push('Заполните название кейса.');
  }

  if (!state.meta.type) {
    errors.push('Выберите тип проекта.');
  }

  const filledBlocks = state.blocks.filter((block) => block.title && block.role && block.image);
  if (!filledBlocks.length) {
    errors.push('Добавьте хотя бы один заполненный блок с изображением.');
  }

  return errors;
}

function publishProject() {
  const errors = validateBeforePublish();
  if (errors.length) {
    publishStatus.textContent = errors.join(' ');
    publishStatus.style.color = '#dc2626';
    return;
  }

  const slug = generateSlug(state.meta.title);
  const url = `https://case.example/${slug}`;

  state.publication = {
    slug,
    url,
    publishedAt: new Date().toISOString()
  };

  state.stats.views = 0;
  state.stats.copies = 0;
  state.stats.opens = 1;

  copyLinkButton.disabled = false;
  publishStatus.style.color = '#065f46';
  publishStatus.textContent = 'Кейс опубликован! Скопируйте ссылку и поделитесь ей.';
  previewCounters.hidden = false;
  updatePreview();
}

async function copyShareLink() {
  if (!state.publication) return;
  try {
    await navigator.clipboard.writeText(state.publication.url);
    publishStatus.style.color = '#0369a1';
    publishStatus.textContent = 'Ссылка скопирована в буфер обмена.';
    state.stats.copies += 1;
    previewStats.copies.textContent = state.stats.copies;
  } catch (error) {
    publishStatus.style.color = '#dc2626';
    publishStatus.textContent = 'Не удалось скопировать ссылку. Скопируйте её вручную.';
  }
}

function syncMetaFromInputs() {
  state.meta.title = projectTitleInput.value;
  state.meta.type = projectTypeSelect.value;
  state.meta.summary = projectSummaryInput.value;
  state.settings.seo = seoDescriptionInput.value;
  state.settings.og = ogTitleInput.value;
  state.settings.theme = themeSelect.value;
  state.settings.font = fontSelect.value;
  invalidatePublication('Настройки обновлены. Опубликуйте кейс заново.');
}

function setupEventListeners() {
  projectTitleInput.addEventListener('input', syncMetaFromInputs);
  projectTypeSelect.addEventListener('change', syncMetaFromInputs);
  projectSummaryInput.addEventListener('input', () => {
    updateSummaryCounter();
    syncMetaFromInputs();
  });

  seoDescriptionInput.addEventListener('input', syncMetaFromInputs);
  ogTitleInput.addEventListener('input', syncMetaFromInputs);
  themeSelect.addEventListener('change', syncMetaFromInputs);
  fontSelect.addEventListener('change', syncMetaFromInputs);

  blocksList.addEventListener('input', handleBlockInput);
  blocksList.addEventListener('change', handleBlockChange);
  blocksList.addEventListener('click', handleBlockClick);
  blocksList.addEventListener('keydown', handleBlockKeydown);
  blocksList.addEventListener('dragenter', handleDropzoneDragEnter);
  blocksList.addEventListener('dragover', handleDropzoneDragOver);
  blocksList.addEventListener('dragleave', handleDropzoneDragLeave);
  blocksList.addEventListener('drop', handleDropzoneDrop);

  addBlockButton.addEventListener('click', () => addBlock());
  publishButton.addEventListener('click', publishProject);
  copyLinkButton.addEventListener('click', copyShareLink);
}

function init() {
  setupEventListeners();
  updateSummaryCounter();
  defaultBlocks.forEach((block) => addBlock(block));
  syncMetaFromInputs();
}

init();
