#!/bin/bash

# Script to generate all required icon sizes for Tauri app
# Usage: ./generate-icons.sh your-icon.png

if [ $# -eq 0 ]; then
    echo "Usage: $0 <source-image.png>"
    echo "Source image should be high resolution (512x512 or larger)"
    exit 1
fi

SOURCE_IMAGE="$1"
ICONS_DIR="src-tauri/icons"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image '$SOURCE_IMAGE' not found"
    exit 1
fi

echo "Generating icons from $SOURCE_IMAGE..."

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Generate PNG icons
magick "$SOURCE_IMAGE" -resize 32x32 "$ICONS_DIR/32x32.png"
magick "$SOURCE_IMAGE" -resize 128x128 "$ICONS_DIR/128x128.png"
magick "$SOURCE_IMAGE" -resize 256x256 "$ICONS_DIR/128x128@2x.png"
magick "$SOURCE_IMAGE" -resize 512x512 "$ICONS_DIR/icon.png"

# Generate Windows Store logos
magick "$SOURCE_IMAGE" -resize 30x30 "$ICONS_DIR/Square30x30Logo.png"
magick "$SOURCE_IMAGE" -resize 44x44 "$ICONS_DIR/Square44x44Logo.png"
magick "$SOURCE_IMAGE" -resize 71x71 "$ICONS_DIR/Square71x71Logo.png"
magick "$SOURCE_IMAGE" -resize 89x89 "$ICONS_DIR/Square89x89Logo.png"
magick "$SOURCE_IMAGE" -resize 107x107 "$ICONS_DIR/Square107x107Logo.png"
magick "$SOURCE_IMAGE" -resize 142x142 "$ICONS_DIR/Square142x142Logo.png"
magick "$SOURCE_IMAGE" -resize 150x150 "$ICONS_DIR/Square150x150Logo.png"
magick "$SOURCE_IMAGE" -resize 284x284 "$ICONS_DIR/Square284x284Logo.png"
magick "$SOURCE_IMAGE" -resize 310x310 "$ICONS_DIR/Square310x310Logo.png"
magick "$SOURCE_IMAGE" -resize 50x50 "$ICONS_DIR/StoreLogo.png"

# Generate ICO file (Windows)
magick "$SOURCE_IMAGE" -resize 256x256 \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    \( -clone 0 -resize 64x64 \) \
    \( -clone 0 -resize 128x128 \) \
    \( -clone 0 -resize 256x256 \) \
    -delete 0 "$ICONS_DIR/icon.ico"

# Generate ICNS file (macOS) - requires iconutil on macOS
if command -v iconutil &> /dev/null; then
    ICONSET_DIR="$ICONS_DIR/icon.iconset"
    mkdir -p "$ICONSET_DIR"
    
    magick "$SOURCE_IMAGE" -resize 16x16 "$ICONSET_DIR/icon_16x16.png"
    magick "$SOURCE_IMAGE" -resize 32x32 "$ICONSET_DIR/icon_16x16@2x.png"
    magick "$SOURCE_IMAGE" -resize 32x32 "$ICONSET_DIR/icon_32x32.png"
    magick "$SOURCE_IMAGE" -resize 64x64 "$ICONSET_DIR/icon_32x32@2x.png"
    magick "$SOURCE_IMAGE" -resize 128x128 "$ICONSET_DIR/icon_128x128.png"
    magick "$SOURCE_IMAGE" -resize 256x256 "$ICONSET_DIR/icon_128x128@2x.png"
    magick "$SOURCE_IMAGE" -resize 256x256 "$ICONSET_DIR/icon_256x256.png"
    magick "$SOURCE_IMAGE" -resize 512x512 "$ICONSET_DIR/icon_256x256@2x.png"
    magick "$SOURCE_IMAGE" -resize 512x512 "$ICONSET_DIR/icon_512x512.png"
    magick "$SOURCE_IMAGE" -resize 1024x1024 "$ICONSET_DIR/icon_512x512@2x.png"
    
    iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"
    rm -rf "$ICONSET_DIR"
fi

echo "Icons generated successfully in $ICONS_DIR/"
echo "To use these icons, save your image as a PNG file and run:"
echo "./generate-icons.sh your-image.png"