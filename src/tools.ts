import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { 
  fetchRegistryIndex, 
  fetchComponent, 
  searchComponents, 
  getComponentsByCategory, 
  getCategories, 
  getFeaturedComponents, 
  getRegistryInfo 
} from './utils/api.js';
import { 
  ComponentNameParamSchema, 
  SearchParamSchema, 
  CategoryParamSchema 
} from './schemas/registry.js';
import { 
  extractComponentDocumentation,
  searchDocumentation,
  getAllDocumentationSections
} from './utils/docs.js';
import type { 
  ComponentNameParam, 
  SearchParam, 
  CategoryParam 
} from './schemas/registry.js';

/**
 * Create a success response for MCP tools
 * @param data - The data to include in the response
 * @returns Formatted success response
 */
function createSuccessResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Create an error response for MCP tools
 * @param message - Error message
 * @param code - Error code
 * @throws McpError
 */
function createErrorResponse(message: string, code: ErrorCode = ErrorCode.InternalError): never {
  throw new McpError(code, message);
}
export const tools = {
  list_components: {
    name: "list_components",
    description: "List all available Brutalist UI components from the registry",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  
  get_component: {
    name: "get_component",
    description: "Get detailed information about a specific Brutalist UI component including source code, styles, and metadata",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name of the component to fetch (e.g., 'button', 'card', 'textarea')",
        },
      },
      required: ["componentName"],
    },
  },
  
  search_components: {
    name: "search_components",
    description: "Search Brutalist UI components by name, title, description, or filters",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for component name, title, or description",
        },
        category: {
          type: "string",
          description: "Filter by category (e.g., 'forms', 'display', 'navigation')",
        },
        featured: {
          type: "boolean",
          description: "Filter by featured status",
        },
      },
      required: ["query"],
    },
  },
  
  get_component_examples: {
    name: "get_component_examples",
    description: "Get usage examples and demo code for a specific Brutalist UI component",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name of the component to get examples for",
        },
      },
      required: ["componentName"],
    },
  },
  
  get_component_styles: {
    name: "get_component_styles",
    description: "Get CSS styles and styling information for a specific Brutalist UI component",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name of the component to get styles for",
        },
      },
      required: ["componentName"],
    },
  },
  
  get_categories: {
    name: "get_categories",
    description: "Get all available component categories with descriptions and component counts",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  
  get_components_by_category: {
    name: "get_components_by_category",
    description: "Get all components in a specific category",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Category name (e.g., 'forms', 'display', 'navigation')",
        },
      },
      required: ["category"],
    },
  },
  
  get_featured_components: {
    name: "get_featured_components",
    description: "Get all featured Brutalist UI components",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  
  get_registry_info: {
    name: "get_registry_info",
    description: "Get metadata and statistics about the Brutalist UI registry",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  
  get_install_command: {
    name: "get_install_command",
    description: "Get the installation command for a specific component using precast-ui CLI",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name of the component to get install command for",
        },
      },
      required: ["componentName"],
    },
  },
};

/**
 * Tool handlers implementing the actual logic for each tool
 */
