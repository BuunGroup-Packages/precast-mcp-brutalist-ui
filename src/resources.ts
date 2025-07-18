/**
 * Resources for the Brutalist UI MCP server.
 * 
 * Resources provide static information that AI models can reference.
 */

import { fetchRegistryIndex, getCategories, getFeaturedComponents } from './utils/api.js';

/**
 * Static resources available to the MCP client
 */
export const resources = [
  {
    uri: "brutalist-ui://registry/overview",
    name: "Brutalist UI Registry Overview",
    description: "Overview of the Brutalist UI component registry and available components",
    mimeType: "text/plain",
  },
  {
    uri: "brutalist-ui://registry/categories",
    name: "Component Categories",
    description: "List of all component categories with descriptions and component counts",
    mimeType: "application/json",
  },
  {
    uri: "brutalist-ui://registry/featured",
    name: "Featured Components",
    description: "List of featured Brutalist UI components",
    mimeType: "application/json",
  },
  {
    uri: "brutalist-ui://registry/installation",
    name: "Installation Guide",
    description: "Guide for installing and using Brutalist UI components",
    mimeType: "text/markdown",
  },
  {
    uri: "brutalist-ui://registry/brutalist-features",
    name: "Brutalist Design Features",
    description: "Overview of brutalist design principles used in the components",
    mimeType: "text/markdown",
  },
];

/**
 * Resource handlers that generate resource content
 */
export const resourceHandlers = {
  "brutalist-ui://registry/overview": async () => {
    const registryIndex = await fetchRegistryIndex();
    const featuredCount = registryIndex.components.filter(c => c.featured).length;
    
    const overview = `
# Brutalist UI Registry Overview

${registryIndex.description}

## Registry Information
- **Name**: ${registryIndex.name}
- **Framework**: ${registryIndex.framework}
- **Version**: ${registryIndex.version}
- **Total Components**: ${registryIndex.components.length}
- **Featured Components**: ${featuredCount}
- **Categories**: ${Object.keys(registryIndex.categories).length}

## Base URL
${registryIndex.baseUrl}

## Maintainer
${registryIndex.meta?.maintainer || 'Brutalist UI Team'}

## Last Updated
${registryIndex.meta?.lastUpdated || 'Not specified'}

## Installation
To use any component from this registry:

1. Install the precast-ui CLI:
   \`\`\`bash
   npm install -g precast-ui
   \`\`\`

2. Install a component:
   \`\`\`bash
   precast-ui add "https://brutalist.precast.dev/registry/react/COMPONENT_NAME"
   \`\`\`

3. Import and use in your React app:
   \`\`\`jsx
   import { ComponentName } from '@brutalist-ui/components'
   \`\`\`
`.trim();

    return {
      content: overview,
      contentType: "text/plain",
    };
  },

  "brutalist-ui://registry/categories": async () => {
    const categories = await getCategories();
    
    return {
      content: JSON.stringify(categories, null, 2),
      contentType: "application/json",
    };
  },

  "brutalist-ui://registry/featured": async () => {
    const featured = await getFeaturedComponents();
    
    return {
      content: JSON.stringify(featured, null, 2),
      contentType: "application/json",
    };
  },

  "brutalist-ui://registry/installation": async () => {
    const installationGuide = `
# Brutalist UI Installation Guide

## Prerequisites
- Node.js 18+ 
- React 16.8+
- A React project (Next.js, Vite, Create React App, etc.)

## Step 1: Install the CLI
Install the precast-ui CLI globally:

\`\`\`bash
npm install -g precast-ui
\`\`\`

## Step 2: Install Components
Install individual components from the registry:

\`\`\`bash
# Install a specific component
precast-ui add "https://brutalist.precast.dev/registry/react/button"

# Install multiple components
precast-ui add "https://brutalist.precast.dev/registry/react/button" "https://brutalist.precast.dev/registry/react/card"
\`\`\`

## Step 3: Use Components
Import and use components in your React application:

\`\`\`jsx
import React from 'react'
import { Button, Card } from '@brutalist-ui/components'

function App() {
  return (
    <div>
      <Card>
        <Card.Header>
          <h2>Welcome to Brutalist UI</h2>
        </Card.Header>
        <Card.Body>
          <p>Bold, unapologetic, and functional components.</p>
          <Button variant="primary">Get Started</Button>
        </Card.Body>
      </Card>
    </div>
  )
}

export default App
\`\`\`

## Component Structure
Each component includes:
- **TypeScript source code** with full type definitions
- **CSS modules** for styling  
- **Documentation** and usage examples
- **Dependencies** automatically handled

## Styling
Components use CSS modules and CSS custom properties for theming. The brutalist design system includes:
- Thick borders (3px+)
- Bold shadows
- High contrast colors
- Sharp corners (no border-radius)
- Monospace typography for code elements

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
`.trim();

    return {
      content: installationGuide,
      contentType: "text/markdown",
    };
  },

  "brutalist-ui://registry/brutalist-features": async () => {
    const brutalistGuide = `
# Brutalist Design Principles

Brutalist UI embraces the raw, uncompromising aesthetic of brutalist architecture in digital design.

## Core Principles

### 1. Thick Borders
- Minimum 3px borders on interactive elements
- Bold, uncompromising outlines
- Clear definition between components

### 2. Bold Shadows
- Heavy drop shadows for depth
- No subtle gradients or soft shadows
- Strong visual hierarchy through shadow weight

### 3. Sharp Corners
- Zero border-radius (sharp 90-degree corners)
- No rounded edges or organic shapes
- Geometric precision in all components

### 4. High Contrast
- Bold color combinations
- Strong text contrast ratios (4.5:1 minimum)
- Clear visual distinction between states

### 5. Monospace Typography
- Code elements use monospace fonts
- Technical, utilitarian aesthetic
- Consistent character spacing

### 6. Functional Over Decorative
- Every visual element serves a purpose
- No gratuitous animations or effects
- Form follows function

## Component Features

Components may include these brutalist features:

- \`hasThickBorders\`: Bold border treatment
- \`hasShadows\`: Heavy shadow effects  
- \`hasSharpCorners\`: No border radius
- \`hasHighContrast\`: Bold color schemes
- \`hasAnimations\`: Functional micro-interactions
- \`hasGlitchEffects\`: Digital distortion effects

## Theme Variants

- **Classic**: Traditional brutalist principles
- **Modern**: Contemporary interpretation
- **Experimental**: Pushing boundaries further

## Usage Philosophy

> "The component should speak its function plainly, without decoration or apology."

Brutalist UI components are designed for developers who value:
- Clarity over aesthetics
- Function over form
- Boldness over subtlety
- Honesty in digital materials
`.trim();

    return {
      content: brutalistGuide,
      contentType: "text/markdown",
    };
  },
};