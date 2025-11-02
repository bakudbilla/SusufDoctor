import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="bg-linear-to-b from-blue-50 to-white">
      <Navbar />
      <Outlet />  
      <Footer />
    </div>
  );
}
