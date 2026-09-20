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

  // Page State: 1 = Centered Editorial Hero, 2 = About, 3 = Services, 4 = Projects, 5 = Skills & Contact
  let currentPage = 1;
  const MIN_PAGE = 1;
  const MAX_PAGE = 5;
  let isTransitioning = false;
  const TRANSITION_DURATION = 1500; // 1.5 seconds, matches --transition-shared

  const PROMPT_COPY = {
    1: 'Scroll to explore',
    2: 'View services',
    3: 'View projects',
    4: 'View skills & contact',
    5: 'Back to top',
  };

  // Which nav link should read as "active" for each page state
  const PAGE_NAV_HREF = {
    1: '#home',
    2: '#about',
    3: '#service',
    4: '#projects',
    5: '#skill',
  };

  // 1. Core State Transition Function (FLIP Shared-Element)
  function setPageState(targetPage) {
    targetPage = Math.min(MAX_PAGE, Math.max(MIN_PAGE, targetPage));

    if (targetPage === currentPage || isTransitioning) return;

    isTransitioning = true;
    currentPage = targetPage;

    // Swap the single source-of-truth state class on the stage
    screenFrame.classList.remove('state-page-1', 'state-page-2', 'state-page-3', 'state-page-4', 'state-page-5');
    screenFrame.classList.add(`state-page-${currentPage}`);

    // Update the scroll/transition prompt copy
    if (promptText) promptText.textContent = PROMPT_COPY[currentPage];

    // Sync the nav's active underline to whichever link represents this page
    const activeHref = PAGE_NAV_HREF[currentPage];
    navLinkItems.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === activeHref);
    });

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

    const centerCard = (index) => {
      if (!cards.length) return;
      activeCardIndex = (index + cards.length) % cards.length;

      const targetCard = cards[activeCardIndex];
      const cardLeft = targetCard.offsetLeft;
      const cardWidth = targetCard.offsetWidth;
      const viewportWidth = projectsViewport.clientWidth;
      const targetScrollLeft = cardLeft - (viewportWidth / 2) + (cardWidth / 2);

      projectsViewport.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });

      cards.forEach((card, i) => {
        card.classList.toggle('is-middle', i === activeCardIndex);
      });
      indicators.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeCardIndex);
      });
    };

    projectsPrev.addEventListener('click', (e) => {
      e.preventDefault();
      centerCard(activeCardIndex - 1);
    });

    projectsNext.addEventListener('click', (e) => {
      e.preventDefault();
      centerCard(activeCardIndex + 1);
    });

    // Indicator dot clicks
    indicators.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        centerCard(index);
      });
    });

    // Clicking any card directly centers and activates it
    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        centerCard(index);
      });
    });

    // Prevent main page scroll flip when scrolling horizontally over the carousel
    projectsViewport.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    // Sync active card on manual scroll or resize
    let scrollDebounce = null;
    const updateActiveFromScroll = () => {
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
      if (scrollDebounce) clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(updateActiveFromScroll, 50);
    }, { passive: true });

    window.addEventListener('resize', () => {
      centerCard(activeCardIndex);
    });

    // Initial centering after render
    setTimeout(() => {
      centerCard(0);
    }, 100);
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
});