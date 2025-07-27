// Mock window.location.reload to prevent jsdom navigation errors in tests
Object.defineProperty(window, 'location', {
	configurable: true,
	value: { ...window.location, reload: jest.fn() }
});
