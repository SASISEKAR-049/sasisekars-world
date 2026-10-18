import { Header, Menu } from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Skills from './components/Skills.jsx';
import Projects from './components/Projects.jsx';
import Experience from './components/Experience.jsx';
import Education from './components/Education.jsx';
import { Contact, Footer } from './components/Contact.jsx';
import Preloader from './components/Preloader.jsx';
import { HeroBackground, NeuralCanvas, GridLines, Grain, Cursor, Toast, RowPreview, SvgDefs } from './components/Layers.jsx';

/* The page renders once; after that src/motion drives the DOM directly
   (GSAP, SplitType, Lenis), so nothing here holds state or re-renders. */
export default function App() {
  return (
    <>
      <Preloader />
      <a className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-accent focus:text-on-accent focus:px-4 focus:py-2" href="#main">Skip to content</a>
      <HeroBackground />
      <NeuralCanvas />
      <GridLines />
      <Header />
      <Menu />
      <main id="main" tabIndex={-1}>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Education />
        <Contact />
      </main>
      <Footer />
      <Grain />
      <Cursor />
      <Toast />
      <RowPreview />
      <SvgDefs />
    </>
  );
}
