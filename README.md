# Angular Circuit Craft 🔧⚡

Angular Circuit Craft is a powerful visual workflow automation platform built with Angular 19. Create, execute, and manage complex data workflows through an intuitive drag-and-drop interface with real-time execution capabilities.

## ✨ Features

### Core Functionality
- **Visual Workflow Editor**: Intuitive node-based editor using Drawflow with modern UI
- **Real-time Execution**: Execute workflows with live data processing and visualization
- **Smart Node System**: 7+ pre-built node types for HTTP, data transformation, logic control, and more
- **Data Transformation**: Advanced field mapping with direct copy, constant values, and computed expressions
- **Conditional Logic**: If/else branching with flexible condition evaluation
- **Data Visualization**: Built-in table and JSON viewers for data inspection

### Advanced Features
- **Workflow Management**: Save, load, and manage multiple workflow configurations
- **Live Data Preview**: Real-time data preview and debugging capabilities
- **Node Configuration**: Rich configuration dialogs with form validation
- **Execution Tracking**: Visual execution states with success/error indicators
- **Zoom Controls**: Pan and zoom for complex workflow visualization
- **Modern Architecture**: Clean, maintainable codebase with separation of concerns

## 🚀 Technologies Used

- **Frontend**: Angular 19 (Standalone Components)
- **Workflow Engine**: Drawflow
- **Styling**: Custom SCSS with modern design system
- **Architecture**: Service-oriented with helper functions
- **Type Safety**: Full TypeScript implementation

## 🏗️ Architecture

The application follows a clean, modular architecture:

```
src/app/
├── components/           # UI Components
│   ├── header/          # Top navigation and controls
│   ├── sidebar/         # Node palette and search
│   └── canvas/          # Main workflow canvas
├── services/            # Core Business Logic
│   ├── workflow-execution.service.ts    # Workflow orchestration
│   ├── drawflow.service.ts             # Canvas operations
│   ├── node-execution.service.ts       # Individual node execution
│   └── workflow-storage.service.ts     # Persistence layer
├── helpers/             # Pure Utility Functions
│   ├── data-utils.helper.ts            # Data manipulation
│   ├── condition-evaluator.helper.ts   # Logic evaluation
│   └── data-transformation.helper.ts   # Data mapping
├── types.ts             # TypeScript definitions
└── app.component.ts     # Main application (523 lines, down from 1249!)
```

## 🎯 Node Types

### HTTP & APIs
- **HTTP Request**: Make REST API calls with full header and body support

### Data & Transformation
- **Display Data**: Visualize data in table, JSON, or raw formats
- **Transform**: Advanced field mapping with computed expressions

### Logic & Control
- **If Condition**: Conditional branching with flexible expressions
- **Delay**: Timed execution delays

### Notifications & Storage
- **Send Email**: Email notifications via SMTP
- **Database**: Database connectivity and queries

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm
- Modern web browser with ES2022 support

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/DiogoM14/angular-circuit-craft.git
cd angular-circuit-craft

# Install dependencies
npm install

# Start development server
npm start
```

Navigate to `http://localhost:4200/`

## 💻 Usage Guide

### Creating Your First Workflow

1. **Add Nodes**: Drag nodes from the sidebar to the canvas
2. **Connect Nodes**: Click and drag between node connection points
3. **Configure**: Double-click nodes to open configuration dialogs
4. **Execute**: Click the play button to run your workflow
5. **Save**: Use the save button to persist your workflow

### Example Workflows

#### API Data Processing
```
HTTP Request → Transform → Display Data
```

#### Conditional Processing
```
HTTP Request → If Condition → [True: Transform, False: Email]
```

#### Timed Operations
```
HTTP Request → Delay → Email Notification
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with subtle animations
- **Responsive Layout**: Works on desktop and tablet devices
- **Dark Mode Ready**: Prepared for dark theme implementation
- **Accessibility**: Keyboard navigation and screen reader support
- **Visual Feedback**: Clear execution states and error handling

## 🔍 Data Transformation

The transform node supports three mapping types:

- **Direct Copy**: `data.field → target.field`
- **Constant Values**: Static values
- **Computed Expressions**: JavaScript expressions like `data.price * 1.2`

## ⚙️ Development

### Code Quality
```bash
npm run lint      # ESLint checking
npm run format    # Prettier formatting
npm run test      # Unit tests
```

### Building
```bash
npm run build           # Production build
npm run build:stats     # Bundle analysis
```

### Architecture Principles

- **Single Responsibility**: Each service has a focused purpose
- **Pure Functions**: Helpers are side-effect free
- **Type Safety**: Comprehensive TypeScript coverage
- **Separation of Concerns**: UI, business logic, and utilities clearly separated

## 🚀 Performance

- **Lazy Loading**: Components loaded on demand
- **Efficient Rendering**: Optimized change detection
- **Memory Management**: Proper cleanup and subscription handling
- **Bundle Size**: Optimized with tree-shaking

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style and architecture patterns
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

### Code Style Guidelines

- Use Angular style guide conventions
- Prefer composition over inheritance
- Write self-documenting code with clear variable names
- Add JSDoc comments for public APIs

## 🐛 Known Issues & Roadmap

### Current Limitations
- Browser-based execution only (no server-side processing)
- Limited to JSON data formats
- No user authentication system

### Upcoming Features
- [ ] Custom node development SDK
- [ ] Workflow templates library
- [ ] Real-time collaboration
- [ ] Advanced data connectors
- [ ] Workflow scheduling

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Angular Team](https://angular.io) - Excellent framework
- [Drawflow](https://github.com/jerosoler/Drawflow) - Powerful workflow library
- [TypeScript](https://www.typescriptlang.org/) - Type safety and developer experience

## 📞 Support

- **Email**: [diogomartins200214@gmail.com](mailto:diogomartins200214@gmail.com)
- **GitHub Issues**: [Create an issue](https://github.com/DiogoM14/angular-circuit-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DiogoM14/angular-circuit-craft/discussions)

---

## DeepWiki
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/DiogoM14/angular-circuit-craft)

**Built with ❤️ using Angular 19 and modern web technologies**
