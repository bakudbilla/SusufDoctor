import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="bg-linear-to-b from-blue-50 to-white">
      <Navbar />
      <Toaster position="top-right" richColors />
      <Outlet />  
      <Footer />
    </div>
  );
}