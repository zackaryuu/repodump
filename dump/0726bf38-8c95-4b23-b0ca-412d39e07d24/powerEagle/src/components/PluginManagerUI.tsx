import React, { useState, useEffect } from 'react';
import { PluginManager } from '@/core/PluginManager';
import { PluginManifest, PluginEvent } from '@/types/plugin';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Download, 
  Code, 
  FileText, 
  Puzzle,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PluginManagerUIProps {
  pluginManager: PluginManager;
}

export const PluginManagerUI: React.FC<PluginManagerUIProps> = ({ pluginManager }) => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [installCode, setInstallCode] = useState('');
  const [installType, setInstallType] = useState<'script' | 'json' | 'dsl'>('script');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Load initial plugins
    setPlugins(pluginManager.getPlugins());

    // Listen for plugin events
    const handlePluginEvent = (event: PluginEvent) => {
      switch (event.type) {
        case 'PLUGIN_INSTALLED':
        case 'PLUGIN_UNINSTALLED':
        case 'PLUGIN_ENABLED':
        case 'PLUGIN_DISABLED':
          setPlugins(pluginManager.getPlugins());
          break;
        case 'PLUGIN_ERROR':
          showNotification(`Plugin error: ${event.payload.error}`, 'error');
          break;
      }
    };

    pluginManager.on('PLUGIN_INSTALLED', handlePluginEvent);
    pluginManager.on('PLUGIN_UNINSTALLED', handlePluginEvent);
    pluginManager.on('PLUGIN_ENABLED', handlePluginEvent);
    pluginManager.on('PLUGIN_DISABLED', handlePluginEvent);
    pluginManager.on('PLUGIN_ERROR', handlePluginEvent);

    return () => {
      pluginManager.off('PLUGIN_INSTALLED', handlePluginEvent);
      pluginManager.off('PLUGIN_UNINSTALLED', handlePluginEvent);
      pluginManager.off('PLUGIN_ENABLED', handlePluginEvent);
      pluginManager.off('PLUGIN_DISABLED', handlePluginEvent);
      pluginManager.off('PLUGIN_ERROR', handlePluginEvent);
    };
  }, [pluginManager]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInstallPlugin = async () => {
    try {
      await pluginManager.installPlugin(installCode, installType);
      setIsInstallDialogOpen(false);
      setInstallCode('');
      showNotification('Plugin installed successfully!', 'success');
    } catch (error) {
      showNotification(
        `Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await pluginManager.enablePlugin(pluginId);
      } else {
        await pluginManager.disablePlugin(pluginId);
      }
    } catch (error) {
      showNotification(
        `Failed to ${enabled ? 'enable' : 'disable'} plugin: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      await pluginManager.uninstallPlugin(pluginId);
      showNotification('Plugin uninstalled successfully!', 'success');
    } catch (error) {
      showNotification(
        `Failed to uninstall plugin: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const getPluginIcon = (type: string) => {
    switch (type) {
      case 'script': return <Code className="w-5 h-5" />;
      case 'json': return <FileText className="w-5 h-5" />;
      case 'component': return <Puzzle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (plugin: PluginManifest) => {
    const isRunning = pluginManager.isPluginRunning(plugin.id);
    if (plugin.enabled && isRunning) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (plugin.enabled && !isRunning) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plugin Manager</h1>
          <p className="text-gray-600 mt-1">Manage your plugins and extensions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Install Plugin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Install New Plugin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plugin Type</label>
                  <select 
                    value={installType} 
                    onChange={(e) => setInstallType(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="script">JavaScript/UserScript</option>
                    <option value="json">JSON Configuration</option>
                    <option value="dsl">Simple DSL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Plugin Code</label>
                  <textarea
                    value={installCode}
                    onChange={(e) => setInstallCode(e.target.value)}
                    placeholder={getPlaceholderForType(installType)}
                    className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsInstallDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInstallPlugin}>
                    Install
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="installed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="installed">Installed Plugins ({plugins.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          {plugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No plugins installed</h3>
              <p className="text-gray-500 mb-4">Get started by installing your first plugin</p>
              <Button onClick={() => setIsInstallDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Install Plugin
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  isRunning={pluginManager.isPluginRunning(plugin.id)}
                  onToggle={(enabled) => handleTogglePlugin(plugin.id, enabled)}
                  onUninstall={() => handleUninstallPlugin(plugin.id)}
                  onView={() => setSelectedPlugin(plugin)}
                  getIcon={getPluginIcon}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <PluginTemplates onUseTemplate={(template) => {
            setInstallCode(template.code);
            setInstallType(template.type);
            setIsInstallDialogOpen(true);
          }} />
        </TabsContent>

        <TabsContent value="marketplace">
          <div className="text-center py-12">
            <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Plugin Marketplace</h3>
            <p className="text-gray-500">Coming soon - Browse and install community plugins</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <PluginDetailModal
          plugin={selectedPlugin}
          pluginManager={pluginManager}
          onClose={() => setSelectedPlugin(null)}
        />
      )}
    </div>
  );
};

// Plugin Card Component
interface PluginCardProps {
  plugin: PluginManifest;
  isRunning: boolean;
  onToggle: (enabled: boolean) => void;
  onUninstall: () => void;
  onView: () => void;
  getIcon: (type: string) => React.ReactNode;
  getStatusIcon: (plugin: PluginManifest) => React.ReactNode;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onToggle,
  onUninstall,
  onView,
  getIcon,
  getStatusIcon
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getIcon(plugin.type)}
          <div>
            <h3 className="font-medium">{plugin.name}</h3>
            <p className="text-sm text-gray-500">{plugin.version}</p>
          </div>
        </div>
        {getStatusIcon(plugin)}
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2">{plugin.description}</p>
      
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>by {plugin.author}</span>
        {plugin.tags && plugin.tags.length > 0 && (
          <>
            <span>•</span>
            <span>{plugin.tags.join(', ')}</span>
          </>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <Switch
            checked={plugin.enabled}
            onCheckedChange={onToggle}
          />
          <span className="text-sm">{plugin.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onView}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={onUninstall}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Plugin Templates Component
interface PluginTemplate {
  name: string;
  description: string;
  type: 'script' | 'json' | 'dsl';
  code: string;
  category: string;
}

interface PluginTemplatesProps {
  onUseTemplate: (template: PluginTemplate) => void;
}

const PluginTemplates: React.FC<PluginTemplatesProps> = ({ onUseTemplate }) => {
  const templates: PluginTemplate[] = [
    {
      name: 'Hello World Script',
      description: 'A simple script that shows an alert',
      type: 'script',
      category: 'Basic',
      code: `/* ==UserScript==
// @name         Hello World
// @description  A simple hello world script
// @version      1.0.0
// @author       You
// @match        *://*/*
// @grant        none
// ==UserScript== */

(function() {
    'use strict';
    
    console.log('Hello World from Plugin!');
    
    // Show a notification
    if (typeof GM_notification !== 'undefined') {
        GM_notification('Hello World from Plugin!', 'info');
    }
    
    // Add a simple element to the page
    const helloDiv = document.createElement('div');
    helloDiv.innerHTML = '🚀 Hello from Plugin Manager!';
    helloDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 10px; border-radius: 5px; z-index: 9999; font-family: Arial, sans-serif;';
    document.body.appendChild(helloDiv);
    
    // Remove the element after 3 seconds
    setTimeout(() => {
        if (helloDiv.parentNode) {
            helloDiv.parentNode.removeChild(helloDiv);
        }
    }, 3000);
    
})();`
    },
    {
      name: 'Page Modifier DSL',
      description: 'Simple DSL to modify page content',
      type: 'dsl',
      category: 'DOM',
      code: JSON.stringify({
        name: "Page Modifier",
        description: "Modifies page content",
        version: "1.0.0",
        author: "You",
        on: {
          domReady: true,
          urlMatch: "*://*/*"
        },
        actions: {
          inject: {
            css: "body { background-color: #f0f0f0; }"
          },
          modify: [
            {
              selector: "h1",
              operation: "prepend",
              content: "🚀 "
            }
          ]
        }
      }, null, 2)
    },
    {
      name: 'Configuration Plugin',
      description: 'JSON-based configuration plugin',
      type: 'json',
      category: 'Config',
      code: JSON.stringify({
        manifest: {
          name: "My Config Plugin",
          description: "A configuration-based plugin",
          version: "1.0.0",
          author: "You"
        },
        data: {
          settings: {
            theme: "dark",
            notifications: true,
            autoSave: false
          }
        },
        schema: {
          type: "object",
          properties: {
            settings: {
              type: "object",
              properties: {
                theme: { type: "string", enum: ["light", "dark"] },
                notifications: { type: "boolean" },
                autoSave: { type: "boolean" }
              }
            }
          }
        }
      }, null, 2)
    }
  ];

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-medium mb-3">{category} Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.filter(t => t.category === category).map((template, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {template.type === 'script' && <Code className="w-5 h-5" />}
                  {template.type === 'json' && <FileText className="w-5 h-5" />}
                  {template.type === 'dsl' && <Puzzle className="w-5 h-5" />}
                  <h4 className="font-medium">{template.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {template.type.toUpperCase()}
                  </span>
                  <Button size="sm" onClick={() => onUseTemplate(template)}>
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Plugin Detail Modal Component
interface PluginDetailModalProps {
  plugin: PluginManifest;
  pluginManager: PluginManager;
  onClose: () => void;
}

const PluginDetailModal: React.FC<PluginDetailModalProps> = ({ plugin, pluginManager, onClose }) => {
  const [pluginData, setPluginData] = useState<any>(null);

  useEffect(() => {
    const data = pluginManager.getPlugin(plugin.id);
    setPluginData(data);
  }, [plugin.id, pluginManager]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {plugin.type === 'script' && <Code className="w-5 h-5" />}
            {plugin.type === 'json' && <FileText className="w-5 h-5" />}
            {plugin.type === 'component' && <Puzzle className="w-5 h-5" />}
            {plugin.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Version</label>
              <p className="text-sm text-gray-600">{plugin.version}</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Author</label>
              <p className="text-sm text-gray-600">{plugin.author}</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <p className="text-sm text-gray-600">{plugin.type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <p className="text-sm text-gray-600">
                {plugin.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <p className="text-sm text-gray-600">{plugin.description}</p>
          </div>
          
          {plugin.tags && plugin.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2">
                {plugin.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {pluginData && (
            <div>
              <label className="block text-sm font-medium mb-2">Source Code</label>
              <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto max-h-64">
                {plugin.type === 'script' ? pluginData.code : JSON.stringify(pluginData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getPlaceholderForType(type: 'script' | 'json' | 'dsl'): string {
  switch (type) {
    case 'script':
      return `/* ==UserScript==
// @name         My Plugin
// @description  What this plugin does
// @version      1.0.0
// @author       Your Name
// @match        *://*/*
// @grant        none
// ==UserScript== */

(function() {
    'use strict';
    
    console.log('Hello from my plugin!');
    
    // Your plugin code here
    // You can modify the DOM, make requests, store data, etc.
    
})();`;
    case 'json':
      return `{
  "manifest": {
    "name": "My Plugin",
    "description": "What this plugin does",
    "version": "1.0.0",
    "author": "Your Name"
  },
  "data": {
    // Your configuration here
  }
}`;
    case 'dsl':
      return `{
  "name": "My Plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": "Your Name",
  "on": {
    "domReady": true,
    "urlMatch": "*://*/*"
  },
  "actions": {
    "inject": {
      "css": "/* Your CSS here */"
    }
  }
}`;
    default:
      return '';
  }
}
