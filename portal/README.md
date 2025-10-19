# PDF Form Builder - Angular Portal

A modern Angular application for creating, editing, and filling PDF forms with advanced features like drag-and-drop form field positioning, overlap detection, and form flattening.

## 🚀 Features

### Core Functionality
- **PDF Upload & Viewing**: Load and display PDF documents
- **Form Field Creation**: Add text fields to PDF with drag-and-drop interface
- **Field Configuration**: Customize field properties (label, type, size, position, etc.)
- **Form Filling**: Fill form fields with data
- **PDF Export**: Export filled PDFs with or without form field borders (flattening)

### Advanced Features
- **Drag & Drop**: Smooth drag-and-drop with overlap detection
- **Snap to Grid**: Optional grid alignment for precise positioning
- **Multi-page Support**: Create fields across multiple PDF pages
- **Visual Feedback**: Real-time visual indicators for overlapping fields
- **Form Validation**: Required field validation
- **Sample Data**: Auto-generate sample data for testing

### Import/Export
- **Config Export**: Export PDF + JSON configuration
- **Config Import**: Import existing configurations
- **Field Templates**: Save and reuse field configurations

## 🏗️ Architecture

### Angular Best Practices
- **Standalone Components**: Modern Angular architecture with standalone components
- **RxJS State Management**: Reactive state management with BehaviorSubjects
- **Dependency Injection**: Proper service injection and singleton patterns
- **Change Detection Strategy**: OnPush strategy for optimal performance
- **TypeScript**: Strong typing throughout the application

### Project Structure
```
src/app/
├── core/                    # Core functionality
│   ├── models/             # TypeScript interfaces and models
│   └── services/           # Core services (PDF, Config, State)
├── features/               # Feature modules
│   ├── pdf-viewer/         # PDF viewing and field creation
│   └── pdf-filler/         # Form filling functionality
├── shared/                 # Shared components and utilities
└── app.component.*         # Root component
```

### Services
- **PdfService**: PDF manipulation, form field creation, and export
- **ConfigService**: Configuration import/export functionality
- **StateService**: Centralized state management with RxJS

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Navigate to the portal directory
cd portal

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Development Commands
```bash
# Start development server with hot reload
ng serve

# Run tests
ng test

# Build for production
ng build --prod

# Lint code
ng lint
```

## 📱 Usage

### 1. Upload PDF
- Drag and drop a PDF file onto the upload area
- Or click "Choose PDF File" to select from file browser

### 2. Create Form Fields
- Click "Add Text Field" button
- Click anywhere on the PDF to place a field
- Fields automatically avoid overlapping positions

### 3. Configure Fields
- Click on any field to select it
- Use the configuration panel to modify properties:
  - Field label and name
  - Field type (text, date, number, email)
  - Position and size
  - Font size and color
  - Required field setting

### 4. Fill Form Data
- Use the form filler panel to enter data
- Click "Load Sample Data" for testing
- Choose whether to flatten form fields (remove borders)

### 5. Export PDF
- Click "Generate Filled PDF" to download the result
- Choose between flattened (no borders) or interactive (with borders)

### Advanced Features

#### Snap to Grid
- Enable "Snap to Grid" for precise alignment
- Adjust grid size as needed
- Visual grid overlay when enabled

#### Overlap Detection
- Fields automatically detect and avoid overlaps
- Visual feedback with red borders for overlapping fields
- Automatic position adjustment when adding new fields

#### Multi-page Support
- Navigate between PDF pages
- Create fields on different pages
- Page-specific field management

## 🔧 Configuration

### Environment Variables
Create environment files for different configurations:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['pdf']
};
```

### Customization
- Modify `styles.scss` for global styling
- Update component SCSS files for component-specific styles
- Configure services in the core module for custom behavior

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage
```

### E2E Tests
```bash
# Run end-to-end tests
ng e2e
```

## 📦 Dependencies

### Core Dependencies
- **Angular 17**: Latest Angular framework
- **pdf-lib**: PDF manipulation library
- **RxJS**: Reactive programming
- **TypeScript**: Type safety

### Development Dependencies
- **Angular CLI**: Development tools
- **Karma & Jasmine**: Testing framework
- **Protractor**: E2E testing

## 🚀 Deployment

### Production Build
```bash
# Build for production
ng build --prod

# The build artifacts will be stored in the `dist/` directory
```

### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --prod

FROM nginx:alpine
COPY --from=build /app/dist/portal /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Follow Angular style guide
- Use TypeScript strict mode
- Implement proper error handling
- Add JSDoc comments for public methods

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔄 Migration from React

This Angular version maintains feature parity with the original React implementation while providing:
- Better performance with OnPush change detection
- More maintainable code structure
- Improved type safety
- Better testing capabilities
- Enhanced developer experience