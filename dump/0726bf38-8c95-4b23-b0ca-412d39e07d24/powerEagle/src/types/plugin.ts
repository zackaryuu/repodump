// Core plugin interfaces
export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  homepage?: string;
  icon?: string;
  tags?: string[];
  permissions?: PluginPermission[];
  type: 'script' | 'json' | 'component';
  main: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PluginPermission {
  type: 'storage' | 'network' | 'filesystem' | 'clipboard' | 'notifications';
  description: string;
  required: boolean;
}

// Script-based plugins (like Tampermonkey)
export interface ScriptPlugin {
  manifest: PluginManifest;
  code: string;
  metadata: ScriptMetadata;
}

export interface ScriptMetadata {
  matches?: string[];
  excludeMatches?: string[];
  runAt?: 'document-start' | 'document-ready' | 'document-end';
  grants?: string[];
}

// JSON-based configuration plugins
export interface JsonPlugin {
  manifest: PluginManifest;
  config: Record<string, any>;
  schema?: JsonSchema;
}

export interface JsonSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
}

// Component-based plugins (React/Vue)
export interface ComponentPlugin {
  manifest: PluginManifest;
  component: string; // Component code as string
  framework: 'react' | 'vue';
  dependencies?: string[];
}

// Plugin execution context
export interface PluginContext {
  pluginId: string;
  storage: PluginStorage;
  api: PluginAPI;
  dom: DOMUtils;
  http: HttpUtils;
  utils: PluginUtils;
}

export interface PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface PluginAPI {
  showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  openModal(content: string | React.ReactNode): void;
  closeModal(): void;
  registerCommand(name: string, handler: () => void): void;
  unregisterCommand(name: string): void;
}

export interface DOMUtils {
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeListOf<Element>;
  createElement(tagName: string, attributes?: Record<string, string>): HTMLElement;
  observe(target: Element, callback: MutationCallback): MutationObserver;
}

export interface HttpUtils {
  get(url: string, options?: RequestInit): Promise<Response>;
  post(url: string, data: any, options?: RequestInit): Promise<Response>;
  put(url: string, data: any, options?: RequestInit): Promise<Response>;
  delete(url: string, options?: RequestInit): Promise<Response>;
}

export interface PluginUtils {
  uuid(): string;
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T;
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T;
  escapeHtml(unsafe: string): string;
  parseUrl(url: string): URL;
}

// Plugin manager state
export interface PluginManagerState {
  plugins: PluginManifest[];
  installedPlugins: Map<string, ScriptPlugin | JsonPlugin | ComponentPlugin>;
  runningPlugins: Set<string>;
  settings: PluginManagerSettings;
}

export interface PluginManagerSettings {
  autoUpdate: boolean;
  developerMode: boolean;
  allowUnsafeCode: boolean;
  maxPlugins: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Plugin events
export type PluginEvent = 
  | { type: 'PLUGIN_INSTALLED'; payload: PluginManifest }
  | { type: 'PLUGIN_UNINSTALLED'; payload: string }
  | { type: 'PLUGIN_ENABLED'; payload: string }
  | { type: 'PLUGIN_DISABLED'; payload: string }
  | { type: 'PLUGIN_ERROR'; payload: { pluginId: string; error: string } }
  | { type: 'PLUGIN_UPDATED'; payload: PluginManifest };

// Simple DSL for plugin definition
export interface PluginDSL {
  name: string;
  description: string;
  version: string;
  author: string;
  
  // Trigger conditions
  on?: {
    domReady?: boolean;
    urlMatch?: string | RegExp;
    interval?: number;
    event?: string;
  };
  
  // Actions to perform
  actions?: {
    inject?: {
      css?: string;
      js?: string;
      html?: string;
    };
    modify?: {
      selector: string;
      operation: 'replace' | 'append' | 'prepend' | 'remove';
      content?: string;
    }[];
    request?: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    };
    storage?: {
      key: string;
      value: any;
    };
  };
}
