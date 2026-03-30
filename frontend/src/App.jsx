// src/App.jsx
import React from 'react';
import './App.css';
import AppRoutes from './routes/AppRoutes.jsx'; // Import the router configuration

function App() {
  return (
    <div className="App">
      {/* You could add a persistent header/navbar here if needed */}
      {/* <header className="App-header"><h1>Physics Learning App</h1></header> */}

      {/* Render the component that handles all the routing */}
      <AppRoutes />

      {/* You could add a persistent footer here if needed */}
      {/* <footer>Footer Content</footer> */}
    </div>
  );
}

export default App;