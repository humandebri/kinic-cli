// Where: MCP server for Kinic CLI search (mainnet only).
// What: Exposes a single tool (memory.search) over stdio and delegates to kinic-cli.
// Why: Keep MCP thin; identity stays in CLI, no canister storage or auth in MCP.

import { spawn } from 'node:child_process';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

type ToolArgs = {
  memory_id: string;
  query: string;
  identity_mode: 'dfx' | 'ii' | 'anonymous';
  identity?: string;
};

type SearchResult = {
  score: number;
  text: string;
};

type SearchOutput = {
  memory_id: string;
  query: string;
  result_count: number;
  results: SearchResult[];
};

type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

const TOOL_NAME = 'memory.search';
const CLI_COMMAND = 'kinic-cli';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) {
    return false;
  }
  return isNumber(value['score']) && isNonEmptyString(value['text']);
}

function parseToolArgs(value: unknown): ToolArgs {
  if (!isRecord(value)) {
    throw new Error('arguments must be an object');
  }

  const memoryIdValue = value['memory_id'];
  if (!isNonEmptyString(memoryIdValue)) {
    throw new Error('memory_id is required');
  }

  const queryValue = value['query'];
  if (!isNonEmptyString(queryValue)) {
    throw new Error('query is required');
  }

  const identityModeValue = value['identity_mode'];
  if (
    identityModeValue !== 'dfx' &&
    identityModeValue !== 'ii' &&
    identityModeValue !== 'anonymous'
  ) {
    throw new Error('identity_mode must be "dfx", "ii", or "anonymous"');
  }

  const identityValue = value['identity'];
  if (identityModeValue !== 'anonymous' && !isNonEmptyString(identityValue)) {
    throw new Error('identity is required');
  }

  return {
    memory_id: memoryIdValue,
    query: queryValue,
    identity_mode: identityModeValue,
    identity: isNonEmptyString(identityValue) ? identityValue : undefined
  };
}

function parseSearchOutput(raw: string): SearchOutput | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const memoryIdValue = parsed['memory_id'];
  const queryValue = parsed['query'];
  const resultCountValue = parsed['result_count'];
  const resultsValue = parsed['results'];

  if (!isNonEmptyString(memoryIdValue) || !isNonEmptyString(queryValue)) {
    return null;
  }

  if (!Array.isArray(resultsValue) || !resultsValue.every(isSearchResult)) {
    return null;
  }

  const resultCount = isNumber(resultCountValue)
    ? resultCountValue
    : resultsValue.length;

  return {
    memory_id: memoryIdValue,
    query: queryValue,
    result_count: resultCount,
    results: resultsValue
  };
}

function buildCliArgs(args: ToolArgs): string[] {
  const cliArgs = ['--ic'];

  if (args.identity_mode === 'ii') {
    if (!args.identity) {
      throw new Error('identity is required for ii mode');
    }
    cliArgs.push('--ii', '--identity-path', args.identity);
  } else if (args.identity_mode === 'anonymous') {
    cliArgs.push('--anonymous');
  } else {
    if (!args.identity) {
      throw new Error('identity is required for dfx mode');
    }
    cliArgs.push('--identity', args.identity);
  }

  cliArgs.push('search-json', '--memory-id', args.memory_id, '--query', args.query);
  return cliArgs;
}

function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (err: Error) => {
      reject(err);
    });

    child.on('close', (code: number | null) => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        exitCode: code
      });
    });
  });
}

const server = new Server(
  { name: 'kinic-mcp', version: '0.1.0' },
  { capabilities: { tools: { listChanged: true } } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: TOOL_NAME,
        description: 'Search a Kinic memory canister on mainnet via kinic-cli.',
        inputSchema: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', description: 'Target memory canister id.' },
            query: { type: 'string', description: 'Search query text.' },
            identity_mode: {
              type: 'string',
              description: 'Identity source ("dfx", "ii", or "anonymous").',
              enum: ['dfx', 'ii', 'anonymous']
            },
            identity: {
              type: 'string',
              description: 'dfx identity name or identity.json path.'
            }
          },
          required: ['memory_id', 'query', 'identity_mode']
        },
        outputSchema: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', description: 'Target memory canister id.' },
            query: { type: 'string', description: 'Search query text.' },
            result_count: { type: 'number', description: 'Number of matches returned.' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  score: { type: 'number', description: 'Similarity score.' },
                  text: { type: 'string', description: 'Stored text payload.' }
                },
                required: ['score', 'text']
              }
            }
          },
          required: ['memory_id', 'query', 'result_count', 'results']
        }
      }
    ]
  };
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<CallToolResult> => {
    if (request.params.name !== TOOL_NAME) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = parseToolArgs(request.params.arguments);
    const cliArgs = buildCliArgs(args);
    const result = await runCommand(CLI_COMMAND, cliArgs);

    if (result.exitCode !== 0) {
      const stderrText = result.stderr.trim();
      const message = stderrText.length > 0 ? stderrText : 'kinic-cli failed';
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: message
          }
        ]
      };
    }

    const trimmedStdout = result.stdout.trim();
    const structuredOutput = parseSearchOutput(trimmedStdout);
    const outputText = structuredOutput
      ? JSON.stringify(structuredOutput)
      : trimmedStdout;

    return {
      content: [
        {
          type: 'text',
          text: outputText
        }
      ],
      structuredContent: structuredOutput ?? undefined
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
