// Cleaned category options (duplications removed)
const CATEGORIES = ["General", "Ideas", "Notes"];

let wishes = JSON.parse(localStorage.getItem('ka_wishes')) || [];
let activeTab = 'all';
let filterOwner = 'all';
let selectedOwner = 'kirti';
let selectedCategory = CATEGORIES[0];
let activeModalCardId = null;

// DOM Elements
const cardsContainer = document.getElementById('cards-container');
const archivedContainer = document.getElementById('archived-container');
const archivedGrid = document.getElementById('archived-grid');
const toggleArchivedBtn = document.getElementById('toggle-archived-btn');
const categoryChipsContainer = document.getElementById('category-chips');
const customCategoryInput = document.getElementById('new-category-custom');
const modalBackdrop = document.getElementById('modal-backdrop');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryChips();
  setupEventListeners();
  renderCards();
});

function renderCategoryChips() {
  categoryChipsContainer.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `category-chip ${selectedCategory === cat ? 'selected' : ''}`;
    chip.textContent = cat;
    chip.onclick = () => selectCategory(cat);
    categoryChipsContainer.appendChild(chip);
  });

  // Custom option
  const customChip = document.createElement('button');
  customChip.type = 'button';
  customChip.className = `category-chip new-chip ${selectedCategory === 'custom' ? 'selected' : ''}`;
  customChip.textContent = '+ Custom';
  customChip.onclick = () => selectCategory('custom');
  categoryChipsContainer.appendChild(customChip);
}

function selectCategory(cat) {
  selectedCategory = cat;
  if (cat === 'custom') {
    customCategoryInput.style.display = 'block';
    customCategoryInput.focus();
  } else {
    customCategoryInput.style.display = 'none';
  }
  renderCategoryChips();
}

function setupEventListeners() {
  // Owner Buttons
  const btnKirti = document.getElementById('btn-kirti');
  const btnAmol = document.getElementById('btn-amol');
  const btnTogether = document.getElementById('btn-together');

  btnKirti.onclick = () => setOwner('kirti');
  btnAmol.onclick = () => setOwner('amol');
  btnTogether.onclick = () => setOwner('together');

  // Navigation Tabs
  document.querySelectorAll('nav .tab-btn').forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll('nav .tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeTab = e.target.getAttribute('data-tab');
      renderCards();
    };
  });

  // Filter Owner
  document.getElementById('filter-owner').onchange = (e) => {
    filterOwner = e.target.value;
    renderCards();
  };

  // Add Item
  document.getElementById('add-wish-btn').onclick = addWish;

  // Toggle Archived View
  toggleArchivedBtn.onclick = () => {
    const isHidden = archivedContainer.style.display === 'none';
    archivedContainer.style.display = isHidden ? 'block' : 'none';
    toggleArchivedBtn.textContent = isHidden ? 'Hide Completed Cards' : 'Show Completed Cards';
  };

  // Close Modal on Backdrop Click
  modalBackdrop.onclick = closeModal;
}

function setOwner(owner) {
  selectedOwner = owner;
  document.getElementById('btn-kirti').className = owner === 'kirti' ? 'sel-kirti' : '';
  document.getElementById('btn-amol').className = owner === 'amol' ? 'sel-amol' : '';
  document.getElementById('btn-together').className = owner === 'together' ? 'sel-together' : '';
}

function addWish() {
  const titleInput = document.getElementById('wish-title');
  const descInput = document.getElementById('wish-desc');
  const title = titleInput.value.trim();
  const desc = descInput.value.trim();

  if (!title) return;

  let category = selectedCategory;
  if (category === 'custom') {
    category = customCategoryInput.value.trim() || 'General';
  }

  const newWish = {
    id: Date.now().toString(),
    title,
    desc,
    owner: selectedOwner,
    category,
    tabCategory: activeTab === 'all' ? 'things to do' : activeTab,
    completed: false
  };

  wishes.unshift(newWish);
  saveWishes();
  
  titleInput.value = '';
  descInput.value = '';
  customCategoryInput.value = '';
  selectCategory(CATEGORIES[0]);

  renderCards();
}

