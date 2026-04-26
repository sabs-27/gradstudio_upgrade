(function () {
    const state = {
        categories: [],
        courses: [],
        activeCategoryId: null,
        activeCourseId: null,
        rightStack: [],
        courseDetails: new Map()
    };

    const apiBase = getApiBase();
    const els = {
        topicList: document.getElementById("topicList"),
        courseList: document.getElementById("courseList"),
        contentList: document.getElementById("contentList"),
        activeTopicEyebrow: document.getElementById("activeTopicEyebrow"),
        cardsTitle: document.getElementById("cardsTitle"),
        contentEyebrow: document.getElementById("contentEyebrow"),
        contentTitle: document.getElementById("contentTitle"),
        contentFrame: document.getElementById("contentFrame"),
        iframePanel: document.getElementById("iframePanel"),
        closeViewerButton: document.getElementById("closeViewerButton"),
        contentColumn: document.querySelector(".learn-content")
    };

    init();

    async function init() {
        renderLoading();
        bindStaticEvents();

        try {
            const [categoriesPayload, coursesPayload] = await Promise.all([
                fetchJson("/api/categories"),
                fetchJson("/api/courses")
            ]);

            state.categories = normalizeCategories(categoriesPayload.categories || []);
            state.courses = normalizeCourses(coursesPayload.courses || []);

            const categoryFromHash = getHashState().category;
            const firstCategory = state.categories.find((category) => category.id === categoryFromHash) || state.categories[0];
            if (!firstCategory) {
                renderFatal("No topics found", "The live API returned no categories.");
                return;
            }

            selectCategory(firstCategory.id, { updateHash: false });

            const hash = getHashState();
            if (hash.course) {
                const course = state.courses.find((item) => item.id === hash.course);
                if (course) {
                    if (course.category !== state.activeCategoryId) selectCategory(course.category, { updateHash: false });
                    selectCourse(course.id, { updateHash: false });
                }
            }

            if (hash.item) {
                const item = state.courses.find((course) => course.id === hash.item);
                if (item) openNode(item, { updateHash: false });
            }
        } catch (error) {
            console.error(error);
            renderFatal("Could not load live GradStudio data", error.message || "The API request failed.");
        }
    }

    function bindStaticEvents() {
        els.closeViewerButton.addEventListener("click", closeIframe);
        window.addEventListener("hashchange", () => {
            const hash = getHashState();
            if (hash.category && hash.category !== state.activeCategoryId) {
                selectCategory(hash.category, { updateHash: false });
            }
            if (hash.course && hash.course !== state.activeCourseId) {
                selectCourse(hash.course, { updateHash: false });
            }
        });
    }

    function renderLoading() {
        els.topicList.innerHTML = statusHtml("Loading topics", "Fetching live categories from GradStudio.");
        els.courseList.innerHTML = statusHtml("Loading courses", "Fetching live course cards.");
        els.contentList.innerHTML = statusHtml("Choose a course", "The selected card contents will appear here.");
    }

    function renderFatal(title, message) {
        const html = statusHtml(title, message);
        els.topicList.innerHTML = html;
        els.courseList.innerHTML = html;
        els.contentList.innerHTML = html;
    }

    function selectCategory(categoryId, options = {}) {
        const category = state.categories.find((item) => item.id === categoryId);
        if (!category) return;

        state.activeCategoryId = category.id;
        state.activeCourseId = null;
        state.rightStack = [];
        closeIframe();

        renderTopics();
        renderCourseCards(category);
        renderContentIntro(category);

        if (options.updateHash !== false) {
            location.hash = `category=${encodeURIComponent(category.id)}`;
        }
    }

    function selectCourse(courseId, options = {}) {
        const course = state.courses.find((item) => item.id === courseId);
        if (!course) return;

        state.activeCourseId = course.id;
        state.rightStack = [course.id];
        closeIframe();

        renderCourseCards(state.categories.find((item) => item.id === state.activeCategoryId));
        renderRightForCourse(course);

        if (options.updateHash !== false) {
            location.hash = `category=${encodeURIComponent(course.category)}&course=${encodeURIComponent(course.id)}`;
        }
    }

    async function openNode(node, options = {}) {
        closeIframe();

        if (hasChildren(node.id)) {
            state.rightStack.push(node.id);
            renderRightForCourse(node);
            if (options.updateHash !== false) updateNodeHash(node.id);
            return;
        }

        await renderCourseContents(node);
        if (options.updateHash !== false) updateNodeHash(node.id);
    }

    function updateNodeHash(nodeId) {
        const category = state.activeCategoryId || "";
        const course = state.activeCourseId || "";
        location.hash = `category=${encodeURIComponent(category)}&course=${encodeURIComponent(course)}&item=${encodeURIComponent(nodeId)}`;
    }

    function renderTopics() {
        els.topicList.innerHTML = state.categories.map((category) => {
            const count = state.courses.filter((course) => course.category === category.id && !course.parent_course_id).length;
            return `
                <button class="learn-row ${category.id === state.activeCategoryId ? "is-active" : ""}" type="button" data-topic="${escapeAttr(category.id)}">
                    <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                    <span>
                        <span class="learn-row-title">${escapeHtml(category.name)}</span>
                        <span class="learn-row-meta">${count} cards</span>
                    </span>
                    <span class="learn-row-arrow" aria-hidden="true">&gt;</span>
                </button>
            `;
        }).join("");

        els.topicList.querySelectorAll("[data-topic]").forEach((button) => {
            button.addEventListener("click", () => selectCategory(button.dataset.topic));
        });
    }

    function renderCourseCards(category) {
        if (!category) return;

        els.activeTopicEyebrow.textContent = category.name;
        els.cardsTitle.textContent = "Cards";

        let roots = state.courses.filter((course) => course.category === category.id && !course.parent_course_id);
        if (!roots.length) roots = state.courses.filter((course) => course.category === category.id);

        if (!roots.length) {
            els.courseList.innerHTML = statusHtml("No cards", "This topic has no active courses yet.");
            return;
        }

        els.courseList.innerHTML = roots.map((course) => cardButtonHtml(course, course.id === state.activeCourseId)).join("");
        els.courseList.querySelectorAll("[data-course]").forEach((button) => {
            button.addEventListener("click", () => selectCourse(button.dataset.course));
        });
    }

    function renderContentIntro(category) {
        els.contentEyebrow.textContent = "Content";
        els.contentTitle.textContent = category.name;
        els.contentList.innerHTML = statusHtml("Choose a card", "Select a card in the center column to load its real contents.");
    }

    async function renderRightForCourse(course) {
        const children = getChildren(course.id);
        els.contentEyebrow.textContent = course.title;
        els.contentTitle.textContent = children.length ? "Contents" : "Modules";

        if (children.length) {
            els.contentList.innerHTML = children.map((child) => cardButtonHtml(child, false)).join("");
            els.contentList.querySelectorAll("[data-course]").forEach((button) => {
                const child = state.courses.find((courseItem) => courseItem.id === button.dataset.course);
                button.addEventListener("click", () => openNode(child));
            });
            return;
        }

        await renderCourseContents(course);
    }

    async function renderCourseContents(course) {
        els.contentEyebrow.textContent = course.title;
        els.contentTitle.textContent = "Modules";
        els.contentList.innerHTML = statusHtml("Loading modules", `Fetching ${course.title} sections from the live API.`);

        try {
            const detail = await getCourseDetail(course.id);
            const items = flattenCourseItems(detail);

            if (!items.length) {
                els.contentList.innerHTML = statusHtml("No modules", "This card has no sections or iframe content yet.");
                return;
            }

            els.contentList.innerHTML = items.map((item, index) => moduleButtonHtml(item, index)).join("");
            els.contentList.querySelectorAll("[data-module-index]").forEach((button) => {
                const item = items[Number(button.dataset.moduleIndex)];
                button.addEventListener("click", () => openIframe(course, item));
            });
        } catch (error) {
            console.error(error);
            els.contentList.innerHTML = statusHtml("Could not load modules", error.message || "The course detail request failed.");
        }
    }

    async function openIframe(course, item) {
        const path = item.file_path || item.link;
        if (!path) {
            els.contentList.innerHTML = statusHtml("No iframe path", "This module does not have a file_path value.");
            return;
        }

        const src = buildSimulationUrl(path);
        els.contentEyebrow.textContent = course.title;
        els.contentTitle.textContent = item.name || item.title || "Module";
        els.contentFrame.src = src;
        els.iframePanel.hidden = false;
        els.closeViewerButton.hidden = false;
        els.contentColumn.classList.add("is-viewing");

        if (item.simulation_id || item.id) {
            fetchJson(`/api/views/${encodeURIComponent(item.simulation_id || item.id)}`, { method: "POST" }).catch(() => {});
        }
    }

    function closeIframe() {
        els.contentColumn.classList.remove("is-viewing");
        els.iframePanel.hidden = true;
        els.closeViewerButton.hidden = true;
        if (els.contentFrame) els.contentFrame.removeAttribute("src");
    }

    async function getCourseDetail(courseId) {
        if (state.courseDetails.has(courseId)) return state.courseDetails.get(courseId);
        const detail = await fetchJson(`/api/courses/${encodeURIComponent(courseId)}`);
        state.courseDetails.set(courseId, detail);
        return detail;
    }

    function getChildren(parentId) {
        return state.courses.filter((course) => course.parent_course_id === parentId);
    }

    function hasChildren(parentId) {
        return getChildren(parentId).length > 0;
    }

    function flattenCourseItems(detail) {
        const items = [];
        (detail.sections || []).forEach((section) => {
            const sectionItems = section.items || section.simulations || [];
            sectionItems.forEach((item) => {
                items.push({
                    ...item,
                    sectionTitle: section.title
                });
            });
        });
        return items;
    }

    function cardButtonHtml(course, active) {
        const icon = course.icon_class || "fas fa-book";
        const children = getChildren(course.id).length;
        const count = children || course.simulation_count || 0;
        const label = children ? `${children} nested cards` : `${count} modules`;
        return `
            <button class="learn-row ${active ? "is-active" : ""}" type="button" data-course="${escapeAttr(course.id)}">
                <i class="${escapeAttr(icon)}" aria-hidden="true"></i>
                <span>
                    <span class="learn-row-title">${escapeHtml(course.title)}</span>
                    <span class="learn-row-meta">${escapeHtml(label)}</span>
                </span>
                <span class="learn-row-arrow" aria-hidden="true">&gt;</span>
            </button>
        `;
    }

    function moduleButtonHtml(item, index) {
        const title = item.name || item.title || `Module ${index + 1}`;
        return `
            <button class="learn-row" type="button" data-module-index="${index}">
                <i class="fas fa-book" aria-hidden="true"></i>
                <span>
                    <span class="learn-row-title">${escapeHtml(title)}</span>
                    <span class="learn-row-meta">${escapeHtml(item.sectionTitle || "Section")}</span>
                </span>
                <span class="learn-row-arrow" aria-hidden="true">&gt;</span>
            </button>
        `;
    }

    function statusHtml(title, message) {
        return `
            <div class="learn-status">
                <div>
                    <span class="learn-empty-icon"><i class="fas fa-book-open" aria-hidden="true"></i></span>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(message)}</span>
                </div>
            </div>
        `;
    }

    async function fetchJson(endpoint, options = {}) {
        const response = await fetch(`${apiBase}${endpoint}`, {
            headers: { "Accept": "application/json" },
            ...options
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
    }

    function buildSimulationUrl(path) {
        const cleanPath = String(path || "").replace(/^\/+/, "");
        if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
        return `${apiBase}/${cleanPath}`;
    }

    function getApiBase() {
        if (location.protocol === "file:") return "https://api.gradstudio.org";
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return "https://api.gradstudio.org";
        return location.origin;
    }

    function normalizeCategories(categories) {
        return categories
            .filter((category) => category && !category.is_deleted)
            .map((category) => ({
                id: String(category.id),
                name: String(category.name || category.id),
                display_order: Number(category.display_order || 0)
            }))
            .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
    }

    function normalizeCourses(courses) {
        return courses
            .filter((course) => course && course.is_active !== false)
            .map((course) => ({
                ...course,
                id: String(course.id),
                title: String(course.title || course.id).trim(),
                category: String(course.category || "uncategorized"),
                parent_course_id: course.parent_course_id ? String(course.parent_course_id) : null,
                display_order: Number(course.display_order || 0),
                simulation_count: Number(course.simulation_count || 0)
            }))
            .sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title));
    }

    function getHashState() {
        const raw = location.hash.replace(/^#/, "");
        const params = new URLSearchParams(raw);
        return {
            category: params.get("category"),
            course: params.get("course"),
            item: params.get("item")
        };
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }
})();
