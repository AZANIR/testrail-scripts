# TestRail Scripts Collection

A comprehensive collection of automation scripts and tools for TestRail integration and management. This repository provides utilities to streamline your TestRail workflow, synchronize test data, and maintain consistency across your testing infrastructure.

## 🚀 Available Tools

### 📋 Test Case Title Synchronization Tool
**Location**: `caseSynchronization/`

A powerful Node.js script that validates and synchronizes test case titles between local test files and TestRail. Ensures consistency across your test suite by comparing titles and providing automated synchronization capabilities.

**Key Features:**
- 🔍 **Smart Detection**: Automatically finds test files with TestRail IDs (C1234 format)
- 🔄 **Bi-directional Sync**: Compares local files with TestRail and updates accordingly  
- 🛡️ **Rate Limiting**: Built-in API rate limiting protection
- 🎯 **Interactive Mode**: User confirmation before making changes
- 📊 **Detailed Reporting**: Comprehensive progress tracking and summaries
- 🔒 **Secure Configuration**: Environment-based credential management

**Quick Start:**
```bash
cd caseSynchronization
npm install
cp env.example .env
# Edit .env with your credentials
node updateTitlesTestRail.js "./path/to/your/tests"
```

[📖 **Detailed Documentation**](./caseSynchronization/README.md)

## 🧪 Framework Support

This collection currently supports and is tested with:

### ✅ Playwright
- **File Format**: `.test.ts` files
- **ID Pattern**: `test('C1234 Test Description', ...)`
- **Integration**: Seamless integration with Playwright test suites
- **Features**: Full TypeScript support

### 🔮 Planned Framework Support
- **Jest**: Coming soon
- **Cypress**: Under consideration  
- **WebdriverIO**: Under consideration
- **Mocha/Chai**: Under consideration

*Want support for your framework?* [Open an issue](../../issues) or contribute!

## 📁 Project Structure

```
testrail-scripts/
├── caseSynchronization/          # Title synchronization tool
│   ├── updateTitlesTestRail.js  # Main script
│   ├── README.md                # Detailed documentation
│   ├── package.json             # Dependencies
│   ├── env.example              # Configuration template
│   └── .gitignore               # Git exclusions
├── README.md                    # This file
└── LICENSE                      # Project license
```

## 🛠️ Prerequisites

- **Node.js** (version 14 or higher)
- **TestRail Account** with API access
- **Test Files** with TestRail case IDs

## 🔧 Global Installation

For system-wide usage, you can clone and set up the tools globally:

```bash
# Clone the repository
git clone https://github.com/your-username/testrail-scripts.git
cd testrail-scripts

# Install dependencies for all tools
cd caseSynchronization && npm install && cd ..

# Add to PATH (optional)
echo 'export PATH="$PATH:$(pwd)/caseSynchronization"' >> ~/.bashrc
source ~/.bashrc
```

## 📖 Documentation

Each tool has its own detailed documentation:

- [**Case Synchronization Tool**](./caseSynchronization/README.md) - Complete guide for title synchronization

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🐛 Bug Reports**: Found an issue? [Create a bug report](../../issues)
2. **💡 Feature Requests**: Have an idea? [Request a feature](../../issues)
3. **🔧 Code Contributions**: 
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Add tests if applicable
   - Submit a pull request

### Development Guidelines

- Follow existing code style and conventions
- Add comprehensive error handling for new features
- Update documentation for any new functionality
- Test with a small subset before running on large test suites
- Ensure security best practices (no hardcoded credentials)

## 🔒 Security Considerations

- **Environment Variables**: Always use `.env` files for credentials
- **API Keys**: Prefer TestRail API keys over passwords
- **Git Ignore**: Never commit `.env` files to version control
- **Rate Limiting**: Respect TestRail API rate limits (built-in protection included)

## 📊 Performance & Scalability

- **Concurrent Processing**: Optimized for large test suites (500+ test cases)
- **Memory Efficient**: Streaming file processing
- **Rate Limited**: Compliant with TestRail API limits
- **Error Recovery**: Robust error handling and recovery mechanisms

## 📝 License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

## 👤 Authors & Contributors

- **Leonid Maievskyi** - *Initial work and Case Synchronization Tool*

See the list of [contributors](../../contributors) who participated in this project.

## 📞 Support

For questions, issues, or support:

1. 📚 **Check Documentation**: Review the tool-specific README files
2. 🔍 **Search Issues**: Look through [existing issues](../../issues)
3. 🆕 **Create New Issue**: [Submit a detailed issue](../../issues/new)
4. 💬 **Discussions**: Join [project discussions](../../discussions)

## 🗺️ Roadmap

### 🎯 Short-term Goals
- [ ] Jest framework support
- [ ] Enhanced error reporting
- [ ] Configuration validation
- [ ] Performance optimizations

### 🚀 Long-term Vision
- [ ] Multi-framework test runner integration
- [ ] TestRail test result synchronization
- [ ] Automated test case creation
- [ ] CI/CD pipeline integration
- [ ] Web-based configuration interface

---

⭐ **Star this repository** if you find it useful!

🔔 **Watch this repository** to stay updated with new tools and features!
