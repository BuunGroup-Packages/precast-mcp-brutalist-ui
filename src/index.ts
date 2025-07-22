#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupHandlers } from './handler.js';
/**
 * Parse command line arguments for the MCP server
 * @returns Object containing parsed arguments
 */
async function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Brutalist UI MCP Server

A Model Context Protocol server providing access to Brutalist UI components registry.

Usage:
  npx @buun_group/brutalist-ui-mcp-server [options]
  precast-brutalist-mcp [options]
  brutalist-ui-mcp [options]

Options:
  --help, -h                      Show this help message
  --version, -v                   Show version information
  --registry-url <url>            Override default registry URL

Examples:
  npx @buun_group/brutalist-ui-mcp-server
  precast-brutalist-mcp --registry-url https://custom-registry.com
  brutalist-ui-mcp

Registry:
  Default: https://brutalist.precast.dev/registry/react

Available Tools:
  - list_components              List all available components
  - get_component               Get component details and source code
  - search_components           Search components by query/filters
  - get_component_examples      Get usage examples for a component
  - get_component_styles        Get CSS styles for a component
  - get_categories              Get all component categories
  - get_components_by_category  Get components in a specific category
  - get_featured_components     Get featured components
  - get_registry_info           Get registry metadata
  - get_install_command         Get installation command for a component

For more information, visit: https://brutalist.precast.dev
`);
    process.exit(0);
  }
  if (args.includes('--version') || args.includes('-v')) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const packagePath = path.join(__dirname, '..', 'package.json');
      
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      console.log(`${packageJson.name} v${packageJson.version}`);
    } catch (error) {
      console.log('@buun_group/brutalist-ui-mcp-server v1.0.0');
    }
    process.exit(0);
  }
  const registryUrlIndex = args.findIndex(arg => arg === '--registry-url');
  let registryUrl = null;
  
  if (registryUrlIndex !== -1 && args[registryUrlIndex + 1]) {
    registryUrl = args[registryUrlIndex + 1];
  }

  return { registryUrl };
}
/**
 * Main function to initialize and start the MCP server
 */
async function main() {
  try {
    const { registryUrl } = await parseArgs();
    if (registryUrl) {
      process.env.REGISTRY_BASE_URL = registryUrl;
      console.error(`Using custom registry URL: ${registryUrl}`);
    } else {
      // Only use localhost if explicitly in development mode
      const isDev = process.env.NODE_ENV === 'development' || 
                   process.env.NODE_ENV === 'dev' ||
                   process.argv.includes('--dev');
      
      const baseUrl = isDev 
        ? 'http://localhost:3000'
        : 'https://brutalist.precast.dev';
      
      process.env.REGISTRY_BASE_URL = `${baseUrl}/registry/react`;
      console.error(`Using registry: ${baseUrl}/registry/react`);
    }
    const server = new Server(
      {
        name: "brutalist-ui-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    setupHandlers(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Brutalist UI MCP Server started successfully');
    console.error('Ready to serve component information and tools');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});