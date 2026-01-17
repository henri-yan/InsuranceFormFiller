
const { fillForm } = require('./fill-form');
const { createAICallback, MockProvider } = require('./ai-integration');

async function test() {
  console.log('Testing Part B filling with Mock AI...');
  
  const mockCallback = createAICallback(new MockProvider());
  
  await fillForm('test-part-b', {
    useAI: true,
    aiCallback: mockCallback, // Pass the mock callback directly
    // The fillForm function expects 'ai' option to be true to use the callback
    ai: true,
    preview: false
  });
  
  console.log('Test complete. Check output/test-part-b.pdf');
}

test().catch(console.error);
