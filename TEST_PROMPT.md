# TypingMind MCP Cloudflare Starter - Test Prompts

Use these prompts in TypingMind to verify your MCP server is working correctly. Test them in order, or pick specific ones to verify particular functionality.

## Test Prompts

### 1. Health Check

**Prompt:** "Check the health status of the MCP server and verify the connection."

**Expected:** Should return server status, version, and available endpoints from the health check endpoint.

---

### 2. Hello Tool

**Prompt:** "Say hello to me using the hello tool. Use my name in the request."

**Expected:** Should call `hello` tool with a name parameter and return a greeting message confirming the MCP server is working.

---

### 3. Add Tool

**Prompt:** "Add the numbers 15 and 27 together using the add tool."

**Expected:** Should call `add` tool with parameters a=15 and b=27, returning the result "15 + 27 = 42".

---

### 4. Add Tool with Different Numbers

**Prompt:** "Calculate the sum of 123.5 and 456.7 using the add tool."

**Expected:** Should call `add` tool with decimal numbers and return the correct sum.

---

## Quick Verification Checklist

After running all prompts, verify:

- [ ] All prompts execute without errors
- [ ] Responses are formatted clearly (not raw JSON)
- [ ] Tool names are being called correctly
- [ ] Required parameters are being passed correctly
- [ ] Error handling works for invalid inputs (missing parameters, wrong types, etc.)
- [ ] Health check endpoint returns proper server status
- [ ] API key authentication works (if enabled)

## Tips

1. **Start Simple**: Run test #1 (health check) first to verify basic connectivity
2. **Check Logs**: If something fails, check Cloudflare Workers logs with `wrangler tail`
3. **API Key**: If authentication is enabled, ensure your API key is configured in TypingMind
4. **Parameter Types**: Verify that tools handle different parameter types correctly (strings, numbers, etc.)
5. **Error Cases**: Test with invalid inputs to ensure proper error handling

## Expected Response Format

All tools should return human-readable text with:

- Clear, formatted output
- Proper handling of different data types
- Helpful error messages when inputs are invalid
- No raw JSON or error stacks in user-facing responses

If you see raw JSON or error stacks, there may be an issue with the tool response formatting.

## Tool Coverage Summary

This test suite covers the example tools in the starter template:

**Example Tools (2/2):**
- ✅ `hello` (Test #2)
- ✅ `add` (Tests #3, #4)

**System:**
- ✅ Health check endpoint (Test #1)

**Total Coverage: 2/2 example tools tested** ✅

---

## Adding Your Own Test Prompts

When you add custom tools to your MCP server, add test prompts following this format:

### N. Your Tool Name

**Prompt:** "Describe what the user should ask to test this tool."

**Expected:** Should call `your_tool_name` with specific parameters and return expected results.

---

Replace the example tools above with test prompts for your actual tools as you develop your MCP server.

