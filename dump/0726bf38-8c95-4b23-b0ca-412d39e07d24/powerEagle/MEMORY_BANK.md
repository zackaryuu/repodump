# PowerEagle Plugin Manager - Memory Bank

## System Overview

The PowerEagle Plugin Manager is a Tampermonkey-like plugin system for Electron applications, built with React, TypeScript, and shadcn/ui. It allows users to install, manage, and execute plugins in a sandboxed environment.

## Architecture

```
PowerEagle Plugin Manager
├── Core System (src/core/)
│   └── PluginManager.ts - Main plugin management logic
├── Types (src/types/)
│   └── plugin.ts - TypeScript interfaces and types
├── UI Components (src/components/)
│   ├── PluginManagerUI.tsx - Main UI component
│   └── ui/ - shadcn/ui components
├── Hooks (src/hooks/)
│   └── usePluginManager.ts - React hook for plugin state
└── Documentation
    ├── PLUGIN_SYSTEM.md - Detailed documentation
    └── MEMORY_BANK.md - This file
```

## Core Components

### 1. PluginManager Class (`src/core/PluginManager.ts`)

**Purpose**: Central management system for all plugin operations

**Key Methods**:
- `installPlugin(code, type)` - Install new plugins
- `enablePlugin(id)` - Enable and execute plugins
- `disablePlugin(id)` - Disable running plugins
- `uninstallPlugin(id)` - Remove plugins completely
- `parseScriptPlugin(code)` - Parse UserScript format
- `parseJsonPlugin(code)` - Parse JSON configuration
- `parseDSLPlugin(code)` - Parse simple DSL format

**Storage**: Uses localStorage for persistence
- `pluginManager` - Main state and settings
- `plugin_{id}` - Individual plugin data
- `plugin_storage_{id}_{key}` - Plugin-specific storage

### 2. Plugin Types

#### Script Plugins (UserScript format)
```javascript
/* ==UserScript==
// @name         Plugin Name
// @description  What it does
// @version      1.0.0
// @author       Author Name
// @match        *://*/*
// @grant        GM_getValue
// ==UserScript== */

(function() {
    // Plugin code here
})();
```

#### JSON Configuration Plugins
```json
{
  "manifest": {
    "name": "Config Plugin",
    "description": "Configuration-based plugin",
    "version": "1.0.0",
    "author": "Author"
  },
  "data": {
    "settings": { /* config data */ }
  },
  "schema": { /* JSON schema for validation */ }
}
```

#### DSL Plugins (Declarative)
```json
{
  "name": "DSL Plugin",
  "version": "1.0.0",
  "on": { "domReady": true },
  "actions": {
    "inject": { "css": "/* styles */" },
    "modify": [{ "selector": "h1", "operation": "prepend", "content": "🚀" }]
  }
}
```

### 3. Sandbox Execution (`PluginSandbox` class)

**Security Features**:
- Isolated execution context
- Limited global access
- Safe API exposure

**Available APIs**:
- `GM_getValue(key)` - Get stored value
- `GM_setValue(key, value)` - Set stored value
- `GM_deleteValue(key)` - Delete stored value
- `GM_notification(message, type)` - Show notifications
- `console.*` - Logging
- `document.*` - DOM access (limited)
- `fetch` - HTTP requests

### 4. UI Components

#### PluginManagerUI (`src/components/PluginManagerUI.tsx`)
- Main interface with tabs: Installed, Templates, Marketplace
- Plugin cards with enable/disable toggles
- Installation dialog with type selection
- Plugin detail modal

#### Key UI Features:
- Real-time plugin status indicators
- Template system for quick starts
- Error handling with notifications
- Responsive design with shadcn/ui

## State Management

### Plugin Manager State
```typescript
interface PluginManagerState {
  plugins: PluginManifest[];           // Plugin metadata
  installedPlugins: Map<string, Plugin>; // Full plugin data
  runningPlugins: Set<string>;         // Currently active plugins
  settings: PluginManagerSettings;     // Manager configuration
}
```

### React State (usePluginManager hook)
- Wraps PluginManager instance
- Provides reactive updates
- Handles plugin lifecycle events

## Event System

**Plugin Events**:
- `PLUGIN_INSTALLED` - New plugin added
- `PLUGIN_UNINSTALLED` - Plugin removed
- `PLUGIN_ENABLED` - Plugin activated
- `PLUGIN_DISABLED` - Plugin deactivated
- `PLUGIN_ERROR` - Execution error
- `PLUGIN_UPDATED` - Plugin modified

## Error Handling

### Common Issues & Solutions

1. **"Invalid script plugin: missing UserScript metadata"**
   - Solution: Ensure UserScript block format is correct
   - Check for proper `/* ==UserScript== */` delimiters

