from fastapi import FastAPI, HTTPException
import yfinance as yf
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stock/{ticker}")
async def get_stock_data(ticker: str):
    try:
        # Get stock info
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Extract relevant data
        stock_data = {
            "companyName": info.get("longName", ticker),
            "symbol": ticker,
            "currentPrice": info.get("currentPrice", info.get("regularMarketPrice")),
            "trailingPE": info.get("trailingPE"),
            "priceToBook": info.get("priceToBook"),
            "pegRatio": info.get("pegRatio"),
            "currentRatio": info.get("currentRatio"),
            "debtToEquity": info.get("debtToEquity"),
            "quarterlyRevenueGrowth": info.get("quarterlyRevenueGrowth"),
            "quarterlyEarningsGrowth": info.get("quarterlyEarningsGrowth"),
            # Additional metrics
            "profitMargins": info.get("profitMargins"),
            "operatingMargins": info.get("operatingMargins"),
            "returnOnEquity": info.get("returnOnEquity"),
            "totalCash": info.get("totalCash"),
            "totalDebt": info.get("totalDebt"),
            "freeCashflow": info.get("freeCashflow"),
        }
        
        print(f"Raw Yahoo Finance Data for {ticker}:", info)  # Debug log
        print(f"Extracted Stock Data for {ticker}:", stock_data)  # Debug log
        
        return stock_data

    except Exception as e:
        print(f"Error fetching data for {ticker}:", str(e))  # Debug log
        raise HTTPException(status_code=500, detail=str(e)) 