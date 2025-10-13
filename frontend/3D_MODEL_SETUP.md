# 3D Model Setup Instructions

## 📁 File Placement

### Logo Model
- **File Name**: `logo.glb`
- **Location**: `public/models/logo.glb`
- **Animation**: Slow horizontal rotation (left to right)

### Chain Model  
- **File Name**: `chain.glb`
- **Location**: `public/models/chain.glb`
- **Animation**: Moves on hover (rotation + floating)

## 🎯 Recommended Format: **GLB**

**GLB** is the best choice because:
- ✅ Single file (textures embedded)
- ✅ Smaller file size
- ✅ Best web performance
- ✅ Easy lighting integration
- ✅ Wide browser support
- ✅ No external dependencies

## 📐 Model Requirements

### Logo Model
- **Size**: Small to medium complexity
- **Orientation**: Facing forward (positive Z-axis)
- **Scale**: Will be auto-scaled to fit 60x60px container
- **Materials**: Should work well with gold lighting

### Chain Model
- **Size**: Medium complexity
- **Orientation**: Horizontal layout preferred
- **Scale**: Will be auto-scaled to fit 200px height container
- **Materials**: Should work well with royal blue and gold lighting

## 🎨 Lighting Setup

The models will have:
- **Ambient Light**: Soft overall illumination
- **Point Lights**: 
  - Gold accent light (#d4af37)
  - Royal blue fill light (#4a5568)
- **Spot Light**: White directional light for definition

## 🚀 How to Add Your Models

1. **Export your 3D model as GLB format**
2. **Name the files exactly**:
   - Logo: `logo.glb`
   - Chain: `chain.glb`
3. **Place in**: `public/models/` folder
4. **Refresh the page** - models will load automatically

## 🔧 Alternative Formats (if GLB doesn't work)

If you have issues with GLB, try in this order:
1. **GLTF** (.gltf) - Same as GLB but separate files
2. **OBJ** (.obj) - Simple geometry, may need texture files
3. **FBX** (.fbx) - More complex but larger files

## 📝 Model Creation Tips

### For Logo:
- Keep geometry simple (under 10k triangles)
- Use materials that reflect light well
- Center the model at origin (0,0,0)
- Face the model toward positive Z-axis

### For Chain:
- Create interlocking chain links
- Use metallic materials
- Keep under 20k triangles
- Make it horizontally oriented

## 🎭 Current Fallback

If no models are found, the system will:
- Show CSS-based 3D cube for logo
- Show CSS-based chain animation
- All functionality remains intact

## 🔍 Testing Your Models

1. Place your GLB files in `public/models/`
2. Open browser developer tools
3. Check console for any loading errors
4. Models should appear and animate automatically

## 📊 Performance Notes

- Models are lazy-loaded with React Suspense
- Lighting is optimized for performance
- Animations use requestAnimationFrame
- Models are cached after first load