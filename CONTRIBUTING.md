# 贡献指南 / Contributing Guide

[简体中文](#简体中文) | [English](#english)

---

## 简体中文

感谢你对爪爪手账项目的关注！我们欢迎任何形式的贡献。

### 如何贡献

#### 报告 Bug

如果你发现了 Bug，请通过 [GitHub Issues](https://github.com/your-username/petlife-miniprogram/issues) 提交，并包含以下信息：

- Bug 的详细描述
- 复现步骤
- 预期行为
- 实际行为
- 截图（如果适用）
- 环境信息（微信开发者工具版本、基础库版本等）

#### 提出新功能

如果你有新功能的想法，欢迎通过 Issues 提出。请描述：

- 功能的用途和价值
- 预期的实现方式
- 可能的替代方案

#### 提交代码

1. **Fork 项目**

   点击页面右上角的 "Fork" 按钮

2. **克隆你的 Fork**

   ```bash
   git clone https://github.com/your-username/petlife-miniprogram.git
   cd petlife-miniprogram
   ```

3. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **进行修改**

   - 遵循项目的代码风格
   - 添加必要的注释
   - 确保代码可以正常运行

5. **提交改动**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   提交信息格式建议：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建或辅助工具的变动

6. **推送到你的 Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**

   在 GitHub 上打开你的 Fork，点击 "New Pull Request" 按钮

### 代码规范

- 使用 2 空格缩进
- 变量和函数使用驼峰命名法
- 为复杂逻辑添加注释
- 保持代码简洁易读

### 开发环境

- 微信开发者工具 1.06.0 或更高版本
- Node.js 14.0 或更高版本（用于云函数开发）

### 测试

在提交 PR 之前，请确保：

- 代码可以正常编译
- 所有功能正常工作
- 没有引入新的 Bug

---

## English

Thank you for your interest in the PetLife project! We welcome contributions of all kinds.

### How to Contribute

#### Report Bugs

If you find a bug, please submit it via [GitHub Issues](https://github.com/your-username/petlife-miniprogram/issues) with:

- Detailed bug description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment info (WeChat DevTools version, base library version, etc.)

#### Suggest Features

If you have ideas for new features, feel free to propose them via Issues. Please describe:

- Purpose and value of the feature
- Expected implementation approach
- Possible alternatives

#### Submit Code

1. **Fork the project**

   Click the "Fork" button in the top right corner

2. **Clone your fork**

   ```bash
   git clone https://github.com/your-username/petlife-miniprogram.git
   cd petlife-miniprogram
   ```

3. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make changes**

   - Follow the project's code style
   - Add necessary comments
   - Ensure code runs properly

5. **Commit changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Commit message format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation update
   - `style:` Code formatting
   - `refactor:` Code refactoring
   - `test:` Testing related
   - `chore:` Build or tooling changes

6. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**

   Open your fork on GitHub and click "New Pull Request"

### Code Standards

- Use 2-space indentation
- Use camelCase for variables and functions
- Add comments for complex logic
- Keep code clean and readable

### Development Environment

- WeChat DevTools 1.06.0 or higher
- Node.js 14.0 or higher (for cloud function development)

### Testing

Before submitting a PR, ensure:

- Code compiles successfully
- All features work properly
- No new bugs introduced

---

Thank you for contributing! 🎉
