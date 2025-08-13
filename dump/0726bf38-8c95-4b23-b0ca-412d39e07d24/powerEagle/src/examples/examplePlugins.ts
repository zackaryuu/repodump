// Example plugins for demonstration

export const EXAMPLE_PLUGINS = {
  // UserScript style plugin
  helloWorld: `/* ==UserScript==
// @name         Hello World Plugin
// @description  A simple demonstration plugin
// @version      1.0.0
// @author       PowerEagle Team
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// ==UserScript== */

(function() {
    'use strict';
    
    console.log('Hello World Plugin loaded!');
    
    // Add a floating hello button
    const button = document.createElement('button');
    button.textContent = '👋 Hello!';
    button.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 10px 15px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    \`;
    
    let clickCount = 0;
    
    button.addEventListener('click', async () => {
        clickCount++;
        await GM_setValue('clickCount', clickCount);
        GM_notification(\`Hello! You've clicked \${clickCount} times\`, 'info');
    });
    
    // Load previous click count
    GM_getValue('clickCount').then(count => {
        if (count) {
            clickCount = count;
        }
    });
    
    document.body.appendChild(button);
})();`,

  // Page modifier using DSL
  pageEnhancer: JSON.stringify({
    name: "Page Enhancer",
    description: "Enhances pages with custom styling and content",
    version: "1.0.0",
    author: "PowerEagle Team",
    on: {
      domReady: true,
      urlMatch: "*://*/*"
    },
    actions: {
      inject: {
        css: `
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Smooth animations */
          * {
            transition: all 0.2s ease-in-out;
          }
          
          /* Custom selection color */
          ::selection {
            background-color: #3b82f6;
            color: white;
          }
        `
      },
      modify: [
        {
          selector: "h1",
          operation: "prepend",
          content: "✨ "
        },
        {
          selector: "h2",
          operation: "prepend", 
          content: "🔸 "
        }
      ]
    }
  }, null, 2),

  // Dark mode toggle plugin
  darkModeToggle: `/* ==UserScript==
// @name         Dark Mode Toggle
// @description  Adds a dark mode toggle to any website
// @version      1.0.0
// @author       PowerEagle Team
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==UserScript== */

(function() {
    'use strict';
    
    let isDarkMode = false;
    
    // Create toggle button
    const toggle = document.createElement('div');
    toggle.innerHTML = '🌙';
    toggle.style.cssText = \`
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #333;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10000;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    \`;
    
    // Dark mode styles
    const darkStyles = document.createElement('style');
    darkStyles.id = 'dark-mode-styles';
    darkStyles.textContent = \`
        html[data-dark-mode="true"] {
            filter: invert(1) hue-rotate(180deg);
        }
        html[data-dark-mode="true"] img,
        html[data-dark-mode="true"] video,
        html[data-dark-mode="true"] iframe,
        html[data-dark-mode="true"] svg,
        html[data-dark-mode="true"] [style*="background-image"] {
            filter: invert(1) hue-rotate(180deg);
        }
    \`;
    
    // Toggle function
    async function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.documentElement.setAttribute('data-dark-mode', isDarkMode.toString());
        toggle.innerHTML = isDarkMode ? '☀️' : '🌙';
        await GM_setValue('darkMode', isDarkMode);
    }
    
    // Load saved preference
    GM_getValue('darkMode').then(saved => {
        if (saved !== null) {
            isDarkMode = saved;
            document.documentElement.setAttribute('data-dark-mode', isDarkMode.toString());
            toggle.innerHTML = isDarkMode ? '☀️' : '🌙';
        }
    });
    
    toggle.addEventListener('click', toggleDarkMode);
    
    document.head.appendChild(darkStyles);
    document.body.appendChild(toggle);
})();`,

  // Ad blocker plugin
  adBlocker: `/* ==UserScript==
// @name         Simple Ad Blocker
// @description  Removes common advertisement elements
// @version      1.0.0
// @author       PowerEagle Team
// @match        *://*/*
// @grant        none
// ==UserScript== */

(function() {
    'use strict';
    
    // Common ad selectors
    const adSelectors = [
        '[class*="ad-"]',
        '[class*="ads-"]',
        '[id*="ad-"]',
        '[id*="ads-"]',
        '.advertisement',
        '.banner-ad',
        '.google-ad',
        '.sponsored',
        '[data-ad]',
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]'
    ];
    
    // Function to remove ads
    function removeAds() {
        adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el) {
                    el.style.display = 'none';
                    console.log('Ad blocked:', selector);
                }
            });
        });
    }
    
    // Remove ads on load
    removeAds();
    
    // Watch for new ads being added
    const observer = new MutationObserver(() => {
        removeAds();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Add indicator
    const indicator = document.createElement('div');
    indicator.textContent = '🛡️ Ad Blocker Active';
    indicator.style.cssText = \`
        position: fixed;
        top: 10px;
        left: 10px;
        background: #10b981;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        opacity: 0.8;
    \`;
    
    document.body.appendChild(indicator);
    
    // Hide indicator after 3 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 500);
    }, 3000);
})();`,

  // Configuration plugin for themes
  themeConfig: JSON.stringify({
    manifest: {
      name: "Theme Configuration",
      description: "Customizable theme settings for the application",
      version: "1.0.0",
      author: "PowerEagle Team"
    },
    data: {
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#64748b", 
        backgroundColor: "#ffffff",
        textColor: "#1e293b",
        borderRadius: "8px",
        fontSize: "14px",
        fontFamily: "Inter, sans-serif",
        darkMode: false,
        animations: true,
        compactMode: false
      },
      layout: {
        sidebarWidth: "240px",
        headerHeight: "60px",
        contentPadding: "24px",
        gridGap: "16px"
      }
    },
    schema: {
      type: "object",
      properties: {
        theme: {
          type: "object",
          properties: {
            primaryColor: { 
              type: "string", 
              format: "color",
              title: "Primary Color"
            },
            secondaryColor: { 
              type: "string", 
              format: "color",
              title: "Secondary Color"
            },
            backgroundColor: { 
              type: "string", 
              format: "color",
              title: "Background Color"
            },
            textColor: { 
              type: "string", 
              format: "color",
              title: "Text Color"
            },
            borderRadius: { 
              type: "string",
              title: "Border Radius",
              enum: ["0px", "4px", "8px", "12px", "16px"]
            },
            fontSize: { 
              type: "string",
              title: "Font Size",
              enum: ["12px", "14px", "16px", "18px"]
            },
            fontFamily: { 
              type: "string",
              title: "Font Family",
              enum: [
                "Inter, sans-serif",
                "Roboto, sans-serif", 
                "Arial, sans-serif",
                "Georgia, serif"
              ]
            },
            darkMode: { 
              type: "boolean",
              title: "Dark Mode"
            },
            animations: { 
              type: "boolean",
              title: "Enable Animations"
            },
            compactMode: { 
              type: "boolean",
              title: "Compact Mode"
            }
          }
        },
        layout: {
          type: "object",
          properties: {
            sidebarWidth: { 
              type: "string",
              title: "Sidebar Width"
            },
            headerHeight: { 
              type: "string",
              title: "Header Height"
            },
            contentPadding: { 
              type: "string",
              title: "Content Padding"
            },
            gridGap: { 
              type: "string",
              title: "Grid Gap"
            }
          }
        }
      }
    }
  }, null, 2),

  // Productivity plugin using DSL
  productivityBoost: JSON.stringify({
    name: "Productivity Booster",
    description: "Adds productivity features to web pages",
    version: "1.0.0",
    author: "PowerEagle Team",
    on: {
      domReady: true,
      urlMatch: "*://*/*"
    },
    actions: {
      inject: {
        css: `
          .productivity-toolbar {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px 0 0 8px;
            padding: 8px;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .productivity-btn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 6px;
            background: #f3f4f6;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: all 0.2s;
          }
          .productivity-btn:hover {
            background: #e5e7eb;
            transform: scale(1.05);
          }
        `,
        html: `
          <div class="productivity-toolbar">
            <button class="productivity-btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" title="Scroll to top">⬆️</button>
            <button class="productivity-btn" onclick="window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})" title="Scroll to bottom">⬇️</button>
            <button class="productivity-btn" onclick="document.body.style.zoom = (parseFloat(document.body.style.zoom) || 1) + 0.1" title="Zoom in">🔍</button>
            <button class="productivity-btn" onclick="document.body.style.zoom = Math.max(0.5, (parseFloat(document.body.style.zoom) || 1) - 0.1)" title="Zoom out">🔎</button>
            <button class="productivity-btn" onclick="window.print()" title="Print page">🖨️</button>
            <button class="productivity-btn" onclick="navigator.clipboard.writeText(window.location.href)" title="Copy URL">📋</button>
          </div>
        `
      }
    }
  }, null, 2)
};

export default EXAMPLE_PLUGINS;