2. **"Unexpected token '*'"**
   - Solution: JavaScript syntax error in plugin code
   - Use simpler syntax, avoid modern ES6+ features in some contexts

3. **"Plugin execution failed"**
   - Solution: Check plugin code for runtime errors
   - Review available sandbox APIs

## Development Guidelines

### Adding New Plugin Types
1. Add type definition to `src/types/plugin.ts`
2. Implement parser in `PluginManager.parseXXXPlugin()`
3. Add execution logic in `executePlugin()`
4. Update UI templates and placeholders

### Extending Sandbox APIs
1. Add methods to appropriate implementation classes:
   - `PluginAPIImpl` - Core plugin APIs
   - `DOMUtilsImpl` - DOM manipulation
   - `HttpUtilsImpl` - Network requests
   - `PluginUtilsImpl` - Utility functions

### UI Customization
- Components use shadcn/ui + Tailwind CSS
- DaisyUI for additional components
- Color scheme defined in `src/index.css`

## File Structure Reference

```
src/
├── core/
│   └── PluginManager.ts         # Core plugin management logic
├── types/
│   └── plugin.ts                # TypeScript definitions
├── components/
│   ├── PluginManagerUI.tsx      # Main UI component
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── switch.tsx
│       └── tabs.tsx
├── hooks/
│   └── usePluginManager.ts      # React state management
├── lib/
│   └── utils.ts                 # Utility functions
└── App.tsx                      # Main application component
```

## Dependencies

### Core Dependencies
- React 18 - UI framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- DaisyUI - UI components
- Radix UI - Primitive components
- Lucide React - Icons

### Build Tools
- Vite - Build system
- TypeScript compiler
- PostCSS + Autoprefixer

## Configuration Files

- `vite.config.ts` - Vite configuration with path aliases
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind + DaisyUI setup
- `postcss.config.js` - PostCSS configuration

## Testing Strategy

### Manual Testing Checklist
- [ ] Install script plugin with UserScript metadata
- [ ] Install JSON configuration plugin
- [ ] Install DSL plugin
- [ ] Enable/disable plugins
- [ ] Verify plugin storage persistence
- [ ] Test plugin execution in sandbox
- [ ] Check error handling for invalid plugins
- [ ] Verify UI responsiveness

### Future Testing Improvements
- Unit tests for PluginManager class
- Integration tests for plugin execution
- UI component tests
- E2E tests for complete workflows

## Performance Considerations

### Optimization Opportunities
1. **Lazy Loading**: Load plugin code only when needed
2. **Virtual Scrolling**: For large plugin lists
3. **Code Splitting**: Separate plugin execution context
4. **Memory Management**: Cleanup disabled plugins
5. **Storage Optimization**: Compress stored plugin data

### Current Limitations
- All plugins loaded into memory on startup
- No plugin size limits
- Synchronous plugin execution
- Limited sandbox isolation

## Security Model

### Current Security Measures
- Sandboxed execution environment
- Limited global object access
- API-based plugin interactions
- No direct file system access

### Security Improvements Needed
- Content Security Policy (CSP)
- Plugin signature verification
- Permission-based API access
- Code review system for plugins

## Roadmap & Future Features

### Immediate Improvements
- [ ] Better error messages
- [ ] Plugin update mechanism
- [ ] Export/import functionality
- [ ] Plugin backup system

### Medium-term Goals
- [ ] Plugin marketplace integration
- [ ] Advanced component plugins (React/Vue)
- [ ] Plugin debugging tools
- [ ] Performance monitoring

### Long-term Vision
- [ ] Plugin ecosystem
- [ ] Community sharing
- [ ] Advanced security model
- [ ] Plugin development IDE

## Troubleshooting Guide

### Development Issues
1. **Build Errors**: Check TypeScript errors, missing dependencies
2. **Import Issues**: Verify path aliases in vite.config.ts
3. **Styling Problems**: Check Tailwind configuration
4. **Component Errors**: Ensure shadcn/ui components are properly imported

### Plugin Issues
1. **Installation Failures**: Check plugin format and metadata
2. **Execution Errors**: Review sandbox limitations
3. **Storage Problems**: Check localStorage availability
4. **Performance Issues**: Monitor plugin complexity

## Contributing Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React hooks patterns
- Use functional components
- Implement proper error handling
- Add JSDoc comments for complex functions

### Pull Request Process
1. Update documentation
2. Add/update tests
3. Ensure TypeScript compliance
4. Test plugin functionality
5. Update memory bank if needed

---

**Last Updated**: July 1, 2025
**Version**: 1.0.0
**Maintainer**: PowerEagle Development Team
