import { useState, useEffect, useCallback } from 'react';
import { PluginManager } from '@/core/PluginManager';
import { PluginManifest } from '@/types/plugin';

// Singleton instance
let pluginManagerInstance: PluginManager | null = null;

export const usePluginManager = () => {
  const [pluginManager] = useState(() => {
    if (!pluginManagerInstance) {
      pluginManagerInstance = new PluginManager();
    }
    return pluginManagerInstance;
  });

  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    setPlugins(pluginManager.getPlugins());
    setLoading(false);

    // Listen for plugin changes
    const handlePluginChange = () => {
      setPlugins(pluginManager.getPlugins());
    };

    pluginManager.on('PLUGIN_INSTALLED', handlePluginChange);
    pluginManager.on('PLUGIN_UNINSTALLED', handlePluginChange);
    pluginManager.on('PLUGIN_ENABLED', handlePluginChange);
    pluginManager.on('PLUGIN_DISABLED', handlePluginChange);

    return () => {
      pluginManager.off('PLUGIN_INSTALLED', handlePluginChange);
      pluginManager.off('PLUGIN_UNINSTALLED', handlePluginChange);
      pluginManager.off('PLUGIN_ENABLED', handlePluginChange);
      pluginManager.off('PLUGIN_DISABLED', handlePluginChange);
    };
  }, [pluginManager]);

  const installPlugin = useCallback(async (code: string, type: 'script' | 'json' | 'dsl') => {
    await pluginManager.installPlugin(code, type);
  }, [pluginManager]);

  const uninstallPlugin = useCallback(async (pluginId: string) => {
    await pluginManager.uninstallPlugin(pluginId);
  }, [pluginManager]);

  const enablePlugin = useCallback(async (pluginId: string) => {
    await pluginManager.enablePlugin(pluginId);
  }, [pluginManager]);

  const disablePlugin = useCallback(async (pluginId: string) => {
    await pluginManager.disablePlugin(pluginId);
  }, [pluginManager]);

  const isPluginRunning = useCallback((pluginId: string) => {
    return pluginManager.isPluginRunning(pluginId);
  }, [pluginManager]);

  const getPlugin = useCallback((pluginId: string) => {
    return pluginManager.getPlugin(pluginId);
  }, [pluginManager]);

  return {
    pluginManager,
    plugins,
    loading,
    installPlugin,
    uninstallPlugin,
    enablePlugin,
    disablePlugin,
    isPluginRunning,
    getPlugin,
  };
};
