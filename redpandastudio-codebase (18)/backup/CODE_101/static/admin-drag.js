
// Phase 3 & 3.3: Strict Drag & Drop Implementation

let dragSrcEl = null;
let originalOrder = [];

function initDragAndDrop() {
    // Categories
    document.querySelectorAll('.draggable-category').forEach(addDragListeners);
    // Courses
    document.querySelectorAll('.draggable-course').forEach(addDragListeners);
    // Sections
    document.querySelectorAll('.draggable-section').forEach(addDragListeners);
    // Topics
    document.querySelectorAll('.draggable-topic').forEach(addDragListeners);
}

function addDragListeners(el) {
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id || '');

    this.classList.add('dragging');

    if (this.classList.contains('draggable-category')) {
        e.dataTransfer.setData('type', 'category');
    } else if (this.classList.contains('draggable-course')) {
        e.dataTransfer.setData('type', 'course');
        e.dataTransfer.setData('parent-id', this.closest('.category-section').dataset.id);
    } else if (this.classList.contains('draggable-section')) {
        e.dataTransfer.setData('type', 'section');
        e.dataTransfer.setData('parent-id', this.dataset.courseId);
    } else if (this.classList.contains('draggable-topic')) {
        e.dataTransfer.setData('type', 'topic');
        e.dataTransfer.setData('parent-id', this.dataset.sectionId);
    }
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) { this.classList.add('over'); }
function handleDragLeave(e) { this.classList.remove('over'); }

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    const srcType = getType(dragSrcEl);
    const destType = getType(this);
    if (!srcType || !destType || srcType !== destType) return false;

    // Validation
    if (srcType === 'course') {
        const srcCat = dragSrcEl.closest('.category-section').dataset.id;
        const destCat = this.closest('.category-section').dataset.id;
        if (srcCat !== destCat) { showToast('Cannot move course to different category', 'error'); return false; }
    } else if (srcType === 'section') {
        const srcParent = dragSrcEl.dataset.courseId;
        const destParent = this.dataset.courseId;
        if (srcParent !== destParent) return false;
    } else if (srcType === 'topic') {
        const srcParent = dragSrcEl.dataset.sectionId;
        const destParent = this.dataset.sectionId;
        if (srcParent !== destParent) { showToast('Cannot move topic to different section (yet)', 'error'); return false; }
    }

    if (dragSrcEl !== this) {
        // Visual swap
        const parent = this.parentNode;
        const siblings = Array.from(parent.children).filter(el => el.classList.contains(`draggable-${srcType}`));
        const srcIdx = siblings.indexOf(dragSrcEl);
        const destIdx = siblings.indexOf(this);

        if (srcIdx < destIdx) { this.after(dragSrcEl); }
        else { this.before(dragSrcEl); }

        // Save
        if (srcType === 'category') saveCategoryOrder();
        else if (srcType === 'course') saveCourseOrder(dragSrcEl.closest('.category-section').dataset.id);
        else if (srcType === 'section') saveSectionOrder(dragSrcEl.dataset.courseId);
        else if (srcType === 'topic') saveTopicOrder(dragSrcEl.dataset.sectionId);
    }
    return false;
}

function getType(el) {
    if (el.classList.contains('draggable-category')) return 'category';
    if (el.classList.contains('draggable-course')) return 'course';
    if (el.classList.contains('draggable-section')) return 'section';
    if (el.classList.contains('draggable-topic')) return 'topic';
    return null;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.over').forEach(el => el.classList.remove('over'));
}

async function saveCategoryOrder() {
    const items = Array.from(document.querySelectorAll('.draggable-category'));
    const payload = items.map((el, idx) => ({ id: el.dataset.id, display_order: idx }));
    await callReorder('/api/admin/categories/reorder', payload);
}

async function saveCourseOrder(catId) {
    const list = document.querySelector(`.category-section[data-id="${catId}"] ul`);
    if (!list) return;
    const items = Array.from(list.children);
    const payload = items.map((el, idx) => ({ id: el.dataset.id, display_order: idx }));
    await callReorder('/api/admin/courses/reorder', payload);
}

async function saveSectionOrder(courseId) {
    // Select all sections in the main content container
    const items = Array.from(document.querySelectorAll('.draggable-section'));
    const payload = items.map((el, idx) => ({ id: el.dataset.id, display_order: idx, course_id: courseId }));
    await callReorder('/api/admin/sections/reorder', payload);
}

async function saveTopicOrder(sectionId) {
    // Be specific to the list inside the correct section
    const list = document.querySelector(`.draggable-section[data-id="${sectionId}"] .topic-list`);
    if (!list) return;
    const items = Array.from(list.querySelectorAll('.draggable-topic'));
    const payload = items.map((el, idx) => ({ id: el.dataset.id, display_order: idx, section_id: sectionId }));
    await callReorder('/api/admin/simulations/reorder', payload);
}

async function callReorder(endpoint, payload) {
    try {
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed');
    } catch (e) {
        showToast('Reorder failed. Refreshing...', 'error');
        if (window.loadData && endpoint.includes('categor')) setTimeout(window.loadData, 1000);
        else if (window.selectCourse) {
            // If section/topic reorder, we might want to refresh content but keeping it simple
        }
    }
}

