class StockAnalyzer {
  constructor() {
    this.totalGrahamPts = 9.0 / 4.0;  // 2.25 points each for Graham (max 9)
    this.totalLynchPts = 3.0;         // 3 points each for Lynch criteria
  }

  analyzeStock(stockInfo) {
    try {
      // Clean and validate the data first
      const cleanedData = this.cleanData(stockInfo);
      
      // Calculate scores only if we have valid data
      const scores = this.calculateScores(cleanedData);

      return {
        metrics: this.formatMetricsForDisplay(cleanedData, scores),
        classifications: this.getStockClassifications(cleanedData),
        warnings: this.getMissingDataWarnings(cleanedData)
      };
    } catch (error) {
      console.error('Error analyzing stock:', error);
      return {
        error: 'Failed to analyze stock data',
        details: error.message
      };
    }
  }

  cleanData(stockInfo) {
    console.log('Cleaning data:', stockInfo);  // Debug log
    
    const cleaned = {
      symbol: stockInfo.symbol,
      companyName: stockInfo.companyName,
      currentPrice: parseFloat(stockInfo.currentPrice) || null,
      trailingPE: parseFloat(stockInfo.trailingPE) || null,
      pegRatio: parseFloat(stockInfo.pegRatio) || null,
      priceToBook: parseFloat(stockInfo.priceToBook) || null,
      currentRatio: parseFloat(stockInfo.currentRatio) || null,
      debtToEquity: parseFloat(stockInfo.debtToEquity) || null,
      quarterlyRevenueGrowth: parseFloat(stockInfo.quarterlyRevenueGrowth) || null,
      quarterlyEarningsGrowth: parseFloat(stockInfo.quarterlyEarningsGrowth) || null
    };

    // Calculate scores only if we have the required data
    const scores = this.calculateScores(cleaned);
    
    return {
      ...cleaned,
      grahamScore: scores.grahamScore,
      lynchScore: scores.lynchScore
    };
  }

  calculateScores(stockInfo) {
    let grahamScore = 0;
    let lynchScore = 0;

    // Graham Score Calculation (2.25 points each, max 9 points)
    if (stockInfo.trailingPE !== null && stockInfo.trailingPE > 15) {
      grahamScore += this.totalGrahamPts;
      console.log('Graham: Added points for P/E > 15');
    }
    if (stockInfo.currentRatio !== null && stockInfo.currentRatio < 1.5) {
      grahamScore += this.totalGrahamPts;
      console.log('Graham: Added points for Current Ratio < 1.5');
    }
    if (stockInfo.priceToBook !== null && stockInfo.priceToBook > 1.5) {
      grahamScore += this.totalGrahamPts;
      console.log('Graham: Added points for P/B > 1.5');
    }
    if (stockInfo.debtToEquity !== null && stockInfo.debtToEquity > 1.15) {
      grahamScore += this.totalGrahamPts;
      console.log('Graham: Added points for D/E > 1.15');
    }

    // Lynch Score Calculation (3 points each)
    // PEG Ratio check
    if (stockInfo.pegRatio !== null && stockInfo.pegRatio > 1) {
      lynchScore += this.totalLynchPts;
      console.log('Lynch: Added points for PEG ratio > 1');
    }
    // Debt/Equity check
    if (stockInfo.debtToEquity !== null && stockInfo.debtToEquity > 0.3) {
      lynchScore += this.totalLynchPts;
      console.log('Lynch: Added points for D/E > 0.3');
    }
    // Earnings Growth > 10% check
    if (stockInfo.quarterlyEarningsGrowth !== null && stockInfo.quarterlyEarningsGrowth > 0.1) {
      lynchScore += this.totalLynchPts;
      console.log('Lynch: Added points for earnings growth > 10%');
    }
    // Additional points for Earnings Growth > 25%
    if (stockInfo.quarterlyEarningsGrowth !== null && stockInfo.quarterlyEarningsGrowth > 0.25) {
      lynchScore += this.totalLynchPts;
      console.log('Lynch: Added additional points for earnings growth > 25%');
    }

    const scores = {
      grahamScore: Math.min(parseFloat(grahamScore.toFixed(2)), 9),
      lynchScore: parseFloat(lynchScore.toFixed(2))
    };

    console.log('Final Scores:', scores);
    return scores;
  }

