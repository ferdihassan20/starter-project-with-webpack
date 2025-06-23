The application is available at 'https://stellular-eclair-83fc4b.netlify.app/`

# Story Share - Developer Journey Stories

A web application where developers can share their coding journey stories, experiences, and moments of growth. Built with modern web technologies and featuring an interactive map to explore stories from around the world.

## Features

- 🌐 Interactive map showing story locations worldwide
- 📸 Photo upload with camera support
- 🎨 Beautiful UI with smooth transitions
- 📱 Fully responsive design
- 🗺️ Multiple map styles (OpenStreetMap, Satellite, Dark Mode)
- 🔒 Authentication system
- ⚡ Real-time story updates

## Prerequisites

- Node.js (v18 or higher)
- NPM (v9 or higher)
- Modern web browser with JavaScript enabled

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
To run the application in development mode with hot reload:
```bash
npm run start-dev
```
The application will be available at `http://localhost:8080`

### Production Build
To create a production build:
```bash
npm run build
```

To serve the production build:
```bash
npm run serve
```

## Project Structure

```
src/
├── scripts/         # JavaScript source files
│   ├── data/       # Data models and API integration
│   ├── pages/      # Page components
│   └── presenter/  # Presenters for data handling
├── styles/         # CSS stylesheets
└── templates/      # HTML templates
```

## Technologies Used

- Webpack 5 for bundling
- Babel for JavaScript compatibility
- Leaflet.js for interactive maps
- View Transition API for smooth page transitions
- Font Awesome for icons

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Note: Some features like View Transitions API might not work in older browsers, but the application includes fallbacks.

## API Integration

This application uses the Dicoding Story API. Authentication is required for posting stories and accessing certain features.

## Contributing

This is a submission project and is not open for contributions.

## License

ISC License
