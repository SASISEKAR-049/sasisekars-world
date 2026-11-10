/* Page composition. MotionRoot owns everything global about motion
   (mode, intro, smooth scroll, MotionConfig reducedMotion="user"); every
   animation lives in the component it animates (see src/motion/). */
import { Suspense, useRef } from 'react';
import { MotionRoot, useLocked } from './motion/MotionRoot.jsx';
import { ThemeProvider } from './components/Theme.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { Header, Menu, MenuProvider } from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Skills from './components/Skills.jsx';
import Projects from './components/Projects.jsx';
import Experience from './components/Experience.jsx';
import Education from './components/Education.jsx';
import { Contact, Footer } from './components/Contact.jsx';
import Preloader from './components/Preloader.jsx';
import { Cursor, EasterEgg, GridLines, Grain, HeroBackground, NeuralCanvas, SectionBackdrop } from './components/Layers.jsx';

export default function App() {
  return (
    <MotionRoot>
      <ThemeProvider>
        <ToastProvider>
          <MenuProvider>
            <Page />
          </MenuProvider>
        </ToastProvider>
      </ThemeProvider>
    </MotionRoot>
  );
}

function Page() {
  const locked = useLocked();    // entry screen or menu open: the page behind is inert
  const heroRef = useRef(null);
  return (
    <>
      <Preloader />
      <a className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-accent focus:text-on-accent focus:px-4 focus:py-2" href="#main">Skip to content</a>
      <SectionBackdrop />
      <HeroBackground heroRef={heroRef} />
      <NeuralCanvas />
      <GridLines />
      <Header />
      <Menu />
      <main id="main" tabIndex={-1} inert={locked}>
        <Hero sectionRef={heroRef} />
        {/* Each boundary hydrates as its own unit of work, with breaks in
            between, so start-up never blocks the main thread for long */}
        <Suspense fallback={null}><About /></Suspense>
        <Suspense fallback={null}><Skills /></Suspense>
        <Suspense fallback={null}><Projects /></Suspense>
        <Suspense fallback={null}><Experience /></Suspense>
        <Suspense fallback={null}><Education /></Suspense>
        <Suspense fallback={null}><Contact /></Suspense>
      </main>
      <Suspense fallback={null}><Footer inert={locked} /></Suspense>
      <Grain />
      <Cursor />
      <EasterEgg />
    </>
  );
}
