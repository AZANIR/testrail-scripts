/**
 * TestRail Test Case Title Synchronization Tool
 *
 * This script validates and synchronizes test case titles between local test files and TestRail.
 * It compares test case titles in TypeScript test files with their corresponding titles in TestRail
 * and provides an option to automatically update TestRail titles to match the local file titles.
 *
 * FEATURES:
 * - Recursively scans test directories for .test.ts files
 * - Extracts test cases with TestRail IDs (format: C1234)
 * - Compares cleaned titles (without ID prefix) between files and TestRail
 * - Identifies title mismatches and provides detailed comparison
 * - Interactive update functionality with user confirmation
 * - Rate limiting protection (200ms delays to stay within 180 requests/minute limit)
 * - Comprehensive error handling and progress tracking
 * - Detailed reporting of successful/failed operations
 *
 * WORKFLOW:
 * 1. Connects to TestRail API using provided credentials
 * 2. Locates the target project using PROJECT_ID from environment variables
 * 3. Scans specified directory recursively for test files
 * 4. Extracts test cases with pattern: test('C1234 Test Title', ...)
 * 5. Retrieves corresponding test cases from TestRail
 * 6. Compares cleaned titles (removes C1234 prefix for comparison)
 * 7. Reports all differences found
 * 8. Prompts user for confirmation to update TestRail titles
 * 9. If confirmed, updates TestRail with clean titles (without C prefix)
 * 10. Provides summary of successful/failed updates
 *
 * RATE LIMITING:
 * - 200ms delay between comparison requests (max 300 req/min, safe for 180/min limit)
 * - 500ms delay between update requests (max 120 req/min, extra safety)
 *
 * EXAMPLE USAGE:
 * node updateTitlesTestRail.js "./tests"
 *
 * CONFIGURATION:
 * Create a .env file with the following variables:
 * TESTRAIL_HOST=https://your-instance.testrail.io/
 * TESTRAIL_USERNAME=your-email@example.com
 * TESTRAIL_PASSWORD=your-password-or-api-key
 * TESTRAIL_PROJECT_ID=1
 *
 * EXAMPLE WORKFLOW:
 * File title: "C4836 POST publishers/users/:user_id/remove with non-existent user (400)"
 * TestRail title: "C4836 POST publishers/:slug/users/:user_id/remove with non-existent user (400)"
 * → Difference detected: "/users/" vs "/:slug/users/"
 * → User confirms update
 * → TestRail updated to: "POST publishers/users/:user_id/remove with non-existent user (400)"
 *
 * @param {string} testDirPath - Path to directory containing test files (relative or absolute)
 *
 * @requires axios - For HTTP requests to TestRail API
 * @requires dotenv - For loading environment variables from .env file
 * @requires fs - For file system operations
 * @requires path - For path manipulation
 * @requires readline - For interactive user input
 *
 * @author Leonid Maievskyi
 * @version 2.0
 * @since 2024
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { config } from 'dotenv';

// Load environment variables from .env file
config();
/* eslint-disable */
// Export function to validate and get credentials (used by main and can be mocked in tests)
export function validateEnvironment() {
  const [, , testDirPath] = process.argv;

  if (!testDirPath) {
    console.error('Usage: node updateTitlesTestRail.js <testDirPath>');
    console.error('Example:');
    console.error('  node updateTitlesTestRail.js "./tests"');
    console.error('\nMake sure you have a .env file with the following variables:');
    console.error('  TESTRAIL_HOST=https://your-instance.testrail.io/');
    console.error('  TESTRAIL_USERNAME=your-email@example.com');
    console.error('  TESTRAIL_PASSWORD=your-password-or-api-key');
    console.error('  TESTRAIL_PROJECT_ID=1');
    process.exit(1);
  }

  // Validate environment variables
  const requiredEnvVars = ['TESTRAIL_HOST', 'TESTRAIL_USERNAME', 'TESTRAIL_PASSWORD'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables in .env file:');
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    console.error('\nPlease create a .env file with all required variables.');
    process.exit(1);
  }

  return {
    testDirPath,
    credentials: {
      username: process.env.TESTRAIL_USERNAME,
      password: process.env.TESTRAIL_PASSWORD,
      host: process.env.TESTRAIL_HOST.replace(/\/$/, ''), // Remove trailing slash
    },
    projectId: process.env.TESTRAIL_PROJECT_ID,
  };
}

// Helper function to ask user for confirmation
function askForConfirmation(question, rl) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim() === 'y');
    });
  });
}

