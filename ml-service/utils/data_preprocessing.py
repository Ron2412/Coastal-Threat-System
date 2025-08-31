"""
Data Preprocessing Utilities for Tide Data
Handles cleaning, feature engineering, and preparation for ML models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)

def preprocess_tide_data(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Preprocess raw tide data from Supabase for model training
    
    Args:
        data: List of dictionaries from Supabase
    
    Returns:
        Preprocessed DataFrame
    """
    try:
        logger.info("Starting data preprocessing...")
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Convert date columns if they exist
        if 'date_1' in df.columns:
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
        
        logger.info(f"Preprocessing complete. Shape: {df.shape}")
        return df
        
    except Exception as e:
        logger.error(f"Error in data preprocessing: {e}")
        raise

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create features from preprocessed tide data
    
    Args:
        df: Preprocessed DataFrame
    
    Returns:
        DataFrame with engineered features
    """
    try:
        logger.info("Creating features...")
        
        # Create a copy
        features_df = df.copy()
        
        # Use component data as features
        component_cols = [col for col in df.columns if col.startswith('component_')]
        
        # Create numeric features from components
        for i in range(1, 11):
            col = f'component_{i}'
            if col in df.columns:
                # Try to extract numeric values from components
                features_df[f'{col}_numeric'] = pd.to_numeric(df[col].astype(str).str.extract(r'(\d+)')[0], errors='coerce')
        
        # Create boolean features
        if 'has_time_data' in df.columns:
            features_df['has_time_data_bool'] = df['has_time_data'].astype(int)
        if 'has_height_data' in df.columns:
            features_df['has_height_data_bool'] = df['has_height_data'].astype(int)
        if 'has_date_data' in df.columns:
            features_df['has_date_data_bool'] = df['has_date_data'].astype(int)
        
        # Prepare features and targets
        # Use all numeric columns as features, excluding metadata
        exclude_cols = ['id', 'port_name', 'raw_line', 'created_at', 'updated_at', 'line_number']
        feature_cols = [col for col in features_df.columns if col not in exclude_cols and features_df[col].dtype in ['int64', 'float64']]
        
        if not feature_cols:
            logger.warning("⚠️  No numeric feature columns found, using basic features")
            feature_cols = ['line_number', 'components_count']
            if 'has_time_data_bool' in features_df.columns:
                feature_cols.append('has_time_data_bool')
            if 'has_height_data_bool' in features_df.columns:
                feature_cols.append('has_height_data_bool')
        
        # Select only feature columns
        final_features = features_df[feature_cols].fillna(0)
        
        logger.info(f"Feature creation complete. Shape: {final_features.shape}")
        return final_features
        
    except Exception as e:
        logger.error(f"Error creating features: {e}")
        raise

def handle_outliers(df: pd.DataFrame, columns: List[str], threshold: float = 3.0) -> pd.DataFrame:
    """
    Handle outliers in specified columns using IQR method
    """
    try:
        processed_df = df.copy()
        
        for col in columns:
            if col in processed_df.columns:
                Q1 = processed_df[col].quantile(0.25)
                Q3 = processed_df[col].quantile(0.75)
                IQR = Q3 - Q1
                
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                
                # Replace outliers with bounds
                processed_df[col] = processed_df[col].clip(lower=lower_bound, upper=upper_bound)
                
                outliers_count = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
                if outliers_count > 0:
                    logger.info(f"Handled {outliers_count} outliers in {col}")
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error handling outliers: {e}")
        return df

def create_time_features(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
    """
    Create time-based features from date column
    """
    try:
        processed_df = df.copy()
        
        if date_column in processed_df.columns:
            # Extract time components
            processed_df[f'{date_column}_year'] = processed_df[date_column].dt.year
            processed_df[f'{date_column}_month'] = processed_df[date_column].dt.month
            processed_df[f'{date_column}_day'] = processed_df[date_column].dt.day
            processed_df[f'{date_column}_dayofweek'] = processed_df[date_column].dt.dayofweek
            processed_df[f'{date_column}_quarter'] = processed_df[date_column].dt.quarter
            
            # Create cyclical features
            processed_df[f'{date_column}_month_sin'] = np.sin(2 * np.pi * processed_df[f'{date_column}_month'] / 12)
            processed_df[f'{date_column}_month_cos'] = np.cos(2 * np.pi * processed_df[f'{date_column}_month'] / 12)
            processed_df[f'{date_column}_day_sin'] = np.sin(2 * np.pi * processed_df[f'{date_column}_day'] / 31)
            processed_df[f'{date_column}_day_cos'] = np.cos(2 * np.pi * processed_df[f'{date_column}_day'] / 31)
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error creating time features: {e}")
        return df

def create_lag_features(df: pd.DataFrame, columns: List[str], lags: List[int]) -> pd.DataFrame:
    """
    Create lag features for time series data
    """
    try:
        processed_df = df.copy()
        
        for col in columns:
            if col in processed_df.columns:
                for lag in lags:
                    processed_df[f'{col}_lag_{lag}'] = processed_df[col].shift(lag)
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error creating lag features: {e}")
        return df

def create_rolling_features(df: pd.DataFrame, columns: List[str], windows: List[int]) -> pd.DataFrame:
    """
    Create rolling window features
    """
    try:
        processed_df = df.copy()
        
        for col in columns:
            if col in processed_df.columns:
                for window in windows:
                    processed_df[f'{col}_rolling_mean_{window}'] = processed_df[col].rolling(window=window).mean()
                    processed_df[f'{col}_rolling_std_{window}'] = processed_df[col].rolling(window=window).std()
                    processed_df[f'{col}_rolling_min_{window}'] = processed_df[col].rolling(window=window).min()
                    processed_df[f'{col}_rolling_max_{window}'] = processed_df[col].rolling(window=window).max()
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error creating rolling features: {e}")
        return df

def create_seasonal_features(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
    """
    Create seasonal features
    """
    try:
        processed_df = df.copy()
        
        if date_column in processed_df.columns:
            # Extract seasonal components
            processed_df[f'{date_column}_season'] = pd.cut(
                processed_df[date_column].dt.month,
                bins=[0, 3, 6, 9, 12],
                labels=['Winter', 'Spring', 'Summer', 'Fall']
            )
            
            # Create dummy variables for seasons
            season_dummies = pd.get_dummies(processed_df[f'{date_column}_season'], prefix='season')
            processed_df = pd.concat([processed_df, season_dummies], axis=1)
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error creating seasonal features: {e}")
        return df

def create_interaction_features(df: pd.DataFrame, feature_pairs: List[Tuple[str, str]]) -> pd.DataFrame:
    """
    Create interaction features between pairs of features
    """
    try:
        processed_df = df.copy()
        
        for feat1, feat2 in feature_pairs:
            if feat1 in processed_df.columns and feat2 in processed_df.columns:
                processed_df[f'{feat1}_{feat2}_interaction'] = processed_df[feat1] * processed_df[feat2]
                processed_df[f'{feat1}_{feat2}_ratio'] = processed_df[feat1] / (processed_df[feat2] + 1e-8)
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error creating interaction features: {e}")
        return df

def create_statistical_features(df: pd.DataFrame, columns: List[str], windows: List[int]) -> pd.DataFrame:
    """
    Create statistical features
    """
    try:
        processed_df = df.copy()
        
        for col in columns:
            if col in processed_df.columns:
                for window in windows:
                    # Rolling statistics
                    processed_df[f'{col}_rolling_skew_{window}'] = processed_df[col].rolling(window=window).skew()
                    processed_df[f'{col}_rolling_kurt_{window}'] = processed_df[col].rolling(window=window).kurt()
                    
                    # Expanding statistics
                    processed_df[f'{col}_expanding_mean'] = processed_df[col].expanding().mean()
                    processed_df[f'{col}_expanding_std'] = processed_df[col].expanding().std()
        
        return processed_df
        
    except Exception as e:
        logger.error(f"Error creating statistical features: {e}")
        return df

def validate_features(df: pd.DataFrame) -> bool:
    """
    Validate that features are suitable for ML models
    """
    try:
        # Check for infinite values
        if np.isinf(df.select_dtypes(include=[np.number])).any().any():
            logger.warning("Infinite values detected in features")
            return False
        
        # Check for NaN values
        if df.isnull().any().any():
            logger.warning("NaN values detected in features")
            return False
        
        # Check for constant columns
        constant_cols = df.columns[df.nunique() == 1]
        if len(constant_cols) > 0:
            logger.warning(f"Constant columns detected: {constant_cols.tolist()}")
            return False
        
        logger.info("Feature validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Error in feature validation: {e}")
        return False
