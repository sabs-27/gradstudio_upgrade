
        // ===== MOBILE SIGN IN/OUT BUTTON =====
        function handleMobileSignIn() {
            const isLoggedIn = localStorage.getItem('lp_is_logged_in') === 'true' || Boolean(localStorage.getItem('lp_auth_token'));
            if (isLoggedIn) {
                // Sign out
                if (!confirm("Sign out?")) return;
                if (typeof clearAuthState === 'function') clearAuthState();
                if (typeof renderAuthButton === 'function') renderAuthButton();
                updateMobileSignInBtn();
                location.reload();
            } else {
                // Open auth modal
                if (typeof openAuthModal === 'function') openAuthModal('login');
            }
        }
        window.handleMobileSignIn = handleMobileSignIn;

        function handleDesktopSignIn() {
            const isLoggedIn = localStorage.getItem('lp_is_logged_in') === 'true' || Boolean(localStorage.getItem('lp_auth_token'));
            if (isLoggedIn) {
                if (!confirm("Sign out?")) return;
                if (typeof clearAuthState === 'function') clearAuthState();
                if (typeof renderAuthButton === 'function') renderAuthButton();
                updateDesktopSignInBtn();
                updateMobileSignInBtn();
                location.reload();
            } else {
                if (typeof openAuthModal === 'function') openAuthModal('login');
            }
        }
        window.handleDesktopSignIn = handleDesktopSignIn;

        function updateDesktopSignInBtn() {
            const btn = document.getElementById('header-signin-btn');
            if (!btn) return;
            const isLoggedIn = localStorage.getItem('lp_is_logged_in') === 'true' || Boolean(localStorage.getItem('lp_auth_token'));
            btn.textContent = isLoggedIn ? 'Sign Out' : 'Sign In';
        }
        window.updateDesktopSignInBtn = updateDesktopSignInBtn;

        function updateMobileSignInBtn() {
            const btn = document.getElementById('mobile-signin-btn');
            if (!btn) return;
            const isLoggedIn = localStorage.getItem('lp_is_logged_in') === 'true' || Boolean(localStorage.getItem('lp_auth_token'));
            btn.textContent = isLoggedIn ? 'Sign Out' : 'Sign In';
        }
        window.updateMobileSignInBtn = updateMobileSignInBtn;

        // Update button on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateMobileSignInBtn();
            updateDesktopSignInBtn();

            // --- Anti-scraping: disable right-click on viewer panes ---
            document.addEventListener('contextmenu', function(e) {
                if (e.target.closest('.viewer-pane') || e.target.closest('.viewer-screen') || e.target.tagName === 'IFRAME') {
                    e.preventDefault();
                }
            });
        });

        // ===== FORCE DESKTOP VIEW FUNCTIONS (Available Immediately) =====
        window.forceDesktopView = function () {
            document.body.classList.add('force-desktop-view');
            if (window.switchProvider) {
                window.switchProvider('home');
            } else {
                setTimeout(() => {
                    if (window.switchProvider) window.switchProvider('home');
                }, 100);
            }
        };
        window.toggleViewMode = function () {
            document.body.classList.toggle('force-desktop-view');
            if (document.body.classList.contains('force-desktop-view') && window.switchProvider) {
                window.switchProvider('home');
            }
        };

        // ===== API CLIENT CONFIGURATION =====
        // Feature flag: set localStorage lp_use_local_api = 'true' to use localhost
        const USE_LOCAL_API = localStorage.getItem('lp_use_local_api') === 'true';
        // ===== MOCK DATA MODE =====
        // Set USE_MOCK_DATA to true to work locally without API
        // When enabled:
        // - Sidebar shows mock categories (SKILL BASED, ROLE BASED, RESEARCH PAPERS)
        // - Courses show mock sections and topics with lock icons
        // - Course viewer shows placeholder simulation content
        // - Footer bar shows with mock data (0 views, 0 likes, etc.)
        // - User shows as "Hi, Guest" (not logged in)
        // To switch back to live API, set USE_MOCK_DATA = false
        const USE_MOCK_DATA = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        // Ensure guest state when using mock data (optional - comment out if you want to test logged-in state)
        if (USE_MOCK_DATA && typeof localStorage !== 'undefined') {
            // Uncomment the line below to force guest state in mock mode
            // localStorage.setItem('lp_is_logged_in', 'false');
        }
        const API_CONFIG = {
            // Auto-detect: use same origin for dev (workers.dev), production API for gradstudio.org
            baseUrl: window.location.hostname.includes('workers.dev')
                ? window.location.origin
                : 'https://api.gradstudio.org',
            timeout: 30000,
            retryAttempts: 2
        };

        // ===== SIMULATION URL OBFUSCATION =====
        // Encode sim URLs in DOM so scrapers can't read them from data attributes
        window._simEncode = function(url) {
            if (!url) return '';
            const k = 'gS$7x!qR';
            let r = '';
            for (let i = 0; i < url.length; i++) {
                r += String.fromCharCode(url.charCodeAt(i) ^ k.charCodeAt(i % k.length));
            }
            return btoa(r);
        };
        window._simDecode = function(encoded) {
            if (!encoded) return '';
            try {
                const d = atob(encoded);
                const k = 'gS$7x!qR';
                let r = '';
                for (let i = 0; i < d.length; i++) {
                    r += String.fromCharCode(d.charCodeAt(i) ^ k.charCodeAt(i % k.length));
                }
                return r;
            } catch(e) { return ''; }
        };

        // ===== ACCESS STATE (CLIENT-SIDE FLAGS) =====
        const AccessState = {
            get isLoggedIn() {
                return localStorage.getItem('lp_is_logged_in') === 'true';
            },
            get hasFullAccess() {
                return localStorage.getItem('lp_has_full_access') === 'true';
            },
            get authToken() {
                return localStorage.getItem('lp_auth_token') || '';
            },
            get userEmail() {
                return localStorage.getItem('lp_user_email') || '';
            },
            get displayName() {
                return localStorage.getItem('lp_user_display_name') || '';
            }
        };

        function setAuthState({ token, email, hasFullAccess, displayName }) {
            if (token) localStorage.setItem('lp_auth_token', token);
            if (email) localStorage.setItem('lp_user_email', email);
            if (displayName) localStorage.setItem('lp_user_display_name', displayName);
            localStorage.setItem('lp_is_logged_in', 'true');
            localStorage.setItem('lp_has_full_access', hasFullAccess ? 'true' : 'false');
        }

        function clearAuthState() {
            localStorage.removeItem('lp_auth_token');
            localStorage.removeItem('lp_user_email');
            localStorage.removeItem('lp_user_display_name');
            localStorage.setItem('lp_is_logged_in', 'false');
            localStorage.setItem('lp_has_full_access', 'false');
        }

        function renderAuthButton() {
            const button = document.getElementById('auth-main-button');
            const greeting = document.getElementById('auth-greeting');
            if (!button) return;
            const isLoggedIn = AccessState.isLoggedIn || Boolean(AccessState.authToken);
            if (isLoggedIn && !AccessState.isLoggedIn) {
                localStorage.setItem('lp_is_logged_in', 'true');
            }
            const formatName = (value) => {
                if (!value) return '';
                return value
                    .split(' ')
                    .filter(Boolean)
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                    .join(' ');
            };

            if (isLoggedIn) {
                document.body.classList.add('is-logged-in');
                button.textContent = 'Logout';
                button.classList.add('secondary');
                button.onclick = handleLogout;
                if (greeting) {
                    const name = formatName(AccessState.displayName) || 'Guest';
                    greeting.textContent = `Hi, ${name}`;
                    greeting.style.display = 'inline-flex';
                }
            } else {
                document.body.classList.remove('is-logged-in');
                button.textContent = 'Login';
                button.classList.remove('secondary');
                button.onclick = () => openAuthModal('login');
                if (greeting) {
                    greeting.textContent = 'Hi, Guest';
                    greeting.style.display = 'inline-flex';
                }
            }
            const activeview = document.querySelector('.view-section:not(.hidden)');
            const activeid = activeview?.id?.replace('view-', '') || 'home';
            const authWrap = document.getElementById('auth-button-wrap');
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            const mobileHeaderRight = document.querySelector('.mobile-header-right');

            // PERMANENT FIX: On mobile, ALWAYS keep auth button in mobile header - NEVER move it
            if (isMobile && mobileHeaderRight && authWrap) {
                // Force it to stay in mobile header - prevent any other code from moving it
                if (authWrap.parentElement !== mobileHeaderRight) {
                    mobileHeaderRight.appendChild(authWrap);
                }
                // Lock it in place with a data attribute
                authWrap.setAttribute('data-mobile-locked', 'true');
                return; // Exit early - don't run desktop logic
            } else {
                // On desktop, move to appropriate location
                const homeView = document.getElementById('view-home');
                const mainContent = document.querySelector('.main-content');
                if (activeid === 'home') {
                    if (authWrap && homeView && authWrap.parentElement !== homeView) {
                        homeView.insertBefore(authWrap, homeView.firstChild);
                    }
                } else {
                    if (authWrap && mainContent && authWrap.parentElement !== mainContent) {
                        mainContent.insertBefore(authWrap, mainContent.firstChild);
                    }
                }
            }
            updateAuthControls(activeid);
        }
        window.accessState = AccessState;

        // ===== MOCK DATA =====
        const MOCK_DATA = {
            categories: [
                { id: 'skill', name: 'SKILL BASED', type: 'category' },
                { id: 'role', name: 'ROLE BASED', type: 'category' },
                { id: 'research', name: 'RESEARCH PAPERS', type: 'category' }
            ],
            courses: [
                { id: 'azure', title: 'Azure', icon_class: 'fa-brands fa-microsoft', category: 'skill', is_locked: true, type: 'course' },
                { id: 'linux', title: 'Linux', icon_class: 'fa-brands fa-linux', category: 'skill', is_locked: true, type: 'course' },
                { id: 'aws', title: 'Amazon AWS', icon_class: 'fa-brands fa-aws', category: 'skill', is_locked: true, type: 'course' },
                { id: 'cloud-platforms', title: 'Cloud Platforms', icon_class: 'fa-solid fa-cloud', category: 'skill', is_locked: false, type: 'subcategory' },
                { id: 'aws-sub', title: 'Amazon AWS', icon_class: 'fa-brands fa-aws', category: 'skill', parent_course_id: 'cloud-platforms', is_locked: true, type: 'course' },
                { id: 'azure-sub', title: 'Azure', icon_class: 'fa-brands fa-microsoft', category: 'skill', parent_course_id: 'cloud-platforms', is_locked: true, type: 'course' },
                { id: 'python', title: 'Python', icon_class: 'fa-brands fa-python', category: 'skill', is_locked: true, type: 'course' },
                { id: 'docker', title: 'Docker', icon_class: 'fa-brands fa-docker', category: 'skill', is_locked: true, type: 'course' },
                { id: 'kubernetes', title: 'Kubernetes', icon_class: 'fa-solid fa-cube', category: 'skill', is_locked: true, type: 'course' },
                { id: 'terraform', title: 'Terraform', icon_class: 'fa-solid fa-mountain', category: 'skill', is_locked: true, type: 'course' },
                { id: 'gcp', title: 'Google Cloud', icon_class: 'fa-brands fa-google', category: 'skill', is_locked: true, type: 'course' },
                { id: 'frontend', title: 'Front End', icon_class: 'fa-brands fa-html5', category: 'role', is_locked: true, type: 'course' },
                { id: 'ai', title: 'AI', icon_class: 'fa-solid fa-brain', category: 'role', is_locked: true, type: 'course' },
                { id: 'backend', title: 'Backend', icon_class: 'fa-solid fa-server', category: 'role', is_locked: true, type: 'course' }
            ],
            courseData: {
                azure: {
                    id: 'azure',
                    title: 'Azure',
                    description: 'Master Microsoft Azure cloud computing platform',
                    is_locked: true,
                    totalitems: 14,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'CLOUD COMPUTING FUNDAMENTALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Principles of Cloud Computing', display_order: 1, slug: 'azure-cloud-principles', is_locked: true, upload_date: '2025-01-15' },
                                { id: 'sim-1-2', title: 'Cloud Service Delivery Models', display_order: 2, slug: 'azure-service-models', is_locked: true, upload_date: '2025-01-16' },
                                { id: 'sim-1-3', title: 'Cloud Deployment Models', display_order: 3, slug: 'azure-deployment-models', is_locked: true, upload_date: '2025-01-17' },
                                { id: 'sim-1-4', title: 'Azure Global Infrastructure', display_order: 4, slug: 'azure-infrastructure', is_locked: true, upload_date: '2025-01-18' },
                                { id: 'sim-1-5', title: 'Azure Resource Management', display_order: 5, slug: 'azure-resource-management', is_locked: true, upload_date: '2025-01-19' },
                                { id: 'sim-1-6', title: 'Azure Pricing and Support', display_order: 6, slug: 'azure-pricing', is_locked: true, upload_date: '2025-01-20' },
                                { id: 'sim-1-7', title: 'Azure Compliance and Trust', display_order: 7, slug: 'azure-compliance', is_locked: true, upload_date: '2025-01-21' }
                            ]
                        },
                        {
                            id: 'section-2',
                            title: 'IDENTITY AND ACCESS MANAGEMENT',
                            display_order: 2,
                            simulations: [
                                { id: 'sim-2-1', title: 'Azure Active Directory Overview', display_order: 1, slug: 'azure-ad-overview', is_locked: true, upload_date: '2025-01-22' },
                                { id: 'sim-2-2', title: 'User and Group Management', display_order: 2, slug: 'azure-user-groups', is_locked: true, upload_date: '2025-01-23' },
                                { id: 'sim-2-3', title: 'Role-Based Access Control (RBAC)', display_order: 3, slug: 'azure-rbac', is_locked: true, upload_date: '2025-01-24' }
                            ]
                        }
                    ]
                },
                linux: {
                    id: 'linux',
                    title: 'Linux',
                    description: 'Learn Linux commands, file systems, and administration',
                    is_locked: true,
                    totalitems: 12,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'LINUX FUNDAMENTALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Introduction to Linux', display_order: 1, slug: 'linux-intro', is_locked: true, upload_date: '2025-01-10' },
                                { id: 'sim-1-2', title: 'File System Navigation', display_order: 2, slug: 'linux-filesystem', is_locked: true, upload_date: '2025-01-11' },
                                { id: 'sim-1-3', title: 'File Permissions', display_order: 3, slug: 'linux-permissions', is_locked: true, upload_date: '2025-01-12' }
                            ]
                        }
                    ]
                },
                aws: {
                    id: 'aws',
                    title: 'Amazon AWS',
                    description: 'Explore AWS cloud services and architecture',
                    is_locked: true,
                    totalitems: 15,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'AWS CLOUD ESSENTIALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'AWS Global Infrastructure', display_order: 1, slug: 'aws-infrastructure', is_locked: true, upload_date: '2025-01-05' },
                                { id: 'sim-1-2', title: 'EC2 Instances', display_order: 2, slug: 'aws-ec2', is_locked: true, upload_date: '2025-01-06' },
                                { id: 'sim-1-3', title: 'S3 Storage', display_order: 3, slug: 'aws-s3', is_locked: true, upload_date: '2025-01-07' }
                            ]
                        }
                    ]
                },
                python: {
                    id: 'python',
                    title: 'Python',
                    description: 'Master Python programming fundamentals',
                    is_locked: true,
                    totalitems: 10,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'PYTHON BASICS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Python Syntax and Variables', display_order: 1, slug: 'python-syntax', is_locked: true, upload_date: '2025-01-01' },
                                { id: 'sim-1-2', title: 'Data Types and Operators', display_order: 2, slug: 'python-datatypes', is_locked: true, upload_date: '2025-01-02' },
                                { id: 'sim-1-3', title: 'Control Flow', display_order: 3, slug: 'python-control-flow', is_locked: true, upload_date: '2025-01-03' }
                            ]
                        }
                    ]
                },
                docker: {
                    id: 'docker',
                    title: 'Docker',
                    description: 'Learn containerization with Docker',
                    is_locked: false,
                    totalitems: 6,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'DOCKER FUNDAMENTALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Introduction to Containers', display_order: 1, slug: 'docker-intro', is_locked: false, upload_date: '2025-02-01' },
                                { id: 'sim-1-2', title: 'Docker Images and Layers', display_order: 2, slug: 'docker-images', is_locked: false, upload_date: '2025-02-02' },
                                { id: 'sim-1-3', title: 'Dockerfile Basics', display_order: 3, slug: 'docker-dockerfile', is_locked: false, upload_date: '2025-02-03' }
                            ]
                        },
                        {
                            id: 'section-2',
                            title: 'DOCKER NETWORKING AND VOLUMES',
                            display_order: 2,
                            simulations: [
                                { id: 'sim-2-1', title: 'Container Networking', display_order: 1, slug: 'docker-networking', is_locked: false, upload_date: '2025-02-04' },
                                { id: 'sim-2-2', title: 'Data Persistence with Volumes', display_order: 2, slug: 'docker-volumes', is_locked: false, upload_date: '2025-02-05' },
                                { id: 'sim-2-3', title: 'Docker Compose', display_order: 3, slug: 'docker-compose', is_locked: false, upload_date: '2025-02-06' }
                            ]
                        }
                    ]
                },
                kubernetes: {
                    id: 'kubernetes',
                    title: 'Kubernetes',
                    description: 'Master container orchestration with Kubernetes',
                    is_locked: false,
                    totalitems: 6,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'KUBERNETES BASICS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Introduction to Kubernetes', display_order: 1, slug: 'k8s-intro', is_locked: false, upload_date: '2025-02-07' },
                                { id: 'sim-1-2', title: 'Pods and Deployments', display_order: 2, slug: 'k8s-pods', is_locked: false, upload_date: '2025-02-08' },
                                { id: 'sim-1-3', title: 'Services and Networking', display_order: 3, slug: 'k8s-services', is_locked: false, upload_date: '2025-02-09' }
                            ]
                        },
                        {
                            id: 'section-2',
                            title: 'KUBERNETES ADVANCED',
                            display_order: 2,
                            simulations: [
                                { id: 'sim-2-1', title: 'ConfigMaps and Secrets', display_order: 1, slug: 'k8s-config', is_locked: false, upload_date: '2025-02-10' },
                                { id: 'sim-2-2', title: 'Persistent Storage', display_order: 2, slug: 'k8s-storage', is_locked: false, upload_date: '2025-02-11' },
                                { id: 'sim-2-3', title: 'Helm Charts', display_order: 3, slug: 'k8s-helm', is_locked: false, upload_date: '2025-02-12' }
                            ]
                        }
                    ]
                },
                terraform: {
                    id: 'terraform',
                    title: 'Terraform',
                    description: 'Infrastructure as Code with Terraform',
                    is_locked: false,
                    totalitems: 6,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'TERRAFORM FUNDAMENTALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Introduction to IaC', display_order: 1, slug: 'terraform-intro', is_locked: false, upload_date: '2025-02-13' },
                                { id: 'sim-1-2', title: 'HCL Syntax and Providers', display_order: 2, slug: 'terraform-hcl', is_locked: false, upload_date: '2025-02-14' },
                                { id: 'sim-1-3', title: 'Resources and Data Sources', display_order: 3, slug: 'terraform-resources', is_locked: false, upload_date: '2025-02-15' }
                            ]
                        },
                        {
                            id: 'section-2',
                            title: 'TERRAFORM STATE AND MODULES',
                            display_order: 2,
                            simulations: [
                                { id: 'sim-2-1', title: 'State Management', display_order: 1, slug: 'terraform-state', is_locked: false, upload_date: '2025-02-16' },
                                { id: 'sim-2-2', title: 'Modules and Reusability', display_order: 2, slug: 'terraform-modules', is_locked: false, upload_date: '2025-02-17' },
                                { id: 'sim-2-3', title: 'Terraform Cloud', display_order: 3, slug: 'terraform-cloud', is_locked: false, upload_date: '2025-02-18' }
                            ]
                        }
                    ]
                },
                gcp: {
                    id: 'gcp',
                    title: 'Google Cloud',
                    description: 'Explore Google Cloud Platform services',
                    is_locked: false,
                    totalitems: 6,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'GCP ESSENTIALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'GCP Overview and Console', display_order: 1, slug: 'gcp-overview', is_locked: false, upload_date: '2025-02-19' },
                                { id: 'sim-1-2', title: 'Compute Engine', display_order: 2, slug: 'gcp-compute', is_locked: false, upload_date: '2025-02-20' },
                                { id: 'sim-1-3', title: 'Cloud Storage', display_order: 3, slug: 'gcp-storage', is_locked: false, upload_date: '2025-02-21' }
                            ]
                        },
                        {
                            id: 'section-2',
                            title: 'GCP NETWORKING AND IAM',
                            display_order: 2,
                            simulations: [
                                { id: 'sim-2-1', title: 'VPC and Networking', display_order: 1, slug: 'gcp-vpc', is_locked: false, upload_date: '2025-02-22' },
                                { id: 'sim-2-2', title: 'IAM and Security', display_order: 2, slug: 'gcp-iam', is_locked: false, upload_date: '2025-02-23' },
                                { id: 'sim-2-3', title: 'Cloud Functions', display_order: 3, slug: 'gcp-functions', is_locked: false, upload_date: '2025-02-24' }
                            ]
                        }
                    ]
                },
                frontend: {
                    id: 'frontend',
                    title: 'Front End',
                    description: 'Build modern web interfaces',
                    is_locked: true,
                    totalitems: 8,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'HTML AND CSS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'HTML Structure', display_order: 1, slug: 'frontend-html', is_locked: true, upload_date: '2025-01-08' },
                                { id: 'sim-1-2', title: 'CSS Styling', display_order: 2, slug: 'frontend-css', is_locked: true, upload_date: '2025-01-09' }
                            ]
                        }
                    ]
                },
                ai: {
                    id: 'ai',
                    title: 'AI',
                    description: 'Artificial Intelligence concepts and applications',
                    is_locked: true,
                    totalitems: 9,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'AI FUNDAMENTALS',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'Introduction to AI', display_order: 1, slug: 'ai-intro', is_locked: true, upload_date: '2025-01-12' },
                                { id: 'sim-1-2', title: 'Machine Learning Basics', display_order: 2, slug: 'ai-ml-basics', is_locked: true, upload_date: '2025-01-13' }
                            ]
                        }
                    ]
                },
                backend: {
                    id: 'backend',
                    title: 'Backend',
                    description: 'Server-side development and APIs',
                    is_locked: true,
                    totalitems: 11,
                    sections: [
                        {
                            id: 'section-1',
                            title: 'BACKEND ARCHITECTURE',
                            display_order: 1,
                            simulations: [
                                { id: 'sim-1-1', title: 'RESTful APIs', display_order: 1, slug: 'backend-rest', is_locked: true, upload_date: '2025-01-14' },
                                { id: 'sim-1-2', title: 'Database Design', display_order: 2, slug: 'backend-database', is_locked: true, upload_date: '2025-01-15' }
                            ]
                        }
                    ]
                }
            },
            recentSimulations: [
                { id: 'sim-1-1', course_id: 'azure', title: 'Principles of Cloud Computing', slug: 'azure-cloud-principles' },
                { id: 'sim-1-2', course_id: 'azure', title: 'Cloud Service Delivery Models', slug: 'azure-service-models' },
                { id: 'sim-1-1', course_id: 'linux', title: 'Introduction to Linux', slug: 'linux-intro' },
                { id: 'sim-1-1', course_id: 'python', title: 'Python Syntax and Variables', slug: 'python-syntax' },
                { id: 'sim-1-1', course_id: 'aws', title: 'AWS Global Infrastructure', slug: 'aws-infrastructure' }
            ]
        };

        // Mock API helper functions
        function getMockCourses() {
            return { courses: MOCK_DATA.courses };
        }

        function getMockCategories() {
            return { categories: MOCK_DATA.categories };
        }

        function getMockCourse(courseId) {
            if (!courseId) {
                console.error('[MOCK DATA] No courseId provided');
                return null;
            }

            console.log('[MOCK DATA] Looking up course with ID:', courseId, 'Type:', typeof courseId);
            const availableKeys = Object.keys(MOCK_DATA.courseData);
            console.log('[MOCK DATA] Available course keys:', availableKeys);
            console.log('[MOCK DATA] Available course keys (lowercase):', availableKeys.map(k => k.toLowerCase()));

            // Normalize the input courseId - convert to string and trim
            const normalizedId = String(courseId).trim();
            const lowerId = normalizedId.toLowerCase();

            // Strategy 1: Direct match (exact, case-sensitive)
            if (MOCK_DATA.courseData[normalizedId]) {
                console.log('[MOCK DATA] ✓ Found by direct match:', normalizedId);
                return MOCK_DATA.courseData[normalizedId];
            }

            // Strategy 2: Case-insensitive match
            for (const key of availableKeys) {
                if (key.toLowerCase() === lowerId) {
                    console.log('[MOCK DATA] ✓ Found by case-insensitive match:', key, 'for input:', courseId);
                    return MOCK_DATA.courseData[key];
                }
            }

            // Strategy 3: Strip common prefixes/suffixes
            const cleanId = lowerId.replace(/^(skill-based|role-based|research-papers)[\/-]?/i, '').replace(/[\/-]?1$/, '').trim();
            if (cleanId !== lowerId) {
                console.log('[MOCK DATA] Trying cleaned ID:', cleanId);
                for (const key of availableKeys) {
                    if (key.toLowerCase() === cleanId) {
                        console.log('[MOCK DATA] ✓ Found by cleaned match:', key, 'for input:', courseId);
                        return MOCK_DATA.courseData[key];
                    }
                }
            }

            // Strategy 4: Partial match (contains)
            for (const key of availableKeys) {
                const keyLower = key.toLowerCase();
                if (keyLower.includes(lowerId) || lowerId.includes(keyLower)) {
                    console.log('[MOCK DATA] ✓ Found by partial match:', key, 'for input:', courseId);
                    return MOCK_DATA.courseData[key];
                }
            }

            // Strategy 5: Try matching by removing numbers
            const noNumbersId = lowerId.replace(/\d+/g, '').trim();
            if (noNumbersId && noNumbersId !== lowerId) {
                console.log('[MOCK DATA] Trying ID without numbers:', noNumbersId);
                for (const key of availableKeys) {
                    if (key.toLowerCase().replace(/\d+/g, '') === noNumbersId) {
                        console.log('[MOCK DATA] ✓ Found by number-stripped match:', key, 'for input:', courseId);
                        return MOCK_DATA.courseData[key];
                    }
                }
            }

            console.error('[MOCK DATA] ✗ Course not found after all strategies:', courseId);
            console.error('[MOCK DATA] Tried:', normalizedId, lowerId, cleanId, noNumbersId);
            return null;
        }

        function getMockSimulation(slug) {
            // Find simulation across all courses
            for (const courseId in MOCK_DATA.courseData) {
                const course = MOCK_DATA.courseData[courseId];
                for (const section of course.sections || []) {
                    for (const sim of section.simulations || []) {
                        if (sim.slug === slug) {
                            return {
                                id: sim.id,
                                title: sim.title,
                                slug: sim.slug,
                                course_id: courseId,
                                content: `<div style="padding: 40px; text-align: center; background: #1a1a1a; color: #fff; border-radius: 8px;">
                                    <h2>Simulation: ${sim.title}</h2>
                                    <p style="margin-top: 20px; opacity: 0.8;">This is a mock simulation viewer for local development.</p>
                                    <div style="margin-top: 30px; padding: 20px; background: #000; border-radius: 8px; border: 1px solid #333;">
                                        <p style="font-size: 14px; opacity: 0.7;">Simulation content would appear here in production.</p>
                                    </div>
                                </div>`,
                                is_locked: sim.is_locked
                            };
                        }
                    }
                }
            }
            return null;
        }

        function getMockRecentSimulations(limit = 5) {
            return MOCK_DATA.recentSimulations.slice(0, limit);
        }

        // ===== api client class =====
        class LearningPlatformApi {
            constructor(config) {
                this.baseUrl = config.baseUrl;
                this.timeout = config.timeout;
                this.retryAttempts = config.retryAttempts;
            }

            async request(endpoint, options = {}) {
                const url = `${this.baseUrl}${endpoint}`;
                const controller = new AbortController();
                const token = AccessState.authToken;

                const headers = {
                    'Content-Type': 'application/json',
                    ...options.headers
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const config = {
                    credentials: 'include',
                    ...options,
                    headers
                };

                try {
                    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

                    // Handle 204 No Content
                    if (response.status === 204) return null;

                    const data = await response.json().catch(() => null);

                    if (!response.ok) {
                        const errorMsg = data?.error?.message || data?.error || `HTTP ${response.status}`;
                        throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
                    }

                    return data;
                } catch (err) {
                    console.error(`API Request failed: ${endpoint}`, err);
                    throw err;
                }
            }

            async getcourse(courseid) {
                if (USE_MOCK_DATA) {
                    console.log('[API] getcourse called with courseid:', courseid, 'Type:', typeof courseid, '(USE_MOCK_DATA=true)');
                    const mockCourse = getMockCourse(courseid);
                    if (mockCourse) {
                        console.log('[API] ✓ Returning mock course data for:', courseid);
                        return Promise.resolve(mockCourse);
                    }
                    console.error('[API] ✗ Mock course not found for:', courseid);
                    // Return null instead of throwing - let the fallback handle it
                    return Promise.resolve(null);
                }
                return this.request(`/api/courses/${courseid}?t=${Date.now()}`);
            }

            async getsimulation(slug) {
                if (USE_MOCK_DATA) {
                    const mockSim = getMockSimulation(slug);
                    if (mockSim) {
                        return Promise.resolve(mockSim);
                    }
                    throw new Error(`Simulation ${slug} not found in mock data`);
                }
                return this.request(`/api/simulations/${slug}`);
            }

            async incrementview(simid) {
                if (USE_MOCK_DATA) return Promise.resolve({ views: 0 });
                return this.request(`/api/views/${simid}`, { method: 'post' });
            }

            async togglelike(simid) {
                return this.request(`/api/likes/${simid}`, { method: 'post' });
            }

            async toggledislike(simid) {
                return this.request(`/api/dislikes/${simid}`, { method: 'post' });
            }

            async reportsimulation(simid) {
                return this.request(`/api/reports/${simid}`, { method: 'post' });
            }

            async getcomments(simid) {
                return this.request(`/api/comments/${simid}`, { method: 'get' });
            }

            async postcomment(simid, comment) {
                return this.request(`/api/comments/${simid}`, {
                    method: 'post',
                    body: JSON.stringify(comment)
                });
            }

            async upvotecomment(commentid) {
                return this.request(`/api/comments/${commentid}/upvote`, { method: 'post' });
            }

            async login(payload) {
                return this.request('/api/auth/login', {
                    method: 'post',
                    body: JSON.stringify(payload)
                });
            }

            async register(payload) {
                return this.request('/api/auth/register', {
                    method: 'post',
                    body: JSON.stringify(payload)
                });
            }

            async me(token) {
                return this.request('/api/auth/me', {
                    method: 'get',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            async logout(token) {
                return this.request('/api/auth/logout', {
                    method: 'post',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            async search(query, courseid = '') {
                const params = new URLSearchParams({ q: query });
                if (courseid) params.append('course', courseid);
                return this.request(`/api/search?${params}`);
            }

            async getrecentsimulations(limit = 10) {
                if (USE_MOCK_DATA) {
                    return Promise.resolve(getMockRecentSimulations(limit));
                }
                return this.request(`/api/recent?limit=${limit}`);
            }

            async getbookmarks() {
                return this.request('/api/bookmarks', { method: 'get' });
            }

            async togglebookmark(simid) {
                return this.request(`/api/bookmarks/${simid}`, { method: 'post' });
            }

            getsimulationurl(filepath) {
                return `${this.baseUrl}/${filepath}`;
            }
        }

        const api = new LearningPlatformApi(API_CONFIG);

        // ===== SIMULATION TOKEN HANDLER =====
        // Listen for token requests from simulation iframe shells
        window.addEventListener('message', async function(e) {
            if (e.data && e.data.type === 'sim-token-request' && e.data.path) {
                try {
                    const resp = await fetch(`${API_CONFIG.baseUrl}/api/sim-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: e.data.path })
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        // Send token back to the iframe
                        if (e.source) {
                            e.source.postMessage({ type: 'sim-token-response', token: data.token }, '*');
                        }
                    }
                } catch (err) {
                    console.error('Failed to get sim token:', err);
                }
            }
        });

        // ===== cached api wrapper =====
        class ApiCache {
            constructor(ttl = 300000) {
                this.cache = new Map();
                this.ttl = ttl;
            }
            get(key) {
                const item = this.cache.get(key);
                if (!item || Date.now() > item.expiry) return null;
                return item.data;
            }
            set(key, data) {
                this.cache.set(key, { data, expiry: Date.now() + this.ttl });
            }
        }

        const apiCache = new ApiCache();
        const cachedapi = {
            async getcourse(courseid) {
                const cachekey = `course:${courseid}`;
                let data = apiCache.get(cachekey);
                if (!data) {
                    data = await api.getcourse(courseid);
                    // Only cache if we got valid data (don't cache null/errors)
                    if (data) {
                        apiCache.set(cachekey, data);
                    } else if (USE_MOCK_DATA) {
                        // If API returned null and we're using mock data, try direct lookup
                        console.log('[cachedapi] API returned null, trying direct mock lookup');
                        data = getMockCourse(courseid);
                        if (data) {
                            apiCache.set(cachekey, data);
                        }
                    }
                }
                return data;
            },
            async incrementview(simid) {
                return api.incrementview(simid);
            },
            async getrecentsimulations(limit = 10) {
                const cachekey = `recent:${limit}`;
                let data = apiCache.get(cachekey);
                if (!data) {
                    data = await api.getrecentsimulations(limit);
                    apiCache.set(cachekey, data);
                }
                return data;
            }
        };

        window.learningapi = { api, cachedapi };

        // ===== bookmark state =====
        const BookmarkState = {
            items: [],
            simIds: new Set(),
            // Topic-level bookmark keys: <courseId>:<topicId>
            topicBookmarks: new Map()
        };
        window.bookmarkState = BookmarkState;

        // Track currently active topic for bookmark (especially needed on mobile where sidebar is hidden)
        window.currentActiveTopic = { courseId: null, topicId: null };

          // Mock bookmarks removed - bookmark state starts empty
          // Real bookmarks are loaded from API when user is logged in

        // Helper function to normalize courseId (always lowercase)
        function normalizeCourseId(courseId) {
            return (courseId || '').toString().toLowerCase().trim();
        }

        // Helper function to create topic-level bookmark key
        function getBookmarkKey(courseId, topicId) {
            const normalizedCourseId = normalizeCourseId(courseId);
            return `${normalizedCourseId}:${topicId}`;
        }

        // Helper function to check if topic is bookmarked
        function isTopicBookmarked(courseId, topicId) {
            if (!courseId || !topicId) return false;
            const key = getBookmarkKey(courseId, topicId);
            return BookmarkState.topicBookmarks.has(key);
        }

        // Helper function to set topic bookmark state
        function setTopicBookmark(courseId, topicId, bookmarked, meta) {
            if (!courseId || !topicId) return;
            const key = getBookmarkKey(courseId, topicId);
            if (bookmarked) {
                BookmarkState.topicBookmarks.set(key, true);
            } else {
                BookmarkState.topicBookmarks.delete(key);
            }
            // Persist to localStorage
            try {
                const stored = JSON.parse(localStorage.getItem('lp_bookmarks') || '{}');
                if (bookmarked) {
                    stored[key] = { courseId, topicId, ts: Date.now(), title: meta?.title || topicId, courseTitle: meta?.courseTitle || courseId, filePath: meta?.filePath || '', slug: meta?.slug || '' };
                } else {
                    delete stored[key];
                }
                localStorage.setItem('lp_bookmarks', JSON.stringify(stored));
            } catch(e) { console.warn('bookmark persist failed', e); }
        }

        // Load bookmarks from localStorage on init
        (function loadLocalBookmarks() {
            try {
                const stored = JSON.parse(localStorage.getItem('lp_bookmarks') || '{}');
                for (const [key, val] of Object.entries(stored)) {
                    BookmarkState.topicBookmarks.set(key, true);
                    if (val.topicId) BookmarkState.simIds.add(val.topicId);
                }
            } catch(e) { console.warn('bookmark load failed', e); }
        })();

        // initialize icons
        if (window.lucide) lucide.createIcons();

        // ===== resizable sidebar functions =====

        // initialize main sidebar resize
        function initsidebarresize() {
            // Resize handle removed - function disabled
            return;
            const sidebar = document.getElementById('main-sidebar');
            const handle = document.getElementById('sidebar-resize-handle');

            if (!sidebar || !handle) return;

            // check if already initialized to prevent duplicate listeners
            if (handle.dataset.resizeinitialized === 'true') {
                return;
            }
            handle.dataset.resizeinitialized = 'true';

            // use a unique identifier for this resize session
            const resizeid = 'main-sidebar-resize';
            let isresizing = false;
            let startx, startwidth;

            // use default width (230px) - don't restore from localstorage

            const handlemousedown = (e) => {
                // only allow one resize operation at a time globally
                if (window._globalresizing) return;
                window._globalresizing = resizeid;

                isresizing = true;
                startx = e.clientX;
                startwidth = sidebar.offsetWidth;
                document.body.classList.add('resizing');
                handle.classList.add('dragging');
                e.preventDefault();
                e.stopPropagation();
            };

            const handlemousemove = (e) => {
                // only process if this is the active resize session
                if (!isresizing || window._globalresizing !== resizeid) {
                    if (isresizing && window._globalresizing !== resizeid) {
                        // another resize started, stop this one
                        isresizing = false;
                        document.body.classList.remove('resizing');
                        handle.classList.remove('dragging');
                    }
                    return;
                }

                const diff = e.clientX - startx;
                const newwidth = Math.max(60, Math.min(400, startwidth + diff));
                sidebar.style.width = newwidth + 'px';

                // auto-collapse if very small
                if (newwidth <= 80) {
                    sidebar.classList.add('collapsed');
                } else {
                    sidebar.classList.remove('collapsed');
                }
            };

            const handlemouseup = () => {
                // only process if this is the active resize session
                if (isresizing && window._globalresizing === resizeid) {
                    isresizing = false;
                    window._globalresizing = null;
                    document.body.classList.remove('resizing');
                    handle.classList.remove('dragging');
                }
            };

            // store handlers on the handle element
            handle._resizehandlers = {
                mousedown: handlemousedown,
                mousemove: handlemousemove,
                mouseup: handlemouseup
            };

            handle.addEventListener('mousedown', handlemousedown);
            document.addEventListener('mousemove', handlemousemove);
            document.addEventListener('mouseup', handlemouseup);

            // also handle mouseleave and blur to ensure we stop resizing
            document.addEventListener('mouseleave', handlemouseup);
            window.addEventListener('blur', handlemouseup);
        }
        window.initsidebarresize = initsidebarresize;

        // initialize course contents sidebar resize
        function initchaptersidebarresize(courseid) {
            // Resize handle removed - function disabled
            return;
            const sidebar = document.getElementById(`chapter-sidebar-${courseid}`);
            const handle = document.getElementById(`chapter-resize-${courseid}`);
            const coursecontainer = sidebar?.closest('.course-container');

            if (!sidebar || !handle || !coursecontainer) return;

            if (handle.dataset.resizeinitialized === 'true') return;
            handle.dataset.resizeinitialized = 'true';

            const resizeid = `chapter-sidebar-${courseid}-resize`;
            let isresizing = false;
            let startx, startwidth;

            const handlepointerdown = (e) => {
                if (window._globalresizing) return;
                window._globalresizing = resizeid;

                isresizing = true;
                startx = e.clientX;
                startwidth = sidebar.offsetWidth;
                document.body.classList.add('resizing');
                handle.classList.add('dragging');
                handle.setPointerCapture?.(e.pointerId);
                e.preventDefault();
                e.stopPropagation();
            };

            const handlepointermove = (e) => {
                if (!isresizing || window._globalresizing !== resizeid) {
                    if (isresizing && window._globalresizing !== resizeid) {
                        isresizing = false;
                        document.body.classList.remove('resizing');
                        handle.classList.remove('dragging');
                    }
                    return;
                }

                const diff = e.clientX - startx;
                const maxwidth = Math.min(520, coursecontainer.offsetWidth - 280);
                const newwidth = Math.max(180, Math.min(maxwidth, startwidth + diff));
                sidebar.style.width = newwidth + 'px';

                if (newwidth <= 100) {
                    sidebar.classList.add('collapsed');
                    coursecontainer.classList.add('sidebar-collapsed');
                } else {
                    sidebar.classList.remove('collapsed');
                    coursecontainer.classList.remove('sidebar-collapsed');
                }
            };

            const handlepointerup = (e) => {
                if (isresizing && window._globalresizing === resizeid) {
                    isresizing = false;
                    window._globalresizing = null;
                    document.body.classList.remove('resizing');
                    handle.classList.remove('dragging');
                    handle.releasePointerCapture?.(e.pointerId);

                    const width = sidebar.classList.contains('collapsed') ? 0 : sidebar.offsetWidth;
                    localStorage.setItem(`chaptersidebarwidth:${courseid}`, String(width));
                }
            };

            handle.addEventListener('pointerdown', handlepointerdown);
            document.addEventListener('pointermove', handlepointermove);
            document.addEventListener('pointerup', handlepointerup);
            document.addEventListener('pointercancel', handlepointerup);
            document.addEventListener('mouseleave', handlepointerup);
            window.addEventListener('blur', handlepointerup);

            const savedwidth = parseInt(localStorage.getItem(`chaptersidebarwidth:${courseid}`) || '300', 10);
            if (savedwidth <= 100) {
                sidebar.classList.add('collapsed');
                coursecontainer.classList.add('sidebar-collapsed');
                sidebar.style.width = '0px';
            } else {
                sidebar.style.width = `${savedwidth}px`;
            }
        }
        window.initchaptersidebarresize = initchaptersidebarresize;


        // expand chapter sidebar (called from expand handle)
        function expandchaptersidebar(courseid) {
            const sidebar = document.getElementById(`chapter-sidebar-${courseid}`);
            const coursecontainer = sidebar?.closest('.course-container');
            if (sidebar && coursecontainer) {
                sidebar.classList.remove('collapsed');
                coursecontainer.classList.remove('sidebar-collapsed');
                const savedwidth = parseInt(localStorage.getItem(`chaptersidebarwidth:${courseid}`) || '300', 10);
                const width = savedwidth > 100 ? savedwidth : 300;
                sidebar.style.width = `${width}px`;
                if (window.lucide) lucide.createIcons();
            }
        }
        window.expandchaptersidebar = expandchaptersidebar;

        // toggle sidebar category (course groups)
        function togglesidebarcategory(categoryid) {
            const header = document.getElementById(`sidebar-header-${categoryid}`);
            const menu = document.getElementById(`menu-${categoryid}`);

            if (header && menu) {
                header.classList.toggle('collapsed');
                menu.classList.toggle('collapsed');

                // save state: true = collapsed, false = expanded
                const collapsedcategories = JSON.parse(localStorage.getItem('collapsedcategories') || '{}');
                collapsedcategories[categoryid] = header.classList.contains('collapsed');
                localStorage.setItem('collapsedcategories', JSON.stringify(collapsedcategories));
            }
        }
        window.togglesidebarcategory = togglesidebarcategory;

        function toggleexpandcourses(categoryid) {
            const menu = document.getElementById(`menu-${categoryid}`);
            const button = document.getElementById(`expand-${categoryid}`);
            if (!menu || !button) return;

            const expanded = menu.classList.toggle('expanded');
            button.textContent = expanded ? 'Show less' : button.getAttribute('data-expand-label');
        }
        window.toggleexpandcourses = toggleexpandcourses;

        // toggle course section (within course content)
        function togglecoursesection(sectionid) {
            const header = document.getElementById(`header-${sectionid}`);
            const items = document.getElementById(`items-${sectionid}`);

            if (header && items) {
                header.classList.toggle('collapsed');
                items.classList.toggle('collapsed');

                // save collapsed state
                const collapsedsections = JSON.parse(localStorage.getItem('collapsedsections') || '{}');
                collapsedsections[sectionid] = header.classList.contains('collapsed');
                localStorage.setItem('collapsedsections', JSON.stringify(collapsedsections));
            }
        }
        window.togglecoursesection = togglecoursesection;

        // restore collapsed states on page load
        function restorecollapsedstates() {
            // always collapse all category headers/menus on page load
            document.querySelectorAll('[id^="sidebar-header-"]').forEach(header => {
                const catid = header.id.replace('sidebar-header-', '');
                const menu = document.getElementById(`menu-${catid}`);
                header.classList.add('collapsed');
                if (menu) menu.classList.add('collapsed');
            });

            // restore section collapsed states — default is collapsed; un-collapse only explicitly expanded ones
            const collapsedsections = JSON.parse(localStorage.getItem('collapsedsections') || '{}');
            document.querySelectorAll('[id^="header-"]').forEach(header => {
                const sectionid = header.id.replace('header-', '');
                const items = document.getElementById(`items-${sectionid}`);
                if (collapsedsections[sectionid] === false) {
                    // user explicitly expanded — remove collapsed
                    header.classList.remove('collapsed');
                    if (items) items.classList.remove('collapsed');
                } else {
                    // default: collapsed
                    header.classList.add('collapsed');
                    if (items) items.classList.add('collapsed');
                }
            });
        }
        window.restorecollapsedstates = restorecollapsedstates;

        // --- data structures (deprecated - will be removed) ---
        // hardcoded data removed - now loaded from api

        // --- dynamic course loader ---
        async function loadandrendercourse(courseid, containerid, title, iconclass, sectionId = null) {
            console.log('[loadandrendercourse] Called with courseid:', courseid, 'containerid:', containerid, 'title:', title, 'sectionId:', sectionId);
            const container = document.getElementById(containerid);
            if (!container) {
                console.error('[loadandrendercourse] Container not found:', containerid);
                return;
            }

            // Skip loading state in mock mode - render immediately
            if (!USE_MOCK_DATA) {
                // show loading state only when using live API
                container.innerHTML = `
                    <div class="course-header">
                        <div class="course-logo"><i class="${iconclass}"></i></div>
                        <div class="course-title">${title}</div>
                    </div>
                    <div style="padding: 40px; text-align: center; color: #666;">
                        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 16px;">loading course content...</p>
                    </div>
                `;
            }

            try {
                let coursedata = await window.learningapi.cachedapi.getcourse(courseid);

                // If API fails and using mock data, try direct lookup
                if (!coursedata && USE_MOCK_DATA) {
                    console.log('[loadandrendercourse] API returned null, trying direct mock data lookup for:', courseid);
                    coursedata = getMockCourse(courseid);
                    if (coursedata) {
                        console.log('[loadandrendercourse] Found course in mock data directly:', courseid);
                    }
                }

                if (!coursedata) {
                    throw new Error(`Course ${courseid} not found`);
                }

                console.log('[loadandrendercourse] Rendering course view with data:', coursedata);
                rendercourseview(coursedata, containerid, title, iconclass, courseid, sectionId);
                return coursedata.totalitems || 0;
            } catch (error) {
                console.error(`[loadandrendercourse] failed to load ${courseid}:`, error);

                // LAST RESORT: Try direct mock data lookup even in catch block
                if (USE_MOCK_DATA) {
                    console.log('[loadandrendercourse] Error caught, trying direct mock lookup as last resort');
                    const directMockData = getMockCourse(courseid);
                    if (directMockData) {
                        console.log('[loadandrendercourse] Found in mock data, rendering anyway');
                        try {
                            rendercourseview(directMockData, containerid, title, iconclass, courseid);
                            return directMockData.totalitems || 0;
                        } catch (renderError) {
                            console.error('[loadandrendercourse] Error rendering mock data:', renderError);
                            // Even if render fails, try to show something - use empty sections
                            directMockData.sections = directMockData.sections || [];
                            try {
                                rendercourseview(directMockData, containerid, title, iconclass, courseid);
                                return directMockData.totalitems || 0;
                            } catch (e) {
                                console.error('[loadandrendercourse] Final render attempt failed:', e);
                            }
                        }
                    }
                }

                // NO ERROR UI - just render empty course
                const emptyCourseData = {
                    id: courseid,
                    title: title,
                    description: '',
                    is_locked: true,
                    totalitems: 0,
                    sections: []
                };
                try {
                    rendercourseview(emptyCourseData, containerid, title, iconclass, courseid);
                    return 0;
                } catch (e) {
                    console.error('[loadandrendercourse] Could not render empty course:', e);
                    return 0;
                }
            }
        }

        function getlockedmessagehtml() {
            const lockedmessagetext = 'Please login to view the premium content';
            return `
                        <div class="locked-message-wrapper">
                            <div class="chapter-locked-message">${lockedmessagetext}</div>
                        </div>
                    `;
        }

        function rendercourseview(coursedata, containerid, title, iconclass, courseid, sectionId = null) {
            console.log('rendercourseview called for:', containerid, 'with data:', coursedata, 'sectionId:', sectionId);  // debug
            const container = document.getElementById(containerid);
            console.log('container element:', container);  // debug
            if (!container) return;

            const viewerid = `viewer-screen-${courseid}`; // unique id
            const coursedescription = (coursedata?.description || '').trim() || 'Explore this course overview and start your journey from the sections on the left.';
            const iscourselocked = false;
            const isunlocked = true;
            const isloggedin = true;
            const showcourselock = false;
            const coursetitlehtml = title;
            const lockedmessagehtml = getlockedmessagehtml();

            // handle empty courses (no sections)
            if (!coursedata.sections || coursedata.sections.length === 0) {
                container.innerHTML = `
                            <div class="course-header">
                                <div class="course-logo"><i class="${iconclass}"></i></div>
                                <div class="course-title">${coursetitlehtml}</div>
                            </div>
                            <div style="padding: 60px 40px; text-align: center; color: #666;">
                                <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                                <h3 style="margin-bottom: 8px; color: #333;">No content yet</h3>
                                <p style="margin-bottom: 20px;">This course doesn't have any sections yet.</p>
                            </div>
                        `;
                if (window.lucide) lucide.createIcons();
                return;
            }

            // get latest upload date from all simulations
            let latestuploaddate = null;
            const sections = coursedata.sections || [];
            sections.forEach(section => {
                if (section && section.simulations) {
                    section.simulations.forEach(sim => {
                        if (sim && sim.upload_date) {
                            const uploaddate = new Date(sim.upload_date);
                            if (!latestuploaddate || uploaddate > latestuploaddate) {
                                latestuploaddate = uploaddate;
                            }
                        }
                    });
                }
            });

            // format date for display (e.g., "dec 2025" or "jan 2026")
            const formatuploaddate = (date) => {
                if (!date) return 'Dec 2025'; // default
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months[date.getMonth()];
                const year = date.getFullYear();
                return `${month} ${year}`;
            };
            const displaydate = formatuploaddate(latestuploaddate);

            let chapterhtml = '';
            sections.forEach((section, sidx) => {
                if (!section) return;
                const sectionnumber = section.display_order || (sidx + 1);
                const sectiontitle = section.title || `Section ${sectionnumber}`;
                const sectionid = section.id || `section-${courseid}-${sidx}`;
                const sectionlocked = false;
                const sectionlockicon = '';

                // section header - if title already starts with a number, show as-is; otherwise prepend section number
                const hasOwnSectionNum = /^\d+[\.\-\:\s]/.test(sectiontitle.trim());
                const displaySectionTitle = hasOwnSectionNum ? sectiontitle : `${sectionnumber}: ${sectiontitle}`;
                chapterhtml += `
                            <div class="chapter-section-header" id="header-${sectionid}" onclick="togglecoursesection('${sectionid}')">
                                <span class="chapter-section-header-text">${displaySectionTitle}</span>
                                <i data-lucide="chevron-down" class="chapter-section-chevron"></i>
                            </div>
                            <div class="chapter-section-items" id="items-${sectionid}">
                        `;

                // Handle both 'items' and 'simulations' (mock data uses 'simulations')
                const items = section.items || section.simulations || [];
                items.forEach((item, iidx) => {
                    if (!item) return;
                    const itemnumber = item.display_order || (iidx + 1);
                    const indexstr = `${sectionnumber}.${itemnumber}`;
                    const itemlocked = false;
                    const itemlockicon = '';
                    const itemName = item.name || item.title || `Topic ${itemnumber}`;
                    const itemSlug = item.slug || '';
                    const itemId = item.id || `sim-${sectionnumber}-${itemnumber}`;

                    // If item name already starts with a numbering pattern (e.g. "1.1" or "1.1.A"), skip auto badge
                    const hasOwnNumbering = /^\d+[\.\-]/.test(itemName.trim());
                    const badgeHtml = hasOwnNumbering ? '' : `<span class="chapter-badge">${indexstr}</span>`;

                    chapterhtml += `
                            <div class="chapter-item${itemlocked ? ' locked' : ''}" onclick="selectchapter(this)" 
                                data-course-id="${courseid}"
                                data-sim-id="${itemId}"
                                data-slug="${itemSlug}"
                                data-link="${itemlocked ? '' : (window._simEncode ? window._simEncode(item.link || '') : (item.link || ''))}"
                                data-locked="${itemlocked ? 'true' : 'false'}"
                                data-views="${item.views ?? '0'}"
                                data-likes="${item.likes ?? '0'}"
                                data-dislikes="${item.dislikes ?? '0'}"
                                data-reports="${item.reports ?? '0'}"
                                data-search="${(itemName || '').toLowerCase()}"
                                data-viewer-id="${viewerid}">
                            ${badgeHtml}
                            <div class="chapter-info">
                                <div class="chapter-title">${itemName}</div>
                            </div>
                        </div>
                    `;
                });

                chapterhtml += `</div>`; // close chapter-section-items
            });

            // Generate sidebar header for ALL courses with their icon
            const sidebarHeaderHtml = `
                        <div class="sidebar-header-inner">
                            <div class="sidebar-header-icon"><i class="${iconclass}"></i></div>
                            <div class="sidebar-header-title">${coursetitlehtml}</div>
                        </div>
            `;

            const fullhtml = `
                <div class="course-header">
                    <div class="course-logo"><i class="${iconclass}"></i></div>
                    <div class="course-title">${coursetitlehtml}</div>
                </div>
                <div class="course-container">
                    <div class="chapter-sidebar" id="chapter-sidebar-${courseid}">
                        ${sidebarHeaderHtml}
                        <div class="chapter-search-wrapper">
                            <input type="text" class="chapter-search" placeholder="Search course contents..." 
                                   id="${containerid}-search" 
                                   onkeyup="filterchapters(this, '${containerid}')" 
                                   oninput="filterchapters(this, '${containerid}')">
                        </div>
                        <div class="chapter-content">${chapterhtml}</div>
                    </div>
                    <div class="viewer-pane">
                        <!-- Mobile breadcrumb bar for back navigation + context -->
                        <div class="mobile-topic-breadcrumb" id="breadcrumb-${courseid}">
                            <button class="breadcrumb-back-btn" onclick="mobileBackToCourseOutline('${courseid}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <span class="breadcrumb-course-name" id="breadcrumb-course-${courseid}">${coursetitlehtml || courseid}</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-topic-name" id="breadcrumb-topic-${courseid}">Select a topic</span>
                        </div>
                        <!-- expand handle shown when sidebar is collapsed -->
                        <div class="chapter-expand-handle" onclick="expandchaptersidebar('${courseid}')" title="expand sidebar">
                            <i data-lucide="chevron-right"></i>
                        </div>
                          <!-- Dark SaaS-style viewer header -->
                          <div class="viewer-dark-header">
                              <button class="viewer-ghost-btn viewer-bookmark-btn" id="viewer-bookmark-${courseid}" onclick="toggleViewerBookmark('${courseid}')">
                                  <i data-lucide="bookmark" width="16" height="16"></i>
                                  <span>Bookmark</span>
                              </button>
                              <span class="bookmark-toast" id="bookmark-toast-${courseid}">Added to My Bookmarks</span>
                              <div class="viewer-header-title" id="viewer-title-${courseid}">Course overview</div>
                              <button class="viewer-ghost-btn viewer-fullscreen-btn" onclick="togglefullscreen('${viewerid}')">
                                  <i data-lucide="maximize-2" width="16" height="16"></i>
                                  <span>Fullscreen</span>
                              </button>
                          </div>
                        <!-- Rounded iframe container -->
                        <div class="viewer-iframe-wrapper">
                            <div class="viewer-screen" id="${viewerid}">${showcourselock ? lockedmessagehtml : ''}</div>
                        </div>
                        <!-- Hidden metadata (kept for JS compatibility) -->
                        <div class="viewer-title-row" style="display:none;">
                            <div class="viewer-title-section">
                                <div class="viewer-submeta">
                                    <span id="view-counter-${courseid}">Views: -</span>
                                    <span>•</span>
                                    <span id="upload-date-${courseid}">${displaydate}</span>
                                </div>
                            </div>
                            <div class="viewer-actions-row">
                                <div class="like-dislike-group">
                                    <button class="action-btn like-btn" id="like-button-${courseid}" onclick="handlelikeclick('${courseid}')">
                                        <i data-lucide="thumbs-up" width="16"></i>
                                        <span id="like-count-${courseid}">0</span>
                                    </button>
                                    <button class="action-btn dislike-btn" id="dislike-button-${courseid}" onclick="handledislikeclick('${courseid}')">
                                        <i data-lucide="thumbs-down" width="16"></i>
                                        <span id="dislike-count-${courseid}">0</span>
                                    </button>
                                </div>
                                <button class="action-btn save-btn" id="save-button-${courseid}" onclick="handlebookmarkclick('${courseid}', event)" id="bookmark-button-${courseid}">
                                    <i data-lucide="bookmark" width="14"></i>
                                    <span>Save</span>
                                </button>
                                <button class="action-btn feedback-btn" id="feedback-button-${courseid}" onclick="handlereportclick('${courseid}')">
                                    <i data-lucide="flag" width="14"></i>
                                    <span>Feedback</span>
                                </button>
                                <button class="action-btn share-btn" onclick="handleshareclick('${courseid}')">
                                    <i data-lucide="share-2" width="16"></i>
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = fullhtml;

            // collapse all course sections by default; only un-collapse ones user explicitly expanded
            (function collapseCourseSectionsByDefault() {
                const saved = JSON.parse(localStorage.getItem('collapsedsections') || '{}');
                container.querySelectorAll('.chapter-section-header').forEach(header => {
                    const sid = (header.id || '').replace('header-', '');
                    const items = sid ? document.getElementById('items-' + sid) : null;
                    if (saved[sid] === false) {
                        // user explicitly expanded — leave open
                    } else {
                        header.classList.add('collapsed');
                        if (items) items.classList.add('collapsed');
                    }
                });
            })();

            // render landing content if not locked AND no topic is being restored
            const screen = document.getElementById(viewerid);
            if (screen && !showcourselock) {
                // PERMANENT FIX: NEVER show landing page on mobile
                const isMobile = window.matchMedia('(max-width: 900px)').matches;

                // On mobile, skip landing page entirely - show course contents directly
                if (isMobile) {
                    // Clear any landing content immediately
                    screen.classList.remove('has-landing');
                    screen.innerHTML = '';
                    // Ensure viewer-pane is hidden so sidebar shows (course contents)
                    // This is handled by CSS, but we ensure clean state here
                } else {
                    // Desktop: Show landing page as before
                    // Check if we're restoring a topic from URL/localStorage
                    const params = new URLSearchParams(window.location.search);
                    const urlCourse = params.get('course');
                    const urlSim = params.get('sim');
                    const savedCourse = localStorage.getItem('lp_current_course');
                    const savedSim = localStorage.getItem('lp_current_topic');

                    // Skip landing page if restoring a topic OR targeting a section from carousel
                    const isRestoringTopic = (urlCourse === courseid && urlSim) || (savedCourse === courseid && savedSim);
                    const isTargetingSection = sectionId && sectionId !== 'none' && sectionId !== 'null' && sectionId !== '';

                    if (isRestoringTopic || isTargetingSection) {
                        console.log('[rendercourseview] Skipping landing page (Targeting section or restoring topic):', { sectionId, isRestoringTopic });
                        screen.classList.remove('has-landing');
                        screen.innerHTML = ''; // Ensure screen is empty while waiting for content to load
                    } else {
                        console.log('[rendercourseview] Showing landing page for:', courseid);
                        screen.classList.add('has-landing');
                        screen.innerHTML = `
                                    <div class="course-landing">
                                        <h2>Welcome to ${title}</h2>
                                        <p>${coursedescription}</p>
                                        <div class="course-landing-cta">
                                            <i data-lucide="arrow-left" width="16" height="16"></i>
                                            Start your journey by selecting a section on the left.
                                        </div>
                                    </div>
                                `;
                    }
                }
            }

            // increment course landing views
            const courseViewId = `course-${courseid}`;
            window.learningapi?.cachedapi?.incrementview(courseViewId)
                .then(result => {
                    const countel = document.getElementById(`view-counter-${courseid}`);
                    if (countel) countel.textContent = `Views: ${result.views}`;
                })
                .catch(err => console.error('failed to increment course view:', err));

            // fix: reset scroll position for the new viewer pane
            const viewerpane = container.querySelector('.viewer-pane');
            if (viewerpane) viewerpane.scrollTop = 0;

            console.log('html inserted into container:', containerid, 'viewer-screen exists:', !!document.getElementById(viewerid));  // debug
            lucide.createIcons();

            // Update bookmark buttons for all chapter items using topic-level keys
            const view = document.getElementById(containerid);
            if (view) {
                view.querySelectorAll('.chapter-item').forEach(item => {
                    const topicId = item.dataset.simId;
                    let courseId = item.dataset.courseId || courseid;
                    if (topicId && courseId) {
                        // Normalize courseId for consistent bookmark checking
                        courseId = normalizeCourseId(courseId);
                        const bookmarkBtn = item.querySelector('.bookmark-btn');
                        if (bookmarkBtn) {
                            const isBookmarked = isTopicBookmarked(courseId, topicId);
                            bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
                        }
                    }
                });
            }
        }

        // --- unified topic navigation ---
        async function openTopicById(courseId, simId) {
            await switchprovider(courseId);
            selectchapter(simId, courseId);
            // Persist state
            updateurlstate(courseId, simId);
        }
        window.openTopicById = openTopicById;

        // --- chapter interaction ---
        window.selectchapter = function (elOrSimId, courseId) {
            let el;

            // If first arg is a string (simId), find the element
            if (typeof elOrSimId === 'string') {
                const simId = elOrSimId;
                if (!courseId) {
                    console.error('selectchapter: courseId required when using simId');
                    return;
                }
                const view = document.getElementById(`view-${courseId}`);
                if (!view) {
                    console.error(`selectchapter: view not found for course ${courseId}`);
                    return;
                }
                // Try to find by simId first
                el = view.querySelector(`.chapter-item[data-sim-id="${simId}"]`);
                // If not found, try by slug (for backward compatibility)
                if (!el) {
                    el = view.querySelector(`.chapter-item[data-slug="${simId}"]`);
                }
                if (!el) {
                    console.error(`selectchapter: chapter item not found for simId ${simId} in course ${courseId}`);
                    return;
                }
            } else {
                el = elOrSimId;
            }

            console.log('selectchapter called, element:', el);  // debug
            // debug removed for security
            console.log('data-sim-id:', el.dataset.simId);  // debug

            const sidebar = el.closest('.chapter-sidebar');
            sidebar.querySelectorAll('.chapter-item').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');

            const coursecontainer = el.closest('.course-container');
            const actioncenter = coursecontainer.querySelector('.action-center');
            if (actioncenter) {
                let topictitle = el.querySelector('.chapter-title')?.textContent || 'unknown topic';
                topictitle = topictitle.replace(/\s*\(simulation\)\s*/gi, '').trim();
                const hassimulation = el.dataset.link ? ' (simulation)' : '';
                actioncenter.textContent = topictitle + hassimulation;
            }

            // update right-pane title + comments panel
            const _topictitleraw = el.querySelector('.chapter-title')?.textContent || 'unknown topic';
            const _topictitle = _topictitleraw.replace(/\s*\(simulation\)\s*/gi, '').trim();
            const _vieweridtmp = el.dataset.viewerId || '';
            const _courseidtmp = _vieweridtmp.replace('viewer-screen-', '');
            const titleel = document.getElementById(`viewer-title-${_courseidtmp}`);
            if (titleel) titleel.textContent = _topictitle;

            const viewcountel = document.getElementById(`view-counter-${_courseidtmp}`);
            if (viewcountel) {
                const viewsval = el.dataset.views;
                viewcountel.textContent = viewsval ? `Views: ${viewsval}` : 'Views: -';
            }

            const likecountel = document.getElementById(`like-count-${_courseidtmp}`);
            if (likecountel) {
                const likesval = el.dataset.likes;
                likecountel.textContent = likesval ? likesval : '0';
            }

            const dislikecountel = document.getElementById(`dislike-count-${_courseidtmp}`);
            if (dislikecountel) {
                const dislikesval = el.dataset.dislikes;
                dislikecountel.textContent = dislikesval ? dislikesval : '0';
            }

            const reportcountel = document.getElementById(`report-count-${_courseidtmp}`);
            if (reportcountel) {
                const reportsval = el.dataset.reports;
                reportcountel.textContent = reportsval ? reportsval : '0';
            }

            const reportbutton = document.getElementById(`report-button-${_courseidtmp}`);
            const reportlabel = document.getElementById(`report-label-${_courseidtmp}`);
            if (reportbutton && reportlabel) {
                const reportedkey = getreportstoragekey(el.dataset.simId);
                const isreported = localStorage.getItem(reportedkey) === 'true';
                reportbutton.classList.toggle('reported', isreported);
                reportbutton.disabled = false;
                reportlabel.textContent = isreported ? 'Reported' : 'Report';
            }

            // Store current active topic globally (needed for mobile bookmark)
            window.currentActiveTopic = { courseId: _courseidtmp, topicId: el.dataset.simId };

            const bookmarkbutton = document.getElementById(`bookmark-button-${_courseidtmp}`);
            if (bookmarkbutton) {
                const topicId = el.dataset.simId;
                bookmarkbutton.dataset.simId = topicId;
                bookmarkbutton.dataset.courseId = _courseidtmp;
                // Use topic-level bookmark key (normalize courseId for consistent checking)
                const normalizedCourseId = normalizeCourseId(_courseidtmp);
                const isbookmarked = isTopicBookmarked(normalizedCourseId, topicId);
                bookmarkbutton.classList.toggle('bookmarked', isbookmarked);
            }

            // Update viewer header bookmark button
            if (typeof updateViewerBookmarkBtn === 'function') {
                updateViewerBookmarkBtn(_courseidtmp);
            }

            updateAuthControls(_courseidtmp);

            const sharecourseid = el.dataset.courseId || _courseidtmp;
            const sharesimId = el.dataset.simId || '';
            const shareslug = el.dataset.slug || '';
            if (sharecourseid) {
                // Use simId for persistence (more reliable than slug)
                updateurlstate(sharecourseid, sharesimId || shareslug || null);
            }

            const viewerid = el.dataset.viewerId; // get unique viewer id
            // Lock check removed - all content is free

            // load comments for currently opened simulation (if any)
            if (window.loadCommentsOnView && _courseidtmp) {
                window.loadCommentsOnView(_courseidtmp);
            }

            // Mobile: Show topic view
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (isMobile) {
                document.body.classList.add('is-topic-view');
                // Update breadcrumb with current topic name
                const breadcrumbTopic = document.getElementById(`breadcrumb-topic-${_courseidtmp}`);
                if (breadcrumbTopic) {
                    breadcrumbTopic.textContent = _topictitle;
                }
                // Scroll body to top when entering topic view (fixes position:fixed offset)
                window.scrollTo(0, 0);

                // Show mobile bookmark bar (CSS handles display via is-topic-view)
                const mobileBar = document.getElementById('mobile-bookmark-bar');
                if (mobileBar) {
                    // Update bookmark button state
                    const bmBtn = document.getElementById('mobile-bm-bookmark-btn');
                    const bmLabel = document.getElementById('mobile-bm-bookmark-label');
                    const normalizedCid = normalizeCourseId(_courseidtmp);
                    const topicSimId = el.dataset.simId;
                    const isLoggedIn = AccessState.isLoggedIn || AccessState.authToken;
                    const isMyLearnings = _courseidtmp === 'my-learnings';

                    if (isMyLearnings) {
                        // In bookmarks view, show "Remove Bookmark"
                        if (bmLabel) bmLabel.textContent = 'Remove Bookmark';
                        if (bmBtn) bmBtn.classList.add('bookmarked');
                        window._mobileBookmarkAction = function() {
                            const courseIdForRemove = el.dataset.courseId || _courseidtmp;
                            removeBookmark(normalizeCourseId(courseIdForRemove), topicSimId);
                        };
                    } else if (!isLoggedIn) {
                        // Not logged in
                        if (bmLabel) bmLabel.textContent = 'Sign in to Bookmark';
                        if (bmBtn) bmBtn.classList.remove('bookmarked');
                        window._mobileBookmarkAction = function() {
                            toggleViewerBookmark(_courseidtmp);
                        };
                    } else {
                        // Normal course view, logged in
                        const isBm = isTopicBookmarked(normalizedCid, topicSimId);
                        if (bmLabel) bmLabel.textContent = isBm ? 'Bookmarked' : 'Bookmark';
                        if (bmBtn) bmBtn.classList.toggle('bookmarked', isBm);
                        window._mobileBookmarkAction = function() {
                            toggleViewerBookmark(_courseidtmp);
                            setTimeout(() => {
                                const isNowBm = isTopicBookmarked(normalizedCid, topicSimId);
                                if (bmLabel) bmLabel.textContent = isNowBm ? 'Bookmarked' : 'Bookmark';
                                if (bmBtn) bmBtn.classList.toggle('bookmarked', isNowBm);
                            }, 200);
                        };
                    }

                    // Wire up fullscreen action
                    window._mobileFullscreenAction = function() {
                        togglefullscreen(viewerid);
                    };
                }

                // Clear any landing page content immediately when topic is selected
                const screen = document.getElementById(viewerid);
                if (screen) {
                    screen.classList.remove('has-landing');
                    // Only clear if there's landing content, not if there's already simulation content
                    if (screen.classList.contains('has-landing') || screen.querySelector('.course-landing')) {
                        screen.innerHTML = '';
                    }
                }
                // Initialize Lucide icons for back button
                if (window.lucide) {
                    setTimeout(() => lucide.createIcons(), 100);
                }
            }

            if (el.dataset.link) {
                const decodedLink = window._simDecode ? window._simDecode(el.dataset.link) : el.dataset.link;
                const simid = el.dataset.simId || null;
                opensimulation(decodedLink, simid, viewerid);
            } else if (el.dataset.simId && el.dataset.courseId) {
                (async () => {
                    try {
                        const cid = normalizeCourseId(el.dataset.courseId);
                        const courseData = await window.learningapi.cachedapi.getcourse(cid);
                        if (courseData && courseData.sections) {
                            for (const section of courseData.sections) {
                                const topic = section.simulations?.find(s => s.id === el.dataset.simId);
                                if (topic && topic.link) {
                                    el.dataset.link = window._simEncode ? window._simEncode(topic.link) : topic.link;
                                    opensimulation(topic.link, el.dataset.simId, viewerid);
                                    return;
                                }
                            }
                        }
                        closesimulation(viewerid);
                    } catch (err) {
                        closesimulation(viewerid);
                    }
                })();
            } else {
                closesimulation(viewerid);
            }
        };

        // Mobile back button - return to course outline
        function mobileBackToCourseOutline(courseId) {
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (!isMobile) return;

            // Remove topic view class
            document.body.classList.remove('is-topic-view');

            // Scroll to previously selected item in sidebar
            const view = document.getElementById(`view-${courseId}`);
            const selectedItem = view ? view.querySelector('.chapter-item.selected') : null;

            // Clear iframe
            const viewerid = `viewer-screen-${courseId}`;
            const screen = document.getElementById(viewerid);
            if (screen) {
                screen.innerHTML = '';
            }

            // Keep selection visible (don't deselect) so user sees where they were
            // Scroll sidebar to show the selected item
            if (selectedItem) {
                setTimeout(() => {
                    selectedItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }, 100);
            }

            // Reset title
            const titleEl = document.getElementById(`viewer-title-${courseId}`);
            if (titleEl) {
                titleEl.textContent = 'Course overview';
            }
        }
        window.mobileBackToCourseOutline = mobileBackToCourseOutline;

        // --- chapter search functionality ---
        window.filterchapters = function (searchinput, containerid) {
            if (!searchinput) return;

            const searchterm = searchinput.value.toLowerCase().trim();
            const sidebar = searchinput.closest('.chapter-sidebar');
            if (!sidebar) return;

            const chaptercontent = sidebar.querySelector('.chapter-content');
            if (!chaptercontent) return;

            const allitems = chaptercontent.querySelectorAll('.chapter-item');
            const allheaders = chaptercontent.querySelectorAll('.chapter-section-header');

            if (!searchterm) {
                // show all items, headers, and section wrappers
                allitems.forEach(item => { item.style.display = ''; });
                allheaders.forEach(header => { header.style.display = ''; });
                chaptercontent.querySelectorAll('.chapter-section-items').forEach(wrapper => {
                    wrapper.style.display = '';
                });
                return;
            }

            // filter items
            allitems.forEach(item => {
                const title = item.querySelector('.chapter-title')?.textContent.toLowerCase() || '';
                const badge = item.querySelector('.chapter-badge')?.textContent.toLowerCase() || '';

                if (title.includes(searchterm) || badge.includes(searchterm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });

            // show/hide headers and their wrapper divs based on visible items inside
            allheaders.forEach(header => {
                // Find the items wrapper - it's the next sibling div with class chapter-section-items
                const itemsWrapper = header.nextElementSibling;
                if (!itemsWrapper || !itemsWrapper.classList.contains('chapter-section-items')) {
                    // Fallback: check siblings directly (flat structure)
                    let hasvisibleitems = false;
                    let next = header.nextElementSibling;
                    while (next && !next.classList.contains('chapter-section-header')) {
                        if (next.classList.contains('chapter-item') && next.style.display !== 'none') {
                            hasvisibleitems = true;
                            break;
                        }
                        next = next.nextElementSibling;
                    }
                    header.style.display = hasvisibleitems ? '' : 'none';
                    return;
                }

                // Check if any items inside wrapper are visible
                const visibleItems = itemsWrapper.querySelectorAll('.chapter-item:not([style*="display: none"])');
                const hasvisibleitems = visibleItems.length > 0;
                header.style.display = hasvisibleitems ? '' : 'none';
                itemsWrapper.style.display = hasvisibleitems ? '' : 'none';
            });
        };

        // --- simulation logic with view tracking ---
        let currentsimulation = null;
        window.currentsimulation = null;

        window.opensimulation = async function (filepath, simid, viewerid) {

            // use the specific viewer id if provided, otherwise find active
            let screen;
            if (viewerid) {
                screen = document.getElementById(viewerid);
            } else {
                // fallback for any legacy calls (though we updated callers)
                const activeview = document.querySelector('.view-section:not(.hidden)');
                screen = activeview ? activeview.querySelector('.viewer-screen') : null;
            }

            if (!screen) {
                console.error('no viewer screen found!');
                return;
            }

            // fix: reset scroll position of the parent pane
            const viewerpane = screen.closest('.viewer-pane');
            if (viewerpane) viewerpane.scrollTop = 0;

            // clear previous
            screen.innerHTML = '';

            // create iframe
            const iframe = document.createElement('iframe');
            iframe.src = window.learningapi.api.getsimulationurl(filepath);
            iframe.title = "simulation viewer";
            iframe.allowFullscreen = true;
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            iframe.style = "width:100%; height:100%; border:none; display:block; position:absolute; top:0; left:0;";

            // wait for load to ensure cleaner transition
            iframe.onload = () => {};

            screen.appendChild(iframe);
            currentsimulation = { simid }; window.currentsimulation = currentsimulation;

            // Mobile bookmark bar is handled separately - no need to touch dark-header here

            // increment view count if simid exists
            if (simid) {
                try {
                    const result = await window.learningapi.cachedapi.incrementview(simid);
                    // update view counter for current course
                    const activeview = document.querySelector('.view-section:not(.hidden)');
                    if (activeview) {
                        const courseid = activeview.id.replace('view-', '');
                        const countel = document.getElementById(`view-counter-${courseid}`);
                        if (countel) countel.textContent = `Views: ${result.views}`;

                        const selectedItem = activeview.querySelector('.chapter-item.selected');
                        if (selectedItem) {
                            selectedItem.dataset.views = String(result.views);
                        }

                        // load comments for this simulation
                        if (window.loadCommentsOnView) {
                            window.loadCommentsOnView(courseid);
                        }
                    }
                } catch (err) {
                    console.error('failed to increment view:', err);
                }
            }
        };

        window.handlelikeclick = async function (courseid) {
            const activeview = document.querySelector('.view-section:not(.hidden)');
            if (!activeview) return;

            const simid = window.currentsimulation?.simid;
            if (!simid) return;

            const likebutton = document.getElementById(`like-button-${courseid}`);
            const dislikebutton = document.getElementById(`dislike-button-${courseid}`);
            const likecountel = document.getElementById(`like-count-${courseid}`);
            const dislikecountel = document.getElementById(`dislike-count-${courseid}`);
            if (!likebutton) return;

            likebutton.disabled = true;
            try {
                const result = await window.learningapi.api.togglelike(simid);
                if (result.liked) {
                    likebutton.style.color = '#4f46e5';
                    likebutton.style.background = '#e0e7ff';
                    if (dislikebutton) {
                        dislikebutton.style.color = '';
                        dislikebutton.style.background = '';
                    }
                } else {
                    likebutton.style.color = '';
                    likebutton.style.background = '';
                }
                // update like count if available
                if (likecountel && result.likes !== undefined) {
                    const count = result.likes || 0;
                    likecountel.textContent = count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
                }
                if (dislikecountel && result.dislikes !== undefined) {
                    const count = result.dislikes || 0;
                    dislikecountel.textContent = count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
                }
            } catch (error) {
                console.error('like failed:', error);
            } finally {
                likebutton.disabled = false;
            }
        };

        window.handledislikeclick = async function (courseid) {
            const activeview = document.querySelector('.view-section:not(.hidden)');
            if (!activeview) return;

            const simid = window.currentsimulation?.simid;
            if (!simid) return;

            const dislikebutton = document.getElementById(`dislike-button-${courseid}`);
            const likebutton = document.getElementById(`like-button-${courseid}`);
            const dislikecountel = document.getElementById(`dislike-count-${courseid}`);
            const likecountel = document.getElementById(`like-count-${courseid}`);
            if (!dislikebutton) return;

            dislikebutton.disabled = true;
            try {
                // toggle dislike (you may need to add this api endpoint)
                const result = await window.learningapi.api.toggledislike(simid);
                if (result.disliked) {
                    dislikebutton.style.color = '#ef4444';
                    dislikebutton.style.background = '#fee2e2';
                    if (likebutton) {
                        likebutton.style.color = '';
                        likebutton.style.background = '';
                    }
                } else {
                    dislikebutton.style.color = '';
                    dislikebutton.style.background = '';
                }
                if (dislikecountel && result.dislikes !== undefined) {
                    const count = result.dislikes || 0;
                    dislikecountel.textContent = count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
                }
                if (likecountel && result.likes !== undefined) {
                    const count = result.likes || 0;
                    likecountel.textContent = count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
                }
            } catch (error) {
                console.error('dislike failed:', error);
            } finally {
                dislikebutton.disabled = false;
            }
        };

        function getreportstoragekey(simid) {
            const email = AccessState.userEmail || 'anon';
            return `lp_reported:${email}:${simid}`;
        }

        window.handlereportclick = async function (courseid) {
            if (!(AccessState.isLoggedIn || AccessState.authToken)) return;

            const simid = window.currentsimulation?.simid;
            if (!simid) return;

            const reportbutton = document.getElementById(`report-button-${courseid}`);
            const reportlabel = document.getElementById(`report-label-${courseid}`);
            const reportcountel = document.getElementById(`report-count-${courseid}`);
            if (!reportbutton || !reportlabel) return;

            reportbutton.disabled = true;
            try {
                const result = await window.learningapi.api.reportsimulation(simid);
                const key = getreportstoragekey(simid);
                const isreported = !!result.reported;
                if (isreported) {
                    localStorage.setItem(key, 'true');
                } else {
                    localStorage.removeItem(key);
                }
                reportbutton.classList.toggle('reported', isreported);
                reportlabel.textContent = isreported ? 'Reported' : 'Report';
                if (reportcountel && result.reports !== undefined) {
                    reportcountel.textContent = `${result.reports}`;
                    const activeitem = document.querySelector('.chapter-item.selected');
                    if (activeitem && activeitem.dataset) {
                        activeitem.dataset.reports = `${result.reports}`;
                    }
                }
            } catch (error) {
                console.error('report failed:', error);
            } finally {
                reportbutton.disabled = false;
            }
        };

        // --- bookmark logic ---
        async function refreshBookmarks() {
            // In mock mode, keep the pre-populated mock bookmarks
            if (USE_MOCK_DATA) {
                window.courseitemcounts['my-learnings'] = BookmarkState.items.length;
                renderMyLearningsView();
                updateBookmarkButtons();
                return;
            }

            BookmarkState.items = [];
            BookmarkState.simIds = new Set();
            BookmarkState.topicBookmarks.clear();

            if (!AccessState.authToken) {
                // Use local bookmarks from localStorage when not logged in
                try {
                    const stored = JSON.parse(localStorage.getItem('lp_bookmarks') || '{}');
                    const localItems = Object.values(stored).map(v => ({
                        simulation_id: v.topicId,
                        course_id: v.courseId,
                        title: v.title || v.topicId,
                        course_title: v.courseTitle || v.courseId,
                        file_path: v.filePath || '',
                        slug: v.slug || ''
                    }));
                    BookmarkState.items = localItems;
                    BookmarkState.simIds = new Set(localItems.map(i => i.simulation_id));
                    // Restore topicBookmarks from localStorage
                    BookmarkState.topicBookmarks.clear();
                    for (const [key, val] of Object.entries(stored)) {
                        BookmarkState.topicBookmarks.set(key, true);
                    }
                } catch(e) { console.warn('local bookmark load failed', e); }
                window.courseitemcounts['my-learnings'] = BookmarkState.items.length;
                renderMyLearningsView();
                updateBookmarkButtons();
                return;
            }

            try {
                const response = await window.learningapi.api.getbookmarks();
                const bookmarks = response.bookmarks || [];
                BookmarkState.items = bookmarks;
                BookmarkState.simIds = new Set(bookmarks.map(item => item.simulation_id));

                // Populate topic-level bookmarks: <courseId>:<topicId>
                bookmarks.forEach(item => {
                    if (item.simulation_id) {
                        // Normalize course_id - use lowercase and handle missing values
                        const courseId = normalizeCourseId(item.course_id || '');
                        if (courseId) {
                            const key = getBookmarkKey(courseId, item.simulation_id);
                            BookmarkState.topicBookmarks.set(key, true);
                        }
                    }
                });

                window.courseitemcounts['my-learnings'] = bookmarks.length;
                renderMyLearningsView();
                updateBookmarkButtons();
            } catch (error) {
                const message = String(error?.message || '');
                if (message.includes('401')) {
                    clearAuthState();
                    BookmarkState.items = [];
                    BookmarkState.simIds = new Set();
                    BookmarkState.topicBookmarks.clear();
                    window.courseitemcounts['my-learnings'] = 0;
                    renderMyLearningsView();
                    updateBookmarkButtons();
                    return;
                }
                console.error('failed to load bookmarks:', error);
                renderMyLearningsView();
            }
        }

        // Update bookmark UI for a specific topic
        function updateTopicBookmarkUI(courseId, topicId, bookmarked) {
            // Normalize courseId for consistent matching
            const normalizedCourseId = normalizeCourseId(courseId);

            // Update footer button if it matches this topic
            // Try both normalized and original courseId for view lookup
            const footerButton = document.getElementById(`bookmark-button-${courseId}`) ||
                document.getElementById(`bookmark-button-${normalizedCourseId}`);
            if (footerButton && footerButton.dataset.simId === topicId) {
                footerButton.classList.toggle('bookmarked', bookmarked);
            }

            // Update chapter list icon for this specific topic
            // Try both normalized and original courseId for view lookup
            const view = document.getElementById(`view-${courseId}`) ||
                document.getElementById(`view-${normalizedCourseId}`);
            if (view) {
                const chapterItem = view.querySelector(`.chapter-item[data-sim-id="${topicId}"]`);
                if (chapterItem) {
                    const chapterBookmarkBtn = chapterItem.querySelector('.bookmark-btn');
                    if (chapterBookmarkBtn) {
                        chapterBookmarkBtn.classList.toggle('bookmarked', bookmarked);
                    }
                }
            }

            // Update Recently Added Topics if visible
            const recentContainer = document.getElementById('recent-topics-container');
            if (recentContainer) {
                const recentCard = Array.from(recentContainer.querySelectorAll('.recent-topic-card')).find(card => {
                    const cardSimId = card.dataset.simId;
                    const cardCourseId = normalizeCourseId(card.dataset.courseId);
                    return cardSimId === topicId && cardCourseId === normalizedCourseId;
                });
                // Note: Recent topics don't have bookmark buttons currently, but we can add them if needed
            }
        }

        function updateBookmarkButtons() {
            document.querySelectorAll('.bookmark-btn-main, .bookmark-btn, .mobile-item-bookmark').forEach(button => {
                const topicId = button.dataset.simId;
                let courseId = button.dataset.courseId;
                if (!topicId) return;

                // Normalize courseId for consistent bookmark checking
                if (courseId) {
                    courseId = normalizeCourseId(courseId);
                }

                // Check topic-level bookmark
                let isBookmarked = false;
                if (courseId) {
                    isBookmarked = isTopicBookmarked(courseId, topicId);
                }
                button.classList.toggle('bookmarked', isBookmarked);
            });
        }

        function updateAuthControls(courseid) {
            const isLoggedIn = AccessState.isLoggedIn || Boolean(AccessState.authToken);

            const bookmarkbutton = document.getElementById(`bookmark-button-${courseid}`);
            if (bookmarkbutton) {
                bookmarkbutton.disabled = false;
                bookmarkbutton.title = isLoggedIn ? 'bookmark' : 'login required';
            }

            const commentinput = document.getElementById(`comment-input-${courseid}`);
            const commentsubmit = document.getElementById(`comment-submit-${courseid}`);
            if (commentinput) {
                commentinput.disabled = !isLoggedIn;
                commentinput.placeholder = isLoggedIn
                    ? 'Add a comment...'
                    : 'login to comment';
            }
            if (commentsubmit) {
                commentsubmit.disabled = !isLoggedIn;
            }
        }

        function showBookmarkToast(courseid, message) {
            // Use a single global toast element appended to body so it's never hidden by parent display:none
            let toast = document.getElementById('global-bookmark-toast');
            if (!toast) {
                toast = document.createElement('span');
                toast.id = 'global-bookmark-toast';
                toast.className = 'bookmark-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = message;
            toast.classList.add('show');
            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2000);
        }

          async function togglebookmark(event, courseid, simidOverride) {
            if (event) event.stopPropagation();

            const button = event?.currentTarget;
            // Get topicId from override, button dataset, or selected item
            let topicId = simidOverride || button?.dataset?.simId;
            let courseId = button?.dataset?.courseId || courseid;

            // Fallback to globally tracked active topic
            if (!topicId && window.currentActiveTopic?.topicId) {
                topicId = window.currentActiveTopic.topicId;
                courseId = window.currentActiveTopic.courseId || courseId;
            }

            // If topicId not found, try to get from selected chapter item
            if (!topicId) {
                const activeview = document.getElementById(`view-${courseId}`);
                const selectedItem = activeview?.querySelector('.chapter-item.selected');
                if (selectedItem?.dataset?.simId) {
                    topicId = selectedItem.dataset.simId;
                    courseId = selectedItem.dataset.courseId || courseId;
                }
            }

            // Normalize courseId for consistent bookmark keys
            courseId = normalizeCourseId(courseId);

            if (!topicId || !courseId) {
                console.warn('Cannot bookmark: missing topicId or courseId', { topicId, courseId });
                showBookmarkToast(courseid, 'Select a topic first');
                return;
            }

            const isCurrentlyBookmarked = isTopicBookmarked(courseId, topicId);
            const newState = !isCurrentlyBookmarked;

            // Gather metadata from selected chapter item for localStorage
            let meta = {};
            const activeview = document.getElementById(`view-${courseId}`) || document.getElementById(`view-${courseid}`);
            const selItem = activeview?.querySelector('.chapter-item.selected');
            if (selItem) {
                const rawLink = selItem.dataset.link ? (window._simDecode ? window._simDecode(selItem.dataset.link) : selItem.dataset.link) : '';
                meta = {
                    title: selItem.querySelector('.chapter-title')?.textContent?.replace(/\s*\(simulation\)\s*/gi, '').trim() || topicId,
                    courseTitle: courseId,
                    filePath: rawLink,
                    slug: selItem.dataset.slug || ''
                };
            }

            // Always save locally first (works with or without login)
            if (newState) {
                BookmarkState.simIds.add(topicId);
                setTopicBookmark(courseId, topicId, true, meta);
            } else {
                BookmarkState.simIds.delete(topicId);
                setTopicBookmark(courseId, topicId, false);
            }

            // Update UI immediately
            updateTopicBookmarkUI(courseId, topicId, newState);
            updateViewerBookmarkBtn(courseid);
            showBookmarkToast(courseid, newState ? 'Bookmarked!' : 'Removed from Bookmarks');

            // If logged in, also sync to server
            if (AccessState.isLoggedIn || AccessState.authToken) {
                try {
                    await window.learningapi.api.togglebookmark(topicId);
                } catch (error) {
                    console.error('bookmark server sync failed:', error);
                    // Local bookmark still saved, just server sync failed
                }
            }
            // Always refresh bookmarks view (works for both logged-in and local-only)
            await refreshBookmarks();
        }

        async function removeBookmark(courseId, topicId) {
            // Remove locally
            BookmarkState.simIds.delete(topicId);
            setTopicBookmark(courseId, topicId, false);
            // Remove from BookmarkState.items
            BookmarkState.items = BookmarkState.items.filter(b => b.simulation_id !== topicId);
            // Update UI
            updateTopicBookmarkUI(courseId, topicId, false);
            showBookmarkToast('my-learnings', 'Removed from Bookmarks');

            // On mobile, go back to outline after removing
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (isMobile) {
                document.body.classList.remove('is-topic-view');
            }

            // Re-render the bookmarks view
            renderMyLearningsView();
            // Sync to server if logged in
            if (AccessState.isLoggedIn || AccessState.authToken) {
                try {
                    await window.learningapi.api.togglebookmark(topicId);
                } catch (e) { console.error('unbookmark server sync failed', e); }
            }
        }
        window.removeBookmark = removeBookmark;

        function handlebookmarkclick(courseid, event) {
            if (event) event.stopPropagation();
            const button = document.getElementById(`bookmark-button-${courseid}`);
            if (!button) return;

            // Get the currently selected topic
            const activeview = document.getElementById(`view-${courseid}`);
            const selectedItem = activeview?.querySelector('.chapter-item.selected');

            if (!button.dataset.simId && selectedItem?.dataset?.simId) {
                // Set topicId and courseId on button
                button.dataset.simId = selectedItem.dataset.simId;
                button.dataset.courseId = courseid;
            }

            // Ensure we have both courseId and topicId
            let topicId = button.dataset.simId || selectedItem?.dataset?.simId;
            const courseId = button.dataset.courseId || courseid;

            // Fallback to globally tracked active topic
            if (!topicId && window.currentActiveTopic?.topicId) {
                topicId = window.currentActiveTopic.topicId;
            }

            if (!topicId) {
                console.warn('No topic selected to bookmark');
                return;
            }

            togglebookmark({
                currentTarget: button,
                stopPropagation: () => { }
            }, courseId, topicId);
        }

        window.handlebookmarkclick = handlebookmarkclick;

        // Viewer header bookmark button handler
        function toggleViewerBookmark(courseid) {
            // Check if user is signed in
            if (!AccessState.isLoggedIn && !AccessState.authToken) {
                showBookmarkToast(courseid, 'Sign in to bookmark');
                // Open auth modal after a brief delay
                setTimeout(() => openAuthModal('login'), 800);
                return;
            }

            const activeview = document.getElementById(`view-${courseid}`);
            const selectedItem = activeview?.querySelector('.chapter-item.selected');
            let topicId = selectedItem?.dataset?.simId;
            let courseId = selectedItem?.dataset?.courseId || courseid;

            // Fallback to globally tracked active topic (needed on mobile where sidebar is hidden)
            if (!topicId && window.currentActiveTopic?.topicId) {
                topicId = window.currentActiveTopic.topicId;
                courseId = window.currentActiveTopic.courseId || courseid;
            }

            if (!topicId) {
                console.warn('No topic selected to bookmark');
                showBookmarkToast(courseid, 'Open a topic first to bookmark it');
                return;
            }

            const btn = document.getElementById(`viewer-bookmark-${courseid}`);
            togglebookmark({
                currentTarget: btn || { dataset: { simId: topicId, courseId: courseId } },
                stopPropagation: () => { }
            }, courseId, topicId).then(() => {
                // Update viewer bookmark button state
                updateViewerBookmarkBtn(courseid);
            }).catch(err => {
                console.error('Bookmark toggle failed:', err);
                showBookmarkToast(courseid, 'Bookmark failed. Try again.');
            });
        }
        window.toggleViewerBookmark = toggleViewerBookmark;

        function updateViewerBookmarkBtn(courseid) {
            const btn = document.getElementById(`viewer-bookmark-${courseid}`);
            if (!btn) return;

            const isLoggedIn = AccessState.isLoggedIn || AccessState.authToken;

            // If not logged in, show sign-in prompt
            if (!isLoggedIn && courseid !== 'my-learnings') {
                btn.classList.remove('bookmarked');
                const spanEl = btn.querySelector('span');
                if (spanEl) spanEl.textContent = 'Sign in to Bookmark';
                return;
            }

            const activeview = document.getElementById(`view-${courseid}`);
            const selectedItem = activeview?.querySelector('.chapter-item.selected');
            let topicId = selectedItem?.dataset?.simId;

            // Fallback to globally tracked active topic
            if (!topicId && window.currentActiveTopic?.topicId) {
                topicId = window.currentActiveTopic.topicId;
            }

            if (!topicId) {
                btn.classList.remove('bookmarked');
                const spanEl = btn.querySelector('span');
                if (spanEl) spanEl.textContent = 'Bookmark';
                return;
            }
            const normalizedCourseId = normalizeCourseId(courseid);
            const isBookmarked = isTopicBookmarked(normalizedCourseId, topicId);
            btn.classList.toggle('bookmarked', isBookmarked);
            if (courseid === 'my-learnings') {
                const spanEl = btn.querySelector('span');
                if (spanEl) spanEl.textContent = 'Remove Bookmark';
            } else {
                const spanEl = btn.querySelector('span');
                if (spanEl) spanEl.textContent = isBookmarked ? 'Bookmarked' : 'Bookmark';
            }
        }
        window.updateViewerBookmarkBtn = updateViewerBookmarkBtn;

        async function renderMyLearningsView() {
            const container = document.getElementById('view-my-learnings');
            if (!container) return;

            if (!USE_MOCK_DATA && !(AccessState.isLoggedIn || AccessState.authToken) && BookmarkState.items.length === 0) {
                // Check localStorage for local bookmarks
                try {
                    const stored = JSON.parse(localStorage.getItem('lp_bookmarks') || '{}');
                    if (Object.keys(stored).length > 0) {
                        // Load local bookmarks into BookmarkState and continue rendering
                        BookmarkState.items = Object.values(stored).map(v => ({
                            simulation_id: v.topicId,
                            course_id: v.courseId,
                            title: v.title || v.topicId,
                            course_title: v.courseTitle || v.courseId,
                            file_path: v.filePath || '',
                            slug: v.slug || ''
                        }));
                    }
                } catch(e) {}
                if (BookmarkState.items.length === 0) {
                container.innerHTML = `
                            <div class="course-header">
                                <div class="course-logo"><i data-lucide="bookmark"></i></div>
                                <div class="course-title">My Bookmarks</div>
                            </div>
                            <div style="padding: 40px; text-align: center; color: #666;">
                                <p>No bookmarks yet. Tap Bookmark to save a simulation.</p>
                            </div>
                        `;
                if (window.lucide) lucide.createIcons();
                return;
              }
            }

            const bookmarks = BookmarkState.items || [];
            const viewerid = 'viewer-screen-my-learnings';

            if (bookmarks.length === 0) {
                container.innerHTML = `
                            <div class="course-header">
                                <div class="course-logo"><i data-lucide="bookmark"></i></div>
                                <div class="course-title">My Bookmarks</div>
                            </div>
                            <div style="padding: 40px; text-align: center; color: #666;">
                                <p>No bookmarks yet. Tap Bookmark to save a simulation.</p>
                            </div>
                        `;
                if (window.lucide) lucide.createIcons();
                return;
            }

            const grouped = bookmarks.reduce((acc, item) => {
                const courseId = normalizeCourseId(item.course_id || 'other');
                if (!acc[courseId]) {
                    acc[courseId] = {
                        courseTitle: item.course_title || courseId,
                        iconClass: item.icon_class || 'fa-solid fa-bookmark',
                        items: []
                    };
                }
                acc[courseId].items.push(item);
                return acc;
            }, {});

            // Load course data for each unique course to get actual topic numbers
            const courseDataMap = new Map();
            const courseIds = Object.keys(grouped);
            await Promise.all(courseIds.map(async (courseId) => {
                try {
                    const courseData = await window.learningapi.cachedapi.getcourse(courseId);
                    if (courseData) {
                        courseDataMap.set(courseId, courseData);
                    }
                } catch (error) {
                    console.error(`Failed to load course data for ${courseId}:`, error);
                }
            }));

            // Helper function to find topic number from course data
            function getTopicNumber(courseId, simId) {
                const courseData = courseDataMap.get(normalizeCourseId(courseId));
                if (!courseData || !courseData.sections) {
                    return null;
                }

                for (const section of courseData.sections) {
                    const topic = section.simulations?.find(s => s.id === simId);
                    if (topic) {
                        const sectionNum = section.display_order || 1;
                        const topicNum = topic.display_order || 1;
                        return `${sectionNum}.${topicNum}`;
                    }
                }
                return null;
            }

            // Helper function to get topic link from course data
            function getTopicLink(courseId, simId) {
                const courseData = courseDataMap.get(normalizeCourseId(courseId));
                if (!courseData || !courseData.sections) {
                    return null;
                }

                for (const section of courseData.sections) {
                    const topic = section.simulations?.find(s => s.id === simId);
                    if (topic && topic.link) {
                        return topic.link;
                    }
                }
                return null;
            }

            let chapterhtml = '';
            Object.keys(grouped).forEach((courseId, courseIndex) => {
                const group = grouped[courseId];
                const sectionid = `section-my-learnings-${courseIndex}`;
                // Use course icon instead of "SECTION X: CourseName" with 8px spacing
                const sectiontitle = `<i class="${group.iconClass}" style="margin-right: 8px;"></i>${group.courseTitle}`;
                chapterhtml += `
                            <div class="chapter-section-header" id="header-${sectionid}" onclick="togglecoursesection('${sectionid}')">
                                <span class="chapter-section-header-text">${sectiontitle}</span>
                                <div class="chapter-section-actions">
                                    <i data-lucide="chevron-down" class="chapter-section-chevron"></i>
                                </div>
                            </div>
                            <div class="chapter-section-items" id="items-${sectionid}">
                        `;

                group.items.forEach((item, index) => {
                    // Get actual topic number from course data, fallback to index if not found
                    const actualTopicNumber = getTopicNumber(item.course_id || courseId, item.simulation_id);
                    const topicBadge = actualTopicNumber || `${courseIndex + 1}.${index + 1}`;
                    const isbookmarked = BookmarkState.simIds.has(item.simulation_id);
                    const normalizedCourseId = normalizeCourseId(item.course_id || courseId);
                    // Get link from course data if file_path is not available
                    const topicLink = item.file_path || getTopicLink(item.course_id || courseId, item.simulation_id) || '';
                    chapterhtml += `
                                  <div class="chapter-item" onclick="selectchapter(this)"
                                      data-course-id="${normalizedCourseId}"
                                      data-sim-id="${item.simulation_id}"
                                     data-slug="${item.slug || ''}"
                                     data-link="${window._simEncode ? window._simEncode(topicLink) : topicLink}"
                                     data-locked="false"
                                     data-views="${item.views ?? ''}"
                                     data-likes="${item.likes ?? ''}"
                                     data-dislikes="${item.dislikes ?? ''}"
                                     data-reports="${item.reports ?? ''}"
                                     data-search="${(item.title || '').toLowerCase()}"
                                     data-viewer-id="${viewerid}">
                                    <div class="chapter-badge">${topicBadge}</div>
                                    <div class="chapter-info">
                                        <div class="chapter-title">${item.title}</div>
                                    </div>
                                    <div class="chapter-item-actions">
                                          <button class="unbookmark-btn" title="Remove bookmark" onclick="event.stopPropagation(); removeBookmark('${normalizedCourseId}', '${item.simulation_id}')">
                                              <i data-lucide="bookmark-minus" width="14" height="14"></i>
                                          </button>
                                      </div>
                                </div>
                            `;
                });

                chapterhtml += `</div>`;
            });

            container.innerHTML = `
                        <div class="course-header">
                            <div class="course-logo"><i data-lucide="bookmark"></i></div>
                            <div class="course-title">My Bookmarks</div>
                        </div>
                        <div class="course-container">
                            <div class="chapter-sidebar" id="chapter-sidebar-my-learnings">
                                <div class="chapter-search-wrapper">
                                    <i data-lucide="search" class="chapter-search-icon"></i>
                                    <input type="text" class="chapter-search" placeholder="search bookmarks..."
                                           id="my-learnings-search"
                                           onkeyup="filterchapters(this, 'view-my-learnings')"
                                           oninput="filterchapters(this, 'view-my-learnings')">
                                </div>
                                <div class="chapter-content">${chapterhtml}</div>
                            </div>
                              <div class="viewer-pane">
                                  <!-- Mobile breadcrumb bar for back navigation -->
                                  <div class="mobile-topic-breadcrumb" id="breadcrumb-my-learnings">
                                      <button class="breadcrumb-back-btn" onclick="mobileBackToCourseOutline('my-learnings')">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                      </button>
                                      <span class="breadcrumb-course-name" id="breadcrumb-course-my-learnings">My Bookmarks</span>
                                      <span class="breadcrumb-separator">›</span>
                                      <span class="breadcrumb-topic-name" id="breadcrumb-topic-my-learnings">Select a topic</span>
                                  </div>
                                  <div class="chapter-expand-handle" onclick="expandchaptersidebar('my-learnings')" title="expand sidebar">
                                      <i data-lucide="chevron-right"></i>
                                  </div>
                                  <!-- Dark header with unbookmark + fullscreen -->
                                  <div class="viewer-dark-header">
                                      <button class="viewer-ghost-btn viewer-bookmark-btn" id="viewer-bookmark-my-learnings" onclick="toggleViewerBookmark('my-learnings')">
                                          <i data-lucide="bookmark-minus" width="16" height="16"></i>
                                          <span>Remove Bookmark</span>
                                      </button>
                                      <span class="bookmark-toast" id="bookmark-toast-my-learnings">Added to My Bookmarks</span>
                                      <div class="viewer-header-title" id="viewer-title-my-learnings">Select a topic</div>
                                      <button class="viewer-ghost-btn viewer-fullscreen-btn" onclick="togglefullscreen('${viewerid}')">
                                          <i data-lucide="maximize-2" width="16" height="16"></i>
                                          <span>Fullscreen</span>
                                      </button>
                                  </div>
                                  <!-- Rounded iframe container -->
                                  <div class="viewer-iframe-wrapper">
                                      <div class="viewer-screen" id="${viewerid}"></div>
                                  </div>
                                  <div class="viewer-title-row" style="display:none;">
                                    <div class="viewer-title-section">
                                        <div class="viewer-title" id="viewer-title-my-learnings">Select a topic</div>
                                        <div class="viewer-submeta">
                                            <span id="view-counter-my-learnings">Views: -</span>
                                            <span>•</span>
                                            <span id="upload-date-my-learnings">-</span>
                                        </div>
                                    </div>
                                    <div class="viewer-actions-row">
                                        <div class="like-dislike-group">
                                            <button class="action-btn like-btn" id="like-button-my-learnings" onclick="handlelikeclick('my-learnings')">
                                                <i data-lucide="thumbs-up" width="16"></i>
                                                <span id="like-count-my-learnings">0</span>
                                            </button>
                                            <button class="action-btn dislike-btn" id="dislike-button-my-learnings" onclick="handledislikeclick('my-learnings')">
                                                <i data-lucide="thumbs-down" width="16"></i>
                                                <span id="dislike-count-my-learnings">0</span>
                                            </button>
                                        </div>
                                        <div class="bookmark-action">
                                            <button class="bookmark-btn-main" id="bookmark-button-my-learnings" onclick="handlebookmarkclick('my-learnings', event)">
                                                <i data-lucide="bookmark" width="14"></i>
                                                <span>Bookmark</span>
                                            </button>
                                            <span class="bookmark-toast" id="bookmark-toast-my-learnings">Added to My Bookmarks</span>
                                        </div>
                                        <button class="action-btn report-btn" id="report-button-my-learnings" onclick="handlereportclick('my-learnings')" ${(AccessState.isLoggedIn || AccessState.authToken) ? '' : 'style="display:none;"'}>
                                            <i data-lucide="flag" width="14"></i>
                                            <span id="report-label-my-learnings">Report</span>
                                            <span id="report-count-my-learnings">0</span>
                                        </button>
                                        <button class="action-btn share-btn" onclick="handleshareclick('my-learnings')">
                                            <i data-lucide="share-2" width="16"></i>
                                            <span>Share</span>
                                        </button>
                                        <button class="action-btn canvas-btn" onclick="togglefullscreen('${viewerid}')">
                                            <i data-lucide="maximize" width="14"></i>
                                            <span>Canvas</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="viewer-details">
                                    <div class="comments-header-row">
                                        <span class="comments-header">Comments</span>
                                        <div class="comment-input-wrapper">
                                            <input type="text" class="comment-input-field" id="comment-input-my-learnings" placeholder="Add a comment..." />
                                            <button class="comment-submit-btn" id="comment-submit-my-learnings" onclick="submitcomment('my-learnings')">
                                                <i data-lucide="send" width="14"></i>
                                                <span class="comment-submit-label">Post</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="comments-list" id="comments-list-my-learnings"></div>
                                </div>
                            </div>
                        </div>
                    `;

              if (window.lucide) lucide.createIcons();
            // collapse all my-learnings sections by default; only un-collapse explicitly expanded ones
            (function collapseMyLearningsSections() {
                const saved = JSON.parse(localStorage.getItem('collapsedsections') || '{}');
                container.querySelectorAll('.chapter-section-header').forEach(header => {
                    const sid = (header.id || '').replace('header-', '');
                    const items = sid ? document.getElementById('items-' + sid) : null;
                    if (saved[sid] === false) {
                        // user explicitly expanded — leave open
                    } else {
                        header.classList.add('collapsed');
                        if (items) items.classList.add('collapsed');
                    }
                });
            })();
            updateAuthControls('my-learnings');
        }

        window.togglebookmark = togglebookmark;

        // load comments when viewer loads
        window.loadCommentsOnView = function (courseid) {
            // small delay to ensure dom is ready
            setTimeout(() => {
                loadComments(courseid);
            }, 100);
        };

        // load comments from api
        async function loadComments(courseid) {
            const activeview = document.querySelector('.view-section:not(.hidden)');
            if (!activeview) return;

            const simid = window.currentsimulation?.simid;
            if (!simid) return;

            const commentslist = document.getElementById(`comments-list-${courseid}`);
            if (!commentslist) return;

            try {
                const response = await window.learningapi.api.getcomments(simid);
                const comments = response.comments || [];
                commentslist.innerHTML = '';

                // update comment count
                const countel = document.getElementById(`comment-count-${courseid}`);
                if (countel) {
                    countel.textContent = `${comments.length} comment${comments.length !== 1 ? 's' : ''}`;
                }

                if (comments.length === 0) {
                    commentslist.innerHTML = `
                                <div class="comment-empty-state">
                                    <i data-lucide="message-circle" class="comment-empty-state-icon"></i>
                                    <p>no comments yet. be the first to comment!</p>
                                </div>
                            `;
                    if (window.lucide) lucide.createIcons();
                    return;
                }

                comments.forEach(comment => {
                    const commentdiv = document.createElement('div');
                    commentdiv.className = 'comment-item';
                    commentdiv.id = `comment-${comment.id}`;
                    commentdiv.dataset.commentId = `${comment.id}`;
                    commentdiv.innerHTML = `
                                <div class="comment-avatar"></div>
                                <div class="comment-content">
                                    <div class="comment-author">${escapeHtml(comment.display_name || comment.author_name || 'anonymous')}</div>
                                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                                    <div class="comment-meta">
                                        <span>${formatDate(comment.created_at)}</span>
                                        <button class="comment-upvote" onclick="upvoteComment(${comment.id}, '${courseid}')">
                                            <i data-lucide="thumbs-up" width="12"></i> ${comment.upvotes || 0}
                                        </button>
                                    </div>
                                </div>
                            `;
                    commentslist.appendChild(commentdiv);
                });

                // re-initialize lucide icons
                if (window.lucide) lucide.createIcons();
            } catch (error) {
                console.error('failed to load comments:', error);
                commentslist.innerHTML = `
                            <div class="comment-empty-state">
                                <p style="color: #ef4444;">failed to load comments. please try again.</p>
                            </div>
                        `;
            }
        }

        // submit comment
        window.submitcomment = async function (courseid) {
            const activeview = document.querySelector('.view-section:not(.hidden)');
            if (!activeview) return;

            if (!(AccessState.isLoggedIn || AccessState.authToken)) {
                alert('please login to comment');
                return;
            }

            const simid = window.currentsimulation?.simid;
            if (!simid) {
                alert('please select a simulation first');
                return;
            }

            const textinput = document.getElementById(`comment-input-${courseid}`);
            const submitbtn = document.getElementById(`comment-submit-${courseid}`);
            const submitlabel = submitbtn?.querySelector('.comment-submit-label');

            if (!textinput || !textinput.value.trim()) {
                alert('please enter a comment');
                return;
            }

            // disable button
            if (submitbtn) {
                submitbtn.disabled = true;
                if (submitlabel) submitlabel.textContent = 'Posting...';
            }

            try {
                const response = await window.learningapi.api.postcomment(simid, {
                    author_name: 'anonymous',
                    text: textinput.value.trim()
                });

                const newCommentId = response?.comment?.id || null;

                // clear input
                if (textinput) textinput.value = '';

                // reload comments
                await loadComments(courseid);

                if (newCommentId) {
                    const newCommentEl = document.getElementById(`comment-${newCommentId}`);
                    if (newCommentEl) {
                        newCommentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            } catch (error) {
                console.error('failed to post comment:', error);
                alert('failed to post comment. please try again.');
            } finally {
                // re-enable button
                if (submitbtn) {
                    submitbtn.disabled = false;
                    if (submitlabel) submitlabel.textContent = 'Post';
                }
            }
        };

        // upvote comment
        window.upvoteComment = async function (commentid, courseid) {
            try {
                await window.learningapi.api.upvotecomment(commentid);
                loadComments(courseid);
            } catch (error) {
                console.error('failed to upvote comment:', error);
            }
        };

        // helper functions
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(datestring) {
            if (!datestring) return '';
            const date = new Date(datestring);
            const now = new Date();
            const diffms = now - date;
            const diffmins = Math.floor(diffms / 60000);
            const diffhours = Math.floor(diffms / 3600000);
            const diffdays = Math.floor(diffms / 86400000);

            if (diffmins < 1) return 'just now';
            if (diffmins < 60) return `${diffmins}m ago`;
            if (diffhours < 24) return `${diffhours}h ago`;
            if (diffdays < 7) return `${diffdays}d ago`;

            return date.toLocaleDateString();
        }

        window.closesimulation = function (viewerid) {
            let screen;
            if (viewerid) {
                screen = document.getElementById(viewerid);
            } else {
                const activeview = document.querySelector('.view-section:not(.hidden)');
                screen = activeview ? activeview.querySelector('.viewer-screen') : null;
            }

            if (screen) {
                screen.innerHTML = '';
            }
            currentsimulation = null;
            window.currentsimulation = null;
        };

        // --- auth modal handlers ---
        let authmode = 'login';

        function openAuthModal(mode = 'login') {
            authmode = mode;
            const modal = document.getElementById('auth-modal');
            if (modal) modal.classList.add('active');
            switchAuthMode(mode);
        }
        window.openAuthModal = openAuthModal;

        function closeAuthModal() {
            const modal = document.getElementById('auth-modal');
            if (modal) modal.classList.remove('active');
        }
        window.closeAuthModal = closeAuthModal;

        function switchAuthMode(mode) {
            authmode = mode;
            const logintab = document.getElementById('auth-tab-login');
            const registertab = document.getElementById('auth-tab-register');
            const title = document.getElementById('auth-modal-title');
            const submit = document.getElementById('auth-submit');
            const displayname = document.getElementById('auth-display-name');
            const confirmpassword = document.getElementById('auth-confirm-password');
            const footer = document.getElementById('auth-footer');
            const googlebtn = document.getElementById('google-login-btn');

            const googleSvg = `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.384 44.599 -10.134 45.789 L -6.734 42.389 C -8.804 40.459 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>`;

            if (mode === 'register') {
                logintab?.classList.remove('active');
                registertab?.classList.add('active');
                if (title) title.textContent = 'Create your account';
                if (submit) submit.textContent = 'Register';
                if (displayname) displayname.style.display = 'block';
                if (confirmpassword) confirmpassword.style.display = 'block';
                // Update Google Button HTML to preserve SVG
                if (googlebtn) googlebtn.innerHTML = `${googleSvg}<span>Sign up with Google</span>`;
                // Fix Register Link to prevent default behavior
                if (footer) footer.innerHTML = 'Already have an account? <a href="#" onclick="event.preventDefault(); switchAuthMode(\'login\')">Login</a>';
            } else {
                registertab?.classList.remove('active');
                logintab?.classList.add('active');
                if (title) title.textContent = 'Welcome back';
                if (submit) submit.textContent = 'Login';
                if (displayname) displayname.style.display = 'none';
                if (confirmpassword) confirmpassword.style.display = 'none';
                // Update Google Button HTML to preserve SVG
                if (googlebtn) googlebtn.innerHTML = `${googleSvg}<span>Continue with Google</span>`;
                // Fix Register Link to prevent default behavior
                if (footer) footer.innerHTML = 'New here? <a href="#" onclick="event.preventDefault(); switchAuthMode(\'register\')">Register</a>';
            }
        }
        window.switchAuthMode = switchAuthMode;

        async function handleAuthSubmit(event) {
            event.preventDefault();
            const email = document.getElementById('auth-email')?.value?.trim();
            const password = document.getElementById('auth-password')?.value;
            const displayname = document.getElementById('auth-display-name')?.value?.trim();
            const confirmpassword = document.getElementById('auth-confirm-password')?.value;

            if (!email || !password) {
                alert('email and password are required.');
                return;
            }

            const emailok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!emailok) {
                alert('please enter a valid email address.');
                return;
            }

            if (authmode === 'register' && password !== confirmpassword) {
                alert('passwords do not match.');
                return;
            }

            try {
                const payload = { email, password, display_name: displayname };
                const result = authmode === 'register'
                    ? await window.learningapi.api.register(payload)
                    : await window.learningapi.api.login(payload);

                if (result?.accessToken) {
                    setAuthState({
                        token: result.accessToken,
                        email: result.user?.email || email,
                        displayName: result.user?.display_name || displayname || email.split('@')[0],
                        hasFullAccess: result.hasFullAccess || true
                    });

                    // Close modal
                    document.getElementById('auth-modal').classList.remove('active');

                    // Reload to update UI
                    window.location.reload();
                } else {
                    throw new Error('Login failed: No access token received');
                }
            } catch (err) {
                console.error('Auth error:', err);
                alert(err.message || 'Authentication failed.');
            }
        }

        // Google OAuth 2.0 Client
        let tokenClient;

        // Initialize Google Identity Services (OAuth 2.0 Token Model)
        function initializeGoogleAuth() {
            if (window.google) {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: "506619320686-uhlmttc48vj7osbolv8ragqkfs1v4l70.apps.googleusercontent.com",
                    scope: "openid profile email",
                    callback: handleTokenResponse,
                });
            }
        }

        // Trigger Google Login (Popup Flow)
        function triggerGoogleLogin() {
            console.log("Triggering Google Login Popup...");
            if (tokenClient) {
                // Request Access Token (triggers popup)
                tokenClient.requestAccessToken();
            } else {
                console.error("Google Token Client not initialized");
                alert("Google Sign-in is initializing. Please wait a moment and try again.");
                // Retry init if missing
                initializeGoogleAuth();
            }
        }

        // Handle OAuth Token Response
        async function handleTokenResponse(resp) {
            console.log("Token Response:", resp);
            if (resp.error) {
                console.error("Google Auth Error:", resp);
                return;
            }

            if (resp.access_token) {
                try {
                    // Fetch User Info using Access Token
                    const userInfoParams = new URLSearchParams({ access_token: resp.access_token });
                    const userResp = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?${userInfoParams.toString()}`);

                    if (!userResp.ok) throw new Error("Failed to fetch user profile");

                    const payload = await userResp.json();
                    console.log("User Info:", payload);

                    // Store session data
                    localStorage.setItem("item", "true");
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("lp_is_logged_in", "true");
                    localStorage.setItem("authProvider", "google");

                    // Store User Details
                    if (payload.name) localStorage.setItem("lp_user_display_name", payload.name);
                    if (payload.email) localStorage.setItem("lp_user_email", payload.email);
                    if (payload.picture) localStorage.setItem("lp_user_picture", payload.picture);

                    closeAuthModal();
                    window.location.reload();

                } catch (err) {
                    console.error("Profile Fetch Error:", err);
                    alert("Failed to load Google profile. Please try again.");
                }
            }
        }

        window.onload = function () {
            // ... existing onload ...
            initializeGoogleAuth();
        };

        async function handleLogout() {
            if (!confirm("Are you sure you want to log out?")) return;
            try {
                if (AccessState.authToken) {
                    await window.learningapi.api.logout(AccessState.authToken);
                }
            } catch (err) {
                console.warn('logout failed:', err);
            } finally {
                clearAuthState();
                renderAuthButton();
                location.reload();
            }
        }
        window.handleLogout = handleLogout;

        window.handlesignup = function (event) {
            event.preventDefault();
            openAuthModal('register');
        };

        window.showsignin = function (event) {
            event.preventDefault();
            openAuthModal('login');
        };

        // --- fullscreen & canvas mode logic ---

        // Current zoom level for canvas mode (default 1 = 100%)
        window.canvasZoomLevel = 1;

        // Detect iOS
        function isIOS() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        }

        // Show rotate prompt for iOS users
        function showRotatePrompt() {
            let prompt = document.getElementById('rotate-prompt');
            if (!prompt) {
                prompt = document.createElement('div');
                prompt.id = 'rotate-prompt';
                prompt.innerHTML = `
                    <div class="rotate-prompt-content">
                        <div class="rotate-icon">📱↔️</div>
                        <div class="rotate-text">Rotate your device for best experience</div>
                        <button onclick="hideRotatePrompt()" class="rotate-dismiss">Got it</button>
                    </div>
                `;
                document.body.appendChild(prompt);
            }
            prompt.style.display = 'flex';

            // Auto-hide after 3 seconds
            setTimeout(() => {
                hideRotatePrompt();
            }, 3000);
        }

        window.hideRotatePrompt = function () {
            const prompt = document.getElementById('rotate-prompt');
            if (prompt) {
                prompt.style.display = 'none';
            }
        };

        window.togglefullscreen = function (elementid) {
            // if exiting, we use the standard exit function
            if (document.body.classList.contains('canvas-mode')) {
                exitcanvasmode();
                return;
            }

            if (!elementid) {
                const activeview = document.querySelector('.view-section:not(.hidden)');
                const selectedItem = activeview?.querySelector('.chapter-item.selected');
                elementid = selectedItem?.dataset.viewerId || activeview?.querySelector('.viewer-screen')?.id || '';
            }

            // enter canvas mode
            document.body.classList.add('canvas-mode');

            // Clear any inline styles on dark headers so CSS display:none takes effect
            document.querySelectorAll('.viewer-dark-header').forEach(h => {
                h.style.removeProperty('display');
                h.style.removeProperty('visibility');
            });

            // try browser fullscreen for immersion
            const docel = document.documentElement;
            if (docel.requestFullscreen) docel.requestFullscreen().catch(err => console.log(err));
            else if (docel.webkitRequestFullscreen) docel.webkitRequestFullscreen();

            // No forced orientation - fullscreen works in both portrait and landscape
            // User rotates device to get landscape if they want it

            // Show zoom controls
            showZoomControls();

            // Reset zoom level
            window.canvasZoomLevel = 1;

            // update canvas bar info
            updatecanvasbarinfo(elementid);
        };

        window.exitcanvasmode = function () {
            document.body.classList.remove('canvas-mode');

            // exit browser fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }

            // Unlock orientation
            try {
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            } catch (e) {
                console.log('Screen orientation unlock not available');
            }

            // Clear inline zoom styles from iframe so CSS takes over
            const activeView = document.querySelector('.view-section:not(.hidden)');
            const iframe = activeView ? activeView.querySelector('.viewer-screen iframe') : null;
            if (iframe) {
                iframe.style.removeProperty('transform');
                iframe.style.removeProperty('width');
                iframe.style.removeProperty('height');
                iframe.style.removeProperty('transform-origin');
            }

            // Hide zoom controls
            hideZoomControls();
        };

        // Zoom controls functions
        function showZoomControls() {
            let zoomControls = document.getElementById('canvas-zoom-controls');
            if (!zoomControls) {
                zoomControls = document.createElement('div');
                zoomControls.id = 'canvas-zoom-controls';
                zoomControls.innerHTML = `
                    <button id="zoom-in-btn" title="Zoom In">+</button>
                    <button id="zoom-out-btn" title="Zoom Out">−</button>
                `;
                document.body.appendChild(zoomControls);
            }

            // Always re-bind event listeners to ensure they work
            const zoomIn = document.getElementById('zoom-in-btn');
            const zoomOut = document.getElementById('zoom-out-btn');
            if (zoomIn) {
                zoomIn.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.canvasZoomIn();
                };
            }
            if (zoomOut) {
                zoomOut.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.canvasZoomOut();
                };
            }

            // Show only on mobile landscape
            const isMobile = window.innerWidth <= 900;
            const isLandscape = window.innerWidth > window.innerHeight;

            if (isMobile && isLandscape) {
                zoomControls.style.display = 'flex';
            } else {
                zoomControls.style.display = 'none';
            }
        }

        // Re-check zoom controls on orientation change
        window.addEventListener('orientationchange', function () {
            setTimeout(function () {
                if (document.body.classList.contains('canvas-mode')) {
                    showZoomControls();
                }
            }, 100);
        });

        window.addEventListener('resize', function () {
            if (document.body.classList.contains('canvas-mode')) {
                showZoomControls();
            }
        });

        function hideZoomControls() {
            const zoomControls = document.getElementById('canvas-zoom-controls');
            if (zoomControls) {
                zoomControls.style.display = 'none';
            }
        }

        window.canvasZoomIn = function () {
            window.canvasZoomLevel = Math.min((window.canvasZoomLevel || 1) + 0.15, 2.5);
            applyCanvasZoom();
            console.log('Zoom In:', window.canvasZoomLevel);
        };

        window.canvasZoomOut = function () {
            window.canvasZoomLevel = Math.max((window.canvasZoomLevel || 1) - 0.15, 0.4);
            applyCanvasZoom();
            console.log('Zoom Out:', window.canvasZoomLevel);
        };

        function applyCanvasZoom() {
            // Find the active view's iframe specifically
            const activeView = document.querySelector('.view-section:not(.hidden)');
            const iframe = activeView ? activeView.querySelector('.viewer-screen iframe') : document.querySelector('.canvas-mode .viewer-screen iframe');
            if (iframe) {
                // Base scale is 0.45 for landscape, multiply by zoom level
                const baseScale = 0.45;
                const zoomLevel = window.canvasZoomLevel || 1;
                const newScale = baseScale * zoomLevel;
                const compensation = (100 / newScale);
                // Use setProperty with priority to override !important CSS rules
                iframe.style.setProperty('transform', `scale(${newScale})`, 'important');
                iframe.style.setProperty('width', `${compensation}%`, 'important');
                iframe.style.setProperty('height', `${compensation}%`, 'important');
                iframe.style.setProperty('transform-origin', 'top left', 'important');
                console.log('Applied zoom scale:', newScale);
            } else {
                console.log('Iframe not found for zoom');
            }
        }

        function toggleFullscreen(elementid) {
            return window.togglefullscreen(elementid);
        }
        function exitCanvasMode() {
            return window.exitcanvasmode();
        }
        window.toggleFullscreen = toggleFullscreen;
        window.exitCanvasMode = exitCanvasMode;

        function updatecanvasbarinfo(viewerid) {
            // find active course info
            const activeview = document.querySelector('.view-section:not(.hidden)');
            if (!activeview) return;

            // get title from course header (active view)
            // note: in strict canvas mode, these are hidden, but dom is still there
            // we need to capture state before hiding or from data attributes

            // hacky but works: find the course title in the hidden header
            // a better way would be passing title to togglefullscreen, but let's infer

            // default text
            let title = "Simulation Lab";
            let step = "Interactive mode";

            // try to find the title from the visible container's header (before it was hidden)
            // or from the global state we might have set
            if (activeview) {
                // we generated the view, so we know structure
                const coursetitleel = activeview.querySelector('.course-header .course-title');
                if (coursetitleel) title = coursetitleel.textContent;
            }

            // update top bar
            document.getElementById('canvas-title').textContent = title;
            document.getElementById('canvas-step').textContent = step;
        }

        // listen for browser fullscreen exit (esc key) to sync state
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && document.body.classList.contains('canvas-mode')) {
                // user pressed esc
                exitcanvasmode();
            }
        });

        function buildshareurl(courseid, simslug) {
            if (!courseid) {
                return `${window.location.origin}${window.location.pathname}`;
            }
            const url = new URL(window.location.href);
            url.searchParams.set('course', courseid);
            if (simslug) {
                url.searchParams.set('sim', simslug);
            } else {
                url.searchParams.delete('sim');
            }
            return `${url.origin}${url.pathname}?${url.searchParams.toString()}`;
        }

        function updateurlstate(courseid, simslug) {
            const url = buildshareurl(courseid, simslug);
            if (url) {
                // Use pushState so browser back button can navigate within the platform
                const currentUrl = window.location.href;
                if (url !== currentUrl) {
                    const level = simslug ? 'topic' : (courseid ? 'course' : 'home');
                    window.history.pushState({ level: level, courseId: courseid || null }, '', url);
                    window.currentNavLevel = level;
                    if (courseid) window.currentCourseId = courseid;
                }
            }
        }

        window.handleshareclick = async function (courseid) {
            const activeview = courseid ? document.getElementById(`view-${courseid}`) : document.querySelector('.view-section:not(.hidden)');
            const selecteditem = activeview?.querySelector('.chapter-item.selected');
            const sharecourseid = selecteditem?.dataset?.courseId || courseid;
            const shareslug = selecteditem?.dataset?.slug || '';
            const url = buildshareurl(sharecourseid, shareslug);

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: selecteditem?.querySelector('.chapter-title')?.textContent || 'Course',
                        url
                    });
                } else if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(url);
                    showBookmarkToast(courseid || 'my-learnings', 'Link copied');
                } else {
                    window.prompt('Copy this link:', url);
                }
            } catch (err) {
                console.error('share failed', err);
            }
        };

        async function applydeeplink() {
            const params = new URLSearchParams(window.location.search);
            let course = params.get('course');
            let sim = params.get('sim');

            // If not in URL, check sessionStorage
            // REMOVED: Do not restore from storage on fresh load to prevent "opening where left off"
            // if (!course) {
            //    course = sessionStorage.getItem('lp_current_course');
            //    sim = sessionStorage.getItem('lp_current_topic');
            // }

            // If no course specified, show home view
            if (!course) {
                // Ensure home is visible
                document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
                const homeView = document.getElementById('view-home');
                if (homeView) {
                    homeView.classList.remove('hidden');
                }
                // Ensure nav-home is active
                document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
                const navHome = document.getElementById('nav-home');
                if (navHome) navHome.classList.add('active');
                return;
            }

            // Switch to course WITHOUT updating URL (skipUrlUpdate: true)
            await switchprovider(course, null, { skipUrlUpdate: true });

            // Wait for chapters to be rendered before selecting
            if (sim) {
                // Wait for chapter items to be available
                const view = document.getElementById(`view-${course}`);
                if (view) {
                    // Retry until chapters are rendered (max 10 attempts, 100ms each)
                    let attempts = 0;
                    const waitForChapters = () => {
                        const chapterItems = view.querySelectorAll('.chapter-item');
                        if (chapterItems.length > 0) {
                            // Chapters are rendered, now select the topic
                            selectchapter(sim, course);
                            // AFTER successful topic selection, update URL state
                            updateurlstate(course, sim);
                        } else if (attempts < 10) {
                            attempts++;
                            setTimeout(waitForChapters, 100);
                        }
                    };
                    waitForChapters();
                } else {
                    // No sim to restore, just update URL for course
                    updateurlstate(course, null);
                }
            } else {
                // No sim to restore, just update URL for course
                updateurlstate(course, null);
            }
        }

        // --- navigation logic ---
        async function switchprovider(provider, callback, opts = {}) {
            const skipUrlUpdate = opts.skipUrlUpdate || false;
            const targetType = opts.type || 'course';
            const sectionId = opts.section_id || null;

            // Helper to scroll to specific section
            const scrollToSection = (sid) => {
                if (!sid || sid === 'none' || sid === 'null') return;
                console.log('[switchprovider] Instant jump to section:', sid);
                
                // Use multiple attempts to find the section element
                let attempts = 0;
                const tryScroll = () => {
                    const sectionEl = document.getElementById(`header-${sid}`);
                    const itemsEl = document.getElementById(`items-${sid}`);
                    
                    if (sectionEl && itemsEl) {
                        console.log('[switchprovider] Found section, loading content immediately:', sid);
                        
                        // Ensure section is expanded
                        if (itemsEl.classList.contains('collapsed')) {
                            if (window.togglecoursesection) window.togglecoursesection(sid);
                        }
                        
                        // Instant jump
                        sectionEl.scrollIntoView({ behavior: 'auto', block: 'start' });
                        
                        // Select first topic in section
                        const firstTopic = itemsEl.querySelector('.chapter-item');
                        if (firstTopic) {
                            console.log('[switchprovider] Triggering selectchapter for first topic in section:', sid);
                            if (window.selectchapter) window.selectchapter(firstTopic);
                        }
                    } else if (attempts < 15) {
                        attempts++;
                        setTimeout(tryScroll, 50);
                    }
                };
                
                // Jump as fast as possible
                tryScroll();
            };

            // Hide any info pages when navigating to a course/home
            document.querySelectorAll('.info-page').forEach(el => el.classList.add('hidden'));

            let actualProvider = provider;

            if (targetType === 'category') {
                // If it's a category, find the first course in this category
                const courses = window.courses || [];
                const firstCourse = courses.find(c => (c.category || 'skill') === provider);
                if (firstCourse) {
                    actualProvider = firstCourse.id;
                    // Also ensure the category is expanded in the sidebar
                    const menu = document.getElementById(`menu-${provider}`);
                    if (menu && menu.classList.contains('collapsed')) {
                        if (window.togglesidebarcategory) window.togglesidebarcategory(provider);
                    }
                }
            }

            // Let Admin selected IDs take precedence
            actualProvider = String(actualProvider);

            document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            const navid = `nav-${actualProvider}`;
            const navel = document.getElementById(navid);
            if (navel) navel.classList.add('active');

            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
            const viewid = `view-${actualProvider}`;
            let viewel = document.getElementById(viewid);

            // If view doesn't exist, create it
            if (!viewel) {
                const viewscontainer = document.getElementById('dynamic-course-views');
                if (viewscontainer) {
                    viewel = document.createElement('div');
                    viewel.id = viewid;
                    viewel.className = 'view-section hidden';
                    viewscontainer.appendChild(viewel);
                }
            }

            if (viewel) viewel.classList.remove('hidden');

            // toggle course view class (hides footer & expands layout)
            if (actualProvider !== 'home') {
                document.body.classList.add('is-course-view');
            } else {
                document.body.classList.remove('is-course-view');
            }

            // Close hamburger sidebar when entering course view (both mobile and desktop)
            if (actualProvider !== 'home' && actualProvider !== 'my-learnings') {
                document.body.classList.remove('sidebar-open');
                // Remove topic view state when switching courses (show course contents, not topic)
                document.body.classList.remove('is-topic-view');

                const isMobile = window.matchMedia('(max-width: 900px)').matches;
                // Clear any landing page content from all course views on mobile
                if (isMobile) {
                    document.querySelectorAll('.viewer-screen').forEach(screen => {
                        if (screen) {
                            screen.classList.remove('has-landing');
                            // Only clear landing content, not iframe content
                            if (screen.querySelector('.course-landing') && !screen.querySelector('iframe')) {
                                screen.innerHTML = '';
                            }
                        }
                    });
                }
            }

            if (actualProvider === 'my-learnings') {
                document.body.classList.remove('sidebar-open');
                document.body.classList.remove('is-topic-view');
                document.body.classList.add('is-course-view');
                renderMyLearningsView();
                if (!skipUrlUpdate) updateurlstate(null, null);
                if (callback) callback();
                return Promise.resolve();
            }

            if (actualProvider === 'home') {
                // Restore home content that showPage may have hidden
                const viewHome = document.getElementById('view-home');
                if (viewHome) {
                    viewHome.querySelectorAll('.hero-section, .home-lower-section').forEach(el => el.style.display = '');
                }
                // Hide any open info pages
                document.querySelectorAll('.info-page').forEach(el => el.classList.add('hidden'));

                // Update header active state
                document.querySelectorAll('.header-nav-link').forEach(el => {
                    el.classList.remove('active');
                    if (el.textContent.trim() === 'Home') el.classList.add('active');
                });

                if (!skipUrlUpdate) updateurlstate(null, null);
                if (callback) callback();
                return Promise.resolve();
            }

            // For course views, check if course is already loaded
            const view = document.getElementById(viewid);
            if (view && view.querySelector('.chapter-sidebar')) {
                // Course is already rendered
                // Ensure landing page is cleared when switching courses or targeting a section
                const isMobile = window.matchMedia('(max-width: 900px)').matches;
                const isTargetingSection = sectionId && sectionId !== 'none' && sectionId !== 'null' && sectionId !== '';
                
                if (isMobile || isTargetingSection) {
                    const viewerScreen = view.querySelector('.viewer-screen');
                    if (viewerScreen) {
                        console.log('[switchprovider] Clearing landing page for course:', actualProvider, 'isTargetingSection:', isTargetingSection);
                        viewerScreen.classList.remove('has-landing');
                        // Only clear if no topic is currently selected (no iframe content)
                        if (!viewerScreen.querySelector('iframe')) {
                            viewerScreen.innerHTML = '';
                        }
                    }
                }

                if (!skipUrlUpdate) updateurlstate(actualProvider, null);
                // PERMANENT FIX: Don't move auth button on mobile
                if (!isMobile) {
                    const authWrap = document.getElementById('auth-button-wrap');
                    const mainContent = document.querySelector('.main-content');
                    if (authWrap && mainContent && authWrap.parentElement !== mainContent) {
                        mainContent.insertBefore(authWrap, mainContent.firstChild);
                    }
                }
                // Footer text update removed - was corrupting GradStudio logo text
                
                scrollToSection(sectionId);

                if (callback) callback();
                return Promise.resolve();
            }

            // Course not loaded yet - need to load it
            return new Promise(async (resolve) => {
                // Find course metadata
                const courses = window.courses || [];
                console.log('[switchprovider] Looking for course with actualProvider:', actualProvider);
                console.log('[switchprovider] Available courses:', courses.map(c => ({ id: c.id, title: c.title })));
                let course = courses.find(c => c.id === actualProvider);

                // If not found in courses array but using mock data, try to get from mock data directly
                if (!course && USE_MOCK_DATA) {
                    console.log('[switchprovider] Course not in courses array, checking mock data directly...');
                    const mockCourseData = getMockCourse(actualProvider);
                    if (mockCourseData) {
                        // Create a course object from mock data
                        course = {
                            id: mockCourseData.id || actualProvider,
                            title: mockCourseData.title || actualProvider,
                            icon_class: 'fa-brands fa-microsoft' // Default icon, will be overridden if found
                        };
                        // Try to find icon from courses array by matching title
                        const matchingCourse = courses.find(c => c.id.toLowerCase() === actualProvider.toLowerCase() || c.title.toLowerCase() === (mockCourseData.title || '').toLowerCase());
                        if (matchingCourse) {
                            course.icon_class = matchingCourse.icon_class;
                        }
                        console.log('[switchprovider] Created course object from mock data:', course);
                    }
                }

                if (!course) {
                    console.error(`[switchprovider] Course not found: ${actualProvider} (mapped from ${provider})`);
                    console.log('[switchprovider] Available courses:', courses.map(c => c.id));
                    if (USE_MOCK_DATA) {
                        console.log('[switchprovider] Available mock course keys:', Object.keys(MOCK_DATA.courseData));
                    }

                    // Show error message in the view
                    const view = document.getElementById(viewid);
                    if (view) {
                        view.innerHTML = `
                                    <div class="course-header">
                                        <div class="course-logo"><i class="fa-solid fa-exclamation-triangle"></i></div>
                                        <div class="course-title">Course Not Found</div>
                                    </div>
                                    <div style="padding: 40px; text-align: center; color: #c33;">
                                        <p>Course "${actualProvider}" is not available.</p>
                                        <p style="font-size: 12px; color: #666; margin-top: 8px;">Available courses: ${courses.map(c => c.id).join(', ') || 'none'}</p>
                                        ${USE_MOCK_DATA ? `<p style="font-size: 12px; color: #666; margin-top: 8px;">Mock data keys: ${Object.keys(MOCK_DATA.courseData).join(', ')}</p>` : ''}
                                    </div>
                                `;
                    }

                    if (callback) callback();
                    resolve();
                    return;
                }

                try {
                    // On mobile, ensure landing page is cleared before loading course
                    const isMobile = window.matchMedia('(max-width: 900px)').matches;
                    if (isMobile) {
                        const viewerScreen = document.getElementById(`viewer-screen-${course.id}`);
                        if (viewerScreen) {
                            viewerScreen.classList.remove('has-landing');
                            // Clear landing content if present (but preserve iframe if topic is open)
                            if (viewerScreen.querySelector('.course-landing') && !viewerScreen.querySelector('iframe')) {
                                viewerScreen.innerHTML = '';
                            }
                        }
                    }

                    // Load and render course
                    console.log('[switchprovider] Loading course:', course.id, 'with title:', course.title, 'sectionId:', sectionId);
                    const itemcount = await loadandrendercourse(
                        course.id,
                        viewid,
                        course.title,
                        course.icon_class,
                        sectionId
                    );
                    console.log('[switchprovider] Course loaded, item count:', itemcount);
                    window.courseitemcounts[course.id] = itemcount;

                    if (!skipUrlUpdate) updateurlstate(actualProvider, null);
                    // PERMANENT FIX: Don't move auth button on mobile
                    if (!isMobile) {
                        const authWrap = document.getElementById('auth-button-wrap');
                        const mainContent = document.querySelector('.main-content');
                        if (authWrap && mainContent && authWrap.parentElement !== mainContent) {
                            mainContent.insertBefore(authWrap, mainContent.firstChild);
                        }
                    }
                    // Footer text update removed - was corrupting GradStudio logo text

                    scrollToSection(sectionId);

                    // Course is now fully rendered
                    if (callback) callback();
                    resolve();
                } catch (error) {
                    console.error(`Failed to load course ${course.id}:`, error);
                    // Show error in view
                    const view = document.getElementById(viewid);
                    if (view) {
                        view.innerHTML = `
                                    <div class="course-header">
                                        <div class="course-logo"><i class="${course.icon_class}"></i></div>
                                        <div class="course-title">${course.title}</div>
                                    </div>
                                    <div style="padding: 40px; text-align: center; color: #c33;">
                                        <p>Failed to load course content.</p>
                                        <p style="font-size: 12px; color: #666; margin-top: 8px;">Error: ${error.message || 'Unknown error'}</p>
                                        <button onclick="switchProvider('${actualProvider}')" style="margin-top: 16px; padding: 8px 16px; border: 1px solid #ccc; border-radius: 6px; cursor: pointer;">Retry</button>
                                    </div>
                                `;
                    }
                    if (callback) callback();
                    resolve();
                }
            });
        }
        async function switchProvider(provider, callback, opts) {
            return await switchprovider(provider, callback, opts);
        }
        window.switchProvider = switchProvider;

        // --- info page navigation ---
        function showPage(pageId) {
            // Remove course view state
            document.body.classList.remove('is-course-view');
            document.body.classList.remove('is-topic-view');
            document.body.classList.remove('sidebar-open');

            // Hide all dynamic course views
            document.querySelectorAll('#dynamic-course-views .view-section').forEach(el => el.classList.add('hidden'));

            // Make sure view-home is visible (info pages live inside it)
            const viewHome = document.getElementById('view-home');
            if (viewHome) viewHome.classList.remove('hidden');

            // Hide home-specific content sections
            const homeContent = viewHome ? viewHome.querySelectorAll('.hero-section, .home-lower-section') : [];
            homeContent.forEach(el => el.style.display = 'none');

            // Hide all info pages, then show the target one
            document.querySelectorAll('.info-page').forEach(el => el.classList.add('hidden'));
            const page = document.getElementById(`page-${pageId}`);
            if (page) {
                page.classList.remove('hidden');
            }

            // Show footer
            const footer = document.querySelector('.main-footer');
            if (footer) footer.style.display = '';

            // Update header nav active states
            document.querySelectorAll('.header-nav-link').forEach(el => {
                el.classList.remove('active');
                if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(`showPage('${pageId}')`)) {
                    el.classList.add('active');
                }
            });

            // Scroll to top
            window.scrollTo(0, 0);
            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;

            // Update URL if supported
            if (window.history.pushState) {
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?page=' + pageId;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }
        }
        window.showPage = showPage;

        // Add check for URL parameter on load
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const pageId = urlParams.get('page');
            if (pageId) {
                setTimeout(() => showPage(pageId), 100);
            }
        });

        // ===== HEADER SEARCH FUNCTIONALITY =====
        (function () {
            const searchInput = document.getElementById('header-search-input');
            const searchDropdown = document.getElementById('header-search-dropdown');
            if (!searchInput || !searchDropdown) return;

            let activeIndex = -1;

            function getSearchableItems() {
                const items = [];

                // Use window.courses (populated from live API or mock)
                const availableCourses = window.courses || [];
                const availableIds = new Set(availableCourses.map(c => c.id));

                // Add courses
                availableCourses.forEach(c => {
                    items.push({ type: 'course', id: c.id, title: c.title, icon: c.icon_class, sub: '' });
                });

                // Add topics from API cache (live data) first, then fall back to MOCK_DATA
                const apiCacheMap = (window.learningapi && apiCache) ? apiCache.cache : null;
                const usedCourseIds = new Set();

                // Try API cache first (has live data)
                if (apiCacheMap) {
                    apiCacheMap.forEach((val, key) => {
                        if (!key.startsWith('course:')) return;
                        const courseId = key.replace('course:', '');
                        if (!availableIds.has(courseId)) return;
                        const course = val.data;
                        if (!course || !course.sections) return;
                        usedCourseIds.add(courseId);
                        course.sections.forEach(section => {
                            (section.simulations || section.items || []).forEach(sim => {
                                items.push({
                                    type: 'topic',
                                    courseId: courseId,
                                    courseTitle: course.title || courseId,
                                    sectionTitle: section.title || '',
                                    simId: sim.id,
                                    title: sim.title || sim.name || '',
                                    icon: (availableCourses.find(c => c.id === courseId) || {}).icon_class || 'fa-solid fa-book',
                                    sub: (course.title || courseId) + ' > ' + (section.title || '')
                                });
                            });
                        });
                    });
                }

                // Fall back to MOCK_DATA for courses not in API cache
                const mockData = (typeof MOCK_DATA !== 'undefined') ? MOCK_DATA : null;
                if (mockData && mockData.courseData) {
                    Object.keys(mockData.courseData).forEach(courseId => {
                        if (!availableIds.has(courseId) || usedCourseIds.has(courseId)) return;
                        const course = mockData.courseData[courseId];
                        (course.sections || []).forEach(section => {
                            (section.simulations || []).forEach(sim => {
                                items.push({
                                    type: 'topic',
                                    courseId: courseId,
                                    courseTitle: course.title,
                                    sectionTitle: section.title,
                                    simId: sim.id,
                                    title: sim.title || sim.name || '',
                                    icon: (availableCourses.find(c => c.id === courseId) || {}).icon_class || 'fa-solid fa-book',
                                    sub: course.title + ' > ' + section.title
                                });
                            });
                        });
                    });
                }

                // Add info pages
                ['About', 'Contact', 'Privacy Policy', 'Terms of Service', 'Cookie Policy'].forEach(p => {
                    items.push({ type: 'page', id: p.toLowerCase().replace(/\s+/g, '-'), title: p, icon: 'fa-solid fa-file-lines', sub: 'Page' });
                });

                return items;
            }

            function highlightMatch(text, query) {
                if (!query) return text;
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
            }

            function renderResults(query) {
                const items = getSearchableItems();
                const q = query.trim().toLowerCase();
                if (!q) { searchDropdown.classList.add('hidden'); return; }

                const matches = items.filter(item => {
                    return item.title.toLowerCase().includes(q) ||
                        (item.sub && item.sub.toLowerCase().includes(q)) ||
                        (item.courseTitle && item.courseTitle.toLowerCase().includes(q));
                });

                if (matches.length === 0) {
                    searchDropdown.innerHTML = '<div class="search-no-results">No results for "' + query.replace(/</g, '&lt;') + '"</div>';
                    searchDropdown.classList.remove('hidden');
                    activeIndex = -1;
                    return;
                }

                // Group by type
                const courses = matches.filter(m => m.type === 'course');
                const topics = matches.filter(m => m.type === 'topic');
                const pages = matches.filter(m => m.type === 'page');

                let html = '';
                let idx = 0;

                if (courses.length) {
                    html += '<div class="search-result-group-label">Courses</div>';
                    courses.forEach(c => {
                        html += '<div class="search-result-item" data-idx="' + idx + '" data-type="course" data-id="' + c.id + '">'
                            + '<div class="search-result-icon"><i class="' + c.icon + '"></i></div>'
                            + '<div class="search-result-text"><div class="search-result-title">' + highlightMatch(c.title, q) + '</div></div>'
                            + '</div>';
                        idx++;
                    });
                }

                if (topics.length) {
                    html += '<div class="search-result-group-label">Topics</div>';
                    topics.slice(0, 15).forEach(t => {
                        html += '<div class="search-result-item" data-idx="' + idx + '" data-type="topic" data-course="' + t.courseId + '" data-sim="' + t.simId + '">'
                            + '<div class="search-result-icon"><i class="' + t.icon + '"></i></div>'
                            + '<div class="search-result-text">'
                            + '<div class="search-result-title">' + highlightMatch(t.title, q) + '</div>'
                            + '<div class="search-result-sub">' + t.sub + '</div>'
                            + '</div></div>';
                        idx++;
                    });
                }

                if (pages.length) {
                    html += '<div class="search-result-group-label">Pages</div>';
                    pages.forEach(p => {
                        html += '<div class="search-result-item" data-idx="' + idx + '" data-type="page" data-id="' + p.id + '">'
                            + '<div class="search-result-icon"><i class="' + p.icon + '"></i></div>'
                            + '<div class="search-result-text"><div class="search-result-title">' + highlightMatch(p.title, q) + '</div>'
                            + '<div class="search-result-sub">Page</div></div>'
                            + '</div>';
                        idx++;
                    });
                }

                searchDropdown.innerHTML = html;
                searchDropdown.classList.remove('hidden');
                activeIndex = -1;
            }

            function selectResult(el) {
                const type = el.dataset.type;
                searchInput.value = '';
                searchDropdown.classList.add('hidden');

                if (type === 'course') {
                    switchprovider(el.dataset.id);
                } else if (type === 'topic') {
                    // Navigate to course, then select topic
                    const courseId = el.dataset.course;
                    const simId = el.dataset.sim;
                    switchprovider(courseId, function () {
                        // Find and click the simulation
                        const simEl = document.querySelector('.chapter-item[data-sim-id="' + simId + '"]');
                        if (simEl) simEl.click();
                    });
                } else if (type === 'page') {
                    const pageId = el.dataset.id;
                    if (pageId === 'about' || pageId === 'contact') {
                        showPage(pageId);
                    } else {
                        showPage(pageId);
                    }
                }
            }

            searchInput.addEventListener('input', function () {
                renderResults(this.value);
            });

            searchInput.addEventListener('keydown', function (e) {
                const items = searchDropdown.querySelectorAll('.search-result-item');
                if (!items.length) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    activeIndex = Math.min(activeIndex + 1, items.length - 1);
                    items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
                    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    activeIndex = Math.max(activeIndex - 1, 0);
                    items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
                    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (activeIndex >= 0 && items[activeIndex]) {
                        selectResult(items[activeIndex]);
                    }
                } else if (e.key === 'Escape') {
                    searchDropdown.classList.add('hidden');
                    searchInput.blur();
                }
            });

            searchDropdown.addEventListener('click', function (e) {
                const item = e.target.closest('.search-result-item');
                if (item) selectResult(item);
            });

            // Close dropdown on outside click
            document.addEventListener('click', function (e) {
                if (!e.target.closest('.header-search')) {
                    searchDropdown.classList.add('hidden');
                }
            });

            // Re-show on focus if there's text
            searchInput.addEventListener('focus', function () {
                if (this.value.trim()) renderResults(this.value);
            });

            // Expose for mobile search reuse
            window._searchGetItems = getSearchableItems;
            window._searchHighlight = highlightMatch;
            window._searchSelectResult = selectResult;
            window.MOCK_DATA = typeof MOCK_DATA !== 'undefined' ? MOCK_DATA : null;
        })();

        // ===== MOBILE SEARCH OVERLAY =====
        (function() {
            var overlay = document.getElementById('mobile-search-overlay');
            var input = document.getElementById('mobile-search-input');
            var resultsEl = document.getElementById('mobile-search-results');
            if (!overlay || !input || !resultsEl) return;

            function renderMobileResults(query) {
                var getItems = window._searchGetItems;
                var highlight = window._searchHighlight;
                if (!getItems || !highlight) return;
                var items = getItems();
                var q = query.trim().toLowerCase();
                if (!q) { resultsEl.innerHTML = ''; return; }

                var matches = items.filter(function(item) {
                    return item.title.toLowerCase().includes(q) ||
                        (item.sub && item.sub.toLowerCase().includes(q)) ||
                        (item.courseTitle && item.courseTitle.toLowerCase().includes(q));
                });

                if (matches.length === 0) {
                    resultsEl.innerHTML = '<div class="search-no-results">No results for "' + query.replace(/</g, '&lt;') + '"</div>';
                    return;
                }

                var courses = matches.filter(function(m) { return m.type === 'course'; });
                var topics = matches.filter(function(m) { return m.type === 'topic'; });
                var pages = matches.filter(function(m) { return m.type === 'page'; });
                var html = '';

                if (courses.length) {
                    html += '<div class="search-result-group-label">Courses</div>';
                    courses.forEach(function(c) {
                        html += '<div class="search-result-item" data-type="course" data-id="' + c.id + '">'
                            + '<div class="search-result-icon"><i class="' + c.icon + '"></i></div>'
                            + '<div class="search-result-text"><div class="search-result-title">' + highlight(c.title, q) + '</div></div></div>';
                    });
                }
                if (topics.length) {
                    html += '<div class="search-result-group-label">Topics</div>';
                    topics.slice(0, 20).forEach(function(t) {
                        html += '<div class="search-result-item" data-type="topic" data-course="' + t.courseId + '" data-sim="' + t.simId + '">'
                            + '<div class="search-result-icon"><i class="' + t.icon + '"></i></div>'
                            + '<div class="search-result-text"><div class="search-result-title">' + highlight(t.title, q) + '</div>'
                            + '<div class="search-result-sub">' + t.sub + '</div></div></div>';
                    });
                }
                if (pages.length) {
                    html += '<div class="search-result-group-label">Pages</div>';
                    pages.forEach(function(p) {
                        html += '<div class="search-result-item" data-type="page" data-id="' + p.id + '">'
                            + '<div class="search-result-icon"><i class="' + p.icon + '"></i></div>'
                            + '<div class="search-result-text"><div class="search-result-title">' + highlight(p.title, q) + '</div>'
                            + '<div class="search-result-sub">Page</div></div></div>';
                    });
                }
                resultsEl.innerHTML = html;
            }

            input.addEventListener('input', function() { renderMobileResults(this.value); });

            resultsEl.addEventListener('click', function(e) {
                var item = e.target.closest('.search-result-item');
                if (item && window._searchSelectResult) {
                    window._searchSelectResult(item);
                    closeMobileSearch();
                }
            });

            window.openMobileSearch = function() {
                overlay.classList.remove('hidden');
                input.value = '';
                resultsEl.innerHTML = '';
                setTimeout(function() { input.focus(); }, 100);
            };

            window.closeMobileSearch = function() {
                overlay.classList.add('hidden');
                input.value = '';
                resultsEl.innerHTML = '';
            };
        })();




        // --- carousel scroll logic ---
        window.scrollcarousel = function (direction, carouselId = 'subject-carousel') {
            const container = document.getElementById(carouselId);
            if (container) {
                // Increased scroll amounts for smoother, snappier navigation
                const scrollamount = carouselId === 'subject-carousel' ? 440 : 800;
                container.scrollBy({ left: scrollamount * direction, behavior: 'smooth' });
            }
        };

        window.scrollSecondaryCarousel = function(direction) {
            window.scrollcarousel(direction, 'secondary-carousel');
        };

        // --- homepage slider logic ---
        const homeSlides = [
            'https://raw.githubusercontent.com/sabs-27/images/main/AWS1.jpg',
            'https://raw.githubusercontent.com/sabs-27/images/main/AWS%202.jpg',
            'https://raw.githubusercontent.com/sabs-27/images/main/AWS%203.jpg'
        ];
        let currentHomeSlide = 0;
        let homeSliderImg = null;

        function updateHomeSlide() {
            if (!homeSliderImg) return;
            homeSliderImg.style.opacity = '0';
            setTimeout(() => {
                homeSliderImg.src = homeSlides[currentHomeSlide];
                homeSliderImg.onload = () => {
                    homeSliderImg.style.opacity = '1';
                };
            }, 200);
        }

        function nextSlide() {
            currentHomeSlide = (currentHomeSlide + 1) % homeSlides.length;
            updateHomeSlide();
        }

        function prevSlide() {
            currentHomeSlide = (currentHomeSlide - 1 + homeSlides.length) % homeSlides.length;
            updateHomeSlide();
        }

        function initHomeSlider() {
            homeSliderImg = document.getElementById('slider-img');
            if (!homeSliderImg) return;
            homeSliderImg.style.opacity = '1';
        }

        window.nextSlide = nextSlide;
        window.prevSlide = prevSlide;

        // --- search logic ---
        const setupsearch = (inputid, clearid) => {
            const input = document.getElementById(inputid);
            const clearbtn = document.getElementById(clearid);
            if (!input) return;

            const handleinput = () => {
                const val = input.value.toLowerCase();
                if (val.length > 0) clearbtn.classList.add('show');
                else clearbtn.classList.remove('show');

                document.querySelectorAll('.sidebar-item').forEach(item => {
                    if (item.closest('.search-container')) return;
                    item.style.display = item.textContent.toLowerCase().includes(val) ? 'flex' : 'none';
                });

                document.querySelectorAll('.sidebar-header').forEach(header => {
                    const nextmenu = header.nextElementSibling;
                    const hasvisible = Array.from(nextmenu.children).some(child => child.style.display !== 'none');
                    header.style.display = hasvisible ? 'block' : 'none';
                });
            };

            input.addEventListener('input', handleinput);
            if (clearbtn) {
                clearbtn.addEventListener('click', () => {
                    input.value = '';
                    handleinput();
                });
            }
        };

        // --- theme picker logic ---
        const initthemepicker = () => {
            const themepickerbtn = document.getElementById('theme-picker-btn');
            const themepickerpopover = document.getElementById('theme-picker-popover');
            const themepickerclose = document.getElementById('theme-picker-close');
            const themeoptions = document.querySelectorAll('.theme-option');

            // load saved theme from localstorage
            const savedtheme = localStorage.getItem('selectedtheme') || 'navy';
            applyTheme(savedtheme);

            if (!themepickerbtn || !themepickerpopover || !themepickerclose) return;

            // toggle popover
            themepickerbtn.addEventListener('click', (e) => {
                e.stopPropagation();
                themepickerpopover.classList.toggle('show');
            });

            // close popover
            themepickerclose.addEventListener('click', () => {
                themepickerpopover.classList.remove('show');
            });

            // close popover when clicking outside
            document.addEventListener('click', (e) => {
                if (!themepickerpopover.contains(e.target) && !themepickerbtn.contains(e.target)) {
                    themepickerpopover.classList.remove('show');
                }
            });

            // handle theme selection
            themeoptions.forEach(option => {
                option.addEventListener('click', () => {
                    const theme = option.getAttribute('data-theme');
                    applyTheme(theme);
                    localStorage.setItem('selectedtheme', theme);

                    // update selected state
                    themeoptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');

                    // close popover after selection
                    setTimeout(() => {
                        themepickerpopover.classList.remove('show');
                    }, 200);
                });
            });

            function applyTheme(theme) {
                // always apply the theme attribute explicitly
                document.body.setAttribute('data-theme', theme);

                // update selected state in ui
                themeoptions.forEach(opt => {
                    if (opt.getAttribute('data-theme') === theme) {
                        opt.classList.add('selected');
                    } else {
                        opt.classList.remove('selected');
                    }
                });
            }
        };


        // --- Content dropdown helper (Mega Menu) ---
        function populateContentDropdownInline(courses, categories) {
            const container = document.getElementById('mega-menu-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            // Mark categories with type if not present
            const enhancedCategories = categories.map(cat => ({
                ...cat,
                type: cat.type || 'category',
                name: cat.name || cat.title
            }));

            // Create root column (Categories)
            renderMegaMenuColumn(container, 0, 'root', enhancedCategories, courses);
        }

        function renderMegaMenuColumn(container, level, parentId, items, allCourses) {
            // Remove any existing columns at this level or higher
            const existingCols = container.querySelectorAll('.mega-menu-column');
            existingCols.forEach(col => {
                if (parseInt(col.dataset.level) >= level) {
                    col.remove();
                }
            });

            if (!items || items.length === 0) return;

            const column = document.createElement('div');
            column.className = 'mega-menu-column';
            column.dataset.level = level;
            column.dataset.parentId = parentId;

            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'mega-menu-item';
                
                const type = item.type || 'course';
                const isExpandable = type === 'category' || type === 'subcategory';
                
                const icon = item.icon_class || (type === 'category' ? 'fa-solid fa-layer-group' : 'fa-solid fa-book');
                
                menuItem.innerHTML = `
                    <div class="mega-menu-course-item">
                        <i class="${icon}"></i>
                        <span>${item.name || item.title}</span>
                    </div>
                    ${isExpandable ? '<i class="fa-solid fa-chevron-right chevron"></i>' : ''}
                `;

                menuItem.onmouseenter = () => {
                    // Update active state in current column
                    column.querySelectorAll('.mega-menu-item').forEach(el => el.classList.remove('active'));
                    menuItem.classList.add('active');

                    if (isExpandable) {
                        let children = [];
                        if (type === 'category') {
                            // Find top-level items for this category
                            // Search in allCourses, and also check if any course has this category
                            children = allCourses.filter(c => {
                                const catId = c.category || 'skill';
                                return catId === item.id && !c.parent_course_id;
                            });
                        } else {
                            // Find sub-items for this subcategory
                            // Check extensions property (tree) or parent_course_id (flat)
                            if (item.extensions && item.extensions.length > 0) {
                                children = item.extensions.filter(ext => !ext.title.endsWith(' Main')); // Filter out the "Main" item added by worker
                            } else {
                                children = allCourses.filter(c => c.parent_course_id === item.id);
                            }
                        }
                        
                        if (children.length > 0) {
                            renderMegaMenuColumn(container, level + 1, item.id, children, allCourses);
                        } else {
                            // Remove subsequent columns if no children
                            const nextCols = container.querySelectorAll('.mega-menu-column');
                            nextCols.forEach(col => {
                                if (parseInt(col.dataset.level) > level) {
                                    col.remove();
                                }
                            });
                        }
                    } else {
                        // Clear subsequent columns if this is a leaf node (course)
                        const nextCols = container.querySelectorAll('.mega-menu-column');
                        nextCols.forEach(col => {
                            if (parseInt(col.dataset.level) > level) {
                                col.remove();
                            }
                        });
                    }
                };

                menuItem.onclick = (e) => {
                    if (type === 'course') {
                        e.preventDefault();
                        switchProvider(item.id);
                        closeContentDropdown();
                    }
                };

                column.appendChild(menuItem);
            });

            container.appendChild(column);

            // Auto-select first item if it's the first level
            if (level === 0 && items.length > 0) {
                const firstItem = column.firstChild;
                if (firstItem && firstItem.onmouseenter) firstItem.onmouseenter();
            }
        }
        
        // --- initialization ---
        // store item counts for each course
        window.courseitemcounts = {};

        function handleAdminRefresh() {
            window.location.reload();
        }

        window.addEventListener('storage', (event) => {
            if (event.key === 'lp_admin_refresh') {
                handleAdminRefresh();
            }
        });

        document.addEventListener('DOMContentLoaded', async () => {
            console.log('learning platform initializing...');
            // CRITICAL: Load carousels immediately without waiting for courses/categories
            refreshCarousel();
            refreshDynamicCarousels();
            console.log('Version: v2.0 - Updated 2026-02-02 19:15');

            // Check for saved state early to prevent home view flash
            const params = new URLSearchParams(window.location.search);
            const urlCourse = params.get('course');
            // REMOVED: const savedCourse = sessionStorage.getItem('lp_current_course');
            if (urlCourse) {
                // Hide home view immediately if we're restoring a course
                const homeView = document.getElementById('view-home');
                if (homeView) {
                    homeView.classList.add('hidden');
                }
            }

            renderAuthButton();
            const authform = document.getElementById('auth-form');
            if (authform) authform.addEventListener('submit', handleAuthSubmit);

            const authmodal = document.getElementById('auth-modal');
            if (authmodal) {
                authmodal.addEventListener('click', (e) => {
                    if (e.target === authmodal) closeAuthModal();
                });
            }

            window.addEventListener('message', (event) => {
                const data = event.data || {};
                if (data.type === 'auth-success') {
                    setAuthState({
                        token: data.token,
                        email: data.user?.email,
                        displayName: data.user?.display_name || data.user?.email?.split('@')[0],
                        hasFullAccess: true
                    });
                    closeAuthModal();
                    renderAuthButton();
                    location.reload();
                }
            });

            // Sidebar search removed - setupsearch('service-search', 'clear-service-search');
            initthemepicker();

            // Initialize Lucide icons for header
            if (window.lucide) {
                lucide.createIcons();
            }

            try {
                // 1. fetch courses and categories
                let courses = [];
                let categories = [];

                if (USE_MOCK_DATA) {
                    // Use mock data
                    const coursesdata = getMockCourses();
                    courses = coursesdata.courses || [];
                    window.courses = courses;

                    const catsdata = getMockCategories();
                    categories = catsdata.categories || [];
                } else {
                    // Use live API
                    const api_base = API_CONFIG.baseUrl;
                    const cacheBust = Date.now();
                    const [coursesres, catsres] = await Promise.all([
                        fetch(`${api_base}/api/courses?t=${cacheBust}`),
                        fetch(`${api_base}/api/categories?t=${cacheBust}`)
                    ]);

                  const coursesdata = await coursesres.json();
                  courses = (coursesdata.courses || []).filter(c => c && c.title && c.id && c.title.toLowerCase() !== 'null');
                  // Store courses globally for navigation
                  window.courses = courses;

                    const catsdata = await catsres.json();
                    categories = catsdata.categories || [];
                }



                // helper function to create course sidebar item (supports nesting)
                function renderSidebarCourseItem(course, depth = 0) {
                    const li = document.createElement('li');
                    li.className = 'sidebar-item';
                    li.id = `nav-${course.id}`;
                    li.onclick = () => switchprovider(course.id);
                    if (depth > 0) li.style.paddingLeft = (depth * 16 + 12) + 'px';
                    
                    const isunlocked = AccessState.isLoggedIn || Boolean(AccessState.authToken);
                    const lockicon = course.is_locked && !isunlocked
                        ? ' <span class="sidebar-lock" title="locked"><i data-lucide="lock"></i></span>'
                        : '';
                    li.innerHTML = `<i class="${course.icon_class}"></i> <span class="sidebar-item-label">${course.title}${lockicon}</span>`;
                    
                    const fragment = document.createDocumentFragment();
                    fragment.appendChild(li);

                    // Find sub-courses
                    const subCourses = courses.filter(c => c.parent_course_id === course.id);
                    if (subCourses.length > 0) {
                        subCourses.sort((a,b) => (a.display_order||0)-(b.display_order||0));
                        subCourses.forEach(sub => {
                            fragment.appendChild(renderSidebarCourseItem(sub, depth + 1));
                        });
                    }
                    return fragment;
                }

                // render sidebar
                const sidebarcontainer = document.getElementById('dynamic-sidebar-content');
                sidebarcontainer.innerHTML = '';

                categories.forEach((cat, catindex) => {
                    // filter TOP-LEVEL courses for this category (no parent_course_id)
                    const catcourses = courses.filter(c => (c.category || 'skill') === cat.id && !c.parent_course_id);

                    const box = document.createElement('div');
                    box.className = 'sidebar-category-box';

                    const header = document.createElement('div');
                    header.className = 'sidebar-header';
                    header.id = `sidebar-header-${cat.id}`;
                    header.innerHTML = `
                                <span class="sidebar-header-text">${cat.name}</span>
                                <i data-lucide="chevron-down" class="sidebar-header-chevron"></i>
                            `;
                    header.onclick = () => togglesidebarcategory(cat.id);
                    box.appendChild(header);

                    const ul = document.createElement('ul');
                    ul.className = 'sidebar-menu';
                    ul.id = `menu-${cat.id}`;

                    if (catcourses.length === 0) {
                        ul.innerHTML = '<li class="sidebar-item" style="color:var(--text-muted);font-size:12px;cursor:default;">No courses</li>';
                    } else {
                        catcourses.sort((a,b) => (a.display_order||0)-(b.display_order||0));
                        catcourses.forEach(c => ul.appendChild(renderSidebarCourseItem(c, 0)));
                    }

                    box.appendChild(ul);
                    sidebarcontainer.appendChild(box);
                });

                // re-initialize lucide icons for new elements
                if (window.lucide) lucide.createIcons();

                // Update sidebar greeting with user name
                const greetingEl = document.getElementById('sidebar-greeting');
                if (greetingEl) {
                    const userName = localStorage.getItem('lp_user_display_name') || 'Guest';
                    greetingEl.textContent = `Hi, ${userName}`;
                }

                // Populate Content dropdown in header nav
                populateContentDropdownInline(courses, categories);

                // restore collapsed states from localstorage
                restorecollapsedstates();

                // initialize main sidebar resize
                initsidebarresize();

                // 3. create view sections dynamically
                const viewscontainer = document.getElementById('dynamic-course-views');
                viewscontainer.innerHTML = '';

                const myLearningsView = document.createElement('div');
                myLearningsView.id = 'view-my-learnings';
                myLearningsView.className = 'view-section hidden';
                viewscontainer.appendChild(myLearningsView);

                courses.forEach(course => {
                    const viewdiv = document.createElement('div');
                    viewdiv.id = `view-${course.id}`;
                    viewdiv.className = 'view-section hidden';
                    viewscontainer.appendChild(viewdiv);
                });

                // 4. load course content for each course
                for (const course of courses) {
                    const itemcount = await loadandrendercourse(
                        course.id,
                        `view-${course.id}`,
                        course.title,
                        course.icon_class
                    );
                    window.courseitemcounts[course.id] = itemcount;
                }

                // 5. load recent simulations
                // 5. load recent simulations - BYPASS CACHE to get fresh data
                let recentdata = null;
                try {
                    // Use direct API call, not cached version
                    recentdata = await window.learningapi.api.getrecentsimulations(5);
                } catch (e) {
                    console.warn('Failed to fetch recent simulations:', e);
                    // Fallback to cached if direct fails
                    recentdata = await window.learningapi.cachedapi.getrecentsimulations(5);
                }

                const recentcontainer = document.getElementById('recent-topics-container');
                if (recentcontainer) {
                    recentcontainer.innerHTML = '';

                    // Check if we have recent data
                    if (!recentdata || recentdata.length === 0) {
                        // Show placeholder when no recent topics
                        recentcontainer.innerHTML = `
                            <div class="recent-topic-card" style="justify-content: center; color: #6b7280; cursor: default;">
                                <span>Start exploring courses to see recent topics here</span>
                            </div>
                        `;
                    } else {
                        // Render each simulation
                        for (let i = 0; i < recentdata.length; i++) {
                            const sim = recentdata[i];
                            try {
                                // Get course data to find section info
                                let coursedata = null;
                                try {
                                    coursedata = await window.learningapi.cachedapi.getcourse(sim.course_id);
                                } catch (e) {
                                    console.warn(`Could not fetch course ${sim.course_id}:`, e);
                                }

                                // Find display ID from course structure
                                let displayId = `${i + 1}`; // Fallback: just use index
                                let sectionInfo = null;

                                if (coursedata && coursedata.sections) {
                                    let sectionIdx = 0;
                                    outerLoop:
                                    for (const section of coursedata.sections) {
                                        sectionIdx++;
                                        let simIdx = 0;
                                        for (const s of (section.simulations || [])) {
                                            simIdx++;
                                            if (s.id === sim.id) {
                                                sectionInfo = section;
                                                displayId = `${section.display_order || sectionIdx}.${s.display_order || simIdx}`;
                                                break outerLoop;
                                            }
                                        }
                                    }
                                }

                                const courseIcon = coursedata?.icon_class || sim.course_icon || 'fa-solid fa-book';
                                const courseName = coursedata?.title || sim.course_id || 'Course';

                                const card = document.createElement('div');
                                card.className = 'recent-topic-card';
                                card.dataset.courseId = (sim.course_id || '').toLowerCase();
                                card.dataset.simId = sim.id;

                                if (coursedata) {
                                    card.onclick = () => openTopicById(sim.course_id.toLowerCase(), sim.id);
                                    card.style.cursor = 'pointer';
                                } else {
                                    card.style.cursor = 'default';
                                    card.style.opacity = '0.6';
                                }

                                card.innerHTML = `
                                    <div class="recent-topic-left">
                                        <span class="recent-topic-badge">${displayId}</span>
                                        <span class="recent-topic-title">${sim.title || 'Untitled'}</span>
                                    </div>
                                    <span class="recent-topic-chip">
                                        <i class="${courseIcon}"></i> ${courseName}
                                    </span>
                                `;

                                recentcontainer.appendChild(card);
                            } catch (error) {
                                console.error(`Failed to render recent topic ${i}:`, error);
                            }
                        }

                        // If no cards were added, show placeholder
                        if (recentcontainer.children.length === 0) {
                            recentcontainer.innerHTML = `
                                <div class="recent-topic-card" style="justify-content: center; color: #6b7280; cursor: default;">
                                    <span>Start exploring courses to see recent topics here</span>
                                </div>
                            `;
                        }
                    }

                    // re-initialize lucide icons
                    if (window.lucide) lucide.createIcons();
                }

                await refreshBookmarks();
                // Apply deeplink (checks URL and localStorage for saved state)
                await applydeeplink();
                console.log('learning platform ready!');

                // Background: preload all course data for global search
                if (!USE_MOCK_DATA && window.courses && window.learningapi) {
                    setTimeout(() => {
                        const coursesToPreload = window.courses.map(c => c.id);
                        let i = 0;
                        function preloadNext() {
                            if (i >= coursesToPreload.length) return;
                            const cid = coursesToPreload[i++];
                            window.learningapi.cachedapi.getcourse(cid)
                                .then(() => setTimeout(preloadNext, 100))
                                .catch(() => setTimeout(preloadNext, 100));
                        }
                        preloadNext();
                    }, 2000); // Start 2s after page ready to not interfere with user interaction
                }
                // Remove loading overlay
                const loadingOverlay = document.getElementById('app-loading-overlay');
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            } catch (error) {
                console.error('failed to initialize:', error);
                // show error in sidebar
                const sidebarmenu = document.getElementById('dynamic-courses-menu');
                if (sidebarmenu) {
                    sidebarmenu.innerHTML = `
                                <li class="sidebar-item" style="color: #ef4444; font-size: 12px;">
                                    <i data-lucide="alert-circle"></i> failed to load courses
                                </li>
                            `;
                }
            }

            // Always remove loading overlay (success or error)
            const loadingOverlayFinal = document.getElementById('app-loading-overlay');
            if (loadingOverlayFinal) loadingOverlayFinal.style.display = 'none';

            // Footer text update removed - was corrupting GradStudio logo text

            // --- Carousel dynamic rendering ---
            async function refreshCarousel() {
                const container = document.getElementById('subject-carousel');
                if (!container) {
                    console.log('Carousel 1: container #subject-carousel not found');
                    return;
                }

                try {
                    console.log('Carousel 1: fetching cards...');
                    const res = await fetch(`${API_CONFIG.baseUrl}/api/carousel?type=1&t=${Date.now()}`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    const cards = data.cards || [];
                    console.log(`Carousel 1: found ${cards.length} cards`);

                    if (data.header !== undefined) {
                        const headerEl = document.querySelector('.carousel-header-text');
                        if (headerEl) {
                            headerEl.textContent = data.header || 'Free Interactive Demos';
                            headerEl.style.display = (data.header || cards.length > 0) ? 'inline-flex' : 'none';
                        }
                    }

                    if (cards.length > 0) {
                        let html = '';
                        // Filter active cards explicitly in frontend too for extra safety
                        const activeCards = cards.filter(card => card.is_active !== 0 && card.is_active !== false && card.is_active !== '0');
                        
                        if (activeCards.length > 0) {
                            activeCards.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                            activeCards.forEach(card => {
                                const icon = card.icon_class || 'fa-solid fa-star';
                                const color = card.color_hex || '#3b82f6';
                                let cardStyle = `--accent-color: ${color};`;
                                const targetType = card.target_type || 'course';
                                const targetId = card.target_id || '';
                                
                                let extraClass = '';
                                const titleLower = (card.title || '').toLowerCase();
                                if (titleLower.includes('aws')) extraClass = 'card-aws';
                                else if (titleLower.includes('ai')) extraClass = 'card-devops';
                                else if (titleLower.includes('machine learning')) extraClass = 'card-docker';
                                else if (titleLower.includes('python')) extraClass = 'card-gcp';
                                else if (titleLower.includes('linux')) extraClass = 'card-linux';
                                else if (titleLower.includes('sql')) extraClass = 'card-sql';
                                else if (titleLower.includes('backend')) extraClass = 'card-backend';
                                else if (titleLower.includes('java')) extraClass = 'card-java';

                                html += `
                                    <div class="subject-card ${extraClass}" style="${cardStyle}" onclick="switchProvider('${targetId}', null, { type: '${targetType}', section_id: '${card.section_id || ''}' })">
                                        <div>
                                            <div class="subject-icon"><i class="${icon}"></i></div>
                                            <div class="subject-title">${card.title}</div>
                                            <div class="subject-desc">${card.description || ''}</div>
                                            <button class="subject-start-btn" onclick="event.stopPropagation(); switchProvider('${targetId}', null, { type: '${targetType}', section_id: '${card.section_id || ''}' });">
                                                <i class="fa-regular fa-circle-play"></i> Start Learning
                                            </button>
                                        </div>
                                    </div>
                                `;
                            });
                            container.innerHTML = html;
                            console.log('Carousel 1: rendered successfully');
                        } else {
                            container.innerHTML = '';
                            console.log('Carousel 1: no active cards found after filtering');
                        }
                    } else {
                        container.innerHTML = '';
                        console.log('Carousel 1: no cards returned from API');
                    }
                } catch (e) {
                    console.error('Failed to load dynamic carousel 1:', e);
                }
            }

            async function refreshDynamicCarousels() {
                const mainContainer = document.getElementById('dynamic-carousels-container');
                if (!mainContainer) return;

                try {
                    const res = await fetch(`${API_CONFIG.baseUrl}/api/carousels?t=${Date.now()}`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const carousels = await res.json();

                    let mainHtml = '';
                    
                    // Render all carousels EXCEPT the first one (which is the hero carousel)
                    const filteredCarousels = carousels.filter(c => c.id != 1);

                    filteredCarousels.forEach(carousel => {
                        const cards = carousel.cards || [];
                        const carouselId = `carousel-${carousel.id}`;
                        const headerId = `header-${carousel.id}`;
                        
                        let headerHtml = '';
                        const headerText = carousel.header || '';
                        if (headerText) {
                            const dotIndex = headerText.indexOf('.');
                            if (dotIndex !== -1) {
                                const firstPart = headerText.substring(0, dotIndex);
                                const secondPart = headerText.substring(dotIndex + 1);
                                headerHtml = `<h2 class="secondary-carousel-header" id="${headerId}" style="display:block; opacity:1;"><span class="header-bold">${firstPart}.</span> <span class="header-gray">${secondPart}</span></h2>`;
                            } else {
                                headerHtml = `<h2 class="secondary-carousel-header" id="${headerId}" style="display:block; opacity:1;"><span class="header-bold">${headerText}</span></h2>`;
                            }
                        }

                        let cardsHtml = '';
                        if (cards.length > 0) {
                            const activeCards = cards.filter(c => c.is_active !== 0 && c.is_active !== false && c.is_active !== '0');
                            
                            if (activeCards.length > 0) {
                                const firstCardHeight = (activeCards[0] && activeCards[0].height_px && activeCards[0].height_px !== 'auto') 
                                    ? activeCards[0].height_px 
                                    : '500px';

                                activeCards.forEach(card => {
                                    const targetType = card.target_type || 'course';
                                    const targetId = card.target_id || '';
                                    const width = card.width || '400px';
                                    const height = firstCardHeight;
                                    const isFullBleed = card.full_bleed === 1 || card.full_bleed === true || card.full_bleed === '1';
                                    const contentType = card.content_type || 'standard';
        
                                    let mediaHtml = '';
                                    if (contentType === 'image' && card.image_url) {
                                        mediaHtml = `<div class="secondary-card-media"><img src="${card.image_url}" alt="${card.title}" style="width:100%; height:100%; object-fit:cover;"></div>`;
                                    } else if (contentType === 'html' && card.content_html) {
                                        let rawHtml = card.content_html
                                            .replace(/&lt;/g, '<')
                                            .replace(/&gt;/g, '>')
                                            .replace(/&quot;/g, '"')
                                            .replace(/&#39;/g, "'")
                                            .replace(/&amp;/g, '&');
                                        mediaHtml = `<div class="secondary-card-media"><div class="html-content">${rawHtml}</div></div>`;
                                    } else if (contentType === 'iframe' && card.iframe_url) {
                                        mediaHtml = `<div class="secondary-card-media"><iframe src="${card.iframe_url}" style="width:100%; height:100%; border:none;"></iframe></div>`;
                                    } else if (contentType === 'standard' || !contentType) {
                                        mediaHtml = `<div class="secondary-card-media" style="background: ${card.color_hex || '#3b82f6'}; display: flex; align-items: center; justify-content: center; font-size: 48px; color: white; width:100%; height:100%;"><i class="${card.icon_class || 'fa-solid fa-star'}"></i></div>`;
                                    }
        
                                    const clickAction = (targetType === 'none' || !targetId || targetId === 'none') 
                                        ? '' 
                                        : `onclick="switchProvider('${targetId}', null, { type: '${targetType}', section_id: '${card.section_id || ''}' })"`;
        
                                    cardsHtml += `
                                        <div class="secondary-card ${isFullBleed ? 'full-bleed' : ''}" 
                                             style="width: ${width}; height: ${height}; flex: 0 0 ${width};"
                                             ${clickAction}>
                                            ${mediaHtml}
                                            <div class="secondary-card-content">
                                                <div class="secondary-card-kicker">${card.title}</div>
                                                <div class="secondary-card-title">${card.description || ''}</div>
                                            </div>
                                        </div>
                                    `;
                                });
                            } else {
                                cardsHtml = '<div style="padding:40px; color:#666; text-align:center; width:100%;">No cards available in this section.</div>';
                            }
                        } else {
                            cardsHtml = '<div style="padding:40px; color:#666; text-align:center; width:100%;">No cards available in this section.</div>';
                        }

                        mainHtml += `
                            <div class="carousel-wrapper secondary-carousel-wrapper">
                                ${headerHtml}
                                <div class="carousel-container" id="${carouselId}">
                                    ${cardsHtml}
                                </div>
                                <button class="carousel-nav-btn nav-prev" onclick="window.scrollcarousel(-1, '${carouselId}')" aria-label="Previous">
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                                <button class="carousel-nav-btn nav-next" onclick="window.scrollcarousel(1, '${carouselId}')" aria-label="Next">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        `;
                    });

                    mainContainer.innerHTML = mainHtml;
                } catch (e) {
                    console.error('Failed to load dynamic carousels:', e);
                }
            }

            // Keep the old function for compatibility if needed, but make it call the new one or just empty it
            async function refreshSecondaryCarousel() {
                await refreshDynamicCarousels();
            }

        // Listen for admin updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'lp_admin_refresh') {
                refreshCarousel();
                refreshSecondaryCarousel();
            }
        });

            initHomeSlider();


        });


        function toggleSidebarDrawer() {
            // Mobile guard: only toggle if screen width is mobile
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (!isMobile) return;

            document.body.classList.toggle('sidebar-open');
        }
        window.toggleSidebarDrawer = toggleSidebarDrawer;

        // Desktop sidebar toggle function
        function toggleSidebar() {
            document.body.classList.toggle('sidebar-open');
            // Re-initialize Lucide icons after toggle
            if (window.lucide) {
                setTimeout(() => lucide.createIcons(), 100);
            }
        }
        window.toggleSidebar = toggleSidebar;

        // Sidebar search filter
        function filterSidebarCourses(query) {
            const container = document.getElementById('dynamic-sidebar-content');
            if (!container) return;
            const boxes = container.querySelectorAll('.sidebar-category-box');
            const q = query.toLowerCase().trim();
            boxes.forEach(box => {
                if (!q) {
                    box.style.display = '';
                    box.querySelectorAll('.sidebar-item').forEach(item => item.style.display = '');
                    return;
                }
                const items = box.querySelectorAll('.sidebar-item');
                let hasMatch = false;
                items.forEach(item => {
                    const label = item.textContent.toLowerCase();
                    if (label.includes(q)) {
                        item.style.display = '';
                        hasMatch = true;
                    } else {
                        item.style.display = 'none';
                    }
                });
                // Also check category header text
                const header = box.querySelector('.sidebar-header');
                if (header && header.textContent.toLowerCase().includes(q)) {
                    hasMatch = true;
                    box.querySelectorAll('.sidebar-item').forEach(item => item.style.display = '');
                }
                box.style.display = hasMatch ? '' : 'none';
            });
        }
        window.filterSidebarCourses = filterSidebarCourses;

        function closeContentDropdown() {
            const panel = document.getElementById('content-dropdown-panel');
            if (panel) panel.classList.remove('show');
        }
        window.closeContentDropdown = closeContentDropdown;

        // Theme picker toggle function for header
        function toggleThemePicker() {
            const themepickerpopover = document.getElementById('theme-picker-popover');
            if (themepickerpopover) {
                themepickerpopover.classList.toggle('show');
                // Position popover relative to header button
                const toggleBtn = document.getElementById('header-theme-toggle');
                if (toggleBtn && themepickerpopover.classList.contains('show')) {
                    const rect = toggleBtn.getBoundingClientRect();
                    themepickerpopover.style.position = 'fixed';
                    themepickerpopover.style.top = (rect.bottom + 8) + 'px';
                    themepickerpopover.style.right = (window.innerWidth - rect.right) + 'px';
                }
            }
        }
        window.toggleThemePicker = toggleThemePicker;

        // Mobile header initialization and hamburger button event listener
        function setupMobileHeader() {
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            const mobileHeaderRight = document.querySelector('.mobile-header-right');
            const authButtonWrap = document.getElementById('auth-button-wrap');

            if (isMobile && mobileHeaderRight && authButtonWrap) {
                // PERMANENT FIX: Force auth button to stay in mobile header - NEVER move it
                if (authButtonWrap.parentElement !== mobileHeaderRight) {
                    mobileHeaderRight.appendChild(authButtonWrap);
                }
                // Lock it with data attribute to prevent other code from moving it
                authButtonWrap.setAttribute('data-mobile-locked', 'true');
            } else if (!isMobile && authButtonWrap) {
                // On desktop, move it back to main-content if needed
                const mainContent = document.querySelector('.main-content');
                if (mainContent && authButtonWrap.parentElement === mobileHeaderRight) {
                    authButtonWrap.removeAttribute('data-mobile-locked');
                    mainContent.insertBefore(authButtonWrap, mainContent.firstChild);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', function () {
            const hamburger = document.getElementById('mobile-hamburger');

            // Setup on load
            setupMobileHeader();

            // Setup on resize with debounce
            let resizeTimeout;
            window.addEventListener('resize', function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(setupMobileHeader, 100);
            });

            // Hamburger click handler
            if (hamburger) {
                hamburger.addEventListener('click', function () {
                    const isMobile = window.matchMedia('(max-width: 900px)').matches;
                    if (!isMobile) return;
                    document.body.classList.toggle('sidebar-open');
                });
            }

            // Mobile header back button click handler
            const mobileBackBtn = document.getElementById('mobile-header-back-btn');
            if (mobileBackBtn) {
                mobileBackBtn.addEventListener('click', function () {
                    // Find the currently active course ID
                    const activeView = document.querySelector('#dynamic-course-views .view-section:not(.hidden)');
                    if (activeView) {
                        const courseId = activeView.id.replace('view-', '');
                        if (typeof mobileBackToCourseOutline === 'function') {
                            mobileBackToCourseOutline(courseId);
                        }
                    }
                });
            }

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        });

        // Also run after a short delay to ensure DOM is ready
        setTimeout(setupMobileHeader, 100);
        window.setupMobileHeader = setupMobileHeader;

        // PERMANENT FIX: MutationObserver to prevent auth button from being moved on mobile
        document.addEventListener('DOMContentLoaded', function () {
            const isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (!isMobile) return;

            const mobileHeaderRight = document.querySelector('.mobile-header-right');
            const authButtonWrap = document.getElementById('auth-button-wrap');

            if (!mobileHeaderRight || !authButtonWrap) return;

            // Lock it immediately
            authButtonWrap.setAttribute('data-mobile-locked', 'true');
            if (authButtonWrap.parentElement !== mobileHeaderRight) {
                mobileHeaderRight.appendChild(authButtonWrap);
            }

            // Watch for any attempts to move it
            const observer = new MutationObserver(function (mutations) {
                const isMobileNow = window.matchMedia('(max-width: 900px)').matches;
                if (!isMobileNow) {
                    observer.disconnect();
                    return;
                }

                if (authButtonWrap.getAttribute('data-mobile-locked') === 'true') {
                    if (authButtonWrap.parentElement !== mobileHeaderRight) {
                        // Someone tried to move it - force it back
                        mobileHeaderRight.appendChild(authButtonWrap);
                    }
                }
            });

            // Observe the auth button's parent changes
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Also check periodically as a backup
            setInterval(function () {
                const isMobileNow = window.matchMedia('(max-width: 900px)').matches;
                if (isMobileNow && authButtonWrap.getAttribute('data-mobile-locked') === 'true') {
                    if (authButtonWrap.parentElement !== mobileHeaderRight) {
                        mobileHeaderRight.appendChild(authButtonWrap);
                    }
                }
            }, 500);
        });

        // ========================================
        // BROWSER BACK BUTTON NAVIGATION HANDLER
        // Navigation hierarchy: Canvas Mode -> Topic -> Course Sections -> Home
        // ========================================

        // Track current navigation state
        window.currentNavLevel = 'home'; // 'home', 'course', 'topic', 'canvas'
        window.currentCourseId = null;

        // Handle browser back button
        window.addEventListener('popstate', function (event) {
            const state = event.state;
            
            // If state has navigation info, use it directly
            if (state && state.level) {
                if (state.level === 'home') {
                    // Navigate to home
                    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
                    const homeView = document.getElementById('view-home');
                    if (homeView) homeView.classList.remove('hidden');
                    document.body.classList.remove('is-course-view', 'is-topic-view');
                    if (document.body.classList.contains('canvas-mode')) exitcanvasmode();
                    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
                    const homeNav = document.getElementById('nav-home');
                    if (homeNav) homeNav.classList.add('active');
                    // Restore home content
                    const viewHome = document.getElementById('view-home');
                    if (viewHome) viewHome.querySelectorAll('.hero-section, .home-lower-section').forEach(el => el.style.display = '');
                    document.querySelectorAll('.info-page').forEach(el => el.classList.add('hidden'));
                    window.currentNavLevel = 'home';
                    window.currentCourseId = null;
                    return;
                }
                if (state.level === 'course' && state.courseId) {
                    // Exit canvas/topic mode, show course sections
                    if (document.body.classList.contains('canvas-mode')) exitcanvasmode();
                    document.body.classList.remove('is-topic-view');
                    if (typeof mobileBackToCourseOutline === 'function') {
                        mobileBackToCourseOutline(state.courseId);
                    }
                    window.currentNavLevel = 'course';
                    window.currentCourseId = state.courseId;
                    return;
                }
                if (state.level === 'topic') {
                    // Exit canvas mode if in it
                    if (document.body.classList.contains('canvas-mode')) exitcanvasmode();
                    window.currentNavLevel = 'topic';
                    return;
                }
            }
            
            // Fallback: use the old hierarchical approach
            handleBackNavigation();
        });

        function handleBackNavigation() {
            const isMobile = window.matchMedia('(max-width: 900px)').matches;

            // Level 1: If in canvas mode, exit canvas first
            if (document.body.classList.contains('canvas-mode')) {
                exitcanvasmode();
                return;
            }

            // Level 2: If viewing topic (simulation), go back to course sections
            if (document.body.classList.contains('is-topic-view')) {
                const activeView = document.querySelector('.view-section:not(.hidden)');
                const courseId = activeView?.id?.replace('view-', '') || window.currentCourseId;

                if (courseId && isMobile) {
                    if (typeof mobileBackToCourseOutline === 'function') {
                        mobileBackToCourseOutline(courseId);
                    } else {
                        document.body.classList.remove('is-topic-view');
                    }
                    window.currentNavLevel = 'course';
                    return;
                }
            }

            // Level 3: If viewing course sections, go back to home
            if (document.body.classList.contains('is-course-view')) {
                document.querySelectorAll('.view-section').forEach(el => {
                    el.classList.add('hidden');
                });
                const homeView = document.getElementById('view-home');
                if (homeView) {
                    homeView.classList.remove('hidden');
                    homeView.querySelectorAll('.hero-section, .home-lower-section').forEach(el => el.style.display = '');
                }
                document.body.classList.remove('is-course-view', 'is-topic-view');
                document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
                const homeNav = document.getElementById('nav-home');
                if (homeNav) homeNav.classList.add('active');
                document.querySelectorAll('.info-page').forEach(el => el.classList.add('hidden'));
                window.currentNavLevel = 'home';
                window.currentCourseId = null;
                return;
            }

            // Level 2: If viewing topic (simulation), go back to course sections
            if (document.body.classList.contains('is-topic-view')) {
                // Find current course ID
                const activeView = document.querySelector('.view-section:not(.hidden)');
                const courseId = activeView?.id?.replace('view-', '') || window.currentCourseId;

                if (courseId && isMobile) {
                    // Use existing mobile back function to show course outline
                    if (typeof mobileBackToCourseOutline === 'function') {
                        mobileBackToCourseOutline(courseId);
                    } else {
                        // Fallback: remove topic view class to show sidebar
                        document.body.classList.remove('is-topic-view');
                    }
                    // Push state for next back
                    history.pushState({ level: 'course', courseId: courseId }, '', window.location.href);
                    window.currentNavLevel = 'course';
                    return;
                }
            }

            // Level 3: If viewing course sections, go back to home
            if (document.body.classList.contains('is-course-view')) {
                // Go to home
                if (typeof switchProvider === 'function') {
                    // Hide all course views
                    document.querySelectorAll('.view-section').forEach(el => {
                        el.classList.add('hidden');
                    });
                    // Show home
                    const homeView = document.getElementById('view-home');
                    if (homeView) {
                        homeView.classList.remove('hidden');
                    }
                    // Remove course view classes
                    document.body.classList.remove('is-course-view', 'is-topic-view');

                    // Update sidebar active state
                    document.querySelectorAll('.sidebar-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    const homeNav = document.getElementById('nav-home');
                    if (homeNav) homeNav.classList.add('active');
                }

                // Push state for next back (will exit app)
                history.pushState({ level: 'home' }, '', window.location.href);
                window.currentNavLevel = 'home';
                window.currentCourseId = null;
                return;
            }

            // Level 4: At home - stay here, don't exit the site
            // Do nothing - user is already at home
            return;
        }

        // Track when user opens a course (update nav level tracking)
        document.addEventListener('click', function (e) {
            const courseItem = e.target.closest('.sidebar-item[onclick*="opencourse"], .sidebar-item[onclick*="switchProvider"]');
            if (courseItem) {
                const onclick = courseItem.getAttribute('onclick') || '';
                const match = onclick.match(/opencourse\(['"]([^'"]+)['"]\)/);
                if (match) {
                    window.currentCourseId = match[1];
                    window.currentNavLevel = 'course';
                }
            }

            const topicItem = e.target.closest('.chapter-item');
            if (topicItem) {
                window.currentNavLevel = 'topic';
            }
        });

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function () {
            // Set initial state
            history.replaceState({ level: 'home' }, '', window.location.href);
            window.currentNavLevel = 'home';
        });
