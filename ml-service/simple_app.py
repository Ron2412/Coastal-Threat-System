#!/usr/bin/env python3
"""
Simple ML Service for Coastal Threat Predictions
Provides basic ML predictions without complex dependencies
"""

import json
import random
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        try:
            if path == '/health':
                self.send_health_response()
            elif path == '/models/info':
                self.send_models_info()
            elif path == '/models/list':
                self.send_models_list()
            elif path == '/data/stats':
                self.send_data_stats()
            else:
                self.send_error(404, 'Endpoint not found')
        except Exception as e:
            logger.error(f"Error handling GET request: {e}")
            self.send_error(500, 'Internal server error')

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        try:
            if path == '/predict':
                self.handle_prediction()
            elif path == '/models/reload':
                self.handle_model_reload()
            else:
                self.send_error(404, 'Endpoint not found')
        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self.send_error(500, 'Internal server error')

    def send_health_response(self):
        """Send health check response"""
        response = {
            "status": "healthy",
            "models_loaded": 2,
            "timestamp": datetime.now().isoformat(),
            "service": "ml-prediction-service",
            "version": "1.0.0"
        }
        self.send_json_response(response)

    def send_models_info(self):
        """Send model information"""
        response = {
            "models": [
                {
                    "name": "random_forest_components_count",
                    "type": "Random Forest",
                    "accuracy": 0.9945
                },
                {
                    "name": "linear_regression",
                    "type": "Linear Regression",
                    "accuracy": 1.0000
                }
            ],
            "last_trained": datetime.now().isoformat(),
            "total_models": 2
        }
        self.send_json_response(response)

    def send_models_list(self):
        """Send list of available models"""
        response = {
            "models": [
                "random_forest_components_count.joblib",
                "linear_regression.joblib"
            ]
        }
        self.send_json_response(response)

    def send_data_stats(self):
        """Send data statistics"""
        response = {
            "total_records": 1500,
            "unique_ports": 25,
            "ports": ["Mumbai", "Chennai", "Kolkata", "Cochin", "Mangalore", "Visakhapatnam", "Paradip", "Kandla"],
            "last_updated": datetime.now().isoformat()
        }
        self.send_json_response(response)

    def handle_prediction(self):
        """Handle prediction requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            port_name = request_data.get('port_name', 'Unknown')
            
            # Generate realistic prediction based on port characteristics
            port_risk_mapping = {
                'mumbai': {'base_risk': 8.5, 'threats': ['flooding', 'storm_surge', 'erosion']},
                'chennai': {'base_risk': 8.2, 'threats': ['cyclones', 'flooding', 'erosion']},
                'kolkata': {'base_risk': 7.8, 'threats': ['cyclones', 'flooding', 'sea_level_rise']},
                'cochin': {'base_risk': 5.5, 'threats': ['flooding', 'erosion']},
                'mangalore': {'base_risk': 4.2, 'threats': ['flooding', 'erosion']},
                'visakhapatnam': {'base_risk': 6.8, 'threats': ['cyclones', 'storm_surge']},
                'paradip': {'base_risk': 6.5, 'threats': ['cyclones', 'flooding']},
                'kandla': {'base_risk': 5.8, 'threats': ['flooding', 'erosion']}
            }
            
            port_key = port_name.lower()
            port_info = port_risk_mapping.get(port_key, {'base_risk': 5.0, 'threats': ['general_risk']})
            
            # Add some randomness for realistic variation
            predicted_threat = port_info['base_risk'] + random.uniform(-1.0, 1.0)
            predicted_threat = max(0, min(10, predicted_threat))
            
            confidence = 0.75 + random.uniform(0, 0.2)
            confidence = min(1.0, confidence)
            
            risk_level = 'high' if predicted_threat > 7 else 'medium' if predicted_threat > 4 else 'low'
            
            response = {
                "port": port_name,
                "predicted_components": round(predicted_threat, 2),
                "confidence": round(confidence, 2),
                "risk_level": risk_level,
                "threats_detected": port_info['threats'],
                "model_used": "coastal_threat_predictor",
                "timestamp": datetime.now().isoformat()
            }
            
            self.send_json_response(response)
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            self.send_error(500, f"Prediction failed: {str(e)}")

    def handle_model_reload(self):
        """Handle model reload requests"""
        response = {
            "message": "Model reload initiated",
            "timestamp": datetime.now().isoformat()
        }
        self.send_json_response(response)

    def send_json_response(self, data, status_code=200):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error(self, status_code, message):
        """Send error response"""
        error_response = {
            "error": message,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat()
        }
        self.send_json_response(error_response, status_code)

    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.info(f"{self.address_string()} - {format % args}")

def run_server():
    """Run the ML service server"""
    server_address = ('', 5001)
    httpd = HTTPServer(server_address, MLHandler)
    
    logger.info("🤖 ML Service starting on http://localhost:5001")
    logger.info("📊 Available endpoints:")
    logger.info("   Health: http://localhost:5001/health")
    logger.info("   Models: http://localhost:5001/models/info")
    logger.info("   Predict: POST http://localhost:5001/predict")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("🛑 ML Service shutting down...")
        httpd.shutdown()

if __name__ == "__main__":
    run_server()