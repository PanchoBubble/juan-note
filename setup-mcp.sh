#!/bin/bash

echo "🚀 Setting up Juan Note MCP Server..."

# Install MCP server dependencies
echo "📦 Installing MCP server dependencies..."
cd mcp-server
npm install

# Build the MCP server
echo "🔧 Building MCP server..."
npm run build

echo "✅ MCP Server setup complete!"
echo ""
echo "To start the MCP server:"
echo "  npm run mcp"
echo ""
echo "Or in the mcp-server directory:"
echo "  npm run dev    # Development mode with hot reload"
echo "  npm start      # Production mode"
echo ""
echo "The MCP server provides:"
echo "  ✅ On-demand API validation tools"
echo "  ✅ Frontend/backend consistency checking"
echo "  ✅ Automated documentation updates"
echo "  ✅ API validation reports"
echo ""
echo "Integration with opencode:"
echo "  1. Copy opencode.json.example to opencode.json"
echo "  2. Or use the Juan Note app to auto-configure"
echo "  3. Use MCP tools in opencode for API validation"