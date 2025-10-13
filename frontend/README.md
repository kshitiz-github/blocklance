# BlockLance - Professional UI Revamp

## Overview
A complete UI overhaul with professional, minimalistic design inspired by Apple/iOS aesthetics. Features a dedicated landing page with 3D models and smooth transitions.

## Key Features

### 🎨 Design System
- **Color Palette**: White, off-white, and grey tones
- **Typography**: SF Pro Display system fonts
- **Layout**: CSS Grid-based responsive design
- **Animations**: Smooth transitions and micro-interactions
- **Rounded Corners**: iOS-style border radius throughout

### 🚀 Landing Page
- **Interactive Text**: Hover effects on each letter
- **3D Models**: 
  - Spinning logo cube (Three.js)
  - Animated blockchain chain
  - Cinematic lighting effects
- **Wallet Connection**: Animated connect flow
- **Smooth Transitions**: Page-to-page animations

### 📱 Main Application
- **Professional Navigation**: Icon-based tabs
- **Card-based Layout**: Clean job cards with hover effects
- **Form Design**: Modern input styling
- **Progress Indicators**: Animated progress bars
- **Responsive Grid**: Mobile-first approach

## 3D Model Support

### Recommended Formats
- **GLTF (.glb)**: Best for web performance
- **OBJ**: Good compatibility
- **FBX**: For complex animations

### Adding Custom 3D Models
1. Place your `.glb` files in `public/models/`
2. Import using `useGLTF` from `@react-three/drei`
3. Add to the Canvas component

Example:
```jsx
import { useGLTF } from '@react-three/drei'

function CustomModel() {
  const { scene } = useGLTF('/models/your-model.glb')
  return <primitive object={scene} />
}
```

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Dependencies Added
- `three`: 3D graphics library
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for React Three Fiber

## File Structure
```
src/
├── LandingPage.jsx          # Landing page component
├── LandingPage.css          # Landing page styles
├── TransitionWrapper.jsx    # Page transition component
├── TransitionWrapper.css    # Transition animations
├── App.jsx                  # Main application
└── App.css                  # Professional theme styles
```

## Customization

### Colors
Update CSS variables in `:root` selector:
```css
:root {
  --primary-white: #ffffff;
  --off-white: #fafafa;
  --accent-blue: #007aff;
  /* ... */
}
```

### 3D Models
- Replace placeholder 3D components in `LandingPage.jsx`
- Adjust lighting and camera positions
- Add your own GLTF models

### Animations
- Modify transition durations in CSS
- Add new keyframe animations
- Customize hover effects

## Performance Notes
- 3D models are lazy-loaded with Suspense
- Animations use CSS transforms for better performance
- Images and assets should be optimized
- Consider using `React.memo` for heavy components

## Browser Support
- Modern browsers with WebGL support
- Mobile Safari 12+
- Chrome 80+
- Firefox 75+
- Edge 80+