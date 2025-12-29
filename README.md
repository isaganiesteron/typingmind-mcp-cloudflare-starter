# TypingMind MCP Cloudflare Starter

A production-ready starter template for building Model Context Protocol (MCP) servers on Cloudflare Workers, specifically designed for TypingMind integration. This template provides SSE (Server-Sent Events) support, proper CORS handling, and a clean architecture for adding custom tools.

## Features

- **SSE Support**: Real-time communication with MCP clients via Server-Sent Events
- **Cloudflare Workers**: Serverless deployment with global edge network
- **TypeScript**: Full type safety and excellent developer experience
- **Modular Tools**: Easy-to-extend tool system with clear separation of concerns
- **Production Ready**: Includes error handling, CORS, health checks, and session management
- **TypingMind Compatible**: Tested and working with TypingMind MCP integration

## Quick Start

### 1. Fork this repository

Click the "Fork" button on GitHub to create your own copy of this template.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/your-mcp-server.git
cd your-mcp-server
```

### 3. Install dependencies

```bash
npm install
```

### 4. Customize your MCP server

Open `src/index.ts` and modify:

**a. Update the CONFIG section** (lines 6-12):

```typescript
const CONFIG = {
	serverName: 'your-mcp-name', // Update with your server name
	serverVersion: '1.0.0', // Your version
	serverDescription: 'Your MCP Server', // Description
	protocolVersion: '2024-11-05', // MCP protocol version
	keepAliveInterval: 30000, // SSE keep-alive interval (ms)
} as const;
```

**b. Update package.json**:

```json
{
	"name": "your-mcp-name",
	"version": "1.0.0",
	...
}
```

**c. Set up wrangler.jsonc**:

First, copy the example file:

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

Then update `wrangler.jsonc`:

```jsonc
{
	"name": "your-mcp-name",  // This becomes your worker's name
	...
}
```

### 5. Add your custom tools

Replace the example tools in the `TOOLS` array (lines 44-88 in `src/index.ts`):

```typescript
const TOOLS: Tool[] = [
	{
		name: 'your_tool_name',
		description: 'What your tool does',
		inputSchema: {
			type: 'object',
			properties: {
				param1: { type: 'string', description: 'First parameter' },
				param2: { type: 'number', description: 'Second parameter' },
			},
			required: ['param1'],
		},
		handler: async (args) => {
			// Your tool logic here
			const result = doSomething(args.param1, args.param2);

			return {
				content: [
					{
						type: 'text',
						text: `Result: ${result}`,
					},
				],
			};
		},
	},
	// Add more tools here...
];
```

### 6. Test locally

```bash
npm run dev
```

Your server will be available at `http://localhost:8787`

Test the health endpoint:

```bash
curl http://localhost:8787
```

### 7. Deploy to Cloudflare Workers

```bash
npm run deploy
```

After deployment, Cloudflare will provide your worker URL (e.g., `https://typingmind-mcp-cloudflare-starter.YOUR_SUBDOMAIN.workers.dev`)

## Using with TypingMind

1. Deploy your MCP server to Cloudflare Workers
2. In TypingMind, go to Settings → MCP Servers
3. Add a new server:
   - **Name**: Your MCP Server
   - **URL**: Your Cloudflare Worker URL (e.g., `https://typingmind-mcp-cloudflare-starter.YOUR_SUBDOMAIN.workers.dev/sse`)
   - **Transport**: SSE
4. Test the connection

## Project Structure

