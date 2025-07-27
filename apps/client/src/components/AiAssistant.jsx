import React, { useState } from 'react';
import './AiAssistant.css';


const AiAssistant = ({ collapsed, setCollapsed }) => {
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState([
		{ sender: 'ai', text: 'Hi! I am your AI Assistant. How can I help you with your accounts today?' }
	]);
	const [loading, setLoading] = useState(false);

	const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

	// Helper to convert local messages to OpenAI format
	const getHistoryForApi = () => {
		// Skip the initial greeting from AI
		return messages.slice(1).map(msg => ({
			role: msg.sender === 'user' ? 'user' : 'assistant',
			content: msg.text
		}));
	};

	const handleSend = async (e) => {
		e.preventDefault();
		if (!input.trim()) return;
		const newMessages = [...messages, { sender: 'user', text: input }];
		setMessages(newMessages);
		setLoading(true);
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
			<div className="ai-messages">
				{[...messages].reverse().map((msg, idx) => (
					<div key={idx} className={`ai-msg ai-msg-${msg.sender}`}>{msg.text}</div>
				))}
				{loading && <div className="ai-msg ai-msg-ai">Thinking...</div>}
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
