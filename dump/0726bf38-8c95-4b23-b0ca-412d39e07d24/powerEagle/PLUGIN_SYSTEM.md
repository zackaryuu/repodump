# PowerEagle Plugin Manager

A Tampermonkey-like plugin system for Electron applications, built with React, TypeScript, and shadcn/ui.

## Features

- **Multiple Plugin Types**: Support for JavaScript/UserScript, JSON configuration, and Simple DSL plugins
- **Sandboxed Execution**: Safe plugin execution environment with limited API access
- **Template System**: Pre-built templates for common plugin patterns
- **Plugin Management**: Install, enable, disable, and uninstall plugins with a modern UI
- **Storage API**: Persistent storage for plugin data
- **Event System**: Plugin lifecycle events and custom event handling
- **Permission System**: Granular permissions for plugin capabilities

## Plugin Types

### 1. JavaScript/UserScript Plugins

Similar to Tampermonkey scripts with metadata headers:

```javascript
/* ==UserScript==
// @name         My Plugin
// @description  What this plugin does
// @version      1.0.0
// @author       Your Name
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==UserScript== */

(function() {
    'use strict';
    
    // Plugin code here
    console.log('Plugin loaded!');
    
    // Use storage API
    GM_setValue('myKey', 'myValue');
    GM_getValue('myKey').then(value => console.log(value));
})();
```

### 2. JSON Configuration Plugins

Configuration-based plugins for data-driven functionality:

```json
{
  "manifest": {
    "name": "Theme Settings",
    "description": "Customizable theme configuration",
    "version": "1.0.0",
    "author": "Your Name"
  },
  "data": {
    "theme": {
      "primaryColor": "#3b82f6",
      "darkMode": true,
      "fontSize": "medium"
    }
  },
  "schema": {
    "type": "object",
    "properties": {
      "theme": {
        "type": "object",
        "properties": {
          "primaryColor": { "type": "string" },
          "darkMode": { "type": "boolean" },
          "fontSize": { "type": "string", "enum": ["small", "medium", "large"] }
        }
      }
    }
  }
}
```

### 3. Simple DSL Plugins

Declarative plugins using a simple Domain Specific Language:

```json
{
  "name": "Page Enhancer",
  "description": "Enhances page appearance and functionality",
  "version": "1.0.0",
  "author": "Your Name",
  "on": {
    "domReady": true,
    "urlMatch": "*://example.com/*"
  },
  "actions": {
    "inject": {
      "css": "body { font-family: 'Arial', sans-serif; }",
      "html": "<div id='my-widget'>Custom Widget</div>"
    },
    "modify": [
      {
        "selector": "h1",
        "operation": "prepend",
        "content": "🚀 "
      },
      {
        "selector": ".ad",
        "operation": "remove"
      }
    ],
    "request": {
      "url": "https://api.example.com/data",
      "method": "GET"
    }
  }
}
```

## Plugin API

Plugins have access to a sandboxed API with the following methods:

### Storage API
- `GM_getValue(key)` - Get stored value
- `GM_setValue(key, value)` - Set stored value
- `GM_deleteValue(key)` - Delete stored value

### DOM Utilities
- `document.querySelector(selector)` - Find DOM element
- `document.querySelectorAll(selector)` - Find multiple DOM elements
- `document.createElement(tagName, attributes)` - Create DOM element

### HTTP Utilities
- `fetch(url, options)` - Make HTTP requests

### Notification API
- `GM_notification(message, type)` - Show notifications

## Plugin Development

### Getting Started

1. Open the Plugin Manager
2. Click "Install Plugin"
3. Choose your plugin type (Script, JSON, or DSL)
4. Write your plugin code or use a template
5. Click "Install" to add the plugin

### Best Practices

1. **Use Descriptive Names**: Choose clear, descriptive names for your plugins
2. **Version Your Plugins**: Always specify a version number
3. **Handle Errors**: Wrap your code in try-catch blocks
4. **Respect Permissions**: Only request permissions your plugin actually needs
5. **Test Thoroughly**: Test your plugin in different scenarios

### Plugin Templates

The system includes several built-in templates:

- **Hello World Script**: Basic JavaScript plugin template
- **Page Modifier DSL**: Simple DSL for page modifications
- **Configuration Plugin**: JSON-based configuration template

## Security

The plugin system includes several security measures:

- **Sandboxed Execution**: Plugins run in a limited execution context
- **Permission System**: Plugins must declare required permissions
- **Code Review**: Developer mode allows reviewing plugin code before installation
- **Safe Defaults**: Unsafe operations are disabled by default

## Architecture

```
PluginManager
├── Core Plugin System
│   ├── Plugin Parser (Script/JSON/DSL)
│   ├── Sandboxed Executor
│   └── Event System
├── Storage Layer
│   ├── Plugin Storage
│   └── Settings Storage
├── API Layer
│   ├── DOM Utils
│   ├── HTTP Utils
│   └── Notification System
└── UI Components
    ├── Plugin List
    ├── Installation Dialog
    └── Settings Panel
```

## Development Roadmap

- [ ] Plugin marketplace integration
- [ ] Advanced component-based plugins (React/Vue)
- [ ] Plugin update system
- [ ] Backup/restore functionality
- [ ] Plugin sharing and export
- [ ] Advanced permission management
- [ ] Plugin debugging tools

## Contributing

This plugin system is designed to be extensible. You can contribute by:

1. Creating new plugin templates
2. Adding new API methods
3. Improving the UI/UX
4. Adding security features
5. Writing documentation

## License

MIT License - Feel free to use and modify as needed.