```
.
├── src/
│   └── index.ts          # Main MCP server code
├── test/
│   └── index.spec.ts     # Tests
├── wrangler.jsonc.example  # Example Cloudflare Workers config (copy to wrangler.jsonc)
├── wrangler.jsonc        # Cloudflare Workers config (gitignored, create from example)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## API Endpoints

- `GET /` - Health check endpoint
- `GET /sse` - SSE endpoint for establishing connection
- `POST /sse` - Direct HTTP endpoint (for clients that don't use SSE)
- `POST /sse/message?sessionId={id}` - Message endpoint for active SSE sessions

## Tool Development Guide

### Tool Interface

Each tool must implement the `Tool` interface:

```typescript
interface Tool {
	name: string; // Unique tool identifier
	description: string; // What the tool does
	inputSchema: {
		// JSON Schema for input validation
		type: string;
		properties: Record<string, { type: string; description: string }>;
		required: string[];
	};
	handler: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
}
```

### Tool Handler

The handler function receives the arguments and must return a `ToolResult`:

```typescript
interface ToolResult {
	content: Array<{
		type: string; // Usually 'text'
		text: string; // The response text
	}>;
}
```

### Example Tool with Error Handling

```typescript
{
	name: 'fetch_data',
	description: 'Fetches data from an API',
	inputSchema: {
		type: 'object',
		properties: {
			endpoint: { type: 'string', description: 'API endpoint to call' },
		},
		required: ['endpoint'],
	},
	handler: async (args) => {
		try {
			const response = await fetch(args.endpoint as string);
			const data = await response.json();

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to fetch data: ${error.message}`);
		}
	},
}
```

### Using Cloudflare Workers Features

You can use all Cloudflare Workers features in your tools:

```typescript
// KV Storage (requires binding in wrangler.jsonc)
handler: async (args, env) => {
	await env.MY_KV.put('key', 'value');
	const value = await env.MY_KV.get('key');
	// ...
};

// D1 Database (requires binding in wrangler.jsonc)
handler: async (args, env) => {
	const result = await env.DB.prepare('SELECT * FROM users').all();
	// ...
};

// R2 Storage (requires binding in wrangler.jsonc)
handler: async (args, env) => {
	await env.MY_BUCKET.put('file.txt', 'content');
	// ...
};
```

To use these features, update your `wrangler.jsonc` with the appropriate bindings.

## Advanced Configuration

### Environment Variables

You can add environment variables in two ways:

#### Method 1: Using Wrangler CLI (Recommended for secrets)

For sensitive data like API keys, use Wrangler secrets:

```bash
# Set a secret (will prompt for value)
wrangler secret put API_KEY

# Or set multiple secrets
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

Secrets are encrypted and stored securely by Cloudflare. They are not visible in your code or configuration files.

#### Method 2: Using wrangler.jsonc (For non-sensitive variables)

For non-sensitive configuration values, you can add them directly to `wrangler.jsonc`:

```jsonc
{
	"vars": {
		"ENVIRONMENT": "production",
		"API_TIMEOUT": "5000",
		"MAX_RETRIES": "3"
	}
}
```

**Note**: Copy `wrangler.jsonc.example` to `wrangler.jsonc` and customize it for your local setup. The `wrangler.jsonc` file is gitignored to prevent committing sensitive data.

#### Accessing Environment Variables in Code

Both methods expose variables through the `env` parameter:

```typescript
handler: async (args, env) => {
	const apiKey = env.API_KEY; // From wrangler secret
	const environment = env.ENVIRONMENT; // From wrangler.jsonc vars
	// ...
};
```

### CORS Configuration

By default, CORS allows all origins (`*`). To restrict:

```typescript
const corsHeaders = {
	'Access-Control-Allow-Origin': 'https://yourdomain.com',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Accept',
};
```

### Custom Keep-Alive Interval

Modify in CONFIG section:

```typescript
const CONFIG = {
	keepAliveInterval: 60000, // 60 seconds instead of 30
	...
};
```

## Testing

Run tests:

```bash
npm test
```

The template includes Vitest with Cloudflare Workers test environment.

## Troubleshooting

### "Tool not found" error

- Ensure tool names match exactly (case-sensitive)
- Check that tool is in the TOOLS array
- Verify the tool is being exported in tools/list response

### SSE connection issues

- Check CORS headers if connecting from a web app
- Verify firewall isn't blocking SSE connections
- Test with `curl -N http://localhost:8787/sse` to see raw SSE stream

### Deployment fails

- Ensure you're logged in to Cloudflare: `wrangler login`
- Check that worker name in wrangler.jsonc is unique
- Verify your Cloudflare account has Workers enabled

## Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [TypingMind MCP Guide](https://docs.typingmind.com/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review Cloudflare Workers logs: `wrangler tail`
3. Open an issue on GitHub with:
   - Your wrangler.jsonc (remove sensitive data)
   - Error messages from logs
   - Steps to reproduce

---

Built with the Model Context Protocol (MCP) for TypingMind and other MCP clients.
