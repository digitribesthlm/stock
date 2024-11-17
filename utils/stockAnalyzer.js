class StockAnalyzer {
  async analyzeStock(symbol) {
    try {
      // Fetch stock data
      const response = await fetch(`/api/stock-price?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stockInfo = await response.json();
      
      if (!stockInfo || !stockInfo.symbol) {
        throw new Error('Invalid stock data received');
      }

      // Clean and analyze the data
      const cleanedData = this.cleanData(stockInfo);
      return {
        metrics: this.formatMetricsForDisplay(cleanedData),
        classifications: this.getStockClassifications(cleanedData),
        warnings: this.getMissingDataWarnings(cleanedData)
      };

    } catch (error) {
      console.error('Error analyzing stock:', error);
      return {
        error: 'Failed to fetch stock data',
        details: error.message
      };
    }
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
      trailingPE: cleanNumber(stockInfo.trailingPE),
      pegRatio: cleanNumber(stockInfo.pegRatio),
      priceToBook: cleanNumber(stockInfo.priceToBook),
      quarterlyRevenueGrowth: cleanNumber(stockInfo.quarterlyRevenueGrowth),
      quarterlyEarningsGrowth: cleanNumber(stockInfo.quarterlyEarningsGrowth),
      currentRatio: cleanNumber(stockInfo.currentRatio),
      debtToEquity: cleanNumber(stockInfo.debtToEquity)
    };
  }

  formatMetricsForDisplay(metrics) {
    return {
      valuationMetrics: {
        peRatio: metrics.trailingPE === null ? 'N/A' : metrics.trailingPE.toFixed(2),
        pegRatio: metrics.pegRatio === null ? 'N/A' : metrics.pegRatio.toFixed(2),
        priceToBook: metrics.priceToBook === null ? 'N/A' : metrics.priceToBook.toFixed(2)
      },
      growthMetrics: {
        revenueGrowth: metrics.quarterlyRevenueGrowth === null ? '0.00%' : 
          (metrics.quarterlyRevenueGrowth * 100).toFixed(2) + '%',
        earningsGrowth: metrics.quarterlyEarningsGrowth === null ? '0.00%' : 
          (metrics.quarterlyEarningsGrowth * 100).toFixed(2) + '%'
      },
      financialHealth: {
        currentRatio: metrics.currentRatio === null ? 'N/A' : metrics.currentRatio.toFixed(2),
        debtToEquity: metrics.debtToEquity === null ? 'N/A' : metrics.debtToEquity.toFixed(2)
      }
    };
  }

  getStockClassifications(stockInfo) {
    const classifications = [];

    // Only add classifications for metrics that exist
    if (stockInfo.trailingPE !== null) {
      if (stockInfo.trailingPE < 25) {
        classifications.push('Reasonable P/E (<25)');
      }
    }

    if (stockInfo.quarterlyRevenueGrowth !== null && stockInfo.quarterlyRevenueGrowth > 0) {
      classifications.push(`Revenue Growth: ${(stockInfo.quarterlyRevenueGrowth * 100).toFixed(2)}%`);
    }

    if (stockInfo.quarterlyEarningsGrowth !== null && stockInfo.quarterlyEarningsGrowth > 0) {
      classifications.push(`Earnings Growth: ${(stockInfo.quarterlyEarningsGrowth * 100).toFixed(2)}%`);
    }

    if (stockInfo.currentRatio !== null) {
      if (stockInfo.currentRatio > 1) {
        classifications.push(`Current Ratio: ${stockInfo.currentRatio.toFixed(2)}`);
      }
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