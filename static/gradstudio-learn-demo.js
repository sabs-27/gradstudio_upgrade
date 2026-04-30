(function () {
    const pageSize = 9;
    const PINNED_STORAGE_KEY = "gradstudio_learn_pinned_v1";
    const GOOGLE_CLIENT_ID = "506619320686-uhlmttc48vj7osbolv8ragqkfs1v4l70.apps.googleusercontent.com";
    let activeTopic = "All";
    let activePage = 1;
    let query = "";
    let pinnedItems = getAuthToken() ? loadPinnedItems() : [];
    let googleTokenClient = null;
    let pendingGoogleAuthMode = "signin";
    let pinSyncTimer = 0;
    let pinSyncInFlight = null;

    const htmlDemoCards = [
        {
            title: "Express.js 3D Card",
            eyebrow: "Editable starter thumbnail",
            html: starterThumbnailHtml("EXP", "Express.js<br>API Module", "JS", "#101827", "#1f6f5b", "#34d399", "#60a5fa", "#111827", "#ffffff"),
            courseIds: ["backend1", "frontend1", "pyb"]
        },
        {
            title: "MERN Stack 3D UI",
            eyebrow: "Editable starter thumbnail",
            html: starterThumbnailHtml("MERN", "MERN Stack<br>3D UI", "M", "#122019", "#0f766e", "#22c55e", "#93c5fd", "#dcfce7", "#064e3b"),
            courseIds: ["mogodb1", "frontend1", "backend1"]
        },
        {
            title: "MongoDB 3D Card",
            eyebrow: "Editable starter thumbnail",
            html: starterThumbnailHtml("DB", "MongoDB<br>Data Module", "DB", "#102018", "#14532d", "#84cc16", "#34d399", "#dcfce7", "#14532d"),
            courseIds: ["mogodb1", "dte"]
        },
        {
            title: "React 3D Card",
            eyebrow: "Editable starter thumbnail",
            html: starterThumbnailHtml("UI", "React<br>Component Module", "R", "#101827", "#1d4ed8", "#38bdf8", "#a78bfa", "#e0f2fe", "#0f172a"),
            courseIds: ["frontend1"]
        }
    ];

    function starterThumbnailHtml(badge, title, logo, bg1, bg2, glow1, glow2, badgeBg, badgeText) {
        return '<div class="thumbnail-card" style="--bg-dark-1:' + bg1 + ';--bg-dark-2:' + bg2 + ';--glow-top-left:' + glow1 + ';--glow-bottom-right:' + glow2 + ';--badge-bg:' + badgeBg + ';--badge-text:' + badgeText + ';--title-top:58%;--title-width:62%;"><span class="thumbnail-badge">' + badge + '</span><h3 class="thumbnail-title">' + title + '</h3><div class="thumbnail-logo" aria-hidden="true"><span class="thumbnail-logo-text">' + logo + '</span></div></div>';
    }

    function heroLabWindowHtml() {
        return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.lab-window{position:absolute;inset:0;border:1px solid rgba(118,131,156,.18);border-radius:0;background:#fff;overflow:hidden}
.window-bar{display:flex;align-items:center;gap:10px;height:12%;min-height:34px;padding:0 5%;background:#f3f6fb;border-bottom:1px solid #e7ebf2}
.window-bar span{width:12px;height:12px;border-radius:999px;background:#f16b5f}.window-bar span:nth-child(2){background:#f4b64a}.window-bar span:nth-child(3){background:#20a67a}
.lab-screen{position:relative;height:88%;overflow:hidden;background:linear-gradient(135deg,#79b4d7,#d9eef8)}
.desktop-strip{position:absolute;top:12%;left:7%;display:grid;gap:18px}.desktop-strip span{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.74);box-shadow:0 8px 18px rgba(29,41,57,.16)}
.editor-panel{position:absolute;left:22%;top:25%;width:52%;height:42%;padding:6% 5%;background:#191d20;color:#e7ebf2;box-shadow:0 26px 50px rgba(23,32,51,.22)}
.editor-title{font-size:clamp(20px,4.2vw,34px);font-weight:760}.editor-lines{display:grid;gap:14px;margin-top:12%}.editor-lines span{height:8px;border-radius:999px;background:rgba(255,255,255,.16)}.editor-lines span:nth-child(1){width:72%}.editor-lines span:nth-child(2){width:52%}.editor-lines span:nth-child(3){width:64%;background:rgba(255,90,0,.56)}.editor-lines span:nth-child(4){width:42%}
.terminal-panel{position:absolute;left:47%;bottom:15%;width:32%;min-width:190px;padding:18px;border:2px solid #0d1523;background:#02060d;color:#7df0b0;font-family:"SFMono-Regular",Consolas,monospace;font-size:clamp(13px,2.2vw,20px);line-height:1.6;box-shadow:0 18px 32px rgba(2,6,13,.24)}
.terminal-panel span,.terminal-panel strong{display:block;white-space:nowrap}.terminal-panel strong{font-weight:700}
.guide-panel{position:absolute;right:6%;top:25%;width:22%;min-width:170px;display:grid;gap:12px;padding:18px;border:1px solid rgba(255,90,0,.22);border-radius:8px;background:rgba(255,255,255,.92);box-shadow:0 18px 32px rgba(29,41,57,.13)}
.guide-panel b{font-size:clamp(16px,2.6vw,26px);color:#111827}.guide-panel span{color:#5c667a;font-size:clamp(13px,2vw,20px);line-height:1.35}.guide-panel button{height:38px;border:0;border-radius:8px;background:#e85d24;color:#fff;font-size:clamp(13px,2vw,18px);font-weight:800}
@media(max-width:640px){.editor-panel{left:16%;width:62%}.guide-panel{right:4%;min-width:128px;padding:12px}.terminal-panel{left:36%;width:46%;min-width:0}.desktop-strip span{width:20px;height:20px}}
</style>
</head>
<body>
<div class="lab-window">
  <div class="window-bar"><span></span><span></span><span></span></div>
  <div class="lab-screen">
    <div class="desktop-strip"><span></span><span></span><span></span></div>
    <div class="editor-panel"><div class="editor-title">Visual Studio Code</div><div class="editor-lines"><span></span><span></span><span></span><span></span></div></div>
    <div class="terminal-panel"><span>$ kubectl get pods</span><strong>api-service&nbsp;&nbsp; Running</strong><strong>web-ui&nbsp;&nbsp;&nbsp; Running</strong></div>
    <div class="guide-panel"><b>Course Guide</b><span>Complete the deployment task</span><button type="button">Check</button></div>
  </div>
</div>
</body>
</html>`;
    }

    const compactDemoCards = [
        {
            title: "Linux terminal race",
            meta: "Generated mini card",
            bg: "linear-gradient(135deg, #111827, #4f46e5)"
        },
        {
            title: "Cloud deploy module",
            meta: "Generated mini card",
            bg: "linear-gradient(135deg, #0f766e, #7dd3fc)"
        },
        {
            title: "Security capture",
            meta: "Generated mini card",
            bg: "linear-gradient(135deg, #7c2d12, #f97316)"
        },
        {
            title: "Database playground",
            meta: "Generated mini card",
            bg: "linear-gradient(135deg, #14532d, #84cc16)"
        },
        {
            title: "API workflow",
            meta: "Generated mini card",
            bg: "linear-gradient(135deg, #312e81, #22d3ee)"
        }
    ];
    /* Infinite carousel state */
    const FEATURED_VISIBLE = 2;
    const FEATURED_GAP = 12;
    const COMPACT_VISIBLE = 5;
    const COMPACT_GAP = 10;
    let featuredPos = 0;
    let compactPos = 0;
    let featuredBusy = false;
    let compactBusy = false;

    const fallbackTopics = [
        "All",
        "Cloud",
        "AI",
        "Machine Learning",
        "Python",
        "Linux",
        "SQL",
        "Backend",
        "Java",
        "DevOps",
        "Docker",
        "Kubernetes",
        "Cybersecurity",
        "Shell",
        "Git",
        "Web Development",
        "Automation"
    ];

    const fallbackCourses = [
        imageCourse("awssub", "AWS Foundations", ["Cloud", "DevOps"], "Beginner", "180 modules", "#f8ead8", "#f59e0b", "AWS"),
        imageCourse("ai1", "AI", ["AI", "Automation"], "Beginner", "114 modules", "#f1e7ff", "#7c5cff", "AI"),
        imageCourse("ml2", "ML", ["Machine Learning", "AI", "Python"], "Beginner", "58 modules", "#e4f0ff", "#2f76d2", "ML"),
        htmlCourse("pyb", "Python Introduction", ["Python"], "Beginner", "20 modules", "python"),
        htmlCourse("linnn", "Linux Introduction", ["Linux", "Shell"], "Beginner", "10 modules", "terminal"),
        imageCourse("lqs", "SQL", ["SQL", "Backend"], "Beginner", "20 modules", "#fff3e8", "#f97316", "SQL"),
        imageCourse("backend1", "Backend", ["Backend", "Web Development"], "Beginner", "23 modules", "#e3e6ff", "#5f6df6", "API"),
        imageCourse("java1", "Java", ["Java"], "Beginner", "295 modules", "#f3f0d8", "#2f76d2", "JAVA"),
        imageCourse("kubernetes1", "Kubernetes", ["Kubernetes", "DevOps"], "Beginner", "60 modules", "#f8eade", "#2f76d2", "K8S"),
        imageCourse("mogodb1", "MongoDB", ["Backend", "SQL"], "Beginner", "73 modules", "#fff3e8", "#f97316", "MDB"),
        imageCourse("gitty", "Github", ["Git", "DevOps"], "Beginner", "15 modules", "#e3f0e9", "#e05642", "GIT"),
        imageCourse("frontend1", "Front End", ["Web Development"], "Beginner", "34 modules", "#f1e7ff", "#5f6df6", "FE"),
        imageCourse("ai11", "Artificial Intelligence", ["AI"], "Beginner", "10 modules", "#f1e7ff", "#7c5cff", "AI"),
        imageCourse("nn", "Neural Networks", ["AI", "Machine Learning"], "Beginner", "23 modules", "#e4f0ff", "#7c5cff", "NN"),
        imageCourse("dl", "Deep Learning", ["AI", "Machine Learning"], "Beginner", "26 modules", "#e4f0ff", "#2f76d2", "DL"),
        imageCourse("ga", "Generative AI", ["AI"], "Beginner", "20 modules", "#f1e7ff", "#7c5cff", "GAI"),
        imageCourse("aaa", "AI Agents", ["AI", "Automation"], "Beginner", "8 modules", "#f1e7ff", "#5f6df6", "AGT"),
        imageCourse("ml1", "Machine Learning", ["Machine Learning", "AI"], "Beginner", "10 modules", "#e4f0ff", "#2f76d2", "ML"),
        imageCourse("aws2", "AWS", ["Cloud"], "Beginner", "5 modules", "#f8ead8", "#f59e0b", "AWS"),
        imageCourse("azure1", "Azure", ["Cloud"], "Beginner", "115 modules", "#e4f0ff", "#2f76d2", "AZ"),
        htmlCourse("tk", "SAP/S4hana", ["Backend"], "Beginner", "3 modules", "stack"),
        imageCourse("dte", "Data Engineer", ["Backend", "SQL"], "Beginner", "4 modules", "#fff3e8", "#f97316", "DE"),
        imageCourse("qualcomm", "Qualcomm", ["Backend"], "Beginner", "3 modules", "#f3f0d8", "#e05642", "QC")
    ];

    const USE_LOCAL_FALLBACK_DATA = window.location.protocol === "file:" || new URLSearchParams(window.location.search).has("demoFallback");

    let topics = USE_LOCAL_FALLBACK_DATA ? [...fallbackTopics] : ["All"];
    let courses = USE_LOCAL_FALLBACK_DATA ? fallbackCourses.slice() : [];
    let courseLookup = new Map(courses.map((course) => [course.id, course]));
    let catalogStatus = courses.length ? "ready" : "loading";
    let selectedCourseIds = null;
    let selectedCourseTitle = "";
    let heroCarouselCards = [];
    let featuredCarouselCards = [];
    let compactCarouselCards = [];
    let carouselCardMap = new Map();
    let carouselEyebrowText = "HTML Demo Thumbnails";
    let carouselHeadingText = "Featured module previews";
    let heroCarouselConfig = defaultCarouselRuntimeConfig("hero");
    let featuredCarouselConfig = defaultCarouselRuntimeConfig("featured");
    let compactCarouselConfig = defaultCarouselRuntimeConfig("compact");
    let homepageLayoutBlocks = [];
    let carouselConfigLoaded = false;
    let courseMegaCloseTimer = 0;
    let lazyThumbnailObserver = null;

    if (USE_LOCAL_FALLBACK_DATA) {
        try {
            const localData = normalizeStoredData(JSON.parse(localStorage.getItem('gradstudio-data')));
            if (localData) {
                topics = ["All", ...localData.topics];
                courses = localData.courses;
                courseLookup = new Map(courses.map((course) => [course.id, course]));
                catalogStatus = "ready";
            }
        } catch(e) {
            console.warn("localStorage blocked or unreadable. Using default courses.", e);
        }
    }

    /* ===== Live API integration ===== */
    const DEV_API_BASE = 'https://learning-platform-api-dev.sabareeshrao.workers.dev';
    const API_BASE = window.location.protocol === 'file:'
        ? DEV_API_BASE
        : window.location.hostname.includes('workers.dev')
        ? window.location.origin
        : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? DEV_API_BASE
            : 'https://api.gradstudio.org';
    const LEARN_CAROUSEL_STORAGE_KEY = "gradstudio_learn_carousels_dev";
    const USE_LOCAL_CAROUSEL_CACHE = new URLSearchParams(window.location.search).has("localCarousel");
    const ADMIN_REFRESH_STORAGE_KEY = "lp_admin_refresh";
    const API_CACHE_VERSION = "gradstudio-live-data-v1";
    const API_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
    const CATALOG_API_CACHE_KEY = `${API_CACHE_VERSION}:catalog`;
    const CAROUSEL_API_CACHE_KEY = `${API_CACHE_VERSION}:carousels`;
    const COURSE_API_CACHE_PREFIX = `${API_CACHE_VERSION}:course:`;

    const _apiCourseCache = new Map();
    let adminRefreshPromise = null;

    async function fetchCourseFromAPI(courseId, options = {}) {
        const preferCache = options.preferCache === true;
        if (preferCache && _apiCourseCache.has(courseId)) return _apiCourseCache.get(courseId);

        const cached = readApiCache(`${COURSE_API_CACHE_PREFIX}${courseId}`);
        if (preferCache && cached) {
            _apiCourseCache.set(courseId, cached);
            return cached;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseId)}?t=${Date.now()}`, {
                cache: "no-store"
            });
            if (!resp.ok) throw new Error(`Course API failed: ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.sections) throw new Error("Course API returned no sections.");

            /* Transform API sections+simulations into lessons the player understands */
            const lessons = [];
            const sections = [];

            data.sections.forEach((section, sectionIndex) => {
                const startIndex = lessons.length;
                const sims = section.simulations || section.items || [];

                sims.forEach((sim) => {
                    const filePath = sim.file_path || sim.link || (sim.slug ? `simulations/${courseId}/${sim.slug}/index.html` : null);
                    lessons.push({
                        title: sim.name || sim.title || `Module ${lessons.length + 1}`,
                        type: lessons.length % 2 === 0 ? 'lab' : 'challenge',
                        slug: sim.slug,
                        src: filePath ? `${API_BASE}/${filePath}` : null,
                        simulation_id: sim.simulation_id || sim.id
                    });
                });

                const indexes = [];
                for (let i = startIndex; i < lessons.length; i++) indexes.push(i);

                sections.push({
                    title: section.title || `Section ${sectionIndex + 1}`,
                    lessonIndexes: indexes
                });
            });

            const result = {
                lessons,
                sections,
                apiTitle: data.title,
                apiDescription: data.description,
                sourceCourseId: String(courseId)
            };
            _apiCourseCache.set(courseId, result);
            writeApiCache(`${COURSE_API_CACHE_PREFIX}${courseId}`, result);
            return result;
        } catch (err) {
            console.warn('API fetch failed for', courseId, err);
            if (_apiCourseCache.has(courseId)) return _apiCourseCache.get(courseId);
            if (cached) {
                _apiCourseCache.set(courseId, cached);
                return cached;
            }
            return null;
        }
    }

    async function hydrateCourseContent(course, forceRefresh = false) {
        if (!course || (course._contentHydrated && !forceRefresh)) return;
        course._contentHydrated = true;

        const primary = await fetchCourseFromAPI(course.id, { preferCache: !forceRefresh });
        if (primary?.apiDescription && !course.description) {
            course.description = primary.apiDescription;
        }
        if (primary && primary.lessons.length) {
            applyApiCourseContent(course, primary);
            return;
        }

        const children = findContentChildren(course.id);
        for (const child of children) {
            const childData = await fetchCourseFromAPI(child.id, { preferCache: !forceRefresh });
            if (childData && childData.lessons.length) {
                applyApiCourseContent(course, childData, child);
                return;
            }
        }

        if (primary) applyApiCourseContent(course, primary);
    }

    function applyApiCourseContent(course, apiData, sourceCourse = null) {
        course._apiLessons = apiData.lessons || [];
        course._apiSections = apiData.sections || [];
        course._contentSourceCourseId = sourceCourse?.id || apiData.sourceCourseId || course.id;
        course._contentSourceTitle = sourceCourse?.title || apiData.apiTitle || course.title;
        const description = apiData.apiDescription || sourceCourse?.description || "";
        if (description && !course.description) course.description = description;
    }

    function findContentChildren(parentCourseId) {
        const parentId = String(parentCourseId || "");
        return Array.from(courseLookup.values())
            .filter((course) => course && course.parentCourseId === parentId)
            .sort((a, b) => {
                const order = (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
                if (order) return order;
                return String(a.title || "").localeCompare(String(b.title || ""));
            });
    }

    async function loadCatalogFromAPI() {
        const [categoryResp, courseResp] = await Promise.all([
            fetch(`${API_BASE}/api/categories?t=${Date.now()}`, { cache: "no-store" }),
            fetch(`${API_BASE}/api/courses?admin=1&t=${Date.now()}`, { cache: "no-store" })
        ]);

        if (!categoryResp.ok || !courseResp.ok) {
            throw new Error(`Catalog API failed: categories ${categoryResp.status}, courses ${courseResp.status}`);
        }

        const [categoryData, courseData] = await Promise.all([
            categoryResp.json(),
            courseResp.json()
        ]);
        const normalized = normalizeApiCatalog(categoryData, courseData);

        if (!normalized.courses.length) {
            throw new Error("Catalog API returned no visible courses.");
        }

        applyCatalogData(normalized);
        writeApiCache(CATALOG_API_CACHE_KEY, normalized);
        if (!topics.includes(activeTopic)) activeTopic = "All";
        activePage = 1;
    }

    function loadCatalogFromCache() {
        const cached = readApiCache(CATALOG_API_CACHE_KEY);
        if (!cached || !Array.isArray(cached.courses) || !Array.isArray(cached.topics)) return false;
        applyCatalogData(cached);
        return true;
    }

    function applyCatalogData(data) {
        topics = data.topics;
        courses = data.courses;
        courseLookup = new Map((data.allCourses || data.courses).map((course) => [course.id, course]));
        catalogStatus = "ready";
    }

    function normalizeApiCatalog(categoryData, courseData) {
        const rawCategories = Array.isArray(categoryData?.categories)
            ? categoryData.categories
            : Array.isArray(categoryData)
                ? categoryData
                : [];
        const rawCourses = Array.isArray(courseData?.courses)
            ? courseData.courses
            : Array.isArray(courseData)
                ? courseData
                : [];

        const categories = rawCategories
            .filter((category) => category && !category.is_deleted)
            .map((category, index) => ({
                id: String(category.id || "").trim(),
                name: String(category.name || category.id || "").trim(),
                order: Number.isFinite(Number(category.display_order)) ? Number(category.display_order) : index
            }))
            .filter((category) => category.id && category.name)
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

        const categoryMap = new Map(categories.map((category) => [category.id, category]));
        const normalizedAllCourses = rawCourses
            .filter((course) => course && course.is_active !== false && !course.parent_course_id)
            .filter((course) => categoryMap.has(String(course.category || "").trim()))
            .sort((a, b) => {
                const categoryA = categoryMap.get(String(a.category || "").trim());
                const categoryB = categoryMap.get(String(b.category || "").trim());
                const categoryOrder = (categoryA?.order ?? 9999) - (categoryB?.order ?? 9999);
                if (categoryOrder) return categoryOrder;
                const courseOrder = (Number(a.display_order) || 0) - (Number(b.display_order) || 0);
                if (courseOrder) return courseOrder;
                return String(a.title || "").localeCompare(String(b.title || ""));
            })
            .map((course, index) => normalizeApiCourse(course, categoryMap, index))
            .filter(Boolean);
        const normalizedCourseMap = new Map(normalizedAllCourses.map((course) => [course.id, course]));

        rawCourses
            .filter((course) => course && course.is_active !== false && course.parent_course_id)
            .filter((course) => categoryMap.has(String(course.category || "").trim()))
            .forEach((course, index) => {
                const normalized = normalizeApiCourse(course, categoryMap, normalizedAllCourses.length + index);
                if (normalized) normalizedCourseMap.set(normalized.id, normalized);
            });

        return {
            topics: ["All", ...categories.map((category) => category.name)],
            courses: normalizedAllCourses,
            allCourses: Array.from(normalizedCourseMap.values())
        };
    }

    function normalizeApiCourse(course, categoryMap, index) {
        const id = String(course.id || `api-course-${index}`).trim();
        const title = String(course.title || "Untitled Course").trim() || "Untitled Course";
        const category = categoryMap.get(String(course.category || "").trim());
        const topicFolder = category?.name || "Course";
        const meta = parseCourseMeta(course.color_theme);
        const tags = uniqueList([
            topicFolder,
            ...(Array.isArray(meta.tags) ? meta.tags : [])
        ]);
        const simulationCount = Number(course.simulation_count) || 0;
        const thumbnail = meta.thumbnail
            ? normalizeStoredThumbnail(meta.thumbnail, title)
            : makeApiThumbnail(title, topicFolder, index);

        return {
            id,
            title,
            tags,
            topicFolder,
            fromApi: true,
            parentCourseId: course.parent_course_id ? String(course.parent_course_id) : "",
            courseType: String(course.type || "").trim(),
            displayOrder: Number(course.display_order) || index,
            allOrder: normalizeAllOrder(meta.allOrder ?? meta.all_order),
            level: String(meta.level || course.level || "Beginner").trim() || "Beginner",
            labs: normalizeApiLabs(meta.labs, simulationCount),
            description: String(course.description || "").trim(),
            thumbnail
        };
    }

    function normalizeAllOrder(value) {
        const text = String(value ?? "").trim();
        if (!text) return null;
        const num = Number(text);
        return Number.isFinite(num) ? num : null;
    }

    function parseCourseMeta(value) {
        if (!value || typeof value !== "string") return {};
        const trimmed = value.trim();
        if (!trimmed.startsWith("{")) return {};

        try {
            const parsed = JSON.parse(trimmed);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (err) {
            console.warn("Could not parse course metadata.", err);
            return {};
        }
    }

    function normalizeApiLabs(value, simulationCount) {
        const raw = String(value || "").trim();
        if (raw && raw.toLowerCase() !== "auto") return moduleCountLabel(raw);
        return `${simulationCount} module${simulationCount === 1 ? "" : "s"}`;
    }

    function moduleCountLabel(value) {
        return String(value || "")
            .replace(/\blabs\b/gi, "modules")
            .replace(/\blab\b/gi, "module");
    }

    function courseModuleCount(course) {
        const text = moduleCountLabel(course && course.labs ? course.labs : "");
        const match = text.match(/\d+/);
        return match ? Number(match[0]) : 0;
    }

    function totalModuleCount(courseList) {
        return (courseList || []).reduce((total, course) => total + courseModuleCount(course), 0);
    }

    function makeApiThumbnail(title, topicFolder, index) {
        const palettes = [
            ["#f8ead8", "#f59e0b"],
            ["#f1e7ff", "#7c5cff"],
            ["#e4f0ff", "#2f76d2"],
            ["#fff3e8", "#f97316"],
            ["#e3e6ff", "#5f6df6"],
            ["#f3f0d8", "#e05642"],
            ["#fff3e8", "#f97316"],
            ["#f8eade", "#2f76d2"]
        ];
        const paletteIndex = Math.abs(hashString(topicFolder || title) + index) % palettes.length;
        const [bg, accent] = palettes[paletteIndex];
        return {
            type: "image",
            src: makeSvgThumbnail(title, bg, accent, courseMark(title)),
            alt: `${title} thumbnail`
        };
    }

    function courseMark(title) {
        return String(title || "GS")
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .slice(0, 4)
            .toUpperCase() || "GS";
    }

    function uniqueList(values) {
        const seen = new Set();
        const result = [];
        values.forEach((value) => {
            const item = String(value || "").trim();
            if (!item || seen.has(item)) return;
            seen.add(item);
            result.push(item);
        });
        return result;
    }

    function hashString(value) {
        const text = String(value || "");
        let hash = 0;
        for (let i = 0; i < text.length; i += 1) {
            hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
        }
        return hash;
    }

    function signatureHash(value) {
        const text = String(value || "");
        return `${text.length}:${hashString(text)}`;
    }

    async function loadCarouselsFromAPI() {
        const local = USE_LOCAL_CAROUSEL_CACHE ? readLocalLearnCarouselConfig() : null;
        if (local) {
            const normalizedLocal = normalizeApiCarousels(local.carousels);
            applyCarouselData(normalizedLocal);
            return;
        }

        const errors = [];
        const loaders = [loadLearnCarouselConfig];
        for (const loader of loaders) {
            try {
                const carousels = await loader();
                const normalized = normalizeApiCarousels(carousels);
                if (Array.isArray(carousels)) {
                    applyCarouselData(normalized);
                    writeApiCache(CAROUSEL_API_CACHE_KEY, {
                        ...normalized,
                        eyebrow: carouselEyebrowText,
                        heading: carouselHeadingText
                    });
                    return;
                }
            } catch (error) {
                errors.push(error);
            }
        }

        throw errors[0] || new Error("Carousel API returned invalid data.");
    }

    function loadCarouselsFromCache() {
        const cached = readApiCache(CAROUSEL_API_CACHE_KEY);
        if (!cached || (!Array.isArray(cached.featured) && !Array.isArray(cached.compact))) return false;
        applyCarouselData(cached);
        carouselEyebrowText = String(cached.eyebrow || carouselEyebrowText);
        carouselHeadingText = String(cached.heading || carouselHeadingText);
        return true;
    }

    function applyCarouselData(data) {
        heroCarouselCards = Array.isArray(data.hero) ? data.hero : [];
        featuredCarouselCards = Array.isArray(data.featured) ? data.featured : [];
        compactCarouselCards = Array.isArray(data.compact) ? data.compact : [];
        heroCarouselConfig = data.heroConfig || heroCarouselConfig || defaultCarouselRuntimeConfig("hero");
        featuredCarouselConfig = data.featuredConfig || featuredCarouselConfig || defaultCarouselRuntimeConfig("featured");
        compactCarouselConfig = data.compactConfig || compactCarouselConfig || defaultCarouselRuntimeConfig("compact");
        homepageLayoutBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        carouselConfigLoaded = true;
        carouselCardMap = new Map();
    }

    function shouldUseCarouselFallback() {
        return USE_LOCAL_FALLBACK_DATA && !carouselConfigLoaded;
    }

    async function loadLearnCarouselConfig() {
        const resp = await fetch(`${API_BASE}/api/learn-carousels`);
        if (!resp.ok) throw new Error(`Learn carousel API failed: ${resp.status}`);
        const payload = await resp.json();
        if (isOldCourseCarouselPayload(payload)) return [];
        return Array.isArray(payload?.carousels) ? payload.carousels : [];
    }

    async function loadLegacyCarouselConfig() {
        const resp = await fetch(`${API_BASE}/api/carousels`);
        if (!resp.ok) throw new Error(`Legacy carousel API failed: ${resp.status}`);
        const payload = await resp.json();
        if (Array.isArray(payload?.carousels)) return payload.carousels;
        return Array.isArray(payload) ? payload : [];
    }

    function readLocalLearnCarouselConfig() {
        try {
            const raw = localStorage.getItem(LEARN_CAROUSEL_STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.carousels)) return null;
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function readApiCache(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return readCompatibleApiCache(key);
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > API_CACHE_TTL_MS) return null;
            return parsed.data || null;
        } catch (_) {
            return null;
        }
    }

    function readCompatibleApiCache(key) {
        try {
            const suffix = String(key || "").replace(/^[^:]+:/, "");
            let best = null;
            for (let index = 0; index < localStorage.length; index += 1) {
                const candidateKey = localStorage.key(index);
                if (!candidateKey || candidateKey === key || !candidateKey.endsWith(`:${suffix}`)) continue;
                const parsed = JSON.parse(localStorage.getItem(candidateKey) || "null");
                if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > API_CACHE_TTL_MS) continue;
                if (!best || parsed.savedAt > best.savedAt) best = parsed;
            }
            return best?.data || null;
        } catch (_) {
            return null;
        }
    }

    function writeApiCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                savedAt: Date.now(),
                data
            }));
        } catch (_) {
            /* Cache storage can fail in private mode or if quota is full. */
        }
    }

    function clearApiCache() {
        _apiCourseCache.clear();
        courses.forEach((course) => {
            delete course._contentHydrated;
            delete course._apiLessons;
            delete course._apiSections;
            delete course._contentSourceCourseId;
            delete course._contentSourceTitle;
        });

        try {
            for (let index = localStorage.length - 1; index >= 0; index -= 1) {
                const key = localStorage.key(index);
                const isGradStudioDataCache = key && (
                    key.startsWith(`${API_CACHE_VERSION}:`) ||
                    key.endsWith(":catalog") ||
                    key.endsWith(":carousels") ||
                    key.includes(":course:")
                );
                if (isGradStudioDataCache) {
                    localStorage.removeItem(key);
                }
            }
        } catch (_) {
            /* Local storage may be unavailable; live fetch still works. */
        }
    }

    function waitForFirstPaint() {
        return new Promise((resolve) => {
            if ("requestIdleCallback" in window) {
                window.requestIdleCallback(resolve, { timeout: 1200 });
                return;
            }
            window.setTimeout(resolve, 120);
        });
    }

    async function refreshAfterAdminUpdate() {
        if (adminRefreshPromise) return adminRefreshPromise;
        clearApiCache();
        adminRefreshPromise = (async () => {
            try {
                await loadCatalogFromAPI();
            } catch (err) {
                console.warn("Live catalog refresh after admin update failed.", err);
            }
            try {
                await loadCarouselsFromAPI();
            } catch (err) {
                console.warn("Live carousel refresh after admin update failed.", err);
            }
            render();
            await handleRoute();
        })().finally(() => {
            adminRefreshPromise = null;
        });
        return adminRefreshPromise;
    }

    function loadPinnedItems() {
        try {
            if (!getAuthToken()) return [];
            const owner = localStorage.getItem("gradstudio_learn_pinned_owner_v1") || "";
            const currentOwner = currentPinOwner();
            if (owner && currentOwner && owner !== currentOwner) return [];
            const parsed = JSON.parse(localStorage.getItem(PINNED_STORAGE_KEY) || "[]");
            return Array.isArray(parsed) ? parsed.filter((item) => item && item.key && item.type) : [];
        } catch (_) {
            return [];
        }
    }

    function savePinnedItemsLocal() {
        try {
            if (!getAuthToken()) {
                clearPinnedItemsLocal();
                return;
            }
            localStorage.setItem("gradstudio_learn_pinned_owner_v1", currentPinOwner());
            localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedItems));
        } catch (_) {
            /* Pinning is local enhancement; ignore storage failures. */
        }
    }

    function clearPinnedItemsLocal() {
        try {
            localStorage.removeItem(PINNED_STORAGE_KEY);
            localStorage.removeItem("gradstudio_learn_pinned_owner_v1");
        } catch (_) {}
    }

    function currentPinOwner() {
        const user = getStoredUser();
        return String(user?.id || user?.user_id || user?.email || getAuthToken() || "account").trim();
    }

    function savePinnedItems() {
        savePinnedItemsLocal();
        schedulePinSync();
        updatePinnedCounts();
    }

    function getAuthToken() {
        try {
            return localStorage.getItem("lp_auth_token") || localStorage.getItem("token") || "";
        } catch (_) {
            return "";
        }
    }

    function getStoredUser() {
        try {
            return JSON.parse(localStorage.getItem("gradstudio_user") || "null");
        } catch (_) {
            return null;
        }
    }

    function setAuthSession(data) {
        if (!data || !data.accessToken) return;
        localStorage.setItem("lp_auth_token", data.accessToken);
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("lp_is_logged_in", "true");
        localStorage.setItem("gradstudio_user", JSON.stringify(data.user || {}));
    }

    function clearAuthSession() {
        ["lp_auth_token", "token", "lp_is_logged_in", "gradstudio_user"].forEach((key) => {
            try { localStorage.removeItem(key); } catch (_) {}
        });
    }

    function authHeaders() {
        const token = getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    function updateAuthUi() {
        const user = getStoredUser();
        const signedIn = !!getAuthToken();
        document.querySelectorAll(".top-actions").forEach((node) => {
            node.innerHTML = signedIn
                ? accountMenuHtml(user)
                : '<button class="signup-button" type="button" data-auth-open="signup">Sign up</button><button class="signin-button" type="button" data-auth-open="signin">Sign in</button>';
        });
        bindAuthOpenButtons(document);
        bindAccountMenuButtons(document);
        bindPinnedOpenButtons(document);
        bindLogoutButtons(document);
    }

    function accountMenuHtml(user) {
        return `
            <div class="auth-account-menu-wrap">
                <button class="auth-user-chip" type="button" data-account-menu-trigger aria-haspopup="menu" aria-expanded="false">
                    <span>${escapeHtml(userInitials(user))}</span>
                    <strong>${escapeHtml(userDisplayName(user))}</strong>
                    <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5.4 7.6 10 12.2l4.6-4.6 1.1 1.1-5.7 5.7-5.7-5.7 1.1-1.1Z"/></svg>
                </button>
                <div class="auth-account-menu" data-account-menu role="menu" hidden>
                    <div class="auth-account-summary">
                        <span>${escapeHtml(userInitials(user))}</span>
                        <div>
                            <strong>${escapeHtml(userDisplayName(user))}</strong>
                            <small>${escapeHtml(userEmail(user))}</small>
                        </div>
                    </div>
                    <button type="button" data-open-pinned role="menuitem">
                        <span>My learning</span>
                        <small><span data-pinned-count>${pinnedItems.length}</span> saved</small>
                    </button>
                    <button type="button" data-auth-logout role="menuitem">Log out</button>
                </div>
            </div>
        `;
    }

    function userDisplayName(user) {
        const name = String(user?.display_name || user?.name || user?.email || "Account").trim();
        return name.includes("@") ? name.split("@")[0] : name;
    }

    function userInitials(user) {
        const label = userDisplayName(user);
        return label
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "GS";
    }

    function userEmail(user) {
        const email = String(user?.email || user?.mail || user?.preferred_username || "").trim();
        return email || "Signed in";
    }

    function bindAccountMenuButtons(root = document) {
        root.querySelectorAll("[data-account-menu-trigger]").forEach((trigger) => {
            if (trigger.dataset.accountMenuBound === "true") return;
            trigger.dataset.accountMenuBound = "true";
            trigger.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleAccountMenu(trigger);
            });
        });

        if (document.documentElement.dataset.accountMenuGlobalBound === "true") return;
        document.documentElement.dataset.accountMenuGlobalBound = "true";
        document.addEventListener("click", (event) => {
            if (event.target.closest(".auth-account-menu-wrap")) return;
            closeAccountMenus();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeAccountMenus();
        });
    }

    function toggleAccountMenu(trigger) {
        const wrap = trigger.closest(".auth-account-menu-wrap");
        const menu = wrap?.querySelector("[data-account-menu]");
        if (!menu) return;
        const shouldOpen = menu.hidden;
        closeAccountMenus();
        menu.hidden = !shouldOpen;
        trigger.setAttribute("aria-expanded", String(shouldOpen));
    }

    function closeAccountMenus() {
        document.querySelectorAll(".auth-account-menu-wrap").forEach((wrap) => {
            const trigger = wrap.querySelector("[data-account-menu-trigger]");
            const menu = wrap.querySelector("[data-account-menu]");
            if (menu) menu.hidden = true;
            if (trigger) trigger.setAttribute("aria-expanded", "false");
        });
    }

    function bindAuthOpenButtons(root = document) {
        root.querySelectorAll("[data-auth-open]").forEach((control) => {
            if (control.dataset.authBound === "true") return;
            control.dataset.authBound = "true";
            control.addEventListener("click", (event) => {
                event.preventDefault();
                if (getAuthToken()) {
                    showCatalog("All", true, "auto");
                    return;
                }
                const mode = control.dataset.authOpen === "signin" ? "signin" : "signup";
                const routeKey = control.getAttribute("href") === "#get-started" ? "get-started" : mode;
                showAuthPage(mode, true, routeKey);
            });
        });
    }

    function bindLogoutButtons(root = document) {
        root.querySelectorAll("[data-auth-logout]").forEach((button) => {
            if (button.dataset.logoutBound === "true") return;
            button.dataset.logoutBound = "true";
            button.addEventListener("click", logoutUser);
        });
    }

    async function logoutUser() {
        if (!window.confirm("Sign out of GradStudio?")) return;
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: "POST",
                headers: authHeaders(),
                credentials: "include"
            });
        } catch (_) {
            /* Local logout should still proceed if the network is unavailable. */
        }
        clearAuthSession();
        pinnedItems = [];
        clearPinnedItemsLocal();
        updatePinnedCounts();
        showHome(true);
    }

    function updatePinnedCounts() {
        updateAuthUi();
        document.querySelectorAll("[data-pinned-count]").forEach((node) => {
            node.textContent = pinnedItems.length.toString();
        });
        document.querySelectorAll("[data-pin-course]").forEach((button) => {
            const key = pinnedKey("course", button.dataset.pinCourse);
            const pinned = isPinned(key);
            button.classList.toggle("is-pinned", pinned);
            button.setAttribute("aria-pressed", String(pinned));
            if (button.classList.contains("pin-chip")) button.textContent = pinned ? "Unpin course" : "Pin course";
        });
        document.querySelectorAll("[data-pin-topic]").forEach((button) => {
            const key = pinnedKey("topic", button.dataset.pinCourseId, button.dataset.pinTopic);
            const pinned = isPinned(key);
            button.classList.toggle("is-pinned", pinned);
            button.setAttribute("aria-pressed", String(pinned));
            if (button.classList.contains("player-pill")) button.textContent = pinned ? "Unpin module" : "Pin module";
            else if (button.classList.contains("pin-chip")) button.textContent = pinned ? "Unpin" : "Pin";
        });
    }

    function pinnedKey(type, id, index = "") {
        return `${type}:${id}:${index}`;
    }

    function isPinned(key) {
        return pinnedItems.some((item) => item.key === key);
    }

    function togglePinned(item) {
        if (!item || !item.key) return;
        if (!requireSignedInForPins()) return;
        const existingIndex = pinnedItems.findIndex((pinned) => pinned.key === item.key);
        if (existingIndex >= 0) pinnedItems.splice(existingIndex, 1);
        else pinnedItems.unshift({ ...item, savedAt: Date.now() });
        savePinnedItems();
    }

    function requireSignedInForPins() {
        if (getAuthToken()) return true;
        pinnedItems = [];
        clearPinnedItemsLocal();
        showAuthPage("signup", true, "signup");
        window.requestAnimationFrame(() => {
            const message = document.querySelector("[data-auth-message]");
            if (message) {
                message.classList.add("is-error");
                message.textContent = "Please sign up or sign in to save pinned courses and modules.";
            }
        });
        return false;
    }

    function schedulePinSync() {
        if (!getAuthToken()) return;
        window.clearTimeout(pinSyncTimer);
        pinSyncTimer = window.setTimeout(() => {
            savePinsToAccount().catch((error) => console.warn("Pinned item sync failed.", error));
        }, 450);
    }

    async function fetchPinsFromAccount() {
        if (!getAuthToken()) return [];
        const response = await fetch(`${API_BASE}/api/user-pins`, {
            headers: authHeaders(),
            credentials: "include"
        });
        if (response.status === 401 && await refreshAuthToken()) return fetchPinsFromAccount();
        if (response.status === 401) {
            clearAuthSession();
            pinnedItems = [];
            clearPinnedItemsLocal();
            updatePinnedCounts();
            throw new Error("Session expired.");
        }
        if (!response.ok) throw new Error("Could not load saved pins.");
        const data = await response.json().catch(() => ({}));
        return Array.isArray(data.pins) ? data.pins : [];
    }

    async function savePinsToAccount() {
        if (!getAuthToken()) return;
        if (pinSyncInFlight) return pinSyncInFlight;
        pinSyncInFlight = (async () => {
            const response = await fetch(`${API_BASE}/api/user-pins`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                credentials: "include",
                body: JSON.stringify({ pins: pinnedItems })
            });
            if (response.status === 401 && await refreshAuthToken()) {
                pinSyncInFlight = null;
                return savePinsToAccount();
            }
            if (response.status === 401) {
                clearAuthSession();
                pinnedItems = [];
                clearPinnedItemsLocal();
                updatePinnedCounts();
                throw new Error("Session expired.");
            }
            if (!response.ok) throw new Error("Could not save pinned items.");
        })().finally(() => {
            pinSyncInFlight = null;
        });
        return pinSyncInFlight;
    }

    function mergePinnedItems(localPins, accountPins) {
        const merged = new Map();
        [...accountPins, ...localPins].forEach((item) => {
            if (!item || !item.key || !item.type) return;
            const normalized = {
                key: String(item.key),
                type: String(item.type),
                courseId: String(item.courseId || ""),
                lessonIndex: Number(item.lessonIndex || 0),
                title: String(item.title || ""),
                meta: String(item.meta || ""),
                savedAt: Number(item.savedAt || Date.now())
            };
            const existing = merged.get(normalized.key);
            if (!existing || normalized.savedAt >= existing.savedAt) merged.set(normalized.key, normalized);
        });
        return Array.from(merged.values())
            .sort((a, b) => (Number(b.savedAt) || 0) - (Number(a.savedAt) || 0))
            .slice(0, 200);
    }

    async function syncPinsAfterAuth() {
        try {
            const accountPins = await fetchPinsFromAccount();
            pinnedItems = mergePinnedItems([], accountPins);
            savePinnedItemsLocal();
            updatePinnedCounts();
        } catch (error) {
            console.warn("Pinned account sync failed.", error);
            pinnedItems = [];
            clearPinnedItemsLocal();
            updatePinnedCounts();
        }
    }

    async function refreshAuthToken() {
        try {
            const response = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: "POST",
                credentials: "include"
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.accessToken) return false;
            setAuthSession({ accessToken: data.accessToken, user: getStoredUser() || {} });
            return true;
        } catch (_) {
            return false;
        }
    }

    async function initializeAuthState() {
        if (!getAuthToken()) await refreshAuthToken();
        if (!getAuthToken()) {
            pinnedItems = [];
            clearPinnedItemsLocal();
        } else {
            pinnedItems = loadPinnedItems();
        }
        updatePinnedCounts();
        if (getAuthToken()) await syncPinsAfterAuth();
    }

    function coursePinItem(course) {
        return {
            key: pinnedKey("course", course.id),
            type: "course",
            courseId: course.id,
            title: course.title,
            meta: course.topicFolder || course.tags?.[0] || "Course"
        };
    }

    function topicPinItem(course, lesson, lessonIndex) {
        return {
            key: pinnedKey("topic", course.id, lessonIndex),
            type: "topic",
            courseId: course.id,
            lessonIndex: Number(lessonIndex) || 0,
            title: cleanLessonTitle(lesson?.title || `Module ${Number(lessonIndex) + 1}`),
            meta: course.title
        };
    }

    function showPinnedPage(updateUrl = true) {
        const infoPage = document.getElementById("infoPage");
        const authPage = document.getElementById("authPage");
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");
        if (!infoPage) return;

        infoPage.innerHTML = buildPinnedPage();
        bindPinnedPage(infoPage);
        infoPage.hidden = false;
        if (authPage) authPage.hidden = true;
        if (detail) detail.hidden = true;
        if (player) player.hidden = true;
        setHomeContentHidden(true);
        if (footer) footer.hidden = false;
        if (topbar) topbar.hidden = false;
        document.body.classList.toggle("is-course-player", false);
        setAboutPageActive(false);
        updateNavState("");
        updatePinnedCounts();
        if (updateUrl) history.pushState({ view: "pinned" }, "", "#pinned");
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function buildPinnedPage() {
        const cards = pinnedItems.length ? pinnedItems.map((item) => {
            const course = courseLookup.get(item.courseId);
            const tags = course?.tags?.length ? course.tags : [item.type === "topic" ? "Module" : "Course"];
            return `
                <article class="course-card pinned-card" role="button" tabindex="0" data-pinned-card="${escapeHtml(item.key)}" aria-label="Open ${escapeHtml(item.title)}">
                    <div class="card-media" data-thumbnail="${escapeHtml(course?.thumbnail?.type || "image")}" data-pinned-media-course-id="${escapeHtml(item.courseId)}">
                        <span class="course-label">${item.type === "topic" ? "MODULE" : "COURSE"}</span>
                    </div>
                    <div class="card-body">
                        <div>
                            <h2 class="course-title">${escapeHtml(item.title)}</h2>
                            <div class="course-meta">
                                <span>${escapeHtml(item.meta || "Pinned")}</span>
                            </div>
                        </div>
                        <div class="course-card-footer">
                            <div class="tag-list">
                                ${tags.slice(0, 2).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                            </div>
                            <button class="course-pin-icon is-pinned" type="button" data-pinned-remove="${escapeHtml(item.key)}" aria-label="Unpin ${escapeHtml(item.title)}">${pinIconSvg()}</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("") : `
            <div class="empty-state">No pinned courses or modules yet.</div>
        `;

        return `
            <section class="info-page-hero" aria-labelledby="pinnedPageTitle">
                <div class="section-copy">
                    <span class="eyebrow">My pinned</span>
                    <h1 id="pinnedPageTitle">Pinned courses and modules</h1>
                    <p>Courses and modules you pin stay here for quick access.</p>
                </div>
            </section>
            <div class="pinned-grid">${cards}</div>
        `;
    }

    function bindPinnedPage(root) {
        applyPinnedThumbnails(root);

        root.querySelectorAll("[data-pinned-card]").forEach((card) => {
            card.addEventListener("click", () => openPinnedItem(card.dataset.pinnedCard));
            card.addEventListener("keydown", (event) => {
                if (event.target.closest("button")) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPinnedItem(card.dataset.pinnedCard);
                }
            });
        });

        root.querySelectorAll("[data-pinned-remove]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                pinnedItems = pinnedItems.filter((item) => item.key !== button.dataset.pinnedRemove);
                savePinnedItems();
                showPinnedPage(false);
            });
        });
    }

    function applyPinnedThumbnails(root) {
        root.querySelectorAll("[data-pinned-media-course-id]").forEach((media) => {
            const course = courseLookup.get(media.dataset.pinnedMediaCourseId);
            if (course) applyCourseThumbnail(media, course);
        });
        hydrateLazyThumbnailFrames(root);
    }

    function bindPinnedOpenButtons(root = document) {
        root.querySelectorAll("[data-open-pinned]").forEach((button) => {
            if (button.dataset.pinnedBound === "true") return;
            button.dataset.pinnedBound = "true";
            button.addEventListener("click", () => {
                closeAccountMenus();
                if (!requireSignedInForPins()) return;
                showPinnedPage();
            });
        });
    }

    function openPinnedItem(key) {
        const item = pinnedItems.find((pinned) => pinned.key === key);
        if (!item) return;
        if (item.type === "topic") {
            openLesson(item.courseId, item.lessonIndex);
            return;
        }
        openCourse(item.courseId);
    }

    function currentRenderSignature() {
        return JSON.stringify({
            topics,
            courses: courses.map((course) => ({
                id: course.id,
                title: course.title,
                topicFolder: course.topicFolder,
                allOrder: course.allOrder,
                labs: course.labs,
                thumb: course.thumbnail
            })),
            hero: heroCarouselCards.map(carouselCardSignature),
            featured: featuredCarouselCards.map(carouselCardSignature),
            compact: compactCarouselCards.map(carouselCardSignature),
            carouselEyebrowText,
            carouselHeadingText,
            heroCarouselConfig,
            featuredCarouselConfig,
            compactCarouselConfig,
            carouselConfigLoaded,
            homepageLayoutBlocks: homepageLayoutBlocks.map((block) => ({
                id: block.id,
                type: block.type,
                config: block.config,
                cards: (block.cards || []).map(carouselCardSignature)
            }))
        });
    }

    function carouselCardSignature(card) {
        return [
            card.key || card.id || card.title,
            card.width,
            card.heightPx,
            card.headingFont,
            card.headingSize,
            card.headingColor,
            card.subFont,
            card.subSize,
            card.subColor,
            card.textPosition,
            card.textAlign,
            card.frameStyle,
            card.contentType,
            card.imageUrl,
            card.iframeUrl,
            signatureHash(card.contentHtml || "")
        ].join(":");
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

    function normalizeApiCarousels(carousels) {
        const sorted = carousels
            .filter((carousel) => carousel && carousel.is_active !== 0 && carousel.is_active !== false)
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
        const featuredCarousel = sorted.find((carousel) => String(carousel.id) === "1");
        const compactCarousel = sorted.find((carousel) => String(carousel.id) === "2");
        const heroCarousel = sorted.find((carousel) => String(carousel.id) === "hero");
        if (featuredCarousel) {
            carouselEyebrowText = String(featuredCarousel.eyebrow || carouselEyebrowText || "HTML Demo Thumbnails");
            carouselHeadingText = moduleCountLabel(String(featuredCarousel.header || carouselHeadingText || "Featured module previews"));
        }

        const blocks = sorted
            .filter((carousel) => String(carousel.id) !== "hero")
            .map((carousel) => normalizeLayoutBlock(carousel))
            .filter(Boolean);
        return {
            hero: heroCarousel ? normalizeCarouselCards(heroCarousel, "hero") : [],
            featured: featuredCarousel ? normalizeCarouselCards(featuredCarousel, "featured") : [],
            compact: compactCarousel ? normalizeCarouselCards(compactCarousel, "compact") : [],
            heroConfig: normalizeCarouselConfig(heroCarousel, "hero"),
            featuredConfig: normalizeCarouselConfig(featuredCarousel, "featured"),
            compactConfig: normalizeCarouselConfig(compactCarousel, "compact"),
            blocks
        };
    }

    function normalizeLayoutBlock(carousel) {
        const type = carousel.block_type === "text" ? "text" : "carousel";
        const id = String(carousel.id || `${type}-${Date.now()}`);
        const slot = id === "2" ? "compact" : "featured";
        const config = normalizeCarouselConfig(carousel, slot);
        return {
            id,
            type,
            slot,
            header: moduleCountLabel(carousel.header || ""),
            eyebrow: String(carousel.eyebrow || ""),
            config,
            cards: type === "carousel" ? normalizeCarouselCards(carousel, slot) : []
        };
    }

    function defaultCarouselRuntimeConfig(slot) {
        return {
            layoutAlign: "stretch",
            maxWidth: slot === "hero" ? "860px" : "1480px",
            layoutStyle: "fit",
            visibleCount: slot === "hero" ? 1 : slot === "compact" ? COMPACT_VISIBLE : FEATURED_VISIBLE,
            cardGap: slot === "hero" ? 0 : slot === "compact" ? COMPACT_GAP : FEATURED_GAP,
            blockSpacingTop: 40,
            blockSpacingBottom: 44,
            textGap: 28,
            infiniteScroll: slot === "hero" ? false : true,
            textAlign: "left",
            headerFont: "Inter",
            headerFontSize: slot === "compact" ? 24 : 28,
            headerColor: "#1d2233",
            sectionText: "",
            sectionTextFont: "Inter",
            sectionTextSize: 44,
            sectionTextColor: "#1d2233",
            sectionTextAlign: "left",
            sectionTextMaxWidth: "860px"
        };
    }

    function normalizeCarouselConfig(carousel, slot) {
        const fallback = defaultCarouselRuntimeConfig(slot);
        if (!carousel || typeof carousel !== "object") return fallback;
        return {
            layoutAlign: normalizeChoice(carousel.layout_align || carousel.align, ["left", "center", "right", "stretch"], fallback.layoutAlign),
            maxWidth: normalizeCssLength(carousel.max_width, fallback.maxWidth),
            layoutStyle: normalizeChoice(carousel.layout_style, ["fit", "custom_width"], fallback.layoutStyle),
            visibleCount: clampNumber(carousel.visible_count || carousel.grid_columns, fallback.visibleCount, 1, 8),
            cardGap: clampNumber(carousel.card_gap, fallback.cardGap, 0, 80),
            blockSpacingTop: clampNumber(carousel.block_spacing_top, fallback.blockSpacingTop, 0, 200),
            blockSpacingBottom: clampNumber(carousel.block_spacing_bottom, fallback.blockSpacingBottom, 0, 200),
            textGap: clampNumber(carousel.text_gap, fallback.textGap, 0, 120),
            infiniteScroll: carousel.infinite_scroll === undefined ? fallback.infiniteScroll : (carousel.infinite_scroll !== 0 && carousel.infinite_scroll !== false),
            textAlign: normalizeChoice(carousel.text_align, ["left", "center", "right"], fallback.textAlign),
            headerFont: cssFontValue(carousel.header_font || fallback.headerFont),
            headerFontSize: clampNumber(carousel.header_font_size, fallback.headerFontSize, 14, 96),
            headerColor: normalizeCssColor(carousel.header_color, fallback.headerColor),
            sectionText: String(carousel.section_text || ""),
            sectionTextFont: cssFontValue(carousel.section_text_font || fallback.sectionTextFont),
            sectionTextSize: clampNumber(carousel.section_text_size, fallback.sectionTextSize, 14, 96),
            sectionTextColor: normalizeCssColor(carousel.section_text_color, fallback.sectionTextColor),
            sectionTextAlign: normalizeChoice(carousel.section_text_align, ["left", "center", "right"], fallback.sectionTextAlign),
            sectionTextMaxWidth: normalizeCssLength(carousel.section_text_max_width, fallback.sectionTextMaxWidth)
        };
    }

    function normalizeCarouselCards(carousel, slot) {
        const cards = Array.isArray(carousel.cards) ? carousel.cards : [];
        return cards
            .filter((card) => card && card.is_active !== 0 && card.is_active !== false)
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
            .map((card, index) => {
                const courseIds = parseCarouselCourseLinks(card.course_links);
                const targetType = normalizeCarouselTargetType(card.target_type, courseIds, card);
                const key = `${slot}-${carousel.id || "carousel"}-${card.id || index}`;
                return {
                    key,
                    id: String(card.id || key),
                    title: moduleCountLabel(card.title || ""),
                    eyebrow: moduleCountLabel(card.description || carousel.header || ""),
                    description: moduleCountLabel(card.description || ""),
                    contentType: String(card.content_type || "standard"),
                    imageUrl: String(card.image_url || ""),
                    iframeUrl: String(card.iframe_url || ""),
                    contentHtml: normalizeStoredHtml(card.content_html),
                    iconClass: String(card.icon_class || "fas fa-star"),
                    colorHex: String(card.color_hex || "#3b82f6"),
                    width: normalizeCssLength(card.width, slot === "hero" ? "860px" : slot === "compact" ? "220px" : "400px"),
                    heightPx: normalizeCssLength(card.height_px, slot === "hero" ? "360px" : slot === "compact" ? "160px" : "420px"),
                    frameStyle: normalizeChoice(card.frame_style || card.frameStyle, ["framed", "flush"], slot === "hero" ? "flush" : "framed"),
                    bgColor: normalizeCssColor(card.bg_color, "#111827"),
                    headingFont: cssFontValue(card.heading_font || "Inter"),
                    headingSize: clampNumber(card.heading_size, slot === "compact" ? 14 : 24, 10, 64),
                    headingColor: normalizeCssColor(card.heading_color, "#ffffff"),
                    subFont: cssFontValue(card.sub_font || "Inter"),
                    subSize: clampNumber(card.sub_size, slot === "compact" ? 12 : 13, 10, 40),
                    subColor: normalizeCssColor(card.sub_color, "#dbe3f1"),
                    textPosition: normalizeChoice(card.text_position, ["bottom", "top", "center", "hidden"], "bottom"),
                    textAlign: normalizeChoice(card.text_align, ["left", "center", "right"], "left"),
                    targetType,
                    targetId: String(card.target_id || ""),
                    courseIds,
                    bg: card.bg_color || carouselGradient(card.color_hex || "#3b82f6", index)
                };
            });
    }

    function normalizeChoice(value, choices, fallback) {
        const normalized = String(value || "").trim();
        return choices.includes(normalized) ? normalized : fallback;
    }

    function clampNumber(value, fallback, min, max) {
        const num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        return Math.min(max, Math.max(min, num));
    }

    function normalizeCssLength(value, fallback) {
        const text = String(value || "").trim();
        if (!text) return fallback;
        if (/^calc\([^)]+\)$/i.test(text)) return text;
        if (/^(auto|none)$/i.test(text)) return text.toLowerCase();
        if (/^\d+(\.\d+)?(px|rem|em|%|vw|vh)$/i.test(text)) return text;
        if (/^\d+(\.\d+)?$/i.test(text)) return `${text}px`;
        return fallback;
    }

    function normalizeCssColor(value, fallback) {
        const text = String(value || "").trim();
        if (/^#[0-9a-f]{3,8}$/i.test(text)) return text;
        if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/i.test(text)) return text;
        return fallback;
    }

    function cssFontValue(value) {
        const text = String(value || "Inter").replace(/[;"<>]/g, "").trim();
        return text || "Inter";
    }

    function normalizeStoredHtml(value) {
        return String(value || "")
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\//g, "/");
    }

    function normalizeCarouselTargetType(value, courseIds, card) {
        const targetType = String(value || "").trim();
        if (targetType === "course_page" || targetType === "course_cards") {
            if (courseIds.length) return "course_list";
            const targetId = String(card?.target_id || "").trim();
            return targetId && targetId !== "none" && targetId !== "custom" ? "course" : "none";
        }
        if (targetType === "course" || targetType === "course_list" || targetType === "external" || targetType === "none") {
            return targetType;
        }
        return courseIds.length ? "course_list" : "none";
    }

    function parseCarouselCourseLinks(value) {
        if (Array.isArray(value)) return value.map(courseLinkId).filter(Boolean);
        if (!value) return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(courseLinkId).filter(Boolean) : [];
        } catch (_) {
            return [];
        }
    }

    function courseLinkId(value) {
        if (typeof value === "string") return value.trim();
        if (value && typeof value === "object") {
            return String(value.id || value.course_id || value.target_id || "").trim();
        }
        return "";
    }

    function carouselGradient(color, index) {
        const palette = ["#111827", "#243a59", "#14532d", "#312e81", "#7c2d12"];
        const base = palette[index % palette.length];
        return `linear-gradient(135deg, ${base}, ${color || "#3b82f6"})`;
    }

    function fallbackFeaturedCards() {
        return htmlDemoCards.map((card, index) => ({
            key: `fallback-featured-${index}`,
            title: card.title,
            eyebrow: card.eyebrow,
            contentType: card.html ? "html" : "iframe",
            contentHtml: card.html || "",
            iframeUrl: card.src || "",
            width: "400px",
            heightPx: "420px",
            bgColor: "#111827",
            headingFont: "Inter",
            headingSize: 24,
            headingColor: "#ffffff",
            subFont: "Inter",
            subSize: 13,
            subColor: "#dbe3f1",
            textPosition: "bottom",
            textAlign: "left",
            frameStyle: "framed",
            targetType: card.courseIds && card.courseIds.length ? "course_list" : (card.src ? "external" : "none"),
            href: card.src,
            courseIds: card.courseIds || []
        }));
    }

    function fallbackHeroCards() {
        return [{
            key: "fallback-hero-card",
            id: "fallback-hero-card",
            title: "Hero module preview",
            eyebrow: "",
            description: "",
            contentType: "image",
            contentHtml: "",
            imageUrl: "hero-gradstudio-20260429-152846.png",
            iframeUrl: "",
            width: "860px",
            heightPx: "390px",
            bgColor: "#ffffff",
            headingFont: "Inter",
            headingSize: 24,
            headingColor: "#ffffff",
            subFont: "Inter",
            subSize: 13,
            subColor: "#dbe3f1",
            textPosition: "hidden",
            textAlign: "left",
            frameStyle: "flush",
            targetType: "none",
            targetId: "",
            courseIds: []
        }];
    }

    function fallbackCompactCards() {
        return compactDemoCards.map((card, index) => ({
            key: `fallback-compact-${index}`,
            title: card.title,
            eyebrow: card.meta,
            contentType: "standard",
            width: "220px",
            heightPx: "160px",
            bgColor: "#111827",
            headingFont: "Inter",
            headingSize: 14,
            headingColor: "#ffffff",
            subFont: "Inter",
            subSize: 12,
            subColor: "#dbe3f1",
            textPosition: "bottom",
            textAlign: "left",
            frameStyle: "framed",
            targetType: "none",
            bg: card.bg,
            courseIds: []
        }));
    }

    function normalizeStoredData(data) {
        if (!data || !Array.isArray(data.topics) || !Array.isArray(data.courses)) return null;

        const normalizedCourses = data.courses.map(normalizeStoredCourse).filter(Boolean);
        const topicSet = new Set(
            data.topics
                .map((topic) => String(topic || "").trim())
                .filter((topic) => topic && topic !== "All")
        );

        normalizedCourses.forEach((course) => {
            course.tags.forEach((tag) => topicSet.add(tag));
            if (course.topicFolder) topicSet.add(course.topicFolder);
        });

        return {
            topics: Array.from(topicSet),
            courses: normalizedCourses
        };
    }

    function normalizeStoredCourse(course, index) {
        if (!course || typeof course !== "object") return null;

        const title = String(course.title || "Untitled Course").trim() || "Untitled Course";
        const tags = Array.isArray(course.tags)
            ? course.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
            : [];
        const topicFolder = String(course.topicFolder || tags[0] || "").trim();
        if (topicFolder && !tags.includes(topicFolder)) tags.unshift(topicFolder);

        const thumbnail = normalizeStoredThumbnail(course.thumbnail, title);

        return {
            ...course,
            id: String(course.id || `stored-course-${index}`),
            title,
            tags,
            topicFolder,
            allOrder: normalizeAllOrder(course.allOrder ?? course.all_order),
            level: String(course.level || "Beginner").trim() || "Beginner",
            labs: course.labs === "Auto" ? "12 modules" : moduleCountLabel(String(course.labs || "12 modules").trim() || "12 modules"),
            thumbnail
        };
    }

    function normalizeStoredThumbnail(thumbnail, title) {
        if (thumbnail && thumbnail.type === "image" && thumbnail.src) {
            return {
                type: "image",
                src: thumbnail.src,
                alt: thumbnail.alt || `${title} thumbnail`
            };
        }

        if (thumbnail && thumbnail.type === "document") {
            return {
                type: "document",
                html: String(thumbnail.html || "")
            };
        }

        const html = thumbnail && thumbnail.html ? String(thumbnail.html) : "";
        return {
            type: isFullHtmlDocument(html) ? "document" : "html",
            html
        };
    }

    function isFullHtmlDocument(value) {
        return /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<script[\s>]|<link[\s>]|<style[\s>]/i.test(String(value || ""));
    }

    function imageCourse(id, title, tags, level, labs, bg, accent, mark) {
        return {
            id,
            title,
            tags,
            level,
            labs,
            thumbnail: {
                type: "image",
                src: makeSvgThumbnail(title, bg, accent, mark),
                alt: `${title} thumbnail`
            }
        };
    }

    function htmlCourse(id, title, tags, level, labs, variant) {
        const htmlByVariant = {
            terminal: `
                <div class="html-thumb thumb-terminal">
                    <div class="terminal-box" aria-hidden="true">
                        <div class="terminal-dots"><span></span><span></span><span></span></div>
                        <div class="terminal-lines"><span></span><span></span><span></span></div>
                    </div>
                </div>
            `,
            stack: `
                <div class="html-thumb thumb-stack">
                    <div class="stack-tiles" aria-hidden="true">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `,
            circuit: `
                <div class="html-thumb thumb-circuit">
                    <div class="circuit-board" aria-hidden="true"></div>
                </div>
            `,
            cloud: `
                <div class="html-thumb thumb-cloud">
                    <div class="cloud-badge" aria-hidden="true"><span class="cloud-line"></span></div>
                </div>
            `,
            python: `
                <div class="html-thumb thumb-python">
                    <div class="python-bg-shape-1" aria-hidden="true"></div>
                    <div class="python-bg-shape-2" aria-hidden="true"></div>
                    <div class="python-glass-card">
                        <h3 class="python-title">Mastering<br>Python</h3>
                        <div class="python-logo-wrapper" aria-hidden="true">
                            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" draggable="false">
                        </div>
                    </div>
                </div>
            `
        };

        return {
            id,
            title,
            tags,
            level,
            labs,
            thumbnail: {
                type: "html",
                html: htmlByVariant[variant] || ""
            }
        };
    }

    function makeSvgThumbnail(title, bg, accent, mark) {
        const safeTitle = escapeXml(title);
        const safeMark = escapeXml(mark);
        const words = title.split(" ");
        const lineOne = escapeXml(words.slice(0, 3).join(" "));
        const lineTwo = escapeXml(words.slice(3, 6).join(" "));
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 336" role="img" aria-label="${safeTitle}">
                <defs>
                    <radialGradient id="orb" cx="35%" cy="28%" r="70%">
                        <stop offset="0" stop-color="#fff" stop-opacity=".94"/>
                        <stop offset=".56" stop-color="${accent}" stop-opacity=".82"/>
                        <stop offset="1" stop-color="${accent}" stop-opacity=".52"/>
                    </radialGradient>
                    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="18" stdDeviation="15" flood-color="#172033" flood-opacity=".18"/>
                    </filter>
                    <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.1" fill="#172033" opacity=".12"/>
                    </pattern>
                </defs>
                <rect width="640" height="336" fill="${bg}"/>
                <rect width="640" height="336" fill="url(#dots)" opacity=".42"/>
                <text x="38" y="156" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#111827">
                    <tspan x="38" dy="0">${lineOne}</tspan>
                    <tspan x="38" dy="40">${lineTwo}</tspan>
                </text>
                <g filter="url(#softShadow)">
                    <circle cx="475" cy="168" r="84" fill="url(#orb)"/>
                    <circle cx="450" cy="140" r="28" fill="#fff" opacity=".28"/>
                    <rect x="405" y="197" width="142" height="30" rx="15" fill="#111827" opacity=".1"/>
                    <text x="475" y="184" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#fff">${safeMark}</text>
                </g>
            </svg>
        `;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function render() {
        renderTopics();
        renderDemoCarousels();
        renderHeroCarousel();
        updatePinnedCounts();

        const filtered = getFilteredCourses();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        activePage = Math.min(activePage, totalPages);
        const start = (activePage - 1) * pageSize;
        const visibleCourses = filtered.slice(start, start + pageSize);

        document.getElementById("courseCount").textContent = filtered.length.toString();
        document.getElementById("topicCountStat").textContent = totalModuleCount(filtered).toString();
        document.getElementById("catalogTitle").textContent = selectedCourseTitle || (activeTopic === "All" ? "All Courses" : activeTopic);
        renderActiveFilter(filtered.length);
        renderCourses(visibleCourses);
        renderPager(totalPages);
    }

    function clearCatalogFilters(topic = "All") {
        selectedCourseIds = null;
        selectedCourseTitle = "";
        activeTopic = topic || "All";
        activePage = 1;
        query = "";
        const searchInput = document.getElementById("courseSearch");
        if (searchInput) searchInput.value = "";
        render();
    }

    function jumpToSection(sectionId, behavior = "auto") {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const top = Math.max(0, section.offsetTop - 80);
        window.scrollTo({ top, behavior });
    }

    function showHome(updateUrl = true) {
        clearCatalogFilters("All");
        setDetailVisible(false);
        updateNavState("home");
        if (updateUrl) history.pushState({ view: "home" }, "", window.location.pathname);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function showCatalog(topic = "All", updateUrl = true, scrollBehavior = "auto") {
        clearCatalogFilters(topic);
        setDetailVisible(false);
        updateNavState("courses");
        if (updateUrl) {
            const normalizedTopic = topic && topic !== "All" ? `/${encodeURIComponent(topic)}` : "";
            history.pushState({ view: "courses", topic }, "", `#courses${normalizedTopic}`);
        }
        jumpToSection("courses", scrollBehavior);
    }

    function updateNavState(active) {
        document.querySelectorAll(".main-nav a, .main-nav button").forEach((link) => {
            const isActive =
                (active === "home" && link.hasAttribute("data-nav-home")) ||
                (active === "courses" && link.hasAttribute("data-nav-courses")) ||
                (active === "about" && link.hasAttribute("data-nav-about")) ||
                (active === "contact" && link.hasAttribute("data-nav-contact"));
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    function setHomeContentHidden(isHidden) {
        const hero = document.getElementById("home");
        const catalog = document.getElementById("courses");
        const carouselStack = document.getElementById("demoCarouselBlocks");

        if (hero) hero.hidden = isHidden;
        if (catalog) catalog.hidden = isHidden;
        if (carouselStack) carouselStack.hidden = isHidden;
        document.querySelectorAll(".demo-carousel-block").forEach((block) => {
            block.hidden = isHidden;
        });
    }

    function setAboutPageActive(isActive) {
        document.body.classList.toggle("is-about-page", Boolean(isActive));
    }

    function showInfoPage(pageKey, updateUrl = true) {
        const normalizedKey = normalizeInfoPageKey(pageKey);
        const page = buildInfoPage(normalizedKey);
        const infoPage = document.getElementById("infoPage");
        const authPage = document.getElementById("authPage");
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (!infoPage) return;

        infoPage.innerHTML = page;
        infoPage.hidden = false;
        if (authPage) authPage.hidden = true;
        if (detail) detail.hidden = true;
        if (player) player.hidden = true;
        setHomeContentHidden(true);
        if (footer) footer.hidden = false;
        if (topbar) topbar.hidden = false;
        document.body.classList.toggle("is-course-player", false);
        setAboutPageActive(normalizedKey === "about");
        updateNavState(normalizedKey === "about" || normalizedKey === "contact" ? normalizedKey : "");

        if (updateUrl) history.pushState({ view: normalizedKey }, "", `#${normalizedKey}`);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function showAuthPage(mode = "signup", updateUrl = true, routeKey = "") {
        if (getAuthToken()) {
            showCatalog("All", updateUrl, "auto");
            return;
        }
        const normalizedMode = mode === "signin" ? "signin" : "signup";
        const authPage = document.getElementById("authPage");
        const infoPage = document.getElementById("infoPage");
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (!authPage) return;

        authPage.innerHTML = buildAuthPage(normalizedMode);
        bindAuthPage(authPage, normalizedMode);
        authPage.hidden = false;
        if (infoPage) infoPage.hidden = true;
        if (detail) detail.hidden = true;
        if (player) player.hidden = true;
        setHomeContentHidden(true);
        if (footer) footer.hidden = false;
        if (topbar) topbar.hidden = false;
        document.body.classList.toggle("is-course-player", false);
        setAboutPageActive(false);
        updateNavState("");

        if (updateUrl) history.pushState({ view: normalizedMode }, "", `#${routeKey || normalizedMode}`);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function googleIconSvg() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4c-.2 1.2-.9 2.3-1.9 3v2.5h3.1c1.9-1.7 3-4.2 3-7.2z"/><path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.1-2.5c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2H3.1v2.6C4.7 19.7 8.1 22 12 22z"/><path fill="#FBBC05" d="M6.3 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7V7.7H3.1C2.4 9 2 10.5 2 12s.4 3 1.1 4.3l3.2-2.6z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.1 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.7l3.2 2.6C7.1 7.9 9.3 6.1 12 6.1z"/></svg>';
    }

    function buildAuthPage(mode) {
        const isSignup = mode === "signup";
        return `
            <section class="auth-layout" aria-labelledby="authPageTitle">
                <div class="auth-copy">
                    <span class="eyebrow">Get Started</span>
                    <h1 id="authPageTitle">Keep your learning path organized.</h1>
                    <p>Sign up to save bookmarks and keep pinned courses or modules one click away.</p>
                    <ul class="auth-benefits">
                        <li>Save bookmarks for courses and individual walkthrough modules.</li>
                        <li>Pin courses or modules from the Pinned button next to search.</li>
                        <li>Return to your chosen web development demos without rebuilding the same path.</li>
                    </ul>
                </div>
                <aside class="auth-panel" aria-label="Account forms">
                    <div class="auth-tabs" role="tablist" aria-label="Account action">
                        <button class="auth-tab ${isSignup ? "is-active" : ""}" type="button" data-auth-tab="signup">Sign up</button>
                        <button class="auth-tab ${!isSignup ? "is-active" : ""}" type="button" data-auth-tab="signin">Sign in</button>
                    </div>
                    <form class="auth-form" data-auth-form="${mode}">
                        <h2>${isSignup ? "Create your account" : "Sign in"}</h2>
                        ${isSignup ? `
                            <div class="auth-field">
                                <label for="authName">Name</label>
                                <input id="authName" name="display_name" autocomplete="name" placeholder="Your name">
                            </div>
                        ` : ""}
                        <div class="auth-field">
                            <label for="authEmail">Email</label>
                            <input id="authEmail" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
                        </div>
                        <div class="auth-field">
                            <label for="authPassword">Password</label>
                            <input id="authPassword" name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" required placeholder="Minimum 8 characters">
                        </div>
                        <button class="auth-submit" type="submit">${isSignup ? "Sign up" : "Sign in"}</button>
                        <div class="auth-divider"><span>or</span></div>
                        <button class="auth-google" type="button" data-google-auth="${mode}">${googleIconSvg()}<span>${isSignup ? "Sign up with Google" : "Continue with Google"}</span></button>
                        <p class="auth-message" data-auth-message>${isSignup ? "Already have an account? Use the Sign in tab." : "New here? Use the Sign up tab."}</p>
                    </form>
                </aside>
            </section>
        `;
    }

    function bindAuthPage(authPage, mode) {
        authPage.querySelectorAll("[data-auth-tab]").forEach((button) => {
            button.addEventListener("click", () => {
                showAuthPage(button.dataset.authTab, true);
            });
        });

        const form = authPage.querySelector("[data-auth-form]");
        if (form) {
            form.addEventListener("submit", (event) => submitAuthForm(event, mode));
        }
        authPage.querySelectorAll("[data-google-auth]").forEach((button) => {
            button.addEventListener("click", () => startGoogleAuth(button.dataset.googleAuth || mode));
        });
    }

    async function submitAuthForm(event, mode) {
        event.preventDefault();
        const form = event.currentTarget;
        const submit = form.querySelector(".auth-submit");
        const message = form.querySelector("[data-auth-message]");
        const formData = new FormData(form);
        const isSignup = mode === "signup";
        const payload = {
            email: String(formData.get("email") || "").trim(),
            password: String(formData.get("password") || "")
        };
        if (isSignup) payload.display_name = String(formData.get("display_name") || "").trim();

        if (submit) {
            submit.disabled = true;
            submit.textContent = isSignup ? "Creating account..." : "Signing in...";
        }
        if (message) {
            message.classList.remove("is-error");
            message.textContent = "";
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/${isSignup ? "register" : "login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.accessToken) {
                const error = data.error;
                throw new Error(typeof error === "string" ? error : error?.message || "Authentication failed.");
            }

            localStorage.setItem("lp_auth_token", data.accessToken);
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("lp_is_logged_in", "true");
            localStorage.setItem("gradstudio_user", JSON.stringify(data.user || { email: payload.email }));

            if (message) message.textContent = isSignup ? "Account created. Syncing your pinned items..." : "Signed in. Syncing your pinned items...";
            await finishAuthSuccess(data);
        } catch (err) {
            if (message) {
                message.classList.add("is-error");
                message.textContent = err.message || "Could not complete this request.";
            }
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.textContent = isSignup ? "Sign up" : "Sign in";
            }
        }
    }

    function initializeGoogleClient() {
        if (googleTokenClient || !window.google?.accounts?.oauth2) return googleTokenClient;
        googleTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            callback: handleGoogleTokenResponse
        });
        return googleTokenClient;
    }

    function startGoogleAuth(mode = "signin") {
        pendingGoogleAuthMode = mode === "signup" ? "signup" : "signin";
        const client = initializeGoogleClient();
        const message = document.querySelector("[data-auth-message]");
        if (!client) {
            if (message) {
                message.classList.add("is-error");
                message.textContent = "Google sign-in is still loading. Try again in a moment.";
            }
            return;
        }
        if (message) {
            message.classList.remove("is-error");
            message.textContent = "Opening Google sign-in...";
        }
        client.requestAccessToken({ prompt: "select_account" });
    }

    async function handleGoogleTokenResponse(response) {
        const message = document.querySelector("[data-auth-message]");
        if (!response || response.error || !response.access_token) {
            if (message) {
                message.classList.add("is-error");
                message.textContent = "Google sign-in was cancelled or failed.";
            }
            return;
        }

        try {
            if (message) {
                message.classList.remove("is-error");
                message.textContent = "Signing in with Google...";
            }
            const result = await fetch(`${API_BASE}/api/auth/google/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    access_token: response.access_token,
                    mode: pendingGoogleAuthMode
                })
            });
            const data = await result.json().catch(() => ({}));
            if (!result.ok || !data.accessToken) {
                const error = data.error;
                throw new Error(typeof error === "string" ? error : error?.message || "Google sign-in failed.");
            }
            if (message) message.textContent = "Signed in with Google. Syncing your pinned items...";
            await finishAuthSuccess(data);
        } catch (error) {
            if (message) {
                message.classList.add("is-error");
                message.textContent = error.message || "Google sign-in failed.";
            }
        }
    }

    async function finishAuthSuccess(data) {
        setAuthSession(data);
        pinnedItems = [];
        savePinnedItemsLocal();
        await syncPinsAfterAuth();
        showHome(true);
    }

    function normalizeInfoPageKey(pageKey) {
        const key = String(pageKey || "").toLowerCase();
        return ["about", "contact", "legal", "privacy", "terms", "cookies"].includes(key) ? key : "about";
    }

    function buildAboutPage() {
        return `
            <section class="about-standard" aria-labelledby="infoPageTitle">
                <div class="about-standard-grid">
                    <div class="about-standard-copy">
                        <h1 id="infoPageTitle">About GradStudio</h1>
                        <h2>Hi, I&rsquo;m Sabareesh. I built GradStudio to make technical learning clearer, more practical, and easier to follow.</h2>
                        <p>I&rsquo;m a full-stack developer focused on AI, cloud, and learning systems. GradStudio is where I turn technical topics into structured lessons that explain the workflow behind the result.</p>
                        <a class="about-github-link" href="https://github.com/sabs-27" target="_blank" rel="noopener noreferrer">View GitHub: sabs-27</a>
                    </div>
                    <aside class="about-standard-photo" aria-label="Sabareesh profile">
                        <div class="about-standard-image-frame">
                            <img src="https://raw.githubusercontent.com/sabs-27/images/main/NEWG.jpg" alt="Sabareesh" loading="eager" decoding="async">
                        </div>
                        <div class="about-standard-caption">
                            <strong>Sabareesh</strong>
                            <span>Full-stack developer focused on AI, cloud, and learning systems.</span>
                        </div>
                    </aside>
                </div>
                <div class="about-standard-points" aria-label="GradStudio approach">
                    <article>
                        <h3>What it is</h3>
                        <p>A structured space for learning AI, machine learning, backend development, cloud, and related engineering topics.</p>
                    </article>
                    <article>
                        <h3>How it works</h3>
                        <p>Lessons focus on the workflow: setup, architecture, implementation, and the reason behind each step.</p>
                    </article>
                    <article>
                        <h3>Who it helps</h3>
                        <p>Beginners and early builders who want direct explanations without losing the practical engineering context.</p>
                    </article>
                </div>
            </section>
        `;
    }

    function buildInfoPage(pageKey) {
        if (pageKey === "about") return buildAboutPage();

        const pages = {
            about: {
                eyebrow: "",
                title: "About",
                paragraphs: [
                    "Hi, I’m Sabareesh — a Computer Science graduate from Auburn University at Montgomery and a full-stack developer focused on AI and cloud-based learning systems.",
                    "I built GradStudio as a structured learning platform for technical domains like AI, machine learning, backend development, and system design. Instead of focusing only on theory or purely interactive tools, the platform emphasizes step-by-step breakdowns, visual explanations, and guided code walkthroughs that make complex topics easier to follow.",
                    "Most of the content is designed like real engineering workflows — setup processes, architecture flows, and implementation steps — so learners can understand not just what to do, but why each step exists.",
                    "The goal is to make technical learning clearer and more practical, especially for beginners who want to move from confusion to actually building things."
                ],
                profileImage: "https://raw.githubusercontent.com/sabs-27/images/main/NEWG.jpg",
                profileAlt: "Sabareesh portrait",
                profileLink: "https://github.com/sabs-27",
                profileLinkLabel: "GitHub: sabs-27",
                sections: []
            },
            contact: {
                eyebrow: "Contact",
                title: "Questions, feedback, or support",
                body: "Use this page for course questions, platform feedback, technical problems, or policy questions.",
                contact: true,
                sections: [
                    ["Support Email", "Email support@gradstudio.org and include the course name, lesson name, browser, and a short description of what happened."],
                    ["Course Feedback", "For course content corrections or improvement requests, include the exact course and lesson so the issue can be reviewed quickly."],
                    ["Account Or Access Issues", "For access problems, include the email address used for GradStudio and the page where the issue occurs."]
                ]
            },
            legal: {
                eyebrow: "Legal",
                title: "Platform policies and learner protections",
                body: "This page summarizes the policy areas that govern GradStudio content, platform access, learner data, and browser storage.",
                sections: [
                    ["Privacy", "GradStudio handles learner and platform data to provide course access, support learning features, troubleshoot issues, and improve course quality."],
                    ["Terms", "Learners are expected to use the platform responsibly, respect course content, and avoid activity that disrupts services or other users."],
                    ["Cookies", "Cookies and local browser storage may be used for sessions, preferences, cached catalog data, and platform performance."],
                    ["Contact", "Questions about legal, privacy, terms, or cookie policies can be sent to support@gradstudio.org."]
                ]
            },
            privacy: {
                eyebrow: "Privacy",
                title: "Privacy Policy",
                body: "GradStudio collects only the information needed to operate learning features, support accounts, improve course quality, and keep the platform secure.",
                sections: [
                    ["Information We Use", "Course activity, account details, support messages, and technical logs may be used to provide platform functionality, troubleshoot problems, and improve the learner experience."],
                    ["How Information Is Protected", "Platform data is handled with access controls and infrastructure safeguards appropriate for a learning system. Access is limited to what is needed to operate and support the service."],
                    ["How Information Is Used", "Data may be used to maintain course progress, load content, diagnose errors, improve performance, prevent abuse, and respond to learner requests."],
                    ["Privacy Questions", "Privacy questions or requests can be sent to support@gradstudio.org."]
                ]
            },
            terms: {
                eyebrow: "Terms",
                title: "Terms of Service",
                body: "By using GradStudio, learners agree to use the platform responsibly, respect course content, and avoid activity that disrupts services or other users.",
                sections: [
                    ["Learning Content", "Course materials, demos, exercises, and explanations are provided for education and practice. Content may be updated as courses improve."],
                    ["Acceptable Use", "Do not misuse platform access, attempt unauthorized access, scrape protected content, interfere with service operation, or disrupt other learners."],
                    ["Accounts And Access", "Learners are responsible for using account access appropriately and for reporting access issues or suspected misuse."],
                    ["Updates", "Terms may be updated as the platform evolves. Continued use of GradStudio means the current terms apply."]
                ]
            },
            cookies: {
                eyebrow: "Cookies",
                title: "Cookie Policy",
                body: "GradStudio uses cookies and local browser storage to keep the learning experience fast, functional, and consistent between visits.",
                sections: [
                    ["Functional Storage", "Browser storage may remember UI preferences, cached catalog data, course thumbnails, and local learning state so the site can load reliably."],
                    ["Performance", "Caching helps pages, demos, and thumbnails load faster without repeating the same network work on every visit."],
                    ["Session Support", "Cookies or local storage may support sign-in state, security checks, and normal platform operation."],
                    ["Your Control", "You can clear cookies or browser storage from your browser settings. Some GradStudio features may reload data after storage is cleared."]
                ]
            }
        };
        const page = pages[pageKey] || pages.about;
        const intro = Array.isArray(page.paragraphs) && page.paragraphs.length
            ? page.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
            : `<p>${escapeHtml(page.body)}</p>`;
        const sections = Array.isArray(page.sections) && page.sections.length ? `
            <article class="info-document" aria-label="${escapeHtml(page.title)} details">
                ${page.sections.map(([title, body]) => `
                    <section class="info-document-section">
                        <h2>${escapeHtml(title)}</h2>
                        <p>${escapeHtml(body)}</p>
                    </section>
                `).join("")}
            </article>
        ` : "";
        const contact = page.contact ? `
            <div class="info-contact-card">
                <span>Email</span>
                <a href="mailto:support@gradstudio.org">support@gradstudio.org</a>
            </div>
        ` : "";
        const profile = page.profileImage ? `
            <figure class="about-profile-card">
                <img src="${escapeHtml(page.profileImage)}" alt="${escapeHtml(page.profileAlt || page.title)}" loading="lazy" decoding="async">
                <figcaption>
                    <strong>Sabareesh</strong>
                    <span>Full-stack builder focused on AI, LLM, NLP, and cloud learning systems.</span>
                    ${page.profileLink ? `<a class="about-profile-link" href="${escapeHtml(page.profileLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.profileLinkLabel || page.profileLink)}</a>` : ""}
                </figcaption>
            </figure>
        ` : "";

        return `
            <section class="info-page-hero" aria-labelledby="infoPageTitle">
                <div class="section-copy">
                    ${page.eyebrow ? `<span class="eyebrow">${escapeHtml(page.eyebrow)}</span>` : ""}
                    <h1 id="infoPageTitle">${escapeHtml(page.title)}</h1>
                    ${intro}
                </div>
                ${profile || contact}
            </section>
            ${sections}
        `;
    }

    function renderDemoCarousels() {
        const stack = document.getElementById("demoCarouselBlocks");
        if (stack) {
            renderLayoutStack(stack);
            return;
        }
        const eyebrow = document.querySelector(".demo-carousel-block .eyebrow");
        const heading = document.getElementById("demoCarouselTitle");
        if (eyebrow) eyebrow.textContent = carouselEyebrowText || "HTML Demo Thumbnails";
        if (heading) heading.textContent = carouselHeadingText || "Featured module previews";
        applyCarouselLayout();
        buildFeaturedCarousel();
        buildCompactCarousel();
    }

    function renderHeroCarousel() {
        const mount = document.getElementById("heroCarouselCard");
        if (!mount) return;
        mount.innerHTML = `
            <article
                class="hero-carousel-card hero-carousel-card--hardcoded"
                data-content-type="image"
                data-text-position="hidden"
                aria-label="Simplicity takes effort hero image"
            >
                <div class="hero-card-media">
                    <img
                        class="hero-hardcoded-image carousel-card-image"
                        src="hero-gradstudio-20260429-152846.png"
                        alt="Simplicity takes effort HTML learning artwork"
                        decoding="async"
                        fetchpriority="high"
                    >
                </div>
            </article>
        `;
    }

    function heroCarouselCardStyle(card) {
        return [
            `--card-bg:${card.bgColor}`,
            `--card-title-font:${card.headingFont}`,
            `--card-title-size:${card.headingSize}px`,
            `--card-title-color:${card.headingColor}`,
            `--card-sub-font:${card.subFont}`,
            `--card-sub-size:${card.subSize}px`,
            `--card-sub-color:${card.subColor}`,
            `--card-text-align:${card.textAlign}`
        ].join(";");
    }

    function renderLayoutStack(stack) {
        const blocks = homepageLayoutBlocks.length ? homepageLayoutBlocks : (shouldUseCarouselFallback() ? fallbackLayoutBlocks() : []);
        carouselCardMap = new Map();
        if (!blocks.length) {
            stack.innerHTML = "";
            return;
        }
        stack.innerHTML = blocks.map(renderLayoutBlock).join("");
        bindCarouselCardClicks(stack);
        bindLayoutScrollButtons(stack);
        bindLayoutSwipe(stack);
        hydrateLazyThumbnailFrames(stack);
        updateLayoutCarouselControls(stack);
        requestAnimationFrame(() => updateLayoutCarouselControls(stack));
    }

    function fallbackLayoutBlocks() {
        return [
            {
                id: "1",
                type: "carousel",
                slot: "featured",
                eyebrow: carouselEyebrowText || "HTML Demo Thumbnails",
                header: carouselHeadingText || "Featured module previews",
                config: featuredCarouselConfig || defaultCarouselRuntimeConfig("featured"),
                cards: featuredCarouselCards.length ? featuredCarouselCards : fallbackFeaturedCards()
            },
            {
                id: "2",
                type: "carousel",
                slot: "compact",
                eyebrow: "",
                header: "More module previews",
                config: compactCarouselConfig || defaultCarouselRuntimeConfig("compact"),
                cards: compactCarouselCards.length ? compactCarouselCards : fallbackCompactCards()
            }
        ];
    }

    function renderLayoutBlock(block) {
        const config = block.config || defaultCarouselRuntimeConfig(block.slot || "featured");
        if (block.type === "text") return renderStandaloneTextBlock(block, config);
        return renderCarouselLayoutBlock(block, config);
    }

    function renderStandaloneTextBlock(block, config) {
        const text = config.sectionText || "";
        if (!text) return "";
        return `
            <section class="demo-carousel-block demo-text-layout-block" data-align="${escapeHtml(config.layoutAlign)}" data-copy-align="${escapeHtml(config.sectionTextAlign)}" style="${carouselBlockStyle(config)}">
                <div class="carousel-text-block">${escapeHtml(text)}</div>
            </section>
        `;
    }

    function renderCarouselLayoutBlock(block, config) {
        const cards = Array.isArray(block.cards) ? block.cards : [];
        if (!cards.length) return "";
        const sharedCardHeight = carouselSharedCardHeight(cards, block.slot);
        const railId = `carouselRail-${cssIdent(block.id)}`;
        const viewportId = `carouselViewport-${cssIdent(block.id)}`;
        const railClass = block.slot === "compact" ? "compact-demo-rail" : "featured-demo-rail";
        const hasHeadingText = !!(block.eyebrow || block.header);
        const visibleCount = Math.max(1, Number(config.visibleCount) || 1);
        const hasCustomWidth = cards.some((card) => cardHasCustomWidth(card, block.slot));
        const showControls = cards.length > 1 && (config.infiniteScroll || hasCustomWidth || cards.length > visibleCount);
        const cardMarkup = cards.map((card, index) => {
            return block.slot === "compact"
                ? renderCompactDemoCard(card, config, sharedCardHeight)
                : renderFeatureDemoCard(card, index % 2 === 0 ? "is-primary" : "is-secondary", config, sharedCardHeight);
        }).join("");
        return `
            <section class="demo-carousel-block" data-align="${escapeHtml(config.layoutAlign)}" data-copy-align="${escapeHtml(config.sectionTextAlign)}" data-infinite="${config.infiniteScroll ? "true" : "false"}" style="${carouselBlockStyle(config)}">
                ${config.sectionText ? `<div class="carousel-text-block">${escapeHtml(config.sectionText)}</div>` : ""}
                <div class="carousel-heading ${hasHeadingText ? "" : "is-controls-only"}">
                    <div>
                        ${block.eyebrow ? `<span class="eyebrow">${escapeHtml(block.eyebrow)}</span>` : ""}
                        ${block.header ? `<h3>${escapeHtml(block.header)}</h3>` : ""}
                    </div>
                    <div class="carousel-controls ${showControls ? "" : "is-hidden"}" aria-label="Carousel controls">
                        ${carouselButtonSvg(-1, viewportId)}
                        ${carouselButtonSvg(1, viewportId)}
                    </div>
                </div>
                <div class="carousel-viewport" id="${escapeHtml(viewportId)}">
                    <div id="${escapeHtml(railId)}" class="${railClass} is-static" style="${carouselRailStyle(config)}">${cardMarkup}</div>
                </div>
            </section>
        `;
    }

    function carouselButtonSvg(dir, viewportId) {
        const label = dir < 0 ? "Previous carousel cards" : "Next carousel cards";
        const path = dir < 0
            ? "M14.7 6.3 9 12l5.7 5.7-1.4 1.4L6.2 12l7.1-7.1 1.4 1.4Z"
            : "m9.3 17.7 5.7-5.7-5.7-5.7 1.4-1.4 7.1 7.1-7.1 7.1-1.4-1.4Z";
        return `<button class="carousel-button" type="button" data-layout-scroll="${escapeHtml(viewportId)}" data-scroll-dir="${dir}" aria-label="${label}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}" /></svg></button>`;
    }

    function carouselBlockStyle(config) {
        return [
            `--carousel-max-width:${config.maxWidth}`,
            `--carousel-heading-align:${config.textAlign}`,
            `--carousel-heading-font:${config.headerFont}`,
            `--carousel-heading-size:${config.headerFontSize}px`,
            `--carousel-heading-color:${config.headerColor}`,
            `--carousel-copy-font:${config.sectionTextFont}`,
            `--carousel-copy-size:${config.sectionTextSize}px`,
            `--carousel-copy-color:${config.sectionTextColor}`,
            `--carousel-copy-align:${config.sectionTextAlign}`,
            `--carousel-copy-max-width:${config.sectionTextMaxWidth}`,
            `--carousel-block-top:${config.blockSpacingTop}px`,
            `--carousel-block-bottom:${config.blockSpacingBottom}px`,
            `--carousel-text-gap:${config.textGap}px`
        ].join(";");
    }

    function carouselRailStyle(config) {
        return [
            `--carousel-gap:${config.cardGap}px`,
            `--carousel-end-pad:${Math.max(24, Number(config.cardGap) || 0)}px`,
            `--carousel-rail-align:${alignToJustify(config.layoutAlign)}`,
            `--fit-card-width:calc((100% - ${(config.visibleCount - 1) * config.cardGap}px) / ${config.visibleCount})`
        ].join(";");
    }

    function bindLayoutScrollButtons(root) {
        root.querySelectorAll("[data-layout-scroll]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                const viewport = document.getElementById(button.dataset.layoutScroll);
                if (!viewport) return;
                slideLayoutViewport(viewport, Number(button.dataset.scrollDir || 1));
            });
        });
    }

    function bindLayoutSwipe(root) {
        root.querySelectorAll(".carousel-viewport").forEach((viewport) => {
            addSwipeHandlers(viewport, (dir) => {
                slideLayoutViewport(viewport, dir);
            });
            bindLayoutWheel(viewport);
        });
    }

    function updateLayoutCarouselControls(root = document) {
        root.querySelectorAll(".carousel-viewport").forEach((viewport) => {
            const block = viewport.closest(".demo-carousel-block");
            const controls = block ? block.querySelector(".carousel-controls") : null;
            const rail = viewport.querySelector(".featured-demo-rail, .compact-demo-rail");
            if (!controls || !rail) return;
            const cardCount = rail.children.length;
            const infinite = block?.dataset.infinite === "true";
            const isScrollable = viewport.scrollWidth > viewport.clientWidth + 2;
            controls.classList.toggle("is-hidden", !(cardCount > 1 && (infinite || isScrollable)));
        });
    }

    function slideLayoutViewport(viewport, dir) {
        const rail = viewport.querySelector(".featured-demo-rail, .compact-demo-rail");
        const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        if (!rail || maxLeft <= 1) return;

        const infinite = viewport.closest(".demo-carousel-block")?.dataset.infinite === "true";
        const atStart = viewport.scrollLeft <= 2;
        const atEnd = viewport.scrollLeft >= maxLeft - 2;
        let nextLeft;

        if (dir > 0 && atEnd) {
            nextLeft = infinite ? 0 : maxLeft;
        } else if (dir < 0 && atStart) {
            nextLeft = infinite ? maxLeft : 0;
        } else {
            nextLeft = layoutTargetScrollLeft(viewport, rail, dir, maxLeft);
        }

        viewport.scrollTo({ left: nextLeft, behavior: "auto" });
    }

    function layoutTargetScrollLeft(viewport, rail, dir, maxLeft) {
        const current = viewport.scrollLeft;
        const offsets = Array.from(rail.children)
            .map((child) => Math.min(maxLeft, Math.max(0, child.offsetLeft)))
            .filter((offset, index, list) => index === 0 || Math.abs(offset - list[index - 1]) > 2);
        if (!offsets.length) {
            return Math.min(maxLeft, Math.max(0, current + dir * viewport.clientWidth * 0.82));
        }
        if (dir > 0) {
            const next = offsets.find((offset) => offset > current + 2);
            return next === undefined ? maxLeft : next;
        }
        const previous = offsets.slice().reverse().find((offset) => offset < current - 2);
        return previous === undefined ? 0 : previous;
    }

    function bindLayoutWheel(viewport) {
        if (viewport.dataset.wheelBound === "true") return;
        viewport.dataset.wheelBound = "true";

        viewport.addEventListener("wheel", (event) => {
            const rawDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.shiftKey
                ? (event.deltaX || event.deltaY)
                : 0;
            if (!rawDelta) return;

            const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
            if (maxLeft <= 1) return;

            const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
            const nextLeft = Math.min(maxLeft, Math.max(0, viewport.scrollLeft + rawDelta * multiplier));
            if (nextLeft === viewport.scrollLeft) return;

            event.preventDefault();
            viewport.scrollLeft = nextLeft;
        }, { passive: false });
    }

    function cssIdent(value) {
        return String(value || "carousel").replace(/[^a-zA-Z0-9_-]/g, "-");
    }

    function applyCarouselLayout() {
        const block = document.querySelector(".demo-carousel-block");
        if (!block) return;
        const config = featuredCarouselConfig || defaultCarouselRuntimeConfig("featured");
        block.dataset.align = config.layoutAlign;
        block.dataset.copyAlign = config.sectionTextAlign;
        block.style.setProperty("--carousel-max-width", config.maxWidth);
        block.style.setProperty("--carousel-heading-align", config.textAlign);
        block.style.setProperty("--carousel-heading-font", config.headerFont);
        block.style.setProperty("--carousel-heading-size", `${config.headerFontSize}px`);
        block.style.setProperty("--carousel-heading-color", config.headerColor);
        block.style.setProperty("--carousel-copy-font", config.sectionTextFont);
        block.style.setProperty("--carousel-copy-size", `${config.sectionTextSize}px`);
        block.style.setProperty("--carousel-copy-color", config.sectionTextColor);
        block.style.setProperty("--carousel-copy-align", config.sectionTextAlign);
        block.style.setProperty("--carousel-copy-max-width", config.sectionTextMaxWidth);
        block.style.setProperty("--carousel-block-top", `${config.blockSpacingTop}px`);
        block.style.setProperty("--carousel-block-bottom", `${config.blockSpacingBottom}px`);
        block.style.setProperty("--carousel-text-gap", `${config.textGap}px`);

        applyCarouselTextBlock(document.getElementById("carouselTextBlock"), config);
        applyCarouselTextBlock(document.getElementById("compactCarouselTextBlock"), compactCarouselConfig || defaultCarouselRuntimeConfig("compact"));

        const featuredRail = document.getElementById("featuredDemoRail");
        const compactRail = document.getElementById("compactDemoRail");
        applyRailConfig(featuredRail, featuredCarouselConfig, "featured");
        applyRailConfig(compactRail, compactCarouselConfig, "compact");
    }

    function applyRailConfig(rail, config, slot) {
        if (!rail) return;
        const fallback = defaultCarouselRuntimeConfig(slot);
        const active = config || fallback;
        rail.dataset.sizing = active.layoutStyle;
        rail.style.setProperty("--carousel-gap", `${active.cardGap}px`);
        rail.style.setProperty("--carousel-rail-align", alignToJustify(active.layoutAlign || featuredCarouselConfig.layoutAlign));
        rail.style.setProperty("--fit-card-width", `calc((100% - ${(active.visibleCount - 1) * active.cardGap}px) / ${active.visibleCount})`);
    }

    function applyCarouselTextBlock(node, config) {
        if (!node || !config) return;
        node.textContent = config.sectionText || "";
        node.hidden = !config.sectionText;
        node.dataset.copyAlign = config.sectionTextAlign;
        node.style.setProperty("--carousel-copy-font", config.sectionTextFont);
        node.style.setProperty("--carousel-copy-size", `${config.sectionTextSize}px`);
        node.style.setProperty("--carousel-copy-color", config.sectionTextColor);
        node.style.setProperty("--carousel-copy-align", config.sectionTextAlign);
        node.style.setProperty("--carousel-copy-max-width", config.sectionTextMaxWidth);
        node.style.setProperty("--carousel-text-gap", `${config.textGap}px`);
    }

    function alignToJustify(value) {
        if (value === "center") return "center";
        if (value === "right") return "flex-end";
        return "flex-start";
    }

    function carouselSharedCardHeight(cards, slot) {
        const fallback = slot === "compact" ? "160px" : slot === "hero" ? "390px" : "420px";
        const first = Array.isArray(cards) && cards.length ? cards[0] : null;
        return normalizeCssLength(first?.heightPx || first?.height_px, fallback);
    }

    /* Infinite carousel engine */

    function buildFeaturedCarousel() {
        const rail = document.getElementById("featuredDemoRail");
        const cards = featuredCarouselCards.length ? featuredCarouselCards : (shouldUseCarouselFallback() ? fallbackFeaturedCards() : []);
        const config = featuredCarouselConfig || defaultCarouselRuntimeConfig("featured");
        const visible = config.visibleCount || FEATURED_VISIBLE;
        const gap = config.cardGap || FEATURED_GAP;
        const sharedCardHeight = carouselSharedCardHeight(cards, "featured");
        const key = cards.map((card) => `${card.key}:${card.width}:${card.heightPx}:${card.textPosition}:${card.textAlign}:${card.contentType}:${card.imageUrl}:${card.iframeUrl}:${signatureHash(card.contentHtml || "")}`).join("|") + JSON.stringify(config);
        if (rail.dataset.carouselKey === key) return;
        rail.dataset.carouselKey = key;

        const staticRail = !config.infiniteScroll || cards.length <= visible;
        const clones = staticRail ? 0 : Math.min(visible, cards.length);
        const all = staticRail ? cards : [...cards.slice(-clones), ...cards, ...cards.slice(0, clones)];
        rail.classList.toggle("is-static", staticRail);
        setCarouselControlsVisible("featured", !staticRail);

        rail.innerHTML = all.map((card, i) => {
            const idx = i < clones ? cards.length - clones + i : (i - clones) >= cards.length ? (i - clones - cards.length) : i - clones;
            return renderFeatureDemoCard(card, idx % 2 === 0 ? "is-primary" : "is-secondary", config, sharedCardHeight);
        }).join("");
        bindCarouselCardClicks(rail);
        hydrateLazyThumbnailFrames(rail);

        featuredPos = 0;
        setTrackPos(rail, featuredPos, clones, visible, gap, false);

        rail.ontransitionend = () => {
            if (staticRail) return;
            const n = cards.length;
            if (featuredPos >= n) { featuredPos -= n; setTrackPos(rail, featuredPos, clones, visible, gap, false); }
            if (featuredPos < 0)  { featuredPos += n; setTrackPos(rail, featuredPos, clones, visible, gap, false); }
            featuredBusy = false;
        };
    }

    function buildCompactCarousel() {
        const rail = document.getElementById("compactDemoRail");
        const cards = compactCarouselCards.length ? compactCarouselCards : (shouldUseCarouselFallback() ? fallbackCompactCards() : []);
        const config = compactCarouselConfig || defaultCarouselRuntimeConfig("compact");
        const visible = config.visibleCount || COMPACT_VISIBLE;
        const gap = config.cardGap || COMPACT_GAP;
        const sharedCardHeight = carouselSharedCardHeight(cards, "compact");
        const key = cards.map((card) => `${card.key}:${card.width}:${card.heightPx}:${card.textPosition}:${card.textAlign}:${card.contentType}:${card.imageUrl}:${card.iframeUrl}:${signatureHash(card.contentHtml || "")}`).join("|") + JSON.stringify(config);
        if (rail.dataset.carouselKey === key) return;
        rail.dataset.carouselKey = key;

        const staticRail = !config.infiniteScroll || cards.length <= visible;
        const clones = staticRail ? 0 : Math.min(visible, cards.length);
        const all = staticRail ? cards : [...cards.slice(-clones), ...cards, ...cards.slice(0, clones)];
        rail.classList.toggle("is-static", staticRail);
        setCarouselControlsVisible("compact", !staticRail);

        rail.innerHTML = all.map((card) => renderCompactDemoCard(card, config, sharedCardHeight)).join("");
        bindCarouselCardClicks(rail);
        hydrateLazyThumbnailFrames(rail);

        compactPos = 0;
        setTrackPos(rail, compactPos, clones, visible, gap, false);

        rail.ontransitionend = () => {
            if (staticRail) return;
            const n = cards.length;
            if (compactPos >= n) { compactPos -= n; setTrackPos(rail, compactPos, clones, visible, gap, false); }
            if (compactPos < 0)  { compactPos += n; setTrackPos(rail, compactPos, clones, visible, gap, false); }
            compactBusy = false;
        };
    }

    function setTrackPos(rail, pos, cloneCount, visible, gap, animate) {
        const target = rail.children[pos + cloneCount];
        const offset = target ? target.offsetLeft : 0;
        rail.style.transition = animate ? "" : "none";
        rail.style.transform = `translateX(-${offset}px)`;
        if (!animate) { void rail.offsetWidth; rail.style.transition = ""; }
    }

    function setCarouselControlsVisible(target, visible) {
        document.querySelectorAll(`[data-carousel-target="${target}"]`).forEach((button) => {
            button.disabled = !visible;
            const group = button.closest(".carousel-controls");
            if (group) group.classList.toggle("is-hidden", !visible);
        });
    }

    function slideFeatured(dir) {
        if (featuredBusy) return;
        if (document.getElementById("featuredDemoRail")?.classList.contains("is-static")) return;
        featuredBusy = true;
        featuredPos += dir;
        const config = featuredCarouselConfig || defaultCarouselRuntimeConfig("featured");
        const visible = config.visibleCount || FEATURED_VISIBLE;
        setTrackPos(document.getElementById("featuredDemoRail"), featuredPos, visible, visible, config.cardGap || FEATURED_GAP, true);
    }

    function slideCompact(dir) {
        if (compactBusy) return;
        if (document.getElementById("compactDemoRail")?.classList.contains("is-static")) return;
        compactBusy = true;
        compactPos += dir;
        const config = compactCarouselConfig || defaultCarouselRuntimeConfig("compact");
        const visible = config.visibleCount || COMPACT_VISIBLE;
        setTrackPos(document.getElementById("compactDemoRail"), compactPos, visible, visible, config.cardGap || COMPACT_GAP, true);
    }

    function renderFeatureDemoCard(card, variantClass, config = featuredCarouselConfig, sharedHeight = "") {
        carouselCardMap.set(card.key, card);
        return `
            <article class="demo-feature-card ${variantClass}" role="button" tabindex="0" data-carousel-card-key="${escapeHtml(card.key)}" data-content-type="${escapeHtml(card.contentType)}" data-text-position="${escapeHtml(card.textPosition)}" data-frame-style="${escapeHtml(card.frameStyle || "framed")}" style="${carouselCardStyle(card, "featured", config, sharedHeight)}">
                <div class="demo-card-media-shell">${renderCarouselCardMedia(card, "featured")}</div>
            </article>
        `;
    }

    function renderCompactDemoCard(card, config = compactCarouselConfig, sharedHeight = "") {
        carouselCardMap.set(card.key, card);
        return `
            <article class="compact-demo-card" role="button" tabindex="0" data-carousel-card-key="${escapeHtml(card.key)}" data-content-type="${escapeHtml(card.contentType)}" data-text-position="${escapeHtml(card.textPosition)}" data-frame-style="${escapeHtml(card.frameStyle || "framed")}" style="${carouselCardStyle(card, "compact", config, sharedHeight)};--compact-bg: ${escapeHtml(card.bg || carouselGradient(card.colorHex, 0))}">
                <div class="compact-card-media">${renderCarouselCardMedia(card, "compact")}</div>
                <div class="compact-card-copy">
                    ${card.title ? `<b>${escapeHtml(card.title)}</b>` : ""}
                    ${card.eyebrow ? `<span>${escapeHtml(card.eyebrow)}</span>` : ""}
                </div>
            </article>
        `;
    }

    function carouselCardStyle(card, slot, config = null, sharedHeight = "") {
        const width = cardHasCustomWidth(card, slot) ? card.width : "var(--fit-card-width)";
        const height = sharedHeight || card.heightPx;
        return [
            `--card-width:${width}`,
            `--card-height:${height}`,
            `--card-bg:${card.bgColor}`,
            `--card-title-font:${card.headingFont}`,
            `--card-title-size:${card.headingSize}px`,
            `--card-title-color:${card.headingColor}`,
            `--card-sub-font:${card.subFont}`,
            `--card-sub-size:${card.subSize}px`,
            `--card-sub-color:${card.subColor}`,
            `--card-text-align:${card.textAlign}`
        ].join(";");
    }

    function cardHasCustomWidth(card, slot) {
        const fallback = slot === "hero" ? "860px" : slot === "compact" ? "220px" : "400px";
        return normalizeCssLength(card.width, fallback) !== fallback;
    }

    function renderCarouselCardMedia(card, size) {
        if (card.contentType === "image" && card.imageUrl) {
            return `<img class="carousel-card-image" src="${escapeHtml(resolveAssetUrl(card.imageUrl))}" alt="${escapeHtml(card.title || "Carousel card")} thumbnail" loading="lazy" decoding="async" fetchpriority="low">`;
        }
        if (card.contentType === "iframe" && card.iframeUrl) {
            return `<iframe title="${escapeHtml(card.title)}" src="${escapeHtml(resolveAssetUrl(card.iframeUrl))}" loading="lazy" sandbox="allow-scripts"></iframe>`;
        }
        if (card.contentType === "html" && card.contentHtml) {
            if (shouldRenderHtmlThumbnailFrame(card.contentHtml)) {
                return renderHtmlThumbnailFrame(card.contentHtml, card.title, size);
            }
            return `<div class="carousel-html-media">${sanitizeHtmlSnippet(card.contentHtml)}</div>`;
        }
        if (size === "compact") return "";
        return `<div class="carousel-icon-media" style="--card-color:${escapeHtml(card.colorHex || "#3b82f6")}"><i class="${escapeHtml(card.iconClass || "fas fa-star")}"></i></div>`;
    }

    function bindCarouselCardClicks(root) {
        root.querySelectorAll("[data-carousel-card-key]").forEach((node) => {
            const card = carouselCardMap.get(node.dataset.carouselCardKey);
            if (!card) return;
            node.addEventListener("click", () => handleCarouselCardClick(card));
            node.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCarouselCardClick(card);
                }
            });
        });
    }

    function handleCarouselCardClick(card, updateUrl = true) {
        if (!card) return;
        if (card.targetType === "course" && card.targetId) {
            openCourse(card.targetId);
            return;
        }
        if (card.targetType === "course_list" && card.courseIds.length) {
            selectedCourseIds = new Set(card.courseIds);
            selectedCourseTitle = card.title;
            activeTopic = "All";
            activePage = 1;
            query = "";
            const search = document.getElementById("courseSearch");
            if (search) search.value = "";
            setDetailVisible(false);
            updateNavState("courses");
            render();
            if (updateUrl) history.pushState({ view: "carousel", cardId: card.id }, "", `#carousel/${encodeURIComponent(card.id)}`);
            jumpToSection("courses");
            return;
        }
        if (card.targetType === "external" && card.href) {
            window.open(card.href, "_blank", "noopener");
        }
    }

    function renderTopics() {
        const counts = new Map();
        topics.forEach((topic) => counts.set(topic, 0));
        courses.forEach((course) => {
            counts.set("All", (counts.get("All") || 0) + 1);
            topics.forEach((topic) => {
                if (topic !== "All" && courseHasTopic(course, topic)) {
                    counts.set(topic, (counts.get(topic) || 0) + 1);
                }
            });
        });

        const topicList = document.getElementById("topicList");
        topicList.innerHTML = topics.map((topic) => `
            <button class="topic-button ${topic === activeTopic ? "is-active" : ""}" type="button" data-topic="${escapeHtml(topic)}">
                <span>${escapeHtml(topic)}</span>
                <small>${counts.get(topic) || 0}</small>
            </button>
        `).join("");

        document.getElementById("topicCount").textContent = topics.length.toString();
        renderCourseMegaMenu(counts);

        topicList.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", () => {
                showCatalog(button.dataset.topic || "All");
            });
        });
    }

    function courseHasTopic(course, topic) {
        return course && (course.topicFolder === topic || (Array.isArray(course.tags) && course.tags.includes(topic)));
    }

    function renderCourseMegaMenu(counts = new Map()) {
        const groupsMount = document.getElementById("courseMegaGroups");
        if (!groupsMount) return;
        const moduleTopics = topics
            .filter((topic) => topic && topic !== "All")
            .slice()
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        const grouped = moduleTopics.reduce((acc, topic) => {
            const letter = /^[a-z0-9]/i.test(topic.charAt(0)) ? topic.charAt(0).toUpperCase() : "#";
            if (!acc.has(letter)) acc.set(letter, []);
            acc.get(letter).push(topic);
            return acc;
        }, new Map());
        groupsMount.innerHTML = Array.from(grouped.entries()).map(([letter, items]) => `
            <section class="mega-topic-group">
                <span>${escapeHtml(letter)}</span>
                <ul>
                    ${items.map((topic) => `
                        <li><button type="button" data-mega-topic="${escapeHtml(topic)}">${escapeHtml(topic)}${counts.has(topic) ? ` <small>${counts.get(topic) || 0}</small>` : ""}</button></li>
                    `).join("")}
                </ul>
            </section>
        `).join("");
        bindCourseMegaMenu();
    }

    function bindCourseMegaMenu() {
        const menu = document.getElementById("courseMegaMenu");
        const trigger = document.querySelector("[data-course-menu-trigger]");
        if (!menu || !trigger) return;

        if (trigger.dataset.courseMenuBound !== "true") {
            trigger.dataset.courseMenuBound = "true";
            trigger.addEventListener("click", (event) => {
                event.preventDefault();
                toggleCourseMegaMenu();
            });
        }

        if (menu.dataset.courseMenuBound !== "true") {
            menu.dataset.courseMenuBound = "true";
        }

        menu.querySelectorAll("[data-mega-topic]").forEach((button) => {
            if (button.dataset.megaBound === "true") return;
            button.dataset.megaBound = "true";
            button.addEventListener("click", () => {
                const topic = button.dataset.megaTopic || "All";
                closeCourseMegaMenu();
                showCatalog(topic, true, "auto");
            });
        });

        if (document.documentElement.dataset.courseMenuGlobalBound !== "true") {
            document.documentElement.dataset.courseMenuGlobalBound = "true";
            document.addEventListener("click", (event) => {
                const activeMenu = document.getElementById("courseMegaMenu");
                const activeTrigger = document.querySelector("[data-course-menu-trigger]");
                if (!activeMenu || activeMenu.hidden) return;
                if (activeMenu.contains(event.target) || activeTrigger?.contains(event.target)) return;
                closeCourseMegaMenu();
            });
            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") closeCourseMegaMenu();
            });
            window.addEventListener("resize", setCourseMegaOffset);
        }
    }

    function toggleCourseMegaMenu() {
        const menu = document.getElementById("courseMegaMenu");
        if (!menu) return;
        if (menu.hidden || !menu.classList.contains("is-open")) openCourseMegaMenu();
        else closeCourseMegaMenu();
    }

    function openCourseMegaMenu() {
        const menu = document.getElementById("courseMegaMenu");
        const trigger = document.querySelector("[data-course-menu-trigger]");
        if (!menu || !trigger) return;
        setCourseMegaOffset();
        clearTimeout(courseMegaCloseTimer);
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add("is-open"));
        trigger.setAttribute("aria-expanded", "true");
    }

    function closeCourseMegaMenu() {
        const menu = document.getElementById("courseMegaMenu");
        const trigger = document.querySelector("[data-course-menu-trigger]");
        if (menu) {
            menu.classList.remove("is-open");
            clearTimeout(courseMegaCloseTimer);
            courseMegaCloseTimer = window.setTimeout(() => {
                if (!menu.classList.contains("is-open")) menu.hidden = true;
            }, 330);
        }
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    }

    function setCourseMegaOffset() {
        const topbar = document.querySelector(".topbar");
        if (!topbar) return;
        document.documentElement.style.setProperty("--topbar-offset", `${Math.ceil(topbar.getBoundingClientRect().height)}px`);
    }

    function renderActiveFilter(count) {
        const activeFilter = document.getElementById("activeFilter");
        const hasFilter = !!selectedCourseTitle || activeTopic !== "All" || query.trim().length > 0;

        if (!hasFilter) {
            activeFilter.hidden = true;
            activeFilter.textContent = "";
            return;
        }

        const parts = [];
        if (selectedCourseTitle) parts.push(selectedCourseTitle);
        if (query.trim()) parts.push(`"${query.trim()}"`);
        if (activeTopic !== "All") parts.push(activeTopic);
        activeFilter.hidden = false;
        activeFilter.textContent = `${count} result${count === 1 ? "" : "s"} for ${parts.join(" + ")}`;
    }

    function renderCourses(visibleCourses) {
        const grid = document.getElementById("courseGrid");

        if (!visibleCourses.length) {
            const message = catalogStatus === "loading"
                ? "Loading live courses..."
                : catalogStatus === "error"
                    ? "Live courses could not be loaded. Refresh to try again."
                    : "No courses found";
            grid.innerHTML = `<div class="empty-state">${message}</div>`;
            return;
        }

        grid.innerHTML = visibleCourses.map((course) => `
            <article class="course-card" role="button" tabindex="0" data-course-card-id="${escapeHtml(course.id)}" aria-label="Open ${escapeHtml(course.title)}">
                <div class="card-media" data-thumbnail="${course.thumbnail.type}" data-course-id="${escapeHtml(course.id)}">
                    <span class="course-label">COURSE</span>
                </div>
                <div class="card-body">
                    <div>
                        ${course.title ? `<h2 class="course-title">${escapeHtml(course.title)}</h2>` : ''}
                        <div class="course-meta">
                            <span>${escapeHtml(course.level)}</span>
                            <span>${escapeHtml(moduleCountLabel(course.labs))}</span>
                        </div>
                    </div>
                    <div class="course-card-footer">
                        <div class="tag-list">
                            ${course.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                        </div>
                        <button class="course-pin-icon" type="button" data-pin-course="${escapeHtml(course.id)}" aria-label="Pin ${escapeHtml(course.title)}">${pinIconSvg()}</button>
                    </div>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll("[data-pin-course]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const course = courseLookup.get(button.dataset.pinCourse);
                if (course) togglePinned(coursePinItem(course));
            });
        });

        grid.querySelectorAll("[data-course-card-id]").forEach((card) => {
            const courseId = card.dataset.courseCardId;
            card.addEventListener("click", () => openCourse(courseId));
            card.addEventListener("keydown", (event) => {
                if (event.target.closest("button")) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openCourse(courseId);
                }
            });
        });

        visibleCourses.forEach((course) => {
            const media = grid.querySelector(`[data-course-id="${cssEscape(course.id)}"]`);
            if (!media) return;

            applyCourseThumbnail(media, course);
        });
        hydrateLazyThumbnailFrames(grid);
        updatePinnedCounts();
    }

    function pinIconSvg() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4.5l4.5 4.5-3 3 .8 3.7-1.1 1.1-4.1-4.1-4.9 4.9-.8-.8 4.9-4.9-4.1-4.1 1.1-1.1 3.7.8 3-3z"></path><path d="M5 19l4-4"></path></svg>';
    }

    function pinnedButtonHtml(extraClass = "") {
        const className = extraClass ? `pinned-button ${extraClass}` : "pinned-button";
        return `<button class="${className}" type="button" data-open-pinned aria-label="Open pinned courses and modules">${pinIconSvg()}<span class="pinned-button-label">Pinned</span><span data-pinned-count>0</span></button>`;
    }

    function applyCourseThumbnail(media, course) {
        if (!media || !course || !course.thumbnail) return;

        if (course.thumbnail.type === "image") {
            const image = document.createElement("img");
            image.src = resolveAssetUrl(course.thumbnail.src);
            image.alt = course.thumbnail.alt || `${course.title} thumbnail`;
            image.loading = "lazy";
            image.decoding = "async";
            image.width = 640;
            image.height = 336;
            media.prepend(image);
            return;
        }

        if (course.thumbnail.type === "html") {
            const label = media.querySelector(".course-label");
            const sanitizedHtml = sanitizeHtmlSnippet(course.thumbnail.html);
            media.innerHTML = sanitizedHtml;
            if (label && !media.querySelector(".thumbnail-card")) media.appendChild(label);
            return;
        }

        if (course.thumbnail.type === "document") {
            media.innerHTML = "";
            media.appendChild(createThumbnailFrame(course.thumbnail.html, course.title));
        }
    }

    async function openCourse(courseId) {
        if (!courseId) return;
        const course = courseLookup.get(courseId) || courses.find((item) => item.id === courseId);
        if (!course) return;

        await hydrateCourseContent(course, true);

        renderCourseDetail(course);
        setDetailVisible(true);
        updateNavState("");
        history.pushState({ view: "course", courseId }, "", `#course/${encodeURIComponent(courseId)}`);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function pageUrlForHash(hash) {
        const url = new URL(window.location.href);
        url.pathname = url.pathname.replace(/[^/]*$/, "gradstudio-learn-demo.html");
        url.search = "";
        url.hash = hash;
        return url.toString();
    }

    function openCourseInNewTab(courseId) {
        if (!courseId) return;
        window.open(pageUrlForHash(`#course/${encodeURIComponent(courseId)}`), "_blank", "noopener");
    }

    function openLessonInNewTab(course, lessonIndex) {
        if (!course) return;
        const lessons = getCourseLessons(course);
        const safeIndex = Math.max(0, Math.min(Number(lessonIndex) || 0, lessons.length - 1));
        const lesson = lessons[safeIndex];
        if (!lesson) return;
        const frameSource = getLessonFrameSource(course, lesson, safeIndex);
        if (frameSource.type === "src") {
            window.open(frameSource.value, "_blank", "noopener");
            return;
        }
        window.open(pageUrlForHash(`#course/${encodeURIComponent(course.id)}/lesson/${safeIndex}`), "_blank", "noopener");
    }

    async function openLesson(courseId, lessonIndex = 0, replace = false) {
        const course = courseLookup.get(courseId) || courses.find((item) => item.id === courseId);
        if (!course) return;

        await hydrateCourseContent(course, true);

        const lessons = getCourseLessons(course);
        const safeIndex = Math.max(0, Math.min(Number(lessonIndex) || 0, lessons.length - 1));
        renderCoursePlayer(course, safeIndex);
        setPlayerVisible(true);
        updateNavState("");

        const url = `#course/${encodeURIComponent(courseId)}/lesson/${safeIndex}`;
        if (replace) history.replaceState({ view: "lesson", courseId, lessonIndex: safeIndex }, "", url);
        else history.pushState({ view: "lesson", courseId, lessonIndex: safeIndex }, "", url);

        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function createThumbnailFrame(html, title) {
        const frame = document.createElement("iframe");
        frame.className = "thumbnail-frame";
        frame.title = `${title || "Course"} thumbnail`;
        frame.loading = "lazy";
        frame.sandbox = "allow-scripts";
        frame.setAttribute("data-srcdoc", html);
        frame.setAttribute("aria-busy", "true");
        return frame;
    }

    function resolveAssetUrl(value) {
        const raw = String(value || "").trim();
        if (!raw) return "";
        if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
        if (raw.startsWith("//")) return `${window.location.protocol}${raw}`;
        if (raw.startsWith("/")) {
            const needsApiOrigin = window.location.protocol === "file:" ||
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1";
            return needsApiOrigin ? `${API_BASE}${raw}` : raw;
        }
        return raw;
    }

    async function handleRoute() {
        const route = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
        if (route.startsWith("carousel/")) {
            const [, cardId] = route.split("/");
            const card = Array.from(carouselCardMap.values()).find((item) => item.id === cardId);
            if (card) {
                handleCarouselCardClick(card, false);
                return;
            }
        }
        if (route.startsWith("course/")) {
            const [, courseId, routeType, routeIndex] = route.split("/");
            const course = courseLookup.get(courseId) || courses.find((item) => item.id === courseId);
            if (course) {
                await hydrateCourseContent(course, true);

                if (routeType === "lesson") {
                    const lessonIndex = Number(routeIndex) || 0;
                    renderCoursePlayer(course, lessonIndex);
                    setPlayerVisible(true);
                    updateNavState("");
                    window.scrollTo({ top: 0, behavior: "auto" });
                    return;
                }

                renderCourseDetail(course);
                setDetailVisible(true);
                updateNavState("");
                window.scrollTo({ top: 0, behavior: "auto" });
                return;
            }
        }

        if (route === "courses" || route.startsWith("courses/")) {
            const encodedTopic = route.startsWith("courses/") ? route.slice("courses/".length) : "";
            const topic = encodedTopic ? decodeURIComponent(encodedTopic) : "All";
            showCatalog(topic, false, "auto");
            return;
        }

        if (route === "home" || route === "") {
            showHome(false);
            return;
        }

        if (route === "get-started" || route === "signup" || route === "signin") {
            showAuthPage(route === "signin" ? "signin" : "signup", false, route);
            return;
        }

        if (route === "pinned") {
            showPinnedPage(false);
            return;
        }

        if (["about", "contact", "legal", "privacy", "terms", "cookies"].includes(route)) {
            showInfoPage(route, false);
            return;
        }

        setDetailVisible(false);
        updateNavState("home");
    }

    function setDetailVisible(isDetailVisible) {
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const infoPage = document.getElementById("infoPage");
        const authPage = document.getElementById("authPage");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (detail) detail.hidden = !isDetailVisible;
        if (player) player.hidden = true;
        setHomeContentHidden(isDetailVisible);
        if (infoPage) infoPage.hidden = true;
        if (authPage) authPage.hidden = true;
        if (footer) footer.hidden = isDetailVisible;
        if (topbar) topbar.hidden = false;
        document.body.classList.toggle("is-course-player", false);
        setAboutPageActive(false);
    }

    function setPlayerVisible(isPlayerVisible) {
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const infoPage = document.getElementById("infoPage");
        const authPage = document.getElementById("authPage");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (detail) detail.hidden = true;
        if (player) player.hidden = !isPlayerVisible;
        setHomeContentHidden(isPlayerVisible);
        if (infoPage) infoPage.hidden = true;
        if (authPage) authPage.hidden = true;
        if (footer) footer.hidden = isPlayerVisible;
        if (topbar) topbar.hidden = isPlayerVisible;
        document.body.classList.toggle("is-course-player", isPlayerVisible);
        setAboutPageActive(false);
    }

    function renderCourseDetail(course) {
        const detail = document.getElementById("courseDetail");
        if (!detail) return;

        const lessons = getCourseLessons(course);
        const primaryTopic = course.topicFolder || course.tags[0] || "Course";
        const sections = getCourseSections(course, lessons);
        const hasLessons = lessons.length > 0;

        detail.innerHTML = `
            <nav class="course-breadcrumb" aria-label="Breadcrumb">
                <a href="#courses" data-breadcrumb-learn>Learn</a>
                <span aria-hidden="true">&gt;</span>
                <button type="button" data-topic-link="${escapeHtml(primaryTopic)}">${escapeHtml(primaryTopic)}</button>
                <span aria-hidden="true">&gt;</span>
                <strong>${escapeHtml(course.title)}</strong>
            </nav>

            <section class="course-detail-layout" aria-labelledby="courseDetailTitle">
                <article class="course-overview-card">
                    <p class="course-kicker">Course in <span>${escapeHtml(primaryTopic)} Skill Tree</span></p>
                    <h1 id="courseDetailTitle">${escapeHtml(course.title)}</h1>
                    <div class="course-level-line">
                        <span class="level-bars" aria-hidden="true"><i></i><i></i><i></i></span>
                        <strong>${escapeHtml(course.level || "Beginner")}</strong>
                    </div>
                    <p class="course-description">${escapeHtml(getCourseDescription(course, lessons.length))}</p>
                    <div class="tag-list course-detail-tags">
                        ${course.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                    <button class="pin-chip" type="button" data-pin-course="${escapeHtml(course.id)}">Pin course</button>
                    ${hasLessons
                        ? `<button class="start-learning-button" type="button" data-start-learning>Start Learning</button>`
                        : `<button class="start-learning-button is-disabled" type="button" disabled>No modules published</button>`}
                </article>

                <section class="course-contents-card" id="courseLessons" aria-labelledby="courseContentsTitle">
                    <div class="course-contents-head">
                        <div>
                            <span class="eyebrow">Contents</span>
                            <h2 id="courseContentsTitle">Modules</h2>
                        </div>
                        <div class="course-contents-actions">
                            ${pinnedButtonHtml()}
                            <span>${lessons.length} module${lessons.length === 1 ? "" : "s"}</span>
                        </div>
                    </div>
                    <div class="lesson-list detail-section-list">
                        ${sections.length
                            ? sections.map((section, sectionIndex) => renderDetailSection(section, sectionIndex, course.id)).join("")
                            : `<div class="empty-state course-empty-state">No published modules found for this course.</div>`}
                    </div>
                </section>
            </section>
        `;

        const startLearning = detail.querySelector("[data-start-learning]");
        if (startLearning) {
            startLearning.addEventListener("click", () => {
                openLesson(course.id, 0);
            });
        }

        detail.querySelectorAll("[data-pin-course]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                togglePinned(coursePinItem(course));
            });
        });

        detail.querySelectorAll("[data-pin-topic]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const lessonIndex = Number(button.dataset.pinTopic) || 0;
                const lesson = lessons[lessonIndex];
                if (lesson) togglePinned(topicPinItem(course, lesson, lessonIndex));
            });
        });

        detail.querySelectorAll("[data-open-lesson-tab]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                openLessonInNewTab(course, button.dataset.openLessonTab);
            });
        });

        detail.querySelectorAll("[data-lesson-index]").forEach((row) => {
            row.addEventListener("click", () => openLesson(course.id, row.dataset.lessonIndex));
            row.addEventListener("keydown", (event) => {
                if (event.target.closest("button")) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openLesson(course.id, row.dataset.lessonIndex);
                }
            });
        });

        detail.querySelectorAll("[data-detail-section]").forEach((button) => {
            button.addEventListener("click", () => {
                const isExpanded = button.getAttribute("aria-expanded") === "true";
                const sectionBody = document.getElementById(button.getAttribute("aria-controls"));
                button.setAttribute("aria-expanded", String(!isExpanded));
                if (sectionBody) sectionBody.hidden = isExpanded;
            });
        });

        const topicLink = detail.querySelector("[data-topic-link]");
        if (topicLink) {
            topicLink.addEventListener("click", () => {
                showCatalog(primaryTopic);
            });
        }

        const learnLink = detail.querySelector("[data-breadcrumb-learn]");
        if (learnLink) {
            learnLink.addEventListener("click", (event) => {
                event.preventDefault();
                showCatalog("All");
            });
        }

        bindPinnedOpenButtons(detail);
        updatePinnedCounts();
    }

    function renderDetailSection(section, sectionIndex, courseId) {
        const isExpanded = sectionIndex === 0;
        return `
            <section class="detail-section">
                <button
                    class="detail-section-toggle"
                    type="button"
                    aria-expanded="${isExpanded}"
                    aria-controls="detail-section-${sectionIndex}"
                    data-detail-section="${sectionIndex}"
                >
                    <span>${escapeHtml(section.title)}</span>
                    <small>${section.items.length} module${section.items.length === 1 ? "" : "s"}</small>
                    <span class="detail-section-chevron" aria-hidden="true">v</span>
                </button>
                <div class="detail-section-body" id="detail-section-${sectionIndex}" ${isExpanded ? "" : "hidden"}>
                    ${section.items.map((item) => renderLessonRow(item.lesson, item.index, courseId)).join("")}
                </div>
            </section>
        `;
    }

    function renderLessonRow(lesson, index, courseId) {
        const title = cleanLessonTitle(lesson.title);
        return `
            <article class="lesson-row" role="button" tabindex="0" data-lesson-index="${index}" aria-label="Open ${escapeHtml(title)}">
                <span class="lesson-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 7h10"></path>
                        <path d="M7 12h10"></path>
                        <path d="M7 17h6"></path>
                    </svg>
                </span>
                <h3>${escapeHtml(title)}</h3>
                <div class="lesson-row-actions">
                    <button class="pin-chip" type="button" data-pin-course-id="${escapeHtml(courseId)}" data-pin-topic="${index}" aria-label="Pin ${escapeHtml(title)}">Pin</button>
                    <button class="open-tab-button" type="button" data-open-lesson-tab="${index}" aria-label="Open ${escapeHtml(title)} in new tab">Open tab</button>
                </div>
            </article>
        `;
    }

    function cleanLessonTitle(value) {
        return String(value || "")
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getPlayerLessonLabel(lesson, index) {
        const title = cleanLessonTitle(lesson.title).replace(/^\d+\s*[\).:-]\s*/, "");
        return `${index + 1}. ${title || `Module ${index + 1}`}`;
    }

    function renderCoursePlayer(course, lessonIndex = 0) {
        const player = document.getElementById("coursePlayer");
        if (!player) return;

        const lessons = getCourseLessons(course);
        if (!lessons.length) {
            player.innerHTML = `
                <div class="course-player-layout">
                    <section class="player-main" aria-label="Lesson viewer">
                        <header class="player-toolbar">
                            <a class="player-back-link" href="#course/${encodeURIComponent(course.id)}">Back to course</a>
                            <h1>${escapeHtml(course.title)}</h1>
                            <span></span>
                        </header>
                        <div class="empty-state course-empty-state">No published modules found for this course.</div>
                    </section>
                </div>
            `;
            return;
        }

        const safeIndex = Math.max(0, Math.min(Number(lessonIndex) || 0, lessons.length - 1));
        const selectedLesson = lessons[safeIndex];
        const sections = getCourseSections(course, lessons);
        const activeSectionIndex = Math.max(0, sections.findIndex((section) => section.items.some((item) => item.index === safeIndex)));
        const frameTitle = `${course.title}: ${selectedLesson.title}`;
        const frameSource = getLessonFrameSource(course, selectedLesson, safeIndex);

        player.innerHTML = `
            <div class="course-player-layout">
                <aside class="player-sidebar" aria-label="Course contents">
                    <a class="player-course-title" href="#course/${encodeURIComponent(course.id)}">
                        <span class="player-course-mark" aria-hidden="true"></span>
                        <strong>${escapeHtml(course.title)}</strong>
                    </a>

                    <div class="player-search-row">
                        <label class="player-search">
                            <span class="sr-only">Search course contents</span>
                            <input type="search" placeholder="Search lessons..." data-player-search>
                        </label>
                        ${pinnedButtonHtml("player-pinned-button")}
                    </div>

                    <div class="player-sections">
                        ${sections.map((section, sectionIndex) => {
                            const isExpanded = sectionIndex === activeSectionIndex;
                            return `
                            <section class="player-section">
                                <button
                                    class="player-section-title"
                                    type="button"
                                    aria-expanded="${isExpanded}"
                                    aria-controls="player-section-${sectionIndex}"
                                    data-player-section="${sectionIndex}"
                                >
                                    <span>${escapeHtml(section.title)}</span>
                                    <span class="player-section-chevron" aria-hidden="true">v</span>
                                </button>
                                <nav class="player-lesson-nav" id="player-section-${sectionIndex}" ${isExpanded ? "" : "hidden"}>
                                    ${section.items.map((item) => `
                                        <button class="player-lesson-link ${item.index === safeIndex ? "is-active" : ""}" type="button" data-player-lesson="${item.index}">
                                            <span>${escapeHtml(getPlayerLessonLabel(item.lesson, item.index))}</span>
                                        </button>
                                    `).join("")}
                                </nav>
                            </section>
                        `; }).join("")}
                    </div>
                </aside>

                <section class="player-main" aria-label="Lesson viewer">
                    <header class="player-toolbar">
                        <a class="player-back-link" href="#course/${encodeURIComponent(course.id)}">Back to course</a>
                        <h1>${escapeHtml(selectedLesson.title)}</h1>
                        <div class="player-toolbar-actions">
                            <button class="player-pill" type="button" data-pin-course-id="${escapeHtml(course.id)}" data-pin-topic="${safeIndex}">
                                Pin module
                            </button>
                            <button class="player-pill" type="button" data-open-current-tab>
                                Open in new tab
                            </button>
                            <button class="player-pill" type="button" data-fullscreen>
                                Fullscreen
                            </button>
                        </div>
                    </header>

                    <div class="player-frame-shell">
                        <iframe
                            class="lesson-frame"
                            title="${escapeHtml(frameTitle)}"
                            sandbox="allow-scripts allow-forms allow-same-origin"
                            ${frameSource.type === "src" ? `src="${escapeHtml(frameSource.value)}"` : `srcdoc="${escapeHtml(frameSource.value)}"`}
                        ></iframe>
                    </div>
                </section>
            </div>
        `;

        player.querySelectorAll("[data-player-lesson]").forEach((button) => {
            button.addEventListener("click", () => openLesson(course.id, button.dataset.playerLesson));
        });

        player.querySelectorAll("[data-player-section]").forEach((button) => {
            button.addEventListener("click", () => {
                const isExpanded = button.getAttribute("aria-expanded") === "true";
                const sectionNav = document.getElementById(button.getAttribute("aria-controls"));
                button.setAttribute("aria-expanded", String(!isExpanded));
                if (sectionNav) sectionNav.hidden = isExpanded;
            });
        });

        const searchInput = player.querySelector("[data-player-search]");
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                const term = searchInput.value.trim().toLowerCase();
                player.querySelectorAll(".player-section").forEach((section) => {
                    const toggle = section.querySelector("[data-player-section]");
                    const sectionNav = section.querySelector(".player-lesson-nav");
                    let hasMatch = false;

                    section.querySelectorAll("[data-player-lesson]").forEach((button) => {
                        const isMatch = !term || button.textContent.toLowerCase().includes(term);
                        button.hidden = !!term && !isMatch;
                        if (isMatch) hasMatch = true;
                    });

                    section.hidden = !!term && !hasMatch;
                    if (!toggle || !sectionNav) return;

                    if (term) {
                        toggle.setAttribute("aria-expanded", String(hasMatch));
                        sectionNav.hidden = !hasMatch;
                    } else {
                        const sectionIndex = Number(toggle.dataset.playerSection);
                        const isCurrentSection = sectionIndex === activeSectionIndex;
                        toggle.setAttribute("aria-expanded", String(isCurrentSection));
                        sectionNav.hidden = !isCurrentSection;
                    }
                });
            });
        }

        player.querySelectorAll("[data-pin-topic]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                togglePinned(topicPinItem(course, selectedLesson, safeIndex));
            });
        });

        const openCurrent = player.querySelector("[data-open-current-tab]");
        if (openCurrent) {
            openCurrent.addEventListener("click", () => openLessonInNewTab(course, safeIndex));
        }

        const fullscreen = player.querySelector("[data-fullscreen]");
        if (fullscreen) {
            fullscreen.addEventListener("click", () => {
                const frameShell = player.querySelector(".player-frame-shell");
                if (frameShell && frameShell.requestFullscreen) frameShell.requestFullscreen();
            });
        }

        bindPinnedOpenButtons(player);
        updatePinnedCounts();
        requestAnimationFrame(() => {
            fitMobileLessonFrame(player);
            const activeLesson = player.querySelector(".player-lesson-link.is-active");
            if (activeLesson) activeLesson.scrollIntoView({ block: "nearest", inline: "nearest" });
        });
    }

    function fitMobileLessonFrame(root = document) {
        const playerShell = document.getElementById("coursePlayer");
        const frameShell = root.querySelector?.(".player-frame-shell") || document.querySelector(".player-frame-shell");
        const frame = frameShell?.querySelector(".lesson-frame");

        if (!window.matchMedia("(max-width: 820px)").matches) {
            if (playerShell) {
                playerShell.style.removeProperty("--mobile-player-width");
                playerShell.style.removeProperty("--mobile-player-height");
                playerShell.style.removeProperty("--mobile-player-scale");
            }
            if (frameShell) {
                frameShell.style.removeProperty("--lesson-frame-width");
                frameShell.style.removeProperty("--lesson-frame-height");
                frameShell.style.removeProperty("--lesson-frame-scale");
            }
            return;
        }

        if (!playerShell || !frame) return;

        const targetWidth = 945;
        const viewportWidth = Math.max(1, window.visualViewport?.width || window.innerWidth || playerShell.clientWidth);
        const viewportHeight = Math.max(1, window.visualViewport?.height || window.innerHeight || playerShell.clientHeight);
        const scale = Math.min(1, viewportWidth / targetWidth);

        playerShell.style.setProperty("--mobile-player-width", `${targetWidth}px`);
        playerShell.style.setProperty("--mobile-player-height", `${Math.ceil(viewportHeight / scale)}px`);
        playerShell.style.setProperty("--mobile-player-scale", scale.toFixed(4));
    }

    function getCourseSections(course, lessons) {
        if (!Array.isArray(lessons) || !lessons.length) return [];

        /* Prefer API sections when available */
        if (Array.isArray(course._apiSections) && course._apiSections.length) {
            const sections = course._apiSections.map((section, sectionIndex) => {
                const title = String(section.title || section.name || `Section ${sectionIndex + 1}`);
                const indexes = Array.isArray(section.lessonIndexes) ? section.lessonIndexes : [];
                const items = indexes
                    .map((index) => Number(index))
                    .filter((index) => Number.isInteger(index) && lessons[index])
                    .map((index) => ({ index, lesson: lessons[index] }));

                return { title: `${sectionIndex + 1}: ${title}`, items };
            }).filter((section) => section.items.length);

            if (sections.length) return sections;
        }

        if (Array.isArray(course.sections) && course.sections.length) {
            const sections = course.sections.map((section, sectionIndex) => {
                const title = String(section.title || section.name || `Section ${sectionIndex + 1}`);
                const indexes = Array.isArray(section.lessonIndexes) ? section.lessonIndexes : [];
                const items = indexes
                    .map((index) => Number(index))
                    .filter((index) => Number.isInteger(index) && lessons[index])
                    .map((index) => ({ index, lesson: lessons[index] }));

                return { title: `${sectionIndex + 1}: ${title}`, items };
            }).filter((section) => section.items.length);

            if (sections.length) return sections;
        }

        const sectionTitle = course.topicFolder || course.tags[0] || "Course contents";
        return [{
            title: `1: ${sectionTitle}`,
            items: lessons.map((lesson, index) => ({ lesson, index }))
        }];
    }

    function getLessonFrameSource(course, lesson, index) {
        if (lesson && lesson.src) {
            return { type: "src", value: String(lesson.src) };
        }

        const html = lesson?.html || lesson?.contentHtml || lesson?.srcdoc || buildLessonPlaceholderHtml(course, lesson, index);
        return { type: "srcdoc", value: String(html) };
    }

    function buildLessonPlaceholderHtml(course, lesson, index) {
        const title = escapeHtml(lesson?.title || `Lesson ${index + 1}`);
        const courseTitle = escapeHtml(course.title || "Course");
        const type = escapeHtml(lesson?.type === "challenge" ? "Challenge" : "Lab");
        return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #f5f7fb;
      color: #171f32;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      max-width: 980px;
      margin: 0 auto;
      padding: 56px 48px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      background: #e9eefc;
      color: #4f6ee8;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .05em;
      text-transform: uppercase;
    }
    h1 {
      margin: 22px 0 12px;
      font-size: clamp(38px, 6vw, 64px);
      line-height: 1.02;
      letter-spacing: 0;
    }
    p {
      max-width: 760px;
      margin: 0;
      color: #526078;
      font-size: 20px;
      line-height: 1.6;
    }
    .panel {
      margin-top: 34px;
      padding: 26px;
      border: 1px solid #dde4f0;
      border-radius: 12px;
      background: #ffffff;
    }
    .panel h2 {
      margin: 0 0 12px;
      font-size: 24px;
    }
    .panel code {
      display: block;
      margin-top: 14px;
      padding: 18px;
      border-radius: 10px;
      background: #111827;
      color: #d7fbe8;
      font-size: 16px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <main>
    <span class="badge">${type} ${index + 1}</span>
    <h1>${title}</h1>
    <p>This iframe is ready to load the HTML lesson content for ${courseTitle}. Replace this generated placeholder with saved lesson HTML when your admin editor stores lesson pages.</p>
    <section class="panel">
      <h2>Lesson HTML Area</h2>
      <p>The selected content opens here without leaving the course player.</p>
      <code>$ lesson: ${title}
$ course: ${courseTitle}
$ status: loaded in iframe</code>
    </section>
  </main>
</body>
</html>`;
    }

    function getCourseLessons(course) {
        /* Prefer live API lessons when available */
        if (Array.isArray(course._apiLessons) && course._apiLessons.length) {
            return course._apiLessons.map((lesson, index) => ({
                ...lesson,
                title: String(lesson.title || `Module ${index + 1}`),
                type: lesson.type === "challenge" ? "challenge" : "lab"
            }));
        }

        if (Array.isArray(course.lessons) && course.lessons.length) {
            return course.lessons.map((lesson, index) => ({
                ...lesson,
                title: String(lesson.title || `Module ${index + 1}`),
                type: lesson.type === "challenge" ? "challenge" : "lab"
            }));
        }

        if (course.fromApi) return [];

        const id = String(course.id || "").toLowerCase();

        const lessonSets = {
            aws: [
                { title: "Principles of Cloud Computing", type: "lab" },
                { title: "Cloud Service Delivery Models", type: "challenge" },
                { title: "Cloud Deployment Models", type: "lab" },
                { title: "AWS Global Infrastructure", type: "challenge" },
                { title: "AWS Resource Management", type: "lab" },
                { title: "AWS Pricing and Support", type: "challenge" },
                { title: "Compute with EC2", type: "lab" },
                { title: "S3 Storage Fundamentals", type: "challenge" },
                { title: "Identity and Access Management", type: "lab" },
                { title: "VPC Networking Basics", type: "challenge" },
                { title: "Elastic Load Balancing", type: "lab" },
                { title: "CloudFormation Templates", type: "challenge" },
                { title: "RDS and DynamoDB", type: "lab" },
                { title: "Final AWS Assessment", type: "challenge" }
            ],
            ai: [
                { title: "Introduction to AI", type: "lab" },
                { title: "AI vs ML vs Deep Learning", type: "challenge" },
                { title: "Neural Network Basics", type: "lab" },
                { title: "Natural Language Processing", type: "challenge" },
                { title: "Computer Vision Fundamentals", type: "lab" },
                { title: "AI Ethics and Bias", type: "challenge" },
                { title: "Prompt Engineering", type: "lab" },
                { title: "AI in Production", type: "challenge" },
                { title: "Final AI Challenge", type: "challenge" }
            ],
            ml2: [
                { title: "What is Machine Learning?", type: "lab" },
                { title: "Supervised vs Unsupervised", type: "challenge" },
                { title: "Linear Regression Lab", type: "lab" },
                { title: "Classification with Logistic Regression", type: "challenge" },
                { title: "Decision Trees and Random Forests", type: "lab" },
                { title: "Model Evaluation Metrics", type: "challenge" },
                { title: "Feature Engineering", type: "lab" },
                { title: "Cross-Validation Techniques", type: "challenge" },
                { title: "K-Means Clustering", type: "lab" },
                { title: "Neural Network Foundations", type: "challenge" },
                { title: "Hyperparameter Tuning", type: "lab" },
                { title: "Final ML Challenge", type: "challenge" }
            ],
            python1: [
                { title: "Python Syntax and Variables", type: "lab" },
                { title: "Data Types and Operators", type: "challenge" },
                { title: "Control Flow Statements", type: "lab" },
                { title: "Functions and Scope", type: "challenge" },
                { title: "Lists, Tuples, and Sets", type: "lab" },
                { title: "Dictionaries Deep Dive", type: "challenge" },
                { title: "String Manipulation", type: "lab" },
                { title: "File I/O Operations", type: "challenge" },
                { title: "Error Handling", type: "lab" },
                { title: "Object-Oriented Programming", type: "challenge" },
                { title: "Modules and Packages", type: "lab" },
                { title: "List Comprehensions", type: "challenge" },
                { title: "Lambda and Higher-Order Functions", type: "lab" },
                { title: "Decorators and Generators", type: "challenge" },
                { title: "Final Python Challenge", type: "challenge" }
            ],
            linux: [
                { title: "Your First Linux Lab", type: "lab" },
                { title: "Display User and Group Information", type: "challenge" },
                { title: "Basic Files Operations", type: "lab" },
                { title: "Files and Directories", type: "challenge" },
                { title: "File Contents and Comparing", type: "lab" },
                { title: "The Manuscript Mystery", type: "challenge" },
                { title: "Permissions of Files", type: "lab" },
                { title: "Change File Ownership", type: "challenge" },
                { title: "User Account Management", type: "lab" },
                { title: "Process Management", type: "challenge" },
                { title: "Package Management", type: "lab" },
                { title: "Networking Basics", type: "challenge" },
                { title: "Shell Scripting Intro", type: "lab" },
                { title: "Cron Jobs and Scheduling", type: "challenge" },
                { title: "System Monitoring", type: "lab" },
                { title: "Disk and Storage Management", type: "challenge" },
                { title: "SSH and Remote Access", type: "lab" },
                { title: "The Joker's Trick", type: "challenge" }
            ],
            sql1: [
                { title: "Introduction to Databases", type: "lab" },
                { title: "Creating Tables and Schemas", type: "challenge" },
                { title: "SELECT Queries", type: "lab" },
                { title: "WHERE and Filtering", type: "challenge" },
                { title: "JOINs Explained", type: "lab" },
                { title: "GROUP BY and Aggregation", type: "challenge" },
                { title: "Subqueries and CTEs", type: "lab" },
                { title: "INSERT, UPDATE, DELETE", type: "challenge" },
                { title: "Indexes and Performance", type: "lab" },
                { title: "Views and Stored Procedures", type: "challenge" },
                { title: "Transactions and ACID", type: "lab" },
                { title: "Normalization Principles", type: "challenge" },
                { title: "Advanced Query Patterns", type: "lab" },
                { title: "Data Relationships Deep Dive", type: "challenge" },
                { title: "Database Administration Basics", type: "lab" },
                { title: "Final SQL Challenge", type: "challenge" }
            ],
            backend1: [
                { title: "How the Web Works", type: "lab" },
                { title: "HTTP Methods and Status Codes", type: "challenge" },
                { title: "RESTful API Design", type: "lab" },
                { title: "Express.js Fundamentals", type: "challenge" },
                { title: "Middleware and Routing", type: "lab" },
                { title: "Database Integration", type: "challenge" },
                { title: "Authentication and Authorization", type: "lab" },
                { title: "Error Handling Strategies", type: "challenge" },
                { title: "API Testing with Postman", type: "lab" },
                { title: "Deployment and DevOps", type: "challenge" },
                { title: "Final Backend Challenge", type: "challenge" }
            ],
            java1: [
                { title: "Java Development Environment", type: "lab" },
                { title: "Variables and Data Types", type: "challenge" },
                { title: "Control Flow in Java", type: "lab" },
                { title: "Methods and Parameters", type: "challenge" },
                { title: "Arrays and Collections", type: "lab" },
                { title: "Object-Oriented Programming", type: "challenge" },
                { title: "Inheritance and Polymorphism", type: "lab" },
                { title: "Abstract Classes and Interfaces", type: "challenge" },
                { title: "Exception Handling", type: "lab" },
                { title: "File I/O in Java", type: "challenge" },
                { title: "Generics and Type Safety", type: "lab" },
                { title: "Lambda Expressions", type: "challenge" },
                { title: "Streams API", type: "lab" },
                { title: "Concurrency Basics", type: "challenge" },
                { title: "Design Patterns", type: "lab" },
                { title: "Build Tools and Maven", type: "challenge" },
                { title: "Final Java Challenge", type: "challenge" }
            ]
        };

        if (lessonSets[id]) return lessonSets[id];

        const lowerTitle = String(course.title || "").toLowerCase();
        const tags = (course.tags || []).map((tag) => String(tag).toLowerCase());
        if (lowerTitle.includes("linux") || tags.includes("linux")) {
            return lessonSets.linux;
        }

        const subject = course.tags[0] || course.title || "Course";
        return [
            { title: `Start with ${subject}`, type: "lab" },
            { title: `${subject} Fundamentals`, type: "challenge" },
            { title: `Build a ${subject} Workflow`, type: "lab" },
            { title: `Debug ${subject} Issues`, type: "challenge" },
            { title: `${subject} Practice Lab`, type: "lab" },
            { title: `Final ${subject} Challenge`, type: "challenge" }
        ];
    }

    function getCourseDescription(course, moduleCount) {
        if (course.description) return course.description;

        const descriptions = {
            aws: "Learn core cloud concepts including compute, storage, identity, and networking on Amazon Web Services.",
            ai: "Gain insight into artificial intelligence concepts, terminology, and applications across modern industries.",
            ml2: "Study machine learning fundamentals, model types, and learning paradigms from supervised to unsupervised approaches.",
            python1: "Understand Python syntax, data types, control flow, and programming logic from the ground up.",
            linux: "Explore Linux commands, file systems, processes, and permission models through guided terminal exercises.",
            sql1: "Grasp relational database concepts, queries, schemas, and data relationships with practical SQL exercises.",
            backend1: "Learn how backend systems function including APIs, middleware, authentication, and server-side architecture.",
            java1: "Master Java fundamentals, OOP, and core language features through guided coding exercises."
        };

        const id = String(course.id || "").toLowerCase();
        if (descriptions[id]) return descriptions[id];

        if (!moduleCount) return "No published modules are available for this course yet.";
        if (course.fromApi) return "Published modules below are loaded from the GradStudio course library.";

        const topic = course.topicFolder || course.tags[0] || "this topic";
        return `This course introduces ${topic} through focused modules and challenges. Complete ${moduleCount} modules to practice the core tasks and build confidence with real workflows.`;
    }

    function renderPager(totalPages) {
        const pager = document.getElementById("pager");
        if (totalPages <= 1) {
            pager.innerHTML = "";
            return;
        }

        const windowSize = 3;
        const halfWindow = Math.floor(windowSize / 2);
        const startPage = Math.max(1, Math.min(activePage - halfWindow, totalPages - windowSize + 1));
        const endPage = Math.min(totalPages, startPage + windowSize - 1);
        const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
        pager.innerHTML = `
            <button type="button" data-page="prev" ${activePage === 1 ? "disabled" : ""}>Prev</button>
            ${pages.map((page) => `<button type="button" data-page="${page}" class="${page === activePage ? "is-active" : ""}">${page}</button>`).join("")}
            <button type="button" data-page="next" ${activePage === totalPages ? "disabled" : ""}>Next</button>
            <button type="button" data-page="last" ${activePage === totalPages ? "disabled" : ""}>Last</button>
        `;

        pager.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.page;
                if (target === "prev") activePage -= 1;
                else if (target === "next") activePage += 1;
                else if (target === "last") activePage = totalPages;
                else activePage = Number(target);
                render();
                jumpToSection("courses");
            });
        });
    }

    function getFilteredCourses() {
        const normalizedQuery = query.trim().toLowerCase();
        const baseCourses = selectedCourseIds
            ? Array.from(selectedCourseIds).map((id) => courseLookup.get(id)).filter(Boolean)
            : courses;
        const filtered = baseCourses.filter((course) => {
            const topicMatch = activeTopic === "All" || courseHasTopic(course, activeTopic);
            const searchText = `${course.title} ${course.topicFolder || ""} ${course.tags.join(" ")} ${course.level}`.toLowerCase();
            const queryMatch = !normalizedQuery || searchText.includes(normalizedQuery);
            return topicMatch && queryMatch;
        });
        return !selectedCourseIds && activeTopic === "All" ? sortAllCourses(filtered) : filtered;
    }

    function sortAllCourses(courseList) {
        return courseList.slice().sort((a, b) => {
            const allA = Number.isFinite(a.allOrder) ? a.allOrder : Number.POSITIVE_INFINITY;
            const allB = Number.isFinite(b.allOrder) ? b.allOrder : Number.POSITIVE_INFINITY;
            if (allA !== allB) return allA - allB;
            const displayA = Number.isFinite(Number(a.displayOrder)) ? Number(a.displayOrder) : Number.POSITIVE_INFINITY;
            const displayB = Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : Number.POSITIVE_INFINITY;
            if (displayA !== displayB) return displayA - displayB;
            return String(a.title || "").localeCompare(String(b.title || ""));
        });
    }

    function sanitizeHtmlSnippet(html) {
        const allowedTags = new Set(["DIV", "SPAN", "H1", "H2", "H3", "P", "STRONG", "B", "BR", "IMG"]);
        const allowedAttrs = new Set(["class", "aria-hidden", "src", "alt", "draggable"]);
        const allowedStyleVars = new Set([
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
        const template = document.createElement("template");
        template.innerHTML = html;

        function scrub(parent) {
            Array.from(parent.children).forEach((child) => {
                if (!allowedTags.has(child.tagName)) {
                    child.replaceWith(...Array.from(child.childNodes));
                    return;
                }

                Array.from(child.attributes).forEach((attr) => {
                    const attrName = attr.name.toLowerCase();
                    if (attrName === "style") {
                        const safeStyle = sanitizeThumbnailStyle(attr.value);
                        if (safeStyle && child.classList.contains("thumbnail-card")) {
                            child.setAttribute("style", safeStyle);
                        } else {
                            child.removeAttribute(attr.name);
                        }
                        return;
                    }

                    const allowed = allowedAttrs.has(attrName);
                    const safeClass = attr.name !== "class" || /^[a-zA-Z0-9_\-\s]+$/.test(attr.value);
                    if (!allowed || !safeClass) child.removeAttribute(attr.name);
                });

                scrub(child);
            });
        }

        scrub(template.content);
        return template.innerHTML;

        function sanitizeThumbnailStyle(style) {
            const declarations = String(style || "")
                .split(";")
                .map((part) => part.trim())
                .filter(Boolean);

            const safeDeclarations = [];
            declarations.forEach((declaration) => {
                const separatorIndex = declaration.indexOf(":");
                if (separatorIndex === -1) return;

                const property = declaration.slice(0, separatorIndex).trim();
                const value = declaration.slice(separatorIndex + 1).trim();
                if (!allowedStyleVars.has(property)) return;
                if (!isSafeCssValue(value)) return;

                safeDeclarations.push(`${property}: ${value}`);
            });

            return safeDeclarations.length ? `${safeDeclarations.join("; ")};` : "";
        }

        function isSafeCssValue(value) {
            const normalized = String(value || "").trim().toLowerCase();
            if (!normalized) return false;
            if (normalized.includes("url") || normalized.includes("expression") || normalized.includes("@import")) return false;
            return /^[#(),.%\sa-z0-9-]+$/i.test(value);
        }
    }

    function shouldRenderHtmlThumbnailFrame(html) {
        const value = String(html || "");
        return isFullHtmlDocument(value) || /<(script|style|link|canvas|svg|video|iframe|object|embed)\b/i.test(value);
    }

    function renderHtmlThumbnailFrame(html, title, size = "featured") {
        const srcdoc = isFullHtmlDocument(html)
            ? fitFullHtmlThumbnailDocument(html, size)
            : buildHtmlThumbnailDocument(html);
        return `<iframe class="carousel-html-frame" title="${escapeHtml(title || "Carousel")} thumbnail" data-srcdoc="${escapeHtml(srcdoc)}" loading="lazy" sandbox="allow-scripts" aria-busy="true"></iframe>`;
    }

    function fitFullHtmlThumbnailDocument(html, size = "featured") {
        if (size === "hero") return String(html || "");
        const fitStyle = `<style id="gradstudio-carousel-fit">
html,body{width:100%!important;height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important;}
body{display:block!important;}
body > *:not(script):not(style):not(link){max-width:none!important;max-height:none!important;}
.scene,.thumbnail-card,.card-wrapper,.card{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;margin:0!important;transform:none!important;border-radius:0!important;border:0!important;box-shadow:none!important;}
.scene{display:block!important;overflow:hidden!important;perspective:none!important;}
.scene:hover .card-wrapper{transform:none!important;}
.card{overflow:hidden!important;}
svg,canvas,video,img{max-width:none;}
</style>`;
        const value = String(html || "");
        if (/<\/head>/i.test(value)) return value.replace(/<\/head>/i, `${fitStyle}</head>`);
        if (/<body[^>]*>/i.test(value)) return value.replace(/<body([^>]*)>/i, `<body$1>${fitStyle}`);
        return `${fitStyle}${value}`;
    }

    function hydrateLazyThumbnailFrames(root = document) {
        const frames = Array.from(root.querySelectorAll("iframe[data-srcdoc]"));
        if (!frames.length) return;

        if (!("IntersectionObserver" in window)) {
            frames.forEach(hydrateThumbnailFrame);
            return;
        }

        if (!lazyThumbnailObserver) {
            lazyThumbnailObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) hydrateThumbnailFrame(entry.target);
                });
            }, { root: null, rootMargin: "900px 0px", threshold: 0.01 });
        }

        frames.forEach((frame) => {
            if (frame.dataset.hydrated === "true") return;
            lazyThumbnailObserver.observe(frame);
        });
    }

    function hydrateThumbnailFrame(frame) {
        const html = frame.getAttribute("data-srcdoc");
        if (!html) return;
        frame.srcdoc = html;
        frame.removeAttribute("data-srcdoc");
        frame.removeAttribute("aria-busy");
        frame.dataset.hydrated = "true";
        if (lazyThumbnailObserver) lazyThumbnailObserver.unobserve(frame);
    }

    function buildHtmlThumbnailDocument(html) {
        return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#111827;}
body{font-family:Inter,Arial,sans-serif;}
*,*::before,*::after{box-sizing:border-box;}
.thumbnail-card{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;isolation:isolate;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:radial-gradient(circle at 30% 25%,var(--glow-top-left,rgba(255,255,255,.1)),transparent 45%),radial-gradient(circle at 78% 70%,var(--glow-bottom-right,rgba(255,255,255,.1)),transparent 35%),linear-gradient(135deg,var(--bg-dark-1,#181818) 0%,var(--bg-dark-2,#2d2d2d) 52%,var(--bg-dark-3,var(--bg-dark-1,#181818)) 100%);}
.thumbnail-badge{position:absolute;top:var(--badge-top,8%);left:var(--badge-left,6%);z-index:3;padding:1.5cqi 3cqi;border-radius:1.5cqi;background:var(--badge-bg,#ffd43b);color:var(--badge-text,#000);font-size:var(--badge-size,2.5cqi);font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
.thumbnail-title{position:absolute;left:var(--title-left,6%);top:var(--title-top,55%);z-index:3;max-width:var(--title-width,60%);margin:0;transform:translateY(-50%);color:var(--title-color,#fff);font-size:var(--title-size,7.5cqi);line-height:1.1;font-weight:800;letter-spacing:0;text-shadow:0 4px 12px rgba(0,0,0,.4);}
.thumbnail-logo{position:absolute;right:var(--logo-right,6%);top:var(--logo-top,50%);z-index:2;width:var(--logo-size,22cqi);transform:translateY(-50%);filter:drop-shadow(0 10px 8px rgba(0,0,0,.34)) drop-shadow(0 4px 4px rgba(0,0,0,.24));}
.thumbnail-logo-text{display:grid;place-items:center;width:100%;aspect-ratio:1;border-radius:999px;background:rgba(255,255,255,.92);color:#111827;font-size:clamp(24px,8cqi,58px);font-weight:900;line-height:1;letter-spacing:0;box-shadow:0 18px 34px rgba(0,0,0,.24);}
.html-thumb{position:absolute;inset:0;width:100%;height:100%;padding:20px;background:#111827;color:#e5e7eb;display:flex;flex-direction:column;justify-content:center;gap:12px;overflow:hidden;}
img,svg,canvas,video{max-width:100%;max-height:100%;}
</style>
</head>
<body>${html}</body>
</html>`;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeXml(value) {
        return escapeHtml(value);
    }

    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === "function") {
            return window.CSS.escape(value);
        }
        return String(value).replace(/"/g, '\\"');
    }

    /* Event listeners */

    document.getElementById("courseSearch").addEventListener("input", (event) => {
        query = event.target.value;
        if (query.trim()) activeTopic = "All";
        activePage = 1;
        render();
    });

    document.querySelectorAll("[data-nav-home]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showHome();
        });
    });

    document.querySelectorAll('a[href="#courses"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showCatalog("All");
        });
    });

    document.querySelectorAll("[data-nav-about]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showInfoPage("about");
        });
    });

    document.querySelectorAll("[data-nav-contact]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showInfoPage("contact");
        });
    });

    document.querySelectorAll("[data-info-page]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showInfoPage(link.dataset.infoPage);
        });
    });

    bindAuthOpenButtons(document);

    bindPinnedOpenButtons(document);

    document.querySelectorAll("[data-carousel-dir]").forEach((button) => {
        button.addEventListener("click", () => {
            const dir = Number(button.dataset.carouselDir);
            const target = button.dataset.carouselTarget;
            if (target === "featured") slideFeatured(dir);
            else if (target === "compact") slideCompact(dir);
        });
    });

    /* Touch swipe support */
    function addSwipe(viewportId, slideFn) {
        const el = document.getElementById(viewportId);
        if (!el) return;
        addSwipeHandlers(el, slideFn);
    }

    function addSwipeHandlers(el, slideFn) {
        let startX = 0;
        let startY = 0;
        let tracking = false;

        el.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            tracking = true;
        }, { passive: true });

        el.addEventListener("touchmove", (e) => {
            if (!tracking) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                e.preventDefault();
            }
        }, { passive: false });

        el.addEventListener("touchend", (e) => {
            if (!tracking) return;
            tracking = false;
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) {
                slideFn(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    addSwipe("featuredViewport", slideFeatured);
    addSwipe("compactViewport", slideCompact);

    window.addEventListener("hashchange", handleRoute);
    window.addEventListener("popstate", handleRoute);
    window.addEventListener("storage", (event) => {
        if (event.key === ADMIN_REFRESH_STORAGE_KEY) {
            refreshAfterAdminUpdate();
        }
    });
    window.addEventListener("resize", () => {
        fitMobileLessonFrame(document);
        updateLayoutCarouselControls(document);
    });
    window.addEventListener("orientationchange", () => {
        window.setTimeout(() => fitMobileLessonFrame(document), 120);
    });

    updateAuthUi();
    initializeCatalog();
    initializeAuthState().catch((error) => console.warn("Auth state initialization failed.", error));

    async function initializeCatalog() {
        const usedCatalogCache = loadCatalogFromCache();
        const usedCarouselCache = loadCarouselsFromCache();
        const usedAnyCache = usedCatalogCache || usedCarouselCache;

        render();
        handleRoute();
        const beforeRefresh = currentRenderSignature();

        if (usedAnyCache) {
            await waitForFirstPaint();
        }

        try {
            await loadCatalogFromAPI();
        } catch (err) {
            console.warn("Live catalog could not be loaded.", err);
            if (!courses.length) catalogStatus = "error";
        }
        try {
            await loadCarouselsFromAPI();
        } catch (err) {
            console.warn("Live carousel data could not be loaded.", err);
        }

        if (!usedAnyCache || currentRenderSignature() !== beforeRefresh) {
            render();
            handleRoute();
        }
    }
})();
