/**
 * ============================================================================
 * CUSTOMIZATION SECTION - Update these values for your MCP server
 * ============================================================================
 */
const CONFIG = {
	serverName: 'typingmind-mcp-cloudflare-starter',
	serverVersion: '1.0.0',
	serverDescription: 'TypingMind MCP Cloudflare Starter',
	protocolVersion: '2024-11-05',
	keepAliveInterval: 30000, // 30 seconds
} as const;

/**
 * ============================================================================
 * TOOL DEFINITIONS - Add your custom tools here
 * ============================================================================
 * Each tool should have:
 * - name: unique identifier for the tool
 * - description: what the tool does
 * - inputSchema: JSON schema defining the input parameters
 * - handler: function that executes the tool logic
 */

interface Tool {
	name: string;
	description: string;
	inputSchema: {
		type: string;
		properties: Record<string, { type: string; description: string }>;
		required: string[];
	};
	handler: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
}

interface ToolResult {
	content: Array<{
		type: string;
		text: string;
	}>;
}

// Define your tools here - these are examples you should replace
const TOOLS: Tool[] = [
	{
		name: 'hello',
		description: 'Says hello to a person',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Name to greet' },
			},
			required: ['name'],
		},
		handler: async (args) => ({
			content: [
				{
					type: 'text',
					text: `Hello, ${args.name}! Your MCP server is working!`,
				},
			],
		}),
	},
	{
		name: 'add',
		description: 'Adds two numbers together',
		inputSchema: {
			type: 'object',
			properties: {
				a: { type: 'number', description: 'First number' },
				b: { type: 'number', description: 'Second number' },
			},
			required: ['a', 'b'],
		},
		handler: async (args) => {
			const a = args.a as number;
			const b = args.b as number;
			return {
				content: [
					{
						type: 'text',
						text: `${a} + ${b} = ${a + b}`,
					},
				],
			};
		},
	},
];

/**
 * ============================================================================
 * FRAMEWORK CODE - You typically don't need to modify below this line
 * ============================================================================
 */

// Session interface for SSE connections
interface Session {
	writer: WritableStreamDefaultWriter<Uint8Array>;
	encoder: TextEncoder;
}

// Store active sessions
const sessions = new Map<string, Session>();

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// CORS headers - modify if you need to restrict origins
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*', // Change to specific domain if needed
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Accept',
		};

		console.log(`${request.method} ${url.pathname}`);

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Health check endpoint
		if (url.pathname === '/' || url.pathname === '') {
			return new Response(
				JSON.stringify({
					name: CONFIG.serverDescription,
					version: CONFIG.serverVersion,
					status: 'running',
					endpoints: {
						sse: '/sse',
					},
				}),
				{
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}

		// SSE endpoint - GET only
		if (url.pathname === '/sse' && request.method === 'GET') {
			const { readable, writable } = new TransformStream();
			const writer = writable.getWriter();
			const encoder = new TextEncoder();

			// Generate session ID
			const sessionId = crypto.randomUUID().replace(/-/g, '');

			// Store session
			sessions.set(sessionId, { writer, encoder });
			console.log('Created SSE session:', sessionId);

			// Send endpoint immediately
			(async () => {
				try {
					await writer.write(encoder.encode(`event: endpoint\ndata: /sse/message?sessionId=${sessionId}\n\n`));

					// Keep-alive ping
					const keepAlive = setInterval(async () => {
						try {
							await writer.write(encoder.encode(': ping\n\n'));
						} catch {
							clearInterval(keepAlive);
							sessions.delete(sessionId);
						}
					}, CONFIG.keepAliveInterval);
				} catch (error) {
					console.error('SSE error:', error);
					sessions.delete(sessionId);
				}
			})();

			return new Response(readable, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive',
					...corsHeaders,
				},
			});
		}

		// Handle POST to /sse (some clients do this for direct HTTP)
		if (url.pathname === '/sse' && request.method === 'POST') {
			console.log('Received POST to /sse - redirecting to message handler');
			// Treat this as a direct message without session
			return handleMessage(request, corsHeaders, null);
		}

		// Messages endpoint with session
		if (url.pathname === '/sse/message' && request.method === 'POST') {
			const sessionId = url.searchParams.get('sessionId');
			console.log('Received POST to /sse/message with sessionId:', sessionId);

			const session = sessions.get(sessionId || '') ?? null;
			return handleMessage(request, corsHeaders, session);
		}

		return new Response('Not Found', {
			status: 404,
			headers: corsHeaders,
		});
	},
};

// Centralized message handler
async function handleMessage(request: Request, corsHeaders: Record<string, string>, session: Session | null) {
	try {
		const body = await request.text();
		console.log('Received body:', body);

		let message;
		try {
			message = JSON.parse(body);
		} catch (parseError) {
			console.error('JSON parse error:', parseError);
			const errorResponse = {
				jsonrpc: '2.0',
				error: {
					code: -32700,
					message: 'Parse error',
				},
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			});
		}

		console.log('Parsed message:', JSON.stringify(message));

		let response: Record<string, unknown> | null = null;

		// Handle initialize
		if (message.method === 'initialize') {
			response = {
				jsonrpc: '2.0',
				id: message.id,
				result: {
					protocolVersion: CONFIG.protocolVersion,
					capabilities: { tools: {} },
					serverInfo: {
						name: CONFIG.serverName,
						version: CONFIG.serverVersion,
					},
				},
			};
		}
		// Handle tools/list
		else if (message.method === 'tools/list') {
			response = {
				jsonrpc: '2.0',
				id: message.id,
				result: {
					tools: TOOLS.map((tool) => ({
						name: tool.name,
						description: tool.description,
						inputSchema: tool.inputSchema,
					})),
				},
			};
		}
		// Handle tools/call
		else if (message.method === 'tools/call') {
			const { name, arguments: args } = message.params;

			// Find the tool by name
			const tool = TOOLS.find((t) => t.name === name);

			if (tool) {
				try {
					const result = await tool.handler(args);
					response = {
						jsonrpc: '2.0',
						id: message.id,
						result,
					};
				} catch (toolError) {
					response = {
						jsonrpc: '2.0',
						id: message.id,
						error: {
							code: -32603,
							message: toolError instanceof Error ? toolError.message : 'Tool execution failed',
						},
					};
				}
			} else {
				response = {
					jsonrpc: '2.0',
					id: message.id,
					error: {
						code: -32601,
						message: `Unknown tool: ${name}`,
					},
				};
			}
		}
		// Handle notifications/initialized
		else if (message.method === 'notifications/initialized') {
			console.log('Received initialized notification');
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		} else {
			response = {
				jsonrpc: '2.0',
				id: message.id || null,
				error: {
					code: -32601,
					message: `Method not found: ${message.method}`,
				},
			};
		}

		console.log('Sending response:', JSON.stringify(response));

		// If we have a session, send via SSE
		if (session && response) {
			try {
				await session.writer.write(session.encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
			} catch (sseError) {
				console.error('SSE write error:', sseError);
			}
		}

		// Always return response directly for HTTP
		if (response) {
			return new Response(JSON.stringify(response), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			});
		}

		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	} catch (error: unknown) {
		console.error('Message handling error:', error);
		const errorResponse = {
			jsonrpc: '2.0',
			error: {
				code: -32603,
				message: error instanceof Error ? error.message : 'Internal error',
			},
		};
		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders,
			},
		});
	}
}
