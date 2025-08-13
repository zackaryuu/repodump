# System Patterns: PowerEagle Plugin Manager

## Overall Architecture

### High-Level System Design
```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                       │
├─────────────────────────────────────────────────────────────┤
│  PluginManagerUI  │  Templates  │  Settings  │  Marketplace │
├─────────────────────────────────────────────────────────────┤
│                usePluginManager Hook                        │
├─────────────────────────────────────────────────────────────┤
│                   PluginManager Core                        │
├─────────────────────────────────────────────────────────────┤
│ ScriptParser │ JsonParser │ DSLParser │ PluginSandbox      │
├─────────────────────────────────────────────────────────────┤
│      Storage     │    Events    │   Context   │   Utils     │
├─────────────────────────────────────────────────────────────┤
│                     LocalStorage                            │
└─────────────────────────────────────────────────────────────┘
```

### Core Design Patterns

#### 1. Manager Pattern (PluginManager)
**Purpose**: Central orchestration of all plugin operations
**Implementation**: Single instance manages state, lifecycle, and coordination
**Benefits**: 
- Single source of truth for plugin state
- Centralized event handling
- Consistent API for all operations

#### 2. Factory Pattern (Plugin Parsers)
**Purpose**: Create different plugin types from code input
**Implementation**: Type-specific parser methods in PluginManager
**Benefits**:
- Easy to add new plugin types
- Consistent parsing interface
- Type-safe plugin creation

#### 3. Context Pattern (Plugin Execution)
**Purpose**: Provide controlled API access to plugins
**Implementation**: PluginContext object with scoped implementations
**Benefits**:
- Security through limited scope
- Easy to extend API surface
- Plugin isolation

#### 4. Observer Pattern (Event System)
**Purpose**: Reactive updates across the system
**Implementation**: Event listeners map with typed events
**Benefits**:
- Loose coupling between components
- Real-time UI updates
- Extensible event system

## Component Architecture

### Core Components

#### PluginManager (`src/core/PluginManager.ts`)
```typescript
class PluginManager {
  private state: PluginManagerState
  private eventListeners: Map<string, Function[]>
  private sandboxedEvaluator: PluginSandbox
  
  // Plugin lifecycle
  async installPlugin(code: string, type: PluginType): Promise<void>
  async enablePlugin(id: string): Promise<void>
  async disablePlugin(id: string): Promise<void>
  async uninstallPlugin(id: string): Promise<void>
  
  // Plugin parsing
  private parseScriptPlugin(code: string): Promise<ScriptPlugin>
  private parseJsonPlugin(code: string): Promise<JsonPlugin>
  private parseDSLPlugin(code: string): Promise<ScriptPlugin>
  
  // Event system
  on(event: string, listener: Function): void
  emit(event: PluginEvent): void
}
```

**Key Responsibilities**:
- Plugin lifecycle management
- State persistence
- Event coordination
- Security enforcement

#### PluginSandbox
```typescript
class PluginSandbox {
  async execute(code: string, context: PluginContext): Promise<void>
  private extractExecutableCode(code: string): string
  private createBoundEval(sandbox: any): Function
}
```

**Security Model**:
- Function constructor with limited scope
- Controlled global object access
- API surface through context injection

#### Plugin Context Implementations
```typescript
class PluginStorageImpl implements PluginStorage
class PluginAPIImpl implements PluginAPI
class DOMUtilsImpl implements DOMUtils
class HttpUtilsImpl implements HttpUtils
class PluginUtilsImpl implements PluginUtils
```

**Pattern**: Interface segregation for different plugin capabilities

### UI Component Patterns

#### Composition Pattern (PluginManagerUI)
```typescript
const PluginManagerUI = () => {
  return (
    <Tabs>
      <TabsContent value="installed">
        <PluginGrid plugins={plugins} />
      </TabsContent>
      <TabsContent value="templates">
        <TemplateGrid templates={templates} />
      </TabsContent>
    </Tabs>
  )
}
```

#### Hook Pattern (usePluginManager)
```typescript
const usePluginManager = () => {
  const [pluginManager] = useState(() => new PluginManager())
  const [plugins, setPlugins] = useState<PluginManifest[]>([])
  
  useEffect(() => {
    // Event listeners for reactive updates
  }, [])
  
  return { pluginManager, plugins, /* operations */ }
}
```

