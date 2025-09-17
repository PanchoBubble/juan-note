#!/usr/bin/env node

// Test script to verify MCP server JSON-RPC compliance
import http from "http";

const serverUrl = "http://localhost:27182";

async function testMCPCompliance() {
  console.log("Testing MCP server compliance...\n");

  // Test 1: tools/list
  console.log("1. Testing tools/list...");
  try {
    const toolsResponse = await makeRequest("tools/list", {});
    console.log("✅ tools/list response received");
    console.log("Response structure:", JSON.stringify(toolsResponse, null, 2));

    // Validate tools/list response format
    if (!toolsResponse.jsonrpc || toolsResponse.jsonrpc !== "2.0") {
      console.log("❌ Missing or invalid jsonrpc field");
    } else {
      console.log("✅ Valid jsonrpc field");
    }

    if (!toolsResponse.result || !toolsResponse.result.tools) {
      console.log("❌ Missing result.tools array");
    } else {
      console.log(`✅ Found ${toolsResponse.result.tools.length} tools`);

      // Check each tool for required fields
      toolsResponse.result.tools.forEach((tool, index) => {
        console.log(`\nTool ${index + 1}: ${tool.name}`);
        if (!tool.name) console.log("  ❌ Missing name");
        else console.log("  ✅ Has name");

        if (!tool.title)
          console.log("  ❌ Missing title (required by MCP standard)");
        else console.log("  ✅ Has title");

        if (!tool.description) console.log("  ❌ Missing description");
        else console.log("  ✅ Has description");

        if (!tool.inputSchema) console.log("  ❌ Missing inputSchema");
        else console.log("  ✅ Has inputSchema");
      });
    }
  } catch (error) {
    console.log("❌ tools/list failed:", error.message);
  }

  // Test 2: Check if initialize method is supported
  console.log("\n2. Testing initialize method...");
  try {
    const initResponse = await makeRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    });
    console.log("✅ initialize response received");
    console.log("Response:", JSON.stringify(initResponse, null, 2));
  } catch (error) {
    console.log("❌ initialize failed:", error.message);
  }

  // Test 3: Try a tool call
  console.log("\n3. Testing tool call (create_note)...");
  try {
    const toolResponse = await makeRequest("tools/call", {
      name: "create_note",
      arguments: {
        title: "Test Note",
        content: "This is a test note",
      },
    });
    console.log("✅ tools/call response received");
    console.log("Response structure:", JSON.stringify(toolResponse, null, 2));
  } catch (error) {
    console.log("❌ tools/call failed:", error.message);
  }
}

function makeRequest(method, params) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    });

    const options = {
      hostname: "localhost",
      port: 27182,
      path: "/",
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
testMCPCompliance().catch(console.error);
