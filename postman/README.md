# Postman Collection for MCP Server

This directory contains Postman collections and environments for testing your MCP server locally and in production.

## Files

- **MCP Server.postman_collection.json** - Main Postman collection with all API requests
- **Local.postman_environment.json** - Environment variables for local development
- **Production.postman_environment.json** - Environment variables for production deployment

## Setup

### 1. Import into Postman

1. Open Postman
2. Click **Import** button
3. Select all three files:
   - `MCP Server.postman_collection.json`
   - `Local.postman_environment.json`
   - `Production.postman_environment.json`

### 2. Configure Environment Variables

#### Local Environment

1. Select the **Local** environment from the environment dropdown
2. Update the following variables:
   - `base_url`: `http://localhost:8787` (default, should work if running `npm run dev`)
   - `api_key`: Your API key (if authentication is enabled)
   - `session_id`: Leave empty (will be populated when you establish an SSE connection)

#### Production Environment

1. Select the **Production** environment from the environment dropdown
2. Update the following variables:
   - `base_url`: Your deployed Cloudflare Worker URL (e.g., `https://your-worker.your-subdomain.workers.dev`)
   - `api_key`: Your production API key
   - `session_id`: Leave empty (will be populated when you establish an SSE connection)

## Usage

### Basic Testing Flow

1. **Health Check** - Start with the health check to verify the server is running
2. **Initialize** - Send the initialize message to establish a connection
3. **Initialized Notification** - Send the initialized notification
4. **List Tools** - Get a list of all available tools
5. **Call Tools** - Test individual tools (hello, add, etc.)

### Testing with SSE Sessions

1. First, establish an SSE connection using `curl` or a dedicated SSE client:

   ```bash
   curl -N -H "X-API-Key: your-api-key" http://localhost:8787/sse
   ```

   This will return a session ID in the event stream.

2. Copy the `sessionId` from the SSE response

3. Update the `session_id` variable in your Postman environment

4. Use the requests in the "SSE with Session" folder to test with an active SSE session

### Note on SSE Testing

Postman has limited support for Server-Sent Events (SSE). For full SSE testing:

- Use `curl` with the `-N` flag: `curl -N http://localhost:8787/sse`
- Use a dedicated SSE client or browser
- The collection includes direct POST requests that work without SSE

## Collection Structure

### Health Check

- **GET /** - Verify server is running (no auth required)

### SSE Connection

- **GET /sse** - Establish SSE connection (Note: Postman may not display SSE properly)

### MCP Messages

- **Initialize** - Initialize MCP connection
- **Initialized Notification** - Send initialized notification
- **List Tools** - Get all available tools
- **Call Tool - Hello** - Test the hello tool
- **Call Tool - Add** - Test the add tool with integers
- **Call Tool - Add (Decimals)** - Test the add tool with decimals

### SSE with Session

- Requests that use an active SSE session ID

## Customizing for Your Tools

When you add custom tools to your MCP server:

1. Add a new request in the "MCP Messages" folder
2. Use the "Call Tool" requests as templates
3. Update the `name` and `arguments` in the request body
4. Add test scripts to validate responses

Example for a new tool:

```json
{
	"jsonrpc": "2.0",
	"id": 6,
	"method": "tools/call",
	"params": {
		"name": "your_tool_name",
		"arguments": {
			"param1": "value1",
			"param2": 123
		}
	}
}
```

## API Key Authentication

If API key authentication is enabled:

1. Set the `api_key` variable in your environment
2. The `X-API-Key` header is included in all requests (except health check)
3. To disable the header for testing, uncheck it in the request headers

To use `Authorization` header instead:

1. Change the header name from `X-API-Key` to `Authorization`
2. Set the value to `Bearer your-api-key` or just `your-api-key`

## Troubleshooting

### "API key required" error

- Verify `api_key` is set in your environment
- Check that authentication is enabled in `src/index.ts` (`requireApiKey: true`)
- Ensure the header name matches your configuration (`X-API-Key` or `Authorization`)

### "Tool not found" error

- Verify the tool name matches exactly (case-sensitive)
- Check that the tool is defined in `src/index.ts`
- Use "List Tools" to see available tools

### Connection refused

- Ensure the server is running (`npm run dev` for local)
- Check the `base_url` in your environment
- Verify the port matches (default: 8787)

### SSE not working

- Postman has limited SSE support - use `curl` or a dedicated client
- Use the direct POST requests instead (they work without SSE)
- Check that the session ID is correct if using SSE endpoints
