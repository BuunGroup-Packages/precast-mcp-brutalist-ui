#!/usr/bin/env node

/**
 * Generate a comprehensive test report for all MCP tools
 * Creates both console output and a detailed HTML report
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const MCP_SERVER_PATH = join(process.cwd(), 'build', 'index.js');

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

// Get all components
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

// Test all tools
async function testAllTools() {
  const generalTools = [
    { name: 'list_components', args: {} },
    { name: 'get_registry_info', args: {} },
    { name: 'get_categories', args: {} },
    { name: 'get_featured_components', args: {} },
    { name: 'get_documentation_sections', args: {} },
    { name: 'search_components', args: { query: 'form' } },
    { name: 'search_documentation', args: { query: 'accordion' } },
    { name: 'get_components_by_category', args: { category: 'forms' } },
  ];

  const generalResults = [];
  
  for (const tool of generalTools) {
    try {
      const startTime = Date.now();
      const response = await callMCPTool(tool.name, tool.args);
      const duration = Date.now() - startTime;
      
      generalResults.push({
        tool: tool.name,
        status: 'PASS',
        duration,
        hasContent: !!(response.result && response.result.content)
      });
    } catch (error) {
      generalResults.push({
        tool: tool.name,
        status: 'FAIL',
        duration: 0,
        error: error.message
      });
    }
  }
  
  return generalResults;
}

// Test a specific component with all tools
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

// Generate HTML report
function generateHtmlReport(testResults) {
  const { generalTools, componentResults, summary } = testResults;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Tools Test Report</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border: 3px solid #000;
            box-shadow: 8px 8px 0px #000;
        }
        h1, h2, h3 {
            color: #000;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .summary {
            background: #000;
            color: #fff;
            padding: 20px;
            margin: 20px 0;
            border: 3px solid #000;
        }
        .success { color: #00aa00; font-weight: bold; }
        .failure { color: #ff0000; font-weight: bold; }
        .warning { color: #ff6600; font-weight: bold; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 3px solid #000;
        }
        th, td {
            border: 1px solid #000;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #000;
            color: #fff;
            font-weight: bold;
            text-transform: uppercase;
        }
        .pass { background: #d4edda; }
        .fail { background: #f8d7da; }
        .tool-section {
            margin: 30px 0;
            border: 2px solid #000;
            padding: 20px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat {
            background: #000;
            color: #fff;
            padding: 15px;
            border: 2px solid #000;
            text-align: center;
            flex: 1;
        }
        .performance {
            background: #e9ecef;
            padding: 15px;
            border: 2px solid #000;
            margin: 20px 0;
        }
        .component-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin: 20px 0;
        }
        .component-card {
            border: 2px solid #000;
            padding: 10px;
            background: #fff;
        }
        .component-card.perfect { background: #d4edda; }
        .component-card.partial { background: #fff3cd; }
        .component-card.failed { background: #f8d7da; }
        .timestamp {
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 MCP Tools Test Report</h1>
        
        <div class="summary">
            <h2>📊 Test Summary</h2>
            <div class="stats">
                <div class="stat">
                    <h3>${summary.totalComponents}</h3>
                    <p>Components Tested</p>
                </div>
                <div class="stat">
                    <h3>${summary.totalTests}</h3>
                    <p>Total Tests</p>
                </div>
                <div class="stat">
                    <h3 class="success">${summary.totalPassed}</h3>
                    <p>Passed</p>
                </div>
                <div class="stat">
                    <h3 class="failure">${summary.totalFailed}</h3>
                    <p>Failed</p>
                </div>
                <div class="stat">
                    <h3>${summary.successRate}%</h3>
                    <p>Success Rate</p>
                </div>
            </div>
        </div>

        <div class="tool-section">
            <h2>🔧 General Tools Test Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Tool Name</th>
                        <th>Status</th>
                        <th>Duration (ms)</th>
                        <th>Has Content</th>
                    </tr>
                </thead>
                <tbody>
                    ${generalTools.map(tool => `
                        <tr class="${tool.status === 'PASS' ? 'pass' : 'fail'}">
                            <td>${tool.tool}</td>
                            <td class="${tool.status === 'PASS' ? 'success' : 'failure'}">${tool.status}</td>
                            <td>${tool.duration}ms</td>
                            <td>${tool.hasContent ? '✅' : '❌'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="tool-section">
            <h2>📦 Component Test Results</h2>
            <div class="component-grid">
                ${componentResults.map(result => {
                  const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                                'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
                  const passed = tools.filter(tool => result[tool] && result[tool].status === 'PASS').length;
                  const total = tools.length;
                  
                  let cardClass = 'failed';
                  if (passed === total) cardClass = 'perfect';
                  else if (passed > total / 2) cardClass = 'partial';
                  
                  return `
                    <div class="component-card ${cardClass}">
                        <h4>${result.component}</h4>
                        <p><strong>${passed}/${total}</strong> tools passed</p>
                        <small>${((passed / total) * 100).toFixed(1)}% success</small>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        <div class="tool-section">
            <h2>📈 Performance Analysis</h2>
            <div class="performance">
                <h3>Average Response Times</h3>
                ${Object.entries(summary.performanceStats).map(([tool, stats]) => `
                    <p><strong>${tool}:</strong> ${stats.avg}ms avg, ${stats.max}ms max, ${stats.min}ms min</p>
                `).join('')}
            </div>
        </div>

        <div class="tool-section">
            <h2>🔍 Component Categories</h2>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Component Count</th>
                        <th>Components</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary.categories).map(([category, components]) => `
                        <tr>
                            <td><strong>${category}</strong></td>
                            <td>${components.length}</td>
                            <td>${components.join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="timestamp">
            <p>Report generated on: ${new Date().toLocaleString()}</p>
            <p>Total test duration: ${summary.totalDuration}ms</p>
        </div>
    </div>
</body>
</html>
  `;
  
  return html;
}

// Main test runner
async function generateReport() {
  const startTime = Date.now();
  
  console.log('🧪 Generating Comprehensive MCP Test Report');
  console.log('==========================================');
  console.log('');
  
  console.log('🔧 Testing general tools...');
  const generalTools = await testAllTools();
  
  console.log('📦 Fetching all components...');
  const components = await getAllComponents();
  
  console.log(`📊 Testing ${components.length} components...`);
  const componentResults = [];
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    process.stdout.write(`[${i + 1}/${components.length}] Testing ${component.name}... `);
    
    try {
      const result = await testComponent(component.name);
      componentResults.push(result);
      
      const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                     'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
      const passed = tools.filter(tool => result[tool] && result[tool].status === 'PASS').length;
      console.log(`✅ ${passed}/${tools.length} passed`);
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      componentResults.push({
        component: component.name,
        error: error.message
      });
    }
  }
  
  const endTime = Date.now();
  
  // Calculate summary statistics
  const summary = {
    totalComponents: components.length,
    totalTests: generalTools.length + (componentResults.length * 6),
    totalPassed: 0,
    totalFailed: 0,
    successRate: 0,
    totalDuration: endTime - startTime,
    performanceStats: {},
    categories: {}
  };
  
  // Count general tools
  generalTools.forEach(tool => {
    if (tool.status === 'PASS') summary.totalPassed++;
    else summary.totalFailed++;
  });
  
  // Count component tools
  componentResults.forEach(result => {
    if (result.error) {
      summary.totalFailed += 6;
    } else {
      const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                     'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
      tools.forEach(tool => {
        if (result[tool] && result[tool].status === 'PASS') {
          summary.totalPassed++;
        } else {
          summary.totalFailed++;
        }
      });
    }
  });
  
  summary.successRate = ((summary.totalPassed / summary.totalTests) * 100).toFixed(1);
  
  // Performance stats
  const tools = ['get_component', 'get_component_styles', 'get_component_examples', 
                 'get_install_command', 'get_component_documentation', 'get_accessibility_info'];
  
  tools.forEach(tool => {
    const durations = componentResults
      .filter(r => !r.error && r[tool])
      .map(r => r[tool].duration);
    
    if (durations.length > 0) {
      summary.performanceStats[tool] = {
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        max: Math.max(...durations),
        min: Math.min(...durations)
      };
    }
  });
  
  // Category stats
  components.forEach(component => {
    component.categories.forEach(category => {
      if (!summary.categories[category]) {
        summary.categories[category] = [];
      }
      summary.categories[category].push(component.name);
    });
  });
  
  // Generate HTML report
  const htmlReport = generateHtmlReport({
    generalTools,
    componentResults,
    summary
  });
  
  // Write report to file
  const reportPath = join(process.cwd(), 'test-report.html');
  writeFileSync(reportPath, htmlReport);
  
  // Console output
  console.log('');
  console.log('📊 Final Test Report');
  console.log('===================');
  console.log(`📦 Components tested: ${summary.totalComponents}`);
  console.log(`🧪 Total tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.totalPassed}`);
  console.log(`❌ Failed: ${summary.totalFailed}`);
  console.log(`📈 Success Rate: ${summary.successRate}%`);
  console.log(`⏱️  Total Duration: ${summary.totalDuration}ms`);
  console.log('');
  console.log(`📄 Detailed HTML report saved to: ${reportPath}`);
  console.log('');
  
  if (summary.totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('The MCP server is working perfectly!');
  } else {
    console.log(`⚠️  ${summary.totalFailed} tests failed. Check the HTML report for details.`);
  }
  
  return summary.totalFailed === 0;
}

// Run the report generator
generateReport()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Report generation failed:', error);
    process.exit(1);
  });