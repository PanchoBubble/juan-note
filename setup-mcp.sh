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
echo "The MCP server will:"
echo "  ✅ Monitor API changes in real-time"
echo "  ✅ Validate frontend/backend consistency"
echo "  ✅ Auto-update documentation"
echo "  ✅ Generate validation reports"