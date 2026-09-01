// ---------- FIREBASE ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getDatabase, ref, push, set, update, remove, onValue
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVorM-j93BkCNcTzpS54xzevhxHFtyYWI",
  authDomain: "test-1-bcddf.firebaseapp.com",
  databaseURL: "https://test-1-bcddf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-1-bcddf",
  storageBucket: "test-1-bcddf.firebasestorage.app",
  messagingSenderId: "977777408468",
  appId: "1:977777408468:web:2319ec4bda8b267693be41"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const wishesRef = ref(db, 'wishes');

// ---------- STORAGE ----------
let wishes = [];

// Dynamic single-word categories
const DEFAULT_CATEGORIES = ["Destinations", "Watchlist", "Wishlist", "Activities"];
const UNCATEGORIZED = "Uncategorized";

function cryptoId(){
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---------- STATE ----------
let selectedOwner = 'kirti';
let selectedCategory = DEFAULT_CATEGORIES[0];
let showArchived = false;
let mainFilter = 'all';
let completedFilter = 'all';
let expandedCardId = null;
let collapsedCategories = new Set();

const connectionStatusEl = () => document.getElementById('connection-status');

onValue(wishesRef, (snapshot) => {
  const data = snapshot.val() || {};
  wishes = Object.keys(data).map(id => ({ id, ...data[id] }));
  const status = connectionStatusEl();
  if(status){ status.textContent = '🟢 Synced'; status.classList.remove('offline'); }
  render();
}, (error) => {
  console.error('Firebase read failed:', error);
  const status = connectionStatusEl();
  if(status){ status.textContent = '🔴 Offline / sync error'; status.classList.add('offline'); }
});

// ---------- STARRY BACKGROUND ----------
function spawnShootingStars(){
  const field = document.getElementById('star-field');
  if(!field) return;
  const count = 3;
  for(let i=0; i<count; i++){
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.setProperty('--y', `${5 + Math.random()*40}%`);
    star.style.setProperty('--delay', `${Math.random()*7}s`);
    star.style.animationDuration = `${6 + Math.random()*4}s`;
    field.appendChild(star);
  }
}
spawnShootingStars();

function allCategories(){
  const used = wishes.map(w => w.category || UNCATEGORIZED);
  const set = new Set([...DEFAULT_CATEGORIES, ...used]);
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function populateCategoryUI(){
  const cats = allCategories();

  const chipContainer = document.getElementById('category-chips');
  const customInput = document.getElementById('new-category-custom');
  if(chipContainer){
    const isCustomSelected = selectedCategory === '__custom__';
    chipContainer.innerHTML = cats.map(c => `
      <button type="button" class="category-chip${selectedCategory === c ? ' selected' : ''}" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>
    `).join('') + `
      <button type="button" class="category-chip new-chip${isCustomSelected ? ' selected' : ''}" data-category="__custom__">+ New</button>
    `;
    chipContainer.querySelectorAll('.category-chip').forEach(chip => {
      chip.onclick = () => {
        selectedCategory = chip.getAttribute('data-category');
        const showCustom = selectedCategory === '__custom__';
        customInput.style.display = showCustom ? '' : 'none';
        if(showCustom) customInput.focus();
        populateCategoryUI();
      };
    });
  }

  // filter dropdowns without "All categories" text prefix
  [['main-filter', mainFilter], ['completed-filter', completedFilter]].forEach(([id, current]) => {
    const sel = document.getElementById(id);
    const prev = sel.value || current;
    sel.innerHTML = `<option value="all">All</option>` +
      cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if(cats.includes(prev) || prev === 'all') sel.value = prev;
  });
}

// ---------- NAV ----------
const navMain = document.getElementById('nav-main');
const navCompleted = document.getElementById('nav-completed');
const pageMain = document.getElementById('page-main');
const pageCompleted = document.getElementById('page-completed');

navMain.onclick = () => {
  navMain.classList.add('active');
  navCompleted.classList.remove('active');
  pageMain.style.display = '';
  pageCompleted.style.display = 'none';
  render();
};
navCompleted.onclick = () => {
  navCompleted.classList.add('active');
  navMain.classList.remove('active');
  pageCompleted.style.display = '';
  pageMain.style.display = 'none';
  render();
};

// ---------- ADD FORM ----------
const pickKirti = document.getElementById('pick-kirti');
const pickAmol = document.getElementById('pick-amol');
const pickTogether = document.getElementById('pick-together');

function setOwnerButtons(owner){
  selectedOwner = owner;
  pickKirti.classList.toggle('sel-kirti', owner === 'kirti');
  pickAmol.classList.toggle('sel-amol', owner === 'amol');
  pickTogether.classList.toggle('sel-together', owner === 'together');
}

pickKirti.onclick = () => setOwnerButtons('kirti');
pickAmol.onclick = () => setOwnerButtons('amol');
pickTogether.onclick = () => setOwnerButtons('together');

document.getElementById('add-wish').onclick = () => {
  const titleEl = document.getElementById('new-title');
  const descEl = document.getElementById('new-desc');
  const customCatEl = document.getElementById('new-category-custom');
  const title = titleEl.value.trim();
  if(!title){
    titleEl.focus();
    titleEl.style.borderColor = '#ff5f6d';
    setTimeout(()=> titleEl.style.borderColor = '', 900);
    return;
  }

  let category;
  if(selectedCategory === '__custom__'){
    category = customCatEl.value.trim();
    if(!category){
      customCatEl.focus();
      customCatEl.style.borderColor = '#ff5f6d';
      setTimeout(()=> customCatEl.style.borderColor = '', 900);
      return;
    }
  } else {
    category = selectedCategory || UNCATEGORIZED;
  }

  const newWishRef = push(wishesRef);
  set(newWishRef, {
    title,
    desc: descEl.value.trim(),
    owner: selectedOwner,
    status: 'active',
    category,
    createdAt: Date.now()
  }).catch(err => alert('Could not save wish — check your connection.\n' + err.message));

  titleEl.value = '';
  descEl.value = '';
  customCatEl.value = '';
  selectedCategory = DEFAULT_CATEGORIES[0];
  customCatEl.style.display = 'none';
  populateCategoryUI();
};

function closeExpandedOverlay(){
  closeWishModal();
}

// ---------- ACTIONS ----------
function completeWish(id){
  if(expandedCardId === id) closeExpandedOverlay();
  update(ref(db, `wishes/${id}`), { status: 'completed' })
    .catch(err => alert('Could not update wish.\n' + err.message));
}
function deleteWish(id){
  if(expandedCardId === id) closeExpandedOverlay();
  remove(ref(db, `wishes/${id}`))
    .catch(err => alert('Could not delete wish.\n' + err.message));
}
function editWish(id){
  const w = wishes.find(x=>x.id===id);
  if(!w) return;
  const newTitle = prompt('Edit wish:', w.title);
  if(newTitle===null) return;
  const trimmed = newTitle.trim();
  if(!trimmed) return;
  const newDesc = prompt('Edit details (optional):', w.desc || '');
  const newCat = prompt('Edit category:', w.category || UNCATEGORIZED);

  const updates = { title: trimmed };
  if(newDesc!==null) updates.desc = newDesc.trim();
  if(newCat!==null) updates.category = newCat.trim() || UNCATEGORIZED;

  const wasOpen = expandedCardId === id;
  closeExpandedOverlay();
  update(ref(db, `wishes/${id}`), updates)
    .then(() => { if(wasOpen) openWishModal(id); })
    .catch(err => alert('Could not save changes.\n' + err.message));
}
function revertWish(id){
  if(expandedCardId === id) closeExpandedOverlay();
  update(ref(db, `wishes/${id}`), { status: 'active' })
    .catch(err => alert('Could not update wish.\n' + err.message));
}
function archiveWish(id){
  if(expandedCardId === id) closeExpandedOverlay();
  update(ref(db, `wishes/${id}`), { status: 'archived' })
    .catch(err => alert('Could not archive wish.\n' + err.message));
}
function unarchiveWish(id){
  if(expandedCardId === id) closeExpandedOverlay();
  update(ref(db, `wishes/${id}`), { status: 'completed' })
    .catch(err => alert('Could not unarchive wish.\n' + err.message));
}

// ---------- WISH DETAIL MODAL ----------
function openWishModal(id){
  const w = wishes.find(x=>x.id===id);
  if(!w) return;

  closeWishModal();

  expandedCardId = id;
  const cardEl = document.querySelector(`.card[data-id="${id}"]`);
  if(cardEl) cardEl.classList.add('blurred');

  const backdrop = document.createElement('div');
  backdrop.id = 'card-backdrop';
  backdrop.className = 'card-backdrop';
  backdrop.onclick = closeWishModal;
  document.body.appendChild(backdrop);

  const modal = document.createElement('div');
  modal.id = 'wish-modal';
  modal.className = `card wish-modal ${w.owner}`;
  modal.setAttribute('data-id', w.id);
  modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = wishDetailHTML(w);
  document.body.appendChild(modal);
}

function closeWishModal(){
  if(expandedCardId){
    const cardEl = document.querySelector(`.card[data-id="${expandedCardId}"]`);
    if(cardEl) cardEl.classList.remove('blurred');
  }
  expandedCardId = null;
  const backdrop = document.getElementById('card-backdrop');
  if(backdrop) backdrop.remove();
  const modal = document.getElementById('wish-modal');
  if(modal) modal.remove();
}

function actionsHTML(w){
  if(w.status === 'active'){
    return `
      <div class="card-actions">
        <button class="btn-primary" onclick="completeWish('${w.id}')">Complete</button>
        <button class="btn-ghost" onclick="editWish('${w.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteWish('${w.id}')">Delete</button>
      </div>`;
  } else if(w.status === 'completed'){
    return `
      <div class="card-actions">
        <button class="btn-ghost" onclick="revertWish('${w.id}')">Revert</button>
        <button class="btn-ghost" onclick="archiveWish('${w.id}')">Archive</button>
        <button class="btn-danger" onclick="deleteWish('${w.id}')">Delete</button>
      </div>`;
  } else if(w.status === 'archived'){
    return `
      <div class="card-actions">
        <button class="btn-ghost" onclick="unarchiveWish('${w.id}')">Unarchive</button>
        <button class="btn-danger" onclick="deleteWish('${w.id}')">Delete</button>
      </div>`;
  }
  return '';
}

function ownerLabel(owner){
  if(owner === 'kirti') return "Kirti's";
  if(owner === 'amol') return "Amol's";
  return "Kirti & Amol's";
}

// Detailed modal view
function wishDetailHTML(w){
  const stampText = w.status === 'completed' ? 'DONE' : (w.status === 'archived' ? 'ARCHIVED' : 'ACTIVE');
  return `
    <div class="stamp">${stampText}</div>
    <div class="owner-tag">${ownerLabel(w.owner)}</div>
    <h3>${escapeHTML(w.title)}</h3>
    <p>${escapeHTML(w.desc || '')}</p>
    ${actionsHTML(w)}
  `;
}

// Compact card structure
function cardHTML(w){
  const theme = w.owner;
  const stampText = w.status === 'completed' ? 'DONE' : (w.status === 'archived' ? 'ARCHIVED' : 'ACTIVE');

  return `
    <div class="card ${theme}" data-id="${w.id}" onclick="openWishModal('${w.id}')">
      <div class="stamp">${stampText}</div>
      <div class="owner-tag">${ownerLabel(w.owner)}</div>
      <h3>${escapeHTML(w.title)}</h3>
      <div class="folded-corner"></div>
    </div>
  `;
}

function groupByCategory(list){
  const groups = {};
  list.forEach(w => {
    const cat = w.category || UNCATEGORIZED;
    if(!groups[cat]) groups[cat] = [];
    groups[cat].push(w);
  });
  return Object.keys(groups).sort((a,b)=>a.localeCompare(b)).map(cat => ({cat, items: groups[cat]}));
}

function toggleCategory(key){
  if(collapsedCategories.has(key)) collapsedCategories.delete(key);
  else collapsedCategories.add(key);
  render();
}

function renderGrouped(containerEl, list, sectionPrefix){
  if(!list.length){
    containerEl.innerHTML = '';
    return;
  }
  const groups = groupByCategory(list);
  containerEl.innerHTML = groups.map(g => {
    const key = `${sectionPrefix}::${g.cat}`;
    const isCollapsed = collapsedCategories.has(key);
    return `
    <div class="category-block${isCollapsed ? ' collapsed' : ''}">
      <div class="category-heading" onclick="toggleCategory('${key.replace(/'/g, "\\'")}')">
        <span class="chevron">▾</span>
        <h2>${escapeHTML(g.cat)}</h2>
        <span class="count">${g.items.length}</span>
      </div>
      <div class="grid">
        ${g.items.map(cardHTML).join('')}
      </div>
    </div>
  `;
  }).join('');
}

function escapeHTML(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---------- RENDER ----------
function matchesFilter(w, filter){
  if(filter === 'all') return true;
  return (w.category || UNCATEGORIZED) === filter;
}

function render(){
  populateCategoryUI();

  const active = wishes
    .filter(w=>w.status==='active' && matchesFilter(w, mainFilter))
    .sort((a,b)=>b.createdAt-a.createdAt);
  const mainGrid = document.getElementById('main-grid');
  const mainEmpty = document.getElementById('main-empty');
  renderGrouped(mainGrid, active, 'main');
  mainEmpty.style.display = active.length ? 'none' : '';

  const completed = wishes
    .filter(w=>w.status==='completed' && matchesFilter(w, completedFilter))
    .sort((a,b)=>b.createdAt-a.createdAt);
  const completedGrid = document.getElementById('completed-grid');
  const completedEmpty = document.getElementById('completed-empty');
  renderGrouped(completedGrid, completed, 'completed');
  completedEmpty.style.display = completed.length ? 'none' : '';

  const archived = wishes.filter(w=>w.status==='archived').sort((a,b)=>b.createdAt-a.createdAt);
  renderGrouped(document.getElementById('archived-grid'), archived, 'archived');
  document.getElementById('archived-section').style.display = showArchived ? '' : 'none';
  document.getElementById('toggle-archived').textContent = showArchived ? 'Hide archived' : `Show archived (${archived.length})`;
}

document.getElementById('toggle-archived').onclick = () => {
  showArchived = !showArchived;
  render();
};

document.getElementById('main-filter').onchange = (e) => {
  mainFilter = e.target.value;
  render();
};
document.getElementById('completed-filter').onchange = (e) => {
  completedFilter = e.target.value;
  render();
};

// ---------- GLOBAL EXPOSURE ----------
window.openWishModal = openWishModal;
window.completeWish = completeWish;
window.editWish = editWish;
window.deleteWish = deleteWish;
window.revertWish = revertWish;
window.archiveWish = archiveWish;
window.unarchiveWish = unarchiveWish;
window.toggleCategory = toggleCategory;
