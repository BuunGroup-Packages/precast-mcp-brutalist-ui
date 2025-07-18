import axios from 'axios';
import { RegistryIndexSchema, ComponentSchema } from '../schemas/registry.js';
import type { RegistryIndex, Component, RegistryComponent } from '../schemas/registry.js';

const REGISTRY_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://brutalist.precast.dev/registry/react'
  : 'http://localhost:3000/registry/react';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Retrieve data from cache if not expired
 * @param key - Cache key
 * @returns Cached data or null if expired/not found
 */
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

/**
 * Store data in cache with timestamp
 * @param key - Cache key
 * @param data - Data to cache
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}
/**
 * Fetch the registry index containing all components
 * @returns Promise resolving to registry index
 */
export async function fetchRegistryIndex(): Promise<RegistryIndex> {
  const cacheKey = 'registry-index';
  const cached = getFromCache<RegistryIndex>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${REGISTRY_BASE_URL}/index.json`);
    const registryIndex = RegistryIndexSchema.parse(response.data);
    setCache(cacheKey, registryIndex);
    return registryIndex;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch registry index: ${error.message}`);
    }
    throw new Error(`Failed to parse registry index: ${error}`);
  }
}
/**
 * Fetch a specific component by name
 * @param componentName - Name of the component to fetch
 * @returns Promise resolving to component data
 */
export async function fetchComponent(componentName: string): Promise<Component> {
  const cacheKey = `component-${componentName}`;
  const cached = getFromCache<Component>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${REGISTRY_BASE_URL}/${componentName}.json`);
    const component = ComponentSchema.parse(response.data);
    setCache(cacheKey, component);
    return component;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Component '${componentName}' not found in registry`);
      }
      throw new Error(`Failed to fetch component '${componentName}': ${error.message}`);
    }
    throw new Error(`Failed to parse component '${componentName}': ${error}`);
  }
}
/**
 * Search components by query and filters
 * @param query - Search query
 * @param category - Optional category filter
 * @param featured - Optional featured filter
 * @returns Promise resolving to search results
 */
export async function searchComponents(
  query: string,
  category?: string,
  featured?: boolean
): Promise<{
  results: RegistryComponent[];
  total: number;
  query: string;
  filters: { category?: string; featured?: boolean };
}> {
  const registryIndex = await fetchRegistryIndex();
  
  let results = registryIndex.components;

  if (category) {
    results = results.filter(component => 
      component.categories.includes(category)
    );
  }

  if (featured !== undefined) {
    results = results.filter(component => component.featured === featured);
  }

  if (query.trim()) {
    const queryLower = query.toLowerCase();
    results = results.filter(component =>
      component.name.toLowerCase().includes(queryLower) ||
      component.title.toLowerCase().includes(queryLower) ||
      component.description.toLowerCase().includes(queryLower)
    );
  }

  return {
    results,
    total: results.length,
    query,
    filters: { category, featured },
  };
}
/**
 * Get all components in a specific category
 * @param category - Category name
 * @returns Promise resolving to category components
 */
export async function getComponentsByCategory(category: string): Promise<{
  category: string;
  categoryInfo: { title: string; description: string } | null;
  components: RegistryComponent[];
  total: number;
}> {
  const registryIndex = await fetchRegistryIndex();
  
  const components = registryIndex.components.filter(component =>
    component.categories.includes(category)
  );

  const categoryInfo = registryIndex.categories[category] || null;

  return {
    category,
    categoryInfo,
    components,
    total: components.length,
  };
}

/**
 * Get all available categories with component counts
 * @returns Promise resolving to categories data
 */
export async function getCategories(): Promise<{
  categories: Record<string, { title: string; description: string; count: number }>;
  total: number;
}> {
  const registryIndex = await fetchRegistryIndex();
  
  const categoryCounts: Record<string, number> = {};
  registryIndex.components.forEach(component => {
    component.categories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  const categories: Record<string, { title: string; description: string; count: number }> = {};
  Object.entries(registryIndex.categories).forEach(([key, info]) => {
    categories[key] = {
      ...info,
      count: categoryCounts[key] || 0,
    };
  });

  return {
    categories,
    total: Object.keys(categories).length,
  };
}

/**
 * Get all featured components
 * @returns Promise resolving to featured components
 */
export async function getFeaturedComponents(): Promise<{
  components: RegistryComponent[];
  total: number;
}> {
  const registryIndex = await fetchRegistryIndex();
  
  const featuredComponents = registryIndex.components.filter(component => component.featured);

  return {
    components: featuredComponents,
    total: featuredComponents.length,
  };
}

/**
 * Get registry information and statistics
 * @returns Promise resolving to registry info
 */
export async function getRegistryInfo(): Promise<{
  registry: RegistryIndex;
  stats: {
    totalComponents: number;
    featuredComponents: number;
    categoriesCount: number;
    lastUpdated: string | null;
  };
}> {
  const registryIndex = await fetchRegistryIndex();
  
  const featuredCount = registryIndex.components.filter(c => c.featured).length;
  
  return {
    registry: registryIndex,
    stats: {
      totalComponents: registryIndex.components.length,
      featuredComponents: featuredCount,
      categoriesCount: Object.keys(registryIndex.categories).length,
      lastUpdated: registryIndex.meta?.lastUpdated || null,
    },
  };
}