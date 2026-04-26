(function () {
    const topics = [
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

    function imageCourse(id, title, tags, level, labs, bg, accent, mark) {
        return {
            id,
            topicFolder: firstTopic(tags),
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
            topicFolder: firstTopic(tags),
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

    function firstTopic(tags) {
        const match = (tags || []).find((tag) => topics.includes(tag));
        return match || (tags && tags[0]) || "Linux";
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

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    const courses = [
        imageCourse("aws", "AWS Cloud Practitioner", ["Cloud", "DevOps"], "Beginner", "14 labs", "#f8ead8", "#f59e0b", "AWS"),
        imageCourse("ai", "Artificial Intelligence Foundations", ["AI", "Automation"], "Beginner", "9 labs", "#f1e7ff", "#7c5cff", "AI"),
        imageCourse("ml2", "Machine Learning Fundamentals", ["Machine Learning", "AI", "Python"], "Beginner", "12 labs", "#e4f0ff", "#2f76d2", "ML"),
        htmlCourse("python1", "Python Programming Essentials", ["Python"], "Beginner", "15 labs", "python"),
        htmlCourse("linux", "Linux System Administration", ["Linux", "Shell"], "Beginner", "18 labs", "terminal"),
        imageCourse("sql1", "SQL and Relational Databases", ["SQL", "Backend"], "Beginner", "16 labs", "#efffd7", "#16876a", "SQL"),
        imageCourse("backend1", "Backend Systems Architecture", ["Backend", "Web Development"], "Beginner", "11 labs", "#e3e6ff", "#5f6df6", "API"),
        imageCourse("java1", "Java OOP Masterclass", ["Java"], "Beginner", "17 labs", "#f3f0d8", "#2f76d2", "JAVA"),
        htmlCourse("docker", "Docker for Beginners", ["Docker", "DevOps"], "Beginner", "13 labs", "stack"),
        imageCourse("kubernetes", "Kubernetes for Beginners", ["Kubernetes", "DevOps"], "Beginner", "22 labs", "#f8eade", "#2f76d2", "K8S"),
        htmlCourse("kali", "Kali Linux for Beginners", ["Cybersecurity", "Linux"], "Beginner", "14 labs", "circuit"),
        imageCourse("git", "Git for Beginners", ["Git", "DevOps"], "Beginner", "10 labs", "#e3f0e9", "#e05642", "GIT"),
        htmlCourse("sysadmin", "Become a Junior System Administrator", ["Linux", "Shell", "Cloud"], "Career", "28 labs", "cloud"),
        htmlCourse("react", "Build Modern Interfaces with React", ["Web Development"], "Project", "19 labs", "stack"),
        htmlCourse("rh124", "Red Hat System Administration Labs", ["Linux", "Automation"], "Certification", "30 labs", "terminal"),
        imageCourse("security-labs", "Cybersecurity Labs for Beginners", ["Cybersecurity"], "Beginner", "20 labs", "#f4e5dc", "#b46b10", "SEC")
    ];

    window.GradStudioLearnData = {
        getDefaultData() {
            return {
                topics: topics.slice(),
                courses: clone(courses)
            };
        }
    };
})();
