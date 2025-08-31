"""
Model Evaluation Utilities for Tide Prediction Models
Handles model performance metrics, visualization, and analysis
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Any, Optional
import logging
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

logger = logging.getLogger(__name__)

def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Evaluate model performance using multiple metrics
    
    Args:
        y_true: True values
        y_pred: Predicted values
    
    Returns:
        Dictionary of evaluation metrics
    """
    try:
        # Calculate metrics
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        
        # Calculate additional metrics
        mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100  # Mean Absolute Percentage Error
        smape = 2.0 * np.mean(np.abs(y_pred - y_true) / (np.abs(y_true) + np.abs(y_pred) + 1e-8)) * 100  # Symmetric MAPE
        
        # Calculate correlation
        correlation = np.corrcoef(y_true, y_pred)[0, 1] if len(y_true) > 1 else 0
        
        metrics = {
            'mse': float(mse),
            'rmse': float(rmse),
            'mae': float(mae),
            'r2_score': float(r2),
            'mape': float(mape),
            'smape': float(smape),
            'correlation': float(correlation),
            'n_samples': len(y_true)
        }
        
        logger.info(f"Model evaluation complete. R²: {r2:.4f}, RMSE: {rmse:.4f}")
        return metrics
        
    except Exception as e:
        logger.error(f"Error in model evaluation: {e}")
        raise

def plot_predictions(y_true: np.ndarray, y_pred: np.ndarray, 
                    title: str = "Model Predictions vs Actual Values",
                    save_path: Optional[str] = None) -> None:
    """
    Create visualization plots for model predictions
    
    Args:
        y_true: True values
        y_pred: Predicted values
        title: Plot title
        save_path: Optional path to save the plot
    """
    try:
        # Create subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle(title, fontsize=16, fontweight='bold')
        
        # 1. Scatter plot: Predicted vs Actual
        axes[0, 0].scatter(y_true, y_pred, alpha=0.6, color='blue')
        axes[0, 0].plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--', lw=2)
        axes[0, 0].set_xlabel('Actual Values')
        axes[0, 0].set_ylabel('Predicted Values')
        axes[0, 0].set_title('Predicted vs Actual Values')
        axes[0, 0].grid(True, alpha=0.3)
        
        # Add R² value to plot
        r2 = r2_score(y_true, y_pred)
        axes[0, 0].text(0.05, 0.95, f'R² = {r2:.4f}', transform=axes[0, 0].transAxes, 
                        bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.8))
        
        # 2. Residuals plot
        residuals = y_true - y_pred
        axes[0, 1].scatter(y_pred, residuals, alpha=0.6, color='green')
        axes[0, 1].axhline(y=0, color='r', linestyle='--', lw=2)
        axes[0, 1].set_xlabel('Predicted Values')
        axes[0, 1].set_ylabel('Residuals')
        axes[0, 1].set_title('Residuals Plot')
        axes[0, 1].grid(True, alpha=0.3)
        
        # 3. Time series plot (if indices represent time)
        indices = range(len(y_true))
        axes[1, 0].plot(indices, y_true, label='Actual', color='blue', alpha=0.7)
        axes[1, 0].plot(indices, y_pred, label='Predicted', color='red', alpha=0.7)
        axes[1, 0].set_xlabel('Sample Index')
        axes[1, 0].set_ylabel('Target Value')
        axes[1, 0].set_title('Time Series Comparison')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        # 4. Residuals distribution
        axes[1, 1].hist(residuals, bins=30, alpha=0.7, color='orange', edgecolor='black')
        axes[1, 1].set_xlabel('Residuals')
        axes[1, 1].set_ylabel('Frequency')
        axes[1, 1].set_title('Residuals Distribution')
        axes[1, 1].grid(True, alpha=0.3)
        
        # Add mean and std to residuals histogram
        mean_residual = np.mean(residuals)
        std_residual = np.std(residuals)
        axes[1, 1].axvline(mean_residual, color='red', linestyle='--', lw=2, label=f'Mean: {mean_residual:.4f}')
        axes[1, 1].axvline(mean_residual + std_residual, color='green', linestyle='--', lw=1, label=f'+1σ: {mean_residual + std_residual:.4f}')
        axes[1, 1].axvline(mean_residual - std_residual, color='green', linestyle='--', lw=1, label=f'-1σ: {mean_residual - std_residual:.4f}')
        axes[1, 1].legend()
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Plot saved to: {save_path}")
        
        plt.show()
        
    except Exception as e:
        logger.error(f"Error creating prediction plots: {e}")
        raise

