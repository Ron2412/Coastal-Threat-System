#!/usr/bin/env python3
"""
Simple FastAPI ML Service for Tide Predictions
Provides REST API endpoints for model predictions without complex dependencies
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Tide Prediction ML API",
    description="Machine Learning API for coastal tide predictions",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3005",
        "http://127.0.0.1:3005",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PredictionRequest(BaseModel):
    port_name: str
    features: Optional[Dict[str, Any]] = None

class PredictionResponse(BaseModel):
    port: str
    predicted_components: float
    confidence: float
    risk_level: str
    model_used: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    models_loaded: int
    timestamp: str

# Mock model data
MOCK_MODELS = {
    "random_forest_components_count": {
        "type": "Random Forest",
        "accuracy": 0.9945
    },
    "linear_regression": {
        "type": "Linear Regression", 
        "accuracy": 1.0000
    }
}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        models_loaded=len(MOCK_MODELS),
        timestamp=datetime.now().isoformat()
    )

@app.get("/models/info")
async def get_models_info():
    """Get information about available models"""
    try:
        models_list = []
        for model_name, info in MOCK_MODELS.items():
            models_list.append({
                "name": model_name,
                "type": info["type"],
                "accuracy": info["accuracy"]
            })
        
        return {
            "models": models_list,
            "last_trained": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving model information")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Generate prediction for a port"""
    try:
        port_name = request.port_name
        
        # Mock prediction logic based on port characteristics
        port_risk_map = {
            "mumbai": {"base": 8.5, "risk": "high"},
            "chennai": {"base": 7.8, "risk": "high"},
            "kolkata": {"base": 9.2, "risk": "high"},
            "cochin": {"base": 6.1, "risk": "medium"},
            "mangalore": {"base": 5.8, "risk": "medium"},
            "paradip": {"base": 8.9, "risk": "high"},
            "visakhapatnam": {"base": 7.5, "risk": "high"},
            "tuticorin": {"base": 6.3, "risk": "medium"},
            "kandla": {"base": 5.9, "risk": "medium"},
            "marmagao": {"base": 5.5, "risk": "medium"}
        }
        
        # Get base prediction or use default
        port_key = port_name.lower()
        if port_key in port_risk_map:
            base_prediction = port_risk_map[port_key]["base"]
            risk_level = port_risk_map[port_key]["risk"]
        else:
            # Default for unknown ports
            base_prediction = 6.0
            risk_level = "medium"
        
        # Add some realistic variation
        import random
        variation = random.uniform(-0.5, 0.5)
        prediction = max(0, base_prediction + variation)
        
        # Calculate confidence based on prediction stability
        confidence = 0.85 + (prediction / 10) * 0.1
        confidence = min(0.98, confidence)
        
        # Determine final risk level based on prediction
        if prediction > 8:
            risk_level = "high"
        elif prediction > 5:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Choose model based on confidence
        model_used = "random_forest_components_count" if confidence > 0.9 else "linear_regression"
        
        return PredictionResponse(
            port=port_name,
            predicted_components=round(prediction, 2),
            confidence=round(confidence, 2),
            risk_level=risk_level,
            model_used=model_used,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        raise HTTPException(status_code=500, detail="Error generating prediction")

@app.get("/models/list")
async def list_available_models():
    """List all available models"""
    return {"models": list(MOCK_MODELS.keys())}

@app.get("/data/stats")
async def get_data_stats():
    """Get statistics about the training data"""
    try:
        # Mock data statistics
        ports = ["Mumbai", "Chennai", "Kolkata", "Cochin", "Mangalore", 
                "Paradip", "Visakhapatnam", "Tuticorin", "Kandla", "Marmagao"]
        
        return {
            "total_records": 1250,
            "unique_ports": len(ports),
            "ports": ports,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting data stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving data statistics")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Coastal Threat ML Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "models": "/models/info",
            "predict": "/predict",
            "stats": "/data/stats"
        }
    }

if __name__ == "__main__":
    uvicorn.run("simple_app:app", host="0.0.0.0", port=5001, reload=True)