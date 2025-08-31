# 🌊 Tide Prediction ML Service

A comprehensive machine learning pipeline for training tide prediction models using coastal tide data from Supabase.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create a `.env` file in the `ml-service` directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Training
```bash
python train_tide_models.py
```

## 📁 Project Structure

```
ml-service/
├── config/
│   └── supabase_config.py      # Supabase connection configuration
├── utils/
│   ├── data_preprocessing.py   # Data cleaning and feature engineering
│   ├── model_evaluation.py     # Model performance metrics and visualization
│   └── model_persistence.py    # Model saving/loading utilities
├── models/                     # Trained models (created after training)
├── reports/                    # Training reports (created after training)
├── train_tide_models.py        # Main training script
├── tide_prediction_model.py    # Advanced training pipeline
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🔧 Features

### Data Processing
- **Automatic Data Fetching**: Connects to Supabase and retrieves tide data
- **Smart Preprocessing**: Handles missing values, outliers, and data type conversion
- **Feature Engineering**: Creates time-based, statistical, and interaction features
- **Data Validation**: Ensures data quality before training

### Model Training
- **Multiple Algorithms**: Random Forest, Gradient Boosting, Linear Regression, SVR
- **Multi-Target Training**: Trains separate models for each tide height (height_1, height_2, height_3, height_4)
- **Cross-Validation**: Built-in validation for robust model evaluation
- **Hyperparameter Tuning**: Configurable model parameters

### Model Evaluation
- **Comprehensive Metrics**: R², RMSE, MAE, MAPE, Correlation
- **Visualization**: Interactive plots using Plotly and Matplotlib
- **Model Comparison**: Side-by-side performance analysis
- **HTML Reports**: Professional training reports

### Model Management
- **Version Control**: Automatic model versioning and metadata
- **Integrity Checking**: SHA-256 hash verification
- **Model Registry**: Centralized model tracking
- **Production Export**: Optimized model export for deployment

## 📊 Data Schema

The service expects tide data with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `port_name` | VARCHAR | Name of the coastal port |
| `date_1` | DATE | Primary date for tide data |
| `time_1` to `time_4` | VARCHAR | Tide timing (HHMM format) |
| `height_1` to `height_4` | NUMERIC | Tide heights in meters |
| `component_1` to `component_10` | VARCHAR | Additional tide components |

## 🎯 Training Process

1. **Data Fetching**: Retrieves tide data from Supabase
2. **Preprocessing**: Cleans and prepares data for training
3. **Feature Engineering**: Creates predictive features
4. **Model Training**: Trains multiple models on different algorithms
5. **Evaluation**: Assesses model performance using multiple metrics
6. **Persistence**: Saves trained models and metadata
7. **Reporting**: Generates comprehensive training reports

## 📈 Model Performance

The service automatically evaluates models using:

- **R² Score**: Coefficient of determination
- **RMSE**: Root Mean Square Error
- **MAE**: Mean Absolute Error
- **MAPE**: Mean Absolute Percentage Error
- **Correlation**: Pearson correlation coefficient

## 🔍 Usage Examples

### Basic Training
```python
from train_tide_models import main
main()
```

### Custom Configuration
```python
from tide_prediction_model import TidePredictionModel

trainer = TidePredictionModel()
trainer.fetch_tide_data(port_name="MUMBAI")
X, y = trainer.preprocess_data(data)
results = trainer.train_models(X, y)
```

### Model Loading
```python
from utils.model_persistence import load_model

model = load_model("models/random_forest_height_1.joblib")
prediction = model.predict(features)
```

## 🛠️ Configuration

### Model Parameters
Edit `config/model_config.json` to customize:
- Model hyperparameters
- Feature engineering options
- Training/test split ratios
- Preprocessing strategies

### Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for data access

## 📋 Requirements

### Core Dependencies
- Python 3.8+
- scikit-learn 1.3.2+
- pandas 2.1.4+
- numpy 1.24.4+

### Optional Dependencies
- TensorFlow 2.15.0+ (for deep learning models)
- Plotly 5.17.0+ (for interactive visualizations)
- Prophet 1.1.5+ (for time series forecasting)

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   pip install -r requirements.txt
   ```

2. **Supabase Connection Failed**
   - Check environment variables
   - Verify Supabase credentials
   - Ensure `tide_data` table exists

3. **No Data Found**
   - Upload CSV data to Supabase first
   - Run the schema creation script
   - Check table permissions

4. **Memory Issues**
   - Reduce batch size in configuration
   - Use smaller feature sets
   - Process data in chunks

### Logs
Check `tide_training.log` for detailed error information and training progress.

## 🔮 Future Enhancements

- **Real-time Training**: Continuous model updates
- **Advanced Algorithms**: Deep learning and ensemble methods
- **API Integration**: RESTful endpoints for predictions
- **Model Monitoring**: Performance tracking over time
- **AutoML**: Automated hyperparameter optimization

## 📞 Support

For issues and questions:
1. Check the logs in `tide_training.log`
2. Review the troubleshooting section
3. Verify your Supabase setup
4. Check the data format matches the expected schema

## 📄 License

This project is part of the Coastal Threat Dashboard system.

---

**Happy Training! 🎯🌊**
