# MyCircle Mobile - OTA Update Configuration Guide

## Current State Analysis

### BEFORE THIS UPDATE:
- **No OTA support** - Users must manually update from Play Store/App Store
- No CodePush or similar service configured
- No update mechanism in App.tsx
- JS bundle is bundled into APK, requiring full app rebuild for every update

### AFTER THIS UPDATE:
- **CodePush enabled** - Over-The-Air JavaScript bundle updates
- Users receive updates automatically without visiting app stores
- Staged rollouts supported (Staging → Production)
- Rollback capability available

---

## What is OTA (Over-The-Air) Updates?

OTA updates allow you to push JavaScript code changes directly to users' devices without requiring them to download a new version from the app store.

### Supported Updates:
- JavaScript bundle updates
- JavaScript business logic changes
- UI/UX changes
- Bug fixes
- Performance improvements

### NOT Supported via OTA:
- Native code changes (requires app rebuild)
- New native dependencies
- Changes to Android manifest
- iOS native module changes
- Changes requiring new permissions

---

## Setup Instructions

### 1. Install Microsoft App Center CLI

```bash
npm install -g appcenter-cli
```

### 2. Login to App Center

```bash
appcenter login
```

### 3. Create Your App in App Center

1. Go to https://appcenter.ms
2. Create a new app:
   - Organization: Your organization name
   - Name: MyCircleMobileBare
   - OS: Android / iOS
   - Platform: React Native

### 4. Get Deployment Keys

Navigate to your app in App Center:
- Go to **Distribute** → **CodePush**
- Click on your deployment (Staging/Production)
- Copy the **Deployment Key**

### 5. Update Configuration Files

#### android/app/src/main/res/values/strings.xml
Replace placeholder keys with actual keys:

```xml
<string name="CodePushDeploymentKey_Staging">abc123-staging-key-xyz</string>
<string name="CodePushDeploymentKey_Production">xyz789-production-key-abc</string>
```

#### Mobile/App.tsx
Replace deployment key placeholders:

```typescript
const result = await codePush.sync({
    deploymentKey: __DEV__ 
        ? 'YOUR_DEV_DEPLOYMENT_KEY' 
        : 'YOUR_PROD_DEPLOYMENT_KEY',
    // ...
});
```

### 6. Install CodePush Package

```bash
cd Mobile
npm install react-native-code-push@latest
```

---

## Deployment Workflows

### Development
- Debug builds use bundled JS (no CodePush)
- Test updates locally before releasing

### Staging Deployment (Pre-production)
```bash
# Build JS bundle and deploy to Staging
npm run codepush:android:staging

# Monitor deployment in App Center dashboard
# Test on multiple devices before production
```

### Production Deployment
```bash
# After staging tests pass, deploy to production
npm run codepush:android:production
```

### iOS Deployment
```bash
npm run codepush:ios:staging
npm run codepush:ios:production
```

---

## Update Strategies

### 1. Automatic Update (Recommended)
```typescript
codePush.sync({
    installMode: codePush.InstallMode.ON_NEXT_RESTART,
    // User gets update on next app open
});
```

### 2. Mandatory Update (Critical fixes)
```typescript
codePush.sync({
    installMode: codePush.InstallMode.IMMEDIATE,
    mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
    updateDialog: {
        mandatoryUpdateMessage: 'A critical update is required.',
        mandatoryContinueButtonLabel: 'Update Now'
    }
});
```

### 3. Background Update
```typescript
codePush.sync({
    installMode: codePush.InstallMode.ON_NEXT_RESUME,
    // Update downloads in background, applies when app resumes
});
```

### 4. Staged Rollout
```typescript
codePush.sync({
    installMode: codePush.InstallMode.ON_NEXT_RESTART,
    mandatoryInstallMode: codePush.InstallMode.ON_NEXT_RESTART,
    // 10% of users get update first
    // Monitor crash rates before full rollout
});
```

---

## Monitoring & Rollback

