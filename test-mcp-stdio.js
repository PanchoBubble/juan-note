#!/usr/bin/env node

import { spawn } from "child_process";

// Test the MCP server by sending it a get_all_notes request
async function testMCPServer() {
  console.log("Testing MCP server...");

  const mcpServer = spawn("node", ["mcp-server/dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  let responseData = "";

  mcpServer.stdout.on("data", data => {
    responseData += data.toString();
    console.log("MCP Response:", data.toString());
  });

  mcpServer.stderr.on("data", data => {
    console.log("MCP Error:", data.toString());
  });

  // Send initialize request first
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    },
  };

  console.log("Sending initialize request...");
  mcpServer.stdin.write(JSON.stringify(initRequest) + "\n");

  // Wait a bit for initialization
  setTimeout(() => {
    // Send tools/list request
    const listToolsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    };

    console.log("Sending list tools request...");
    mcpServer.stdin.write(JSON.stringify(listToolsRequest) + "\n");

    setTimeout(() => {
      // Send get_all_notes tool call
      const callToolRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "get_all_notes",
          arguments: {},
        },
      };

      console.log("Sending get_all_notes tool call...");
      mcpServer.stdin.write(JSON.stringify(callToolRequest) + "\n");

      setTimeout(() => {
        mcpServer.kill();
        console.log("Test completed");
      }, 2000);
    }, 1000);
  }, 1000);
}

testMCPServer().catch(console.error);
