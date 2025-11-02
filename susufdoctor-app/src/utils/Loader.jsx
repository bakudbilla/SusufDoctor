import loader from '../assets/loader.svg';

export default function Loader({text}){
  return (
    <div className="fixed inset-0 z-50 h-screen bg-[rgba(0,0,0,0.7)] flex items-center justify-center flex-col">
      <img src={loader} alt="loader" className="w-[100px] h-[100px] object-contain"/>
      <p className="mt-[20px] font-epilogue font-bold text-[20px] text-white text-center">{text}<br /> Please wait...</p>
    </div>
  )
}