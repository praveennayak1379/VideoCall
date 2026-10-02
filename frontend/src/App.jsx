import './App.css';
import {Routes,Route, BrowserRouter} from 'react-router-dom';
import AuthProvider from "./contexts/AuthContext.jsx";
import LandingPage from './pages/landing.jsx';
import Authentication from './pages/authentication.jsx';
import VideoMeetComponent from './pages/VideoMeet.jsx';
import Home from './pages/Home.jsx'
function App() {
  return(
    <>
    <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path='/landing'  element={<LandingPage/>} />
        <Route path='/auth'     element={<Authentication/>}/>
        <Route path='/home'     element={<Home/>}/>
        <Route path='/:url' element={<VideoMeetComponent/>} />
      </Routes>
    </AuthProvider>  
    </BrowserRouter>
    </>
  );
}

export default App;
