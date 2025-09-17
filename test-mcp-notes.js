#!/usr/bin/env node

// Simple test script to check MCP server connection to Juan Note
import fetch from "node-fetch";

async function testNotesAPI() {
  try {
    console.log("Testing Juan Note HTTP API...");

    const response = await fetch("http://localhost:3001/notes");
    const data = await response.json();

    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      console.log(`✅ Found ${data.data.length} notes`);
      data.data.forEach(note => {
        console.log(`  - ${note.title} (ID: ${note.id})`);
      });
    } else {
      console.log("❌ Failed to get notes:", data.error);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testNotesAPI();