function toggleComplete(id, e) {
  if(e) e.stopPropagation();
  const wish = wishes.find(w => w.id === id);
  if (wish) {
    wish.completed = !wish.completed;
    saveWishes();
    closeModal();
    renderCards();
  }
}

function deleteWish(id, e) {
  if(e) e.stopPropagation();
  wishes = wishes.filter(w => w.id !== id);
  saveWishes();
  closeModal();
  renderCards();
}

function saveWishes() {
  localStorage.setItem('ka_wishes', JSON.stringify(wishes));
}

function renderCards() {
  cardsContainer.innerHTML = '';
  archivedGrid.innerHTML = '';

  const activeWishes = wishes.filter(w => !w.completed);
  const completedWishes = wishes.filter(w => w.completed);

  // Filter Active Cards
  const filteredActive = activeWishes.filter(w => {
    const matchesTab = activeTab === 'all' || w.tabCategory === activeTab;
    const matchesOwner = filterOwner === 'all' || w.owner === filterOwner;
    return matchesTab && matchesOwner;
  });

  if (filteredActive.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty">
        <h3>No wishes found</h3>
        <p>Add a new wish card above!</p>
      </div>`;
  } else {
    // Group by category
    const grouped = {};
    filteredActive.forEach(w => {
      if (!grouped[w.category]) grouped[w.category] = [];
      grouped[w.category].push(w);
    });

    Object.keys(grouped).forEach(cat => {
      const block = document.createElement('div');
      block.className = 'category-block';

      const heading = document.createElement('div');
      heading.className = 'category-heading';
      heading.innerHTML = `
        <span class="chevron">▼</span>
        <h2>${cat}</h2>
        <span class="count">${grouped[cat].length}</span>
      `;
      heading.onclick = () => block.classList.toggle('collapsed');

      const grid = document.createElement('div');
      grid.className = 'grid';

      grouped[cat].forEach(w => {
        grid.appendChild(createCardElement(w));
      });

      block.appendChild(heading);
      block.appendChild(grid);
      cardsContainer.appendChild(block);
    });
  }

  // Render Completed Items
  completedWishes.forEach(w => {
    archivedGrid.appendChild(createCardElement(w));
  });
}

function createCardElement(wish) {
  const card = document.createElement('div');
  card.className = `card ${wish.owner}`;
  card.id = `card-${wish.id}`;
  
  card.innerHTML = `
    <div class="stamp">${wish.owner === 'together' ? '' : wish.owner.toUpperCase()}</div>
    <div class="owner-tag">${wish.owner}</div>
    <h3>${wish.title}</h3>
    <p>${wish.desc || ''}</p>
    <div class="card-actions">
      <button class="btn-primary" onclick="toggleComplete('${wish.id}', event)">
        ${wish.completed ? 'Reopen' : 'Done'}
      </button>
      <button class="btn-danger" onclick="deleteWish('${wish.id}', event)">Delete</button>
    </div>
    <div class="folded-corner"></div>
  `;

  card.onclick = () => openModal(wish.id);
  return card;
}

function openModal(id) {
  activeModalCardId = id;
  const wish = wishes.find(w => w.id === id);
  if (!wish) return;

  const cardElem = document.getElementById(`card-${id}`);
  if (cardElem) {
    cardElem.classList.add('wish-modal');
  }
  
  document.querySelectorAll(`.card:not(#card-${id})`).forEach(c => c.classList.add('blurred'));
  modalBackdrop.style.display = 'block';
}

function closeModal() {
  if (activeModalCardId) {
    const cardElem = document.getElementById(`card-${activeModalCardId}`);
    if (cardElem) cardElem.classList.remove('wish-modal');
    activeModalCardId = null;
  }
  document.querySelectorAll('.card').forEach(c => c.classList.remove('blurred'));
  modalBackdrop.style.display = 'none';
}
