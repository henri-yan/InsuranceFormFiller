/**
 * AI Integration Module for NY DBL Form Filler
 *
 * This module provides a framework for integrating AI-generated content
 * for fields that require sentence-form descriptions (like disability descriptions).
 *
 * Usage:
 *   const { createAICallback, AnthropicProvider, OpenAIProvider } = require('./ai-integration');
 *
 *   // Using Anthropic Claude
 *   const aiCallback = createAICallback(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
 *
 *   // Using OpenAI
 *   const aiCallback = createAICallback(new OpenAIProvider(process.env.OPENAI_API_KEY));
 *
 *   // Pass to form filler
 *   await fillForm('claim-001', { useAI: true, aiCallback });
 */

/**
 * Base AI Provider interface
 */
class AIProvider {
  async generate(prompt, context) {
    throw new Error('generate() must be implemented by subclass');
  }
}

/**
 * Anthropic Claude Provider
 * Requires: npm install @anthropic-ai/sdk
 */
class AnthropicProvider extends AIProvider {
  constructor(apiKey, model = 'claude-3-haiku-20240307') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.client = null;
  }

  async getClient() {
    if (!this.client) {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.client = new Anthropic({ apiKey: this.apiKey });
      } catch (e) {
        throw new Error('@anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk');
      }
    }
    return this.client;
  }

  async generate(prompt, context) {
    const client = await this.getClient();

    const systemPrompt = `You are generating fake data for testing a disability benefits form.
Generate realistic but fictional medical information. Keep responses concise (1-2 sentences max).
Context about the claimant:
- Name: ${context.claimant?.fullName || 'Unknown'}
- Occupation: ${context.claimant?.occupation || 'Unknown'}
- Disability Start Date: ${context.dates?.disabilityStart || 'Unknown'}`;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text.trim();
  }
}

/**
 * OpenAI Provider
 * Requires: npm install openai
 */
class OpenAIProvider extends AIProvider {
  constructor(apiKey, model = 'gpt-3.5-turbo') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.client = null;
  }

  async getClient() {
    if (!this.client) {
      try {
        const OpenAI = require('openai');
        this.client = new OpenAI({ apiKey: this.apiKey });
      } catch (e) {
        throw new Error('openai not installed. Run: npm install openai');
      }
    }
    return this.client;
  }

  async generate(prompt, context) {
    const client = await this.getClient();

    const systemPrompt = `You are generating fake data for testing a disability benefits form.
Generate realistic but fictional medical information. Keep responses concise (1-2 sentences max).
Context about the claimant:
- Name: ${context.claimant?.fullName || 'Unknown'}
- Occupation: ${context.claimant?.occupation || 'Unknown'}
- Disability Start Date: ${context.dates?.disabilityStart || 'Unknown'}`;

    const response = await client.chat.completions.create({
      model: this.model,
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    return response.choices[0].message.content.trim();
  }
}

/**
 * Mock Provider for testing (uses fallback descriptions)
 */
class MockProvider extends AIProvider {
  constructor() {
    super();
    this.callCount = 0;
  }

  async generate(prompt, context) {
    this.callCount++;

    // Generate mock responses based on the category
    const mockResponses = {
      disability_description: [
        'Chronic lower back pain with muscle spasms limiting mobility and ability to sit for extended periods.',
        'Post-operative recovery following arthroscopic knee surgery for torn meniscus.',
        'Severe carpal tunnel syndrome requiring surgical intervention and rehabilitation.',
        'Acute anxiety disorder with panic attacks affecting ability to perform work duties.',
        'Herniated disc at L4-L5 causing sciatica and difficulty with standing or walking.',
      ],
      disability_description_continued: [
        'Condition developed gradually over several months, worsened in the past two weeks.',
        'Surgery performed on the disability start date, expected recovery period of 6-8 weeks.',
        'Symptoms first appeared while performing repetitive tasks at work, now requiring rest.',
        'Episodes occur unpredictably, making it unsafe to operate machinery or drive.',
        'Physical therapy recommended 3x/week, restricted from lifting over 10 pounds.',
      ],
    };

    const category = prompt.includes('Continue') ? 'disability_description_continued' : 'disability_description';
    const responses = mockResponses[category] || mockResponses.disability_description;

    return responses[this.callCount % responses.length];
  }
}

/**
 * Create an AI callback function for use with the form filler
 */
function createAICallback(provider) {
  return async function aiCallback(prompt, category, data) {
    try {
      const result = await provider.generate(prompt, data);
      return result;
    } catch (error) {
      console.warn(`AI generation failed for ${category}: ${error.message}`);
      // Return empty string to fall back to pre-defined descriptions
      return '';
    }
  };
}

/**
 * Example usage with form filler
 */
async function exampleUsage() {
  const { fillForm } = require('./fill-form');

  // Example 1: Using mock provider (no API needed)
  console.log('Example 1: Mock Provider');
  const mockCallback = createAICallback(new MockProvider());

  await fillForm('ai-test-001', {
    useAI: true,
    aiCallback: mockCallback,
    preview: true,
  });

  // Example 2: Using Anthropic (requires API key)
  // const anthropicCallback = createAICallback(
  //   new AnthropicProvider(process.env.ANTHROPIC_API_KEY)
  // );
  // await fillForm('ai-test-002', {
  //   useAI: true,
  //   aiCallback: anthropicCallback,
  // });

  // Example 3: Using OpenAI (requires API key)
  // const openaiCallback = createAICallback(
  //   new OpenAIProvider(process.env.OPENAI_API_KEY)
  // );
  // await fillForm('ai-test-003', {
  //   useAI: true,
  //   aiCallback: openaiCallback,
  // });
}

module.exports = {
  AIProvider,
  AnthropicProvider,
  OpenAIProvider,
  MockProvider,
  createAICallback,
};

// Run example if executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}
