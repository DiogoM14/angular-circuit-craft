# Angular Circuit Craft

Angular Circuit Craft is a powerful visual workflow editor built with Angular 19. It allows users to create, manipulate, and visualize node-based workflow diagrams using a drag-and-drop interface.


## ✨ Features

- **Visual Workflow Editor**: Intuitive node-based workflow editor using Drawflow.
- **Custom Node Components**: Create and use custom web components as nodes.
- **Import/Export Functionality**: Save and load your workflow designs.
- **Modern UI**: Built with Tailwind CSS and DaisyUI for a clean, responsive interface.

## 🚀 Technologies Used

- Angular 19
- Drawflow
- Tailwind CSS
- DaisyUI
- Material Icons

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

## 🔧 Installation

Clone the repository:

```bash
git clone https://github.com/DiogoM14/angular-circuit-craft.git
cd angular-circuit-craft
```

Install dependencies:

```bash
npm install
# or
pnpm install
```

Start the development server:

```bash
npm start
# or
pnpm start
```

Open your browser and navigate to `http://localhost:4200/`.

## 💻 Usage

Angular Circuit Craft provides a visual canvas where you can:

- Drag components from the sidebar onto the canvas.
- Connect nodes to create workflows.
- Configure node properties.
- Export your workflow designs for later use.
- Import existing workflows.

## 🏗️ Project Structure

```
angular-circuit-craft/
├── src/
│   ├── app/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Application pages
│   │   ├── services/          # Services including DrawflowService
│   │   └── app.component.*    # Root component
│   ├── index.html             # Main HTML entry
│   ├── main.ts                # Angular bootstrap
│   └── styles.scss            # Global styles
├── package.json               # Project dependencies
└── README.md                  # Project documentation
```

## 🛠️ Development

### Code Scaffolding

To generate a new component:

```bash
ng generate component component-name
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions or support, reach out to [DiogoM14](mailto:diogomartins200214@gmail.com).

## 🙌 Acknowledgments

- Uses [Angular](https://angular.io), [Drawflow](https://github.com/jerosoler/Drawflow), [Tailwind CSS](https://tailwindcss.com), [DaisyUI](https://daisyui.com), and [Material Icons](https://material.io/resources/icons).
- Thanks to the open-source community.

## 📝 Notes

This README was created based on the project's code structure and dependencies. The Angular Circuit Craft application is built around a visual workflow editor using the Drawflow library, with a modern UI implemented using Angular, Tailwind CSS, and DaisyUI.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/DiogoM14/angular-circuit-craft)