### View Deployment Status
```bash
# List all deployments
appcenter codepush deployment list -a YourOrg/MyCircleMobileBare

# View deployment history
appcenter codepush deployment history -a YourOrg/MyCircleMobileBare -d Production
```

### Rollback Previous Release
```bash
# Rollback to previous release
appcenter codepush rollback -a YourOrg/MyCircleMobileBare -d Production

# Rollback to specific release
appcenter codepush rollback -a YourOrg/MyCircleMobileBare -d Production -r <release-label>
```

### Clear All Updates
```bash
# Clear all updates (force users to get latest from store)
appcenter codepush clear -a YourOrg/MyCircleMobileBare -d Production
```

---

## App Center Dashboard Features

1. **Analytics Dashboard**
   - Active users per release
   - Crash rates
   - Update adoption rates

2. **Targeting**
   - Deploy to specific device groups
   - Version-based targeting
   - Rollout percentage control

3. **Notifications**
   - Email alerts on deployment
   - Crash rate thresholds

---

## Testing Checklist

Before production deployment:

- [ ] Test on Android emulator
- [ ] Test on Android physical devices (multiple versions)
- [ ] Test on iOS simulator
- [ ] Test on iOS physical devices
- [ ] Test update flow (download → install → restart)
- [ ] Test mandatory update flow
- [ ] Test rollback functionality
- [ ] Verify no native code changes needed
- [ ] Check release size (should be < 50MB for fast downloads)

---

## Troubleshooting

### Update Not Being Detected
```bash
# Clear local cache
appcenter codepush clear -a YourOrg/MyCircleMobileBare

# Check release is active
appcenter codepush deployment list -a YourOrg/MyCircleMobileBare
```

### Build Fails with CodePush
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run build:android:debug
```

### App Stuck in Update Loop
- Check network connectivity
- Verify deployment key matches environment
- Clear app cache from device settings

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Updates

on:
  push:
    branches: [main]

jobs:
  deploy-android-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: cd Mobile && npm install
        
      - name: Deploy to Staging
        env:
          APPACENTER_ACCESS_TOKEN: ${{ secrets.APPACENTER_ACCESS_TOKEN }}
        run: |
          npm run codepush:android:staging
```

### Environment Variables
Add to GitHub repository secrets:
- `APPACENTER_ACCESS_TOKEN` - Your App Center API token

---

## Security Considerations

1. **Deployment Keys**
   - Never commit real keys to git
   - Use environment variables in CI/CD
   - Rotate keys periodically

2. **Code Signing**
   - Release builds must be signed
   - Use separate signing keys for staging/production

3. **Access Control**
   - Limit who can deploy to production
   - Use App Center roles and permissions

---

## Comparison: Manual vs OTA Updates

| Aspect | Manual (Before) | OTA (After) |
|--------|----------------|-------------|
| Update Speed | 1-7 days (store approval) | Minutes |
| User Action | Must visit app store | Automatic |
| Rollback | Difficult | One-click |
| Staged Rollout | Not possible | Built-in |
| Cost | Store fees may apply | Free |
| Analytics | Basic store stats | Detailed metrics |
| User Experience | Poor (user friction) | Excellent |

---

## Recommendations

1. **Start with Staging**
   - Always test on staging first
   - Deploy to 10% of users initially
   - Monitor for 24-48 hours

2. **Set Up Alerts**
   - Crash rate threshold: 2%
   - Set up Slack/email notifications

3. **Documentation**
   - Document all deployments
   - Keep changelog updated

4. **Regular Maintenance**
   - Weekly deployment of accumulated fixes
   - Monthly security updates

---

## Next Steps

1. [ ] Create App Center account
2. [ ] Set up your app in App Center
3. [ ] Get deployment keys
4. [ ] Update configuration files
5. [ ] Test on staging
6. [ ] Deploy to production

---

## Support

- App Center Documentation: https://docs.microsoft.com/en-us/appcenter/distribution/codepush/
- CodePush GitHub: https://github.com/microsoft/react-native-code-push
- MyCircle Issue Tracker: Create issue for deployment problems
