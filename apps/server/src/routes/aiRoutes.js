const express = require('express');
const router = express.Router();

const { OpenAI } = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const { tool } = require('ai');

const Account = require('../models/Account');

// Define OpenAI tool (function) schema
const Customer = require('../models/Customer');

// Helper to get all customers for enum options
async function getCustomerOptions() {
	const customers = await Customer.getAllCustomers?.() || [];
	return customers.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName} (${c.id})` }));
}

let tools = [
	tool({
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
			return await Account.getAccountsByCustomerId(customerId);
		}
	}),
	tool({
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
	}),
	tool({
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
	}),
	tool({
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
	})
];

// Map tool names to tool objects for easy lookup

// Prepare OpenAI-compatible tool definitions (strip execute, wrap in {type, function})
const openAITools = tools.map(t => ({
	type: 'function',
	function: {
		name: t.name,
		description: t.description,
		parameters: t.parameters
	}
}));

const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));

// Patch the customer_id enum before each request
router.post('/chat', async (req, res) => {
	// No need to patch customer_id enum, create_new_account tool removed
	const { message, history } = req.body;
	if (!message) return res.status(400).json({ error: 'Message is required' });
	try {
		// Step 1: Send user message to OpenAI with tool definitions
		// Compose the message history for OpenAI
		let messages = [
			{ role: 'system', content: 'You are a helpful assistant for a bank account dashboard.' }
		];
		if (Array.isArray(history)) {
			// Only allow roles 'user' and 'assistant' and valid content
			messages = messages.concat(
				history.filter(
					m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
				).map(m => ({ role: m.role, content: m.content }))
			);
		}
		messages.push({ role: 'user', content: message });
		const initial = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			messages,
			tools: openAITools,
			tool_choice: 'auto',
			max_tokens: 150
		});
		console.log('OpenAI initial response:', JSON.stringify(initial, null, 2));
		const choice = initial.choices[0];
		const toolCall = choice.message.tool_calls && choice.message.tool_calls[0];

		if (toolCall && toolCall.function) {
			const toolDef = toolMap[toolCall.function.name];
			if (toolDef && typeof toolDef.execute === 'function') {
				let args = {};
				try { args = JSON.parse(toolCall.function.arguments); } catch { }
				const result = await toolDef.execute(args);
				// Prepare a summary for the AI if needed
				let toolResult = result;
				if (Array.isArray(result)) {
					// For list results, provide a preview and total
					toolResult = {
						total: result.length,
						preview: result
					};
				}
				const assistantMsg = {
					role: 'assistant',
					content: null,
					tool_calls: choice.message.tool_calls
				};
				let followupMessages = [
					{ role: 'system', content: 'You are a helpful assistant for a bank account dashboard.' }
				];
				if (Array.isArray(history)) {
					followupMessages = followupMessages.concat(
						history.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content }))
					);
				}
				followupMessages.push(
					{ role: 'user', content: message },
					assistantMsg,
					{
						role: 'tool',
						tool_call_id: toolCall.id,
						name: toolCall.function.name,
						content: JSON.stringify(toolResult)
					}
				);
				const followup = await openai.chat.completions.create({
					model: 'gpt-3.5-turbo-1106',
					messages: followupMessages,
					max_tokens: 200
				});
				const aiMessage = followup.choices[0].message.content;
				res.json({ aiMessage, result: toolResult });
				return;
			}
		} else {
			// No tool call, send the full chat history to OpenAI for a direct response
			let directMessages = [
				{ role: 'system', content: 'You are a helpful assistant for a bank account dashboard.' }
			];
			if (Array.isArray(history)) {
				directMessages = directMessages.concat(
					history.filter(
						m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
					).map(m => ({ role: m.role, content: m.content }))
				);
			}
			directMessages.push({ role: 'user', content: message });
			const direct = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo-1106',
				messages: directMessages,
				max_tokens: 200
			});
			const aiMessage = direct.choices[0].message.content;
			res.json({ aiMessage });
		}
	} catch (err) {
		console.error('AI Assistant error:', err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
