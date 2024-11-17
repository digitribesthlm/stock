class StockAnalyzer {
    constructor() {
      this.totalGrahamPts = 9.0 / 4.0;  // 2.25 points per criteria (4 total)
      this.totalLynchPts = 9.0 / 3.0;   // 3 points per criteria (3 total)
    }
  
    analyzeStock(stockInfo) {
      try {
        // Clean and standardize the data
        const cleanedData = this.cleanData(stockInfo);
        
        // Calculate scores following Python logic
        const { scores, missingCriteria, missingPoints } = this.calculateScores(cleanedData);
        
        // Get classifications
        const classifications = this.classifyLynchStyle(cleanedData);
  
        return {
          metrics: this.formatMetricsForDisplay(cleanedData, scores),
          classifications: classifications,
          warnings: missingCriteria.length > 0 ? missingCriteria.join(", ") : null,
          missingPoints: missingPoints
        };
      } catch (error) {
        console.error('Error analyzing stock:', error);
        return {
          error: 'Failed to analyze stock data',
          details: error.message
        };
      }
    }
  
    calculateScores(stockInfo) {
      let grahamScore = 0;
      let lynchScore = 0;
      const missingCriteria = [];
      let missingPoints = 0;
  
      // Graham Score Calculation (max 9 points)
      const grahamCriteria = {
        trailingPE: { condition: x => x > 15, name: "Trailing P/E" },
        currentRatio: { condition: x => x < 1.5, name: "Current Ratio" },
        priceToBook: { condition: x => x > 1.5, name: "Price/Book" },
        debtToEquity: { condition: x => x > 1.15, name: "Total Debt/Equity" }
      };
  
      // Calculate Graham score exactly like Python
      for (const [key, { condition, name }] of Object.entries(grahamCriteria)) {
        if (stockInfo[key] === null || stockInfo[key] === undefined) {
          missingCriteria.push(name);
          missingPoints += this.totalGrahamPts;
        } else if (condition(stockInfo[key])) {
          grahamScore += this.totalGrahamPts;
        }
      }
  
      // Lynch Score Calculation (max 9 points)
      // 1. PEG Ratio
      if (stockInfo.pegRatio === null || stockInfo.pegRatio === undefined) {
        missingCriteria.push("PEG Ratio");
        missingPoints += this.totalLynchPts;
      } else if (stockInfo.pegRatio < 0 || stockInfo.pegRatio > 1) {
        lynchScore += this.totalLynchPts;
      }
  
      // 2. Debt/Equity
      if (stockInfo.debtToEquity === null || stockInfo.debtToEquity === undefined) {
        if (!missingCriteria.includes("Total Debt/Equity")) {
          missingCriteria.push("Total Debt/Equity");
          missingPoints += this.totalLynchPts;
        }
      } else if (stockInfo.debtToEquity > 0.3) {
        lynchScore += this.totalLynchPts;
      }
  
      // 3. Earnings Growth
      if (stockInfo.quarterlyEarningsGrowth === null || stockInfo.quarterlyEarningsGrowth === undefined) {
        missingCriteria.push("Quarterly Earnings Growth");
        missingPoints += this.totalLynchPts;
      } else {
        // Convert to percentage for comparison like Python
        const growthPercentage = stockInfo.quarterlyEarningsGrowth * 100;
        if (growthPercentage > 25) {  // 25% growth
          lynchScore += this.totalLynchPts * 2;  // Double points for high growth
        } else if (growthPercentage > 10) {  // 10% growth
          lynchScore += this.totalLynchPts;
        }
      }
  
      return {
        scores: {
          grahamScore: grahamScore > 0 ? parseFloat(grahamScore.toFixed(2)) : null,
          lynchScore: lynchScore > 0 ? parseFloat(lynchScore.toFixed(2)) : null
        },
        missingCriteria,
        missingPoints: parseFloat(missingPoints.toFixed(2))
      };
    }
  
    classifyLynchStyle(stockInfo) {
      const classifications = [];
      const marketCap = stockInfo.marketCap || 0;
      const earningsGrowth = stockInfo.quarterlyEarningsGrowth ? stockInfo.quarterlyEarningsGrowth * 100 : 0;
      const priceGrowth = this.calculatePriceGrowth(stockInfo);
      let maxGrowth = Math.max(priceGrowth, earningsGrowth);
  
      // Growth classifications
      if (marketCap > 200e9) { // Large cap
        if (earningsGrowth > 15) {
          classifications.push(`Fast Grower (Despite Size) (Earnings Growth: ${earningsGrowth.toFixed(1)}%)`);
        } else if (earningsGrowth > 8) {
          classifications.push(`Stalwart (Steady Earnings Growth: ${earningsGrowth.toFixed(1)}%)`);
        } else if (stockInfo.dividendYield > 0.005) {
          classifications.push(`Slow Grower (Dividend Yield: ${(stockInfo.dividendYield * 100).toFixed(1)}%)`);
        }
      } else {
        if (maxGrowth > 20) {
          classifications.push(`Fast Grower (Growth Rate: ${maxGrowth.toFixed(1)}%)`);
        } else if (stockInfo.dividendYield > 0.005) {
          classifications.push(`Slow Grower (Dividend Yield: ${(stockInfo.dividendYield * 100).toFixed(1)}%)`);
        }
      }
  
      // Cyclical check
      const cyclicalIndustries = ['Auto', 'Airlines', 'Steel', 'Chemical', 'Mining', 'Technology', 'Software'];
      if (cyclicalIndustries.some(ind => stockInfo.industry?.includes(ind)) || 
          (stockInfo.beta && stockInfo.beta > 1.2)) {
        classifications.push(`Cyclical (Beta: ${stockInfo.beta?.toFixed(2)}, Industry: ${stockInfo.industry})`);
      }
  
      // Turnaround check
      if ((stockInfo.debtToEquity && stockInfo.debtToEquity > 100) || 
          (stockInfo.quarterlyEarningsGrowth && stockInfo.quarterlyEarningsGrowth < -0.1)) {
        classifications.push(`Potential Turnaround (Debt/Equity: ${stockInfo.debtToEquity?.toFixed(1)}%)`);
      }
  
      // Asset Play check
      if (stockInfo.trailingPE && stockInfo.trailingPE < 15) {
        classifications.push(`Potential Asset Play (P/E Ratio: ${stockInfo.trailingPE?.toFixed(1)})`);
      }
  
      return classifications.length > 0 ? classifications : ['Insufficient data for classification'];
    }
  
    cleanData(stockInfo) {
      const cleanNumber = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
          return null;
        }
        return parseFloat(value);
      };
  
      return {
        symbol: stockInfo.symbol,
        companyName: stockInfo.companyName,
        currentPrice: cleanNumber(stockInfo.currentPrice),
        marketCap: cleanNumber(stockInfo.marketCap),
        industry: stockInfo.industry,
        beta: cleanNumber(stockInfo.beta),
        dividendYield: cleanNumber(stockInfo.dividendYield),
        trailingPE: cleanNumber(stockInfo.trailingPE),
        pegRatio: cleanNumber(stockInfo.pegRatio),
        priceToBook: cleanNumber(stockInfo.priceToBook),
        currentRatio: cleanNumber(stockInfo.currentRatio),
        debtToEquity: cleanNumber(stockInfo.debtToEquity),
        quarterlyRevenueGrowth: cleanNumber(stockInfo.quarterlyRevenueGrowth),
        quarterlyEarningsGrowth: cleanNumber(stockInfo.quarterlyEarningsGrowth)
      };
    }
  
    formatMetricsForDisplay(metrics, scores) {
      return {
        companyName: metrics.companyName,
        currentPrice: metrics.currentPrice ? `$${metrics.currentPrice.toFixed(2)}` : 'N/A',
        grahamScore: scores.grahamScore !== null ? scores.grahamScore.toFixed(2) : 'N/A',
        lynchScore: scores.lynchScore !== null ? scores.lynchScore.toFixed(2) : 'N/A',
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
        }
      };
    }
  
    calculatePriceGrowth(stockInfo) {
      // Note: This is a placeholder as we don't have historical price data
      // In the Python version this calculates 5-year CAGR
      // You'll need to implement this based on your available price history data
      return stockInfo.quarterlyEarningsGrowth ? stockInfo.quarterlyEarningsGrowth * 100 : 0;
    }
  }
  
  export default StockAnalyzer;