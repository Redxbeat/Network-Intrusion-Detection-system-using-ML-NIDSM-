import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import MainDashboard from './components/MainDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="App">
      <MainDashboard />
      <ToastContainer />
    </div>
  );
}

export default App;
