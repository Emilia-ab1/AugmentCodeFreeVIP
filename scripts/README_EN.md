# 🛠️ Cross-Platform Script Tools

This directory contains cross-platform build, installation, and management scripts for the AugmentCode auto login extension.

> **🌐 Language**: [中文](README.md) | [English](README_EN.md)

## 📁 Script List

### 🔨 Build Scripts
- **`build.bat`** - Windows build script
- **`build.sh`** - Linux/macOS build script

### 📦 Installation Scripts
- **`install.bat`** - Windows installation script
- **`install.sh`** - Linux/macOS installation script

### 🗑️ Uninstall Scripts
- **`uninstall.bat`** - Windows uninstall script
- **`uninstall.sh`** - Linux/macOS uninstall script

### 🚀 One-Click Scripts
- **`setup.bat`** - Windows one-click installation script
- **`setup.sh`** - Linux/macOS one-click installation script

### 🌐 Edge-Specific Scripts
- **`install-edge.bat`** - Windows Edge installation script
- **`install-edge.sh`** - Linux/macOS Edge installation script

### 🔍 Development Tools
- **`dev-check.sh`** - Development environment check script (cross-platform)

## 🎯 Usage

### Windows Users

#### Quick Start (Recommended)
```cmd
# One-click installation
scripts\setup.bat

# Edge-specific version
scripts\install-edge.bat
```

#### Step-by-Step
```cmd
# 1. Build program
scripts\build.bat

# 2. Install extension
scripts\install.bat

# 3. Uninstall (if needed)
scripts\uninstall.bat
```

### Linux/macOS Users

#### Quick Start (Recommended)
```bash
# Set execute permissions (first run)
chmod +x scripts/*.sh

# One-click installation
./scripts/setup.sh

# Edge-specific version
./scripts/install-edge.sh
```

#### Step-by-Step
```bash
# 1. Environment check
./scripts/dev-check.sh

# 2. Build program
./scripts/build.sh

# 3. Install extension
./scripts/install.sh

# 4. Uninstall (if needed)
./scripts/uninstall.sh
```

## 🔧 Script Functions

### Build Scripts (build.*)
- ✅ Check Go environment
- ✅ Compile Native Host program
- ✅ Generate platform-specific executables
- ✅ Verify build results

### Installation Scripts (install.*)
- ✅ Check necessary files
- ✅ Update configuration file paths
- ✅ Register Native Host to browser
- ✅ Provide extension installation guidance

### Uninstall Scripts (uninstall.*)
- ✅ Delete Native Host registration
- ✅ Clean executable files
- ✅ Clean temporary files
- ✅ Provide extension removal guidance

### One-Click Scripts (setup.*)
- ✅ Environment check
- ✅ Automatic build
- ✅ Automatic installation
- ✅ Complete usage guidance

### Development Check Script (dev-check.sh)
- ✅ Go environment check
- ✅ Git environment check
- ✅ Node.js environment check (optional)
- ✅ Browser environment check
- ✅ Project file integrity check
- ✅ Go module verification

## 🌍 Platform Support

| Platform | Build | Install | Uninstall | One-Click |
|----------|-------|---------|-----------|-----------|
| Windows 10/11 | ✅ | ✅ | ✅ | ✅ |
| macOS | ✅ | ✅ | ✅ | ✅ |
| Linux | ✅ | ✅ | ✅ | ✅ |

## 📋 System Requirements

### General Requirements
- **Go 1.19+**: For building Native Host program
- **Chrome/Edge**: For running extension

### Windows Specific
- **PowerShell**: For JSON configuration updates
- **Registry Access**: For Native Host registration

### Linux/macOS Specific
- **Bash**: For running shell scripts
- **Basic Unix Tools**: sed, awk, chmod, etc.

## 🚨 Notes

### Permission Requirements
- **Windows**: Recommend running as administrator for best compatibility
- **Linux/macOS**: Requires write permissions to user configuration directories

### File Paths
- All scripts use relative paths, ensure running from project root directory
- Configuration files automatically update to absolute paths

### Browser Support
- Primarily supports Chrome, also compatible with Edge
- Manual extension loading required in browser

## 🔍 Troubleshooting

### Common Issues

1. **Go Environment Not Found**
   ```bash
   # Check Go installation
   go version
   
   # If not installed, visit https://golang.org/dl/
   ```

2. **Insufficient Permissions**
   ```bash
   # Linux/macOS: Set execute permissions
   chmod +x scripts/*.sh
   
   # Windows: Run as administrator
   ```

3. **Native Host Registration Failed**
   - Check if configuration file path is correct
   - Confirm browser is installed
   - Try manual registration

4. **Build Failed**
   - Check if Go version is >=1.19
   - Confirm project files are complete
   - Check network connection (Go module download)

### Debugging Methods
- View detailed information from script output
- Check generated configuration files
- Verify executable files are correctly generated

## 📞 Technical Support

If you encounter issues, please:
1. View error information from script output
2. Run `dev-check.sh` to check environment
3. Submit GitHub Issue with error logs
4. Contact technical support via WeChat

---

**💡 Tip**: Recommend using one-click scripts `setup.*` for first-time installation, which automatically complete all necessary steps.
