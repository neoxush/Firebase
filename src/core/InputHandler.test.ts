import { InputHandler } from './InputHandler';

describe('InputHandler', () => {
  let inputHandler: InputHandler;

  beforeEach(() => {
    inputHandler = new InputHandler();
    inputHandler.initialize();
  });

  it('should record typed letters', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(inputHandler.getTypedString()).toBe('a');
  });

  it('should clear the typed string', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    inputHandler.clearTypedString();
    expect(inputHandler.getTypedString()).toBe('');
  });
});
