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
  if (projectsTrack && projectsViewport && projectsPrev && projectsNext) {
    const getCardStep = () => {
      const firstCard = projectsTrack.querySelector('.project-card');
      if (!firstCard) return 0;
      const trackStyle = window.getComputedStyle(projectsTrack);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
      return firstCard.getBoundingClientRect().width + gap;
    };

    const scrollProjects = (direction) => {
      const step = getCardStep();
      if (!step) return;

      const maxScroll = projectsViewport.scrollWidth - projectsViewport.clientWidth;
      const atStart = projectsViewport.scrollLeft <= step * 0.5;
      const atEnd = projectsViewport.scrollLeft >= maxScroll - step * 0.5;

      let target;
      if (direction < 0 && atStart) {
        target = maxScroll; // wrap to the last card
      } else if (direction > 0 && atEnd) {
        target = 0; // wrap to the first card
      } else {
        target = projectsViewport.scrollLeft + direction * step;
      }

      target = Math.max(0, Math.min(maxScroll, target));
      projectsViewport.scrollTo({ left: target, behavior: 'smooth' });
    };

    projectsPrev.addEventListener('click', () => scrollProjects(-1));
    projectsNext.addEventListener('click', () => scrollProjects(1));

    // A normal vertical mouse wheel over the carousel should slide it
    // horizontally (most trackpads/wheels only send deltaY). This also
    // stops the event from bubbling up to the window-level wheel
    // listener above, which would otherwise try to flip the whole page
    // instead of scrolling the cards.
       projectsViewport.addEventListener('wheel', (e) => {
      e.stopPropagation();
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      projectsViewport.scrollLeft += delta;
    }, { passive: true });

    // Continuously figure out which card is actually sitting closest to
    // the horizontal center of the viewport, and mark only that one as
    // "the middle card" — it's always the front, zoomed-in one, and
    // which card that is changes live as you scroll or click the arrows.
    let highlightRAF = null;

    const updateMiddleCard = () => {
      const cards = projectsTrack.querySelectorAll('.project-card');
      if (!cards.length) return;

      const viewportRect = projectsViewport.getBoundingClientRect();
      const viewportCenter = viewportRect.left + viewportRect.width / 2;

      let closestCard = null;
      let closestDistance = Infinity;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card;
        }

        card.classList.remove('is-middle');
      });

      if (closestCard) closestCard.classList.add('is-middle');
    };

    const scheduleUpdateMiddleCard = () => {
      if (highlightRAF) return;
      highlightRAF = requestAnimationFrame(() => {
        updateMiddleCard();
        highlightRAF = null;
      });
    };

    projectsViewport.addEventListener('scroll', scheduleUpdateMiddleCard, { passive: true });
    window.addEventListener('resize', scheduleUpdateMiddleCard);
    updateMiddleCard();
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