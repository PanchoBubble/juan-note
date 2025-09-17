#!/usr/bin/env node

// Test script to verify opencode can connect to Juan Note MCP server
import http from "http";
import fs from "fs";

const opencodeConfig = JSON.parse(fs.readFileSync("opencode.json", "utf8"));
const mcpServer = opencodeConfig.mcp["juan-note-mcp-server"];

console.log("Testing opencode integration with Juan Note MCP server...\n");
console.log("MCP Server Config:", JSON.stringify(mcpServer, null, 2));
console.log();

async function testMCPConnection() {
  if (mcpServer.type !== "remote") {
    console.log(
      "❌ MCP server type should be 'remote', found:",
      mcpServer.type
    );
    return;
  }

  if (!mcpServer.url) {
    console.log("❌ MCP server URL is missing");
    return;
  }

  console.log("✅ Config looks valid");
  console.log("🔗 Testing connection to:", mcpServer.url);

  try {
    // Test initialize
    const initResponse = await makeRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "opencode", version: "1.0.0" },
    });
    console.log("✅ Initialize successful");

    // Test tools/list
    const toolsResponse = await makeRequest("tools/list", {});
    console.log("✅ Tools/list successful");
    console.log(
      `📋 Found ${toolsResponse.result.tools.length} tools available`
    );

    // List tool names
    console.log("\nAvailable tools:");
    toolsResponse.result.tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.title} (${tool.name})`);
    });

    console.log("\n🎉 opencode integration test PASSED!");
    console.log("The MCP server is ready for opencode to use.");
  } catch (error) {
    console.log("❌ Connection test failed:", error.message);
  }
}

function makeRequest(method, params) {
  return new Promise((resolve, reject) => {
    const url = new URL(mcpServer.url);
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    });

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, res => {
      let data = "";
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on("error", e => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testMCPConnection().catch(console.error);
