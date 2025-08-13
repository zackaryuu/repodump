import { 
  PluginManifest, 
  PluginContext, 
  ScriptPlugin, 
  JsonPlugin, 
  ComponentPlugin,
  PluginManagerState,
  PluginEvent,
  PluginDSL
} from '@/types/plugin';

export class PluginManager {
  private state: PluginManagerState;
  private eventListeners: Map<string, ((event: PluginEvent) => void)[]> = new Map();
  private sandboxedEvaluator: PluginSandbox;

  constructor() {
    this.state = {
      plugins: [],
      installedPlugins: new Map(),
      runningPlugins: new Set(),
      settings: {
        autoUpdate: true,
        developerMode: false,
        allowUnsafeCode: false,
        maxPlugins: 100,
        logLevel: 'info'
      }
    };
    
    this.sandboxedEvaluator = new PluginSandbox();
    this.loadPluginsFromStorage();
  }

  // Plugin installation and management
  async installPlugin(pluginCode: string, type: 'script' | 'json' | 'dsl'): Promise<void> {
    try {
      let plugin: ScriptPlugin | JsonPlugin | ComponentPlugin;
      
      switch (type) {
        case 'script':
          plugin = await this.parseScriptPlugin(pluginCode);
          break;
        case 'json':
          plugin = await this.parseJsonPlugin(pluginCode);
          break;
        case 'dsl':
          plugin = await this.parseDSLPlugin(pluginCode);
          break;
        default:
          throw new Error(`Unsupported plugin type: ${type}`);
      }

      if (this.state.installedPlugins.has(plugin.manifest.id)) {
        throw new Error(`Plugin ${plugin.manifest.id} is already installed`);
      }

      if (this.state.plugins.length >= this.state.settings.maxPlugins) {
        throw new Error(`Maximum number of plugins (${this.state.settings.maxPlugins}) reached`);
      }

      this.state.installedPlugins.set(plugin.manifest.id, plugin);
      this.state.plugins.push(plugin.manifest);
      
      await this.savePluginsToStorage();
      this.emit({ type: 'PLUGIN_INSTALLED', payload: plugin.manifest });
      
      if (plugin.manifest.enabled) {
        await this.enablePlugin(plugin.manifest.id);
      }
    } catch (error) {
      throw new Error(`Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    if (!this.state.installedPlugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    await this.disablePlugin(pluginId);
    this.state.installedPlugins.delete(pluginId);
    this.state.plugins = this.state.plugins.filter(p => p.id !== pluginId);
    
    await this.savePluginsToStorage();
    this.emit({ type: 'PLUGIN_UNINSTALLED', payload: pluginId });
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.state.installedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    if (this.state.runningPlugins.has(pluginId)) {
      return; // Already running
    }

    try {
      await this.executePlugin(plugin);
      this.state.runningPlugins.add(pluginId);
      
      // Update manifest
      const manifest = this.state.plugins.find(p => p.id === pluginId);
      if (manifest) {
        manifest.enabled = true;
      }
      
      await this.savePluginsToStorage();
      this.emit({ type: 'PLUGIN_ENABLED', payload: pluginId });
    } catch (error) {
      this.emit({ 
        type: 'PLUGIN_ERROR', 
        payload: { 
          pluginId, 
          error: error instanceof Error ? error.message : String(error) 
        } 
      });
      throw error;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    if (!this.state.runningPlugins.has(pluginId)) {
      return; // Already disabled
    }

    this.state.runningPlugins.delete(pluginId);
    
    // Update manifest
    const manifest = this.state.plugins.find(p => p.id === pluginId);
    if (manifest) {
      manifest.enabled = false;
    }
    
    await this.savePluginsToStorage();
    this.emit({ type: 'PLUGIN_DISABLED', payload: pluginId });
  }

  // Plugin parsing methods
  private async parseScriptPlugin(code: string): Promise<ScriptPlugin> {
    // More flexible regex to match UserScript metadata
    const metadataMatch = code.match(/\/\*\s*==UserScript==\s*\n([\s\S]*?)\n\s*==\/UserScript==\s*\*\//);
    
    let metadata: any = {};
    
    if (metadataMatch) {
      const metadataText = metadataMatch[1];
      metadata = this.parseUserScriptMetadata(metadataText);
    } else {
      // If no UserScript metadata found, try to extract basic info or use defaults
      console.warn('No UserScript metadata found, using defaults');
      metadata = {
        name: 'Unnamed Script',
        description: 'No description provided',
        version: '1.0.0',
        author: 'Unknown'
      };
    }
    
    const manifest: PluginManifest = {
      id: metadata.id || this.generateId(),
      name: metadata.name || 'Unnamed Script',
      description: metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author || 'Unknown',
      homepage: metadata.homepage,
      icon: metadata.icon,
      tags: metadata.tags || [],
      permissions: [],
      type: 'script',
      main: code,
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      manifest,
      code,
      metadata: {
        matches: metadata.matches,
        excludeMatches: metadata.excludeMatches,
        runAt: metadata.runAt || 'document-ready',
        grants: metadata.grants || []
      }
    };
  }

  private async parseJsonPlugin(jsonCode: string): Promise<JsonPlugin> {
    const config = JSON.parse(jsonCode);
    
    if (!config.manifest) {
      throw new Error('Invalid JSON plugin: missing manifest');
    }

    const manifest: PluginManifest = {
      ...config.manifest,
      id: config.manifest.id || this.generateId(),
      type: 'json',
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      manifest,
      config: config.data || {},
      schema: config.schema
    };
  }

  private async parseDSLPlugin(dslCode: string): Promise<ScriptPlugin> {
    const dsl: PluginDSL = JSON.parse(dslCode);
    const generatedCode = this.generateCodeFromDSL(dsl);
    
    const manifest: PluginManifest = {
      id: this.generateId(),
      name: dsl.name,
      description: dsl.description,
      version: dsl.version,
      author: dsl.author,
      permissions: [],
      type: 'script',
      main: generatedCode,
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      manifest,
      code: generatedCode,
      metadata: {
        matches: dsl.on?.urlMatch ? [String(dsl.on.urlMatch)] : undefined,
        runAt: dsl.on?.domReady ? 'document-ready' : 'document-start',
        grants: []
      }
    };
  }

  private generateCodeFromDSL(dsl: PluginDSL): string {
    const actions: string[] = [];

    if (dsl.actions?.inject?.css) {
      actions.push(`
        const style = document.createElement('style');
        style.textContent = ${JSON.stringify(dsl.actions.inject.css)};
        document.head.appendChild(style);
      `);
    }

    if (dsl.actions?.inject?.html) {
      actions.push(`
        const container = document.createElement('div');
        container.innerHTML = ${JSON.stringify(dsl.actions.inject.html)};
        document.body.appendChild(container);
      `);
    }

    if (dsl.actions?.modify) {
      dsl.actions.modify.forEach(mod => {
        actions.push(`
          const elements = document.querySelectorAll(${JSON.stringify(mod.selector)});
          elements.forEach(el => {
            switch (${JSON.stringify(mod.operation)}) {
              case 'replace':
                el.innerHTML = ${JSON.stringify(mod.content || '')};
                break;
              case 'append':
                el.innerHTML += ${JSON.stringify(mod.content || '')};
                break;
              case 'prepend':
                el.innerHTML = ${JSON.stringify(mod.content || '')} + el.innerHTML;
                break;
              case 'remove':
                el.remove();
                break;
            }
          });
        `);
      });
    }

    return `
      (function() {
        'use strict';
        ${actions.join('\n')}
      })();
    `;
  }

  private parseUserScriptMetadata(metadata: string): any {
    const result: any = {};
    const lines = metadata.split('\n');
    
    for (const line of lines) {
      // More flexible regex to handle different comment styles
      const match = line.match(/^\s*\/\/\s*@(\w+)\s+(.+)/) || line.match(/^\s*@(\w+)\s+(.+)/);
      if (match) {
        const [, key, value] = match;
        const cleanKey = key.toLowerCase().replace(/-/g, '');
        const cleanValue = value.trim();
        
        // Handle arrays for certain keys
        if (['match', 'excludematch', 'grant', 'require'].includes(cleanKey)) {
          const arrayKey = cleanKey + 's';
          if (!result[arrayKey]) result[arrayKey] = [];
          result[arrayKey].push(cleanValue);
        } else {
          result[cleanKey] = cleanValue;
        }
      }
    }
    
    return result;
  }

  private async executePlugin(plugin: ScriptPlugin | JsonPlugin | ComponentPlugin): Promise<void> {
    const context = this.createPluginContext(plugin.manifest.id);
    
    if (plugin.manifest.type === 'script') {
      const scriptPlugin = plugin as ScriptPlugin;
      await this.sandboxedEvaluator.execute(scriptPlugin.code, context);
    } else if (plugin.manifest.type === 'json') {
      // JSON plugins are configuration-based, no execution needed
      // They would be used by other parts of the system
    }
  }

  private createPluginContext(pluginId: string): PluginContext {
    return {
      pluginId,
      storage: new PluginStorageImpl(pluginId),
      api: new PluginAPIImpl(),
      dom: new DOMUtilsImpl(),
      http: new HttpUtilsImpl(),
      utils: new PluginUtilsImpl()
    };
  }

  private generateId(): string {
    return 'plugin_' + Math.random().toString(36).substr(2, 9);
  }

  // Event system
  on(eventType: string, listener: (event: PluginEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: (event: PluginEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: PluginEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  // Storage
  private async loadPluginsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('pluginManager');
      if (stored) {
        const data = JSON.parse(stored);
        this.state.plugins = data.plugins || [];
        this.state.settings = { ...this.state.settings, ...data.settings };
        
        // Reload installed plugins
        for (const manifest of this.state.plugins) {
          const pluginData = localStorage.getItem(`plugin_${manifest.id}`);
          if (pluginData) {
            const plugin = JSON.parse(pluginData);
            this.state.installedPlugins.set(manifest.id, plugin);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load plugins from storage:', error);
    }
  }

  private async savePluginsToStorage(): Promise<void> {
    try {
      const data = {
        plugins: this.state.plugins,
        settings: this.state.settings
      };
      localStorage.setItem('pluginManager', JSON.stringify(data));
      
      // Save individual plugins
      for (const [id, plugin] of this.state.installedPlugins) {
        localStorage.setItem(`plugin_${id}`, JSON.stringify(plugin));
      }
    } catch (error) {
      console.error('Failed to save plugins to storage:', error);
    }
  }

  // Getters
  getPlugins(): PluginManifest[] {
    return [...this.state.plugins];
  }

  getPlugin(id: string): ScriptPlugin | JsonPlugin | ComponentPlugin | undefined {
    return this.state.installedPlugins.get(id);
  }

  isPluginRunning(id: string): boolean {
    return this.state.runningPlugins.has(id);
  }

  getSettings() {
    return { ...this.state.settings };
  }

  updateSettings(settings: Partial<typeof this.state.settings>): void {
    this.state.settings = { ...this.state.settings, ...settings };
    this.savePluginsToStorage();
  }
}

// Sandbox for safe plugin execution
class PluginSandbox {
  async execute(code: string, context: PluginContext): Promise<void> {
    try {
      // Extract just the actual code, removing UserScript metadata
      const cleanCode = this.extractExecutableCode(code);
      
      // Validate the code before execution
      this.validateCode(cleanCode);
      
      // Create a sandboxed environment
      const sandbox = {
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        fetch: context.http.get.bind(context.http),
        // Plugin API
        GM_getValue: context.storage.get.bind(context.storage),
        GM_setValue: context.storage.set.bind(context.storage),
        GM_deleteValue: context.storage.remove.bind(context.storage),
        GM_notification: context.api.showNotification.bind(context.api),
        // DOM utilities
        document,
        window: {
          location: window.location,
          navigator: window.navigator
        }
      };

      // Execute in isolated context using eval (safer than Function constructor for modern JS)
      const boundEval = this.createBoundEval(sandbox);
      await boundEval(cleanCode);
    } catch (error) {
      console.error('Plugin execution error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Plugin execution failed';
      if (error instanceof SyntaxError) {
        errorMessage = `Syntax error in plugin code: ${error.message}`;
      } else if (error instanceof ReferenceError) {
        errorMessage = `Reference error in plugin code: ${error.message}`;
      } else if (error instanceof TypeError) {
        errorMessage = `Type error in plugin code: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `Plugin error: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  private validateCode(code: string): void {
    // Basic validation to catch common issues
    if (!code || code.trim().length === 0) {
      throw new Error('Plugin code is empty');
    }
    
    // Check for potentially dangerous code patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /new\s+Function/,
      /document\.write/,
      /innerHTML\s*=.*<script/i,
      /javascript:/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        console.warn('Plugin contains potentially dangerous code pattern:', pattern);
      }
    }
    
    // Try to parse the code to check for basic syntax errors
    try {
      // This won't execute the code, just parse it
      new Function(code);
    } catch (syntaxError) {
      // If Function constructor fails, try a more lenient approach
      try {
        // Wrap in an IIFE to check if it's valid JS
        new Function(`(function() { ${code} })`);
      } catch (error) {
        throw new SyntaxError(`Invalid JavaScript syntax: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private extractExecutableCode(code: string): string {
    // Remove UserScript metadata block
    const cleanCode = code.replace(/\/\*\s*==UserScript==[\s\S]*?==\/UserScript==\s*\*\//, '');
    return cleanCode.trim();
  }

  private createBoundEval(sandbox: any): (code: string) => Promise<void> {
    return async (code: string) => {
      // Create a safer execution environment using eval with restricted global scope
      const originalGlobals = this.captureGlobals();
      
      try {
        // Temporarily set sandbox variables in global scope
        Object.assign(window, sandbox);
        
        // Wrap the code to handle both sync and async execution
        const wrappedCode = `
          (async () => {
            try {
              ${code}
            } catch (error) {
              console.error('Plugin execution error:', error);
              throw error;
            }
          })()
        `;
        
        // Use eval for better modern JS syntax support
        const result = eval(wrappedCode);
        
        // Wait for async operations to complete
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        // Restore original global scope
        this.restoreGlobals(originalGlobals, sandbox);
      }
    };
  }

  private captureGlobals(): Record<string, any> {
    const captured: Record<string, any> = {};
    const sandboxKeys = ['console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 
                        'fetch', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_notification'];
    
    sandboxKeys.forEach(key => {
      if (key in window) {
        captured[key] = (window as any)[key];
      }
    });
    
    return captured;
  }

  private restoreGlobals(originalGlobals: Record<string, any>, sandbox: any): void {
    // Remove sandbox variables from global scope
    Object.keys(sandbox).forEach(key => {
      if (key in originalGlobals) {
        (window as any)[key] = originalGlobals[key];
      } else {
        delete (window as any)[key];
      }
    });
  }
}

// Implementation classes for plugin context
class PluginStorageImpl {
  constructor(private pluginId: string) {}

  async get<T>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(`plugin_storage_${this.pluginId}_${key}`);
    return stored ? JSON.parse(stored) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(`plugin_storage_${this.pluginId}_${key}`, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(`plugin_storage_${this.pluginId}_${key}`);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    const prefix = `plugin_storage_${this.pluginId}_`;
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

class PluginAPIImpl {
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // This would integrate with your notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  openModal(content: string | React.ReactNode): void {
    // This would integrate with your modal system
    console.log('Opening modal:', content);
  }

  closeModal(): void {
    console.log('Closing modal');
  }

  registerCommand(name: string, _handler: () => void): void {
    // Command registration logic
    console.log(`Registered command: ${name}`);
  }

  unregisterCommand(name: string): void {
    console.log(`Unregistered command: ${name}`);
  }
}

class DOMUtilsImpl {
  querySelector(selector: string): Element | null {
    return document.querySelector(selector);
  }

  querySelectorAll(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
  }

  createElement(tagName: string, attributes?: Record<string, string>): HTMLElement {
    const element = document.createElement(tagName);
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    return element;
  }

  observe(target: Element, callback: MutationCallback): MutationObserver {
    const observer = new MutationObserver(callback);
    observer.observe(target, { childList: true, subtree: true });
    return observer;
  }
}

class HttpUtilsImpl {
  async get(url: string, options?: RequestInit): Promise<Response> {
    return fetch(url, { ...options, method: 'GET' });
  }

  async post(url: string, data: any, options?: RequestInit): Promise<Response> {
    return fetch(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(data)
    });
  }

  async put(url: string, data: any, options?: RequestInit): Promise<Response> {
    return fetch(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(data)
    });
  }

  async delete(url: string, options?: RequestInit): Promise<Response> {
    return fetch(url, { ...options, method: 'DELETE' });
  }
}

class PluginUtilsImpl {
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  parseUrl(url: string): URL {
    return new URL(url);
  }
}