export const toolHandlers = {
  list_components: async () => {
    try {
      const registryIndex = await fetchRegistryIndex();
      return createSuccessResponse({
        components: registryIndex.components,
        total: registryIndex.components.length,
        framework: registryIndex.framework,
        version: registryIndex.version,
      });
    } catch (error) {
      createErrorResponse(`Failed to list components: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_component: async (params: ComponentNameParam) => {
    try {
      const { componentName } = ComponentNameParamSchema.parse(params);
      const component = await fetchComponent(componentName);
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://brutalist.precast.dev'
        : 'http://localhost:3000';
      
      return createSuccessResponse({
        component,
        installCommand: `precast-ui add "${baseUrl}/registry/react/${componentName}"`,
        registryUrl: `${baseUrl}/registry/react/${componentName}.json`,
      });
    } catch (error) {
      createErrorResponse(`Failed to get component: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  search_components: async (params: SearchParam) => {
    try {
      const { query, category, featured } = SearchParamSchema.parse(params);
      const results = await searchComponents(query, category, featured);
      
      return createSuccessResponse(results);
    } catch (error) {
      createErrorResponse(`Failed to search components: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_component_examples: async (params: ComponentNameParam) => {
    try {
      const { componentName } = ComponentNameParamSchema.parse(params);
      const component = await fetchComponent(componentName);
      
      // Extract example code from files
      const examples = component.files.filter(file => {
        const filePath = file.path || file.name || '';
        return filePath.includes('example') || 
               filePath.includes('demo') ||
               filePath.toLowerCase().includes('usage');
      });
      
      const mainComponent = component.files.find(file => {
        const filePath = file.path || file.name || '';
        return filePath.endsWith('.tsx') && !filePath.includes('example');
      });
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://brutalist.precast.dev'
        : 'http://localhost:3000';
      
      return createSuccessResponse({
        componentName,
        examples: examples.length > 0 ? examples : [mainComponent].filter(Boolean),
        installCommand: `precast-ui add "${baseUrl}/registry/react/${componentName}"`,
        usage: `import { ${(component.title || component.name).replace(/\s+/g, '')} } from '@brutalist-ui/components'`,
      });
    } catch (error) {
      createErrorResponse(`Failed to get component examples: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_component_styles: async (params: ComponentNameParam) => {
    try {
      const { componentName } = ComponentNameParamSchema.parse(params);
      const component = await fetchComponent(componentName);
      
      // Extract CSS files
      const styleFiles = component.files.filter(file => {
        const filePath = file.path || file.name || '';
        return filePath.endsWith('.css') || 
               filePath.endsWith('.module.css') ||
               filePath.endsWith('.scss');
      });
      
      // Handle dependencies format (array or object)
      const dependencies = Array.isArray(component.dependencies) 
        ? component.dependencies 
        : component.dependencies 
          ? Object.keys(component.dependencies)
          : [];

      return createSuccessResponse({
        componentName,
        brutalistFeatures: component.brutalistFeatures,
        styleFiles,
        dependencies,
      });
    } catch (error) {
      createErrorResponse(`Failed to get component styles: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_categories: async () => {
    try {
      const categories = await getCategories();
      return createSuccessResponse(categories);
    } catch (error) {
      createErrorResponse(`Failed to get categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_components_by_category: async (params: CategoryParam) => {
    try {
      const { category } = CategoryParamSchema.parse(params);
      const result = await getComponentsByCategory(category);
      return createSuccessResponse(result);
    } catch (error) {
      createErrorResponse(`Failed to get components by category: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_featured_components: async () => {
    try {
      const featured = await getFeaturedComponents();
      return createSuccessResponse(featured);
    } catch (error) {
      createErrorResponse(`Failed to get featured components: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_registry_info: async () => {
    try {
      const info = await getRegistryInfo();
      return createSuccessResponse(info);
    } catch (error) {
      createErrorResponse(`Failed to get registry info: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_install_command: async (params: ComponentNameParam) => {
    try {
      const { componentName } = ComponentNameParamSchema.parse(params);
      
      // Verify component exists
      await fetchComponent(componentName);
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://brutalist.precast.dev'
        : 'http://localhost:3000';
      
      return createSuccessResponse({
        componentName,
        installCommand: `precast-ui add "${baseUrl}/registry/react/${componentName}"`,
        npmInstall: "npm install -g precast-ui",
        usage: [
          "# Install the precast-ui CLI globally",
          "npm install -g precast-ui",
          "",
          "# Install the component",
          `precast-ui add "${baseUrl}/registry/react/${componentName}"`,
          "",
          "# Use in your React app",
          "import { ComponentName } from '@brutalist-ui/components'",
        ].join('\n'),
      });
    } catch (error) {
      createErrorResponse(`Failed to get install command: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_component_documentation: async (params: unknown) => {
    try {
      const { componentName } = ComponentNameParamSchema.parse(params);
      const documentation = await extractComponentDocumentation(componentName);
      
      return createSuccessResponse({
        componentName,
        documentation: {
          title: documentation.title,
          description: documentation.description,
          content: documentation.content,
          examples: documentation.examples,
          accessibility: documentation.accessibility,
          apiReference: documentation.apiReference
        },
        documentationUrl: `${process.env.NODE_ENV === 'production' ? 'https://brutalist.precast.dev' : 'http://localhost:3000'}/docs/components/${componentName}`
      });
    } catch (error) {
      return createErrorResponse(`Failed to get component documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  search_documentation: async (params: unknown) => {
    try {
      const parsedParams = SearchParamSchema.parse(params);
      const query = parsedParams.query;
      const section = parsedParams.category;
      const results = searchDocumentation(query, section);
      
      return createSuccessResponse({
        query,
        section,
        results: results.map(result => ({
          path: result,
          url: `${process.env.NODE_ENV === 'production' ? 'https://brutalist.precast.dev' : 'http://localhost:3000'}/docs/${result}`,
          title: result.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }))
      });
    } catch (error) {
      return createErrorResponse(`Failed to search documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_documentation_sections: async () => {
    try {
      const sections = getAllDocumentationSections();
      
      return createSuccessResponse({
        sections: Object.entries(sections).map(([sectionName, items]) => ({
          name: sectionName,
          title: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
          items: items.map(item => ({
            name: item,
            title: item.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            url: `${process.env.NODE_ENV === 'production' ? 'https://brutalist.precast.dev' : 'http://localhost:3000'}/docs/${sectionName === 'components' ? 'components/' : ''}${item}`
          }))
        }))
      });
    } catch (error) {
      return createErrorResponse(`Failed to get documentation sections: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  get_accessibility_info: async (params: unknown) => {
    try {
      const { componentName } = ComponentNameParamSchema.parse(params);
      const documentation = await extractComponentDocumentation(componentName);
      
      return createSuccessResponse({
        componentName,
        accessibility: documentation.accessibility || {
          keyboardSupport: [],
          ariaAttributes: [],
          bestPractices: []
        },
        documentationUrl: `${process.env.NODE_ENV === 'production' ? 'https://brutalist.precast.dev' : 'http://localhost:3000'}/docs/components/${componentName}#accessibility`
      });
    } catch (error) {
      return createErrorResponse(`Failed to get accessibility info: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};