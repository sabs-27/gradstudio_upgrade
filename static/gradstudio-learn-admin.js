(function () {
    "use strict";

    const DEV_API_BASE = "https://learning-platform-api-dev.sabareeshrao.workers.dev";
    const API_BASE = getApiBase();
    const LEARN_CAROUSEL_STORAGE_KEY = "gradstudio_learn_carousels_dev";
    const USE_LOCAL_CAROUSEL_CACHE = new URLSearchParams(window.location.search).has("localCarousel");
    const state = {
        categories: [],
        courses: [],
        carousels: [],
        carouselCards: [],
        activeFolderId: "",
        activeCourseId: "",
        activeCarouselId: "1",
        expandedFolders: new Set(),
        mode: "idle",
        currentCourseData: null,
        pendingFocusSectionId: "",
        pendingFocusSimId: ""
    };

    const els = {};

    const snippets = [
        {
            name: "Express",
            html: starterThumbnailHtml("EXP", "Express.js<br>API Module", "JS", "#101827", "#1f6f5b", "#34d399", "#60a5fa", "#111827", "#ffffff")
        },
        {
            name: "MERN",
            html: starterThumbnailHtml("MERN", "MERN Stack<br>3D UI", "M", "#122019", "#0f766e", "#22c55e", "#93c5fd", "#dcfce7", "#064e3b")
        },
        {
            name: "MongoDB",
            html: starterThumbnailHtml("DB", "MongoDB<br>Data Module", "DB", "#102018", "#14532d", "#84cc16", "#34d399", "#dcfce7", "#14532d")
        },
        {
            name: "React",
            html: starterThumbnailHtml("UI", "React<br>Component Module", "R", "#101827", "#1d4ed8", "#38bdf8", "#a78bfa", "#e0f2fe", "#0f172a")
        },
        {
            name: "Terminal",
            html: '<div class="html-thumb thumb-terminal"><div class="terminal-box" aria-hidden="true"><div class="terminal-dots"><span></span><span></span><span></span></div><div class="terminal-lines"><span></span><span></span><span></span></div></div></div>'
        },
        {
            name: "Stack",
            html: '<div class="html-thumb thumb-stack"><div class="stack-tiles" aria-hidden="true"><span></span><span></span><span></span></div></div>'
        },
        {
            name: "Circuit",
            html: '<div class="html-thumb thumb-circuit"><div class="circuit-board" aria-hidden="true"></div></div>'
        },
        {
            name: "Hero Lab",
            html: heroLabWindowHtml()
        }
    ];

    const FONT_OPTIONS = [
        ["Inter", "Inter"],
        ['-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif', "Apple / SF Pro"],
        ['"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif', "SF Pro Display"],
        ['"Helvetica Neue", Helvetica, Arial, sans-serif', "Helvetica Neue"],
        ['"Segoe UI", Arial, sans-serif', "Segoe UI"],
        ["Arial, Helvetica, sans-serif", "Arial"],
        ["Roboto, Arial, sans-serif", "Roboto"],
        ["Poppins, Arial, sans-serif", "Poppins"],
        ["Georgia, serif", "Georgia"],
        ['"JetBrains Mono", "SFMono-Regular", Consolas, monospace', "JetBrains Mono"]
    ];

    function starterThumbnailHtml(badge, title, logo, bg1, bg2, glow1, glow2, badgeBg, badgeText) {
        return '<div class="thumbnail-card" style="--bg-dark-1:' + bg1 + ';--bg-dark-2:' + bg2 + ';--glow-top-left:' + glow1 + ';--glow-bottom-right:' + glow2 + ';--badge-bg:' + badgeBg + ';--badge-text:' + badgeText + ';--title-top:58%;--title-width:62%;"><span class="thumbnail-badge">' + badge + '</span><h3 class="thumbnail-title">' + title + '</h3><div class="thumbnail-logo" aria-hidden="true"><span class="thumbnail-logo-text">' + logo + '</span></div></div>';
    }

    function heroLabWindowHtml() {
        return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.lab-window{position:absolute;inset:0;border:1px solid rgba(118,131,156,.18);border-radius:0;background:#fff;overflow:hidden}.window-bar{display:flex;align-items:center;gap:10px;height:12%;min-height:34px;padding:0 5%;background:#f3f6fb;border-bottom:1px solid #e7ebf2}.window-bar span{width:12px;height:12px;border-radius:999px;background:#f16b5f}.window-bar span:nth-child(2){background:#f4b64a}.window-bar span:nth-child(3){background:#20a67a}.lab-screen{position:relative;height:88%;overflow:hidden;background:linear-gradient(135deg,#79b4d7,#d9eef8)}.desktop-strip{position:absolute;top:12%;left:7%;display:grid;gap:18px}.desktop-strip span{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.74);box-shadow:0 8px 18px rgba(29,41,57,.16)}.editor-panel{position:absolute;left:22%;top:25%;width:52%;height:42%;padding:6% 5%;background:#191d20;color:#e7ebf2;box-shadow:0 26px 50px rgba(23,32,51,.22)}.editor-title{font-size:clamp(20px,4.2vw,34px);font-weight:760}.editor-lines{display:grid;gap:14px;margin-top:12%}.editor-lines span{height:8px;border-radius:999px;background:rgba(255,255,255,.16)}.editor-lines span:nth-child(1){width:72%}.editor-lines span:nth-child(2){width:52%}.editor-lines span:nth-child(3){width:64%;background:rgba(255,90,0,.56)}.editor-lines span:nth-child(4){width:42%}.terminal-panel{position:absolute;left:47%;bottom:15%;width:32%;min-width:190px;padding:18px;border:2px solid #0d1523;background:#02060d;color:#7df0b0;font-family:"SFMono-Regular",Consolas,monospace;font-size:clamp(13px,2.2vw,20px);line-height:1.6;box-shadow:0 18px 32px rgba(2,6,13,.24)}.terminal-panel span,.terminal-panel strong{display:block;white-space:nowrap}.terminal-panel strong{font-weight:700}.guide-panel{position:absolute;right:6%;top:25%;width:22%;min-width:170px;display:grid;gap:12px;padding:18px;border:1px solid rgba(255,90,0,.22);border-radius:8px;background:rgba(255,255,255,.92);box-shadow:0 18px 32px rgba(29,41,57,.13)}.guide-panel b{font-size:clamp(16px,2.6vw,26px);color:#111827}.guide-panel span{color:#5c667a;font-size:clamp(13px,2vw,20px);line-height:1.35}.guide-panel button{height:38px;border:0;border-radius:8px;background:#e85d24;color:#fff;font-size:clamp(13px,2vw,18px);font-weight:800}@media(max-width:640px){.editor-panel{left:16%;width:62%}.guide-panel{right:4%;min-width:128px;padding:12px}.terminal-panel{left:36%;width:46%;min-width:0}.desktop-strip span{width:20px;height:20px}}</style></head><body><div class="lab-window"><div class="window-bar"><span></span><span></span><span></span></div><div class="lab-screen"><div class="desktop-strip"><span></span><span></span><span></span></div><div class="editor-panel"><div class="editor-title">Visual Studio Code</div><div class="editor-lines"><span></span><span></span><span></span><span></span></div></div><div class="terminal-panel"><span>$ kubectl get pods</span><strong>api-service&nbsp;&nbsp; Running</strong><strong>web-ui&nbsp;&nbsp;&nbsp; Running</strong></div><div class="guide-panel"><b>Course Guide</b><span>Complete the deployment task</span><button type="button">Check</button></div></div></div></body></html>';
    }

    function moduleCountLabel(value) {
        return String(value || "")
            .replace(/\blabs\b/gi, "modules")
            .replace(/\blab\b/gi, "module");
    }

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
            "btnCarousel", "emptyState", "courseForm", "contentsCard", "sectionsList", "carouselArea", "recycleArea",
            "formTitle", "cId", "cTitle", "cDescription", "cLevel", "cLabs", "cIcon", "cOrder",
            "cParent", "cType", "cTags", "cThumbType", "cThumbImage", "cThumbHtml", "cAllOrder", "coursePreview",
            "snippetLibrary", "btnSaveCourse", "btnDelCourse", "btnAddSection", "modalBg", "modalBox", "toast"
        ].forEach((id) => { els[id] = document.getElementById(id); });
    }

    function bindEvents() {
        els.btnNewFolder.addEventListener("click", openAddFolderModal);
        els.btnNewCourse.addEventListener("click", () => openCourseForm());
        els.btnCarousel.addEventListener("click", openCarouselManager);
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

    function getApiBase() {
        if (window.location.protocol === "file:") return DEV_API_BASE;
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return DEV_API_BASE;
        if (window.location.hostname.includes("workers.dev")) return window.location.origin;
        return "https://api.gradstudio.org";
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
            const [coursePayload, categoryPayload, carouselPayload] = await Promise.all([
                apiJson("/api/courses?admin=1&t=" + Date.now()),
                apiJson("/api/categories?t=" + Date.now()),
                loadLearnCarouselConfig()
            ]);

            state.courses = normalizeCourses(coursePayload.courses || []);
            state.categories = normalizeCategories(categoryPayload.categories || []);
            state.carousels = normalizeCarousels(carouselPayload.carousels || []);
            if (!state.carousels.some((carousel) => String(carousel.id) === String(state.activeCarouselId))) {
                state.activeCarouselId = state.carousels[0] ? String(state.carousels[0].id) : "1";
            }
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

    function normalizeCarousels(carousels) {
        const existing = new Map((carousels || []).filter(Boolean).map((carousel) => [String(carousel.id), carousel]));
        const fixed = [
            fixedCarouselSlot("hero", "Hero Visual", "Hero Visual", existing.get("hero")),
            fixedCarouselSlot("1", "Big Carousel", "Featured module previews", existing.get("1"), "HTML Demo Thumbnails"),
            fixedCarouselSlot("2", "Bottom Small Carousel", "Quick course paths", existing.get("2"))
        ];
        const extras = (carousels || [])
            .filter((carousel) => carousel && !["hero", "1", "2"].includes(String(carousel.id)))
            .map((carousel) => fixedCarouselSlot(String(carousel.id), String(carousel.name || blockTypeLabel(carousel)), String(carousel.header || blockTypeLabel(carousel)), carousel, carousel.eyebrow || ""));
        return [...fixed, ...extras]
            .sort((a, b) => (a.display_order - b.display_order) || String(a.id).localeCompare(String(b.id)));
    }

    async function loadLearnCarouselConfig() {
        const local = USE_LOCAL_CAROUSEL_CACHE ? readLocalLearnCarouselConfig() : null;
        if (local) return local;

        let cloudPayload = null;
        try {
            cloudPayload = await apiJson("/api/admin/learn-carousels?t=" + Date.now(), { headers: authHeaders() });
            if (isOldCourseCarouselPayload(cloudPayload)) return defaultLearnCarouselConfig();
            if (cloudPayload && Array.isArray(cloudPayload.carousels)) return cloudPayload;
            if (cloudPayload && (cloudPayload.source === "kv" || hasCarouselConfig(cloudPayload))) return cloudPayload;
        } catch (error) {
            console.warn("New learn carousel API unavailable; trying legacy carousel API.", error);
        }

        try {
            const legacyPayload = await loadLegacyLearnCarouselConfig();
            if (hasCarouselConfig(legacyPayload)) return legacyPayload;
        } catch (error) {
            console.warn("Legacy carousel API unavailable.", error);
        }

        return cloudPayload && cloudPayload.source === "kv" ? cloudPayload : defaultLearnCarouselConfig();
    }

    function defaultLearnCarouselConfig() {
        return {
            version: 1,
            source: "starter",
            carousels: [
                {
                    id: "hero",
                    name: "Hero Visual",
                    block_type: "carousel",
                    header: "Hero Visual",
                    eyebrow: "",
                    display_order: 0,
                    is_active: true,
                    layout_align: "stretch",
                    max_width: "860px",
                    visible_count: 1,
                    grid_columns: 1,
                    card_gap: 0,
                    infinite_scroll: false,
                    cards: [
                        {
                            ...defaultCarouselCard("starter-hero", "hero", 1, "Hero module preview", "", heroLabWindowHtml(), "#ff5a00", []),
                            width: "860px",
                            height_px: "360px",
                            text_position: "hidden"
                        }
                    ]
                },
                {
                    id: "1",
                    name: "Big Carousel",
                    header: "Featured module previews",
                    eyebrow: "HTML Demo Thumbnails",
                    display_order: 1,
                    is_active: true,
                    cards: [
                        defaultCarouselCard("starter-express", "1", 1, "Express.js 3D Card", "Backend API and routing modules", snippets[0].html, "#22c55e", ["backend1", "frontend1", "pyb"]),
                        defaultCarouselCard("starter-mern", "1", 2, "MERN Stack 3D UI", "MongoDB, Express, React, and Node modules", snippets[1].html, "#0f766e", ["mogodb1", "frontend1", "backend1"]),
                        defaultCarouselCard("starter-mongodb", "1", 3, "MongoDB 3D Card", "Document database and data modeling modules", snippets[2].html, "#16876a", ["mogodb1", "dte"]),
                        defaultCarouselCard("starter-react", "1", 4, "React 3D Card", "Component, state, and UI workflow modules", snippets[3].html, "#5f6df6", ["frontend1"])
                    ]
                },
                {
                    id: "2",
                    name: "Bottom Small Carousel",
                    header: "More module previews",
                    eyebrow: "",
                    display_order: 2,
                    is_active: true,
                    cards: [
                        defaultCarouselCard("starter-terminal", "2", 1, "Linux terminal race", "Shell practice", snippets[4].html, "#4f46e5", ["linnn"]),
                        defaultCarouselCard("starter-stack", "2", 2, "Full stack flow", "Generated mini card", snippets[5].html, "#0f766e", ["frontend1", "backend1"]),
                        defaultCarouselCard("starter-circuit", "2", 3, "Security capture", "Generated mini card", snippets[6].html, "#7c2d12", ["cybersecurity"]),
                        { ...defaultCarouselCard("starter-cloud", "2", 4, "Cloud deploy module", "Generated mini card", snippets[1].html, "#2f76d2", ["awssub", "aws2", "azure1"]), content_type: "standard" },
                        { ...defaultCarouselCard("starter-api", "2", 5, "API workflow", "Generated mini card", snippets[0].html, "#312e81", ["backend1"]), content_type: "standard" }
                    ]
                }
            ]
        };
    }

    function defaultCarouselCard(id, carouselId, order, title, description, html, color, courseLinks) {
        const links = (courseLinks || []).map(String).filter(Boolean);
        return {
            id,
            carousel_id: carouselId,
            title,
            description,
            icon_class: "fas fa-layer-group",
            color_hex: color,
            target_type: links.length ? "course_list" : "none",
            target_id: links.length ? "custom" : "none",
            display_order: order,
            is_active: true,
            content_type: "html",
            image_url: "",
            iframe_url: "",
            content_html: html,
            width: carouselId === "hero" ? "860px" : carouselId === "2" ? "220px" : "400px",
            height_px: carouselId === "hero" ? "360px" : carouselId === "2" ? "160px" : "420px",
            frame_style: carouselId === "hero" ? "flush" : "framed",
            full_bleed: true,
            course_links: links
        };
    }

    async function loadLegacyLearnCarouselConfig() {
        const [allCarousels, carouselOne, carouselTwo] = await Promise.all([
            apiJson("/api/admin/carousels?t=" + Date.now(), { headers: authHeaders() }),
            apiJson("/api/admin/carousel?type=1&t=" + Date.now(), { headers: authHeaders() }),
            apiJson("/api/admin/carousel?type=2&t=" + Date.now(), { headers: authHeaders() })
        ]);
        const carousels = Array.isArray(allCarousels)
            ? allCarousels
            : Array.isArray(allCarousels?.carousels)
                ? allCarousels.carousels
                : [];
        const byId = new Map(carousels.filter(Boolean).map((carousel) => [String(carousel.id), carousel]));
        return {
            carousels: ["1", "2"].map((id) => {
                const existing = byId.get(id) || {};
                const cardsPayload = id === "1" ? carouselOne : carouselTwo;
                return {
                    ...existing,
                    id,
                    name: existing.name || (id === "1" ? "Big Carousel" : "Bottom Small Carousel"),
                    header: moduleCountLabel(existing.header || cardsPayload?.header || (id === "1" ? "Featured module previews" : "Quick course paths")),
                    eyebrow: existing.eyebrow || (id === "1" ? "HTML Demo Thumbnails" : ""),
                    display_order: Number(existing.display_order || id),
                    is_active: existing.is_active === undefined ? true : existing.is_active,
                    cards: Array.isArray(cardsPayload?.cards) ? cardsPayload.cards : []
                };
            })
        };
    }

    function hasCarouselConfig(payload) {
        return Array.isArray(payload?.carousels);
    }

    function isOldCourseCarouselPayload(payload) {
        const carousels = Array.isArray(payload?.carousels) ? payload.carousels : [];
        const featured = carousels.find((carousel) => String(carousel.id) === "1");
        if (!featured || !Array.isArray(featured.cards) || !featured.cards.length) return false;
        const header = String(featured.header || "").toLowerCase();
        const firstTitles = featured.cards.slice(0, 4).map((card) => String(card.title || "").toLowerCase()).join("|");
        const hasHtmlDemoMedia = featured.cards.some((card) => {
            const type = String(card.content_type || "").toLowerCase();
            return (type === "html" && card.content_html) || (type === "image" && card.image_url) || (type === "iframe" && card.iframe_url);
        });
        return !hasHtmlDemoMedia && (header.includes("ai fundamentals") || firstTitles.includes("artificial intelligence") || firstTitles.includes("machine learning"));
    }

    function readLocalLearnCarouselConfig() {
        try {
            const raw = localStorage.getItem(LEARN_CAROUSEL_STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && Array.isArray(parsed.carousels) ? parsed : null;
        } catch (_) {
            return null;
        }
    }

    function writeLocalLearnCarouselConfig(payload) {
        try {
            localStorage.setItem(LEARN_CAROUSEL_STORAGE_KEY, JSON.stringify(payload));
        } catch (_) {}
    }

    function fixedCarouselSlot(id, name, fallbackHeader, existing, fallbackEyebrow = "") {
        const defaultVisible = id === "hero" ? 1 : id === "1" ? 2 : 5;
        const hasHeader = existing && Object.prototype.hasOwnProperty.call(existing, "header");
        const hasEyebrow = existing && Object.prototype.hasOwnProperty.call(existing, "eyebrow");
        const heroDefaults = String(id) === "hero";
        const defaultHeroCard = {
            ...defaultCarouselCard("starter-hero", "hero", 1, "Hero module preview", "", heroLabWindowHtml(), "#ff5a00", []),
            width: "860px",
            height_px: "360px",
            text_position: "hidden"
        };
        return {
            ...(existing || {}),
            id,
            name,
            block_type: choiceValue(existing && existing.block_type, ["carousel", "text"], String(id).startsWith("text-") ? "text" : "carousel"),
            header: moduleCountLabel(hasHeader ? (existing.header || "") : fallbackHeader),
            eyebrow: String(hasEyebrow ? (existing.eyebrow || "") : fallbackEyebrow),
            display_order: Number(existing && existing.display_order !== undefined ? existing.display_order : (id === "hero" ? 0 : id === "1" ? 1 : id === "2" ? 2 : 0)),
            is_active: !existing || (existing.is_active !== 0 && existing.is_active !== false),
            layout_align: choiceValue(existing && (existing.layout_align || existing.align), ["left", "center", "right", "stretch"], "stretch"),
            max_width: String(existing && existing.max_width ? existing.max_width : (heroDefaults ? "860px" : "1480px")),
            layout_style: choiceValue(existing && existing.layout_style, ["fit", "custom_width"], "fit"),
            visible_count: numberValue(existing && (existing.visible_count || existing.grid_columns), defaultVisible),
            grid_columns: numberValue(existing && (existing.grid_columns || existing.visible_count), defaultVisible),
            card_gap: numberValue(existing && existing.card_gap, heroDefaults ? 0 : id === "1" ? 12 : 10),
            block_spacing_top: spacingNumberValue(existing && existing.block_spacing_top, 40),
            block_spacing_bottom: spacingNumberValue(existing && existing.block_spacing_bottom, 44),
            text_gap: spacingNumberValue(existing && existing.text_gap, 28),
            infinite_scroll: heroDefaults ? false : (!existing || existing.infinite_scroll === undefined ? true : (existing.infinite_scroll !== 0 && existing.infinite_scroll !== false)),
            text_align: choiceValue(existing && existing.text_align, ["left", "center", "right"], "left"),
            header_font: String(existing && existing.header_font ? existing.header_font : "Inter"),
            header_font_size: numberValue(existing && existing.header_font_size, id === "1" ? 28 : 24),
            header_color: String(existing && existing.header_color ? existing.header_color : "#1d2233"),
            section_text: String(existing && existing.section_text ? existing.section_text : ""),
            section_text_font: String(existing && existing.section_text_font ? existing.section_text_font : "Inter"),
            section_text_size: numberValue(existing && existing.section_text_size, 44),
            section_text_color: String(existing && existing.section_text_color ? existing.section_text_color : "#1d2233"),
            section_text_align: choiceValue(existing && existing.section_text_align, ["left", "center", "right"], "left"),
            section_text_max_width: String(existing && existing.section_text_max_width ? existing.section_text_max_width : "860px"),
            cards: normalizeCarouselCards(existing && Array.isArray(existing.cards) ? existing.cards : (heroDefaults ? [defaultHeroCard] : []))
        };
    }

    function blockTypeLabel(block) {
        return block && block.block_type === "text" ? "Text Block" : "Carousel Layer";
    }

    function choiceValue(value, choices, fallback) {
        const normalized = String(value || "").trim();
        return choices.includes(normalized) ? normalized : fallback;
    }

    function numberValue(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) && num > 0 ? num : fallback;
    }

    function optionalNumberValue(value) {
        const text = String(value ?? "").trim();
        if (!text) return null;
        const num = Number(text);
        return Number.isFinite(num) ? num : null;
    }

    function spacingNumberValue(value, fallback) {
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0) return fallback;
        return Math.min(200, num);
    }

    function colorInputValue(value, fallback) {
        const normalized = String(value || "").trim();
        return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
    }

    function carouselSlotLabel(carousel) {
        if (carousel.id === "hero") return "Hero Visual";
        if (carousel.id === "1") return "Big Carousel";
        if (carousel.id === "2") return "Bottom Small Carousel";
        if (carousel.block_type === "text") return carousel.name || "Text Block";
        return carousel.name || carousel.header || "Carousel Layer";
    }

    function normalizeCarouselCards(cards) {
        return cards
            .filter(Boolean)
            .map((card) => ({
                ...card,
                id: String(card.id),
                carousel_id: String(card.carousel_id || state.activeCarouselId || "1"),
                title: moduleCountLabel(card.title || ""),
                description: moduleCountLabel(card.description || ""),
                icon_class: String(card.icon_class || "fas fa-star"),
                color_hex: String(card.color_hex || "#3b82f6"),
                target_type: normalizeCarouselTargetType(card.target_type, parseCourseLinks(card.course_links), card),
                target_id: String(card.target_id || "custom"),
                display_order: Number(card.display_order || 0),
                is_active: card.is_active !== 0 && card.is_active !== false,
                content_type: String(card.content_type || "html"),
                image_url: String(card.image_url || ""),
                iframe_url: String(card.iframe_url || ""),
                content_html: normalizeStoredHtml(card.content_html),
                width: String(card.width || "400px"),
                height_px: String(card.height_px || "420px"),
                frame_style: choiceValue(card.frame_style || card.frameStyle, ["framed", "flush"], String(card.carousel_id || state.activeCarouselId || "1") === "hero" ? "flush" : "framed"),
                full_bleed: card.full_bleed === 1 || card.full_bleed === true,
                bg_color: String(card.bg_color || ""),
                chip_text: String(card.chip_text || ""),
                chip_color: String(card.chip_color || ""),
                chip_enabled: card.chip_enabled === undefined ? true : (card.chip_enabled !== 0 && card.chip_enabled !== false),
                heading_font: String(card.heading_font || "Inter"),
                heading_size: numberValue(card.heading_size, 24),
                heading_color: String(card.heading_color || "#ffffff"),
                sub_font: String(card.sub_font || "Inter"),
                sub_size: numberValue(card.sub_size, 13),
                sub_color: String(card.sub_color || "#dbe3f1"),
                text_position: choiceValue(card.text_position, ["bottom", "top", "center", "hidden"], "bottom"),
                text_align: choiceValue(card.text_align, ["left", "center", "right"], "left"),
                course_links: parseCourseLinks(card.course_links)
            }))
            .sort((a, b) => (a.display_order - b.display_order) || a.title.localeCompare(b.title));
    }

    function normalizeStoredHtml(value) {
        return String(value || "")
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\//g, "/");
    }

    function parseCardMeta(value) {
        if (!value || typeof value !== "string") return defaultCardMeta();
        try {
            const parsed = JSON.parse(value);
            if (!parsed || typeof parsed !== "object") return defaultCardMeta();
            return {
                level: String(parsed.level || "Beginner"),
                labs: moduleCountLabel(parsed.labs || "Auto"),
                tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).filter(Boolean) : [],
                allOrder: optionalNumberValue(parsed.allOrder ?? parsed.all_order),
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
            allOrder: null,
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
            labs: moduleCountLabel(els.cLabs.value.trim() || "Auto"),
            tags,
            allOrder: optionalNumberValue(els.cAllOrder.value),
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

    function parseCourseLinks(value) {
        if (Array.isArray(value)) return value.map(normalizeCourseLink).filter(Boolean);
        if (!value) return [];
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) return [];
            return parsed.map(normalizeCourseLink).filter(Boolean);
        } catch (_) {
            return [];
        }
    }

    function normalizeCourseLink(value) {
        if (typeof value === "string") return value.trim();
        if (value && typeof value === "object") {
            return String(value.id || value.course_id || value.target_id || "").trim();
        }
        return "";
    }

    function normalizeCarouselTargetType(value, courseIds, card) {
        const targetType = String(value || "").trim();
        if (targetType === "course_page" || targetType === "course_cards") {
            if (courseIds.length) return "course_list";
            const targetId = String(card?.target_id || "").trim();
            return targetId && targetId !== "none" && targetId !== "custom" ? "course" : "none";
        }
        if (targetType === "course" || targetType === "course_list" || targetType === "none") {
            return targetType;
        }
        return courseIds.length ? "course_list" : "none";
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
        state.activeFolderId = resolveCourseFolderId(course);
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
        els.carouselArea.classList.remove("show");
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
        els.carouselArea.classList.remove("show");
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
        els.cAllOrder.value = "";
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
        els.carouselArea.classList.remove("show");
        els.recycleArea.classList.remove("show");
        els.formTitle.textContent = "Edit Course Card";
        els.cId.disabled = true;
        els.cId.value = course.id;
        els.cTitle.value = course.title;
        els.cDescription.value = course.description || "";
        els.cLevel.value = course.cardMeta.level || "Beginner";
        els.cLabs.value = moduleCountLabel(course.cardMeta.labs || "Auto");
        els.cIcon.value = course.icon_class || "fas fa-book";
        els.cOrder.value = course.display_order || 0;
        renderParentOptions(course.parent_course_id ? "" : "cat:" + course.category, course.parent_course_id ? "course:" + course.parent_course_id : "");
        els.cType.value = course.type || "course";
        els.cTags.value = (course.cardMeta.tags || []).join(", ");
        const thumb = course.cardMeta.thumbnail || { type: "html", html: "" };
        els.cThumbType.value = thumb.type || "html";
        els.cThumbImage.value = thumb.type === "image" ? (thumb.src || "") : "";
        els.cThumbHtml.value = thumb.type === "image" ? "" : (thumb.html || "");
        els.cAllOrder.value = Number.isFinite(course.cardMeta.allOrder) ? course.cardMeta.allOrder : "";
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
        const labs = moduleCountLabel(els.cLabs.value.trim() || "Auto");
        const tags = splitTags(els.cTags.value);
        const thumbType = els.cThumbType.value;
        let media = "";

        if (thumbType === "image" && els.cThumbImage.value.trim()) {
            media = '<img src="' + escAttr(resolveAssetUrl(els.cThumbImage.value.trim())) + '" alt="' + escAttr(title + " thumbnail") + '">';
        } else {
            media = renderSafeHtmlPreview(els.cThumbHtml.value, title) || '<div class="hint">Thumbnail preview</div>';
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
        template.content.querySelectorAll("script,style,iframe,object,embed,link,meta,base").forEach((node) => node.remove());
        template.content.querySelectorAll("*").forEach((node) => {
            Array.from(node.attributes).forEach((attr) => {
                const name = attr.name.toLowerCase();
                if (name.startsWith("on")) node.removeAttribute(attr.name);
                if (name === "style") node.setAttribute("style", sanitizeInlinePreviewStyle(attr.value, node));
            });
        });
        return template.innerHTML;
    }

    function renderSafeHtmlPreview(html, title) {
        const value = normalizeStoredHtml(html);
        if (!value.trim()) return "";
        if (isFullHtmlDocument(value)) {
            return '<iframe title="' + escAttr((title || "Carousel") + " thumbnail preview") + '" srcdoc="' + escAttr(value) + '" sandbox="" loading="lazy"></iframe>';
        }
        return sanitizePreviewHtml(value);
    }

    function isFullHtmlDocument(value) {
        return /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<script[\s>]|<link[\s>]|<style[\s>]/i.test(String(value || ""));
    }

    function sanitizeInlinePreviewStyle(value, node) {
        const allowedVars = new Set([
            "--bg-dark-1",
            "--bg-dark-2",
            "--bg-dark-3",
            "--glow-top-left",
            "--glow-bottom-right",
            "--badge-bg",
            "--badge-text",
            "--badge-top",
            "--badge-left",
            "--badge-size",
            "--title-color",
            "--title-left",
            "--title-top",
            "--title-width",
            "--title-size",
            "--logo-size",
            "--logo-top",
            "--logo-right"
        ]);
        const declarations = String(value || "").split(";").map((part) => part.trim()).filter(Boolean);
        const safe = [];
        declarations.forEach((declaration) => {
            const separator = declaration.indexOf(":");
            if (separator === -1) return;
            const property = declaration.slice(0, separator).trim();
            const rawValue = declaration.slice(separator + 1).trim();
            if (!allowedVars.has(property)) return;
            if (!/^[#(),.%\sa-z0-9-]+$/i.test(rawValue)) return;
            safe.push(property + ": " + rawValue);
        });
        return node.classList.contains("thumbnail-card") && safe.length ? safe.join("; ") + ";" : "";
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

    function resolveCourseFolderId(course) {
        if (!course) return state.activeFolderId || "";
        let current = course;
        const seen = new Set();
        while (current && current.parent_course_id && !seen.has(current.id)) {
            seen.add(current.id);
            const parent = state.courses.find((item) => item.id === current.parent_course_id);
            if (!parent) break;
            current = parent;
        }
        return (current && current.category) || course.category || state.activeFolderId || "";
    }

    function expandCoursePath(course) {
        const folderId = resolveCourseFolderId(course);
        if (!folderId) return;
        state.expandedFolders.clear();
        state.expandedFolders.add(folderId);
    }

    async function openCarouselManager() {
        state.mode = "carousel";
        state.activeCourseId = "";
        state.currentCourseData = null;
        els.emptyState.style.display = "none";
        els.courseForm.classList.remove("show");
        els.contentsCard.classList.remove("show");
        els.recycleArea.classList.remove("show");
        els.carouselArea.classList.add("show");
        renderSidebar();
        updateHeaderState();
        renderCarouselManager(true);
        await loadCarouselCards(state.activeCarouselId);
    }

    async function loadCarouselCards(carouselId) {
        state.activeCarouselId = String(carouselId || state.activeCarouselId || "1");
        const carousel = state.carousels.find((item) => item.id === state.activeCarouselId);
        state.carouselCards = normalizeCarouselCards(carousel && Array.isArray(carousel.cards) ? carousel.cards : []);
        renderCarouselManager(false);
    }

    async function refreshCarouselConfig() {
        renderCarouselManager(true);
        try {
            const payload = await loadLearnCarouselConfig();
            state.carousels = normalizeCarousels(payload.carousels || []);
            if (!state.carousels.some((carousel) => carousel.id === state.activeCarouselId)) {
                state.activeCarouselId = state.carousels[0] ? state.carousels[0].id : "1";
            }
            await loadCarouselCards(state.activeCarouselId);
            showToast("Carousel cards refreshed", "ok");
        } catch (error) {
            els.carouselArea.innerHTML = '<h1>Carousel Cards</h1><div class="empty-box">Failed to refresh carousel cards.<br><small>' + esc(error.message) + '</small></div>';
            showToast(error.message, "err");
        }
    }

    function renderCarouselManager(isLoading) {
        const active = state.carousels.find((carousel) => carousel.id === state.activeCarouselId) || state.carousels[0] || {
            id: state.activeCarouselId,
            name: "Carousel",
            header: "",
            display_order: 1,
            is_active: true
        };
        const isFixedBlock = ["hero", "1", "2"].includes(String(active.id));
        const blockActionButton = isFixedBlock
            ? '<button class="btn-s ' + (active.is_active ? "btn-danger" : "") + '" type="button" id="btnToggleCarouselBlock"><i class="fas ' + (active.is_active ? "fa-trash" : "fa-eye") + '"></i> ' + (active.is_active ? "Remove Block" : "Restore Block") + '</button>'
            : '<button class="btn-s btn-danger" type="button" id="btnDeleteLayoutBlock"><i class="fas fa-trash"></i> Delete Layer</button>';

        els.carouselArea.innerHTML = '' +
            '<div class="simple-carousel-admin">' +
            '<div class="simple-carousel-topbar">' +
            '<div class="simple-title"><i class="far fa-images"></i><div><h1>' + esc(carouselSlotLabel(active)) + '</h1><p>' + esc(carouselPlacementText(active)) + '</p></div></div>' +
            '<div class="action-row">' +
            '<button class="btn-s" type="button" id="btnRefreshCarousel"><i class="fas fa-sync"></i> Refresh</button>' +
            '<button class="btn-s" type="button" id="btnEditCarouselHeader"><i class="fas fa-heading"></i> Edit Header</button>' +
            '<button class="btn-s" type="button" id="btnEditCarouselLayout"><i class="fas fa-sliders"></i> Layout / Text</button>' +
            '<button class="btn-s" type="button" id="btnAddTextBlock"><i class="fas fa-align-left"></i> Add Text</button>' +
            '<button class="btn-s" type="button" id="btnAddCarouselLayer"><i class="far fa-images"></i> Add Carousel Layer</button>' +
            blockActionButton +
            '<button class="btn-a" type="button" id="btnAddCarouselCard"><i class="fas fa-plus"></i> Add Card</button>' +
            '</div></div>' +
            '<div class="simple-carousel-shell">' +
            '<aside class="carousel-slot-list" aria-label="Homepage carousels">' +
            '<div class="slot-list-title">Layouts & Carousels</div>' +
            state.carousels.map(renderCarouselSlotButton).join("") +
            '</aside>' +
            '<section class="carousel-main-panel">' +
            renderCarouselHeaderSummary(active) +
            renderCarouselPlacementSummary(active) +
            (active.block_type === "text" ? renderTextBlockEditorHint(active) : (isLoading ? '<div style="display:flex;align-items:center;color:var(--muted)"><div class="spinner"></div> Loading carousel cards...</div>' : renderCarouselCardsList())) +
            '</section>' +
            '</div></div>';

        els.carouselArea.querySelectorAll("[data-carousel-slot]").forEach((button) => {
            button.addEventListener("click", () => loadCarouselCards(button.dataset.carouselSlot));
        });
        bindCarouselSlotDrag();
        document.getElementById("btnAddCarouselCard").addEventListener("click", () => openCarouselCardModal());
        document.getElementById("btnRefreshCarousel").addEventListener("click", refreshCarouselConfig);
        document.getElementById("btnEditCarouselHeader").addEventListener("click", openCarouselHeaderModal);
        document.getElementById("btnEditCarouselLayout").addEventListener("click", openCarouselLayoutModal);
        document.getElementById("btnAddTextBlock").addEventListener("click", addStandaloneTextBlock);
        document.getElementById("btnAddCarouselLayer").addEventListener("click", addCarouselLayer);
        document.getElementById("btnDeleteLayoutBlock")?.addEventListener("click", deleteActiveLayoutBlock);
        document.getElementById("btnToggleCarouselBlock")?.addEventListener("click", toggleActiveCarouselBlock);
        document.getElementById("btnAddCarouselCard").disabled = active.block_type === "text";
        document.getElementById("btnEditCarouselHeaderInline")?.addEventListener("click", openCarouselHeaderModal);
        document.getElementById("btnEditCarouselLayoutInline")?.addEventListener("click", openCarouselLayoutModal);
        els.carouselArea.querySelectorAll("[data-move-carousel]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                moveCarouselBlock(button.dataset.moveCarousel, Number(button.dataset.moveDir));
            });
        });
        els.carouselArea.querySelectorAll("[data-edit-carousel-card]").forEach((button) => {
            button.addEventListener("click", () => {
                const card = state.carouselCards.find((item) => item.id === button.dataset.editCarouselCard);
                if (card) openCarouselCardModal(card);
            });
        });
        els.carouselArea.querySelectorAll("[data-delete-carousel-card]").forEach((button) => {
            button.addEventListener("click", () => deleteCarouselCard(button.dataset.deleteCarouselCard));
        });
    }

    function activeCarousel() {
        return state.carousels.find((carousel) => String(carousel.id) === String(state.activeCarouselId)) || state.carousels[0] || null;
    }

    function renderCarouselSlotButton(carousel) {
        const isActive = String(carousel.id) === String(state.activeCarouselId);
        const isText = carousel.block_type === "text";
        return '' +
            '<div class="carousel-slot-card ' + (isActive ? "active" : "") + '" draggable="true" data-drag-carousel="' + escAttr(carousel.id) + '">' +
            '<button class="slot-main" type="button" data-carousel-slot="' + escAttr(carousel.id) + '">' +
            '<span class="slot-grip" aria-hidden="true"><i class="fas fa-grip-vertical"></i></span>' +
            '<span class="slot-icon" aria-hidden="true"><i class="' + (isText ? "fas fa-align-left" : "far fa-images") + '"></i></span>' +
            '<span class="slot-copy"><b>' + esc(carouselSlotLabel(carousel)) + (carousel.is_active ? "" : " (hidden)") + '</b><small>' + esc(isText ? (carousel.section_text || "Standalone text block") : (carousel.header || "No header set")) + '</small></span>' +
            '<span class="slot-count">' + esc(isText ? "T" : String((carousel.cards || []).length)) + '</span>' +
            '</button>' +
            '<div class="slot-move-actions">' +
            '<button type="button" title="Move up" data-move-carousel="' + escAttr(carousel.id) + '" data-move-dir="-1"><i class="fas fa-arrow-up"></i></button>' +
            '<button type="button" title="Move down" data-move-carousel="' + escAttr(carousel.id) + '" data-move-dir="1"><i class="fas fa-arrow-down"></i></button>' +
            '</div>' +
            '</div>';
    }

    function renderCarouselHeaderSummary(active) {
        return '' +
            '<div class="current-carousel-header">' +
            '<div><span>Current carousel header</span><h2>' + esc(active.header || "No header set") + '</h2>' +
            (active.eyebrow ? '<small>' + esc(active.eyebrow) + '</small>' : '') + '</div>' +
            '<button class="btn-s" type="button" id="btnEditCarouselHeaderInline"><i class="fas fa-pen"></i> Edit Header</button>' +
            '</div>';
    }

    function renderCarouselPlacementSummary(active) {
        const textState = active.section_text ? "Text block added" : "No text block";
        const cardMode = "Per-card only";
        return '' +
            '<div class="placement-summary">' +
            '<div><span>Homepage position</span><b>' + esc(carouselPlacementText(active)) + '</b></div>' +
            '<div><span>Alignment</span><b>' + esc(layoutAlignLabel(active.layout_align)) + '</b></div>' +
            '<div><span>Cards</span><b>' + esc(active.visible_count || active.grid_columns || (active.id === "hero" ? 1 : active.id === "1" ? 2 : 5)) + ' visible</b></div>' +
            '<div><span>Text</span><b>' + esc(textState) + '</b></div>' +
            '<div><span>Width mode</span><b>' + esc(cardMode) + '</b></div>' +
            '<button class="btn-s" type="button" id="btnEditCarouselLayoutInline"><i class="fas fa-sliders"></i> Edit Layout / Text</button>' +
            '</div>';
    }

    function renderTextBlockEditorHint(active) {
        return '<div class="empty-box" style="text-align:left"><strong>This is a standalone text layer.</strong><br><span class="hint">Use Layout / Text to edit the text, color, width, and alignment. Drag it in the left list or use the arrows to move it above or below carousel layers.</span><div style="margin-top:14px;font-size:24px;font-weight:850;color:' + escAttr(colorInputValue(active.section_text_color, "#1d2233")) + '">' + esc(active.section_text || "Standalone text block") + '</div></div>';
    }

    function carouselPlacementText(active) {
        if (String(active.id) === "hero") return "Hero section single carousel card";
        if (active.block_type === "text") return "Standalone text layer in homepage layout";
        return String(active.id) === "1"
            ? "Homepage below the course catalog"
            : "Homepage below the featured carousel";
    }

    function layoutAlignLabel(value) {
        const labels = {
            stretch: "Stretch page width",
            left: "Left edge",
            center: "Center",
            right: "Right edge"
        };
        return labels[value || "stretch"] || "Stretch page width";
    }

    function renderOptions(items, current) {
        return items.map(([value, label]) => {
            return '<option value="' + escAttr(value) + '"' + (String(current) === String(value) ? " selected" : "") + ">" + esc(label) + "</option>";
        }).join("");
    }

    function renderFontOptions(current) {
        const active = String(current || "Inter").trim() || "Inter";
        const activeKey = fontKey(active);
        const base = FONT_OPTIONS.map(([value, label]) => {
            return '<option value="' + escAttr(value) + '"' + (fontKey(value) === activeKey ? " selected" : "") + ">" + esc(label) + "</option>";
        }).join("");
        const hasActive = FONT_OPTIONS.some(([value]) => fontKey(value) === activeKey);
        return base + (hasActive ? "" : '<option value="' + escAttr(active) + '" selected>Custom: ' + esc(active) + "</option>");
    }

    function renderFontSelect(id, current) {
        return '<select id="' + escAttr(id) + '">' + renderFontOptions(current) + '</select>';
    }

    function fontKey(value) {
        return String(value || "").replace(/["']/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function openCarouselHeaderModal() {
        const active = activeCarousel();
        if (!active) return;
        showModal({
            title: "Edit Carousel Header",
            body: '' +
                '<form id="carouselHeaderForm">' +
                '<div class="fg"><label>Eyebrow</label><input id="modalCarouselEyebrow" value="' + escAttr(active.eyebrow || "") + '" placeholder="HTML Demo Thumbnails"><small>Small label above the carousel title.</small></div>' +
                '<div class="fg"><label>Carousel Title</label><input id="modalCarouselHeader" value="' + escAttr(active.header || "") + '" placeholder="Featured module previews"><small>Leave empty if you do not want heading text above the cards.</small></div>' +
                '<label class="inline-check"><input id="modalCarouselActive" type="checkbox" ' + (active.is_active ? "checked" : "") + '> Show this carousel on the homepage</label>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="carouselHeaderForm">Save Header</button>'
        });
        document.getElementById("carouselHeaderForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            active.eyebrow = document.getElementById("modalCarouselEyebrow").value.trim();
            active.header = document.getElementById("modalCarouselHeader").value.trim();
            active.is_active = document.getElementById("modalCarouselActive").checked;
            await saveCarouselConfigFromModal("Carousel header saved");
        });
    }

    function openCarouselLayoutModal() {
        const active = activeCarousel();
        if (!active) return;
        const activeAlign = active.layout_align || "stretch";
        const activeStyle = active.layout_style || "fit";
        const activeTextAlign = active.text_align || "left";
        const activeSectionAlign = active.section_text_align || "left";
        showModal({
            title: "Edit Layout / Text",
            wide: true,
            body: '' +
                '<form id="carouselLayoutForm">' +
                '<div class="layout-modal-summary"><span class="location-chip"><i class="fas fa-location-dot"></i> ' + esc(carouselPlacementText(active)) + '</span><p class="hint">Use this only when you want to move the carousel, center one card, or add text before this carousel.</p></div>' +
                '<div class="form-grid thirds">' +
                '<div class="fg"><label>Carousel position</label><select id="modalCarouselAlign">' + renderOptions([["stretch", "Stretch page width"], ["left", "Left edge"], ["center", "Center"], ["right", "Right edge"]], activeAlign) + '</select><small>Center is best for a single card.</small></div>' +
                '<div class="fg"><label>Section max width</label><input id="modalCarouselMaxWidth" value="' + escAttr(active.max_width || "1480px") + '" placeholder="1480px"></div>' +
                '<input id="modalCarouselLayoutStyle" type="hidden" value="fit">' +
                '<div class="fg"><label>Card width</label><div class="readonly-field">Edit width on each card</div><small>Default cards auto-fit. A custom Width inside one card only changes that card.</small></div>' +
                '<div class="fg"><label>Visible cards</label><input id="modalCarouselVisibleCount" type="number" min="1" max="8" value="' + escAttr(active.visible_count || active.grid_columns || (active.id === "hero" ? 1 : active.id === "1" ? 2 : 5)) + '"></div>' +
                '<div class="fg"><label>Spacing between cards</label><input id="modalCarouselCardGap" type="number" min="0" max="80" value="' + escAttr(active.card_gap || (active.id === "hero" ? 0 : active.id === "1" ? 12 : 10)) + '"><small>Only changes card-to-card spacing inside this carousel.</small></div>' +
                '<div class="fg"><label>Heading align</label><select id="modalCarouselTextAlign">' + renderOptions([["left", "Left"], ["center", "Center"], ["right", "Right"]], activeTextAlign) + '</select></div>' +
                '<div class="fg"><label>Space above block</label><input id="modalCarouselBlockTop" type="number" min="0" max="200" value="' + escAttr(spacingNumberValue(active.block_spacing_top, 40)) + '"></div>' +
                '<div class="fg"><label>Space below block</label><input id="modalCarouselBlockBottom" type="number" min="0" max="200" value="' + escAttr(spacingNumberValue(active.block_spacing_bottom, 44)) + '"></div>' +
                '<div class="fg"><label>Text-to-cards spacing</label><input id="modalCarouselTextGap" type="number" min="0" max="120" value="' + escAttr(spacingNumberValue(active.text_gap, 28)) + '"></div>' +
                '</div>' +
                '<div class="fg" style="margin-top:16px"><label>Optional text before this carousel</label><textarea id="modalCarouselSectionText" placeholder="Example: Take a closer look.">' + esc(active.section_text || "") + '</textarea><small>Leave empty if you do not want an extra text block.</small></div>' +
                '<div class="form-grid thirds">' +
                '<div class="fg"><label>Text align</label><select id="modalCarouselSectionAlign">' + renderOptions([["left", "Left"], ["center", "Center"], ["right", "Right"]], activeSectionAlign) + '</select></div>' +
                '<div class="fg"><label>Text size</label><input id="modalCarouselSectionSize" type="number" min="14" max="96" value="' + escAttr(active.section_text_size || 44) + '"></div>' +
                '<div class="fg"><label>Text color</label><input id="modalCarouselSectionColor" type="color" value="' + escAttr(colorInputValue(active.section_text_color, "#1d2233")) + '"></div>' +
                '<div class="fg"><label>Text font</label>' + renderFontSelect("modalCarouselSectionFont", active.section_text_font || "Inter") + '</div>' +
                '<div class="fg"><label>Text max width</label><input id="modalCarouselSectionMaxWidth" value="' + escAttr(active.section_text_max_width || "860px") + '"></div>' +
                '<div class="fg"><label>Order</label><input id="modalCarouselOrder" type="number" value="' + escAttr(active.display_order || 1) + '"></div>' +
                '</div>' +
                '<details class="advanced-layout"><summary>Advanced heading style</summary>' +
                '<div class="form-grid thirds" style="margin-top:12px">' +
                '<div class="fg"><label>Heading font</label>' + renderFontSelect("modalCarouselHeaderFont", active.header_font || "Inter") + '</div>' +
                '<div class="fg"><label>Heading size</label><input id="modalCarouselHeaderSize" type="number" min="14" max="96" value="' + escAttr(active.header_font_size || 28) + '"></div>' +
                '<div class="fg"><label>Heading color</label><input id="modalCarouselHeaderColor" type="color" value="' + escAttr(colorInputValue(active.header_color, "#1d2233")) + '"></div>' +
                '</div></details>' +
                '<label class="inline-check" style="margin-top:14px"><input id="modalCarouselInfinite" type="checkbox" ' + (active.infinite_scroll === false ? "" : "checked") + (active.id === "hero" ? " disabled" : "") + '> Infinite carousel arrows</label>' +
                '</form>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="carouselLayoutForm">Save Layout</button>'
        });
        document.getElementById("carouselLayoutForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            active.layout_align = document.getElementById("modalCarouselAlign").value;
            active.max_width = document.getElementById("modalCarouselMaxWidth").value.trim() || "1480px";
            active.layout_style = document.getElementById("modalCarouselLayoutStyle").value;
            active.visible_count = Number(document.getElementById("modalCarouselVisibleCount").value || active.visible_count || 2);
            active.grid_columns = active.visible_count;
            active.card_gap = Number(document.getElementById("modalCarouselCardGap").value || active.card_gap || 12);
            active.block_spacing_top = spacingNumberValue(document.getElementById("modalCarouselBlockTop").value, 40);
            active.block_spacing_bottom = spacingNumberValue(document.getElementById("modalCarouselBlockBottom").value, 44);
            active.text_gap = spacingNumberValue(document.getElementById("modalCarouselTextGap").value, 28);
            active.text_align = document.getElementById("modalCarouselTextAlign").value;
            active.section_text = document.getElementById("modalCarouselSectionText").value.trim();
            active.section_text_align = document.getElementById("modalCarouselSectionAlign").value;
            active.section_text_size = Number(document.getElementById("modalCarouselSectionSize").value || active.section_text_size || 44);
            active.section_text_color = document.getElementById("modalCarouselSectionColor").value || "#1d2233";
            active.section_text_font = document.getElementById("modalCarouselSectionFont").value.trim() || "Inter";
            active.section_text_max_width = document.getElementById("modalCarouselSectionMaxWidth").value.trim() || "860px";
            active.display_order = Number(document.getElementById("modalCarouselOrder").value || active.display_order || 1);
            active.header_font = document.getElementById("modalCarouselHeaderFont").value.trim() || "Inter";
            active.header_font_size = Number(document.getElementById("modalCarouselHeaderSize").value || active.header_font_size || 28);
            active.header_color = document.getElementById("modalCarouselHeaderColor").value || "#1d2233";
            active.infinite_scroll = document.getElementById("modalCarouselInfinite").checked;
            await saveCarouselConfigFromModal("Carousel layout saved");
        });
    }

    async function saveCarouselConfigFromModal(message) {
        try {
            await saveCarouselConfig();
            closeModal();
            showToast(message, "ok");
            broadcastAdminUpdate();
            await loadCarouselCards(state.activeCarouselId);
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function addCarouselLayer() {
        const order = nextCarouselBlockOrder();
        const id = "carousel-" + Date.now();
        state.carousels.push(fixedCarouselSlot(id, "Carousel Layer", "New carousel layer", {
            id,
            name: "Carousel Layer",
            block_type: "carousel",
            header: "New carousel layer",
            eyebrow: "",
            display_order: order,
            is_active: true,
            cards: []
        }));
        state.activeCarouselId = id;
        await saveCarouselConfigFromModal("Carousel layer added");
    }

    async function addStandaloneTextBlock() {
        const order = nextCarouselBlockOrder();
        const id = "text-" + Date.now();
        state.carousels.push(fixedCarouselSlot(id, "Text Block", "Text Block", {
            id,
            name: "Text Block",
            block_type: "text",
            header: "Text Block",
            section_text: "",
            section_text_size: 44,
            section_text_color: "#1d2233",
            section_text_align: "left",
            section_text_max_width: "860px",
            block_spacing_top: 40,
            block_spacing_bottom: 44,
            text_gap: 28,
            display_order: order,
            is_active: true,
            cards: []
        }));
        state.activeCarouselId = id;
        await saveCarouselConfigFromModal("Text layer added");
    }

    function nextCarouselBlockOrder() {
        return Math.max(0, ...state.carousels.map((carousel) => Number(carousel.display_order) || 0)) + 1;
    }

    async function moveCarouselBlock(id, direction) {
        const blocks = sortedCarouselBlocks();
        const index = blocks.findIndex((carousel) => String(carousel.id) === String(id));
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return;
        const [item] = blocks.splice(index, 1);
        blocks.splice(nextIndex, 0, item);
        blocks.forEach((carousel, blockIndex) => {
            carousel.display_order = blockIndex + 1;
        });
        state.carousels = blocks;
        state.activeCarouselId = String(id);
        await saveCarouselConfigFromModal("Layout order updated");
    }

    async function deleteActiveLayoutBlock() {
        const active = activeCarousel();
        if (!active || ["hero", "1", "2"].includes(String(active.id))) return;
        if (!confirm("Delete this homepage layout layer?")) return;
        state.carousels = state.carousels.filter((carousel) => String(carousel.id) !== String(active.id));
        state.carousels.forEach((carousel, index) => {
            carousel.display_order = index + 1;
        });
        state.activeCarouselId = state.carousels[0] ? String(state.carousels[0].id) : "1";
        await saveCarouselConfigFromModal("Layout layer deleted");
    }

    async function toggleActiveCarouselBlock() {
        const active = activeCarousel();
        if (!active) return;
        if (active.is_active && !confirm("Remove this carousel block from the homepage? You can restore it later from this editor.")) return;
        active.is_active = !active.is_active;
        await saveCarouselConfigFromModal(active.is_active ? "Carousel block restored" : "Carousel block removed");
    }

    function sortedCarouselBlocks() {
        return state.carousels
            .slice()
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
    }

    function bindCarouselSlotDrag() {
        let draggedId = "";
        els.carouselArea.querySelectorAll("[data-drag-carousel]").forEach((node) => {
            node.addEventListener("dragstart", (event) => {
                draggedId = node.dataset.dragCarousel;
                event.dataTransfer.effectAllowed = "move";
                node.classList.add("is-dragging");
            });
            node.addEventListener("dragend", () => {
                node.classList.remove("is-dragging");
                draggedId = "";
            });
            node.addEventListener("dragover", (event) => {
                event.preventDefault();
                node.classList.add("is-drop-target");
            });
            node.addEventListener("dragleave", () => node.classList.remove("is-drop-target"));
            node.addEventListener("drop", async (event) => {
                event.preventDefault();
                node.classList.remove("is-drop-target");
                const targetId = node.dataset.dragCarousel;
                if (!draggedId || draggedId === targetId) return;
                const blocks = sortedCarouselBlocks();
                const from = blocks.findIndex((carousel) => String(carousel.id) === String(draggedId));
                const to = blocks.findIndex((carousel) => String(carousel.id) === String(targetId));
                if (from < 0 || to < 0) return;
                const [item] = blocks.splice(from, 1);
                blocks.splice(to, 0, item);
                blocks.forEach((carousel, blockIndex) => {
                    carousel.display_order = blockIndex + 1;
                });
                state.carousels = blocks;
                state.activeCarouselId = draggedId;
                await saveCarouselConfigFromModal("Layout order updated");
            });
        });
    }

    function renderCarouselLocationGuide(active) {
        const isHero = String(active.id) === "hero";
        const isFeatured = String(active.id) === "1";
        const slotName = isHero ? "Hero Visual" : isFeatured ? "Big Carousel" : "Bottom Small Carousel";
        const locationText = isHero
            ? "Homepage -> hero visual card"
            : isFeatured
            ? "Homepage -> after Course Catalog -> before Featured module previews"
            : "Homepage -> after Big Carousel -> before Bottom Small Carousel cards";
        const textNote = isHero
            ? "This card replaces the old static hero illustration."
            : isFeatured
            ? "Optional text appears between the Course Catalog and the Big Carousel."
            : "Optional text appears between the Big Carousel and the Bottom Small Carousel.";
        return '' +
            '<div class="layout-guide">' +
            '<div class="layout-guide-card">' +
            '<span class="location-chip"><i class="fas fa-location-dot"></i> Editing: ' + esc(slotName) + '</span>' +
            '<h4 style="margin-top:14px">Where this appears on the homepage</h4>' +
            '<div class="homepage-map" aria-label="Homepage section map">' +
            renderMapBlock("Hero", "GradStudio title and single visual card", isHero) +
            renderMapBlock("Catalog", "Module filters and module cards", false) +
            renderMapBlock("Text + Big", "Optional text, then main carousel cards", !isHero && isFeatured) +
            renderMapBlock("Text + Small", "Optional text, then smaller carousel row", !isHero && !isFeatured) +
            renderMapBlock("Footer", "About, contact, legal links", false) +
            '</div>' +
            '<p class="preview-note"><strong>Text slot:</strong> ' + esc(textNote) + '</p>' +
            '</div>' +
            '<div class="layout-preview-panel">' +
            '<div class="preview-label"><span>Live placement preview</span><span id="layoutPreviewSlot">' + esc(slotName) + '</span></div>' +
            '<div id="carouselLayoutPreview" class="layout-preview-stage" data-location="' + escAttr(locationText) + '"></div>' +
            '<p class="preview-note">This is a small map of the homepage. The card rows below this panel are the cards used in the highlighted carousel.</p>' +
            '</div>' +
            '</div>';
    }

    function renderMapBlock(label, description, active) {
        return '<div class="map-block ' + (active ? "active" : "") + '">' +
            '<span>' + esc(label) + '</span>' +
            '<div><b>' + esc(active ? "You are changing this section" : description) + '</b><small>' + esc(active ? description : "") + '</small></div>' +
            '</div>';
    }

    function bindCarouselLayoutPreview() {
        updateCarouselLayoutPreview();
        [
            "carouselAlign", "carouselMaxWidth", "carouselLayoutStyle", "carouselVisibleCount", "carouselCardGap",
            "carouselEyebrow", "carouselHeader", "carouselTextAlign", "carouselHeaderFont", "carouselHeaderSize",
            "carouselHeaderColor", "carouselSectionText", "carouselSectionFont", "carouselSectionSize",
            "carouselSectionColor", "carouselSectionAlign", "carouselSectionMaxWidth"
        ].forEach((id) => {
            const node = document.getElementById(id);
            if (!node) return;
            node.addEventListener("input", updateCarouselLayoutPreview);
            node.addEventListener("change", updateCarouselLayoutPreview);
        });
    }

    function updateCarouselLayoutPreview() {
        const preview = document.getElementById("carouselLayoutPreview");
        if (!preview) return;
        const align = getInputValue("carouselAlign", "stretch");
        const width = previewCssLength(getInputValue("carouselMaxWidth", "1480px"), "100%");
        const layoutStyle = getInputValue("carouselLayoutStyle", "fit");
        const visible = Math.max(1, Math.min(8, Number(getInputValue("carouselVisibleCount", "2")) || 2));
        const sectionText = getInputValue("carouselSectionText", "").trim();
        const sectionAlign = getInputValue("carouselSectionAlign", "left");
        const textColor = getInputValue("carouselSectionColor", "#1d2233");
        const textSize = Math.max(14, Math.min(96, Number(getInputValue("carouselSectionSize", "44")) || 44));
        const heading = getInputValue("carouselHeader", "Featured module previews").trim() || "Carousel title";
        const eyebrow = getInputValue("carouselEyebrow", "").trim();
        const headingAlign = getInputValue("carouselTextAlign", "left");
        const headingColor = getInputValue("carouselHeaderColor", "#1d2233");
        const headingSize = Math.max(14, Math.min(96, Number(getInputValue("carouselHeaderSize", "28")) || 28));
        const cards = state.carouselCards.length ? state.carouselCards : [{ title: "Carousel card" }, { title: "Second card" }];
        const previewCards = cards.slice(0, Math.max(visible, Math.min(cards.length, 4)));
        const cardWidth = layoutStyle === "custom_width" ? "86px" : Math.max(42, Math.floor(260 / visible) - 6) + "px";

        preview.innerHTML = '' +
            '<div class="mini-home-section"></div>' +
            '<div class="mini-home-section catalog"></div>' +
            '<div class="mini-carousel-wrap ' + escAttr(align) + '" style="width:' + escAttr(width === "auto" ? "100%" : width) + ';max-width:100%">' +
            (sectionText ? '<div class="mini-section-text" style="text-align:' + escAttr(sectionAlign) + ';color:' + escAttr(textColor) + ';font-size:' + Math.round(textSize * 0.34) + 'px">' + esc(sectionText) + '</div>' : '<div class="mini-section-text" style="font-size:12px;color:#94a3b8;font-weight:700">No text block added yet</div>') +
            (eyebrow ? '<div class="mini-eyebrow" style="text-align:' + escAttr(headingAlign) + '">' + esc(eyebrow) + '</div>' : '') +
            '<div class="mini-heading" style="text-align:' + escAttr(headingAlign) + ';color:' + escAttr(headingColor) + ';font-size:' + Math.round(headingSize * 0.42) + 'px">' + esc(heading) + '</div>' +
            '<div class="mini-rail ' + escAttr(align) + '">' +
            previewCards.map((card) => renderMiniLayoutCard(card, cardWidth)).join("") +
            '</div>' +
            '</div>';
    }

    function renderMiniLayoutCard(card, cardWidth) {
        return '<div class="mini-card" style="--mini-card-width:' + escAttr(cardWidth) + '">' +
            (card && card.id ? renderCarouselThumb(card) : '') +
            '<span class="mini-card-title">' + esc(card.title || "Card") + '</span>' +
            '</div>';
    }

    function getInputValue(id, fallback) {
        const node = document.getElementById(id);
        return node ? node.value : fallback;
    }

    function previewCssLength(value, fallback) {
        const text = String(value || "").trim();
        if (!text) return fallback;
        if (/^(auto|none)$/i.test(text)) return text.toLowerCase();
        if (/^\d+(\.\d+)?(px|rem|em|%|vw|vh)$/i.test(text)) return text;
        if (/^\d+(\.\d+)?$/i.test(text)) return text + "px";
        return fallback;
    }

    function renderCarouselCardsList() {
        if (!state.carouselCards.length) {
            return '<div class="empty-box"><strong>No carousel cards yet</strong><br><span class="hint">Add a card and choose whether it opens selected course cards or opens a course directly.</span></div>';
        }
        return '<div class="carousel-cards">' + state.carouselCards.map(renderCarouselCardRow).join("") + '</div>';
    }

    function renderCarouselCardRow(card) {
        return '' +
            '<div class="carousel-row">' +
            '<div class="carousel-thumb">' + renderCarouselThumb(card) + '</div>' +
            '<div><h3>' + esc(card.title || "Untitled card") + (card.is_active ? "" : ' <small>(inactive)</small>') + '</h3>' +
            '<p>' + esc(card.description || targetSummary(card)) + '</p>' +
            '<small>' + esc(targetSummary(card)) + '</small></div>' +
            '<div class="action-row">' +
            '<button class="btn-s" type="button" data-edit-carousel-card="' + escAttr(card.id) + '"><i class="fas fa-pen"></i> Edit</button>' +
            '<button class="btn-s btn-danger" type="button" data-delete-carousel-card="' + escAttr(card.id) + '"><i class="fas fa-trash"></i></button>' +
            '</div></div>';
    }

    function renderCarouselThumb(card) {
        if (card.content_type === "image" && card.image_url) {
            return '<img src="' + escAttr(resolveAssetUrl(card.image_url)) + '" alt="' + escAttr(card.title + " thumbnail") + '">';
        }
        if (card.content_type === "iframe" && card.iframe_url) {
            return '<iframe title="' + escAttr(card.title) + '" src="' + escAttr(resolveAssetUrl(card.iframe_url)) + '" loading="lazy"></iframe>';
        }
        if (card.content_type === "html" && card.content_html) {
            return renderSafeHtmlPreview(card.content_html, card.title);
        }
        return '<i class="' + escAttr(card.icon_class || "fas fa-star") + '"></i>';
    }

    function targetSummary(card) {
        if (card.target_type === "course") {
            const course = state.courses.find((item) => item.id === card.target_id);
            return "Opens course directly: " + (course ? course.title : card.target_id);
        }
        if (card.target_type === "course_list") {
            return "Shows selected course cards: " + card.course_links.length;
        }
        return "No click action";
    }

    function openCarouselCardModal(card) {
        const isEdit = !!card;
        const activeCarouselId = card ? String(card.carousel_id) : state.activeCarouselId;
        const defaultTarget = activeCarouselId === "hero" ? "none" : activeCarouselId === "2" ? "course" : "course_list";
        const defaultHtml = activeCarouselId === "hero" ? heroLabWindowHtml() : snippets[3].html;
        const defaultWidth = activeCarouselId === "hero" ? "860px" : activeCarouselId === "2" ? "220px" : "400px";
        const defaultHeight = activeCarouselId === "hero" ? "360px" : activeCarouselId === "2" ? "160px" : "420px";
        const frameChecked = card ? card.frame_style !== "flush" : activeCarouselId !== "hero";
        const selectedIds = card ? card.course_links : [];
        const selectedCourse = card && card.target_type === "course" ? card.target_id : (state.courses[0] ? state.courses[0].id : "");
        showModal({
            title: isEdit ? "Edit Carousel Card" : "Add Carousel Card",
            wide: true,
            body: '' +
                '<form id="carouselCardForm">' +
                '<div class="row">' +
                '<div class="fg"><label>Carousel</label><select id="ccCarousel">' + state.carousels.map((carousel) => '<option value="' + escAttr(carousel.id) + '"' + (carousel.id === activeCarouselId ? " selected" : "") + ">" + esc(carouselSlotLabel(carousel)) + "</option>").join("") + '</select></div>' +
                '<div class="fg"><label>Display Order</label><input id="ccOrder" type="number" value="' + escAttr(card ? card.display_order : nextCarouselCardOrder(activeCarouselId)) + '"></div>' +
                '</div>' +
                '<div class="fg"><label>Card title</label><input id="ccTitle" value="' + escAttr(card ? card.title : "") + '" placeholder="Fullstack"><small>Leave empty when you hide card text or only want the thumbnail visible.</small></div>' +
                '<div class="fg"><label>Description</label><textarea id="ccDescription" placeholder="Short text shown on the carousel card. Leave empty if not needed.">' + esc(card ? card.description : "") + '</textarea></div>' +
                '<div class="row">' +
                '<div class="fg"><label>Thumbnail Type</label><select id="ccContentType"><option value="html">HTML thumbnail</option><option value="image">Image URL</option><option value="iframe">Iframe URL</option><option value="standard">Icon card</option></select></div>' +
                '<div class="fg"><label>Click Behavior</label><select id="ccTargetType"><option value="course_list">Show selected course cards</option><option value="course">Open course contents directly</option><option value="none">No click action</option></select></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="fg"><label>Image URL</label><input id="ccImageUrl" value="' + escAttr(card ? card.image_url : "") + '" placeholder="https://... or /carousel/images/card.png"></div>' +
                '<div class="fg"><label>Iframe URL</label><input id="ccIframeUrl" value="' + escAttr(card ? card.iframe_url : "") + '" placeholder="/carousel/html/card.html"></div>' +
                '</div>' +
                '<div class="fg" id="ccImageUploadWrap"><label>Upload Image Thumbnail</label><div class="action-row"><input id="ccImageFile" type="file" accept="image/*" style="flex:1"><button class="btn-s" type="button" id="ccUploadImage"><i class="fas fa-upload"></i> Upload Image</button></div><small>Uploads an image to the carousel media folder and fills Image URL.</small></div>' +
                '<div class="fg" id="ccHtmlUploadWrap"><label>Upload HTML Thumbnail File</label><div class="action-row"><input id="ccHtmlFile" type="file" accept=".html,text/html" style="flex:1"><button class="btn-s" type="button" id="ccUploadHtml"><i class="fas fa-upload"></i> Upload HTML</button></div><small>Uploads a standalone .html thumbnail and uses it as an iframe carousel thumbnail.</small></div>' +
                '<div class="fg"><label>HTML Thumbnail</label><textarea id="ccContentHtml" placeholder="<div class=&quot;thumbnail-card&quot;>...</div>">' + esc(card ? card.content_html : defaultHtml) + '</textarea><small>Use this for custom carousel HTML thumbnails.</small></div>' +
                '<label class="inline-check" style="margin:0 0 14px"><input id="ccFrameEnabled" type="checkbox" ' + (frameChecked ? "checked" : "") + '> Show card frame and shading</label>' +
                '<p class="hint" style="margin:-8px 0 14px">Turn off for a transparent page-color card with no border, shadow, or overlay.</p>' +
                '<div class="fg" id="ccSnippetWrap"><label>Starter Thumbnails</label><div class="pill-row" id="ccSnippetLibrary"></div></div>' +
                '<div class="row">' +
                '<div class="fg"><label>Icon Class</label><input id="ccIcon" value="' + escAttr(card ? card.icon_class : "fas fa-layer-group") + '"></div>' +
                '<div class="fg"><label>Accent Color</label><input id="ccColor" type="color" value="' + escAttr(card ? card.color_hex : "#3b82f6") + '"></div>' +
                '<div class="fg"><label>Width</label><input id="ccWidth" value="' + escAttr(card ? card.width : defaultWidth) + '"><small>Only this card changes width.</small></div>' +
                '<div class="fg" id="ccHeightGroup"><label>Height</label><input id="ccHeight" value="' + escAttr(card ? card.height_px : defaultHeight) + '"><small id="ccHeightRule">The first active card height sets every card height in this carousel. Width remains per-card.</small></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="fg"><label>Text Position</label><select id="ccTextPosition"><option value="bottom">Bottom overlay</option><option value="top">Top overlay</option><option value="center">Center overlay</option><option value="hidden">Hide text</option></select></div>' +
                '<div class="fg"><label>Text Align</label><select id="ccTextAlign"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>' +
                '<div class="fg"><label>Card Background</label><input id="ccBgColor" type="color" value="' + escAttr(colorInputValue(card && card.bg_color, "#111827")) + '"></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="fg"><label>Title Font</label>' + renderFontSelect("ccHeadingFont", card && card.heading_font ? card.heading_font : "Inter") + '</div>' +
                '<div class="fg"><label>Title Size</label><input id="ccHeadingSize" type="number" min="10" max="64" value="' + escAttr(card && card.heading_size ? card.heading_size : 24) + '"></div>' +
                '<div class="fg"><label>Title Color</label><input id="ccHeadingColor" type="color" value="' + escAttr(colorInputValue(card && card.heading_color, "#ffffff")) + '"></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="fg"><label>Subtitle Font</label>' + renderFontSelect("ccSubFont", card && card.sub_font ? card.sub_font : "Inter") + '</div>' +
                '<div class="fg"><label>Subtitle Size</label><input id="ccSubSize" type="number" min="10" max="40" value="' + escAttr(card && card.sub_size ? card.sub_size : 13) + '"></div>' +
                '<div class="fg"><label>Subtitle Color</label><input id="ccSubColor" type="color" value="' + escAttr(colorInputValue(card && card.sub_color, "#dbe3f1")) + '"></div>' +
                '</div>' +
                '<label class="inline-check" style="margin-bottom:14px"><input id="ccActive" type="checkbox" ' + (!card || card.is_active ? "checked" : "") + '> Active card</label>' +
                '<div id="ccDirectCourseWrap" class="fg"><label>Direct Course</label><select id="ccDirectCourse">' + renderCourseOptions(selectedCourse) + '</select><small>Used when click behavior opens course contents directly.</small></div>' +
                '<div id="ccCourseListWrap" class="fg"><label>Courses to Display</label><small>Select the course cards shown after clicking this carousel card.</small>' + renderCoursePicker(selectedIds) + '</div>' +
                '</form>' +
                '<div id="ccPreview" class="preview-card"></div>',
            footer: '<button class="btn-s" type="button" data-close>Cancel</button><button class="btn-a" type="submit" form="carouselCardForm">' + (isEdit ? "Save Card" : "Create Card") + '</button>'
        });

        document.getElementById("ccContentType").value = card ? card.content_type : "html";
        document.getElementById("ccTargetType").value = card ? card.target_type : defaultTarget;
        document.getElementById("ccTextPosition").value = card ? (card.text_position || "bottom") : (activeCarouselId === "hero" ? "hidden" : "bottom");
        document.getElementById("ccTextAlign").value = card ? (card.text_align || "left") : "left";
        document.getElementById("carouselCardForm").dataset.cardId = card ? String(card.id) : "__new__";
        ["ccCarousel", "ccOrder", "ccTitle", "ccDescription", "ccContentType", "ccTargetType", "ccImageUrl", "ccIframeUrl", "ccContentHtml", "ccFrameEnabled", "ccIcon", "ccColor", "ccWidth", "ccHeight", "ccTextPosition", "ccTextAlign", "ccBgColor", "ccHeadingFont", "ccHeadingSize", "ccHeadingColor", "ccSubFont", "ccSubSize", "ccSubColor", "ccActive", "ccDirectCourse"].forEach((id) => {
            const node = document.getElementById(id);
            if (node) {
                node.addEventListener("input", updateCarouselCardModal);
                node.addEventListener("change", updateCarouselCardModal);
            }
        });
        bindCoursePickerControls();
        renderCarouselSnippetLibrary();
        document.getElementById("ccUploadImage").addEventListener("click", uploadCarouselImageThumbnail);
        document.getElementById("ccUploadHtml").addEventListener("click", uploadCarouselHtmlThumbnail);
        document.getElementById("carouselCardForm").addEventListener("submit", (event) => saveCarouselCardFromModal(event, card));
        updateCarouselCardModal();
    }

    function renderCourseOptions(selectedId) {
        return state.courses.map((course) => {
            return '<option value="' + escAttr(course.id) + '"' + (course.id === selectedId ? " selected" : "") + ">" + esc(course.title) + " (" + esc(categoryName(course.category)) + ")</option>";
        }).join("");
    }

    function renderCoursePicker(selectedIds) {
        const selected = new Set((selectedIds || []).map(String));
        const folderRows = state.categories
            .slice()
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
            .map((category) => {
                const folderCourses = state.courses.filter((course) => course.category === category.id);
                const searchText = [category.name, category.id].join(" ").toLowerCase();
                const checkedCount = folderCourses.filter((course) => selected.has(course.id)).length;
                const checked = folderCourses.length > 0 && checkedCount === folderCourses.length;
                return '<label class="course-picker-row" data-course-picker-row data-course-picker-mode="folder" data-folder-id="' + escAttr(category.id) + '" data-course-picker-name="' + escAttr(String(category.name || "").toLowerCase()) + '" data-course-picker-search="' + escAttr(searchText) + '">' +
                    '<input type="checkbox" data-folder-link value="' + escAttr(category.id) + '"' + (checked ? " checked" : "") + '>' +
                    '<div><span>' + esc(category.name) + '</span><small>' + esc(folderCourses.length + " courses") + '</small></div></label>';
            })
            .join("");
        const knownRows = state.courses.map((course) => {
            const meta = categoryName(course.category) + (course.parent_course_id ? " / nested" : "");
            const searchText = [course.title, meta, course.id].join(" ").toLowerCase();
            return '<label class="course-picker-row" data-course-picker-row data-course-picker-mode="course" data-course-picker-folder="' + escAttr(course.category) + '" data-course-picker-course="' + escAttr(course.id) + '" data-course-picker-name="' + escAttr(String(course.title || "").toLowerCase()) + '" data-course-picker-search="' + escAttr(searchText) + '"><input type="checkbox" name="ccCourseLink" value="' + escAttr(course.id) + '"' + (selected.has(course.id) ? " checked" : "") + '>' +
                '<div><span>' + esc(course.title) + '</span><small>' + esc(meta) + '</small></div></label>';
        }).join("");
        const knownIds = new Set(state.courses.map((course) => course.id));
        const missingRows = Array.from(selected)
            .filter((id) => id && !knownIds.has(id))
            .map((id) => '<label class="course-picker-row" data-course-picker-row data-course-picker-mode="course" data-course-picker-folder="saved" data-course-picker-course="' + escAttr(id) + '" data-course-picker-name="' + escAttr(String(id).toLowerCase()) + '" data-course-picker-search="' + escAttr(String(id).toLowerCase()) + '"><input type="checkbox" name="ccCourseLink" value="' + escAttr(id) + '" checked>' +
                '<div><span>' + esc(id) + '</span><small>Saved course id not currently in the catalog</small></div></label>')
            .join("");
        return '' +
            '<div class="course-picker-tools">' +
            '<div class="course-picker-mode" role="radiogroup" aria-label="Choose search type">' +
            '<span>Choose one:</span>' +
            '<label><input type="radio" name="ccCourseSearchMode" value="folder"> Folder</label>' +
            '<label><input type="radio" name="ccCourseSearchMode" value="course" checked> Courses</label>' +
            '</div>' +
            '<input id="ccCourseSearch" type="search" placeholder="Search course name">' +
            '<small id="ccCoursePickerCount"></small>' +
            '</div>' +
            '<div class="course-picker" id="ccCoursePicker">' + folderRows + knownRows + missingRows + '</div>';
    }

    function bindCoursePickerControls() {
        els.modalBox.querySelectorAll('input[name="ccCourseSearchMode"]').forEach((input) => {
            input.addEventListener("change", filterCoursePicker);
        });
        const search = document.getElementById("ccCourseSearch");
        if (search) {
            search.addEventListener("input", filterCoursePicker);
        }
        els.modalBox.querySelectorAll("[data-folder-link]").forEach((input) => {
            input.addEventListener("change", () => {
                setFolderCourseSelection(input.value, input.checked);
                updateCoursePickerState();
            });
        });
        els.modalBox.querySelectorAll('input[name="ccCourseLink"]').forEach((input) => {
            input.addEventListener("change", updateCoursePickerState);
        });
        filterCoursePicker();
    }

    function filterCoursePicker() {
        const search = document.getElementById("ccCourseSearch");
        const query = search ? search.value.trim().toLowerCase() : "";
        const modeInput = els.modalBox.querySelector('input[name="ccCourseSearchMode"]:checked');
        const mode = modeInput ? modeInput.value : "course";
        const picker = document.getElementById("ccCoursePicker");
        if (search) {
            search.placeholder = mode === "folder" ? "Search folder name" : "Search course name";
        }
        let visible = 0;
        const rows = Array.from(els.modalBox.querySelectorAll("[data-course-picker-row]"));
        const rankedRows = rows.map((row, index) => {
            const modeMatch = row.dataset.coursePickerMode === mode;
            const name = String(row.dataset.coursePickerName || "");
            const searchText = String(row.dataset.coursePickerSearch || "");
            const queryMatch = !query || String(row.dataset.coursePickerSearch || "").includes(query);
            const isVisible = modeMatch && queryMatch;
            row.hidden = !isVisible;
            if (isVisible) visible += 1;
            return {
                row,
                index,
                rank: isVisible ? coursePickerRank(name, searchText, query) : Number.POSITIVE_INFINITY
            };
        });
        if (picker) {
            rankedRows
                .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
                .forEach((item) => picker.appendChild(item.row));
            picker.scrollTop = 0;
        }
        updateFolderCheckboxes();
        const counter = document.getElementById("ccCoursePickerCount");
        if (counter) {
            const selectedCount = selectedCarouselCourseIds().length;
            counter.textContent = selectedCount + " selected - " + visible + " visible";
        }
    }

    function coursePickerRank(name, searchText, query) {
        if (!query) return 20;
        if (name === query) return 0;
        if (name.startsWith(query)) return 1;
        if (name.split(/\s+/).some((word) => word.startsWith(query))) return 2;
        if (name.includes(query)) return 3;
        if (searchText.startsWith(query)) return 4;
        return 5;
    }

    function updateCoursePickerState() {
        updateFolderCheckboxes();
        filterCoursePicker();
        renderCarouselModalPreview();
    }

    function setFolderCourseSelection(folderId, isSelected) {
        els.modalBox.querySelectorAll('input[name="ccCourseLink"]').forEach((input) => {
            const row = input.closest("[data-course-picker-row]");
            if (row && row.dataset.coursePickerFolder === String(folderId)) {
                input.checked = isSelected;
            }
        });
    }

    function updateFolderCheckboxes() {
        const selected = new Set(selectedCarouselCourseIds());
        els.modalBox.querySelectorAll("[data-folder-link]").forEach((input) => {
            const folderId = String(input.value || "");
            const courseIds = state.courses
                .filter((course) => String(course.category) === folderId)
                .map((course) => String(course.id));
            const selectedCount = courseIds.filter((id) => selected.has(id)).length;
            input.checked = courseIds.length > 0 && selectedCount === courseIds.length;
            input.indeterminate = selectedCount > 0 && selectedCount < courseIds.length;
        });
    }

    function renderCarouselSnippetLibrary() {
        const target = document.getElementById("ccSnippetLibrary");
        if (!target) return;
        target.innerHTML = snippets.map((snippet, index) => {
            return '<button type="button" class="pill-btn" data-carousel-snippet="' + index + '">' + esc(snippet.name) + '</button>';
        }).join("");
        target.querySelectorAll("[data-carousel-snippet]").forEach((button) => {
            button.addEventListener("click", () => {
                const snippet = snippets[Number(button.dataset.carouselSnippet)];
                if (!snippet) return;
                document.getElementById("ccContentType").value = "html";
                document.getElementById("ccContentHtml").value = snippet.html;
                updateCarouselCardModal();
            });
        });
    }

    function updateCarouselCardModal() {
        const targetType = document.getElementById("ccTargetType").value;
        const contentType = document.getElementById("ccContentType").value;
        document.getElementById("ccDirectCourseWrap").style.display = targetType === "course" ? "block" : "none";
        document.getElementById("ccCourseListWrap").style.display = targetType === "course_list" ? "block" : "none";
        document.getElementById("ccImageUrl").closest(".fg").style.display = contentType === "image" ? "block" : "none";
        document.getElementById("ccIframeUrl").closest(".fg").style.display = contentType === "iframe" ? "block" : "none";
        document.getElementById("ccContentHtml").closest(".fg").style.display = contentType === "html" ? "block" : "none";
        document.getElementById("ccImageUploadWrap").style.display = contentType === "image" ? "block" : "none";
        document.getElementById("ccHtmlUploadWrap").style.display = contentType === "iframe" ? "block" : "none";
        document.getElementById("ccSnippetWrap").style.display = contentType === "html" ? "block" : "none";
        updateCarouselHeightControl();
        filterCoursePicker();
        renderCarouselModalPreview();
    }

    function modalCarouselCards(carouselId) {
        const slotId = String(carouselId || state.activeCarouselId);
        const carousel = state.carousels.find((item) => String(item.id) === slotId);
        const cards = carousel && Array.isArray(carousel.cards)
            ? carousel.cards
            : state.carouselCards.filter((card) => String(card.carousel_id) === slotId);
        return normalizeCarouselCards(cards).filter((card) => String(card.carousel_id) === slotId);
    }

    function modalHeightContext() {
        const form = document.getElementById("carouselCardForm");
        const heightInput = document.getElementById("ccHeight");
        const currentId = form ? String(form.dataset.cardId || "__new__") : "__new__";
        const carouselId = document.getElementById("ccCarousel").value;
        const currentOrder = Number(document.getElementById("ccOrder").value || 0);
        const currentTitle = document.getElementById("ccTitle").value.trim() || "this card";
        const currentActive = document.getElementById("ccActive").checked;
        const currentHeight = heightInput.value.trim() || "420px";
        const cards = modalCarouselCards(carouselId)
            .filter((card) => String(card.id) !== currentId)
            .map((card) => ({ ...card }));
        if (currentActive) {
            cards.push({
                id: currentId,
                title: currentTitle,
                display_order: currentOrder,
                is_active: true,
                height_px: currentHeight
            });
        }
        const activeCards = cards
            .filter((card) => card.is_active !== false)
            .sort((a, b) => (Number(a.display_order || 0) - Number(b.display_order || 0)) || String(a.title || "").localeCompare(String(b.title || "")));
        const first = activeCards[0] || null;
        return {
            controlsHeight: !first || String(first.id) === currentId,
            first,
            currentId,
            currentHeight,
            effectiveHeight: first && first.height_px ? String(first.height_px) : currentHeight
        };
    }

    function updateCarouselHeightControl() {
        const heightInput = document.getElementById("ccHeight");
        const hint = document.getElementById("ccHeightRule");
        if (!heightInput || !hint) return;
        const context = modalHeightContext();
        heightInput.disabled = !context.controlsHeight;
        heightInput.classList.toggle("is-locked", !context.controlsHeight);
        if (context.controlsHeight) {
            hint.textContent = "This is the first active card, so this height sets every card height in this carousel.";
            return;
        }
        const firstTitle = context.first && context.first.title ? context.first.title : "the first active card";
        hint.textContent = "Locked: " + firstTitle + " controls carousel height (" + context.effectiveHeight + "). Move this card earlier to make its height apply.";
    }

    function renderCarouselModalPreview() {
        const contentType = document.getElementById("ccContentType").value;
        const title = document.getElementById("ccTitle").value.trim() || "Carousel card";
        const description = document.getElementById("ccDescription").value.trim() || targetLabelFromModal();
        let media = "";
        if (contentType === "image" && document.getElementById("ccImageUrl").value.trim()) {
            media = '<img src="' + escAttr(resolveAssetUrl(document.getElementById("ccImageUrl").value.trim())) + '" alt="' + escAttr(title + " thumbnail") + '">';
        } else if (contentType === "iframe" && document.getElementById("ccIframeUrl").value.trim()) {
            media = '<iframe title="' + escAttr(title) + '" src="' + escAttr(resolveAssetUrl(document.getElementById("ccIframeUrl").value.trim())) + '" loading="lazy" style="width:100%;height:100%;border:0"></iframe>';
        } else if (contentType === "html") {
            media = renderSafeHtmlPreview(document.getElementById("ccContentHtml").value, title) || '<div class="hint">HTML thumbnail preview</div>';
        } else {
            media = '<i class="' + escAttr(document.getElementById("ccIcon").value.trim() || "fas fa-star") + '" style="font-size:42px;color:' + escAttr(document.getElementById("ccColor").value || "#3b82f6") + '"></i>';
        }
        const titleStyle = 'font-family:' + escAttr(document.getElementById("ccHeadingFont").value.trim() || "Inter") + ';font-size:' + escAttr(document.getElementById("ccHeadingSize").value || 24) + 'px;color:' + escAttr(document.getElementById("ccHeadingColor").value || "#ffffff") + ';text-align:' + escAttr(document.getElementById("ccTextAlign").value || "left");
        const subStyle = 'font-family:' + escAttr(document.getElementById("ccSubFont").value.trim() || "Inter") + ';font-size:' + escAttr(document.getElementById("ccSubSize").value || 13) + 'px;color:' + escAttr(document.getElementById("ccSubColor").value || "#dbe3f1") + ';text-align:' + escAttr(document.getElementById("ccTextAlign").value || "left");
        const previewBody = document.getElementById("ccTextPosition").value === "hidden"
            ? ""
            : '<div class="preview-body" style="background:' + escAttr(document.getElementById("ccBgColor").value || "#111827") + ';text-align:' + escAttr(document.getElementById("ccTextAlign").value || "left") + '"><strong style="' + titleStyle + '">' + esc(title) + '</strong><div class="preview-meta" style="' + subStyle + '"><span>' + esc(description) + '</span></div></div>';
        const preview = document.getElementById("ccPreview");
        const heightContext = modalHeightContext();
        preview.className = "preview-card" + (document.getElementById("ccFrameEnabled").checked ? "" : " is-flush");
        preview.style.setProperty("--preview-card-width", document.getElementById("ccWidth").value.trim() || "400px");
        preview.style.setProperty("--preview-card-height", heightContext.effectiveHeight || "420px");
        preview.innerHTML = '<div class="preview-media">' + media + '</div>' + previewBody;
    }

    function targetLabelFromModal() {
        const targetType = document.getElementById("ccTargetType").value;
        if (targetType === "course") {
            const id = document.getElementById("ccDirectCourse").value;
            const course = state.courses.find((item) => item.id === id);
            return "Opens " + (course ? course.title : "course");
        }
        if (targetType === "course_list") {
            return "Shows " + selectedCarouselCourseIds().length + " selected course cards";
        }
        return "No click action";
    }

    function selectedCarouselCourseIds() {
        return Array.from(els.modalBox.querySelectorAll('input[name="ccCourseLink"]:checked')).map((input) => input.value);
    }

    async function uploadCarouselImageThumbnail() {
        const input = document.getElementById("ccImageFile");
        const file = input && input.files ? input.files[0] : null;
        if (!file) {
            showToast("Choose an image thumbnail file", "err");
            return;
        }

        try {
            showToast("Uploading image thumbnail...", "ok");
            const result = await uploadCarouselMedia(file, "image");
            document.getElementById("ccContentType").value = "image";
            document.getElementById("ccImageUrl").value = result.url || "";
            updateCarouselCardModal();
            showToast("Image thumbnail uploaded", "ok");
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function uploadCarouselHtmlThumbnail() {
        const input = document.getElementById("ccHtmlFile");
        const file = input && input.files ? input.files[0] : null;
        if (!file) {
            showToast("Choose an HTML thumbnail file", "err");
            return;
        }

        try {
            showToast("Uploading HTML thumbnail...", "ok");
            const result = await uploadCarouselMedia(file, "html");
            document.getElementById("ccContentType").value = "iframe";
            document.getElementById("ccIframeUrl").value = result.url || "";
            updateCarouselCardModal();
            showToast("HTML thumbnail uploaded", "ok");
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function uploadCarouselMedia(file, type) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        return apiJson("/api/admin/carousel/upload", {
            method: "POST",
            headers: authHeaders(),
            body: formData
        });
    }

    async function saveCarouselCardFromModal(event, existingCard) {
        event.preventDefault();
        const title = document.getElementById("ccTitle").value.trim();
        const targetType = document.getElementById("ccTargetType").value;
        const directCourse = document.getElementById("ccDirectCourse").value;
        const selectedIds = selectedCarouselCourseIds();
        if (targetType === "course" && !directCourse) {
            showToast("Choose a direct course", "err");
            return;
        }
        if (targetType === "course_list" && !selectedIds.length) {
            showToast("Select at least one course card to display", "err");
            return;
        }
        const carouselId = document.getElementById("ccCarousel").value;
        const payload = {
            id: existingCard ? existingCard.id : String(Date.now()),
            title,
            description: document.getElementById("ccDescription").value.trim(),
            icon_class: document.getElementById("ccIcon").value.trim() || "fas fa-star",
            color_hex: document.getElementById("ccColor").value || "#3b82f6",
            target_type: targetType,
            target_id: targetType === "course" ? directCourse : targetType === "course_list" ? "custom" : "none",
            display_order: Number(document.getElementById("ccOrder").value || 0),
            is_active: document.getElementById("ccActive").checked,
            content_type: document.getElementById("ccContentType").value,
            image_url: document.getElementById("ccImageUrl").value.trim(),
            iframe_url: document.getElementById("ccIframeUrl").value.trim(),
            content_html: normalizeStoredHtml(document.getElementById("ccContentHtml").value),
            width: document.getElementById("ccWidth").value.trim() || "400px",
            height_px: document.getElementById("ccHeight").value.trim() || "420px",
            frame_style: document.getElementById("ccFrameEnabled").checked ? "framed" : "flush",
            full_bleed: true,
            bg_color: document.getElementById("ccBgColor").value || "",
            heading_font: document.getElementById("ccHeadingFont").value.trim() || "Inter",
            heading_size: Number(document.getElementById("ccHeadingSize").value || 24),
            heading_color: document.getElementById("ccHeadingColor").value || "#ffffff",
            sub_font: document.getElementById("ccSubFont").value.trim() || "Inter",
            sub_size: Number(document.getElementById("ccSubSize").value || 13),
            sub_color: document.getElementById("ccSubColor").value || "#dbe3f1",
            text_position: document.getElementById("ccTextPosition").value,
            text_align: document.getElementById("ccTextAlign").value,
            carousel_id: carouselId,
            course_links: targetType === "course_list" ? selectedIds : []
        };

        try {
            upsertCarouselCard(payload, existingCard);
            await saveCarouselConfig();
            closeModal();
            state.activeCarouselId = String(payload.carousel_id);
            showToast(existingCard ? "Carousel card saved" : "Carousel card created", "ok");
            broadcastAdminUpdate();
            await loadCarouselCards(state.activeCarouselId);
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function saveCarouselSettings() {
        const active = state.carousels.find((carousel) => carousel.id === state.activeCarouselId);
        if (!active) return;
        try {
            active.header = document.getElementById("carouselHeader").value.trim();
            active.eyebrow = document.getElementById("carouselEyebrow").value.trim();
            active.display_order = Number(document.getElementById("carouselOrder").value || active.display_order || 1);
            active.is_active = document.getElementById("carouselActive").checked;
            active.layout_align = document.getElementById("carouselAlign").value;
            active.max_width = document.getElementById("carouselMaxWidth").value.trim() || "1480px";
            active.layout_style = document.getElementById("carouselLayoutStyle").value;
            active.visible_count = Number(document.getElementById("carouselVisibleCount").value || active.visible_count || 2);
            active.grid_columns = active.visible_count;
            active.card_gap = Number(document.getElementById("carouselCardGap").value || active.card_gap || 12);
            active.block_spacing_top = spacingNumberValue(document.getElementById("carouselBlockTop")?.value, active.block_spacing_top || 40);
            active.block_spacing_bottom = spacingNumberValue(document.getElementById("carouselBlockBottom")?.value, active.block_spacing_bottom || 44);
            active.text_gap = spacingNumberValue(document.getElementById("carouselTextGap")?.value, active.text_gap || 28);
            active.infinite_scroll = document.getElementById("carouselInfinite").checked;
            active.text_align = document.getElementById("carouselTextAlign").value;
            active.header_font = document.getElementById("carouselHeaderFont").value.trim() || "Inter";
            active.header_font_size = Number(document.getElementById("carouselHeaderSize").value || active.header_font_size || 28);
            active.header_color = document.getElementById("carouselHeaderColor").value || "#1d2233";
            active.section_text = document.getElementById("carouselSectionText").value.trim();
            active.section_text_font = document.getElementById("carouselSectionFont").value.trim() || "Inter";
            active.section_text_size = Number(document.getElementById("carouselSectionSize").value || active.section_text_size || 44);
            active.section_text_color = document.getElementById("carouselSectionColor").value || "#1d2233";
            active.section_text_align = document.getElementById("carouselSectionAlign").value;
            active.section_text_max_width = document.getElementById("carouselSectionMaxWidth").value.trim() || "860px";
            await saveCarouselConfig();
            showToast("Carousel settings saved", "ok");
            broadcastAdminUpdate();
            await loadCarouselCards(state.activeCarouselId);
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    async function deleteCarouselCard(id) {
        if (!confirm("Delete this carousel card?")) return;
        try {
            state.carousels.forEach((carousel) => {
                carousel.cards = (carousel.cards || []).filter((card) => String(card.id) !== String(id));
            });
            await deleteLegacyCarouselCardIfPossible(id);
            await saveCarouselConfig();
            showToast("Carousel card deleted", "ok");
            broadcastAdminUpdate();
            await loadCarouselCards(state.activeCarouselId);
        } catch (error) {
            showToast(error.message, "err");
        }
    }

    function upsertCarouselCard(payload, existingCard) {
        state.carousels.forEach((carousel) => {
            carousel.cards = (carousel.cards || []).filter((card) => {
                return !existingCard || String(card.id) !== String(existingCard.id);
            });
        });
        const targetCarousel = state.carousels.find((carousel) => carousel.id === String(payload.carousel_id));
        if (!targetCarousel) throw new Error("Carousel slot not found");
        targetCarousel.cards = targetCarousel.cards || [];
        targetCarousel.cards.push(payload);
        targetCarousel.cards = normalizeCarouselCards(targetCarousel.cards);
    }

    async function saveCarouselConfig() {
        const payload = {
            carousels: state.carousels.map((carousel) => ({
                id: carousel.id,
                name: carousel.name,
                block_type: carousel.block_type || "carousel",
                header: carousel.header,
                eyebrow: carousel.eyebrow,
                display_order: carousel.display_order,
                is_active: carousel.is_active,
                layout_align: carousel.layout_align,
                max_width: carousel.max_width,
                layout_style: carousel.layout_style,
                visible_count: carousel.visible_count,
                grid_columns: carousel.grid_columns || carousel.visible_count,
                card_gap: carousel.card_gap,
                block_spacing_top: carousel.block_spacing_top,
                block_spacing_bottom: carousel.block_spacing_bottom,
                text_gap: carousel.text_gap,
                infinite_scroll: carousel.infinite_scroll,
                text_align: carousel.text_align,
                header_font: carousel.header_font,
                header_font_size: carousel.header_font_size,
                header_color: carousel.header_color,
                section_text: carousel.section_text,
                section_text_font: carousel.section_text_font,
                section_text_size: carousel.section_text_size,
                section_text_color: carousel.section_text_color,
                section_text_align: carousel.section_text_align,
                section_text_max_width: carousel.section_text_max_width,
                cards: normalizeCarouselCards(carousel.cards || [])
            }))
        };
        let saved = null;
        try {
            saved = await apiJson("/api/admin/learn-carousels", {
                method: "PUT",
                headers: authJsonHeaders(),
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn("New learn carousel save failed; saving through legacy carousel API.", error);
            saved = await saveLegacyCarouselConfig(payload);
        }

        if (USE_LOCAL_CAROUSEL_CACHE) {
            writeLocalLearnCarouselConfig(saved);
        }
        state.carousels = normalizeCarousels(saved.carousels || payload.carousels);
    }

    async function saveLegacyCarouselConfig(payload) {
        const savedCarousels = [];
        for (const carousel of payload.carousels) {
            if (!/^\d+$/.test(String(carousel.id))) {
                savedCarousels.push(carousel);
                continue;
            }
            await apiJson("/api/admin/carousels", {
                method: "PUT",
                headers: authJsonHeaders(),
                body: JSON.stringify({
                    id: Number(carousel.id),
                    name: carousel.name,
                    header: carousel.header,
                    display_order: carousel.display_order,
                    is_active: carousel.is_active,
                    layout_style: carousel.layout_style,
                    grid_columns: carousel.grid_columns || carousel.visible_count,
                    infinite_scroll: carousel.infinite_scroll,
                    text_align: carousel.text_align,
                    header_font: carousel.header_font,
                    header_font_size: carousel.header_font_size,
                    header_color: carousel.header_color
                })
            });

            const savedCards = [];
            for (const card of carousel.cards || []) {
                const legacyPayload = legacyCarouselCardPayload(card, carousel.id);
                if (isLegacyCardId(card.id)) {
                    await apiJson("/api/admin/carousel", {
                        method: "PUT",
                        headers: authJsonHeaders(),
                        body: JSON.stringify({ ...legacyPayload, id: Number(card.id) })
                    });
                    savedCards.push(card);
                } else {
                    const result = await apiJson("/api/admin/carousel", {
                        method: "POST",
                        headers: authJsonHeaders(),
                        body: JSON.stringify(legacyPayload)
                    });
                    savedCards.push({ ...card, id: String(result.id || card.id) });
                }
            }

            savedCarousels.push({ ...carousel, cards: savedCards });
        }

        return { carousels: savedCarousels };
    }

    function legacyCarouselCardPayload(card, carouselId) {
        return {
            title: card.title,
            description: card.description,
            icon_class: card.icon_class,
            color_hex: card.color_hex,
            target_type: card.target_type,
            target_id: card.target_id,
            display_order: card.display_order,
            is_active: card.is_active,
            content_type: card.content_type,
            image_url: card.image_url,
            iframe_url: card.iframe_url,
            content_html: card.content_html,
            width: card.width,
            height_px: card.height_px,
            frame_style: card.frame_style,
            full_bleed: card.full_bleed,
            bg_color: card.bg_color,
            chip_text: card.chip_text,
            chip_color: card.chip_color,
            chip_enabled: card.chip_enabled,
            heading_font: card.heading_font,
            heading_size: card.heading_size,
            heading_color: card.heading_color,
            sub_font: card.sub_font,
            sub_size: card.sub_size,
            sub_color: card.sub_color,
            text_position: card.text_position,
            text_align: card.text_align,
            carousel_id: Number(carouselId || card.carousel_id || state.activeCarouselId || 1),
            course_links: card.target_type === "course_list" ? card.course_links : []
        };
    }

    async function deleteLegacyCarouselCardIfPossible(id) {
        if (!isLegacyCardId(id)) return;
        try {
            await apiJson("/api/admin/carousel/" + encodeURIComponent(id), {
                method: "DELETE",
                headers: authHeaders()
            });
        } catch (error) {
            console.warn("Legacy carousel card delete failed.", error);
        }
    }

    function isLegacyCardId(id) {
        return /^\d+$/.test(String(id || ""));
    }

    function nextCarouselCardOrder(carouselId) {
        const cards = state.carouselCards.filter((card) => card.carousel_id === String(carouselId || state.activeCarouselId));
        return cards.length ? Math.max(...cards.map((card) => card.display_order || 0)) + 1 : 1;
    }

    async function openRecycleBin() {
        state.mode = "recycle";
        state.activeCourseId = "";
        els.emptyState.style.display = "none";
        els.courseForm.classList.remove("show");
        els.contentsCard.classList.remove("show");
        els.carouselArea.classList.remove("show");
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

    function showModal({ title, body, footer, wide }) {
        els.modalBox.className = "modal" + (wide ? " modal-wide" : "");
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
        els.modalBox.className = "modal";
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

    function resolveAssetUrl(value) {
        const raw = String(value || "").trim();
        if (!raw) return "";
        if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
        if (raw.startsWith("//")) return window.location.protocol + raw;
        if (raw.startsWith("/")) {
            const needsApiOrigin = window.location.protocol === "file:" ||
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1";
            return needsApiOrigin ? API_BASE + raw : raw;
        }
        return raw;
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
