db = db.getSiblingDB('stock');

// Clear existing data
db.stock_disruption_analysis.deleteMany({});

// Sample tickers and companies
const stocks = [
  { ticker: 'AAPL', company: 'Apple Inc.' },
  { ticker: 'MSFT', company: 'Microsoft Corporation' },
  { ticker: 'GOOGL', company: 'Alphabet Inc.' },
  { ticker: 'AMZN', company: 'Amazon.com Inc.' },
  { ticker: 'META', company: 'Meta Platforms Inc.' }
];

// Generate random scores
function generateScore() {
  return {
    score: Math.floor(Math.random() * 100),
    maxScore: 100
  };
}

// Generate analysis for each stock for the past 90 days
const now = new Date();
stocks.forEach(stock => {
  for (let daysAgo = 0; daysAgo <= 90; daysAgo += 15) { // Every 15 days
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    db.stock_disruption_analysis.insertOne({
      ticker: stock.ticker,
      company: stock.company,
      analysisDate: date,
      overallDisruption: generateScore(),
      categories: {
        technological: {
          level: Math.random() > 0.5 ? 'High' : 'Moderate',
          score: generateScore()
        },
        market: {
          level: Math.random() > 0.5 ? 'High' : 'Low',
          score: generateScore()
        },
        valueChain: {
          level: Math.random() > 0.5 ? 'Moderate' : 'Low',
          score: generateScore()
        },
        customerExperience: {
          level: Math.random() > 0.5 ? 'High' : 'Moderate',
          score: generateScore()
        },
        regulatory: {
          level: Math.random() > 0.5 ? 'Moderate' : 'Low',
          score: generateScore()
        }
      }
    });
  }
});
