import React from 'react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
	if (!isOpen) return null;
	return (
		<div className="modal-backdrop" style={backdropStyle}>
			<div className="modal-content" style={modalStyle}>
				{title && <h2 style={{ marginTop: 0 }}>{title}</h2>}
				<div>{children}</div>
				<div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					{actions}
				</div>
				<button
					aria-label="Close modal"
					onClick={onClose}
					style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
				>
					×
				</button>
			</div>
		</div>
	);
};

const backdropStyle = {
	position: 'fixed',
	top: 0,
	left: 0,
	width: '100vw',
	height: '100vh',
	background: 'rgba(0,0,0,0.3)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1000,
};

const modalStyle = {
	background: '#fff',
	borderRadius: 8,
	padding: 32,
	minWidth: 320,
	minHeight: 120,
	position: 'relative',
	boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
};

Modal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string,
	children: PropTypes.node,
	actions: PropTypes.node,
};

export default Modal;
