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
 * Groq Provider with Structured Output
 * Requires: npm install groq-sdk
 * Uses JSON schema for consistent, structured responses
 */
class GroqProvider extends AIProvider {
  constructor(apiKey, model = 'moonshotai/kimi-k2-instruct') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.client = null;
  }

  async getClient() {
    if (!this.client) {
      try {
        const Groq = require('groq-sdk');
        this.client = new Groq({ apiKey: this.apiKey });
      } catch (e) {
        throw new Error('groq-sdk not installed. Run: npm install groq-sdk');
      }
    }
    return this.client;
  }

  /**
   * Generate both disability description lines at once using structured output.
   * This ensures consistency between line1 and line2.
   */
  async generateDisabilityDescription(context) {
    const client = await this.getClient();

    const schema = {
      name: 'disability_description',
      description: 'Generate a disability description for a benefits claim form',
      schema: {
        type: 'object',
        properties: {
          line1: {
            type: 'string',
            description: 'SHORT diagnosis statement (max 51 characters). Just the condition name. Example: "Lower back strain with herniated disc L4-L5."'
          },
          line2: {
            type: 'string',
            description: 'Details about symptoms, how/when it occurred, and restrictions (max 190 characters). Example: "Pain radiates down left leg. Occurred while lifting boxes at home on 12/15/2025. Unable to sit or stand for extended periods."'
          }
        },
        required: ['line1', 'line2'],
        additionalProperties: false
      },
      strict: true
    };

    const disabilityDate = context.dates?.disabilityStart
      ? new Date(context.dates.disabilityStart).toLocaleDateString('en-US')
      : 'recently';

    const systemPrompt = `You are generating FICTIONAL data for testing a NY State disability benefits form (DB-450).
Generate realistic but completely fictional medical information for testing purposes only.

IMPORTANT CONSTRAINTS:
- The disability must be NON-WORK-RELATED (this is for state disability, not workers comp)
- Common conditions: back injuries, knee problems, surgery recovery, pregnancy complications, chronic conditions
- line1 MUST be 51 characters or less: just the diagnosis/condition name
- line2 MUST be 190 characters or less: symptoms, how/when it occurred, and restrictions
- Be specific with medical terminology but keep it realistic
- Reference the disability start date: ${disabilityDate}

Context:
- Claimant: ${context.claimant?.fullName || 'Test Claimant'}
- Occupation: ${context.claimant?.occupation || 'Office Worker'}
- Disability Start: ${disabilityDate}`;

    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a disability description for this claimant\'s benefits form.' }
      ],
      model: this.model,
      response_format: {
        type: 'json_schema',
        json_schema: schema
      },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }

  async generate(prompt, context) {
    // For compatibility with the existing callback interface,
    // we generate both lines at once and cache them
    if (!this._cachedDescription) {
      this._cachedDescription = await this.generateDisabilityDescription(context);
    }

    // Return the appropriate line based on the prompt/category
    if (prompt.includes('Continue') || prompt.includes('continued')) {
      return this._cachedDescription.line2;
    }
    return this._cachedDescription.line1;
  }

  // Reset cache for new form generation
  resetCache() {
    this._cachedDescription = null;
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
 * Create a Groq-specific callback that handles cache reset between forms
 */
function createGroqCallback(apiKey, model = 'moonshotai/kimi-k2-instruct') {
  const provider = new GroqProvider(apiKey, model);

  const callback = async function groqCallback(prompt, category, data) {
    try {
      const result = await provider.generate(prompt, data);
      return result;
    } catch (error) {
      console.warn(`Groq AI generation failed for ${category}: ${error.message}`);
      return '';
    }
  };

  // Attach reset method for use between forms in batch mode
  callback.resetCache = () => provider.resetCache();
  callback.provider = provider;

  return callback;
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
  GroqProvider,
  MockProvider,
  createAICallback,
  createGroqCallback,
};

// Run example if executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}
