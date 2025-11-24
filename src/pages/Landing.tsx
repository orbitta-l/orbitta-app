import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import Features from "@/components/Features";
import Solution from "@/components/Solution";
import Navbars from "@/components/Navbar"

export default function Landing() {
  const navigate = useNavigate();


  useEffect(() => {
    const starContainer = document.getElementById('stars');
    if (starContainer) {
      const numStars = 150;
      for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.top = Math.random() * 100 + '%';
        star.style.left = Math.random() * 100 + '%';
        const size = Math.random() * 2 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.animationDuration = Math.random() * 2 + 1 + 's';
        starContainer.appendChild(star);
      }
    }

    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear().toString();
    }
  }, []);


  
  return (
    <div>
      <Navbars />

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <div className="hero-content">
          <h1>Conectando talentos em uma só órbita</h1>
          <p>Tenha total transparência do seu nível atual e de como você pode chegar a um estágio superior.</p>
          <button className="hero-button" onClick={() => {
            console.log('Landing: Hero button clicked, navigating to /login');
            navigate('/login');
          }}>
            <span>COMEÇAR AGORA</span>
          </button>
        </div>

        <div id="stars"></div>

        <div className="ring small"></div>
        <div className="ring medium"></div>
        <div className="ring large"></div>

        <div className="galaxy-ring one"></div>
        <div className="galaxy-ring two"></div>

        <div className="hero-curve">
          <div className="hero-curve-inner"></div>
        </div>
      </section>

      {/* Obstacles Section */}
      <section id="obstaculos" className="obstacles">
        <div className="container">
          <h2 className="section-title">
            Obstáculos <span className="highlight">Enfrentados</span>
          </h2>
          <p className="section-subtitle">
            Desafios que impedem o crescimento e engajamento das equipes
          </p>

          <div className="card-grid">
            <div className="obstacle-card">
              <div className="obstacle-stat">70%</div>
              <div className="obstacle-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3>O Vácuo do Feedback</h3>
              <p>Apesar de 70% dos profissionais de TI considerarem o feedback regular fundamental, a maioria não o recebe. Essa desconexão gera desmotivação, ansiedade e um sentimento de que o trabalho não está sendo visto.</p>
            </div>

            <div className="obstacle-card">
              <div className="obstacle-stat">64%</div>
              <div className="obstacle-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3>A Lacuna da Gestão</h3>
              <p>Apenas 64% das empresas brasileiras possuem um processo formal de avaliação de desempenho. Sem ele, líderes e equipes ficam sem uma direção clara para o crescimento, gerando um ciclo de ineficiência e incerteza.</p>
            </div>

            <div className="obstacle-card">
              <div className="obstacle-stat">43%</div>
              <div className="obstacle-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
              </div>
              <h3>O Custo da Incerteza</h3>
              <p>Para 43% dos profissionais de TI, a falta de um plano de carreira claro é o principal motivo para a troca de emprego. A ausência de perspectivas de crescimento se torna um alto custo de rotatividade para a empresa.</p>
            </div>
          </div>
        </div>
      </section>

      <Solution />
      <Features />

      {/* Orbit Laws Section */}
      <section id="leis" className="orbit-laws">
        <div className="container" style={{ maxWidth: '1152px' }}>
          <h2 className="section-title">
            As Leis da Nossa <span className="highlight">Órbita</span>
          </h2>
          <p className="section-subtitle">
            Fundamentação teórica que guia nossa plataforma
          </p>

          <div className="card-grid" id="grid-leis">
            <div className="law-card">
              <div className="law-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              </div>
              <h3>Liderança Situacional</h3>
              <p>Defende que não existe um único estilo de liderança eficaz.</p>
              <ul>
                <li>O líder deve adaptar sua postura de acordo com o nível de maturidade do liderado (M1 a M4).</li>
                <li>A Orbitta oferece recursos que facilitam a aplicação dessa teoria, permitindo que líderes ajustem seus métodos de gestão em tempo real.</li>
              </ul>
              <div className="law-badges">
                <span className="law-badge orange">M1</span>
                <span className="law-badge blue">M2</span>
                <span className="law-badge light">M3</span>
                <span className="law-badge dark">M4</span>
              </div>
            </div>

            <div className="law-card">
              <div className="law-icon orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <h3>Gestão por Competências</h3>
              <p>Define competência como um conjunto integrado de conhecimentos (saber), habilidades (saber fazer) e atitudes (querer fazer).</p>
              <ul>
                <li>Na Orbitta, isso se traduz em trilhas personalizadas de desenvolvimento e uma visão clara de gaps individuais.</li>
                <li>Garantindo que o talento cresça de forma orientada.</li>
              </ul>
              <div className="law-badges">
                <span className="law-badge blue">Conhecimento</span>
                <span className="law-badge orange">Habilidade</span>
                <span className="law-badge light">Atitude</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <img src={logo} alt="Orbitta Logo" />
              </div>
              <p className="footer-description">
                Conectando talentos em uma única órbita. Do ponto de partida ao sucesso.
              </p>
              <div className="footer-social">
                <a href="https://instagram.com/orbitta" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Links Rápidos</h4>
              <ul>
                <li><a href="#inicio">Início</a></li>
                <li><a href="#obstaculos">O Problema</a></li>
                <li><a href="#solucao">A Solução</a></li>
                <li><a href="#funcionalidades">Funcionalidades</a></li>
                <li><a href="#leis">Nossa Órbita</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="footer-copyright">
                © <span id="year"></span> Orbitta. Todos os direitos reservados.
              </p>
              <div className="footer-legal">
                <a href="#">Termos de Uso</a>
                <a href="#">Política de Privacidade</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-decorative left"></div>
        <div className="footer-decorative right"></div>
      </footer>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          line-height: 1.6;
        }

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 50;
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .navbar-scrolled {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }

        .navbar-default {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
        }

        .navbar-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo img {
          position: absolute;
          height: 128px;
          width: auto;
          justify-content: center;
          align-self: center;
          margin-top: 40px;
        }

        .navbar-links {
          display: none;
          gap: 2.5rem;
        }

        @media (min-width: 768px) {
          .navbar-links {
            display: flex;
          }
        }

        .navbar-links a {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          position: relative;
          transition: color 0.3s;
        }

        .navbar-links a:hover {
          color: #EF9F7D;
        }

        .navbar-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #EF9F7D;
          transition: width 0.3s;
        }

        .active-nav {
          color: #EF9F7D;
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #EF9F7D;
          transition: width 0.3s;
        }

        .navbar-links a:hover::after {
          width: 100%;
        }

        .navbar-button {
          display: none;
          padding: 0.625rem 1.5rem;
          background: linear-gradient(to right, #EF9F7D, #d88a68);
          color: white;
          font-weight: 600;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        @media (min-width: 768px) {
          .navbar-button {
            display: block;
          }
        }

        .navbar-button:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(239, 159, 125, 0.3);
        }

        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          background: radial-gradient(circle at bottom, #012873 0%, #000303 80%);
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 768px;
          padding: 0 1.5rem;
          animation: fadeIn 0.8s ease-out;
        }

        .hero h1 {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #ffffff, #EF9F7D);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (min-width: 768px) {
          .hero h1 {
            font-size: 3.75rem;
          }
        }

        .hero p {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
          max-width: 672px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (min-width: 768px) {
          .hero p {
            font-size: 1.25rem;
          }
        }

        .hero-button {
          position: relative;
          padding: 1rem 2.5rem;
          background: linear-gradient(to right, #012973, #012973, #EF9F7D);
          color: white;
          font-weight: bold;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.5s;
          z-index: 1;
        }

        .hero-button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 50px rgba(239, 159, 125, 0.5);
        }

        .hero-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #EF9F7D, #012973);
          opacity: 0;
          transition: opacity 0.5s;
          z-index: -1;
        }

        .hero-button:hover::before {
          opacity: 1;
        }

        #stars {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
          animation: twinkle 2s infinite ease-in-out;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: rotateRing 30s linear infinite;
          opacity: 0.2;
          z-index: 1;
        }

        .ring.small { width: 45vh; height: 45vh; animation-duration: 25s; }
        .ring.medium { width: 70vh; height: 70vh; animation-duration: 40s; }
        .ring.large { width: 95vh; height: 95vh; animation-duration: 55s; }

        .galaxy-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(65deg) rotateZ(25deg);
          animation: rotateGalaxy 90s linear infinite;
          filter: blur(1px);
          z-index: 0;
        }

        .galaxy-ring.one { width: 80vh; height: 45vh; animation-duration: 120s; }
        .galaxy-ring.two { width: 100vh; height: 50vh; opacity: 0.08; animation-duration: 150s; }

        @keyframes rotateRing {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes rotateGalaxy {
          from { transform: translate(-50%, -50%) rotateX(65deg) rotateZ(0deg); }
          to { transform: translate(-50%, -50%) rotateX(65deg) rotateZ(360deg); }
        }

        .hero-curve {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50vh;
          overflow: hidden;
        }

        .hero-curve-inner {
          position: absolute;
          bottom: -190vh;
          height: 200vh;
          width: 100%;
          left: 0;
          background: #090F24;
          z-index: 1;
          box-shadow: 0 -20px 100px 20px rgba(255, 255, 255, 0.3), 0 -1px 15px -1px rgba(255, 255, 255, 0.5) inset;
          border-top-left-radius: 50vw 11vh;
          border-top-right-radius: 50vw 11vh;
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .obstacles {
          background: #090F24;
          padding: 6rem 1.5rem;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: bold;
          text-align: center;
          color: white;
          margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: 3rem;
          }
        }

        .section-subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 4rem;
          max-width: 672px;
          margin-left: auto;
          margin-right: auto;
        }

        .highlight {
          color: #E09F7D;
        }

        .card-grid {
          display: grid;
          gap: 2rem;
          grid-template-columns: 1fr;
        }

        #grid-leis{
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @media (min-width: 768px) {
          .card-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .obstacle-card {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(4px);
          border-radius: 1rem;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s;
        }

        .obstacle-card:hover {
          border-color: rgba(224, 159, 125, 0.5);
          transform: scale(1.05);
          box-shadow: 0 20px 50px rgba(224, 159, 125, 0.2);
        }

        .obstacle-stat {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 5rem;
          font-weight: bold;
          color: rgba(224, 159, 125, 0.1);
          padding-right: 1rem;
          padding-top: 0.5rem;
          user-select: none;
        }

        .obstacle-icon {
          position: relative;
          z-index: 10;
          width: 4rem;
          height: 4rem;
          background: rgba(224, 159, 125, 0.2);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: background 0.3s;
        }

        .obstacle-card:hover .obstacle-icon {
          background: rgba(224, 159, 125, 0.3);
        }

        .obstacle-icon svg {
          width: 2rem;
          height: 2rem;
          color: #E09F7D;
        }

        .obstacle-card h3 {
          position: relative;
          z-index: 10;
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          margin-bottom: 1rem;
        }

        .obstacle-card p {
          position: relative;
          z-index: 10;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .solution {
          background: linear-gradient(to bottom, #090F24 0%, #ffffff 100%);
          padding: 6rem 1.5rem;
        }

        .solution .section-title {
          color: white;
        }

        .solution .section-subtitle {
          color: rgba(255, 255, 255, 0.9);
        }

        .solution-card {
          position: relative;
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.5s;
        }

        .solution-card:hover {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          transform: translateY(-8px);
        }

        .solution-icon {
          width: 5rem;
          height: 5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s;
        }

        .solution-card:hover .solution-icon {
          transform: scale(1.1);
        }

        .solution-icon svg {
          width: 2.5rem;
          height: 2.5rem;
          color: white;
        }

        .solution-icon.blue {
          background: linear-gradient(to bottom right, #012873, #3142ff);
        }

        .solution-icon.orange {
          background: linear-gradient(to bottom right, #E09F7D, #d88a68);
        }

        .solution-icon.mixed {
          background: linear-gradient(to bottom right, #012873, #E09F7D);
        }

        .solution-card h3 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .solution-card p {
          color: #4a4a4a;
          line-height: 1.6;
        }

        .solution-corner {
          position: absolute;
          top: 0;
          right: 0;
          width: 6rem;
          height: 6rem;
          opacity: 0.1;
          border-bottom-left-radius: 100%;
          border-top-right-radius: 1rem;
        }

        .solution-corner.blue {
          background: linear-gradient(to bottom right, #012873, #3142ff);
        }

        .solution-corner.orange {
          background: linear-gradient(to bottom right, #E09F7D, #d88a68);
        }

        .solution-corner.mixed {
          background: linear-gradient(to bottom right, #012873, #E09F7D);
        }

        .features {
          background: linear-gradient(to bottom, #ffffff, #f5f5f5);
          padding: 6rem 1.5rem;
        }

        .features .section-title {
          color: #1a1a1a;
        }

        .features .section-subtitle {
          color: #666;
        }

        .feature-category {
          margin-bottom: 5rem;
        }

        .feature-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }

        .feature-header-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-header-icon.blue {
          background: linear-gradient(to bottom right, #012873, #3142ff);
        }

        .feature-header-icon.orange {
          background: linear-gradient(to bottom right, #E09F7D, #d88a68);
        }

        .feature-header-icon svg {
          width: 1.5rem;
          height: 1.5rem;
          color: white;
        }

        .feature-header h3 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1a1a1a;
        }

        .carousel-wrapper {
          position: relative;
          max-width: 672px;
          margin: 0 auto;
        }

        .carousel-card {
          background: linear-gradient(to bottom right, #fafafa, #ffffff);
          border-radius: 0.75rem;
          padding: 2rem;
          border: 1px solid #e5e5e5;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          animation: floatSubtle 6s ease-in-out infinite;
        }

        @keyframes floatSubtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .carousel-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .carousel-icon.blue {
          background: linear-gradient(to bottom right, #012873, #3142ff);
        }

        .carousel-icon.orange {
          background: linear-gradient(to bottom right, #E09F7D, #d88a68);
        }

        .carousel-icon svg {
          width: 2rem;
          height: 2rem;
          color: white;
        }

        .carousel-card h4 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .carousel-card p {
          color: #666;
          line-height: 1.6;
          max-width: 576px;
        }

        .carousel-arrow {
          position: absolute;
          top: 50%;
          width: 3rem;
          height: 3rem;
          background: white;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s;
          border: none;
        }

        .carousel-arrow:hover {
          background: #fafafa;
        }

        .carousel-arrow.left {
          left: -4rem;
          transform: translateY(-50%);
        }

        .carousel-arrow.right {
          right: -4rem;
          transform: translateY(-50%);
        }

        .carousel-arrow svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .carousel-arrow.blue svg {
          color: #012873;
        }

        .carousel-arrow.orange svg {
          color: #E09F7D;
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .carousel-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: #d1d1d1;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }

        .carousel-dot.active {
          width: 2rem;
        }

        .carousel-dot.active.blue {
          background: #012873;
        }

        .carousel-dot.active.orange {
          background: #E09F7D;
        }

        .orbit-laws {
          background: #090F24;
          padding: 6rem 1.5rem;
        }

        .orbit-laws .section-title {
          color: white;
        }

        .orbit-laws .section-subtitle {
          color: #9ca3af;
          font-size: 1.125rem;
        }

        .law-card {
          position: relative;
          background: linear-gradient(to bottom right, rgba(1, 41, 115, 0.4), rgba(9, 15, 36, 0.6));
          backdrop-filter: blur(4px);
          border-radius: 1rem;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s;
          justify-content: center;
        }

        .law-card:hover {
          border-color: rgba(239, 159, 125, 0.5);
          transform: scale(1.02);
          box-shadow: 0 20px 50px rgba(239, 159, 125, 0.1);
        }

        .law-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s;
        }

        .law-card:hover .law-icon {
          transform: scale(1.1);
        }

        .law-icon.blue {
          background: linear-gradient(to bottom right, #012973, #090F24);
        }

        .law-icon.orange {
          background: linear-gradient(to bottom right, #EF9F7D, #012973);
        }

        .law-icon svg {
          width: 2rem;
          height: 2rem;
          color: white;
        }

        .law-card h3 {
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          margin-bottom: 1rem;
        }

        .law-card > p {
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }

        .law-card ul {
          color: #d1d5db;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          list-style: none;
        }

        .law-card li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .law-card li::before {
          content: '•';
          color: #EF9F7D;
          margin-top: 0.375rem;
        }

        .law-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .law-badge {
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .law-badge.orange {
          background: #EF9F7D;
        }

        .law-badge.blue {
          background: #012973;
        }

.law-badge.light {
          background: #CFD0CE;
          color: #000303;
        }

        .law-badge.dark {
          background: #090F24;
        }

        .footer {
          position: relative;
          background: #090F24;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-content {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          padding-top: 5rem;
        }

        .footer-grid {
          display: grid;
          gap: 2.5rem;
          margin-bottom: 2rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .footer-logo img {
          height: 2.5rem;
          width: auto;
          margin-bottom: 1rem;
        }

        .footer-description {
          color: #d1d5db;
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .footer-social {
          display: flex;
          gap: 0.75rem;
        }

        .footer-social a {
          width: 2.5rem;
          height: 2.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s;
        }

        .footer-social a:hover {
          background: #E09F7D;
        }

        .footer-social svg {
          width: 1.25rem;
          height: 1.25rem;
          color: white;
        }

        .footer-links h4 {
          font-size: 1.125rem;
          font-weight: bold;
          color: white;
          margin-bottom: 1rem;
        }

        .footer-links ul {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-links a {
          color: #d1d5db;
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-links a:hover {
          color: #E09F7D;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
          margin-top: 2rem;
        }

        .footer-bottom-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .footer-bottom-content {
            flex-direction: row;
            justify-content: space-between;
          }
        }

        .footer-copyright {
          color: #d1d5db;
          font-size: 0.875rem;
        }

        .footer-legal {
          display: flex;
          gap: 1.5rem;
          font-size: 0.875rem;
        }

        .footer-legal a {
          color: #d1d5db;
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-legal a:hover {
          color: #E09F7D;
        }

        .footer-decorative {
          position: absolute;
        }

        .footer-decorative.left {
          bottom: 5rem;
          left: 2.5rem;
          width: 8rem;
          height: 8rem;
          background: rgba(239, 159, 125, 0.1);
          border-radius: 50%;
          filter: blur(3rem);
        }

        .footer-decorative.right {
          top: 10rem;
          right: 2.5rem;
          width: 10rem;
          height: 10rem;
          background: rgba(1, 41, 115, 0.2);
          border-radius: 50%;
          filter: blur(3rem);
        }

        .hidden {
          display: none;
        }
      `}</style>
    </div>
  );
}