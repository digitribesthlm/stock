import OpenAI from 'openai';
import { disruptionTemplate } from '../../utils/disruptionTemplate';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }

    const { ticker, companyName, sector } = req.body;

    if (!ticker || !companyName) {
      return res.status(400).json({ message: 'Ticker and company name are required' });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "system",
            content: `You are a business analyst specializing in disruption analysis. Analyze companies and output JSON data about their disruptive potential using this exact template:
            ${JSON.stringify(disruptionTemplate, null, 2)}

            The disruption levels must be one of:
            - Low
            - Moderate
            - High
            - None

            The overall disruption level must be a number from 1 to 5 where:
            1 = Not Disruptive
            2 = Slightly Disruptive
            3 = Moderately Disruptive
            4 = Very Disruptive
            5 = Highly Disruptive`
          },
          {
            role: "user",
            content: `Analyze this company in terms of its disruptive potential. Consider its business model, technology, market approach, supply chain, and customer experience:

            Company: ${companyName}
            Ticker: ${ticker}
            Sector: ${sector || 'Unknown'}

            Return the response in the exact JSON structure provided.

            Follow these rules:
            1. Evaluate each dimension thoroughly
            2. Provide clear explanations for each rating
            3. Consider industry context
            4. Use concrete examples where possible
            5. Ensure the response exactly matches the template structure`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      let analysis;
      try {
        analysis = completion.choices[0].message.content;
        if (typeof analysis === 'string') {
          analysis = JSON.parse(analysis);
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return res.status(500).json({ message: 'Failed to parse AI response', error: parseError.message });
      }

      if (!analysis?.disruption_analysis) {
        console.error('Invalid analysis format:', analysis);
        return res.status(500).json({ message: 'Invalid AI response format' });
      }

      // Add timestamp
      analysis.metadata.timestamp = new Date().toISOString();

      console.log('Raw GPT response:', analysis);
      return res.status(200).json(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
}
