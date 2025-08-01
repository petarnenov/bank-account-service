import React, { useState, useRef, useEffect } from 'react';
import './AiAssistant.css';



const AiAssistant = ({ collapsed, setCollapsed }) => {
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState([
		{ sender: 'ai', text: 'Hi! I am your AI Assistant. How can I help you with your accounts today?' }
	]);
	const [loading, setLoading] = useState(false);
	const [accountInfo, setAccountInfo] = useState(null);
	const [accountQuery, setAccountQuery] = useState(null);

	// Ref for auto-scrolling
	const messagesEndRef = useRef(null);

	// Scroll to bottom when messages or loading changes
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, loading, accountInfo]);

	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

	// Helper to convert local messages to OpenAI format
	const getHistoryForApi = () => {
		// Skip the initial greeting from AI
		return messages.slice(1).map(msg => ({
			role: msg.sender === 'user' ? 'user' : 'assistant',
			content: msg.text
		}));
	};

	// Helper: Try to extract account number/id from a string
	const extractAccountId = (text) => {
		// Looks for phrases like 'account number: 32432807M9JYNUUPVN00' or 'account 32432807M9JYNUUPVN00'
		// Accepts long alphanumeric account numbers
		const match = text.match(/account(?: number)?[:#]?\s*([A-Za-z0-9]{8,})/i);
		return match ? match[1] : null;
	};

	// Helper: Try to extract customer info from AI message
	const extractCustomerInfo = (text) => {
		// Looks for fields like Name, Email, Phone, Address, Date of Birth
		const name = /Name:\s*([\w\s.]+)/i.exec(text)?.[1]?.trim();
		const email = /Email:\s*([\w-.]+@[\w-.]+)/i.exec(text)?.[1]?.trim();
		const phone = /Phone:\s*([\d\s]+)/i.exec(text)?.[1]?.trim();
		const address = /Address:\s*([\w\s,0-9-]+?)(?:\s*-\s*Date of Birth|$)/i.exec(text)?.[1]?.trim();
		const dob = /Date of Birth[:\s]*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}-[0-9]{2}-[0-9]{4}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i.exec(text)?.[1]?.trim();
		if (name || email || phone || address || dob) {
			return { name, email, phone, address, dob };
		}
		return null;
	};

	const [customerInfo, setCustomerInfo] = useState(null);

	// Fetch account info if a new account is mentioned
	useEffect(() => {
		if (accountQuery) {
			setAccountInfo(null);
			setCustomerInfo(null);
			fetch(`${API_URL}/api/accounts/number/${accountQuery}`)
				.then(res => res.ok ? res.json() : null)
				.then(data => {
					if (data && (data.id || data.accountNumber)) setAccountInfo(data);
					else setAccountInfo(null); // Only show card if found
				})
				.catch(() => setAccountInfo(null));
		}
	}, [accountQuery, API_URL]);

	// Show customer info card if present in last AI message and no account info
	useEffect(() => {
		if (!accountInfo && messages.length > 0) {
			const lastMsg = messages[messages.length - 1];
			if (lastMsg.sender === 'ai') {
				const info = extractCustomerInfo(lastMsg.text);
				setCustomerInfo(info);
			} else {
				setCustomerInfo(null);
			}
		}
	}, [accountInfo, messages]);

	const handleSend = async (e) => {
		e.preventDefault();
		if (!input.trim()) return;
		const newMessages = [...messages, { sender: 'user', text: input }];
		setMessages(newMessages);
		setLoading(true);
		setAccountInfo(null);
		setAccountQuery(null);
		try {
			const res = await fetch(`${API_URL}/api/ai/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: input,
					history: getHistoryForApi()
				})
			});
			const data = await res.json();
			if (data.aiMessage) {
				setMessages(prev => [...prev, { sender: 'ai', text: data.aiMessage }]);
				// Try to extract account id from either user input or AI response
				const accId = extractAccountId(input) || extractAccountId(data.aiMessage);
				if (accId) setAccountQuery(accId);
			} else {
				setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I could not get a response from the AI.' }]);
			}
		} catch (err) {
			setMessages(prev => [...prev, { sender: 'ai', text: 'Error contacting AI service.' }]);
		}
		setLoading(false);
		setInput('');
	};


	return collapsed ? (
		<div className="ai-assistant ai-collapsed">
			<button
				className="ai-collapsed-btn"
				onClick={() => setCollapsed(false)}
				aria-label="Expand AI Assistant"
			>
				🤖
			</button>
		</div>
	) : (
		<div className="ai-assistant">
			<div className="ai-header">
				AI Assistant
				<button
					className="ai-toggle-btn"
					onClick={() => setCollapsed(true)}
					aria-label="Collapse AI Assistant"
				>
					▼
				</button>
			</div>
			<div className="ai-messages" style={{ overflowY: 'auto', maxHeight: 400 }}>
				{messages.map((msg, idx) => (
					<div key={idx} className={`ai-msg ai-msg-${msg.sender}`}>{msg.text}</div>
				))}
				{loading && <div className="ai-msg ai-msg-ai">Thinking...</div>}
				{/* Account info card */}
				{accountQuery && accountInfo && (
					<div className="ai-account-card">
						<strong>Account Info</strong>
						<div>ID: {accountInfo.id}</div>
						<div>Account Number: {accountInfo.accountNumber}</div>
						<div>Name: {accountInfo.name || accountInfo.owner || 'N/A'}</div>
						<div>Balance: {accountInfo.balance != null ? accountInfo.balance : 'N/A'}</div>
						<div>Status: {accountInfo.status || 'N/A'}</div>
					</div>
				)}
				{/* Customer info card if present and no account info */}
				{!accountInfo && customerInfo && (
					<div className="ai-account-card">
						<strong>Customer Info</strong>
						{customerInfo.name && <div>Name: {customerInfo.name}</div>}
						{customerInfo.email && <div>Email: {customerInfo.email}</div>}
						{customerInfo.phone && <div>Phone: {customerInfo.phone}</div>}
						{customerInfo.address && <div>Address: {customerInfo.address}</div>}
						{customerInfo.dob && <div>Date of Birth: {customerInfo.dob}</div>}
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>
			<form className="ai-input-row" onSubmit={handleSend}>
				<input
					type="text"
					value={input}
					onChange={e => setInput(e.target.value)}
					placeholder="Ask me anything about your accounts..."
				/>
				<button type="submit" disabled={loading || !input.trim()}>Send</button>
			</form>
		</div>
	);
};

export default AiAssistant;
