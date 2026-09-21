// ==========================================================================
// EJ Kate Alcover — Portfolio Interactions & Shared-Element FLIP Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const screenFrame = document.getElementById('screenFrame');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const navLinkItems = document.querySelectorAll('.nav-link');
  const logoLink = document.getElementById('logoLink');
  const pagePrompt = document.getElementById('pagePrompt');
  const promptText = document.getElementById('promptText');
  const heroPhoto = document.getElementById('heroPhoto');
  const projectsTrack = document.getElementById('projectsTrack');
  const projectsViewport = document.getElementById('projectsViewport');
  const projectsPrev = document.getElementById('projectsPrev');
  const projectsNext = document.getElementById('projectsNext');

  // Page State: 1 = Hero, 2 = About, 3 = Services, 4 = Projects, 5 = Skills, 6 = Contact
  let currentPage = 1;
  const MIN_PAGE = 1;
  const MAX_PAGE = 6;
  let isTransitioning = false;
  const TRANSITION_DURATION = 1500; // 1.5 seconds, matches --transition-shared

  const PROMPT_COPY = {
    1: 'Scroll to explore',
    2: 'View services',
    3: 'View projects',
    4: 'View skills',
    5: 'Get in touch',
    6: 'Back to top',
  };

  // Which nav link should read as "active" for each page state
  const PAGE_NAV_HREF = {
    1: '#home',
    2: '#about',
    3: '#service',
    4: '#projects',
    5: '#skill',
    6: '#contact',
  };

  // 1. Core State Transition Function (FLIP Shared-Element)
  function setPageState(targetPage) {
    targetPage = Math.min(MAX_PAGE, Math.max(MIN_PAGE, targetPage));

    if (targetPage === currentPage || isTransitioning) return;

    isTransitioning = true;
    currentPage = targetPage;

    // Swap the single source-of-truth state class on the stage
    screenFrame.classList.remove('state-page-1', 'state-page-2', 'state-page-3', 'state-page-4', 'state-page-5', 'state-page-6');
    screenFrame.classList.add(`state-page-${currentPage}`);

    // Update the scroll/transition prompt copy
    if (promptText) promptText.textContent = PROMPT_COPY[currentPage];

    // Sync the nav's active underline to whichever link represents this page
    const activeHref = PAGE_NAV_HREF[currentPage];
    navLinkItems.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === activeHref);
    });

    // Recenter project carousel card when switching to Projects page
    if (currentPage === 4 && typeof window.recenterProjectsCarousel === 'function') {
      setTimeout(() => {
        window.recenterProjectsCarousel();
      }, 300);
    }

    // Release lockout after animation completes
    setTimeout(() => {
      isTransitioning = false;
    }, TRANSITION_DURATION);
  }

  // 2. Mouse Wheel / Trackpad Scroll Trigger
  let wheelTimeout = null;
  window.addEventListener('wheel', (e) => {
    // Only process significant vertical scroll gestures
    if (Math.abs(e.deltaY) < 20) return;

    if (wheelTimeout) return;
    wheelTimeout = setTimeout(() => {
      wheelTimeout = null;
    }, 400);

    if (e.deltaY > 0) {
      setPageState(currentPage + 1);
    } else if (e.deltaY < 0) {
      setPageState(currentPage - 1);
    }
  }, { passive: true });

  // 3. Touch Swipe Trigger (Mobile & Tablet)
  let touchStartY = 0;
  let touchStartX = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchStartY - touchEndY;
    const deltaX = Math.abs(touchStartX - touchEndX);

    // Ensure it's a vertical swipe and not horizontal
    if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > deltaX) {
      if (deltaY > 0) {
        setPageState(currentPage + 1);
      } else {
        setPageState(currentPage - 1);
      }
    }
  }, { passive: true });

  // 4. Keyboard Navigation (Arrow Keys / PageUp / PageDown)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      if (currentPage < MAX_PAGE) {
        e.preventDefault();
        setPageState(currentPage + 1);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      if (currentPage > MIN_PAGE) {
        e.preventDefault();
        setPageState(currentPage - 1);
      }
    }
  });

  // 5. Interactive Prompt Button Click
  if (pagePrompt) {
    pagePrompt.addEventListener('click', () => {
      if (currentPage === MAX_PAGE) {
        setPageState(1);
      } else {
        setPageState(currentPage + 1);
      }
    });
  }

  // 6. Navigation Link Clicks
  navLinkItems.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // data-page tells each link which stage state it maps to (1, 2, 3 or 4)
      const targetPage = parseInt(link.getAttribute('data-page'), 10) || 2;
      setPageState(targetPage);

      // Close mobile drawer if open
      if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        const icon = menuToggle?.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars-staggered');
          icon.classList.remove('fa-xmark');
        }
      }
    });
  });

  // 7. Logo Link Click -> Returns to Page 1
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      setPageState(1);
    });
  }

  // 8. Mobile Menu Toggle
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('open');
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars-staggered');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('open');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars-staggered');
          icon.classList.remove('fa-xmark');
        }
      }
    });
  }

  // 9. Projects Carousel — arrow buttons (and wheel/trackpad scrolling)
  //    move the viewport by one card's width at a time, wrapping around
  //    at either end so the arrows always work in both directions.
  //    Note: .projects-viewport is the actual scrolling element
  //    (overflow-x: auto); .projects-track is just the flex row of cards
  //    inside it and has no scroll of its own.
  // 9. Projects Carousel Controller (Index-based Cover Flow Center Focus)
  if (projectsTrack && projectsViewport && projectsPrev && projectsNext) {
    const cards = Array.from(projectsTrack.querySelectorAll('.project-card'));
    const indicators = Array.from(document.querySelectorAll('.indicator-dot'));
    let activeCardIndex = 0;
    let isProgrammaticScrolling = false;
    let scrollTimeout = null;

    const centerCard = (index, smooth = true) => {
      if (!cards.length) return;
      activeCardIndex = (index + cards.length) % cards.length;

      const targetCard = cards[activeCardIndex];
      const cardLeft = targetCard.offsetLeft;
      const cardWidth = targetCard.offsetWidth;
      const viewportWidth = projectsViewport.clientWidth;
      const targetScrollLeft = cardLeft - (viewportWidth / 2) + (cardWidth / 2);

      isProgrammaticScrolling = true;

      cards.forEach((card, i) => {
        card.classList.toggle('is-middle', i === activeCardIndex);
      });
      indicators.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeCardIndex);
      });

      projectsViewport.scrollTo({
        left: targetScrollLeft,
        behavior: smooth ? 'smooth' : 'auto'
      });

      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isProgrammaticScrolling = false;
      }, 450);
    };

    projectsPrev.addEventListener('click', (e) => {
      e.preventDefault();
      centerCard(activeCardIndex - 1, true);
    });

    projectsNext.addEventListener('click', (e) => {
      e.preventDefault();
      centerCard(activeCardIndex + 1, true);
    });

    // Indicator dot clicks
    indicators.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        centerCard(index, true);
      });
    });

    // Clicking any card directly centers and activates it
    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        centerCard(index, true);
      });
    });

    // Prevent main page scroll flip when scrolling horizontally over the carousel
    projectsViewport.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    // Sync active card on manual scroll or resize
    let scrollDebounce = null;
    const updateActiveFromScroll = () => {
      if (isProgrammaticScrolling) return;

      const viewportCenter = projectsViewport.scrollLeft + projectsViewport.clientWidth / 2;
      let closestIndex = 0;
      let minDiff = Infinity;

      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const diff = Math.abs(cardCenter - viewportCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      });

      if (closestIndex !== activeCardIndex) {
        activeCardIndex = closestIndex;
        cards.forEach((card, i) => {
          card.classList.toggle('is-middle', i === activeCardIndex);
        });
        indicators.forEach((dot, i) => {
          dot.classList.toggle('active', i === activeCardIndex);
        });
      }
    };

    projectsViewport.addEventListener('scroll', () => {
      if (isProgrammaticScrolling) return;
      if (scrollDebounce) clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(updateActiveFromScroll, 50);
    }, { passive: true });

    window.recenterProjectsCarousel = () => {
      centerCard(activeCardIndex, false);
    };

    window.addEventListener('resize', () => {
      centerCard(activeCardIndex, false);
    });

    // Initial centering after render
    setTimeout(() => {
      centerCard(0, false);
    }, 100);
    setTimeout(() => {
      centerCard(0, false);
    }, 350);
  }

  
  // 10. Subtle Parallax on Mouse Movement (Applied only to inner img)
  if (window.matchMedia('(pointer: fine)').matches && heroPhoto) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const animateParallax = () => {
      currentX += (mouseX - currentX) * 0.05;
      currentY += (mouseY - currentY) * 0.05;

      heroPhoto.style.transform = `translate(${currentX * 10}px, ${currentY * 5}px)`;
      requestAnimationFrame(animateParallax);
    };

    animateParallax();
  }

  // 11. Interactive Neon Pink Mouse Cursor & Fading Trail System
  const cursorCanvas = document.getElementById('cursorCanvas');
  if (cursorCanvas && window.matchMedia('(pointer: fine)').matches) {
    const ctx = cursorCanvas.getContext('2d');
    let width = (cursorCanvas.width = window.innerWidth);
    let height = (cursorCanvas.height = window.innerHeight);

    let mouseX = -100;
    let mouseY = -100;
    let lastMouseX = -100;
    let lastMouseY = -100;

    let cursorX = -100;
    let cursorY = -100;

    let isHovered = false;
    const particles = [];

    const resizeCanvas = () => {
      width = cursorCanvas.width = window.innerWidth;
      height = cursorCanvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (cursorX === -100) {
        cursorX = mouseX;
        cursorY = mouseY;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
      }

      // Calculate distance moved to interpolate smooth trail particles
      const dx = mouseX - lastMouseX;
      const dy = mouseY - lastMouseY;
      const distance = Math.hypot(dx, dy);

      // Spawn visible 75% transparent trail particles along mouse movement path
      const steps = Math.max(1, Math.floor(distance / 4));
      for (let i = 0; i < steps; i++) {
        const px = lastMouseX + (dx * (i / steps));
        const py = lastMouseY + (dy * (i / steps));

        particles.push({
          x: px,
          y: py,
          size: isHovered ? Math.random() * 3 + 7 : Math.random() * 2.5 + 5,
          alpha: 0.25, // Exactly 75% transparent (25% visible opacity)
          decay: Math.random() * 0.015 + 0.022, // Quick fade (~200ms)
          shrink: 0.18,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4
        });
      }

      lastMouseX = mouseX;
      lastMouseY = mouseY;
    });

    // Track interactive hover state for magnetic/glow effect
    const interactiveSelectors = 'a, button, .project-card, .skill-card, .service-card, .social-card, .form-input, .form-textarea, .indicator-dot, .page-transition-prompt';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        isHovered = true;
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        isHovered = false;
      }
    });

    const renderCursor = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth spring lag for cursor ring
      cursorX += (mouseX - cursorX) * 0.4;
      cursorY += (mouseY - cursorY) * 0.4;

      // Update and draw 75% transparent quick-fading trail
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size = Math.max(0, p.size - p.shrink);

        if (p.alpha <= 0 || p.size <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        // 75% transparent soft neon pink trail
        ctx.fillStyle = `rgba(255, 42, 133, ${p.alpha})`;
        ctx.shadowColor = `rgba(255, 42, 133, ${p.alpha * 0.8})`;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      }

      // Draw leading glowing cursor dot and ring
      if (mouseX > 0 && mouseY > 0) {
        ctx.save();

        // Outer Neon Ring
        const ringRadius = isHovered ? 16 : 9;
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? 'rgba(255, 42, 133, 0.85)' : 'rgba(255, 42, 133, 0.55)';
        ctx.lineWidth = isHovered ? 2 : 1.2;
        ctx.shadowColor = 'rgba(255, 42, 133, 0.6)';
        ctx.shadowBlur = isHovered ? 12 : 5;
        ctx.stroke();

        // Inner Core Dot
        const dotRadius = isHovered ? 4 : 2.5;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 42, 133, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(renderCursor);
    };

    renderCursor();
  }

  // 12. Ambient Floating Constellation & Star Motes Background Animation
  const bgCanvas = document.getElementById('bgCanvas');
  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let bgWidth = (bgCanvas.width = bgCanvas.offsetWidth || window.innerWidth);
    let bgHeight = (bgCanvas.height = bgCanvas.offsetHeight || window.innerHeight);

    let mouseParallaxX = 0;
    let mouseParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseParallaxX = (e.clientX / window.innerWidth - 0.5) * 18;
      mouseParallaxY = (e.clientY / window.innerHeight - 0.5) * 18;
    });

    const resizeBgCanvas = () => {
      bgWidth = bgCanvas.width = bgCanvas.offsetWidth || window.innerWidth;
      bgHeight = bgCanvas.height = bgCanvas.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', resizeBgCanvas);

    // Generate floating ambient star motes
    const numParticles = Math.min(48, Math.max(25, Math.floor((bgWidth * bgHeight) / 24000)));
    const bgParticles = [];

    for (let i = 0; i < numParticles; i++) {
      bgParticles.push({
        x: Math.random() * bgWidth,
        y: Math.random() * bgHeight,
        radius: Math.random() * 1.5 + 0.8,
        baseAlpha: Math.random() * 0.22 + 0.1,
        alpha: Math.random() * 0.22 + 0.1,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        pulseAngle: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22 - 0.06,
        color: Math.random() > 0.35 ? '255, 42, 133' : '255, 255, 255'
      });
    }

    const animateBg = () => {
      bgCtx.clearRect(0, 0, bgWidth, bgHeight);

      currentParallaxX += (mouseParallaxX - currentParallaxX) * 0.04;
      currentParallaxY += (mouseParallaxY - currentParallaxY) * 0.04;

      // Draw faint geometric constellation lines between close ambient motes
      for (let i = 0; i < bgParticles.length; i++) {
        for (let j = i + 1; j < bgParticles.length; j++) {
          const dx = bgParticles[i].x - bgParticles[j].x;
          const dy = bgParticles[i].y - bgParticles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 125) {
            const lineAlpha = (1 - dist / 125) * 0.08;
            bgCtx.save();
            bgCtx.beginPath();
            bgCtx.moveTo(bgParticles[i].x + currentParallaxX * 0.4, bgParticles[i].y + currentParallaxY * 0.4);
            bgCtx.lineTo(bgParticles[j].x + currentParallaxX * 0.4, bgParticles[j].y + currentParallaxY * 0.4);
            bgCtx.strokeStyle = `rgba(255, 42, 133, ${lineAlpha})`;
            bgCtx.lineWidth = 0.75;
            bgCtx.stroke();
            bgCtx.restore();
          }
        }
      }

      // Update and draw floating ambient star motes
      bgParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries smoothly
        if (p.x < -20) p.x = bgWidth + 20;
        if (p.x > bgWidth + 20) p.x = -20;
        if (p.y < -20) p.y = bgHeight + 20;
        if (p.y > bgHeight + 20) p.y = -20;

        // Gentle breathing pulse
        p.pulseAngle += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.07;

        const drawX = p.x + currentParallaxX;
        const drawY = p.y + currentParallaxY;

        bgCtx.save();
        bgCtx.beginPath();
        bgCtx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(${p.color}, ${Math.max(0, p.alpha)})`;
        bgCtx.shadowColor = `rgba(${p.color}, ${p.alpha * 0.7})`;
        bgCtx.shadowBlur = p.radius * 2.5;
        bgCtx.fill();
        bgCtx.restore();
      });

      requestAnimationFrame(animateBg);
    };

    setTimeout(() => {
      resizeBgCanvas();
      animateBg();
    }, 150);
  }
});