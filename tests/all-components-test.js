#!/usr/bin/env node

/**
 * Test ALL components in the registry to ensure none are broken
 * This tests every component against all component-specific tools
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';

const MCP_SERVER_PATH = join(process.cwd(), 'build', 'index.js');

// Helper function to call MCP tools
async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const mcpServer = spawn('node', [MCP_SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    mcpServer.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    mcpServer.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    mcpServer.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
      } else {
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          const responseLine = lines.find(line => line.includes('"jsonrpc"'));
          
          if (responseLine) {
            const response = JSON.parse(responseLine);
            resolve(response);
          } else {
            reject(new Error('No valid JSON response found'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      }
    });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    mcpServer.stdin.write(JSON.stringify(request) + '\n');
    mcpServer.stdin.end();
  });
}

async function getAllComponents() {
  try {
    const response = await callMCPTool('list_components');
    const data = JSON.parse(response.result.content[0].text);
    return data.components || [];
  } catch (error) {
    console.error('Failed to get components:', error);
    return [];
  }
}

async function testComponent(componentName) {
  const tools = [
    'get_component',
    'get_component_styles', 
    'get_component_examples',
    'get_install_command',
    'get_component_documentation',
    'get_accessibility_info'
  ];
  
  const results = { component: componentName };
  
  for (const tool of tools) {
    try {
      const startTime = Date.now();
      const response = await callMCPTool(tool, { componentName });
      const duration = Date.now() - startTime;
      
      if (response.result && response.result.content) {
        const data = JSON.parse(response.result.content[0].text);
        results[tool] = {
          status: 'PASS',
          duration,
          hasContent: !!data && Object.keys(data).length > 0
        };
      } else {
        results[tool] = {
          status: 'FAIL',
          duration,
          error: 'No content in response'
        };
      }
    } catch (error) {
      results[tool] = {
        status: 'FAIL',
        duration: 0,
        error: error.message
      };
    }
  }
  
  return results;
}

async function runAllComponentsTest() {
  console.log('🧪 Testing ALL Components in Registry');
  console.log('====================================');
  console.log('');
  
  console.log('📦 Fetching all components...');
  const components = await getAllComponents();
  
  if (components.length === 0) {
    console.error('❌ No components found in registry');
    process.exit(1);
  }
  
  console.log(`✅ Found ${components.length} components to test`);
  console.log('');
  
  const allResults = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const componentName = component.name;
    
    process.stdout.write(`[${i + 1}/${components.length}] Testing ${componentName}... `);
    
    try {
      const results = await testComponent(componentName);
      allResults.push(results);
      
      const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                     'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
      
      let passed = 0;
      
      tools.forEach(tool => {
        if (results[tool].status === 'PASS') {
          passed++;
          totalPassed++;
        } else {
          totalFailed++;
        }
        totalTests++;
      });
      
      console.log(`✅ ${passed}/${tools.length} passed`);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      allResults.push({
        component: componentName,
        error: error.message
      });
      totalFailed += 6;
      totalTests += 6;
    }
  }
  
  console.log('');
  console.log('📊 Comprehensive Test Results');
  console.log('=============================');
  console.log(`📦 Components tested: ${components.length}`);
  console.log(`🧪 Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  
  // Show failed components
  const failedComponents = allResults.filter(result => {
    if (result.error) return true;
    const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                   'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
    return tools.some(tool => result[tool] && result[tool].status === 'FAIL');
  });
  
  if (failedComponents.length > 0) {
    console.log('');
    console.log('❌ Components with failures:');
    failedComponents.forEach(result => {
      console.log(`   ${result.component}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      } else {
        const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                       'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
        tools.forEach(tool => {
          if (result[tool] && result[tool].status === 'FAIL') {
            console.log(`      ${tool}: ${result[tool].error}`);
          }
        });
      }
    });
  }
  
  const validResults = allResults.filter(r => !r.error);
  if (validResults.length > 0) {
    console.log('');
    console.log('⏱️  Performance Analysis:');
    
    const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                   'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
    
    tools.forEach(tool => {
      const durations = validResults
        .map(r => r[tool]?.duration)
        .filter(d => d !== undefined);
      
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const max = Math.max(...durations);
        const min = Math.min(...durations);
        console.log(`   ${tool}: avg ${avg.toFixed(0)}ms, max ${max}ms, min ${min}ms`);
      }
    });
  }
  
  console.log('');
  console.log('🔍 Component Analysis:');
  const componentsByCategory = {};
  
  components.forEach(component => {
    component.categories.forEach(category => {
      if (!componentsByCategory[category]) {
        componentsByCategory[category] = [];
      }
      componentsByCategory[category].push(component.name);
    });
  });
  
  Object.entries(componentsByCategory).forEach(([category, comps]) => {
    console.log(`   ${category}: ${comps.length} components`);
  });
  
  return totalFailed === 0;
}

runAllComponentsTest()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🎉 ALL COMPONENTS PASSED!');
      console.log('The MCP server is working perfectly with all components.');
      process.exit(0);
    } else {
      console.log('');
      console.log('💥 Some components failed. See details above.');
      console.log('The MCP server needs attention for failing components.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });