# Coastal Threat Dashboard - Frontend

A React-based frontend application for monitoring and analyzing coastal threats using interactive maps and data visualization.

## Features

- 🗺️ **Interactive Map**: Leaflet-based map with coastal location markers
- 📊 **Data Visualization**: Charts and graphs for threat analysis
- 🔍 **Location Filtering**: Search and filter coastal locations by various criteria
- 📱 **Responsive Design**: Mobile-friendly interface
- 🎨 **Modern UI**: Built with Tailwind CSS and modern React patterns

## Tech Stack

- **React 18** with Vite
- **Leaflet** for interactive maps
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **React Router** for navigation

## Getting Started

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API and data services
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── styles/        # CSS and styling
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=Coastal Threat Dashboard
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
