#!/usr/bin/env python3
"""
Coastal Threat ML Service
Flask-based microservice for AI-driven predictions and anomaly detection
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from prophet import Prophet
from sklearn.ensemble import IsolationForest
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for models
water_level_model = None
wind_model = None
rainfall_model = None
anomaly_detector = None
scaler = None

class CoastalThreatML:
    """Main ML service class for coastal threat predictions"""
    
    def __init__(self):
        self.models = {}
        self.anomaly_detector = None
        self.threat_classifier = None
        self.scaler = StandardScaler()
        self.classifier_scaler = StandardScaler()
        self.model_path = "models/"
        
        # Create models directory if it doesn't exist
        os.makedirs(self.model_path, exist_ok=True)
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize or load pre-trained models"""
        try:
            # Try to load existing models
            self._load_models()
            logger.info("Loaded existing models successfully")
        except Exception as e:
            logger.info(f"Could not load existing models: {e}")
            logger.info("Initializing new models...")
            self._create_new_models()
        
        # Ensure all models are initialized, even if loading failed
        if not self.threat_classifier:
            self.threat_classifier = DecisionTreeClassifier(
                random_state=42,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2
            )
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        # Load Prophet models
        for sensor_type in ['water_level', 'wind', 'rainfall']:
            model_file = os.path.join(self.model_path, f"{sensor_type}_prophet.pkl")
            if os.path.exists(model_file):
                self.models[sensor_type] = joblib.load(model_file)
        
        # Load anomaly detection model
        anomaly_file = os.path.join(self.model_path, "anomaly_detector.pkl")
        if os.path.exists(anomaly_file):
            self.anomaly_detector = joblib.load(anomaly_file)
        
        # Load scaler
        scaler_file = os.path.join(self.model_path, "scaler.pkl")
        if os.path.exists(scaler_file):
            self.scaler = joblib.load(scaler_file)
        
        # Load Decision Tree Classifier
        classifier_file = os.path.join(self.model_path, "threat_classifier.pkl")
        if os.path.exists(classifier_file):
            self.threat_classifier = joblib.load(classifier_file)
        
        # Load classifier scaler
        classifier_scaler_file = os.path.join(self.model_path, "classifier_scaler.pkl")
        if os.path.exists(classifier_scaler_file):
            self.classifier_scaler = joblib.load(classifier_scaler_file)
    
    def _create_new_models(self):
        """Create new models with default parameters"""
        # Create Prophet models for each sensor type
        sensor_types = ['water_level', 'wind', 'rainfall']
        for sensor_type in sensor_types:
            self.models[sensor_type] = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=True,
                seasonality_mode='multiplicative'
            )
        
        # Create anomaly detection model
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        
        # Create Decision Tree Classifier for threat severity classification
        self.threat_classifier = DecisionTreeClassifier(
            random_state=42,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2
        )
        
        # Initialize scalers
        self.scaler = StandardScaler()
        self.classifier_scaler = StandardScaler()
    
    def _prepare_data_for_prophet(self, data: List[Dict]) -> pd.DataFrame:
        """Prepare sensor data for Prophet forecasting"""
        if not data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Ensure required columns exist
        if 'timestamp' not in df.columns or 'value' not in df.columns:
            raise ValueError("Data must contain 'timestamp' and 'value' columns")
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Prophet requires 'ds' (date) and 'y' (value) columns
        df = df.rename(columns={'timestamp': 'ds', 'value': 'y'})
        
        # Sort by date
        df = df.sort_values('ds')
        
        # Remove duplicates and handle missing values
        df = df.drop_duplicates(subset=['ds'])
        df = df.dropna()
        
        return df
    
    def train_models(self, sensor_data: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Train models with new sensor data"""
        try:
            results = {}
            
            for sensor_type, data in sensor_data.items():
                if sensor_type not in self.models:
                    logger.warning(f"Unknown sensor type: {sensor_type}")
                    continue
                
                if not data:
                    logger.warning(f"No data provided for {sensor_type}")
                    continue
                
                # Prepare data for Prophet
                df = self._prepare_data_for_prophet(data)
                
                if len(df) < 10:
                    logger.warning(f"Insufficient data for {sensor_type}: {len(df)} points")
                    continue
                
                # Train Prophet model
                model = self.models[sensor_type]
                model.fit(df)
                
                # Save model
                model_file = os.path.join(self.model_path, f"{sensor_type}_prophet.pkl")
                joblib.dump(model, model_file)
                
                results[sensor_type] = {
                    'status': 'trained',
                    'data_points': len(df),
                    'date_range': {
                        'start': df['ds'].min().isoformat(),
                        'end': df['ds'].max().isoformat()
                    }
                }
                
                logger.info(f"Trained {sensor_type} model with {len(df)} data points")
            
            # Train anomaly detection model if we have enough data
            self._train_anomaly_detector(sensor_data)
            
            return results
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            raise
    
    def _train_anomaly_detector(self, sensor_data: Dict[str, List[Dict]]):
        """Train anomaly detection model"""
        try:
            # Combine all sensor data for anomaly detection
            all_data = []
            for sensor_type, data in sensor_data.items():
                for point in data:
                    all_data.append({
                        'timestamp': point.get('timestamp'),
                        'value': point.get('value'),
                        'type': sensor_type
                    })
            
            if len(all_data) < 50:
                logger.warning("Insufficient data for anomaly detection training")
                return
            
            # Convert to DataFrame
            df = pd.DataFrame(all_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Create features for anomaly detection
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month
            
            # Encode sensor type
            type_encoding = {'water_level': 0, 'wind': 1, 'rainfall': 2}
            df['type_encoded'] = df['type'].map(type_encoding)
            
            # Select features for anomaly detection
            features = ['value', 'hour', 'day_of_week', 'month', 'type_encoded']
            X = df[features].dropna()
            
            if len(X) < 50:
                logger.warning("Insufficient features for anomaly detection")
                return
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train anomaly detector
            self.anomaly_detector.fit(X_scaled)
            
            # Save models
            anomaly_file = os.path.join(self.model_path, "anomaly_detector.pkl")
            scaler_file = os.path.join(self.model_path, "scaler.pkl")
            
            joblib.dump(self.anomaly_detector, anomaly_file)
            joblib.dump(self.scaler, scaler_file)
            
            logger.info("Anomaly detection model trained successfully")
            
        except Exception as e:
            logger.error(f"Error training anomaly detector: {e}")
    
    def predict_water_levels(self, hours_ahead: int = 24) -> Dict[str, Any]:
        """Predict water levels for the next N hours"""
        try:
            if 'water_level' not in self.models:
                raise ValueError("Water level model not available")
            
            model = self.models['water_level']
            
            # Create future dates for prediction
            future_dates = model.make_future_dataframe(periods=hours_ahead, freq='H')
            
            # Make prediction
            forecast = model.predict(future_dates)
            
            # Extract future predictions
            future_forecast = forecast.tail(hours_ahead)
            
            # Format results
            predictions = []
            for _, row in future_forecast.iterrows():
                predictions.append({
                    'timestamp': row['ds'].isoformat(),
                    'predicted_value': round(row['yhat'], 3),
                    'lower_bound': round(row['yhat_lower'], 3),
                    'upper_bound': round(row['yhat_upper'], 3)
                })
            
            # Calculate flood risk
            flood_risk = self._calculate_flood_risk(predictions)
            
            return {
                'predictions': predictions,
                'flood_risk': flood_risk,
                'prediction_hours': hours_ahead,
                'model_confidence': 'high' if len(predictions) > 0 else 'low'
            }
            
        except Exception as e:
            logger.error(f"Error predicting water levels: {e}")
            raise
    
    def _calculate_flood_risk(self, predictions: List[Dict]) -> Dict[str, Any]:
        """Calculate flood risk based on water level predictions"""
        if not predictions:
            return {'risk_level': 'unknown', 'confidence': 0}
        
        # Get predicted values
        values = [p['predicted_value'] for p in predictions]
        max_value = max(values)
        
        # Define risk thresholds (in meters)
        risk_thresholds = {
            'low': 0.8,
            'medium': 1.2,
            'high': 1.5,
            'critical': 2.0
        }
        
        # Determine risk level
        if max_value >= risk_thresholds['critical']:
            risk_level = 'critical'
            confidence = 95
        elif max_value >= risk_thresholds['high']:
            risk_level = 'high'
            confidence = 85
        elif max_value >= risk_thresholds['medium']:
            risk_level = 'medium'
            confidence = 70
        elif max_value >= risk_thresholds['low']:
            risk_level = 'low'
            confidence = 60
        else:
            risk_level = 'minimal'
            confidence = 90
        
        return {
            'risk_level': risk_level,
            'confidence': confidence,
            'max_predicted_level': round(max_value, 3),
            'threshold_exceeded': max_value > risk_thresholds['low']
        }
    
    def detect_anomalies(self, sensor_data: List[Dict]) -> List[Dict]:
        """Detect anomalies in sensor data"""
        try:
            if not self.anomaly_detector or not self.scaler:
                raise ValueError("Anomaly detection model not available")
            
            if not sensor_data:
                return []
            
            # Convert to DataFrame
            df = pd.DataFrame(sensor_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Create features
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month
            
            # Encode sensor type
            type_encoding = {'water_level': 0, 'wind': 1, 'rainfall': 2}
            df['type_encoded'] = df['type'].map(type_encoding)
            
            # Select features
            features = ['value', 'hour', 'day_of_week', 'month', 'type_encoded']
            X = df[features].dropna()
            
            if len(X) < 1:
                return []
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Detect anomalies
            anomaly_scores = self.anomaly_detector.decision_function(X_scaled)
            anomaly_predictions = self.anomaly_detector.predict(X_scaled)
            
            # Find anomalies (predictions == -1)
            anomalies = []
            for i, (idx, row) in enumerate(df.iterrows()):
                if anomaly_predictions[i] == -1:
                    anomalies.append({
                        'timestamp': row['timestamp'].isoformat(),
                        'sensor_type': row['type'],
                        'value': row['value'],
                        'anomaly_score': round(anomaly_scores[i], 3),
                        'severity': 'high' if anomaly_scores[i] < -0.5 else 'medium',
                        'location': row.get('location', 'unknown'),
                        'description': f"Anomalous {row['type']} reading: {row['value']}"
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            raise
    
    def train_threat_classifier(self, training_data: List[Dict]) -> Dict[str, Any]:
        """Train Decision Tree Classifier for threat severity classification"""
        try:
            if not training_data or len(training_data) < 20:
                # Generate synthetic training data if not enough real data
                training_data = self._generate_synthetic_training_data()
            
            # Convert to DataFrame
            df = pd.DataFrame(training_data)
            
            # Create features for classification
            features = ['water_level', 'wind_speed', 'rainfall', 'temperature', 'pressure']
            
            # Ensure all features exist, fill missing with defaults
            for feature in features:
                if feature not in df.columns:
                    df[feature] = 0
            
            # Prepare features and target
            X = df[features]
            y = df['threat_level']  # 'low', 'medium', 'high', 'critical'
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            X_train_scaled = self.classifier_scaler.fit_transform(X_train)
            X_test_scaled = self.classifier_scaler.transform(X_test)
            
            # Train classifier
            self.threat_classifier.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.threat_classifier.predict(X_test_scaled)
            accuracy = (y_pred == y_test).mean()
            
            # Save models
            classifier_file = os.path.join(self.model_path, "threat_classifier.pkl")
            classifier_scaler_file = os.path.join(self.model_path, "classifier_scaler.pkl")
            
            joblib.dump(self.threat_classifier, classifier_file)
            joblib.dump(self.classifier_scaler, classifier_scaler_file)
            
            logger.info(f"Threat classifier trained with accuracy: {accuracy:.3f}")
            
            return {
                'status': 'trained',
                'accuracy': round(accuracy, 3),
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'features': features
            }
            
        except Exception as e:
            logger.error(f"Error training threat classifier: {e}")
            raise
    
    def classify_threat_severity(self, sensor_conditions: Dict) -> Dict[str, Any]:
        """Classify threat severity using Decision Tree Classifier"""
        try:
            if not self.threat_classifier or not self.classifier_scaler:
                # Train with synthetic data if model not available
                self.train_threat_classifier([])
            
            # Prepare input features
            features = {
                'water_level': sensor_conditions.get('water_level', 0.5),
                'wind_speed': sensor_conditions.get('wind_speed', 5.0),
                'rainfall': sensor_conditions.get('rainfall', 0.0),
                'temperature': sensor_conditions.get('temperature', 25.0),
                'pressure': sensor_conditions.get('pressure', 1013.0)
            }
            
            # Convert to DataFrame
            df = pd.DataFrame([features])
            
            # Scale features
            X_scaled = self.classifier_scaler.transform(df)
            
            # Make prediction
            prediction = self.threat_classifier.predict(X_scaled)[0]
            prediction_proba = self.threat_classifier.predict_proba(X_scaled)[0]
            
            # Get class labels
            classes = self.threat_classifier.classes_
            
            # Create probability dictionary
            probabilities = {}
            for i, cls in enumerate(classes):
                probabilities[cls] = round(prediction_proba[i], 3)
            
            # Get confidence (max probability)
            confidence = max(prediction_proba) * 100
            
            return {
                'predicted_threat_level': prediction,
                'confidence': round(confidence, 1),
                'probabilities': probabilities,
                'input_features': features,
                'decision_path': self._get_decision_path_explanation(features, prediction)
            }
            
        except Exception as e:
            logger.error(f"Error classifying threat severity: {e}")
            raise
    
    def _generate_synthetic_training_data(self) -> List[Dict]:
        """Generate synthetic training data for Decision Tree Classifier"""
        np.random.seed(42)
        data = []
        
        # Generate samples for each threat level
        threat_levels = ['low', 'medium', 'high', 'critical']
        samples_per_level = 100
        
        for threat_level in threat_levels:
            for _ in range(samples_per_level):
                if threat_level == 'low':
                    water_level = np.random.uniform(0.1, 0.7)
                    wind_speed = np.random.uniform(1, 15)
                    rainfall = np.random.uniform(0, 10)
                    temperature = np.random.uniform(20, 30)
                    pressure = np.random.uniform(1010, 1020)
                elif threat_level == 'medium':
                    water_level = np.random.uniform(0.6, 1.1)
                    wind_speed = np.random.uniform(10, 25)
                    rainfall = np.random.uniform(5, 40)
                    temperature = np.random.uniform(18, 32)
                    pressure = np.random.uniform(1005, 1015)
                elif threat_level == 'high':
                    water_level = np.random.uniform(1.0, 1.6)
                    wind_speed = np.random.uniform(20, 35)
                    rainfall = np.random.uniform(30, 80)
                    temperature = np.random.uniform(15, 35)
                    pressure = np.random.uniform(995, 1010)
                else:  # critical
                    water_level = np.random.uniform(1.5, 3.0)
                    wind_speed = np.random.uniform(30, 60)
                    rainfall = np.random.uniform(60, 150)
                    temperature = np.random.uniform(10, 40)
                    pressure = np.random.uniform(980, 1000)
                
                data.append({
                    'water_level': round(water_level, 2),
                    'wind_speed': round(wind_speed, 1),
                    'rainfall': round(rainfall, 1),
                    'temperature': round(temperature, 1),
                    'pressure': round(pressure, 1),
                    'threat_level': threat_level
                })
        
        return data
    
    def _get_decision_path_explanation(self, features: Dict, prediction: str) -> str:
        """Generate human-readable explanation of decision tree classification"""
        explanations = []
        
        if features['water_level'] > 1.5:
            explanations.append(f"High water level ({features['water_level']}m) indicates severe flooding risk")
        elif features['water_level'] > 1.0:
            explanations.append(f"Elevated water level ({features['water_level']}m) suggests moderate flood risk")
        
        if features['wind_speed'] > 30:
            explanations.append(f"Extreme wind speeds ({features['wind_speed']} m/s) pose significant threat")
        elif features['wind_speed'] > 20:
            explanations.append(f"High wind speeds ({features['wind_speed']} m/s) contribute to risk")
        
        if features['rainfall'] > 60:
            explanations.append(f"Heavy rainfall ({features['rainfall']} mm/h) increases flood probability")
        elif features['rainfall'] > 30:
            explanations.append(f"Moderate rainfall ({features['rainfall']} mm/h) adds to flood risk")
        
        if features['pressure'] < 995:
            explanations.append(f"Low atmospheric pressure ({features['pressure']} hPa) indicates storm conditions")
        
        if not explanations:
            explanations.append("Normal conditions detected across all parameters")
        
        return "; ".join(explanations)
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all models"""
        status = {
            'prophet_models': {
                'water_level_model': 'available' if 'water_level' in self.models else 'not_available',
                'wind_model': 'available' if 'wind' in self.models else 'not_available',
                'rainfall_model': 'available' if 'rainfall' in self.models else 'not_available'
            },
            'isolation_forest': {
                'anomaly_detector': 'available' if self.anomaly_detector else 'not_available',
                'scaler': 'available' if self.scaler else 'not_available'
            },
            'decision_tree_classifier': {
                'threat_classifier': 'available' if self.threat_classifier else 'not_available',
                'classifier_scaler': 'available' if self.classifier_scaler else 'not_available'
            },
            'last_updated': datetime.now().isoformat()
        }
        return status

# Initialize ML service
ml_service = CoastalThreatML()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'coastal-threat-ml',
        'timestamp': datetime.now().isoformat(),
        'models': ml_service.get_model_status()
    })

