(function () {
    "use strict";

    const DEV_API_BASE = "https://learning-platform-api-dev.sabareeshrao.workers.dev";
    const API_BASE = window.location.protocol === "file:" ? DEV_API_BASE : "";
    const state = {
        categories: [],
        courses: [],
        activeFolderId: "",
        activeCourseId: "",
        expandedFolders: new Set(),
        mode: "idle",
        currentCourseData: null,
        pendingFocusSectionId: "",
        pendingFocusSimId: ""
    };

    const els = {};

    const snippets = [
        {
            name: "AWS",
            html: '<div class="thumbnail-card" style="--bg-dark-1:#1d1408;--bg-dark-2:#3a2409;--glow-top-left:#ffb347;--glow-bottom-right:#ff7a18;--badge-bg:#ff9900;--badge-text:#111827;"><div class="thumb-grid"></div><div class="thumb-badge">AWS</div><h3>Cloud Foundations</h3><p>Identity, compute, storage, and networking labs.</p></div>'
        },
        {
            name: "Cloud",
            html: '<div class="thumbnail-card thumb-cloud"><div class="cloud-orbit"></div><div class="cloud-node">CL</div><h3>Cloud Platform</h3><p>Deploy and operate practical cloud systems.</p></div>'
        },
        {
            name: "Terminal",
            html: '<div class="html-thumb thumb-terminal"><div class="terminal-bar"><span></span><span></span><span></span></div><pre>$ lab start\n$ deploy --ready</pre></div>'
        },
        {
            name: "Stack",
            html: '<div class="html-thumb thumb-stack"><span></span><span></span><span></span><strong>Full Stack</strong></div>'
        },
        {
            name: "Circuit",
            html: '<div class="html-thumb thumb-circuit"><span></span><span></span><span></span><strong>Security Lab</strong></div>'
        }
    ];

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        cacheEls();
        bindEvents();
        renderSnippetLibrary();
        checkAuth();
        loadData();
    }

    function cacheEls() {
        [
            "tree", "folderJump", "btnNewFolder", "btnNewCourse", "btnDelFolder", "btnRecycle",
            "emptyState", "courseForm", "contentsCard", "sectionsList", "recycleArea",
            "formTitle", "cId", "cTitle", "cDescription", "cLevel", "cLabs", "cIcon", "cOrder",
            "cParent", "cType", "cTags", "cThumbType", "cThumbImage", "cThumbHtml", "coursePreview",
            "snippetLibrary", "btnSaveCourse", "btnDelCourse", "btnAddSection", "modalBg", "modalBox", "toast"
        ].forEach((id) => { els[id] = document.getElementById(id); });
    }

    function bindEvents() {
        els.btnNewFolder.addEventListener("click", openAddFolderModal);
        els.btnNewCourse.addEventListener("click", () => openCourseForm());
        els.btnDelFolder.addEventListener("click", () => deleteFolder(state.activeFolderId));
        els.btnRecycle.addEventListener("click", openRecycleBin);
        els.folderJump.addEventListener("change", () => {
            if (els.folderJump.value) selectFolder(els.folderJump.value);
        });
        els.btnSaveCourse.addEventListener("click", saveCourseFromForm);
        els.btnDelCourse.addEventListener("click", () => deleteCourse(state.activeCourseId));
        els.btnAddSection.addEventListener("click", () => {
            if (state.activeCourseId) openSectionModal();
        });
        ["cTitle", "cLevel", "cLabs", "cTags", "cThumbType", "cThumbImage", "cThumbHtml"].forEach((id) => {
            els[id].addEventListener("input", renderCoursePreview);
            els[id].addEventListener("change", renderCoursePreview);
        });
        els.modalBg.addEventListener("click", (event) => {
            if (event.target === els.modalBg) closeModal();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeModal();
        });
    }

    function getAuthToken() {
        return localStorage.getItem("lp_auth_token") || "";
    }

    function authHeaders() {
        const token = getAuthToken();
        return token ? { Authorization: "Bearer " + token } : {};
    }

    function authJsonHeaders() {
        return { "Content-Type": "application/json", ...authHeaders() };
    }

    function checkAuth() {
        if (!getAuthToken()) {
            redirectToLogin();
            return;
        }

        fetch(API_BASE + "/api/auth/me", { headers: authHeaders() })
            .then((response) => {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("lp_auth_token");
                    redirectToLogin();
                }
            })
            .catch(() => {});
    }

    function redirectToLogin() {
        const redirect = window.location.protocol === "file:" ? window.location.href : window.location.pathname;
        const loginUrl = window.location.protocol === "file:"
            ? new URL("login.html", window.location.href).href
            : "/login.html";
        window.location.href = loginUrl + "?redirect=" + encodeURIComponent(redirect);
    }

    async function loadData(options = {}) {
        setLoading(true);
        try {
            const [coursePayload, categoryPayload] = await Promise.all([
                apiJson("/api/courses?admin=1&t=" + Date.now()),
                apiJson("/api/categories?t=" + Date.now())
            ]);

            state.courses = normalizeCourses(coursePayload.courses || []);
            state.categories = normalizeCategories(categoryPayload.categories || []);
            renderSidebar();
            renderParentOptions();

            if (options.keepSelection && state.activeCourseId) {
                const exists = state.courses.some((course) => course.id === state.activeCourseId);
                if (exists) {
                    await selectCourse(state.activeCourseId, { force: true });
                    return;
                }
            }

            if (state.activeFolderId && !state.categories.some((category) => category.id === state.activeFolderId)) {
                state.activeFolderId = "";
            }

            updateHeaderState();
        } catch (error) {
            els.tree.innerHTML = '<div class="empty-box">Failed to load admin data.<br><small>' + esc(error.message) + '</small></div>';
            showToast(error.message, "err");
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        if (!isLoading) return;
        els.tree.innerHTML = '<div style="display:flex;align-items:center;padding:16px;color:var(--muted)"><div class="spinner"></div> Loading...</div>';
    }

    function normalizeCategories(categories) {
        return categories
            .filter(Boolean)
            .map((category) => ({
                ...category,
                id: String(category.id),
                name: String(category.name || category.id),
                display_order: Number(category.display_order || 0)
            }))
            .sort((a, b) => (a.display_order - b.display_order) || a.name.localeCompare(b.name));
    }

    function normalizeCourses(courses) {
        return courses
            .filter(Boolean)
            .map((course) => ({
                ...course,
                id: String(course.id),
                title: String(course.title || course.id),
                icon_class: String(course.icon_class || "fas fa-book"),
                description: String(course.description || ""),
                category: String(course.category || "skill"),
                display_order: Number(course.display_order || 0),
                simulation_count: Number(course.simulation_count || 0),
                parent_course_id: course.parent_course_id ? String(course.parent_course_id) : null,
                type: String(course.type || (course.parent_course_id ? "course" : "course")),
                cardMeta: parseCardMeta(course.color_theme)
            }))
            .sort((a, b) => (a.display_order - b.display_order) || a.title.localeCompare(b.title));
    }

    function parseCardMeta(value) {
        if (!value || typeof value !== "string") return defaultCardMeta();
        try {
            const parsed = JSON.parse(value);
            if (!parsed || typeof parsed !== "object") return defaultCardMeta();
            return {
                level: String(parsed.level || "Beginner"),
                labs: String(parsed.labs || "Auto"),
                tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).filter(Boolean) : [],
                thumbnail: normalizeThumbnail(parsed.thumbnail)
            };
        } catch (_) {
            return defaultCardMeta();
        }
    }

    function defaultCardMeta() {
        return {
            level: "Beginner",
            labs: "Auto",
            tags: [],
            thumbnail: { type: "html", html: "" }
        };
    }

    function normalizeThumbnail(thumbnail) {
        if (!thumbnail || typeof thumbnail !== "object") return { type: "html", html: "" };
        if (thumbnail.type === "image") {
            return { type: "image", src: String(thumbnail.src || ""), alt: String(thumbnail.alt || "") };
        }
        return {
            type: thumbnail.type === "document" ? "document" : "html",
            html: String(thumbnail.html || "")
        };
    }

    function serializeCardMetaFromForm(categoryName) {
        const tags = splitTags(els.cTags.value);
        if (categoryName && !tags.includes(categoryName)) tags.unshift(categoryName);

        const type = els.cThumbType.value;
        const thumbnail = type === "image"
            ? { type: "image", src: els.cThumbImage.value.trim(), alt: (els.cTitle.value.trim() || "Course") + " thumbnail" }
            : { type, html: els.cThumbHtml.value };

        return JSON.stringify({
            level: els.cLevel.value.trim() || "Beginner",
            labs: els.cLabs.value.trim() || "Auto",
            tags,
            thumbnail
        });
    }

    function splitTags(value) {
        return String(value || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .filter((tag, index, all) => all.indexOf(tag) === index);
    }

    function renderSidebar() {
        renderFolderJump();
        const html = state.categories.map((category) => renderCategory(category)).join("");
        els.tree.innerHTML = html || '<div class="empty-box">No folders yet.</div>';

        els.tree.querySelectorAll("[data-folder]").forEach((node) => {
            node.addEventListener("click", () => toggleFolder(node.dataset.folder));
        });
        els.tree.querySelectorAll("[data-course]").forEach((node) => {
            node.addEventListener("click", (event) => {
                event.stopPropagation();
                selectCourse(node.dataset.course);
            });
        });
        els.tree.querySelectorAll("[data-add-course]").forEach((node) => {
            node.addEventListener("click", (event) => {
                event.stopPropagation();
                selectFolder(node.dataset.addCourse);
                openCourseForm({ categoryId: node.dataset.addCourse });
            });
        });
        els.tree.querySelectorAll("[data-edit-folder]").forEach((node) => {
            node.addEventListener("click", (event) => {
                event.stopPropagation();
                openEditFolderModal(node.dataset.editFolder);
            });
        });
        els.tree.querySelectorAll("[data-add-child]").forEach((node) => {
            node.addEventListener("click", (event) => {
                event.stopPropagation();
                const parent = state.courses.find((course) => course.id === node.dataset.addChild);
                openCourseForm({ categoryId: parent ? parent.category : state.activeFolderId, parentCourseId: node.dataset.addChild });
            });
        });
    }

    function renderFolderJump() {
        els.folderJump.innerHTML = '<option value="">Select...</option>' + state.categories.map((category) => {
            return '<option value="' + escAttr(category.id) + '"' + (category.id === state.activeFolderId ? " selected" : "") + ">" + esc(category.name) + "</option>";
        }).join("");
    }

    function renderCategory(category) {
        const courses = state.courses
            .filter((course) => course.category === category.id && !course.parent_course_id)
            .sort(orderSort);
        const active = category.id === state.activeFolderId && !state.activeCourseId;
        const expanded = state.expandedFolders.has(category.id);
        return '' +
            '<div class="f-head ' + (active ? "active " : "") + (expanded ? "expanded" : "") + '" data-folder="' + escAttr(category.id) + '">' +
            '<i class="chev fas fa-chevron-right"></i><i class="ico fas fa-folder"></i><span class="name">' + esc(category.name) + '</span>' +
            '<button class="ib" title="Add card" data-add-course="' + escAttr(category.id) + '"><i class="fas fa-plus"></i></button>' +
            '<button class="ib" title="Edit folder" data-edit-folder="' + escAttr(category.id) + '"><i class="fas fa-pen"></i></button>' +
            '<span class="cnt">' + courses.length + '</span></div>' +
            '<div class="folder-children ' + (expanded ? "open" : "") + '">' +
            courses.map((course) => renderCourseTreeItem(course, 0)).join("") +
            '</div>';
    }

    function renderCourseTreeItem(course, depth) {
        const children = state.courses.filter((item) => item.parent_course_id === course.id).sort(orderSort);
        const active = course.id === state.activeCourseId;
        const pad = 42 + (depth * 16);
        let html = '' +
            '<div class="sf-item ' + (active ? "active" : "") + '" style="padding-left:' + pad + 'px" data-course="' + escAttr(course.id) + '">' +
            '<i class="ico ' + escAttr(course.icon_class || "fas fa-book") + '"></i>' +
            '<span>' + esc(course.title) + '</span>' +
            '<button class="ib" title="Add nested card" data-add-child="' + escAttr(course.id) + '"><i class="fas fa-layer-group"></i></button>' +
            '<span class="cnt">' + (children.length || course.simulation_count || 0) + '</span></div>';
        html += children.map((child) => renderCourseTreeItem(child, depth + 1)).join("");
        return html;
    }

    function orderSort(a, b) {
        return (a.display_order - b.display_order) || a.title.localeCompare(b.title);
    }

    function toggleFolder(id) {
        const wasExpanded = state.expandedFolders.has(id);
        state.expandedFolders.clear();
        if (!wasExpanded) state.expandedFolders.add(id);
        selectFolder(id, { preserveExpanded: true });
    }

    function selectFolder(id, options = {}) {
        state.activeFolderId = id;
        state.activeCourseId = "";
        state.currentCourseData = null;
        state.mode = "folder";
        if (!options.preserveExpanded) {
            state.expandedFolders.clear();
            state.expandedFolders.add(id);
        }
        hideCourseAreas();
        renderSidebar();
        renderFolderJump();
        updateHeaderState();
        const folder = state.categories.find((category) => category.id === id);
        els.emptyState.innerHTML = '<h2>' + esc(folder ? folder.name : "Folder") + '</h2><p>Create or select a course card in this folder.</p>';
    }

    async function selectCourse(id, options = {}) {
        if (state.activeCourseId === id && !options.force) return;
        const course = state.courses.find((item) => item.id === id);
        if (!course) return;

        state.mode = "edit";
        state.activeCourseId = id;
        state.activeFolderId = course.category;
        expandCoursePath(course);
        state.currentCourseData = null;
        fillCourseForm(course);
        renderSidebar();
        renderFolderJump();
        updateHeaderState();

        els.contentsCard.classList.add("show");
        els.sectionsList.innerHTML = '<div style="display:flex;align-items:center;color:var(--muted)"><div class="spinner"></div> Loading contents...</div>';
        try {
            state.currentCourseData = await apiJson("/api/courses/" + encodeURIComponent(id) + "?t=" + Date.now());
            renderSections();
        } catch (error) {
            els.sectionsList.innerHTML = '<div class="empty-box">Could not load contents.<br><small>' + esc(error.message) + '</small></div>';
        }
    }

    function hideCourseAreas() {
        els.emptyState.style.display = "block";
        els.courseForm.classList.remove("show");
        els.contentsCard.classList.remove("show");
        els.recycleArea.classList.remove("show");
    }

    function updateHeaderState() {
        els.btnDelFolder.disabled = !state.activeFolderId || !!state.activeCourseId;
    }

    function openCourseForm(options = {}) {
        const categoryId = options.categoryId || state.activeFolderId || (state.categories[0] && state.categories[0].id) || "";
        const parentCourseId = options.parentCourseId || "";
        state.mode = "create";
        state.activeCourseId = "";
        state.activeFolderId = categoryId;
        if (categoryId) {
            state.expandedFolders.clear();
            state.expandedFolders.add(categoryId);
        }
        els.emptyState.style.display = "none";
        els.courseForm.classList.add("show");
        els.contentsCard.classList.remove("show");
        els.recycleArea.classList.remove("show");
        els.formTitle.textContent = parentCourseId ? "Add Nested Card" : "Add Course Card";
        els.cId.disabled = false;
        els.cId.value = "";
        els.cTitle.value = "";
        els.cDescription.value = "";
        els.cLevel.value = "Beginner";
        els.cLabs.value = "Auto";
        els.cIcon.value = "fas fa-book";
        els.cOrder.value = nextCourseOrder(categoryId, parentCourseId);
        renderParentOptions("cat:" + categoryId, parentCourseId ? "course:" + parentCourseId : "");
        els.cType.value = "course";
        els.cTags.value = categoryName(categoryId);
        els.cThumbType.value = "html";
        els.cThumbImage.value = "";
        els.cThumbHtml.value = snippets[0].html;
        els.btnSaveCourse.textContent = "Create Course";
        els.btnDelCourse.style.display = "none";
        renderCoursePreview();
        renderSidebar();
        renderFolderJump();
        updateHeaderState();
    }

    function fillCourseForm(course) {
        state.mode = "edit";
        els.emptyState.style.display = "none";
        els.courseForm.classList.add("show");
        els.recycleArea.classList.remove("show");
        els.formTitle.textContent = "Edit Course Card";
        els.cId.disabled = true;
        els.cId.value = course.id;
        els.cTitle.value = course.title;
        els.cDescription.value = course.description || "";
        els.cLevel.value = course.cardMeta.level || "Beginner";
        els.cLabs.value = course.cardMeta.labs || "Auto";
        els.cIcon.value = course.icon_class || "fas fa-book";
        els.cOrder.value = course.display_order || 0;
        renderParentOptions(course.parent_course_id ? "" : "cat:" + course.category, course.parent_course_id ? "course:" + course.parent_course_id : "");
        els.cType.value = course.type || "course";
        els.cTags.value = (course.cardMeta.tags || []).join(", ");
        const thumb = course.cardMeta.thumbnail || { type: "html", html: "" };
        els.cThumbType.value = thumb.type || "html";
        els.cThumbImage.value = thumb.type === "image" ? (thumb.src || "") : "";
        els.cThumbHtml.value = thumb.type === "image" ? "" : (thumb.html || "");
        els.btnSaveCourse.textContent = "Save Course";
        els.btnDelCourse.style.display = "block";
        renderCoursePreview();
    }

    function renderParentOptions(selectedCategoryValue, selectedCourseValue) {
        if (!els.cParent) return;
        const selected = selectedCourseValue || selectedCategoryValue || ("cat:" + (state.activeFolderId || (state.categories[0] && state.categories[0].id) || ""));
        let html = '<optgroup label="Folders">';
        html += state.categories.map((category) => {
            const value = "cat:" + category.id;
            return '<option value="' + escAttr(value) + '"' + (value === selected ? " selected" : "") + ">Folder: " + esc(category.name) + "</option>";
        }).join("");
        html += '</optgroup><optgroup label="Courses">';
        html += state.courses
            .filter((course) => course.id !== state.activeCourseId)
            .map((course) => {
                const value = "course:" + course.id;
                return '<option value="' + escAttr(value) + '"' + (value === selected ? " selected" : "") + ">Course: " + esc(course.title) + "</option>";
            }).join("");
        html += "</optgroup>";
        els.cParent.innerHTML = html;
    }

    async function saveCourseFromForm() {
        const title = els.cTitle.value.trim();
        const id = els.cId.value.trim();
        if (!id || !title) {
            showToast("Course ID and title are required", "err");
            return;
        }

        const parentValue = els.cParent.value;
        let category = state.activeFolderId || "skill";
        let parentCourseId = null;

        if (parentValue.startsWith("cat:")) {
            category = parentValue.slice(4);
        } else if (parentValue.startsWith("course:")) {
            parentCourseId = parentValue.slice(7);
            const parent = state.courses.find((course) => course.id === parentCourseId);
            category = parent ? parent.category : category;
        }

        const payload = {
            id,
            title,
            description: els.cDescription.value.trim(),
            icon_class: els.cIcon.value.trim() || "fas fa-book",
            category,
            parent_course_id: parentCourseId,
            type: els.cType.value || "course",
            display_order: Number(els.cOrder.value || 0),
            color_theme: serializeCardMetaFromForm(categoryName(category))
        };

        try {
            if (state.mode === "edit") {
                await apiJson("/api/admin/courses", {
                    method: "PUT",
                    headers: authJsonHeaders(),
                    body: JSON.stringify(payload)
                });
                showToast("Course saved", "ok");
            } else {
                await apiJson("/api/admin/courses", {
                    method: "POST",
                    headers: authJsonHeaders(),
                    body: JSON.stringify(payload)
                });
                showToast("Course created", "ok");
                state.activeCourseId = id;
            }
            broadcastAdminUpdate();
            await loadData();
            await selectCourse(id, { force: true });
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function nextCourseOrder(categoryId, parentCourseId) {
        const siblings = state.courses.filter((course) => {
            if (parentCourseId) return course.parent_course_id === parentCourseId;
            return course.category === categoryId && !course.parent_course_id;
        });
        return siblings.length ? Math.max(...siblings.map((course) => course.display_order || 0)) + 1 : 1;
    }

    function categoryName(id) {
        const category = state.categories.find((item) => item.id === id);
        return category ? category.name : id;
    }

    function renderSnippetLibrary() {
        els.snippetLibrary.innerHTML = snippets.map((snippet, index) => {
            return '<span class="pill">Thumbnail: ' + esc(snippet.name) + '</span>' +
                '<button type="button" class="pill" data-snippet="' + index + '">Use</button>' +
                '<button type="button" class="pill" data-copy-snippet="' + index + '">Copy</button>';
        }).join("");
        els.snippetLibrary.querySelectorAll("[data-snippet]").forEach((button) => {
            button.addEventListener("click", () => {
                els.cThumbType.value = "html";
                els.cThumbHtml.value = snippets[Number(button.dataset.snippet)].html;
                renderCoursePreview();
            });
        });
        els.snippetLibrary.querySelectorAll("[data-copy-snippet]").forEach((button) => {
            button.addEventListener("click", () => copySnippet(Number(button.dataset.copySnippet)));
        });
    }

    async function copySnippet(index) {
        const snippet = snippets[index];
        if (!snippet) return;
        try {
            await navigator.clipboard.writeText(snippet.html);
            showToast("Snippet copied", "ok");
        } catch (_) {
            els.cThumbHtml.value = snippet.html;
            els.cThumbHtml.focus();
            els.cThumbHtml.select();
            showToast("Snippet selected", "ok");
        }
    }

    function renderCoursePreview() {
        const title = els.cTitle.value.trim() || "Course title";
        const level = els.cLevel.value.trim() || "Beginner";
        const labs = els.cLabs.value.trim() || "Auto";
        const tags = splitTags(els.cTags.value);
        const thumbType = els.cThumbType.value;
        let media = "";

        if (thumbType === "image" && els.cThumbImage.value.trim()) {
            media = '<img src="' + escAttr(els.cThumbImage.value.trim()) + '" alt="' + escAttr(title + " thumbnail") + '">';
        } else {
            media = sanitizePreviewHtml(els.cThumbHtml.value) || '<div class="hint">Thumbnail preview</div>';
        }

        els.coursePreview.innerHTML = '' +
            '<div class="preview-media">' + media + '</div>' +
            '<div class="preview-body"><strong>' + esc(title) + '</strong>' +
            '<div class="preview-meta"><span>' + esc(level) + '</span><span>' + esc(labs) + '</span></div>' +
            '<div class="pill-row">' + tags.map((tag) => '<span class="pill">' + esc(tag) + '</span>').join("") + '</div></div>';
    }

    function sanitizePreviewHtml(html) {
        const template = document.createElement("template");
        template.innerHTML = String(html || "");
        template.content.querySelectorAll("script,iframe,object,embed,link,meta").forEach((node) => node.remove());
        template.content.querySelectorAll("*").forEach((node) => {
            Array.from(node.attributes).forEach((attr) => {
                const name = attr.name.toLowerCase();
                if (name.startsWith("on")) node.removeAttribute(attr.name);
            });
        });
        return template.innerHTML;
    }

    async function openAddFolderModal() {
        const nextOrder = state.categories.length ? Math.max(...state.categories.map((category) => category.display_order || 0)) + 1 : 1;
        showModal({
            title: "Add Folder",
            body: '' +
                '<form id="folderForm">' +
                '<div class="fg"><label>Folder ID *</label><input name="id" required pattern="[a-z0-9-]+" placeholder="cloud"></div>' +
                '<div class="fg"><label>Name *</label><input name="name" required placeholder="Cloud"></div>' +
                '<div class="fg"><label>Display Order</label><input type="number" name="display_order" value="' + nextOrder + '"></div>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="folderForm">Create</button>'
        });
        document.getElementById("folderForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.target;
            try {
                const payload = {
                    id: field(form, "id").value.trim(),
                    name: field(form, "name").value.trim(),
                    display_order: Number(field(form, "display_order").value || 0)
                };
                await apiJson("/api/admin/categories", {
                    method: "POST",
                    headers: authJsonHeaders(),
                    body: JSON.stringify(payload)
                });
                closeModal();
                state.activeFolderId = payload.id;
                state.expandedFolders.clear();
                state.expandedFolders.add(payload.id);
                showToast("Folder created", "ok");
                broadcastAdminUpdate();
                await loadData();
                selectFolder(payload.id);
            } catch (error) {
                showToast(error.message, "err");
            }
        });
    }

    function openEditFolderModal(id) {
        const folder = state.categories.find((category) => category.id === id);
        if (!folder) return;
        showModal({
            title: "Edit Folder",
            body: '' +
                '<form id="folderEditForm">' +
                '<div class="fg"><label>Folder ID</label><input value="' + escAttr(folder.id) + '" disabled></div>' +
                '<div class="fg"><label>Name *</label><input name="name" required value="' + escAttr(folder.name) + '"></div>' +
                '<div class="fg"><label>Display Order</label><input type="number" name="display_order" value="' + escAttr(folder.display_order || 0) + '"></div>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="folderEditForm">Save</button>'
        });
        document.getElementById("folderEditForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.target;
            try {
                await apiJson("/api/admin/categories", {
                    method: "PUT",
                    headers: authJsonHeaders(),
                    body: JSON.stringify({
                        id,
                        name: field(form, "name").value.trim(),
                        display_order: Number(field(form, "display_order").value || 0)
                    })
                });
                closeModal();
                showToast("Folder saved", "ok");
                broadcastAdminUpdate();
                await loadData();
                selectFolder(id);
            } catch (error) {
                showToast(error.message, "err");
            }
        });
    }

    async function deleteFolder(id) {
        if (!id) return;
        const folder = state.categories.find((category) => category.id === id);
        if (!confirm("Delete folder \"" + (folder ? folder.name : id) + "\"?")) return;
        try {
            await apiJson("/api/admin/categories/" + encodeURIComponent(id), {
                method: "DELETE",
                headers: authHeaders()
            });
            state.activeFolderId = "";
            state.expandedFolders.clear();
            showToast("Folder deleted", "ok");
            broadcastAdminUpdate();
            await loadData();
            hideCourseAreas();
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function deleteCourse(id) {
        if (!id) return;
        if (!confirm("Delete this course and its content?")) return;
        try {
            await apiJson("/api/admin/courses/" + encodeURIComponent(id), {
                method: "DELETE",
                headers: authHeaders()
            });
            state.activeCourseId = "";
            showToast("Course deleted", "ok");
            broadcastAdminUpdate();
            await loadData();
            hideCourseAreas();
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function renderSections() {
        const sections = (state.currentCourseData && state.currentCourseData.sections ? state.currentCourseData.sections : []).slice().sort((a, b) => {
            return Number(a.display_order || 0) - Number(b.display_order || 0);
        });

        if (!sections.length) {
            els.sectionsList.innerHTML = '<div class="empty-box"><strong>No content yet</strong><br><span class="hint">Create a section, then upload single or bulk HTML topics.</span><br><br><button class="btn-a" type="button" id="emptyAddSection">Create Section</button></div>';
            document.getElementById("emptyAddSection").addEventListener("click", () => openSectionModal());
            return;
        }

        els.sectionsList.innerHTML = sections.map((section) => renderSection(section)).join("");
        els.sectionsList.querySelectorAll("[data-edit-section]").forEach((button) => {
            button.addEventListener("click", () => {
                const section = sections.find((item) => item.id === button.dataset.editSection);
                openSectionModal(section);
            });
        });
        els.sectionsList.querySelectorAll("[data-delete-section]").forEach((button) => {
            button.addEventListener("click", () => deleteSection(button.dataset.deleteSection));
        });
        els.sectionsList.querySelectorAll("[data-add-topic]").forEach((button) => {
            button.addEventListener("click", () => openTopicModal(button.dataset.addTopic));
        });
        els.sectionsList.querySelectorAll("[data-bulk-topic]").forEach((button) => {
            button.addEventListener("click", () => openBulkImportModal(button.dataset.bulkTopic));
        });
        els.sectionsList.querySelectorAll("[data-edit-topic]").forEach((button) => {
            button.addEventListener("click", () => openTopicEditModal(button.dataset.editTopic));
        });
        els.sectionsList.querySelectorAll("[data-delete-topic]").forEach((button) => {
            button.addEventListener("click", () => deleteSimulation(button.dataset.deleteTopic));
        });

        focusPending();
    }

    function renderSection(section) {
        const sims = (section.items || section.simulations || []).slice().sort((a, b) => {
            return Number(a.display_order || 0) - Number(b.display_order || 0);
        });
        return '' +
            '<div class="sec-card" data-section-id="' + escAttr(section.id) + '">' +
            '<div class="sec-head"><b>' + esc(section.title) + '</b><div class="action-row">' +
            '<button class="ib" title="Edit section" data-edit-section="' + escAttr(section.id) + '"><i class="fas fa-pen"></i></button>' +
            '<button class="ib del" title="Delete section" data-delete-section="' + escAttr(section.id) + '"><i class="fas fa-trash"></i></button>' +
            '</div></div>' +
            '<div class="sec-body">' +
            (sims.length ? sims.map(renderTopicRow).join("") : '<div class="hint" style="padding:10px">No topics in this section.</div>') +
            '<div class="action-row" style="margin-top:10px">' +
            '<button class="btn-s" type="button" data-add-topic="' + escAttr(section.id) + '"><i class="fas fa-plus"></i> Add Topic</button>' +
            '<button class="btn-a" type="button" data-bulk-topic="' + escAttr(section.id) + '"><i class="fas fa-file-import"></i> Bulk Import</button>' +
            '</div></div></div>';
    }

    function renderTopicRow(topic) {
        return '' +
            '<div class="topic-row" data-topic-id="' + escAttr(topic.id) + '">' +
            '<div class="info"><strong>' + esc(topic.name || topic.title || "Untitled topic") + '</strong><div class="slug">' + esc(topic.slug || topic.file_path || "") + '</div></div>' +
            '<button class="ib" title="Edit topic" data-edit-topic="' + escAttr(topic.id) + '"><i class="fas fa-pen"></i></button>' +
            '<button class="ib del" title="Delete topic" data-delete-topic="' + escAttr(topic.id) + '"><i class="fas fa-trash"></i></button>' +
            '</div>';
    }

    function focusPending() {
        if (state.pendingFocusSectionId) {
            const node = els.sectionsList.querySelector('[data-section-id="' + cssEscape(state.pendingFocusSectionId) + '"]');
            if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
            state.pendingFocusSectionId = "";
        }
        if (state.pendingFocusSimId) {
            const node = els.sectionsList.querySelector('[data-topic-id="' + cssEscape(state.pendingFocusSimId) + '"]');
            if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
            state.pendingFocusSimId = "";
        }
    }

    function openSectionModal(section) {
        if (!state.activeCourseId) return;
        const isEdit = !!section;
        const nextOrder = nextSectionOrder();
        showModal({
            title: isEdit ? "Edit Section" : "Add Section",
            body: '' +
                '<form id="sectionForm">' +
                '<div class="fg"><label>Title *</label><input name="title" required value="' + escAttr(section ? section.title : "") + '"></div>' +
                '<div class="fg"><label>Display Order</label><input type="number" name="display_order" value="' + escAttr(section ? section.display_order || 0 : nextOrder) + '"></div>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="sectionForm">' + (isEdit ? "Save" : "Create") + "</button>"
        });
        document.getElementById("sectionForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.target;
            const payload = {
                title: field(form, "title").value.trim(),
                display_order: Number(field(form, "display_order").value || 0)
            };
            if (isEdit) payload.id = section.id;
            else payload.course_id = state.activeCourseId;

            try {
                const response = await apiJson("/api/admin/sections", {
                    method: isEdit ? "PUT" : "POST",
                    headers: authJsonHeaders(),
                    body: JSON.stringify(payload)
                });
                if (!isEdit) state.pendingFocusSectionId = response.id || "";
                closeModal();
                showToast(isEdit ? "Section saved" : "Section created", "ok");
                broadcastAdminUpdate();
                await selectCourse(state.activeCourseId, { force: true });
            } catch (error) {
                showToast(error.message, "err");
            }
        });
    }

    function nextSectionOrder() {
        const sections = state.currentCourseData && state.currentCourseData.sections ? state.currentCourseData.sections : [];
        return sections.length ? Math.max(...sections.map((section) => section.display_order || 0)) + 1 : 1;
    }

    async function deleteSection(id) {
        if (!confirm("Delete this section?")) return;
        try {
            await apiJson("/api/admin/sections/" + encodeURIComponent(id), {
                method: "DELETE",
                headers: authHeaders()
            });
            showToast("Section deleted", "ok");
            broadcastAdminUpdate();
            await selectCourse(state.activeCourseId, { force: true });
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function openTopicModal(sectionId) {
        const section = findSection(sectionId);
        const nextOrder = section ? nextTopicOrder(section) : 1;
        showModal({
            title: "Add Topic",
            body: '' +
                '<form id="topicForm">' +
                '<div class="fg"><label>Title *</label><input name="title" required></div>' +
                '<div class="fg"><label>HTML File *</label><input type="file" name="file" accept=".html" required></div>' +
                '<div class="fg"><label>Slug</label><input name="slug" placeholder="auto-from-file"><small>Optional. Leave blank to generate from filename.</small></div>' +
                '<div class="fg"><label>Display Order</label><input type="number" name="display_order" value="' + nextOrder + '"></div>' +
                '<label class="hint"><input type="checkbox" name="has_simulation" value="1" checked> Has simulation content</label>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="topicForm">Upload</button>'
        });
        document.getElementById("topicForm").addEventListener("submit", (event) => uploadTopic(event, sectionId));
    }

    async function uploadTopic(event, sectionId) {
        event.preventDefault();
        const form = event.target;
        const file = field(form, "file").files[0];
        if (!file) {
            showToast("Choose an HTML file", "err");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("course_id", state.activeCourseId);
        formData.append("section_id", sectionId);
        formData.append("title", field(form, "title").value.trim());
        formData.append("display_order", field(form, "display_order").value || "1");
        formData.append("has_simulation", field(form, "has_simulation").checked ? "1" : "0");
        if (field(form, "slug").value.trim()) formData.append("slug", field(form, "slug").value.trim());

        try {
            showToast("Uploading topic...", "ok");
            const response = await apiJson("/api/admin/upload-simulation", {
                method: "POST",
                headers: authHeaders(),
                body: formData
            });
            state.pendingFocusSimId = response.id || "";
            closeModal();
            showToast("Topic uploaded", "ok");
            broadcastAdminUpdate();
            await selectCourse(state.activeCourseId, { force: true });
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function openTopicEditModal(topicId) {
        const found = findTopic(topicId);
        if (!found) return;
        const maxOrder = found.section ? Math.max(1, (found.section.items || found.section.simulations || []).length) : 1;
        const topic = found.topic;
        showModal({
            title: "Edit Topic",
            body: '' +
                '<form id="topicEditForm">' +
                '<div class="fg"><label>Title *</label><input name="title" required value="' + escAttr(topic.name || topic.title || "") + '"></div>' +
                '<div class="fg"><label>Position</label><input type="number" name="display_order" min="1" max="' + maxOrder + '" value="' + escAttr(topic.display_order || 1) + '"><small>Position inside this section.</small></div>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="topicEditForm">Save</button>'
        });
        document.getElementById("topicEditForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.target;
            try {
                await apiJson("/api/admin/simulations", {
                    method: "PUT",
                    headers: authJsonHeaders(),
                    body: JSON.stringify({
                        id: topicId,
                        title: field(form, "title").value.trim(),
                        display_order: Number(field(form, "display_order").value || 1)
                    })
                });
                closeModal();
                showToast("Topic saved", "ok");
                broadcastAdminUpdate();
                await selectCourse(state.activeCourseId, { force: true });
            } catch (error) {
                showToast(error.message, "err");
            }
        });
    }

    async function deleteSimulation(id) {
        if (!confirm("Delete this topic?")) return;
        try {
            await apiJson("/api/admin/simulations/" + encodeURIComponent(id), {
                method: "DELETE",
                headers: authHeaders()
            });
            showToast("Topic deleted", "ok");
            broadcastAdminUpdate();
            await selectCourse(state.activeCourseId, { force: true });
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function openBulkImportModal(sectionId) {
        showModal({
            title: "Bulk Import Topics",
            body: '' +
                '<form id="bulkForm">' +
                '<div class="fg"><label>HTML Files *</label><input id="bulkFiles" type="file" accept=".html" multiple required></div>' +
                '<div class="fg"><label>Topic Metadata JSON *</label><textarea id="bulkJson" required placeholder=\'[{"title":"IAM","display_order":1},{"title":"EC2","display_order":2}]\'></textarea>' +
                '<small>JSON array must match the file order. Each item supports title, slug, and display_order.</small></div>' +
                '<div class="empty-box"><strong>Example</strong><pre>[\n  {"title":"IAM","display_order":1},\n  {"title":"EC2","display_order":2}\n]</pre></div>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="bulkForm">Upload All</button>'
        });
        document.getElementById("bulkForm").addEventListener("submit", (event) => uploadBulkTopics(event, sectionId));
    }

    async function uploadBulkTopics(event, sectionId) {
        event.preventDefault();
        const files = Array.from(document.getElementById("bulkFiles").files || []);
        const jsonInput = document.getElementById("bulkJson").value.trim();
        if (!files.length) {
            showToast("Choose HTML files", "err");
            return;
        }

        let metadata;
        try {
            metadata = JSON.parse(jsonInput);
        } catch (error) {
            showToast("Invalid JSON: " + error.message, "err");
            return;
        }
        if (!Array.isArray(metadata)) {
            showToast("Metadata must be a JSON array", "err");
            return;
        }
        if (metadata.length !== files.length) {
            showToast("File count and metadata count do not match", "err");
            return;
        }

        try {
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                const meta = metadata[index] || {};
                const formData = new FormData();
                formData.append("file", file);
                formData.append("course_id", state.activeCourseId);
                formData.append("section_id", sectionId);
                formData.append("title", meta.title || file.name.replace(/\.html$/i, ""));
                formData.append("slug", meta.slug || file.name.replace(/\.html$/i, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
                formData.append("has_simulation", "1");
                formData.append("display_order", meta.display_order || index + 1);

                showToast("Uploading " + (index + 1) + "/" + files.length + ": " + file.name, "ok");
                await apiJson("/api/admin/upload-simulation", {
                    method: "POST",
                    headers: authHeaders(),
                    body: formData
                });
            }
            closeModal();
            showToast("Bulk import complete", "ok");
            broadcastAdminUpdate();
            await selectCourse(state.activeCourseId, { force: true });
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function findSection(id) {
        const sections = state.currentCourseData && state.currentCourseData.sections ? state.currentCourseData.sections : [];
        return sections.find((section) => section.id === id);
    }

    function nextTopicOrder(section) {
        const items = section.items || section.simulations || [];
        return items.length ? Math.max(...items.map((item) => item.display_order || 0)) + 1 : 1;
    }

    function findTopic(id) {
        const sections = state.currentCourseData && state.currentCourseData.sections ? state.currentCourseData.sections : [];
        for (const section of sections) {
            const topic = (section.items || section.simulations || []).find((item) => item.id === id);
            if (topic) return { topic, section };
        }
        return null;
    }

    function expandCoursePath(course) {
        if (!course || !course.category) return;
        state.expandedFolders.clear();
        state.expandedFolders.add(course.category);
    }

    async function openRecycleBin() {
        state.mode = "recycle";
        state.activeCourseId = "";
        els.emptyState.style.display = "none";
        els.courseForm.classList.remove("show");
        els.contentsCard.classList.remove("show");
        els.recycleArea.classList.add("show");
        els.recycleArea.innerHTML = '<h1>Recycle Bin</h1><div style="display:flex;align-items:center;color:var(--muted)"><div class="spinner"></div> Loading deleted items...</div>';
        renderSidebar();
        updateHeaderState();

        try {
            const [cats, courses, sections, sims] = await Promise.all([
                apiJson("/api/admin/categories/deleted", { headers: authHeaders() }),
                apiJson("/api/admin/courses/deleted", { headers: authHeaders() }),
                apiJson("/api/admin/sections/deleted", { headers: authHeaders() }),
                apiJson("/api/admin/simulations/deleted", { headers: authHeaders() })
            ]);
            renderRecycleBin(cats.categories || [], courses.courses || [], sections.sections || [], sims.simulations || []);
        } catch (error) {
            els.recycleArea.innerHTML = '<h1>Recycle Bin</h1><div class="empty-box">Failed to load deleted items.<br><small>' + esc(error.message) + '</small></div>';
        }
    }

    function renderRecycleBin(categories, courses, sections, simulations) {
        const parts = ['<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h1 style="margin:0">Recycle Bin</h1><button class="btn-s" type="button" id="refreshRecycle"><i class="fas fa-sync"></i> Refresh</button></div>'];
        parts.push(recycleTable("Deleted Folders", "categories", categories, ["id", "name"]));
        parts.push(recycleTable("Deleted Courses", "courses", courses, ["id", "title", "category"]));
        parts.push(recycleTable("Deleted Sections", "sections", sections, ["id", "title", "course_title"]));
        parts.push(recycleTable("Deleted Topics", "simulations", simulations, ["title", "slug", "course_id"]));
        if (!categories.length && !courses.length && !sections.length && !simulations.length) {
            parts.push('<div class="empty-box">Recycle bin is empty.</div>');
        }
        els.recycleArea.innerHTML = parts.join("");
        document.getElementById("refreshRecycle").addEventListener("click", openRecycleBin);
        els.recycleArea.querySelectorAll("[data-restore]").forEach((button) => {
            button.addEventListener("click", () => restoreItem(button.dataset.type, button.dataset.restore));
        });
        els.recycleArea.querySelectorAll("[data-permanent]").forEach((button) => {
            button.addEventListener("click", () => permanentDeleteItem(button.dataset.type, button.dataset.permanent));
        });
    }

    function recycleTable(title, type, rows, fields) {
        if (!rows.length) return "";
        return '<h3>' + esc(title) + '</h3><table class="recycle-table"><thead><tr>' +
            fields.map((field) => '<th>' + esc(field.replace(/_/g, " ")) + '</th>').join("") +
            '<th>Actions</th></tr></thead><tbody>' +
            rows.map((row) => '<tr>' +
                fields.map((field) => '<td>' + esc(row[field] || "") + '</td>').join("") +
                '<td><div class="action-row"><button class="btn-s" type="button" data-type="' + escAttr(type) + '" data-restore="' + escAttr(row.id) + '">Restore</button>' +
                '<button class="btn-s btn-danger" type="button" data-type="' + escAttr(type) + '" data-permanent="' + escAttr(row.id) + '">Delete Forever</button></div></td></tr>').join("") +
            '</tbody></table>';
    }

    async function restoreItem(type, id) {
        try {
            await apiJson("/api/admin/" + type + "/" + encodeURIComponent(id) + "/restore", {
                method: "POST",
                headers: authHeaders()
            });
            showToast("Item restored", "ok");
            broadcastAdminUpdate();
            await openRecycleBin();
            await loadData();
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function permanentDeleteItem(type, id) {
        if (!confirm("Permanently delete this item? This cannot be undone.")) return;
        try {
            await apiJson("/api/admin/" + type + "/" + encodeURIComponent(id) + "/permanent", {
                method: "DELETE",
                headers: authHeaders()
            });
            showToast("Item permanently deleted", "ok");
            broadcastAdminUpdate();
            await openRecycleBin();
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function showModal({ title, body, footer }) {
        els.modalBox.innerHTML = '' +
            '<div class="modal-h"><h3>' + esc(title) + '</h3><button class="modal-x" type="button" data-close>&times;</button></div>' +
            '<div class="modal-b">' + body + '</div>' +
            '<div class="modal-f">' + footer + '</div>';
        els.modalBg.classList.add("show");
        els.modalBox.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeModal));
        const input = els.modalBox.querySelector("input,textarea,select");
        if (input) setTimeout(() => input.focus(), 0);
    }

    function closeModal() {
        els.modalBg.classList.remove("show");
        els.modalBox.innerHTML = "";
    }

    async function apiJson(path, options = {}) {
        const response = await fetch(API_BASE + path, options);
        const text = await response.text();
        let payload = null;
        try {
            payload = text ? JSON.parse(text) : null;
        } catch (_) {
            payload = null;
        }
        if (response.status === 401) {
            localStorage.removeItem("lp_auth_token");
            redirectToLogin();
            throw new Error("Login required");
        }
        if (!response.ok) {
            const error = payload && payload.error;
            const message = typeof error === "string" ? error : (error && (error.message || error.code)) || text || "Request failed";
            throw new Error(message);
        }
        return payload || {};
    }

    function showToast(message, type) {
        const normalized = type === "err" || type === "error" ? "err" : "ok";
        els.toast.className = "toast " + normalized + " show";
        els.toast.innerHTML = '<i class="fas fa-' + (normalized === "ok" ? "check" : "exclamation") + '-circle"></i> ' + esc(message);
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3200);
    }

    function broadcastAdminUpdate() {
        try {
            localStorage.setItem("lp_admin_refresh", String(Date.now()));
        } catch (_) {}
    }

    function field(form, name) {
        return form.elements[name];
    }

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escAttr(value) {
        return esc(value);
    }

    function cssEscape(value) {
        if (window.CSS && CSS.escape) return CSS.escape(value);
        return String(value).replace(/"/g, '\\"');
    }
})();
