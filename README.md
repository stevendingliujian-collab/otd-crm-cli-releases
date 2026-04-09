# CRM CLI

OTD CRM Command Line Interface - A powerful CLI tool for managing CRM operations.

## Features

- 🔐 Secure authentication with encrypted token storage
- 📊 Multiple output formats (Table, JSON)
- 🔄 Automatic retry for transient failures
- 📝 Comprehensive audit logging
- 🎯 Multi-profile support
- ✅ Type-safe with TypeScript

## Installation

### For End Users

See [INSTALL.md](./INSTALL.md) for detailed installation guide.

**Quick Install**:

1. Get GitHub Token from https://github.com/settings/tokens (scope: `read:packages`)

2. Configure npm:
   ```bash
   echo "@otd:registry=https://npm.pkg.github.com" >> ~/.npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN" >> ~/.npmrc
   ```

3. Install globally:
   ```bash
   npm install -g @otd/crm-cli
   ```

### For Developers

```bash
git clone https://github.com/stevendingliujian-collab/otd-crm-cli.git
cd otd-crm-cli
npm install
npm run build
npm link
```

## Quick Start

### 1. Login to CRM

```bash
crm auth login
# Interactive prompts for username and password
```

### 2. Verify Login

```bash
crm auth whoami
# Shows current user and token status
```

### 3. 使用命令

```bash
# 搜索客户
crm customer search --keyword 科技

# 搜索线索
crm clue search --keyword 张三

# 转化线索为客户
crm clue convert clue_123 --create-opportunity

# 搜索商机
crm opp search --page 1 --size 20

# 获取帮助
crm --help
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Project Structure

```
crm-cli/
├── src/
│   ├── commands/       # Command implementations
│   ├── core/           # Core modules (auth, client, etc.)
│   ├── schemas/        # Zod schemas
│   ├── types/          # TypeScript types
│   └── constants/      # Constants
├── tests/              # Tests
├── docs/               # Documentation
└── bin/                # Executable
```

## License

MIT

## Author

Martin (CTO Agent)