## Data Flow Patterns

### Plugin Installation Flow
```
User Input → Parser Selection → Plugin Creation → Validation → 
Storage → Event Emission → UI Update
```

### Plugin Execution Flow
```
Enable Request → Plugin Retrieval → Context Creation → 
Sandbox Execution → Status Update → Event Emission
```

### State Synchronization
```
PluginManager State ↔ LocalStorage ↔ React State ↔ UI Components
```

## Security Patterns

### Sandboxed Execution
**Pattern**: Controlled execution environment
**Implementation**:
```typescript
const sandbox = {
  console,
  setTimeout,
  // ... limited globals
  GM_getValue: context.storage.get.bind(context.storage),
  // ... plugin APIs
}

const func = new Function(...keys, wrappedCode)
await func(...values)
```

### API Surface Control
**Pattern**: Interface-based capability exposure
**Benefits**:
- Fine-grained permission control
- Easy to audit security surface
- Future-proof for permission system

### Input Validation
**Pattern**: Multi-layer validation
**Layers**:
1. Format validation (UserScript headers, JSON schema)
2. Content sanitization (code extraction, metadata parsing)
3. Runtime validation (execution context limits)

## Storage Patterns

### Hierarchical Storage
```
localStorage:
  - 'pluginManager' → { plugins: [], settings: {} }
  - 'plugin_{id}' → PluginData
  - 'plugin_storage_{id}_{key}' → UserData
```

### State Persistence
**Pattern**: Automatic serialization/deserialization
**Implementation**: JSON-based with error handling

## Error Handling Patterns

### Layered Error Handling
1. **Validation Errors**: Input format/syntax issues
2. **Execution Errors**: Runtime plugin failures  
3. **System Errors**: Storage/state management issues
4. **UI Errors**: User interaction problems

### Error Recovery Strategies
- **Graceful Degradation**: Failed plugins don't break system
- **User Feedback**: Clear error messages with solutions
- **Safe Defaults**: Conservative settings, easy rollback

## Performance Patterns

### Lazy Loading
- Plugin code loaded only when executed
- UI components rendered on demand
- Event listeners registered as needed

### Memory Management
- Plugin state cleanup on disable/uninstall
- Event listener cleanup
- Storage cleanup for removed plugins

### Optimization Strategies
- Debounced storage operations
- Batched UI updates
- Minimal re-renders through proper dependencies

## Extension Patterns

### Plugin Type Extension
**How to Add New Plugin Type**:
1. Add type definition to `plugin.ts`
2. Implement parser method in `PluginManager`
3. Add execution logic
4. Update UI templates and placeholders

### API Extension
**How to Add New Plugin API**:
1. Add method to appropriate context interface
2. Implement in context implementation class
3. Add to sandbox object
4. Document in plugin examples

### UI Extension
**Component Extension Pattern**:
- Composition-based components
- Hook-based state management
- Event-driven updates

## Testing Patterns

### Unit Testing Strategy
- Mock dependencies for isolation
- Test plugin parsing separately
- Validate error conditions

### Integration Testing
- Full plugin lifecycle tests
- UI interaction tests
- Storage persistence tests

### Manual Testing Checklist
- Plugin installation scenarios
- Error handling paths
- UI responsiveness
- Performance with multiple plugins

## Code Organization Principles

### Separation of Concerns
- **Core**: Business logic and plugin management
- **UI**: Presentation and user interaction
- **Types**: Shared interfaces and contracts
- **Utils**: Reusable helper functions

### Dependency Direction
```
UI Components → Hooks → Core Manager → Storage/APIs
```

### Module Boundaries
- Clear public/private API distinctions
- Minimal cross-module dependencies
- Interface-based coupling

## Naming Conventions

### Files and Directories
- `PascalCase` for components and classes
- `camelCase` for utilities and hooks
- `kebab-case` for configuration files

### Code Elements
- `PascalCase` for types and interfaces
- `camelCase` for variables and functions
- `UPPER_CASE` for constants
- Descriptive names over brevity

## Future Architecture Considerations

### Scalability Patterns
- Plugin marketplace integration points
- Async plugin loading
- Plugin dependency management
- Version control system

### Security Enhancements
- Permission-based API access
- Plugin signature verification
- Content Security Policy integration
- Audit logging system
