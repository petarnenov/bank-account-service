// =========================
// Imports and Setup
// =========================
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const { tool } = require('ai');
const Account = require('../models/Account');
const Customer = require('../models/Customer');

// =========================
// Tool Definitions
// =========================

const spellCheckerTool = tool({
	type: 'function',
	name: 'spellChecker',
	description: 'Check and correct English spelling and grammar. Use this for any questions about English writing, spelling, or grammar.',
	parameters: {
		type: 'object',
		properties: {
			text: { type: 'string', description: 'The English text to check and correct.' }
		},
		required: ['text']
	},
	execute: async ({ text }) => {
		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			messages: [
				{ role: 'system', content: 'You are a helpful English writing assistant. Correct any spelling or grammar mistakes in the user\'s text, and return the corrected version.' },
				{ role: 'user', content: text }
			],
			max_tokens: 200
		});
		return { corrected: response.choices[0].message.content };
	}
});

// Helper to get all customers for enum options
async function getCustomerOptions() {
	const customers = await Customer.getAllCustomers?.() || [];
	return customers.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName} (${c.id})` }));
}



const getCurrentDateTool = tool({
	type: 'function',
	name: 'getCurrentDate',
	description: 'Get the current date in ISO format (YYYY-MM-DD). Use this for any questions about today\'s date or the current date.',
	parameters: {
		type: 'object',
		properties: {},
	},
	execute: async () => {
		const now = new Date();
		return { date: now.toISOString().slice(0, 10) };
	}
});


const getAccountsByCustomerTool = tool({
	type: 'function',
	name: 'getAccountsByCustomer',
	description: 'Get all accounts for a given customer ID.',
	parameters: {
		type: 'object',
		properties: {
			customerId: { type: 'string', description: 'The customer ID to look up.' }
		},
		required: ['customerId']
	},
	execute: async ({ customerId }) => {
		try {
			const accounts = await Account.getAccountsByCustomerId(customerId);
			if (!accounts || accounts.length === 0) {
				return { error: `No accounts found for customer ID: ${customerId}`, accounts: [] };
			}
			return { accounts, total: accounts.length };
		} catch (error) {
			console.error('Error fetching accounts by customer:', error);
			return { error: `Failed to fetch accounts for customer ${customerId}: ${error.message}`, accounts: [] };
		}
	}
});


const getAllAccountsTool = tool({
	type: 'function',
	name: 'getAllAccounts',
	description: 'Get a list of all bank accounts with their details.',
	parameters: {
		type: 'object',
		properties: {},
	},
	execute: async () => {
		return await Account.getAllAccounts();
	}
});


const getCustomerByAccountTool = tool({
	type: 'function',
	name: 'getCustomerByAccount',
	description: 'Get customer details by account number.',
	parameters: {
		type: 'object',
		properties: {
			accountNumber: { type: 'string', description: 'The account number to look up.' }
		},
		required: ['accountNumber']
	},
	execute: async ({ accountNumber }) => {
		const customerId = await Account.getCustomerIdByAccountNumber(accountNumber);
		if (customerId) {
			return await Customer.getCustomerById(customerId);
		}
		return null;
	}
});


const searchCustomerByNameTool = tool({
	type: 'function',
	name: 'searchCustomerByName',
	description: 'Search for customers by (partial) first or last name.',
	parameters: {
		type: 'object',
		properties: {
			name: { type: 'string', description: 'The (partial) first or last name to search for.' }
		},
		required: ['name']
	},
	execute: async ({ name }) => {
		return await Customer.searchByName(name);
	}
});


// =========================
// Tools Array
// =========================
let tools = [
	spellCheckerTool,
	getCurrentDateTool,
	getAccountsByCustomerTool,
	getAllAccountsTool,
	getCustomerByAccountTool,
	searchCustomerByNameTool
];


// =========================
// Tool Mapping and OpenAI Integration
// =========================
const openAITools = tools.map(t => ({
	type: 'function',
	function: {
		name: t.name,
		description: t.description,
		parameters: t.parameters
	}
}));

const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));

// =========================
// AI Assistant Chat Endpoint
// =========================
router.post('/chat', async (req, res) => {
	const { message, history } = req.body;
	if (!message) return res.status(400).json({ error: 'Message is required' });
	try {
		// System prompt with tool descriptions
		const toolDescriptions = [
			'Available tools:',
			'- spellChecker: Correct English spelling and grammar.',
			'- getCurrentDate: Get today\'s date.',
			'- getAccountsByCustomer: List all accounts for a customer ID (not name).',
			'- getAllAccounts: List all bank accounts.',
			'- getCustomerByAccount: Get customer details by account number.',
			'- searchCustomerByName: Search customers by name to get their customer ID.'
		].join(' ');

		let conversationMessages = [
			{ role: 'system', content: `You are a helpful assistant for a bank account dashboard. ${toolDescriptions} IMPORTANT: Use multiple tools in sequence as needed to fully answer questions. For example, when asked about accounts for a customer by name, first use searchCustomerByName to find the customer ID, then use getAccountsByCustomer with that customer ID.` }
		];

		if (Array.isArray(history)) {
			conversationMessages = conversationMessages.concat(
				history.filter(
					m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
				).map(m => ({ role: m.role, content: m.content }))
			);
		}
		conversationMessages.push({ role: 'user', content: message });

		let toolCallResults = [];
		let maxIterations = 10; // Prevent infinite loops
		let iteration = 0;

		while (iteration < maxIterations) {
			const response = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo-1106',
				messages: conversationMessages,
				tools: openAITools,
				tool_choice: 'auto',
				max_tokens: 150
			});

			const choice = response.choices[0];
			const toolCalls = choice.message.tool_calls;

			if (!toolCalls || toolCalls.length === 0) {
				// No more tool calls needed, return the final response
				const aiMessage = choice.message.content;
				return res.json({
					aiMessage,
					toolResults: toolCallResults.length > 0 ? toolCallResults : undefined
				});
			}

			// Add the assistant's message with tool calls to conversation
			conversationMessages.push({
				role: 'assistant',
				content: choice.message.content,
				tool_calls: toolCalls
			});

			// Execute all tool calls
			for (const toolCall of toolCalls) {
				const toolDef = toolMap[toolCall.function.name];
				if (toolDef && typeof toolDef.execute === 'function') {
					let args = {};
					try {
						args = JSON.parse(toolCall.function.arguments);
					} catch (error) {
						console.error('Error parsing tool arguments:', error);
					}

					const result = await toolDef.execute(args);
					let toolResult = result;

					// Format results consistently
					if (Array.isArray(result)) {
						toolResult = {
							total: result.length,
							data: result
						};
					} else if (result && result.accounts && Array.isArray(result.accounts)) {
						toolResult = {
							total: result.total || result.accounts.length,
							accounts: result.accounts,
							error: result.error
						};
					}

					toolCallResults.push({
						tool: toolCall.function.name,
						args: args,
						result: toolResult
					});

					// Add tool result to conversation
					conversationMessages.push({
						role: 'tool',
						tool_call_id: toolCall.id,
						name: toolCall.function.name,
						content: JSON.stringify(toolResult)
					});
				}
			}

			iteration++;
		}

		// If we reach max iterations, return what we have
		const finalResponse = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			messages: conversationMessages,
			max_tokens: 200
		});

		const finalMessage = finalResponse.choices[0].message.content;
		res.json({ aiMessage: finalMessage, toolResults: toolCallResults });

	} catch (err) {
		console.error('AI Assistant error:', err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