// Helper function for API calls
export async function makeApiCall(endpoint, credentials, method = 'GET', data = null) {
  try {
    // Remove any leading slashes and construct the URL according to TestRail's format
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${credentials.host}/index.php?/api/v2/${cleanEndpoint}`;

    // Create base64 encoded auth string
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

    const config = {
      method: method,
      url: url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      timeout: 30000,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
}

// Helper function for API calls with pagination
export async function makeApiCallWithPagination(endpoint, credentials, limit = 250) {
  let offset = 0;
  let allResults = [];

  while (true) {
    // Construct the URL with pagination parameters
    const separator = endpoint.includes('?') ? '&' : '&';
    const paginatedEndpoint = `${endpoint}${separator}limit=${limit}&offset=${offset}`;
    const response = await makeApiCall(paginatedEndpoint, credentials);

    // Handle both array and object responses
    const items = Array.isArray(response) ? response : response.cases || response.projects || [];
    allResults = allResults.concat(items);

    // Check if we've got all items
    if (!response._links?.next || items.length < limit) {
      break;
    }

    offset += limit;
  }

  return allResults;
}

// Update test case title in TestRail
async function updateTestRailCase(caseId, newTitle, credentials) {
  try {
    console.log(`Updating case ${caseId} with title: "${newTitle}"`);

    const updateData = {
      title: newTitle,
    };

    const response = await makeApiCall(`update_case/${caseId}`, credentials, 'POST', updateData);
    console.log(`✅ Successfully updated case ${caseId}`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to update case ${caseId}:`, error.response?.data?.error || error.message);
    return null;
  }
}

// Get TestRail project and suite information
async function getTestRailInfo(credentials, projectId) {
  try {
    console.log('Getting TestRail project information...');

    let project;

    // If projectId is provided, use it directly
    if (projectId) {
      console.log(`Using project ID from environment: ${projectId}`);
      try {
        project = await makeApiCall(`get_project/${projectId}`, credentials);
        console.log(`Found project: ${project.name} (ID: ${project.id})`);
      } catch (error) {
        console.error(`Failed to get project with ID ${projectId}:`, error.message);
        throw new Error(`Project with ID ${projectId} not found or inaccessible.`);
      }
    } else {
      // List all available projects and ask user to specify PROJECT_ID
      console.log('TESTRAIL_PROJECT_ID not specified in .env file.');
      const projects = await makeApiCallWithPagination('get_projects', credentials);

      console.log('\nAvailable projects:');
      projects.forEach((p) => console.log(`- ${p.name} (ID: ${p.id})`));

      throw new Error(
        'Please set TESTRAIL_PROJECT_ID in your .env file with the ID of the project you want to use from the list above.',
      );
    }

    // Get suites for the project
    const suites = await makeApiCallWithPagination(`get_suites/${project.id}`, credentials);

    if (suites.length === 0) {
      console.log('No test suites found in the project.');
    } else {
      console.log(`Found ${suites.length} test suites:`);
      suites.forEach((suite) => console.log(`- ${suite.name} (ID: ${suite.id})`));
    }

    return {
      project_id: project.id,
      suites: suites,
    };
  } catch (error) {
    console.error('Failed to get TestRail information:', error.message);
    if (error.response?.data) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
}

// Get test case from TestRail
async function getTestRailCase(caseId, projectInfo, credentials) {
  try {
    // Try to get the case directly first
    const response = await makeApiCall(`get_case/${caseId}`, credentials);
    return response;
  } catch (error) {
    if (error.response?.status === 400) {
      // If direct access fails, try to find the case in all suites
      console.log(`Searching for case ${caseId} in all suites...`);
      for (const suite of projectInfo.suites) {
        try {
          const cases = await makeApiCallWithPagination(
            `get_cases/${projectInfo.project_id}&suite_id=${suite.id}`,
            credentials,
          );
          const foundCase = cases.find((c) => c.id.toString() === caseId);
          if (foundCase) {
            return foundCase;
          }
        } catch (innerError) {
          console.error(`Error searching in suite ${suite.name}:`, innerError.message);
        }
      }
    }
    console.error(`Error getting TestRail case ${caseId}:`, error.response?.data?.error || error.message);
    return null;
  }
}

// Helper function to clean test case title
export function cleanTestCaseTitle(title, id) {
  return title.replace(new RegExp(`^${id}\\s*`), '').trim();
}

// Get all test files from directory recursively
export function getTestFiles(dir, depth = 0) {
  let files = [];
  const indent = '  '.repeat(depth);
  console.log(`${indent}Scanning directory: ${dir}`);

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        console.log(`${indent}├── Directory: ${item}`);
        files = files.concat(getTestFiles(fullPath, depth + 1));
      } else if (item.endsWith('.test.ts')) {
        console.log(`${indent}├── Test file: ${item}`);
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`${indent}Error reading directory ${dir}:`, error.message);
  }

  return files;
}

// Function to analyze test file
export function analyzeTestFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log('\nAnalyzing test file:', relativePath);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const testCases = new Map();
    const testRegex = /test\(['"]([^'"]+)['"]/g;
    let testMatch;

    while ((testMatch = testRegex.exec(content)) !== null) {
      const testTitle = testMatch[1];
      const testId = testTitle.match(/C\d+/)?.[0];

      if (testId) {
        const cleanTitle = cleanTestCaseTitle(testTitle, testId);
        testCases.set(testId, {
          title: cleanTitle,
          originalTitle: testTitle,
          filePath: relativePath,
        });
        console.log(`  Found test case ${testId}: "${cleanTitle}" (Original: "${testTitle}")`);
      }
    }

    return testCases;
  } catch (error) {
    console.error(`Error analyzing file ${relativePath}:`, error.message);
    return new Map();
  }
}

