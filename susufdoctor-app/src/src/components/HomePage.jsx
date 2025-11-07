import WhatsSpecial from './WhatsSpecial.jsx';
import Services from './Services.jsx';
import Testimonials from './Testimonials.jsx';
import Hero from './Hero.jsx'; 

export default function HomePage() {
  return (
    <>
      <section id="home"><Hero /></section>
      <section id="services"><Services /></section>
      <section id="about"><WhatsSpecial /></section>
      <section id="testimonials"><Testimonials /></section>
    </>
  );
}
