## Description
The web app appears to reload twice on initial load or during HMR updates.

## Possible Causes
1. **React StrictMode** - Imported in `main.jsx` but not actually used (wrapping `<App />`)
2. **Vite HMR** - Full reloads instead of hot updates
3. **Double mount** - Root component rendering twice

## Files to Investigate
- `MyCircleAppSuite/Web/src/main.jsx` - StrictMode imported but not used
- `MyCircleAppSuite/Web/vite.config.js` - HMR configuration
- Auth/Socket contexts that might cause re-renders

## Expected Behavior
- Single page load on initial visit
- Hot module replacement without full reloads during development