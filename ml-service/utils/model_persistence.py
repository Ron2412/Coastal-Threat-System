"""
Model Persistence Utilities for Tide Prediction Models
Handles saving, loading, and versioning of trained models
"""

import os
import json
import pickle
import joblib
import hashlib
from datetime import datetime
from typing import Any, Dict, Optional, Union
import logging

logger = logging.getLogger(__name__)

def save_model(model: Any, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """
    Save a trained model to disk
    
    Args:
        model: The trained model object
        file_path: Path where to save the model
        metadata: Optional metadata to save with the model
    
    Returns:
        Path to the saved model file
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Determine file format based on extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.joblib':
            # Save using joblib (recommended for scikit-learn models)
            joblib.dump(model, file_path)
            logger.info(f"Model saved using joblib: {file_path}")
            
        elif file_ext == '.pkl':
            # Save using pickle
            with open(file_path, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"Model saved using pickle: {file_path}")
            
        elif file_ext == '.h5':
            # Save using h5py (for Keras models)
            if hasattr(model, 'save'):
                model.save(file_path)
                logger.info(f"Model saved using h5: {file_path}")
            else:
                raise ValueError("Model doesn't support h5 format")
                
        else:
            # Default to joblib
            file_path = file_path + '.joblib' if '.' not in file_path else file_path.replace(file_ext, '.joblib')
            joblib.dump(model, file_path)
            logger.info(f"Model saved using joblib (default): {file_path}")
        
        # Save metadata if provided
        if metadata:
            metadata_path = file_path + '.metadata.json'
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            logger.info(f"Metadata saved: {metadata_path}")
        
        # Save model info
        model_info = {
            'file_path': file_path,
            'file_size': os.path.getsize(file_path),
            'created_at': datetime.now().isoformat(),
            'model_type': type(model).__name__,
            'hash': calculate_model_hash(file_path)
        }
        
        info_path = file_path + '.info.json'
        with open(info_path, 'w') as f:
            json.dump(model_info, f, indent=2)
        
        logger.info(f"Model info saved: {info_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error saving model: {e}")
        raise

def load_model(file_path: str) -> Any:
    """
    Load a trained model from disk
    
    Args:
        file_path: Path to the saved model file
    
    Returns:
        The loaded model object
    """
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Model file not found: {file_path}")
        
        # Determine file format based on extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.joblib':
            # Load using joblib
            model = joblib.load(file_path)
            logger.info(f"Model loaded using joblib: {file_path}")
            
        elif file_ext == '.pkl':
            # Load using pickle
            with open(file_path, 'rb') as f:
                model = pickle.load(f)
            logger.info(f"Model loaded using pickle: {file_path}")
            
        elif file_ext == '.h5':
            # Load using Keras
            try:
                from tensorflow import keras
                model = keras.models.load_model(file_path)
                logger.info(f"Model loaded using Keras: {file_path}")
            except ImportError:
                raise ImportError("TensorFlow/Keras required to load h5 models")
                
        else:
            # Try to determine format and load
            if os.path.exists(file_path + '.joblib'):
                model = joblib.load(file_path + '.joblib')
                logger.info(f"Model loaded using joblib: {file_path + '.joblib'}")
            elif os.path.exists(file_path + '.pkl'):
                with open(file_path + '.pkl', 'rb') as f:
                    model = pickle.load(f)
                logger.info(f"Model loaded using pickle: {file_path + '.pkl'}")
            else:
                raise ValueError(f"Unknown model format for file: {file_path}")
        
        return model
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def calculate_model_hash(file_path: str) -> str:
    """
    Calculate SHA-256 hash of model file for integrity checking
    """
    try:
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    except Exception as e:
        logger.warning(f"Could not calculate hash for {file_path}: {e}")
        return "unknown"

def verify_model_integrity(file_path: str) -> bool:
    """
    Verify model file integrity using stored hash
    """
    try:
        info_path = file_path + '.info.json'
        if not os.path.exists(info_path):
            logger.warning(f"No info file found for {file_path}")
            return False
        
        with open(info_path, 'r') as f:
            stored_info = json.load(f)
        
        stored_hash = stored_info.get('hash')
        if not stored_hash or stored_hash == "unknown":
            logger.warning(f"No hash stored for {file_path}")
            return False
        
        current_hash = calculate_model_hash(file_path)
        is_valid = stored_hash == current_hash
        
        if is_valid:
            logger.info(f"✅ Model integrity verified: {file_path}")
        else:
            logger.warning(f"⚠️  Model integrity check failed: {file_path}")
        
        return is_valid
        
    except Exception as e:
        logger.error(f"Error verifying model integrity: {e}")
        return False

def get_model_info(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Get information about a saved model
    """
    try:
        info_path = file_path + '.info.json'
        if not os.path.exists(info_path):
            return None
        
        with open(info_path, 'r') as f:
            return json.load(f)
            
    except Exception as e:
        logger.error(f"Error reading model info: {e}")
        return None

def list_saved_models(directory: str) -> Dict[str, Dict[str, Any]]:
    """
    List all saved models in a directory
    """
    try:
        models = {}
        
        if not os.path.exists(directory):
            return models
        
        for filename in os.listdir(directory):
            if filename.endswith(('.joblib', '.pkl', '.h5')):
                file_path = os.path.join(directory, filename)
                model_info = get_model_info(file_path)
                
                if model_info:
                    models[filename] = model_info
                else:
                    # Basic info if no metadata file
                    models[filename] = {
                        'file_path': file_path,
                        'file_size': os.path.getsize(file_path),
                        'created_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                        'model_type': 'unknown'
                    }
        
        return models
        
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return {}

def create_model_registry(directory: str) -> Dict[str, Any]:
    """
    Create a comprehensive registry of all models in a directory
    """
    try:
        models = list_saved_models(directory)
        
        registry = {
            'created_at': datetime.now().isoformat(),
            'total_models': len(models),
            'models': models,
            'summary': {
                'by_type': {},
                'by_date': {},
                'total_size': 0
            }
        }
        
        # Analyze models
        for model_name, model_info in models.items():
            model_type = model_info.get('model_type', 'unknown')
            created_date = model_info.get('created_at', 'unknown')
            file_size = model_info.get('file_size', 0)
            
            # Count by type
            if model_type not in registry['summary']['by_type']:
                registry['summary']['by_type'][model_type] = 0
            registry['summary']['by_type'][model_type] += 1
            
            # Count by date
            if created_date != 'unknown':
                date_key = created_date[:10]  # YYYY-MM-DD
                if date_key not in registry['summary']['by_date']:
                    registry['summary']['by_date'][date_key] = 0
                registry['summary']['by_date'][date_key] += 1
            
            # Total size
            registry['summary']['total_size'] += file_size
        
        # Save registry
        registry_path = os.path.join(directory, 'model_registry.json')
        with open(registry_path, 'w') as f:
            json.dump(registry, f, indent=2, default=str)
        
        logger.info(f"Model registry created: {registry_path}")
        return registry
        
    except Exception as e:
        logger.error(f"Error creating model registry: {e}")
        raise

def cleanup_old_models(directory: str, max_age_days: int = 30, 
                       keep_best: bool = True) -> int:
    """
    Clean up old model files
    
    Args:
        directory: Directory containing models
        max_age_days: Maximum age in days to keep models
        keep_best: Whether to keep the best performing model
    
    Returns:
        Number of models removed
    """
    try:
        models = list_saved_models(directory)
        if not models:
            return 0
        
        current_time = datetime.now()
        removed_count = 0
        
        # Find old models
        old_models = []
        for model_name, model_info in models.items():
            created_at = model_info.get('created_at')
            if created_at and created_at != 'unknown':
                try:
                    created_time = datetime.fromisoformat(created_at)
                    age_days = (current_time - created_time).days
                    
                    if age_days > max_age_days:
                        old_models.append((model_name, model_info, age_days))
                except:
                    continue
        
        # Sort by age (oldest first)
        old_models.sort(key=lambda x: x[2], reverse=True)
        
        # Remove old models (keep the best if requested)
        for model_name, model_info, age_days in old_models:
            if keep_best and len(old_models) == 1:
                logger.info(f"Keeping best model: {model_name}")
                break
            
            try:
                file_path = model_info['file_path']
                
                # Remove main file
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                # Remove metadata files
                for ext in ['.info.json', '.metadata.json']:
                    metadata_path = file_path + ext
                    if os.path.exists(metadata_path):
                        os.remove(metadata_path)
                
                removed_count += 1
                logger.info(f"Removed old model: {model_name} (age: {age_days} days)")
                
            except Exception as e:
                logger.warning(f"Could not remove {model_name}: {e}")
        
        if removed_count > 0:
            logger.info(f"Cleanup complete. Removed {removed_count} old models")
        
        return removed_count
        
    except Exception as e:
        logger.error(f"Error during model cleanup: {e}")
        return 0

def export_model_for_production(model: Any, export_path: str, 
                               format: str = 'joblib') -> str:
    """
    Export a model for production use with minimal dependencies
    """
    try:
        # Create production-ready export
        if format == 'joblib':
            export_file = export_path + '.joblib'
            joblib.dump(model, export_file)
            
        elif format == 'pickle':
            export_file = export_path + '.pkl'
            with open(export_file, 'wb') as f:
                pickle.dump(model, f)
                
        elif format == 'json':
            # For simple models, export as JSON
            if hasattr(model, 'get_params'):
                params = model.get_params()
                export_file = export_path + '.json'
                with open(export_file, 'w') as f:
                    json.dump(params, f, indent=2)
            else:
                raise ValueError("Model doesn't support JSON export")
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        logger.info(f"Model exported for production: {export_file}")
        return export_file
        
    except Exception as e:
        logger.error(f"Error exporting model: {e}")
        raise
