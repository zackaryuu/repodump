import { useState } from "react";
import reactLogo from "./assets/react.svg";
import eagleLogo from "./assets/eagle.png";
import viteLogo from "/vite.svg";
import { PluginManagerUI } from "./components/PluginManagerUI";
import { usePluginManager } from "./hooks/usePluginManager";

function App() {
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [currentView, setCurrentView] = useState<"home" | "plugins">("home");
  const { pluginManager } = usePluginManager();

  if (currentView === "plugins") {
    return (
      <div
        data-theme={mode}
        className="w-full min-h-screen bg-gray-50 dark:bg-gray-900"
      >
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <button
            onClick={() => setCurrentView("home")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </button>
        </div>
        <PluginManagerUI pluginManager={pluginManager} />
      </div>
    );
  }

  return (
    <div
      data-theme={mode}
      className="w-full h-screen text-center flex flex-col gap-y-10 justify-center"
    >
      <div className="flex justify-center gap-4">
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="w-24" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="w-24" alt="React logo" />
        </a>
        <a href="https://eagle.cool" target="_blank">
          <img src={eagleLogo} className="w-24" alt="Eagle logo" />
        </a>
      </div>
      <h1 className="text-lg font-bold">PowerEagle Plugin Manager</h1>
      <div>
        <div className="gap-x-2 flex justify-center flex-wrap gap-y-2">
          <button
            className="btn btn-primary"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
          <button
            className="btn"
            onClick={() =>
              setMode((mode) => (mode === "light" ? "dark" : "light"))
            }
          >
            change mode
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentView("plugins")}
          >
            🔌 Plugin Manager
          </button>
        </div>

        <p className="mt-4">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p className="mt-2 text-sm text-gray-600">
          A Tampermonkey-like plugin system for Electron apps with React, TypeScript, and shadcn/ui
        </p>
      </div>
    </div>
  );
}

export default App;
