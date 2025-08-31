#!/usr/bin/env python3
"""
Simplified Tide Model Training Script
Run this to train tide prediction models on your Supabase data
"""

import os
import sys
import logging
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tide_training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main training function"""
    try:
        logger.info("🚀 Starting Tide Model Training...")
        
        # Check if we're in the right directory
        if not os.path.exists('config'):
            logger.error("❌ Please run this script from the ml-service directory")
            logger.info("💡 Run: cd ml-service && python train_tide_models.py")
            return
        
        # Import required modules
        try:
            from config.supabase_config import get_supabase_client, test_supabase_connection
            from utils.data_preprocessing import preprocess_tide_data, create_features
            from utils.model_evaluation import evaluate_model
            from utils.model_persistence import save_model
        except ImportError as e:
            logger.error(f"❌ Import error: {e}")
            logger.info("💡 Make sure all required packages are installed:")
            logger.info("   pip install -r requirements-simple.txt")
            return
        
        # Test Supabase connection
        logger.info("🔌 Testing Supabase connection...")
        supabase = get_supabase_client()
        
        # Fetch tide data from tide_data_raw table
        logger.info("📊 Fetching tide data from Supabase...")
        try:
            response = supabase.table('tide_data_raw').select('*').execute()
            if not response.data:
                logger.error("❌ No tide data found in Supabase")
                logger.info("💡 Make sure you've uploaded your CSV data to the tide_data_raw table")
                return
            
            logger.info(f"✅ Fetched {len(response.data)} tide records")
            
        except Exception as e:
            logger.error(f"❌ Error fetching tide data: {e}")
            return
        
        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(response.data)
        logger.info(f"📊 Data shape: {df.shape}")
        logger.info(f"📊 Columns: {list(df.columns)}")
        
        # Show sample data
        logger.info("📋 Sample data:")
        logger.info(df.head())
        
        # Basic preprocessing for tide_data_raw structure
        logger.info("🔧 Preprocessing data...")
        
        # Convert date columns if they exist
        if 'date_1' in df.columns:
            # Convert numeric dates to proper format
            df['date_1'] = pd.to_numeric(df['date_1'], errors='coerce')
            df['date_2'] = pd.to_numeric(df['date_2'], errors='coerce')
        
        # Convert height columns to numeric
        height_cols = ['height_1', 'height_2', 'height_3', 'height_4']
        for col in height_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Convert time columns
        time_cols = ['time_1', 'time_2', 'time_3', 'time_4']
        for col in time_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Handle missing values
        df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        # Create basic features from existing data
        logger.info("🔧 Creating features...")
        
        # Use component data as features
        component_cols = [col for col in df.columns if col.startswith('component_')]
        
        # Create numeric features from components
        for i in range(1, 11):
            col = f'component_{i}'
            if col in df.columns:
                # Try to extract numeric values from components
                df[f'{col}_numeric'] = pd.to_numeric(df[col].astype(str).str.extract(r'(\d+)')[0], errors='coerce')
        
        # Create boolean features
        if 'has_time_data' in df.columns:
            df['has_time_data_bool'] = df['has_time_data'].astype(int)
        if 'has_height_data' in df.columns:
            df['has_height_data_bool'] = df['has_height_data'].astype(int)
        if 'has_date_data' in df.columns:
            df['has_date_data_bool'] = df['has_date_data'].astype(int)
        
        # Prepare features and targets
        # Use all numeric columns as features, excluding metadata
        exclude_cols = ['id', 'port_name', 'raw_line', 'created_at', 'updated_at', 'line_number']
        feature_cols = [col for col in df.columns if col not in exclude_cols and df[col].dtype in ['int64', 'float64']]
        
        if not feature_cols:
            logger.warning("⚠️  No numeric feature columns found, using basic features")
            feature_cols = ['line_number', 'components_count']
            if 'has_time_data_bool' in df.columns:
                feature_cols.append('has_time_data_bool')
            if 'has_height_data_bool' in df.columns:
                feature_cols.append('has_height_data_bool')
        
        X = df[feature_cols].fillna(0)
        
        # For targets, we'll try to predict components_count or create synthetic targets
        if 'components_count' in df.columns:
            y = df[['components_count']]
            target_name = 'components_count'
        else:
            # Create synthetic target based on available data
            logger.info("🎯 Creating synthetic target for demonstration...")
            y = pd.DataFrame({
                'synthetic_target': df['line_number'] + df.get('components_count', 0)
            })
            target_name = 'synthetic_target'
        
        logger.info(f"🎯 Features: {X.shape}, Targets: {y.shape}")
        logger.info(f"🔍 Feature columns: {feature_cols}")
        logger.info(f"🎯 Target column: {target_name}")
        
        # Split data
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train simple models
        logger.info("🎯 Training models...")
        
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.linear_model import LinearRegression
        
        models = {}
        results = {}
        
        # Train Random Forest
        logger.info(f"🌳 Training Random Forest for {target_name}...")
        
        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_model.fit(X_train, y_train[target_name])
        
        # Make predictions
        y_pred = rf_model.predict(X_test)
        
        # Evaluate
        metrics = evaluate_model(y_test[target_name], y_pred)
        
        # Store results
        model_name = f"random_forest_{target_name}"
        models[model_name] = rf_model
        results[model_name] = {
            'metrics': metrics,
            'training_date': datetime.now().isoformat(),
            'data_shape': X.shape,
            'test_size': len(X_test),
            'target': target_name
        }
        
        logger.info(f"✅ {model_name} - R²: {metrics['r2_score']:.4f}, RMSE: {metrics['rmse']:.4f}")
        
        # Train Linear Regression for comparison
        logger.info("📈 Training Linear Regression...")
        lr_model = LinearRegression()
        lr_model.fit(X_train, y_train[target_name])
        
        y_pred_lr = lr_model.predict(X_test)
        metrics_lr = evaluate_model(y_test[target_name], y_pred_lr)
        
        models['linear_regression'] = lr_model
        results['linear_regression'] = {
            'metrics': metrics_lr,
            'training_date': datetime.now().isoformat(),
            'data_shape': X.shape,
            'test_size': len(X_test),
            'target': target_name
        }
        
        logger.info(f"✅ Linear Regression - R²: {metrics_lr['r2_score']:.4f}, RMSE: {metrics_lr['rmse']:.4f}")
        
        # Save models
        logger.info("💾 Saving trained models...")
        os.makedirs('models', exist_ok=True)
        
        for model_name, model in models.items():
            model_path = f"models/{model_name}.joblib"
            save_model(model, model_path)
            logger.info(f"💾 Saved: {model_path}")
        
        # Save results
        import json
        results_path = "models/training_results.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        logger.info(f"💾 Saved results: {results_path}")
        
        # Generate summary
        logger.info("📊 Training Summary:")
        logger.info(f"   Total models trained: {len(models)}")
        logger.info(f"   Features used: {len(feature_cols)}")
        logger.info(f"   Training samples: {len(X_train)}")
        logger.info(f"   Test samples: {len(X_test)}")
        logger.info(f"   Target variable: {target_name}")
        
        # Show best model
        best_model = max(results.items(), key=lambda x: x[1]['metrics']['r2_score'])
        logger.info(f"🏆 Best model: {best_model[0]} (R²: {best_model[1]['metrics']['r2_score']:.4f})")
        
        # Show feature importance for Random Forest
        if 'random_forest' in models:
            rf_model = models['random_forest']
            feature_importance = dict(zip(feature_cols, rf_model.feature_importances_))
            logger.info("🔍 Top 5 most important features:")
            sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            for i, (feature, importance) in enumerate(sorted_features[:5]):
                logger.info(f"   {i+1}. {feature}: {importance:.4f}")
        
        logger.info("✅ Training completed successfully!")
        logger.info("💡 Next steps:")
        logger.info("   1. Check the 'models/' directory for saved models")
        logger.info("   2. Review 'tide_training.log' for detailed logs")
        logger.info("   3. Use the models for predictions in your application")
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    main()