@app.route('/predict/water-levels', methods=['POST'])
def predict_water_levels():
    """Predict water levels for the next N hours"""
    try:
        data = request.get_json() or {}
        hours_ahead = data.get('hours_ahead', 24)
        
        # Validate input
        if not isinstance(hours_ahead, int) or hours_ahead < 1 or hours_ahead > 168:  # Max 1 week
            return jsonify({
                'error': 'Invalid hours_ahead parameter. Must be between 1 and 168.'
            }), 400
        
        # Make prediction
        prediction = ml_service.predict_water_levels(hours_ahead)
        
        return jsonify({
            'success': True,
            'data': prediction,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in water level prediction: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/detect/anomalies', methods=['POST'])
def detect_anomalies():
    """Detect anomalies in sensor data"""
    try:
        data = request.get_json()
        
        if not data or 'sensor_data' not in data:
            return jsonify({
                'error': 'sensor_data field is required'
            }), 400
        
        sensor_data = data['sensor_data']
        
        if not isinstance(sensor_data, list):
            return jsonify({
                'error': 'sensor_data must be a list'
            }), 400
        
        # Detect anomalies
        anomalies = ml_service.detect_anomalies(sensor_data)
        
        return jsonify({
            'success': True,
            'data': {
                'anomalies': anomalies,
                'total_anomalies': len(anomalies),
                'data_points_analyzed': len(sensor_data)
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in anomaly detection: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/train', methods=['POST'])
def train_models():
    """Train models with new sensor data"""
    try:
        data = request.get_json()
        
        if not data or 'sensor_data' not in data:
            return jsonify({
                'error': 'sensor_data field is required'
            }), 400
        
        sensor_data = data['sensor_data']
        
        if not isinstance(sensor_data, dict):
            return jsonify({
                'error': 'sensor_data must be a dictionary with sensor types as keys'
            }), 400
        
        # Train models
        results = ml_service.train_models(sensor_data)
        
        return jsonify({
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in model training: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get model status"""
    try:
        status = ml_service.get_model_status()
        
        return jsonify({
            'success': True,
            'data': status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/predict/flood-risk', methods=['POST'])
def predict_flood_risk():
    """Predict flood risk based on current conditions"""
    try:
        data = request.get_json() or {}
        
        # Get current sensor data
        current_data = data.get('current_data', {})
        
        # Make water level prediction
        water_prediction = ml_service.predict_water_levels(24)
        
        # Calculate overall flood risk
        flood_risk = water_prediction['flood_risk']
        
        # Add additional risk factors if available
        additional_risk_factors = []
        
        if 'rainfall' in current_data:
            rainfall = current_data['rainfall']
            if rainfall > 50:  # mm/h
                additional_risk_factors.append({
                    'factor': 'heavy_rainfall',
                    'severity': 'high' if rainfall > 80 else 'medium',
                    'description': f"Heavy rainfall: {rainfall} mm/h"
                })
        
        if 'wind' in current_data:
            wind = current_data['wind']
            if wind > 20:  # m/s
                additional_risk_factors.append({
                    'factor': 'high_winds',
                    'severity': 'high' if wind > 30 else 'medium',
                    'description': f"High winds: {wind} m/s"
                })
        
        # Calculate overall risk
        overall_risk = self._calculate_overall_risk(flood_risk, additional_risk_factors)
        
        return jsonify({
            'success': True,
            'data': {
                'overall_risk': overall_risk,
                'water_level_risk': flood_risk,
                'additional_factors': additional_risk_factors,
                'recommendations': self._generate_recommendations(overall_risk),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in flood risk prediction: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/classify/threat-severity', methods=['POST'])
def classify_threat_severity():
    """Classify threat severity using Decision Tree Classifier"""
    try:
        data = request.get_json()
        
        if not data or 'sensor_conditions' not in data:
            return jsonify({
                'error': 'sensor_conditions field is required'
            }), 400
        
        sensor_conditions = data['sensor_conditions']
        
        if not isinstance(sensor_conditions, dict):
            return jsonify({
                'error': 'sensor_conditions must be a dictionary'
            }), 400
        
        # Classify threat severity
        classification = ml_service.classify_threat_severity(sensor_conditions)
        
        return jsonify({
            'success': True,
            'data': classification,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in threat classification: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/train/classifier', methods=['POST'])
def train_threat_classifier():
    """Train Decision Tree Classifier with training data"""
    try:
        data = request.get_json() or {}
        training_data = data.get('training_data', [])
        
        # Train classifier
        results = ml_service.train_threat_classifier(training_data)
        
        return jsonify({
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error training threat classifier: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def _calculate_overall_risk(self, water_risk: Dict, additional_factors: List) -> Dict:
    """Calculate overall flood risk considering multiple factors"""
    # Base risk from water levels
    risk_scores = {
        'minimal': 1,
        'low': 2,
        'medium': 3,
        'high': 4,
        'critical': 5
    }
    
    base_score = risk_scores.get(water_risk['risk_level'], 1)
    
    # Add risk from additional factors
    for factor in additional_factors:
        if factor['severity'] == 'high':
            base_score += 2
        elif factor['severity'] == 'medium':
            base_score += 1
    
    # Determine overall risk level
    if base_score >= 7:
        overall_level = 'critical'
    elif base_score >= 5:
        overall_level = 'high'
    elif base_score >= 3:
        overall_level = 'medium'
    elif base_score >= 2:
        overall_level = 'low'
    else:
        overall_level = 'minimal'
    
    return {
        'level': overall_level,
        'score': base_score,
        'confidence': water_risk['confidence']
    }

def _generate_recommendations(self, risk: Dict) -> List[str]:
    """Generate recommendations based on risk level"""
    recommendations = []
    
    if risk['level'] == 'critical':
        recommendations.extend([
            "Immediate evacuation recommended",
            "Emergency services should be notified",
            "Avoid all coastal areas",
            "Monitor official emergency broadcasts"
        ])
    elif risk['level'] == 'high':
        recommendations.extend([
            "Prepare for potential evacuation",
            "Secure outdoor items",
            "Avoid unnecessary travel to coastal areas",
            "Stay informed about weather conditions"
        ])
    elif risk['level'] == 'medium':
        recommendations.extend([
            "Monitor weather conditions",
            "Prepare emergency supplies",
            "Stay away from flood-prone areas",
            "Follow local authority guidance"
        ])
    elif risk['level'] == 'low':
        recommendations.extend([
            "Normal conditions - no immediate action required",
            "Continue monitoring weather updates",
            "Be aware of changing conditions"
        ])
    
    return recommendations

if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
