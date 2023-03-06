import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { NotFoundPage } from './pages/NotFound';
import { Start } from './pages/Start';
// import { SignIn } from "./pages/SignIn";
// import { SignUp } from "./pages/SignUp";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start/>}/>
        <Route path="/home" element={<Home/>} />

        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;