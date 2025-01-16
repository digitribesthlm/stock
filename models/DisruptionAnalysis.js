import mongoose from 'mongoose';

const DisruptionAnalysisSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    index: true
  },
  ticker: {
    type: String,
    required: true,
    index: true
  },
  analysisDate: {
    type: Date,
    required: true
  },
  categories: {
    technological: {
      level: String,
      description: String
    },
    market: {
      level: String,
      description: String
    },
    valueChain: {
      level: String,
      description: String
    },
    customerExperience: {
      level: String,
      description: String
    },
    regulatory: {
      level: String,
      description: String
    }
  },
  overallDisruption: {
    score: Number,
    maxScore: Number,
    description: String
  }
}, {
  timestamps: true
});

export default mongoose.models.DisruptionAnalysis || mongoose.model('DisruptionAnalysis', DisruptionAnalysisSchema);
