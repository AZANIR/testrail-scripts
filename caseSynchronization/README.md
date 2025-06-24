# TestRail Test Case Title Synchronization Tool

A powerful Node.js script that validates and synchronizes test case titles between local TypeScript test files and TestRail. This tool helps maintain consistency across your test suite by comparing titles and providing automated synchronization capabilities.

## 🚀 Features

- **Recursive Directory Scanning**: Automatically finds all `.test.ts` files in your project
- **Smart Title Extraction**: Extracts test cases with TestRail IDs (format: C1234)
- **Intelligent Comparison**: Compares cleaned titles (without ID prefix) between local files and TestRail
- **Interactive Updates**: Provides detailed comparison and asks for user confirmation before making changes
- **Rate Limiting**: Built-in protection to stay within TestRail API limits (180 requests/minute)
- **Comprehensive Reporting**: Detailed progress tracking and summary of operations
- **Error Handling**: Robust error handling with clear feedback
- **Environment Configuration**: Secure configuration using `.env` file

## 📋 Prerequisites

- Node.js (version 14 or higher)
- TestRail account with API access
- TypeScript test files with TestRail case IDs

## ⚙️ Installation

1. Clone or download the script to your project directory
2. Install required dependencies:

```bash
npm install axios dotenv
```

3. Set up your environment configuration (see Configuration section below)

## 🔧 Configuration

Create a `.env` file in the same directory as the script with the following variables:

```env
TESTRAIL_HOST=https://your-instance.testrail.io/
TESTRAIL_USERNAME=your-email@example.com
TESTRAIL_PASSWORD=your-password-or-api-key
TESTRAIL_PROJECT_ID=1
```

💡 **Quick Setup**: Copy the `env.example` file to `.env` and fill in your credentials:

```bash
cp env.example .env
# Then edit .env with your actual credentials
```

### Environment Variables Explained

- **TESTRAIL_HOST**: Your TestRail instance URL (include the trailing slash)
- **TESTRAIL_USERNAME**: Your TestRail username (usually your email)
- **TESTRAIL_PASSWORD**: Your TestRail password or API key
- **TESTRAIL_PROJECT_ID**: The ID of your TestRail project (recommended for better performance and reliability)

### How to Find Your Project ID

1. **Method 1**: Run the script without TESTRAIL_PROJECT_ID set - it will list all available projects with their IDs
2. **Method 2**: In TestRail web interface, go to your project and check the URL - it will contain the project ID
3. **Method 3**: Use TestRail API directly: `GET /api/v2/get_projects`

### Security Note

⚠️ **Never commit your `.env` file to version control!** Add it to your `.gitignore` file:

```gitignore
.env
```

## 🎯 Usage

### Basic Usage

```bash
node updateTitlesTestRail.js "./path/to/your/tests"
```

### Example

```bash
node updateTitlesTestRail.js "./src/tests"
```

## 📁 Test File Format

The script expects TypeScript test files with the following format:

```typescript
test('C1234 Your test description here', async () => {
  // Your test code
});

test('C5678 Another test with TestRail ID', () => {
  // Another test
});
```

### Important Notes

- Test case IDs must follow the format `C1234` (C followed by numbers)
- The ID should be at the beginning of the test title
- Only `.test.ts` files are processed

## 🔄 Workflow

The script follows this systematic workflow:

1. **Environment Setup**: Loads configuration from `.env` file
2. **TestRail Connection**: Connects to TestRail API using provided credentials
3. **Project Detection**: Automatically finds the target project using PROJECT_ID or project name search
4. **File Scanning**: Recursively scans the specified directory for `.test.ts` files
5. **Title Extraction**: Extracts test cases matching the pattern: `test('C1234 Test Title', ...)`
6. **TestRail Retrieval**: Fetches corresponding test cases from TestRail
7. **Comparison**: Compares cleaned titles (removes C1234 prefix for comparison)
8. **Reporting**: Shows all differences found between local and TestRail titles
9. **User Confirmation**: Prompts for confirmation before making any updates
10. **Synchronization**: Updates TestRail with clean titles (without C prefix) if confirmed
11. **Summary**: Provides detailed summary of successful and failed operations

