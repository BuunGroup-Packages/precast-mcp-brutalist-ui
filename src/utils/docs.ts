export const DOCS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://brutalist.precast.dev'
  : 'http://localhost:3000';

export const DOCS_STRUCTURE = {
  guides: [
    'introduction',
    'installation',
    'typescript',
    'cli',
    'design-principles',
    'colors',
    'typography',
    'spacing',
    'animations',
    'shapes',
    'accessibility',
    'theming',
    'changelog'
  ],
  components: [
    'accordion', 'alert', 'avatar', 'badge', 'bar-chart', 'line-chart', 'pie-chart', 'area-chart',
    'aspect-ratio', 'breadcrumb', 'button', 'card', 'checkbox', 'combobox', 'command', 'container',
    'context-menu', 'dialog', 'drawer', 'dropdown', 'hover-card', 'input', 'input-otp',
    'navigation', 'pagination', 'popover', 'progress', 'radio', 'select', 'separator',
    'sidebar', 'skeleton', 'slider', 'spinner', 'stack', 'switch', 'toggle', 'typography',
    'table', 'table-of-contents', 'tabs', 'textarea', 'toast', 'tooltip'
  ],
  api: [
    'types',
    'registry'
  ]
};

export interface DocumentationSection {
  title: string;
  description: string;
  content: string;
  examples?: string[];
  accessibility?: {
    keyboardSupport: string[];
    ariaAttributes: string[];
    bestPractices: string[];
  };
  apiReference?: {
    props: Array<{
      name: string;
      type: string;
      defaultValue?: string;
      description: string;
      required?: boolean;
    }>;
  };
}

/**
 * Extract documentation from component source file
 * @param componentName - Name of the component
 * @returns Promise resolving to documentation section
 */
