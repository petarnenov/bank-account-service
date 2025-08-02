// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.location.reload to prevent jsdom navigation errors in tests
Object.defineProperty(window, 'location', {
	configurable: true,
	value: { ...window.location, reload: jest.fn() }
});
