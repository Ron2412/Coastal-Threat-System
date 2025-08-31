# 🌊 Coastal Threat Dashboard - Hackathon Documentation

## 📌 Overview
The **Coastal Threat Dashboard** is an AI-powered platform designed to monitor, analyze, and predict coastal threats across Indian port cities.  
This project was built for the hackathon as a **full-stack MVP** integrating real-time data visualization, machine learning predictions, and interactive maps.

---

## 🚀 Key Features
- **Real-Time Dashboard**: Live stats, risk analysis, and AI insights.
- **Interactive Mapping**: Coastal locations visualized with color-coded risk indicators.
- **AI/ML Prediction Engine**: Port-specific threat predictions with confidence scores.
- **Data Explorer**: Advanced filtering, search, and CSV export of tide data.
- **System Monitoring**: Service health, error logging, and quick troubleshooting.

---

## 🏗️ Architecture
**Frontend (React + Vite)**  
- React 18, Tailwind CSS, React Router, Chart.js, Leaflet maps

**Backend (Node.js + Express)**  
- Supabase (PostgreSQL), REST APIs, Authentication & Security

**ML Service (Python + FastAPI)**  
- Models: Random Forest & Linear Regression  
- Libraries: Scikit-learn, TensorFlow, Prophet

**Database (Supabase)**  
- Real-time subscriptions, Row Level Security  
- Tables: `tide_data_raw`, `coastal_locations`

---

## 📊 Data Sources
1. **Tide Data** – Historical + real-time measurements  
2. **Weather Data** – Temp, humidity, wind speed  
3. **Coastal Locations** – Geographic & demographic details  
4. **Threat Assessments** – Cyclones, floods, erosion, surges

---

## 🖥️ UI Pages
- **Overview**: Stats, AI insights, risk analysis  
- **Map**: Interactive coastal risk map  
- **Data Explorer**: Searchable tide dataset with export  
- **ML Predictions**: Threat forecast per port  
- **System Status**: Health monitoring of all services  

---

## 🔧 Setup Instructions

### 1️⃣ Install Dependencies
```bash
npm install   # Root
cd frontend && npm install
cd ../backend && npm install
cd ../ml-service && pip install -r requirements.txt
```

### 2️⃣ Run Project
```bash
# Option 1: Automated
./start-project.sh

# Option 2: Manual
cd backend && npm start
cd ml-service && python app.py
cd frontend && npm run dev
```

### 3️⃣ URLs
- Frontend → http://localhost:3000  
- Backend API → http://localhost:3001  
- ML Service → http://localhost:5001  
- Database → Supabase Cloud

---

## 📈 Success Metrics
- **ML Accuracy**: >95%  
- **System Uptime**: 99.9%  
- **Page Load**: <3s  
- **API Latency**: <500ms  

---

## 🔮 Future Enhancements
- Real-time streaming (WebSockets)  
- Mobile app (React Native)  
- IoT sensor integration  
- Satellite imagery + predictive analytics  
- Role-based access & notifications  

---

## 📞 Contact & Repo
- **GitHub**: [Coastal Threat System](https://github.com/Ron2412/Coastal-Threat-System)  
- **Docs**: Available in `/docs`  
- **Issues**: GitHub Issues for bugs/requests  

---

✨ Built during Hackathon with **React, Node.js, Python, Supabase, and AI/ML** ✨