def compare_models(model_results: Dict[str, Dict[str, Any]], 
                  save_path: Optional[str] = None) -> None:
    """
    Compare multiple models using bar charts
    
    Args:
        model_results: Dictionary of model results with metrics
        save_path: Optional path to save the comparison plot
    """
    try:
        # Extract metrics for comparison
        models = list(model_results.keys())
        r2_scores = [model_results[model]['metrics']['r2_score'] for model in models]
        rmse_scores = [model_results[model]['metrics']['rmse'] for model in models]
        mae_scores = [model_results[model]['metrics']['mae'] for model in models]
        
        # Create comparison plots
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        fig.suptitle('Model Performance Comparison', fontsize=16, fontweight='bold')
        
        # R² Score comparison
        bars1 = axes[0].bar(models, r2_scores, color='skyblue', alpha=0.7)
        axes[0].set_title('R² Score Comparison')
        axes[0].set_ylabel('R² Score')
        axes[0].set_ylim(0, 1)
        axes[0].grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bar, score in zip(bars1, r2_scores):
            height = bar.get_height()
            axes[0].text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{score:.4f}', ha='center', va='bottom')
        
        # RMSE comparison
        bars2 = axes[1].bar(models, rmse_scores, color='lightcoral', alpha=0.7)
        axes[1].set_title('RMSE Comparison')
        axes[1].set_ylabel('RMSE')
        axes[1].grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bar, score in zip(bars2, rmse_scores):
            height = bar.get_height()
            axes[1].text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{score:.4f}', ha='center', va='bottom')
        
        # MAE comparison
        bars3 = axes[2].bar(models, mae_scores, color='lightgreen', alpha=0.7)
        axes[2].set_title('MAE Comparison')
        axes[2].set_ylabel('MAE')
        axes[2].grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bar, score in zip(bars3, mae_scores):
            height = bar.get_height()
            axes[2].text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{score:.4f}', ha='center', va='bottom')
        
        # Rotate x-axis labels for better readability
        for ax in axes:
            ax.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Model comparison plot saved to: {save_path}")
        
        plt.show()
        
    except Exception as e:
        logger.error(f"Error creating model comparison plots: {e}")
        raise

def generate_evaluation_report(model_results: Dict[str, Dict[str, Any]], 
                             output_dir: str = "reports") -> str:
    """
    Generate a comprehensive evaluation report
    
    Args:
        model_results: Dictionary of model results
        output_dir: Directory to save the report
    
    Returns:
        Path to the generated report
    """
    try:
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        report_path = os.path.join(output_dir, f"evaluation_report_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.html")
        
        # Create HTML report
        html_content = _create_evaluation_html_report(model_results)
        
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Evaluation report generated: {report_path}")
        return report_path
        
    except Exception as e:
        logger.error(f"Error generating evaluation report: {e}")
        raise

def _create_evaluation_html_report(model_results: Dict[str, Dict[str, Any]]) -> str:
    """Create HTML content for evaluation report"""
    
    # Calculate summary statistics
    total_models = len(model_results)
    avg_r2 = np.mean([result['metrics']['r2_score'] for result in model_results.values()])
    avg_rmse = np.mean([result['metrics']['rmse'] for result in model_results.values()])
    
    # Find best model
    best_model = max(model_results.items(), key=lambda x: x[1]['metrics']['r2_score'])
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Model Evaluation Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }}
            .summary {{ background-color: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 20px; }}
            .model-section {{ background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #007bff; }}
            .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0; }}
            .metric-card {{ background-color: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .metric-value {{ font-size: 24px; font-weight: bold; color: #007bff; }}
            .best-model {{ background-color: #fff3cd; border-left-color: #ffc107; }}
            table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #f2f2f2; font-weight: bold; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌊 Tide Prediction Model Evaluation Report</h1>
                <p>Comprehensive analysis of model performance and comparison</p>
                <p><strong>Generated:</strong> {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="summary">
                <h2>📊 Summary Statistics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{total_models}</div>
                        <div>Total Models</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{avg_r2:.4f}</div>
                        <div>Average R² Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{avg_rmse:.4f}</div>
                        <div>Average RMSE</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{best_model[0]}</div>
                        <div>Best Model</div>
                    </div>
                </div>
            </div>
            
            <h2>🚀 Individual Model Results</h2>
    """
    
    # Add each model's results
    for model_name, result in model_results.items():
        metrics = result['metrics']
        is_best = model_name == best_model[0]
        
        html += f"""
            <div class="model-section {'best-model' if is_best else ''}">
                <h3>{'🏆 ' if is_best else '🚀 '}{model_name}</h3>
                <p><strong>Training Date:</strong> {result.get('training_date', 'Unknown')}</p>
                <p><strong>Data Shape:</strong> {result.get('data_shape', 'Unknown')}</p>
                <p><strong>Target:</strong> {result.get('target', 'Unknown')}</p>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{metrics['r2_score']:.4f}</div>
                        <div>R² Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{metrics['rmse']:.4f}</div>
                        <div>RMSE</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{metrics['mae']:.4f}</div>
                        <div>MAE</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{metrics['correlation']:.4f}</div>
                        <div>Correlation</div>
                    </div>
                </div>
            </div>
        """
    
    html += """
            <div class="footer">
                <p>Report generated by Tide Prediction ML Pipeline</p>
                <p>For more information, check the training logs and model files</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html