// Main execution
async function main() {
  let rl;
  try {
    // Validate environment and get configuration
    const { testDirPath, credentials, projectId } = validateEnvironment();

    // Create readline interface for user input
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('Starting title comparison...\n');

    // Get TestRail project information first
    const projectInfo = await getTestRailInfo(credentials, projectId);

    const absoluteTestDirPath = path.resolve(process.cwd(), testDirPath);
    if (!fs.existsSync(absoluteTestDirPath)) {
      console.error('Test directory not found:', absoluteTestDirPath);
      process.exit(1);
    }

    console.log('\nScanning for test files...\n');
    const testFiles = getTestFiles(absoluteTestDirPath);
    console.log(`\nFound ${testFiles.length} test files\n`);

    const allTestCases = new Map();
    for (const file of testFiles) {
      const testCases = analyzeTestFile(file);
      for (const [id, data] of testCases) {
        allTestCases.set(id, data);
      }
    }

    console.log(`\nTotal test cases found in files: ${allTestCases.size}`);
    console.log('\nComparing titles with TestRail...\n');

    const differences = [];
    const errors = [];
    let processedCases = 0;

    for (const [testId, fileData] of allTestCases) {
      const caseNumber = testId.replace('C', '');
      const testRailCase = await getTestRailCase(caseNumber, projectInfo, credentials);

      processedCases++;
      if (processedCases % 10 === 0) {
        console.log(`Progress: ${processedCases}/${allTestCases.size} cases processed`);
      }

      if (testRailCase === null) {
        errors.push({
          id: testId,
          filePath: fileData.filePath,
          fileTitle: fileData.title,
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }

      const cleanTestRailTitle = cleanTestCaseTitle(testRailCase.title, testId);

      if (cleanTestRailTitle !== fileData.title) {
        differences.push({
          id: testId,
          caseNumber: caseNumber,
          filePath: fileData.filePath,
          fileTitle: fileData.title,
          fileOriginalTitle: fileData.originalTitle,
          testRailTitle: testRailCase.title,
          testRailCleanTitle: cleanTestRailTitle,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Output results
    if (differences.length > 0) {
      console.log('\nFound differences in the following test cases:\n');
      differences.forEach((diff) => {
        console.log(`Test Case: ${diff.id}`);
        console.log(`File: ${diff.filePath}`);
        console.log(`File title (original): "${diff.fileOriginalTitle}"`);
        console.log(`File title (cleaned): "${diff.fileTitle}"`);
        console.log(`TestRail title (original): "${diff.testRailTitle}"`);
        console.log(`TestRail title (cleaned): "${diff.testRailCleanTitle}"`);
        console.log('---\n');
      });
      console.log(`Total differences found: ${differences.length}`);

      // Ask user if they want to update TestRail titles
      console.log('\n🔄 Would you like to update TestRail titles to match the file titles?');
      console.log('This will update the following test cases in TestRail:');
      differences.forEach((diff) => {
        console.log(`  - ${diff.id}: "${diff.testRailCleanTitle}" → "${diff.fileTitle}"`);
      });

      const shouldUpdate = await askForConfirmation('\nDo you want to proceed with the updates? (y/n): ', rl);

      if (shouldUpdate) {
        console.log('\n🚀 Starting TestRail updates...\n');
        let successCount = 0;
        let failCount = 0;

        for (const diff of differences) {
          const newTitle = diff.fileTitle;
          const result = await updateTestRailCase(diff.caseNumber, newTitle, credentials);

          if (result) {
            successCount++;
          } else {
            failCount++;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        console.log('\n📊 Update Summary:');
        console.log(`✅ Successfully updated: ${successCount} test cases`);
        console.log(`❌ Failed to update: ${failCount} test cases`);
      } else {
        console.log('\n⏭️  Update cancelled by user.');
      }
    } else {
      console.log('✅ No differences found between file titles and TestRail titles.');
    }

    if (errors.length > 0) {
      console.log('\nFailed to compare the following test cases:\n');
      errors.forEach((error) => {
        console.log(`Test Case: ${error.id}`);
        console.log(`File: ${error.filePath}`);
        console.log(`File title: "${error.fileTitle}"`);
        console.log('---\n');
      });
      console.log(`Total errors: ${errors.length}`);
    }

    console.log('\n🎉 Comparison completed');
    rl.close();
  } catch (error) {
    console.error('Script failed:', error);
    if (rl) {
      rl.close();
    }
    process.exit(1);
  }
}

// Only run main if this script is executed directly (not imported as module)
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const scriptPath = path.resolve(process.argv[1]);

if (__filename === scriptPath) {
  main().catch(console.error);
}
