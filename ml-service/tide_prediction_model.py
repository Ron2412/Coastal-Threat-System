#!/usr/bin/env python3
"""
Tide Prediction ML Model Training Pipeline
Trains multiple models on tide data from Supabase for coastal threat prediction
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
import joblib

# Add the parent directory to the path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.supabase_config import get_supabase_client
from utils.data_preprocessing import preprocess_tide_data, create_features
from utils.model_evaluation import evaluate_model, plot_predictions
from utils.model_persistence import save_model, load_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tide_model_training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class TidePredictionModel:
    """
    Main class for training tide prediction models
    """
    
    def __init__(self, config_path: str = "config/model_config.json"):
        self.config = self._load_config(config_path)
        self.supabase = get_supabase_client()
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.training_history = {}
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load model configuration"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Default configuration for tide prediction models"""
        return {
            "models": {
                "random_forest": {
                    "n_estimators": 100,
                    "max_depth": 10,
                    "random_state": 42
                },
                "gradient_boosting": {
                    "n_estimators": 100,
                    "max_depth": 6,
                    "learning_rate": 0.1,
                    "random_state": 42
                },
                "linear_regression": {
                    "fit_intercept": True
                },
                "ridge_regression": {
                    "alpha": 1.0,
                    "fit_intercept": True
                },
                "svr": {
                    "kernel": "rbf",
                    "C": 1.0,
                    "epsilon": 0.1
                }
            },
            "feature_engineering": {
                "lag_features": [1, 2, 3, 6, 12, 24],  # Hours
                "rolling_windows": [3, 6, 12, 24],      # Hours
                "seasonal_features": True,
                "weather_features": False
            },
            "training": {
                "test_size": 0.2,
                "validation_size": 0.1,
                "random_state": 42,
                "cross_validation_folds": 5
            },
            "preprocessing": {
                "scaling": "standard",  # "standard", "minmax", "none"
                "handle_missing": "interpolate",  # "drop", "interpolate", "forward_fill"
                "outlier_detection": True,
                "outlier_threshold": 3.0
            }
        }
    
    def fetch_tide_data(self, port_name: Optional[str] = None, 
                       start_date: Optional[str] = None, 
                       end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Fetch tide data from Supabase
        """
        try:
            logger.info(f"Fetching tide data for port: {port_name or 'all'}")
            
            # Build query
            query = self.supabase.table('tide_data').select('*')
            
            if port_name:
                query = query.ilike('port_name', f'%{port_name}%')
            
            if start_date:
                query = query.gte('date_1', start_date)
            
            if end_date:
                query = query.lte('date_1', end_date)
            
            # Execute query
            response = query.execute()
            
            if response.data:
                df = pd.DataFrame(response.data)
                logger.info(f"Fetched {len(df)} records from Supabase")
                return df
            else:
                logger.warning("No data returned from Supabase")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Error fetching data from Supabase: {e}")
            raise
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Preprocess tide data for model training
        """
        try:
            logger.info("Preprocessing tide data...")
            
            # Preprocess the data
            processed_df = preprocess_tide_data(df, self.config["preprocessing"])
            
            # Create features
            feature_df = create_features(processed_df, self.config["feature_engineering"])
            
            # Separate features and target
            target_columns = ['height_1', 'height_2', 'height_3', 'height_4']
            feature_columns = [col for col in feature_df.columns if col not in target_columns + ['id', 'port_name', 'raw_line', 'created_at']]
            
            X = feature_df[feature_columns]
            y = feature_df[target_columns]
            
            # Handle missing values
            X = X.fillna(method='ffill').fillna(method='bfill').fillna(0)
            y = y.fillna(method='ffill').fillna(method='bfill').fillna(0)
            
            logger.info(f"Preprocessing complete. Features: {X.shape}, Targets: {y.shape}")
            return X, y
            
        except Exception as e:
            logger.error(f"Error in data preprocessing: {e}")
            raise
    
    def train_models(self, X: pd.DataFrame, y: pd.DataFrame) -> Dict[str, Any]:
        """
        Train multiple models on the tide data
        """
        try:
            logger.info("Starting model training...")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=self.config["training"]["test_size"],
                random_state=self.config["training"]["random_state"]
            )
            
            # Initialize scaler
            if self.config["preprocessing"]["scaling"] == "standard":
                scaler = StandardScaler()
            elif self.config["preprocessing"]["scaling"] == "minmax":
                scaler = MinMaxScaler()
            else:
                scaler = None
            
            # Scale features if needed
            if scaler:
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                self.scalers['feature_scaler'] = scaler
            else:
                X_train_scaled = X_train
                X_test_scaled = X_test
            
            # Train models for each tide height
            for tide_num in range(4):
                tide_col = f'height_{tide_num + 1}'
                logger.info(f"Training models for {tide_col}")
                
                y_train_tide = y_train[tide_col]
                y_test_tide = y_test[tide_col]
                
                # Train each model type
                for model_name, model_params in self.config["models"].items():
                    try:
                        model_key = f"{model_name}_tide_{tide_num + 1}"
                        
                        # Initialize model
                        if model_name == "random_forest":
                            model = RandomForestRegressor(**model_params)
                        elif model_name == "gradient_boosting":
                            model = GradientBoostingRegressor(**model_params)
                        elif model_name == "linear_regression":
                            model = LinearRegression(**model_params)
                        elif model_name == "ridge_regression":
                            model = Ridge(**model_params)
                        elif model_name == "svr":
                            model = SVR(**model_params)
                        else:
                            logger.warning(f"Unknown model type: {model_name}")
                            continue
                        
                        # Train model
                        logger.info(f"Training {model_key}...")
                        model.fit(X_train_scaled, y_train_tide)
                        
                        # Make predictions
                        y_pred = model.predict(X_test_scaled)
                        
                        # Evaluate model
                        metrics = evaluate_model(y_test_tide, y_pred)
                        
                        # Store model and results
                        self.models[model_key] = model
                        self.training_history[model_key] = {
                            'metrics': metrics,
                            'training_date': datetime.now().isoformat(),
                            'data_shape': X.shape,
                            'test_size': len(X_test)
                        }
                        
                        # Store feature importance if available
                        if hasattr(model, 'feature_importances_'):
                            self.feature_importance[model_key] = dict(zip(X.columns, model.feature_importances_))
                        
                        logger.info(f"{model_key} trained successfully. R²: {metrics['r2_score']:.4f}")
                        
                    except Exception as e:
                        logger.error(f"Error training {model_name} for {tide_col}: {e}")
                        continue
            
            logger.info(f"Model training complete. Trained {len(self.models)} models")
            return self.training_history
            
        except Exception as e:
            logger.error(f"Error in model training: {e}")
            raise
    
    def save_trained_models(self, output_dir: str = "models") -> None:
        """
        Save all trained models and metadata
        """
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            # Save models
            for model_name, model in self.models.items():
                model_path = os.path.join(output_dir, f"{model_name}.joblib")
                save_model(model, model_path)
                logger.info(f"Saved model: {model_path}")
            
            # Save scalers
            for scaler_name, scaler in self.scalers.items():
                scaler_path = os.path.join(output_dir, f"{scaler_name}.joblib")
                save_model(scaler, scaler_path)
                logger.info(f"Saved scaler: {scaler_path}")
            
            # Save training history
            history_path = os.path.join(output_dir, "training_history.json")
            with open(history_path, 'w') as f:
                json.dump(self.training_history, f, indent=2, default=str)
            logger.info(f"Saved training history: {history_path}")
            
            # Save feature importance
            if self.feature_importance:
                importance_path = os.path.join(output_dir, "feature_importance.json")
                with open(importance_path, 'w') as f:
                    json.dump(self.feature_importance, f, indent=2, default=str)
                logger.info(f"Saved feature importance: {importance_path}")
            
            # Save configuration
            config_path = os.path.join(output_dir, "model_config.json")
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Saved configuration: {config_path}")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
            raise
    
    def generate_training_report(self, output_dir: str = "reports") -> str:
        """
        Generate a comprehensive training report
        """
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            report_path = os.path.join(output_dir, f"training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
            
            # Create HTML report
            html_content = self._create_html_report()
            
            with open(report_path, 'w') as f:
                f.write(html_content)
            
            logger.info(f"Training report generated: {report_path}")
            return report_path
            
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            raise
    
    def _create_html_report(self) -> str:
        """Create HTML content for training report"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tide Prediction Model Training Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .model-section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
                .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; }}
                .metric {{ background-color: #f8f9fa; padding: 10px; border-radius: 3px; text-align: center; }}
                .metric-value {{ font-size: 24px; font-weight: bold; color: #007bff; }}
                table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🌊 Tide Prediction Model Training Report</h1>
                <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>Total Models Trained:</strong> {len(self.models)}</p>
            </div>
        """
        
        # Add model results
        for model_name, history in self.training_history.items():
            metrics = history['metrics']
            html += f"""
            <div class="model-section">
                <h2>🚀 {model_name}</h2>
                <p><strong>Training Date:</strong> {history['training_date']}</p>
                <p><strong>Data Shape:</strong> {history['data_shape']}</p>
                <p><strong>Test Size:</strong> {history['test_size']}</p>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">{metrics['r2_score']:.4f}</div>
                        <div>R² Score</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">{metrics['mae']:.4f}</div>
                        <div>MAE</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">{metrics['rmse']:.4f}</div>
                        <div>RMSE</div>
                    </div>
                </div>
            </div>
            """
        
        html += """
        </body>
        </html>
        """
        
        return html

def main():
    """Main training pipeline"""
    try:
        logger.info("🚀 Starting Tide Prediction Model Training Pipeline")
        
        # Initialize model trainer
        trainer = TidePredictionModel()
        
        # Fetch data from Supabase
        logger.info("📊 Fetching tide data from Supabase...")
        tide_data = trainer.fetch_tide_data()
        
        if tide_data.empty:
            logger.error("No tide data found. Please check your Supabase connection and data.")
            return
        
        # Preprocess data
        logger.info("🔧 Preprocessing tide data...")
        X, y = trainer.preprocess_data(tide_data)
        
        # Train models
        logger.info("🎯 Training prediction models...")
        training_results = trainer.train_models(X, y)
        
        # Save models
        logger.info("💾 Saving trained models...")
        trainer.save_trained_models()
        
        # Generate report
        logger.info("📋 Generating training report...")
        report_path = trainer.generate_training_report()
        
        logger.info("✅ Training pipeline completed successfully!")
        logger.info(f"📊 Training results: {len(training_results)} models trained")
        logger.info(f"📄 Report generated: {report_path}")
        
    except Exception as e:
        logger.error(f"❌ Training pipeline failed: {e}")
        raise

if __name__ == "__main__":
    main()
