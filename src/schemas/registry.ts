import { z } from 'zod';
export const ComponentFileSchema = z.object({
  path: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  target: z.string().optional(),
  language: z.string().optional(),
  content: z.string(),
}).refine((data) => data.path || data.name, {
  message: "Either 'path' or 'name' must be provided",
  path: ["path", "name"],
});
export const BrutalistFeaturesSchema = z.object({
  hasThickBorders: z.boolean().optional(),
  hasShadows: z.boolean().optional(),
  hasSharpCorners: z.boolean().optional(),
  hasHighContrast: z.boolean().optional(),
  hasAnimations: z.boolean().optional(),
  hasGlitchEffects: z.boolean().optional(),
  theme: z.enum(['classic', 'modern', 'experimental']).optional(),
});
export const ComponentSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string(),
  author: z.string().optional(),
  version: z.string(),
  framework: z.string().optional(),
  frameworks: z.array(z.string()).optional(),
  brutalistFeatures: BrutalistFeaturesSchema.optional(),
  categories: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dependencies: z.union([z.array(z.string()), z.record(z.string())]).optional(),
  peerDependencies: z.union([z.array(z.string()), z.record(z.string())]).optional(),
  files: z.array(ComponentFileSchema),
  lastUpdated: z.string().optional(),
});
export const RegistryComponentSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  categories: z.array(z.string()),
  featured: z.boolean(),
  url: z.string(),
});
export const CategorySchema = z.object({
  title: z.string(),
  description: z.string(),
});
export const RegistryIndexSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  framework: z.string(),
  baseUrl: z.string(),
  components: z.array(RegistryComponentSchema),
  categories: z.record(z.string(), CategorySchema),
  meta: z.object({
    lastUpdated: z.string(),
    totalComponents: z.number(),
    maintainer: z.string(),
  }).optional(),
});
export type ComponentFile = z.infer<typeof ComponentFileSchema>;
export type BrutalistFeatures = z.infer<typeof BrutalistFeaturesSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type RegistryComponent = z.infer<typeof RegistryComponentSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type RegistryIndex = z.infer<typeof RegistryIndexSchema>;
export const ComponentNameParamSchema = z.object({
  componentName: z.string().describe("Name of the component to fetch"),
});

export const SearchParamSchema = z.object({
  query: z.string().describe("Search query for component name, title, or description"),
  category: z.string().optional().describe("Filter by category (optional)"),
  featured: z.boolean().optional().describe("Filter by featured status (optional)"),
});

export const CategoryParamSchema = z.object({
  category: z.string().describe("Category name to get components for"),
});
export type ComponentNameParam = z.infer<typeof ComponentNameParamSchema>;
export type SearchParam = z.infer<typeof SearchParamSchema>;
export type CategoryParam = z.infer<typeof CategoryParamSchema>;