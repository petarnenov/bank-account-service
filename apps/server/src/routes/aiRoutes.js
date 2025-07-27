const express = require('express');
const router = express.Router();

const { OpenAI } = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });


const Account = require('../models/Account');

// Define OpenAI tool (function) schema
const Customer = require('../models/Customer');

// Helper to get all customers for enum options
async function getCustomerOptions() {
	const customers = await Customer.getAllCustomers?.() || [];
	return customers.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName} (${c.id})` }));
}

let tools = [
	{
		type: 'function',
		function: {
			name: 'getAccountsByCustomer',
			description: 'Get all accounts for a given customer ID.',
			parameters: {
				type: 'object',
				properties: {
					customerId: { type: 'string', description: 'The customer ID to look up.' }
				},
				required: ['customerId']
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getAllAccounts',
			description: 'Get a list of all bank accounts with their details.',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getCustomerByAccount',
			description: 'Get customer details by account number.',
			parameters: {
				type: 'object',
				properties: {
					accountNumber: { type: 'string', description: 'The account number to look up.' }
				},
				required: ['accountNumber']
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'searchCustomerByName',
			description: 'Search for customers by (partial) first or last name.',
			parameters: {
				type: 'object',
				properties: {
					name: { type: 'string', description: 'The (partial) first or last name to search for.' }
				},
				required: ['name']
			},
		},
	}
];

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
			tools,
			tool_choice: 'auto',
			max_tokens: 150
		});
		console.log('OpenAI initial response:', JSON.stringify(initial, null, 2));
		const choice = initial.choices[0];
		const toolCall = choice.message.tool_calls && choice.message.tool_calls[0];

		if (toolCall && toolCall.function) {
			if (toolCall.function.name === 'getAllAccounts') {
				// Step 2: Call the tool (fetch all accounts)
				const accounts = await Account.getAllAccounts();
				// Prepare a summary for the AI: total count and preview
				const preview = accounts.map(acc => ({
					id: acc.id,
					accountNumber: acc.accountNumber,
					accountType: acc.accountType,
					balance: acc.balance,
					currency: acc.currency,
					customerId: acc.customerId,
					status: acc.status,
					createdAt: acc.createdAt,
					updatedAt: acc.updatedAt
				}));
				const toolResult = {
					total: accounts.length,
					preview
				};
				// Step 3: Send tool result back to OpenAI for a final answer
				const assistantMsg = {
					role: 'assistant',
					content: null,
					tool_calls: choice.message.tool_calls
				};
				// Add tool call to chat history for context
				let followupMessages = [
					{ role: 'system', content: 'You are a helpful assistant for a bank account dashboard. Always mention the total number of accounts if available.' }
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
						name: 'get_all_accounts',
						content: JSON.stringify(toolResult)
					}
				);
				const followup = await openai.chat.completions.create({
					model: 'gpt-3.5-turbo-1106',
					messages: followupMessages,
					max_tokens: 200
				});
				console.log('OpenAI followup response:', JSON.stringify(followup, null, 2));
				const aiMessage = followup.choices[0].message.content;
				res.json({ aiMessage, accounts: toolResult });
			} else if (toolCall.function.name === 'getCustomerByAccount') {
				// Step 2: Call the tool (fetch customer by account number)
				let args = {};
				try { args = JSON.parse(toolCall.function.arguments); } catch { }
				const accountNumber = args.accountNumber;
				let customer = null;
				if (accountNumber) {
					const customerId = await Account.getCustomerIdByAccountNumber(accountNumber);
					if (customerId) {
						customer = await Customer.getCustomerById(customerId);
					}
				}
				// Step 3: Send tool result back to OpenAI for a final answer
				const assistantMsg = {
					role: 'assistant',
					content: null,
					tool_calls: choice.message.tool_calls
				};
				const toolResult = customer ? {
					id: customer.id,
					firstName: customer.firstName,
					lastName: customer.lastName,
					email: customer.email,
					phone: customer.phone,
					address: customer.address,
					dateOfBirth: customer.dateOfBirth,
					status: customer.status,
					createdAt: customer.createdAt,
					updatedAt: customer.updatedAt
				} : { error: 'Customer not found for this account number.' };
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
						name: 'get_customer_by_account',
						content: JSON.stringify(toolResult)
					}
				);
				const followup = await openai.chat.completions.create({
					model: 'gpt-3.5-turbo-1106',
					messages: followupMessages,
					max_tokens: 200
				});
				console.log('OpenAI followup response:', JSON.stringify(followup, null, 2));
				const aiMessage = followup.choices[0].message.content;
				res.json({ aiMessage, customer: toolResult });
			} else if (toolCall.function.name === 'searchCustomerByName') {
				// Step 2: Call the tool (search customers by name)
				let args = {};
				try { args = JSON.parse(toolCall.function.arguments); } catch { }
				const name = args.name;
				let customers = [];
				if (name) {
					customers = await Customer.searchByName(name);
				}
				// Prepare a summary for the AI: total count and preview
				const preview = customers.map(cust => ({
					id: cust.id,
					firstName: cust.firstName,
					lastName: cust.lastName,
					email: cust.email,
					phone: cust.phone,
					address: cust.address,
					dateOfBirth: cust.dateOfBirth,
					status: cust.status,
					createdAt: cust.createdAt,
					updatedAt: cust.updatedAt
				}));
				const toolResult = {
					total: customers.length,
					preview
				};
				// Step 3: Send tool result back to OpenAI for a final answer
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
						name: 'search_customer_by_name',
						content: JSON.stringify(toolResult)
					}
				);
				const followup = await openai.chat.completions.create({
					model: 'gpt-3.5-turbo-1106',
					messages: followupMessages,
					max_tokens: 200
				});
				console.log('OpenAI followup response:', JSON.stringify(followup, null, 2));
				const aiMessage = followup.choices[0].message.content;
				res.json({ aiMessage, customers: toolResult });
			} else if (toolCall.function.name === 'getAccountsByCustomer') {
				// Step 2: Call the tool (fetch accounts by customer ID)
				let args = {};
				try { args = JSON.parse(toolCall.function.arguments); } catch { }
				const customerId = args.customerId;
				let accounts = [];
				if (customerId) {
					accounts = await Account.getAccountsByCustomerId(customerId);
				}
				// Prepare a summary for the AI: total count and preview
				const preview = accounts.map(acc => ({
					id: acc.id,
					accountNumber: acc.accountNumber,
					accountType: acc.accountType,
					balance: acc.balance,
					currency: acc.currency,
					customerId: acc.customerId,
					status: acc.status,
					createdAt: acc.createdAt,
					updatedAt: acc.updatedAt
				}));
				const toolResult = {
					total: accounts.length,
					preview
				};
				// Step 3: Send tool result back to OpenAI for a final answer
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
						name: 'get_accounts_by_customer',
						content: JSON.stringify(toolResult)
					}
				);
				const followup = await openai.chat.completions.create({
					model: 'gpt-3.5-turbo-1106',
					messages: followupMessages,
					max_tokens: 200
				});
				console.log('OpenAI followup response:', JSON.stringify(followup, null, 2));
				const aiMessage = followup.choices[0].message.content;
				res.json({ aiMessage, accounts: toolResult });
			} else {
				// Unknown tool, fallback
				res.json({ aiMessage: 'Tool not implemented.' });
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
