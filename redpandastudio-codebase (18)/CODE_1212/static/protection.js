    (function() {
        'use strict';

        // --- 1. Disable right-click on simulation areas ---
        document.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.viewer-screen') || e.target.closest('.viewer-pane') ||
                e.target.tagName === 'IFRAME') {
                e.preventDefault();
                return false;
            }
        }, true);

        // --- 3. Block DevTools keyboard shortcuts ---
        document.addEventListener('keydown', function(e) {
            // F12
            if (e.key === 'F12') { e.preventDefault(); return false; }
            // Ctrl+Shift+I (Inspector)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return false; }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
            // Ctrl+Shift+C (Element picker)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return false; }
            // Ctrl+U (View source)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
            // Cmd variants for Mac
            if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
        }, true);

        // --- 4. Detect DevTools open and blur simulations ---
        var _devtoolsOpen = false;
        var _checkDevtools = function() {
            var widthThreshold = window.outerWidth - window.innerWidth > 160;
            var heightThreshold = window.outerHeight - window.innerHeight > 160;
            var isOpen = widthThreshold || heightThreshold;

            if (isOpen !== _devtoolsOpen) {
                _devtoolsOpen = isOpen;
                var iframes = document.querySelectorAll('.viewer-screen iframe');
                iframes.forEach(function(f) {
                    f.style.filter = isOpen ? 'blur(20px)' : 'none';
                    f.style.pointerEvents = isOpen ? 'none' : 'auto';
                });
                var screens = document.querySelectorAll('.viewer-screen');
                screens.forEach(function(s) {
                    if (isOpen) {
                        if (!s.querySelector('.devtools-warning')) {
                            var warn = document.createElement('div');
                            warn.className = 'devtools-warning';
                            warn.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:#ff4444;font-size:18px;font-weight:700;z-index:999;text-align:center;padding:20px;';
                            warn.textContent = 'Developer tools detected. Simulation content is protected.';
                            s.appendChild(warn);
                        }
                    } else {
                        var w = s.querySelector('.devtools-warning');
                        if (w) w.remove();
                    }
                });
            }
        };
        setInterval(_checkDevtools, 1000);

        // --- 5. Console trap: override console.log to strip simulation URLs ---
        var _origLog = console.log;
        console.log = function() {
            var args = Array.from(arguments).map(function(a) {
                if (typeof a === 'string' && a.includes('api.gradstudio.org')) return '[protected]';
                return a;
            });
            _origLog.apply(console, args);
        };

        // --- 6. Disable drag on iframes ---
        document.addEventListener('dragstart', function(e) {
            if (e.target.tagName === 'IFRAME' || e.target.closest('.viewer-screen')) {
                e.preventDefault();
            }
        }, true);

        // --- 7. Disable Save As (Ctrl+S) on simulation pages ---
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                if (document.querySelector('.viewer-screen iframe')) {
                    e.preventDefault();
                    return false;
                }
            }
        }, true);

        // --- 8. MutationObserver: remove src attribute from iframes if someone tries to read DOM ---
        // (Iframes get src set via JS, observer makes it harder to scrape statically)
        var _protectIframes = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.tagName === 'IFRAME' && node.closest && node.closest('.viewer-screen')) {
                        // Add sandbox and referrer policy
                        node.setAttribute('referrerpolicy', 'no-referrer');
                    }
                });
            });
        });
        _protectIframes.observe(document.body, { childList: true, subtree: true });