export async function extractComponentDocumentation(componentName: string): Promise<DocumentationSection> {
  try {
    let docsPath = '';
    if (componentName === 'aspect-ratio') {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/components/aspect-ratio.tsx`;
    } else if (componentName === 'pagination') {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/components/pagination.tsx`;
    } else if (componentName === 'bar-chart') {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/components/BarChartPage.tsx`;
    } else if (componentName === 'line-chart') {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/components/LineChartPage.tsx`;
    } else if (componentName === 'table-of-contents') {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/components/TableOfContentsPage.tsx`;
    } else if (componentName === 'shapes') {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/ShapesPage.tsx`;
    } else {
      docsPath = `/home/sacha/repositories/brutalist-components/apps/website/src/pages/docs/components/${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Page.tsx`;
    }
    
    const fs = await import('fs');
    const content = fs.readFileSync(docsPath, 'utf8');
    
    const documentation: DocumentationSection = {
      title: extractTitle(content),
      description: extractDescription(content),
      content: extractMainContent(content),
      examples: extractExamples(content),
      accessibility: extractAccessibility(content),
      apiReference: extractAPIReference(content)
    };

    return documentation;
  } catch (error) {
    throw new Error(`Failed to extract documentation for ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract title from HTML content
 * @param content - HTML content
 * @returns Extracted title
 */
function extractTitle(content: string): string {
  const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  return titleMatch ? titleMatch[1] : '';
}

/**
 * Extract description from HTML content
 * @param content - HTML content
 * @returns Extracted description
 */
function extractDescription(content: string): string {
  const descMatch = content.match(/<p className={styles\.description}>([^<]+)<\/p>/);
  return descMatch ? descMatch[1].trim() : '';
}

/**
 * Extract main content sections from HTML
 * @param content - HTML content
 * @returns Extracted main content
 */
function extractMainContent(content: string): string {
  const sections = [];
  
  const featuresMatch = content.match(/<h2[^>]*id="features"[^>]*>Features<\/h2>(.*?)<\/section>/s);
  if (featuresMatch) {
    sections.push(`## Features\n${extractListItems(featuresMatch[1])}`);
  }
  
  const usageMatch = content.match(/<h2[^>]*id="usage"[^>]*>Usage<\/h2>(.*?)<\/section>/s);
  if (usageMatch) {
    sections.push(`## Usage\n${extractUsageContent(usageMatch[1])}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Extract code examples from HTML content
 * @param content - HTML content
 * @returns Array of code examples
 */
function extractExamples(content: string): string[] {
  const examples: string[] = [];
  const codeBlocks = content.match(/<CodeBlock[^>]*code={`([^`]+)`}/g);
  
  if (codeBlocks) {
    codeBlocks.forEach(block => {
      const code = block.match(/code={`([^`]+)`}/);
      if (code) {
        examples.push(code[1]);
      }
    });
  }
  
  return examples;
}

/**
 * Extract accessibility information from HTML content
 * @param content - HTML content
 * @returns Accessibility information or undefined
 */
function extractAccessibility(content: string): DocumentationSection['accessibility'] {
  const keyboardSupport: string[] = [];
  const ariaAttributes: string[] = [];
  const bestPractices: string[] = [];
  
  const keyboardMatch = content.match(/<div className={styles\.shortcut}>(.*?)<\/div>/gs);
  if (keyboardMatch) {
    keyboardMatch.forEach(shortcut => {
      const kbdMatch = shortcut.match(/<kbd[^>]*>([^<]+)<\/kbd>/);
      const spanMatch = shortcut.match(/<span>([^<]+)<\/span>/);
      if (kbdMatch && spanMatch) {
        keyboardSupport.push(`${kbdMatch[1]}: ${spanMatch[1]}`);
      }
    });
  }
  
  const ariaMatch = content.match(/<ul className={styles\.ariaList}>(.*?)<\/ul>/s);
  if (ariaMatch) {
    ariaAttributes.push(...extractListItems(ariaMatch[1]));
  }
  
  const practicesMatch = content.match(/<ul className={styles\.practiceList}>(.*?)<\/ul>/s);
  if (practicesMatch) {
    bestPractices.push(...extractListItems(practicesMatch[1]));
  }
  
  return keyboardSupport.length > 0 || ariaAttributes.length > 0 || bestPractices.length > 0 
    ? { keyboardSupport, ariaAttributes, bestPractices }
    : undefined;
}

/**
 * Extract API reference information from HTML content
 * @param _content - HTML content (unused)
 * @returns API reference or undefined
 */
function extractAPIReference(_content: string): DocumentationSection['apiReference'] {
  return undefined;
}

/**
 * Extract list items from HTML content
 * @param htmlContent - HTML content
 * @returns Array of list items
 */
function extractListItems(htmlContent: string): string[] {
  const items: string[] = [];
  const liMatches = htmlContent.match(/<li[^>]*>([^<]+)<\/li>/g);
  
  if (liMatches) {
    liMatches.forEach(li => {
      const textMatch = li.match(/<li[^>]*>([^<]+)<\/li>/);
      if (textMatch) {
        items.push(textMatch[1].trim());
      }
    });
  }
  
  return items;
}

/**
 * Extract usage content from HTML
 * @param htmlContent - HTML content
 * @returns Clean usage content
 */
function extractUsageContent(htmlContent: string): string {
  const cleanContent = htmlContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return cleanContent;
}

/**
 * Search documentation by query and section
 * @param query - Search query
 * @param section - Optional section to search in
 * @returns Array of matching documentation paths
 */
export function searchDocumentation(query: string, section?: string): string[] {
  const results: string[] = [];
  const searchTerm = query.toLowerCase();
  
  const sectionsToSearch = section ? [section] : Object.keys(DOCS_STRUCTURE);
  
  sectionsToSearch.forEach(sectionName => {
    const items = DOCS_STRUCTURE[sectionName as keyof typeof DOCS_STRUCTURE];
    items.forEach(item => {
      if (item.toLowerCase().includes(searchTerm)) {
        results.push(`${sectionName}/${item}`);
      }
    });
  });
  
  return results;
}

/**
 * Get all documentation sections
 * @returns Documentation structure
 */
export function getAllDocumentationSections() {
  return DOCS_STRUCTURE;
}