  formatMetricsForDisplay(metrics, scores) {
    console.log('Formatting metrics:', metrics);  // Debug log
    
    return {
      companyName: metrics.companyName || 'N/A',
      currentPrice: metrics.currentPrice ? `$${metrics.currentPrice.toFixed(2)}` : 'N/A',
      
      grahamScore: scores.grahamScore.toFixed(2),
      lynchScore: scores.lynchScore.toFixed(2),
      
      valuationMetrics: {
        peRatio: metrics.trailingPE ? metrics.trailingPE.toFixed(2) : 'N/A',
        pegRatio: metrics.pegRatio ? metrics.pegRatio.toFixed(2) : 'N/A',
        priceToBook: metrics.priceToBook ? metrics.priceToBook.toFixed(2) : 'N/A'
      },
      
      growthMetrics: {
        revenueGrowth: metrics.quarterlyRevenueGrowth ? 
          `${(metrics.quarterlyRevenueGrowth * 100).toFixed(2)}%` : 'N/A',
        earningsGrowth: metrics.quarterlyEarningsGrowth ? 
          `${(metrics.quarterlyEarningsGrowth * 100).toFixed(2)}%` : 'N/A'
      },
      
      financialHealth: {
        currentRatio: metrics.currentRatio ? metrics.currentRatio.toFixed(2) : 'N/A',
        debtToEquity: metrics.debtToEquity ? metrics.debtToEquity.toFixed(2) : 'N/A'
      },

      // Add calculation details
      calculationDetails: {
        graham: {
          peRatio: metrics.trailingPE?.toFixed(2) || 'N/A',
          currentRatio: metrics.currentRatio?.toFixed(2) || 'N/A',
          priceToBook: metrics.priceToBook?.toFixed(2) || 'N/A',
          debtToEquity: metrics.debtToEquity?.toFixed(2) || 'N/A'
        },
        lynch: {
          pegRatio: metrics.pegRatio?.toFixed(2) || 'N/A',
          debtToEquity: metrics.debtToEquity?.toFixed(2) || 'N/A',
          earningsGrowth: metrics.quarterlyEarningsGrowth ? 
            `${(metrics.quarterlyEarningsGrowth * 100).toFixed(2)}%` : 'N/A'
        }
      }
    };
  }

  getStockClassifications(stockInfo) {
    const classifications = [];

    if (stockInfo.trailingPE !== null && stockInfo.trailingPE < 25) {
      classifications.push('Reasonable P/E (<25)');
    }

    if (stockInfo.quarterlyRevenueGrowth !== null && stockInfo.quarterlyRevenueGrowth > 0) {
      classifications.push(`Revenue Growth: ${(stockInfo.quarterlyRevenueGrowth * 100).toFixed(2)}%`);
    }

    if (stockInfo.quarterlyEarningsGrowth !== null && stockInfo.quarterlyEarningsGrowth > 0) {
      classifications.push(`Earnings Growth: ${(stockInfo.quarterlyEarningsGrowth * 100).toFixed(2)}%`);
    }

    if (stockInfo.currentRatio !== null && stockInfo.currentRatio > 1) {
      classifications.push(`Healthy Current Ratio: ${stockInfo.currentRatio.toFixed(2)}`);
    }

    return classifications.length > 0 ? classifications : ['Insufficient data for classification'];
  }

  getMissingDataWarnings(stockInfo) {
    const warnings = [];
    const criticalMetrics = {
      trailingPE: "P/E Ratio",
      pegRatio: "PEG Ratio",
      priceToBook: "Price/Book",
      currentRatio: "Current Ratio",
      debtToEquity: "Debt/Equity"
    };

    for (const [metric, label] of Object.entries(criticalMetrics)) {
      if (stockInfo[metric] === null || stockInfo[metric] === undefined) {
        warnings.push(label);
      }
    }

    return warnings.length > 0 ? warnings : null;
  }
}

export default StockAnalyzer;
