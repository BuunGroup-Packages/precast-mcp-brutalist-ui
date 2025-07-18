/**
 * Request handler setup for the Brutalist UI MCP server
 */
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { type Server } from "@modelcontextprotocol/sdk/server/index.js";
import { resourceHandlers, resources } from "./resources.js";
import { toolHandlers, tools } from "./tools.js";
import { z } from "zod";

/**
 * Sets up all request handlers for the MCP server
 * @param server - The MCP server instance
 */
export const setupHandlers = (server: Server): void => {
  server.setRequestHandler(
    ListResourcesRequestSchema,
    () => ({ resources }),
  );
  
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(tools),
  }));
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params ?? {};
    
    try {
      const resourceHandler = resourceHandlers[uri as keyof typeof resourceHandlers];
      if (resourceHandler) {
        const result = await Promise.resolve(resourceHandler());
        return {
          contents: [{
            uri: uri,
            mimeType: result.contentType,
            text: result.content
          }]
        };
      }
      
      throw new McpError(ErrorCode.InvalidParams, `Resource not found: ${uri}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError, 
        `Error processing resource: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: params } = request.params ?? {};
    
    if (!name || typeof name !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, "Tool name is required");
    }
    
    const handler = toolHandlers[name as keyof typeof toolHandlers];

    if (!handler) {
      throw new McpError(ErrorCode.InvalidParams, `Tool not found: ${name}`);
    }

    try {
      const toolSchema = getToolSchema(name);
      let validatedParams = params || {};
      
      if (toolSchema) {
        try {
          validatedParams = toolSchema.parse(validatedParams);
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            const errorMessages = validationError.errors.map(err => 
              `${err.path.join('.')}: ${err.message}`
            ).join(', ');
            
            throw new McpError(
              ErrorCode.InvalidParams, 
              `Invalid parameters: ${errorMessages}`
            );
          }
          throw validationError;
        }
      }
      
      const result = await Promise.resolve(handler(validatedParams as never));
      return result;
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError, 
        `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
  
  server.onerror = (error) => {
    console.error("[MCP Server Error]", error);
  };
};

/**
 * Get Zod schema for tool validation if available
 * @param toolName - Name of the tool to get schema for
 * @returns Zod schema for validation or undefined
 */
function getToolSchema(toolName: string): z.ZodType | undefined {
  try {
    switch(toolName) {
      case 'get_component':
      case 'get_component_examples':
      case 'get_component_styles':
      case 'get_install_command':
        return z.object({ componentName: z.string() });
        
      case 'search_components':
        return z.object({ 
          query: z.string(),
          category: z.string().optional(),
          featured: z.boolean().optional()
        });
        
      case 'get_components_by_category':
        return z.object({ category: z.string() });
        
      case 'list_components':
      case 'get_categories':
      case 'get_featured_components':
      case 'get_registry_info':
        return z.object({});
        
      default:
        return undefined;
    }
  } catch (error) {
    console.error("Error getting schema:", error);
    return undefined;
  }
}