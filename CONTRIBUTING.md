# Contributing to Brutalist UI MCP Server

Thank you for your interest in contributing to the Brutalist UI MCP Server! We welcome contributions from the community and appreciate your help in making this project better.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)
- [Community](#community)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm**, **yarn**, **pnpm**, or **bun** (package manager of your choice)
- **Git** (for version control)

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/brutalist-components.git
   cd brutalist-components/packages/mcp/precast-mcp-brutalist-ui
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Test the MCP server**:
   ```bash
   npm start
   ```

## 🛠️ Development Setup

### Environment Variables

Create a `.env` file in the project root if needed:

```env
NODE_ENV=development
```

### Development Commands

- `npm start` - Start the MCP server
- `npm run build` - Build the TypeScript code
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run type-check` - Run type checking
- `npm run dev` - Start in development mode with hot reload

## 📁 Project Structure

```
src/
├── handler.ts          # MCP request handlers
├── index.ts           # Main entry point
├── resources.ts       # MCP resources definitions
├── tools.ts          # MCP tools implementations
├── schemas/          # Zod schemas and types
│   └── registry.ts
└── utils/           # Utility functions
    ├── api.ts       # API client functions
    └── docs.ts      # Documentation utilities
```

## 🤖 How to Contribute

### Reporting Issues

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** provided
3. **Provide detailed information** including:
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior
   - Error logs if applicable

### Suggesting Features

1. **Check existing feature requests** first
2. **Use the feature request template**
3. **Clearly describe the problem** you're trying to solve
4. **Propose a solution** with examples
5. **Consider the impact** on existing functionality

### Contributing Code

1. **Create a new branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run tests** to ensure nothing is broken
6. **Commit your changes** with clear messages

## 📝 Coding Standards

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Prefer **explicit types** over `any`
- Use **JSDoc comments** for all public functions
- Follow **functional programming** patterns where possible

### Code Style

- Use **2 spaces** for indentation
- Use **semicolons** consistently
- Use **trailing commas** in objects and arrays
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces

### Example Function Documentation

```typescript
/**
 * Fetch a specific component from the registry
 * @param componentName - Name of the component to fetch
 * @returns Promise resolving to component data
 */
export async function fetchComponent(componentName: string): Promise<Component> {
  // Implementation
}
```

### MCP Tool Guidelines

When adding new MCP tools:

1. **Add the tool definition** to `tools.ts`
2. **Implement the handler** with proper error handling
3. **Add input validation** using Zod schemas
4. **Include JSDoc documentation**
5. **Add tests** for the new functionality

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies
- Keep tests focused and isolated

### Test Structure

```typescript
describe('fetchComponent', () => {
  it('should fetch component successfully', async () => {
    // Test implementation
  });

  it('should handle component not found error', async () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Documentation

- **JSDoc comments** for all public functions
- **Inline comments** for complex logic
- **Type annotations** for clarity
- **README updates** for new features

### Documentation Updates

When making changes that affect users:

1. Update the **README.md** if needed
2. Update **JSDoc comments**
3. Add **usage examples** for new features
4. Update **type definitions**

## 🔄 Submitting Changes

### Pull Request Process

1. **Create a pull request** from your feature branch
2. **Use the PR template** provided
3. **Fill out all sections** of the template
4. **Link related issues** using keywords like "Closes #123"
5. **Ensure all checks pass** (tests, linting, type checking)

### Pull Request Guidelines

- **Keep PRs focused** on a single feature or fix
- **Write clear commit messages** following conventional commits
- **Include tests** for new functionality
- **Update documentation** as needed
- **Respond to review feedback** promptly

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(tools): add new component search functionality
fix(api): handle network timeout errors properly
docs(readme): update installation instructions
```

## 🔍 Review Process

### What to Expect

1. **Automated checks** will run on your PR
2. **Maintainers will review** your changes
3. **Feedback will be provided** if changes are needed
4. **Multiple rounds** of review may be necessary
5. **Approval and merge** once ready

### Review Criteria

- **Code quality** and adherence to standards
- **Test coverage** and passing tests
- **Documentation** completeness
- **Backward compatibility** considerations
- **Performance** impact assessment

## 🌟 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

## 💬 Community

### Getting Help

- **GitHub Issues** for bugs and feature requests
- **GitHub Discussions** for questions and ideas
- **Documentation** at https://brutalist.precast.dev/docs

### Communication Guidelines

- **Be respectful** and professional
- **Provide context** when asking questions
- **Search existing discussions** before creating new ones
- **Use appropriate channels** for different types of communication

## 🎯 Development Tips

### Common Development Tasks

1. **Adding a new MCP tool**:
   - Define the tool in `tools.ts`
   - Add input schema validation
   - Implement the handler function
   - Add tests and documentation

2. **Modifying API endpoints**:
   - Update functions in `utils/api.ts`
   - Update corresponding schemas
   - Add error handling
   - Update tests

3. **Adding new resources**:
   - Define resource in `resources.ts`
   - Implement the resource handler
   - Add proper caching if needed
   - Update documentation

### Debugging

- Use `console.error()` for server logging
- Test with MCP clients like Claude Desktop
- Check network requests and responses
- Validate JSON schemas with test data

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to the Brutalist UI MCP Server! Your contributions help make this project better for everyone. 🚀