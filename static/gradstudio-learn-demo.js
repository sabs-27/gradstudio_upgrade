(function () {
    const pageSize = 9;
    let activeTopic = "All";
    let activePage = 1;
    let query = "";

    const htmlDemoCards = [
        {
            title: "Express.js 3D Card",
            eyebrow: "Editable starter thumbnail",
            html: starterThumbnailHtml("EXP", "Express.js<br>API Lab", "JS", "#101827", "#1f6f5b", "#34d399", "#60a5fa", "#111827", "#ffffff"),
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
            html: starterThumbnailHtml("DB", "MongoDB<br>Data Lab", "DB", "#102018", "#14532d", "#84cc16", "#34d399", "#dcfce7", "#14532d"),
            courseIds: ["mogodb1", "dte"]
        },
        {
            title: "React 3D Card",
            eyebrow: "Editable starter thumbnail",
            html: starterThumbnailHtml("UI", "React<br>Component Lab", "R", "#101827", "#1d4ed8", "#38bdf8", "#a78bfa", "#e0f2fe", "#0f172a"),
            courseIds: ["frontend1"]
        }
    ];

    function starterThumbnailHtml(badge, title, logo, bg1, bg2, glow1, glow2, badgeBg, badgeText) {
        return '<div class="thumbnail-card" style="--bg-dark-1:' + bg1 + ';--bg-dark-2:' + bg2 + ';--glow-top-left:' + glow1 + ';--glow-bottom-right:' + glow2 + ';--badge-bg:' + badgeBg + ';--badge-text:' + badgeText + ';--title-top:58%;--title-width:62%;"><span class="thumbnail-badge">' + badge + '</span><h3 class="thumbnail-title">' + title + '</h3><div class="thumbnail-logo" aria-hidden="true"><span class="thumbnail-logo-text">' + logo + '</span></div></div>';
    }

    const compactDemoCards = [
        {
            title: "Linux terminal race",
            meta: "Generated mini card",
            bg: "linear-gradient(135deg, #111827, #4f46e5)"
        },
        {
            title: "Cloud deploy lab",
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
        imageCourse("awssub", "AWS Foundations", ["Cloud", "DevOps"], "Beginner", "180 labs", "#f8ead8", "#f59e0b", "AWS"),
        imageCourse("ai1", "AI", ["AI", "Automation"], "Beginner", "114 labs", "#f1e7ff", "#7c5cff", "AI"),
        imageCourse("ml2", "ML", ["Machine Learning", "AI", "Python"], "Beginner", "58 labs", "#e4f0ff", "#2f76d2", "ML"),
        htmlCourse("pyb", "Python Introduction", ["Python"], "Beginner", "20 labs", "python"),
        htmlCourse("linnn", "Linux Introduction", ["Linux", "Shell"], "Beginner", "10 labs", "terminal"),
        imageCourse("lqs", "SQL", ["SQL", "Backend"], "Beginner", "20 labs", "#fff3e8", "#f97316", "SQL"),
        imageCourse("backend1", "Backend", ["Backend", "Web Development"], "Beginner", "23 labs", "#e3e6ff", "#5f6df6", "API"),
        imageCourse("java1", "Java", ["Java"], "Beginner", "295 labs", "#f3f0d8", "#2f76d2", "JAVA"),
        imageCourse("kubernetes1", "Kubernetes", ["Kubernetes", "DevOps"], "Beginner", "60 labs", "#f8eade", "#2f76d2", "K8S"),
        imageCourse("mogodb1", "MongoDB", ["Backend", "SQL"], "Beginner", "73 labs", "#fff3e8", "#f97316", "MDB"),
        imageCourse("gitty", "Github", ["Git", "DevOps"], "Beginner", "15 labs", "#e3f0e9", "#e05642", "GIT"),
        imageCourse("frontend1", "Front End", ["Web Development"], "Beginner", "34 labs", "#f1e7ff", "#5f6df6", "FE"),
        imageCourse("ai11", "Artificial Intelligence", ["AI"], "Beginner", "10 labs", "#f1e7ff", "#7c5cff", "AI"),
        imageCourse("nn", "Neural Networks", ["AI", "Machine Learning"], "Beginner", "23 labs", "#e4f0ff", "#7c5cff", "NN"),
        imageCourse("dl", "Deep Learning", ["AI", "Machine Learning"], "Beginner", "26 labs", "#e4f0ff", "#2f76d2", "DL"),
        imageCourse("ga", "Generative AI", ["AI"], "Beginner", "20 labs", "#f1e7ff", "#7c5cff", "GAI"),
        imageCourse("aaa", "AI Agents", ["AI", "Automation"], "Beginner", "8 labs", "#f1e7ff", "#5f6df6", "AGT"),
        imageCourse("ml1", "Machine Learning", ["Machine Learning", "AI"], "Beginner", "10 labs", "#e4f0ff", "#2f76d2", "ML"),
        imageCourse("aws2", "AWS", ["Cloud"], "Beginner", "5 labs", "#f8ead8", "#f59e0b", "AWS"),
        imageCourse("azure1", "Azure", ["Cloud"], "Beginner", "115 labs", "#e4f0ff", "#2f76d2", "AZ"),
        htmlCourse("tk", "SAP/S4hana", ["Backend"], "Beginner", "3 labs", "stack"),
        imageCourse("dte", "Data Engineer", ["Backend", "SQL"], "Beginner", "4 labs", "#fff3e8", "#f97316", "DE"),
        imageCourse("qualcomm", "Qualcomm", ["Backend"], "Beginner", "3 labs", "#f3f0d8", "#e05642", "QC")
    ];

    const USE_LOCAL_FALLBACK_DATA = window.location.protocol === "file:" || new URLSearchParams(window.location.search).has("demoFallback");

    let topics = USE_LOCAL_FALLBACK_DATA ? [...fallbackTopics] : ["All"];
    let courses = USE_LOCAL_FALLBACK_DATA ? fallbackCourses.slice() : [];
    let courseLookup = new Map(courses.map((course) => [course.id, course]));
    let catalogStatus = courses.length ? "ready" : "loading";
    let selectedCourseIds = null;
    let selectedCourseTitle = "";
    let featuredCarouselCards = [];
    let compactCarouselCards = [];
    let carouselCardMap = new Map();
    let carouselEyebrowText = "HTML Demo Thumbnails";
    let carouselHeadingText = "Featured lab previews";
    let featuredCarouselConfig = defaultCarouselRuntimeConfig("featured");
    let compactCarouselConfig = defaultCarouselRuntimeConfig("compact");
    let homepageLayoutBlocks = [];

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
    const API_CACHE_VERSION = "20260427-layout-stack-v1";
    const API_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
    const CATALOG_API_CACHE_KEY = `${API_CACHE_VERSION}:catalog`;
    const CAROUSEL_API_CACHE_KEY = `${API_CACHE_VERSION}:carousels`;
    const COURSE_API_CACHE_PREFIX = `${API_CACHE_VERSION}:course:`;

    const _apiCourseCache = new Map();

    async function fetchCourseFromAPI(courseId) {
        if (_apiCourseCache.has(courseId)) return _apiCourseCache.get(courseId);

        const cached = readApiCache(`${COURSE_API_CACHE_PREFIX}${courseId}`);
        if (cached) {
            _apiCourseCache.set(courseId, cached);
            return cached;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseId)}`);
            if (!resp.ok) return null;
            const data = await resp.json();
            if (!data || !data.sections) return null;

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
            return null;
        }
    }

    async function hydrateCourseContent(course) {
        if (!course || course._contentHydrated) return;
        course._contentHydrated = true;

        const primary = await fetchCourseFromAPI(course.id);
        if (primary?.apiDescription && !course.description) {
            course.description = primary.apiDescription;
        }
        if (primary && primary.lessons.length) {
            applyApiCourseContent(course, primary);
            return;
        }

        const children = findContentChildren(course.id);
        for (const child of children) {
            const childData = await fetchCourseFromAPI(child.id);
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
            fetch(`${API_BASE}/api/categories`),
            fetch(`${API_BASE}/api/courses?admin=1`)
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
            level: String(meta.level || course.level || "Beginner").trim() || "Beginner",
            labs: normalizeApiLabs(meta.labs, simulationCount),
            description: String(course.description || "").trim(),
            thumbnail
        };
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
        if (raw && raw.toLowerCase() !== "auto") return raw;
        return `${simulationCount} lab${simulationCount === 1 ? "" : "s"}`;
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
        return String(value || "").split("").reduce((hash, char) => {
            return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
        }, 0);
    }

    async function loadCarouselsFromAPI() {
        const local = USE_LOCAL_CAROUSEL_CACHE ? readLocalLearnCarouselConfig() : null;
        if (local) {
            const normalizedLocal = normalizeApiCarousels(local.carousels);
            applyCarouselData(normalizedLocal);
            return;
        }

        const errors = [];
        const loaders = [loadLearnCarouselConfig, loadLegacyCarouselConfig];
        for (const loader of loaders) {
            try {
                const carousels = await loader();
                const normalized = normalizeApiCarousels(carousels);
                if (normalized.featured.length || normalized.compact.length) {
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

        throw errors[0] || new Error("Carousel API returned no cards.");
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
        featuredCarouselCards = Array.isArray(data.featured) ? data.featured : [];
        compactCarouselCards = Array.isArray(data.compact) ? data.compact : [];
        featuredCarouselConfig = data.featuredConfig || featuredCarouselConfig || defaultCarouselRuntimeConfig("featured");
        compactCarouselConfig = data.compactConfig || compactCarouselConfig || defaultCarouselRuntimeConfig("compact");
        homepageLayoutBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        carouselCardMap = new Map();
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
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > API_CACHE_TTL_MS) return null;
            return parsed.data || null;
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

    function currentRenderSignature() {
        return JSON.stringify({
            topics,
            courses: courses.map((course) => ({
                id: course.id,
                title: course.title,
                topicFolder: course.topicFolder,
                labs: course.labs,
                thumb: course.thumbnail
            })),
            featured: featuredCarouselCards.map(carouselCardSignature),
            compact: compactCarouselCards.map(carouselCardSignature),
            carouselEyebrowText,
            carouselHeadingText,
            featuredCarouselConfig,
            compactCarouselConfig,
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
            card.contentType,
            card.imageUrl,
            card.iframeUrl
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
        if (featuredCarousel) {
            carouselEyebrowText = String(featuredCarousel.eyebrow || carouselEyebrowText || "HTML Demo Thumbnails");
            carouselHeadingText = String(featuredCarousel.header || carouselHeadingText || "Featured lab previews");
        }

        const blocks = sorted.map((carousel) => normalizeLayoutBlock(carousel)).filter(Boolean);
        return {
            featured: featuredCarousel ? normalizeCarouselCards(featuredCarousel, "featured") : [],
            compact: compactCarousel ? normalizeCarouselCards(compactCarousel, "compact") : [],
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
            header: String(carousel.header || ""),
            eyebrow: String(carousel.eyebrow || ""),
            config,
            cards: type === "carousel" ? normalizeCarouselCards(carousel, slot) : []
        };
    }

    function defaultCarouselRuntimeConfig(slot) {
        return {
            layoutAlign: "stretch",
            maxWidth: "1480px",
            layoutStyle: "fit",
            visibleCount: slot === "compact" ? COMPACT_VISIBLE : FEATURED_VISIBLE,
            cardGap: slot === "compact" ? COMPACT_GAP : FEATURED_GAP,
            infiniteScroll: true,
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
                    title: String(card.title || "Carousel card"),
                    eyebrow: String(card.description || carousel.header || ""),
                    description: String(card.description || ""),
                    contentType: String(card.content_type || "standard"),
                    imageUrl: String(card.image_url || ""),
                    iframeUrl: String(card.iframe_url || ""),
                    contentHtml: normalizeStoredHtml(card.content_html),
                    iconClass: String(card.icon_class || "fas fa-star"),
                    colorHex: String(card.color_hex || "#3b82f6"),
                    width: normalizeCssLength(card.width, slot === "compact" ? "220px" : "400px"),
                    heightPx: normalizeCssLength(card.height_px, slot === "compact" ? "160px" : "420px"),
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
            targetType: card.courseIds && card.courseIds.length ? "course_list" : (card.src ? "external" : "none"),
            href: card.src,
            courseIds: card.courseIds || []
        }));
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
            level: String(course.level || "Beginner").trim() || "Beginner",
            labs: course.labs === "Auto" ? "12 labs" : (String(course.labs || "12 labs").trim() || "12 labs"),
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

        const filtered = getFilteredCourses();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        activePage = Math.min(activePage, totalPages);
        const start = (activePage - 1) * pageSize;
        const visibleCourses = filtered.slice(start, start + pageSize);

        document.getElementById("courseCount").textContent = filtered.length.toString();
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

    function jumpToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const top = Math.max(0, section.offsetTop - 80);
        window.scrollTo({ top, behavior: "auto" });
    }

    function showHome(updateUrl = true) {
        clearCatalogFilters("All");
        setDetailVisible(false);
        updateNavState("home");
        if (updateUrl) history.pushState({ view: "home" }, "", window.location.pathname);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function showCatalog(topic = "All", updateUrl = true) {
        clearCatalogFilters(topic);
        setDetailVisible(false);
        updateNavState("courses");
        if (updateUrl) history.pushState({ view: "courses", topic }, "", "#courses");
        jumpToSection("courses");
    }

    function updateNavState(active) {
        document.querySelectorAll(".main-nav a").forEach((link) => {
            const isActive =
                (active === "home" && link.hasAttribute("data-nav-home")) ||
                (active === "courses" && link.hasAttribute("data-nav-courses")) ||
                (active === "about" && link.hasAttribute("data-nav-about")) ||
                (active === "contact" && link.hasAttribute("data-nav-contact"));
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    function showInfoPage(pageKey, updateUrl = true) {
        const normalizedKey = normalizeInfoPageKey(pageKey);
        const page = buildInfoPage(normalizedKey);
        const infoPage = document.getElementById("infoPage");
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const hero = document.getElementById("home");
        const catalog = document.getElementById("courses");
        const carousel = document.querySelector(".demo-carousel-block");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (!infoPage) return;

        infoPage.innerHTML = page;
        infoPage.hidden = false;
        if (detail) detail.hidden = true;
        if (player) player.hidden = true;
        if (hero) hero.hidden = true;
        if (catalog) catalog.hidden = true;
        if (carousel) carousel.hidden = true;
        if (footer) footer.hidden = false;
        if (topbar) topbar.hidden = false;
        document.body.classList.toggle("is-course-player", false);
        updateNavState(normalizedKey === "about" || normalizedKey === "contact" ? normalizedKey : "");

        if (updateUrl) history.pushState({ view: normalizedKey }, "", `#${normalizedKey}`);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    function normalizeInfoPageKey(pageKey) {
        const key = String(pageKey || "").toLowerCase();
        return ["about", "contact", "legal", "privacy", "terms", "cookies"].includes(key) ? key : "about";
    }

    function buildInfoPage(pageKey) {
        const pages = {
            about: {
                eyebrow: "About GradStudio",
                title: "A practical learning platform for technical concepts.",
                body: "GradStudio is built to make complex engineering, AI, cloud, data, and software topics easier to understand through structured lessons, guided demos, and focused refreshers.",
                cards: [
                    ["Clear Foundations", "Lessons focus on core intuition first, then move into implementation details so beginners can follow without feeling lost."],
                    ["Interactive Practice", "Courses use demos, guided modules, and visual explanations to help learners connect theory with real system behavior."],
                    ["Refresh Anytime", "Short modules make it easy to revisit topics, strengthen prior knowledge, and prepare for projects, interviews, or coursework."]
                ]
            },
            contact: {
                eyebrow: "Contact",
                title: "Questions, feedback, or support.",
                body: "For course questions, technical issues, or platform feedback, reach out directly and include the course or module name when relevant.",
                contact: true
            },
            legal: {
                eyebrow: "Legal",
                title: "Platform policies and learner protections.",
                body: "Review the GradStudio policies that explain privacy, terms of use, cookies, and how platform data is handled.",
                cards: [
                    ["Privacy", "How learner and platform data is handled, stored, and protected."],
                    ["Terms", "The rules for using GradStudio lessons, demos, accounts, and platform content."],
                    ["Cookies", "How cookies and local storage support preferences, sessions, and performance."]
                ]
            },
            privacy: {
                eyebrow: "Privacy",
                title: "Privacy Policy",
                body: "GradStudio collects only the information needed to operate learning features, support accounts, improve course quality, and keep the platform secure.",
                cards: [
                    ["Information Used", "Course activity, basic account details, and technical logs may be used to provide platform functionality and support."],
                    ["Data Protection", "Platform data is handled with access controls and infrastructure safeguards appropriate for a learning system."],
                    ["Contact", "Privacy questions can be sent to support@gradstudio.org."]
                ]
            },
            terms: {
                eyebrow: "Terms",
                title: "Terms of Service",
                body: "By using GradStudio, learners agree to use the platform responsibly, respect course content, and avoid activity that disrupts services or other users.",
                cards: [
                    ["Learning Content", "Course materials and demos are provided for education and practice."],
                    ["Acceptable Use", "Do not misuse platform access, attempt unauthorized access, or interfere with service operation."],
                    ["Updates", "Terms may be updated as the platform evolves."]
                ]
            },
            cookies: {
                eyebrow: "Cookies",
                title: "Cookie Policy",
                body: "GradStudio uses cookies and local browser storage to keep the learning experience fast, functional, and consistent between visits.",
                cards: [
                    ["Preferences", "Browser storage may remember UI preferences, cached catalog data, and local learning state."],
                    ["Performance", "Caching helps pages and thumbnails load faster without repeating the same network work."],
                    ["Control", "You can clear browser storage or cookies from your browser settings."]
                ]
            }
        };
        const page = pages[pageKey] || pages.about;
        const cards = page.cards ? `
            <div class="info-grid">
                ${page.cards.map(([title, body]) => `
                    <article>
                        <h3>${escapeHtml(title)}</h3>
                        <p>${escapeHtml(body)}</p>
                    </article>
                `).join("")}
            </div>
        ` : "";
        const contact = page.contact ? `
            <div class="contact-card">
                <span>Email</span>
                <a href="mailto:support@gradstudio.org">support@gradstudio.org</a>
            </div>
        ` : "";

        return `
            <section class="info-page-hero" aria-labelledby="infoPageTitle">
                <div class="section-copy">
                    <span class="eyebrow">${escapeHtml(page.eyebrow)}</span>
                    <h1 id="infoPageTitle">${escapeHtml(page.title)}</h1>
                    <p>${escapeHtml(page.body)}</p>
                </div>
                ${contact}
            </section>
            ${cards}
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
        if (heading) heading.textContent = carouselHeadingText || "Featured lab previews";
        applyCarouselLayout();
        buildFeaturedCarousel();
        buildCompactCarousel();
    }

    function renderLayoutStack(stack) {
        const blocks = homepageLayoutBlocks.length ? homepageLayoutBlocks : fallbackLayoutBlocks();
        carouselCardMap = new Map();
        if (!blocks.length) {
            stack.innerHTML = "";
            return;
        }
        stack.innerHTML = blocks.map(renderLayoutBlock).join("");
        bindCarouselCardClicks(stack);
        bindLayoutScrollButtons(stack);
        bindLayoutSwipe(stack);
    }

    function fallbackLayoutBlocks() {
        if (!USE_LOCAL_FALLBACK_DATA) return [];
        return [
            {
                id: "1",
                type: "carousel",
                slot: "featured",
                eyebrow: carouselEyebrowText || "HTML Demo Thumbnails",
                header: carouselHeadingText || "Featured lab previews",
                config: featuredCarouselConfig || defaultCarouselRuntimeConfig("featured"),
                cards: featuredCarouselCards.length ? featuredCarouselCards : fallbackFeaturedCards()
            },
            {
                id: "2",
                type: "carousel",
                slot: "compact",
                eyebrow: "",
                header: "More lab previews",
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
        const text = config.sectionText || block.header || "";
        if (!text) return "";
        return `
            <section class="demo-carousel-block demo-text-layout-block" data-align="${escapeHtml(config.layoutAlign)}" data-copy-align="${escapeHtml(config.sectionTextAlign)}" style="${carouselBlockStyle(config)}">
                <div class="carousel-text-block">${escapeHtml(text)}</div>
            </section>
        `;
    }

    function renderCarouselLayoutBlock(block, config) {
        const cards = block.cards && block.cards.length ? block.cards : (block.slot === "compact" ? fallbackCompactCards() : fallbackFeaturedCards());
        const railId = `carouselRail-${cssIdent(block.id)}`;
        const viewportId = `carouselViewport-${cssIdent(block.id)}`;
        const railClass = block.slot === "compact" ? "compact-demo-rail" : "featured-demo-rail";
        const cardMarkup = cards.map((card, index) => {
            return block.slot === "compact"
                ? renderCompactDemoCard(card, config)
                : renderFeatureDemoCard(card, index % 2 === 0 ? "is-primary" : "is-secondary", config);
        }).join("");
        return `
            <section class="demo-carousel-block" data-align="${escapeHtml(config.layoutAlign)}" data-copy-align="${escapeHtml(config.sectionTextAlign)}" style="${carouselBlockStyle(config)}">
                ${config.sectionText ? `<div class="carousel-text-block">${escapeHtml(config.sectionText)}</div>` : ""}
                <div class="carousel-heading">
                    <div>
                        ${block.eyebrow ? `<span class="eyebrow">${escapeHtml(block.eyebrow)}</span>` : ""}
                        <h3>${escapeHtml(block.header || "Carousel")}</h3>
                    </div>
                    <div class="carousel-controls" aria-label="Carousel controls">
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
            `--carousel-copy-max-width:${config.sectionTextMaxWidth}`
        ].join(";");
    }

    function carouselRailStyle(config) {
        return [
            `--carousel-gap:${config.cardGap}px`,
            `--carousel-rail-align:${alignToJustify(config.layoutAlign)}`,
            `--fit-card-width:calc((100% - ${(config.visibleCount - 1) * config.cardGap}px) / ${config.visibleCount})`
        ].join(";");
    }

    function bindLayoutScrollButtons(root) {
        root.querySelectorAll("[data-layout-scroll]").forEach((button) => {
            button.addEventListener("click", () => {
                const viewport = document.getElementById(button.dataset.layoutScroll);
                if (!viewport) return;
                viewport.scrollBy({ left: Number(button.dataset.scrollDir || 1) * viewport.clientWidth * 0.82, behavior: "smooth" });
            });
        });
    }

    function bindLayoutSwipe(root) {
        root.querySelectorAll(".carousel-viewport").forEach((viewport) => {
            addSwipeHandlers(viewport, (dir) => {
                viewport.scrollBy({ left: dir * viewport.clientWidth * 0.82, behavior: "smooth" });
            });
        });
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
    }

    function alignToJustify(value) {
        if (value === "center") return "center";
        if (value === "right") return "flex-end";
        return "flex-start";
    }

    /* Infinite carousel engine */

    function buildFeaturedCarousel() {
        const rail = document.getElementById("featuredDemoRail");
        const cards = featuredCarouselCards.length ? featuredCarouselCards : fallbackFeaturedCards();
        const config = featuredCarouselConfig || defaultCarouselRuntimeConfig("featured");
        const visible = config.visibleCount || FEATURED_VISIBLE;
        const gap = config.cardGap || FEATURED_GAP;
        const key = cards.map((card) => `${card.key}:${card.width}:${card.heightPx}:${card.textPosition}:${card.textAlign}`).join("|") + JSON.stringify(config);
        if (rail.dataset.carouselKey === key) return;
        rail.dataset.carouselKey = key;

        const staticRail = !config.infiniteScroll || cards.length <= visible;
        const clones = staticRail ? 0 : Math.min(visible, cards.length);
        const all = staticRail ? cards : [...cards.slice(-clones), ...cards, ...cards.slice(0, clones)];
        rail.classList.toggle("is-static", staticRail);
        setCarouselControlsVisible("featured", !staticRail);

        rail.innerHTML = all.map((card, i) => {
            const idx = i < clones ? cards.length - clones + i : (i - clones) >= cards.length ? (i - clones - cards.length) : i - clones;
            return renderFeatureDemoCard(card, idx % 2 === 0 ? "is-primary" : "is-secondary");
        }).join("");
        bindCarouselCardClicks(rail);

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
        const cards = compactCarouselCards.length ? compactCarouselCards : fallbackCompactCards();
        const config = compactCarouselConfig || defaultCarouselRuntimeConfig("compact");
        const visible = config.visibleCount || COMPACT_VISIBLE;
        const gap = config.cardGap || COMPACT_GAP;
        const key = cards.map((card) => `${card.key}:${card.width}:${card.heightPx}:${card.textPosition}:${card.textAlign}`).join("|") + JSON.stringify(config);
        if (rail.dataset.carouselKey === key) return;
        rail.dataset.carouselKey = key;

        const staticRail = !config.infiniteScroll || cards.length <= visible;
        const clones = staticRail ? 0 : Math.min(visible, cards.length);
        const all = staticRail ? cards : [...cards.slice(-clones), ...cards, ...cards.slice(0, clones)];
        rail.classList.toggle("is-static", staticRail);
        setCarouselControlsVisible("compact", !staticRail);

        rail.innerHTML = all.map((card) => renderCompactDemoCard(card)).join("");
        bindCarouselCardClicks(rail);

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

    function renderFeatureDemoCard(card, variantClass, config = featuredCarouselConfig) {
        carouselCardMap.set(card.key, card);
        return `
            <article class="demo-feature-card ${variantClass}" role="button" tabindex="0" data-carousel-card-key="${escapeHtml(card.key)}" data-text-position="${escapeHtml(card.textPosition)}" style="${carouselCardStyle(card, "featured", config)}">
                ${renderCarouselCardMedia(card, "featured")}
                <div class="demo-card-meta">
                    <div>
                        <h4>${escapeHtml(card.title)}</h4>
                        <span>${escapeHtml(card.eyebrow)}</span>
                    </div>
                    <button type="button">${escapeHtml(carouselButtonLabel(card))}</button>
                </div>
            </article>
        `;
    }

    function renderCompactDemoCard(card, config = compactCarouselConfig) {
        carouselCardMap.set(card.key, card);
        return `
            <article class="compact-demo-card" role="button" tabindex="0" data-carousel-card-key="${escapeHtml(card.key)}" data-text-position="${escapeHtml(card.textPosition)}" style="${carouselCardStyle(card, "compact", config)};--compact-bg: ${escapeHtml(card.bg || carouselGradient(card.colorHex, 0))}">
                <div class="compact-card-media">${renderCarouselCardMedia(card, "compact")}</div>
                <div class="compact-card-copy">
                    <b>${escapeHtml(card.title)}</b>
                    <span>${escapeHtml(card.eyebrow || carouselButtonLabel(card))}</span>
                </div>
            </article>
        `;
    }

    function carouselCardStyle(card, slot, config = null) {
        const activeConfig = config || (slot === "compact" ? compactCarouselConfig : featuredCarouselConfig);
        const width = activeConfig?.layoutStyle === "custom_width" || cardHasCustomWidth(card, slot) ? card.width : "var(--fit-card-width)";
        return [
            `--card-width:${width}`,
            `--card-height:${card.heightPx}`,
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
        const fallback = slot === "compact" ? "220px" : "400px";
        return String(card.width || "").trim().toLowerCase() !== fallback;
    }

    function renderCarouselCardMedia(card, size) {
        if (card.contentType === "image" && card.imageUrl) {
            return `<img class="carousel-card-image" src="${escapeHtml(resolveAssetUrl(card.imageUrl))}" alt="${escapeHtml(card.title)} thumbnail" loading="lazy" decoding="async">`;
        }
        if (card.contentType === "iframe" && card.iframeUrl) {
            return `<iframe title="${escapeHtml(card.title)}" src="${escapeHtml(resolveAssetUrl(card.iframeUrl))}" loading="lazy" sandbox="allow-scripts"></iframe>`;
        }
        if (card.contentType === "html" && card.contentHtml) {
            if (isFullHtmlDocument(card.contentHtml)) {
                return `<iframe title="${escapeHtml(card.title)} thumbnail" srcdoc="${escapeHtml(card.contentHtml)}" loading="lazy" sandbox="allow-scripts"></iframe>`;
            }
            return `<div class="carousel-html-media">${sanitizeHtmlSnippet(card.contentHtml)}</div>`;
        }
        if (size === "compact") return "";
        return `<div class="carousel-icon-media" style="--card-color:${escapeHtml(card.colorHex || "#3b82f6")}"><i class="${escapeHtml(card.iconClass || "fas fa-star")}"></i></div>`;
    }

    function carouselButtonLabel(card) {
        if (card.targetType === "course") return "Start";
        if (card.targetType === "course_list") return "View Cards";
        if (card.targetType === "external") return "Open";
        return "View";
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
            const folder = course.topicFolder || course.tags[0];
            if (folder) counts.set(folder, (counts.get(folder) || 0) + 1);
        });

        const topicList = document.getElementById("topicList");
        topicList.innerHTML = topics.map((topic) => `
            <button class="topic-button ${topic === activeTopic ? "is-active" : ""}" type="button" data-topic="${escapeHtml(topic)}">
                <span>${escapeHtml(topic)}</span>
                <small>${counts.get(topic) || 0}</small>
            </button>
        `).join("");

        document.getElementById("topicCount").textContent = topics.length.toString();
        document.getElementById("topicCountStat").textContent = topics.length.toString();

        topicList.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", () => {
                activeTopic = button.dataset.topic;
                selectedCourseIds = null;
                selectedCourseTitle = "";
                query = "";
                document.getElementById("courseSearch").value = "";
                activePage = 1;
                render();
            });
        });
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
                            <span>${escapeHtml(course.labs)}</span>
                        </div>
                    </div>
                    <div class="tag-list">
                        ${course.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll("[data-course-card-id]").forEach((card) => {
            const courseId = card.dataset.courseCardId;
            card.addEventListener("click", () => openCourse(courseId));
            card.addEventListener("keydown", (event) => {
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

        await hydrateCourseContent(course);

        renderCourseDetail(course);
        setDetailVisible(true);
        updateNavState("");
        history.pushState({ view: "course", courseId }, "", `#course/${encodeURIComponent(courseId)}`);
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    async function openLesson(courseId, lessonIndex = 0, replace = false) {
        const course = courseLookup.get(courseId) || courses.find((item) => item.id === courseId);
        if (!course) return;

        await hydrateCourseContent(course);

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
        frame.srcdoc = html;
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
                await hydrateCourseContent(course);

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

        if (route === "courses") {
            showCatalog("All", false);
            return;
        }

        if (route === "home" || route === "") {
            showHome(false);
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
        const hero = document.getElementById("home");
        const catalog = document.getElementById("courses");
        const carousel = document.querySelector(".demo-carousel-block");
        const infoPage = document.getElementById("infoPage");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (detail) detail.hidden = !isDetailVisible;
        if (player) player.hidden = true;
        if (hero) hero.hidden = isDetailVisible;
        if (catalog) catalog.hidden = isDetailVisible;
        if (carousel) carousel.hidden = isDetailVisible;
        if (infoPage) infoPage.hidden = true;
        if (footer) footer.hidden = isDetailVisible;
        if (topbar) topbar.hidden = false;
        document.body.classList.toggle("is-course-player", false);
    }

    function setPlayerVisible(isPlayerVisible) {
        const detail = document.getElementById("courseDetail");
        const player = document.getElementById("coursePlayer");
        const hero = document.getElementById("home");
        const catalog = document.getElementById("courses");
        const carousel = document.querySelector(".demo-carousel-block");
        const infoPage = document.getElementById("infoPage");
        const footer = document.querySelector(".site-footer");
        const topbar = document.querySelector(".topbar");

        if (detail) detail.hidden = true;
        if (player) player.hidden = !isPlayerVisible;
        if (hero) hero.hidden = isPlayerVisible;
        if (catalog) catalog.hidden = isPlayerVisible;
        if (carousel) carousel.hidden = isPlayerVisible;
        if (infoPage) infoPage.hidden = true;
        if (footer) footer.hidden = isPlayerVisible;
        if (topbar) topbar.hidden = isPlayerVisible;
        document.body.classList.toggle("is-course-player", isPlayerVisible);
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
                    ${hasLessons
                        ? `<button class="start-learning-button" type="button" data-start-learning>Start Learning</button>`
                        : `<button class="start-learning-button is-disabled" type="button" disabled>No modules published</button>`}
                </article>

                <section class="course-contents-card" id="courseLessons" aria-labelledby="courseContentsTitle">
                    <div class="course-contents-head">
                        <div>
                            <span class="eyebrow">Contents</span>
                            <h2 id="courseContentsTitle">Labs and challenges</h2>
                        </div>
                        <span>${lessons.length} module${lessons.length === 1 ? "" : "s"}</span>
                    </div>
                    <div class="lesson-list detail-section-list">
                        ${sections.length
                            ? sections.map((section, sectionIndex) => renderDetailSection(section, sectionIndex)).join("")
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

        detail.querySelectorAll("[data-lesson-index]").forEach((row) => {
            row.addEventListener("click", () => openLesson(course.id, row.dataset.lessonIndex));
            row.addEventListener("keydown", (event) => {
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
    }

    function renderDetailSection(section, sectionIndex) {
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
                    ${section.items.map((item) => renderLessonRow(item.lesson, item.index)).join("")}
                </div>
            </section>
        `;
    }

    function renderLessonRow(lesson, index) {
        const isLab = lesson.type === "lab";
        const title = cleanLessonTitle(lesson.title);
        return `
            <article class="lesson-row" role="button" tabindex="0" data-lesson-index="${index}" aria-label="Open ${escapeHtml(title)}">
                <span class="lesson-icon ${isLab ? "lab" : "challenge"}" aria-hidden="true"></span>
                <h3>${escapeHtml(title)}</h3>
                <span class="lesson-status" aria-label="Not completed"></span>
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

                    <label class="player-search">
                        <span class="sr-only">Search course contents</span>
                        <input type="search" placeholder="Search lessons..." data-player-search>
                    </label>

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
                            <button class="player-pill" type="button" data-bookmark>
                                <span aria-hidden="true">[]</span>
                                Bookmark
                            </button>
                            <button class="player-pill" type="button" data-fullscreen>
                                <span aria-hidden="true">[ ]</span>
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

        const bookmark = player.querySelector("[data-bookmark]");
        if (bookmark) {
            bookmark.addEventListener("click", () => bookmark.classList.toggle("is-active"));
        }

        const fullscreen = player.querySelector("[data-fullscreen]");
        if (fullscreen) {
            fullscreen.addEventListener("click", () => {
                const frameShell = player.querySelector(".player-frame-shell");
                if (frameShell && frameShell.requestFullscreen) frameShell.requestFullscreen();
            });
        }
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
        return `This course introduces ${topic} through focused labs and challenges. Complete ${moduleCount} modules to practice the core tasks and build confidence with real workflows.`;
    }

    function renderPager(totalPages) {
        const pager = document.getElementById("pager");
        if (totalPages <= 1) {
            pager.innerHTML = "";
            return;
        }

        const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
        pager.innerHTML = `
            <button type="button" data-page="prev" ${activePage === 1 ? "disabled" : ""}>Prev</button>
            ${pages.map((page) => `<button type="button" data-page="${page}" class="${page === activePage ? "is-active" : ""}">${page}</button>`).join("")}
            <button type="button" data-page="next" ${activePage === totalPages ? "disabled" : ""}>Next</button>
        `;

        pager.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.page;
                if (target === "prev") activePage -= 1;
                else if (target === "next") activePage += 1;
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
        return baseCourses.filter((course) => {
            const topicMatch = activeTopic === "All" || course.topicFolder === activeTopic || course.tags.includes(activeTopic);
            const searchText = `${course.title} ${course.topicFolder || ""} ${course.tags.join(" ")} ${course.level}`.toLowerCase();
            const queryMatch = !normalizedQuery || searchText.includes(normalizedQuery);
            return topicMatch && queryMatch;
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

    initializeCatalog();

    async function initializeCatalog() {
        const usedCatalogCache = loadCatalogFromCache();
        const usedCarouselCache = loadCarouselsFromCache();
        const usedAnyCache = usedCatalogCache || usedCarouselCache;

        render();
        handleRoute();
        const beforeRefresh = currentRenderSignature();

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