## 📊 Example Output

```
Starting title comparison...

Getting TestRail project information...
Using project ID from environment: 1
Found project: Your Project Name (ID: 1)

Scanning for test files...
├── Test file: user.test.ts
├── Test file: publisher.test.ts

Found 15 test files

Total test cases found in files: 147

Comparing titles with TestRail...
Progress: 50/147 cases processed
Progress: 100/147 cases processed
Progress: 147/147 cases processed

Found differences in the following test cases:

Test Case: C4836
File: src/tests/publisher.test.ts
File title (original): "C4836 POST publishers/users/:user_id/remove with non-existent user (400)"
File title (cleaned): "POST publishers/users/:user_id/remove with non-existent user (400)"
TestRail title (original): "C4836 POST publishers/:slug/users/:user_id/remove with non-existent user (400)"
TestRail title (cleaned): "POST publishers/:slug/users/:user_id/remove with non-existent user (400)"
---

Total differences found: 3

🔄 Would you like to update TestRail titles to match the file titles?
This will update the following test cases in TestRail:
  - C4836: "POST publishers/:slug/users/:user_id/remove with non-existent user (400)" → "POST publishers/users/:user_id/remove with non-existent user (400)"

Do you want to proceed with the updates? (y/n): y

🚀 Starting TestRail updates...
✅ Successfully updated case 4836

📊 Update Summary:
✅ Successfully updated: 1 test cases
❌ Failed to update: 0 test cases

🎉 Comparison completed
```

## ⚡ Rate Limiting

The script includes built-in rate limiting to comply with TestRail API limits:

- **Comparison Phase**: 200ms delay between requests (max 300 req/min, safe for 180/min limit)
- **Update Phase**: 500ms delay between requests (max 120 req/min, extra safety margin)

## 🛠️ Troubleshooting

### Common Issues

1. **"Please set TESTRAIL_PROJECT_ID"**: The script requires a specific project ID. Run the script once to see all available projects, then add the correct TESTRAIL_PROJECT_ID to your .env file
2. **"Project not found"**: Ensure your project exists and set the correct TESTRAIL_PROJECT_ID in your .env file
3. **"Authentication failed"**: Check your username and password in the `.env` file
4. **"Test case not found"**: The case ID might not exist in TestRail or might be in a different project
5. **"Rate limit exceeded"**: The script has built-in delays, but you may need to wait if you hit limits elsewhere

### Debug Mode

Add console logs or check the detailed output for specific error messages. The script provides comprehensive error reporting.

## 📈 Performance

- Processes ~300 test cases per minute during comparison
- Processes ~120 test cases per minute during updates
- Memory efficient with streaming file reading
- Handles large test suites (tested with 500+ test cases)

## 🔒 Security Considerations

- Store credentials in `.env` file, never in code
- Use TestRail API keys instead of passwords when possible
- Add `.env` to `.gitignore` to prevent credential exposure
- Consider using environment-specific configurations for different stages

## 🤝 Contributing

When contributing to this script:

1. Follow the existing code style and conventions
2. Add comprehensive error handling for new features
3. Update this README for any new functionality
4. Test with a small subset before running on large test suites

## 📝 License

This tool is provided as-is. Please ensure compliance with your organization's policies regarding API usage and test management.

## 👤 Author

**Leonid Maievskyi**
- Version: 2.0
- Year: 2024

## 🧪 Testing

The tool includes comprehensive unit and integration tests to ensure reliability and maintainability.

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

- **Unit Tests**: Core functionality, API operations, file processing
- **Integration Tests**: Complete workflows, error scenarios, performance
- **Coverage Goals**: 70%+ for functions, lines, branches, and statements

### Test Structure

```
tests/
├── updateTitlesTestRail.test.js    # All tests: unit, integration, and workflow
└── README.md                       # Detailed testing guide
```

For detailed testing information, see [Testing Guide](./tests/README.md).

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console output for specific error messages
3. Ensure your `.env` configuration is correct
4. Verify TestRail connectivity and permissions
5. Run the test suite to verify functionality: `npm test` 