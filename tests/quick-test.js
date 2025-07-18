#!/usr/bin/env node

/**
 * Quick test to verify all MCP tools are working
 * This is a faster alternative to the full test suite
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';

const MCP_SERVER_PATH = join(process.cwd(), 'build', 'index.js');

// Test configuration
const TOOLS_TO_TEST = [
  { name: 'list_components', args: {} },
  { name: 'get_registry_info', args: {} },
  { name: 'get_categories', args: {} },
  { name: 'get_featured_components', args: {} },
  { name: 'get_documentation_sections', args: {} },
  { name: 'get_component', args: { componentName: 'button' } },
  { name: 'get_component_styles', args: { componentName: 'button' } },
  { name: 'get_component_examples', args: { componentName: 'button' } },
  { name: 'get_install_command', args: { componentName: 'button' } },
  { name: 'get_component_documentation', args: { componentName: 'accordion' } },
  { name: 'get_accessibility_info', args: { componentName: 'button' } },
  { name: 'search_components', args: { query: 'form' } },
  { name: 'search_documentation', args: { query: 'accordion' } },
  { name: 'get_components_by_category', args: { category: 'forms' } },
];

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
          // Parse JSON response from stdout
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
    
    // Send MCP request
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

// Run quick tests
async function runQuickTests() {
  console.log('🚀 Running Quick MCP Tools Test');
  console.log('================================');
  console.log('');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const toolTest of TOOLS_TO_TEST) {
    const { name, args } = toolTest;
    
    process.stdout.write(`Testing ${name}... `);
    
    try {
      const startTime = Date.now();
      const response = await callMCPTool(name, args);
      const duration = Date.now() - startTime;
      
      if (response.result && response.result.content) {
        console.log(`✅ PASS (${duration}ms)`);
        results.push({ tool: name, status: 'PASS', duration, error: null });
        passed++;
      } else {
        console.log(`❌ FAIL (no content)`);
        results.push({ tool: name, status: 'FAIL', duration, error: 'No content in response' });
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL (${error.message})`);
      results.push({ tool: name, status: 'FAIL', duration: 0, error: error.message });
      failed++;
    }
  }
  
  console.log('');
  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('');
    console.log('❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   ${result.tool}: ${result.error}`);
    });
  }
  
  console.log('');
  console.log('⏱️  Performance Summary:');
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
  console.log(`   Average response time: ${avgDuration.toFixed(0)}ms`);
  
  const slowTests = results.filter(r => r.duration > 1000);
  if (slowTests.length > 0) {
    console.log('   Slow tests (>1s):');
    slowTests.forEach(test => {
      console.log(`     ${test.tool}: ${test.duration}ms`);
    });
  }
  
  return failed === 0;
}

// Run the tests
runQuickTests()
  .then(success => {
    if (success) {
      console.log('🎉 All quick tests passed!');
      process.exit(0);
    } else {
      console.log('💥 Some tests failed. Check the output above.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });