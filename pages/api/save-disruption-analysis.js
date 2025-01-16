import { connectToDatabase } from '../../utils/mongodb';
import DisruptionAnalysis from '../../models/DisruptionAnalysis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('stock_disruption_analysis');

    const {
      company_info,
      disruption_analysis,
      overall_assessment,
    } = req.body;

    // Transform the data to match our MongoDB schema
    const analysisData = {
      company: company_info.name,
      ticker: company_info.ticker,
      analysisDate: new Date(),
      categories: {
        technological: {
          level: disruption_analysis.technological.level,
          description: disruption_analysis.technological.explanation
        },
        market: {
          level: disruption_analysis.market.level,
          description: disruption_analysis.market.explanation
        },
        valueChain: {
          level: disruption_analysis.value_chain.level,
          description: disruption_analysis.value_chain.explanation
        },
        customerExperience: {
          level: disruption_analysis.customer_experience.level,
          description: disruption_analysis.customer_experience.explanation
        },
        regulatory: {
          level: disruption_analysis.regulatory.level,
          description: disruption_analysis.regulatory.explanation
        }
      },
      overallDisruption: {
        score: overall_assessment.disruption_level,
        maxScore: 5,
        description: overall_assessment.explanation
      }
    };

    // Check if an analysis already exists for this ticker
    const existingAnalysis = await collection.findOne({
      ticker: company_info.ticker
    });

    let savedAnalysis;
    if (existingAnalysis) {
      // Update existing analysis
      savedAnalysis = await collection.findOneAndUpdate(
        { ticker: company_info.ticker },
        { $set: analysisData },
        { returnDocument: 'after' }
      );
    } else {
      // Create new analysis
      savedAnalysis = await collection.insertOne(analysisData);
    }

    return res.status(200).json(savedAnalysis);
  } catch (error) {
    console.error('Save analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
}
