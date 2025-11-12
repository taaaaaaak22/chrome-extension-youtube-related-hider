(() => {
  const TARGET_ID = 'related';
  const MAX_RELATED_WIDTH_TO_SHOW = 300;
  let rafId = null;
  let observer = null;

  const storeOriginalDisplay = (element) => {
    if ('ytRelatedOriginalDisplay' in element.dataset) {
      return;
    }

    element.dataset.ytRelatedOriginalDisplay = element.style.getPropertyValue('display') || '';
    const priority = element.style.getPropertyPriority('display') || '';
    if (priority) {
      element.dataset.ytRelatedOriginalPriority = priority;
    }
  };

  const restoreOriginalDisplay = (element) => {
    if ('ytRelatedOriginalDisplay' in element.dataset) {
      const originalDisplay = element.dataset.ytRelatedOriginalDisplay;
      const priority = element.dataset.ytRelatedOriginalPriority || '';

      if (originalDisplay) {
        element.style.setProperty('display', originalDisplay, priority);
      } else {
        element.style.removeProperty('display');
      }

      delete element.dataset.ytRelatedOriginalDisplay;
      delete element.dataset.ytRelatedOriginalPriority;
    } else {
      element.style.removeProperty('display');
    }
  };

  const getRelatedWidth = (element) => {
    const inlineDisplay = element.style.getPropertyValue('display');
    const inlinePriority = element.style.getPropertyPriority('display');
    const hiddenByScript =
      inlineDisplay === 'none' &&
      inlinePriority === 'important' &&
      'ytRelatedOriginalDisplay' in element.dataset;

    if (!hiddenByScript) {
      return element.getBoundingClientRect().width;
    }

    const originalDisplay = element.dataset.ytRelatedOriginalDisplay || '';
    const originalPriority = element.dataset.ytRelatedOriginalPriority || '';

    if (originalDisplay) {
      element.style.setProperty('display', originalDisplay, originalPriority);
    } else {
      element.style.removeProperty('display');
    }

    const width = element.getBoundingClientRect().width;

    element.style.setProperty('display', 'none', 'important');

    return width;
  };

  const toggleRelatedVisibility = () => {
    const related = document.getElementById(TARGET_ID);
    if (!related) {
      return;
    }

    const relatedWidth = getRelatedWidth(related);
    const shouldHide = relatedWidth >= MAX_RELATED_WIDTH_TO_SHOW;
    if (shouldHide) {
      storeOriginalDisplay(related);
      related.style.setProperty('display', 'none', 'important');
    } else {
      restoreOriginalDisplay(related);
    }
  };

  const scheduleToggle = () => {
    if (rafId !== null) {
      return;
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      toggleRelatedVisibility();
    });
  };

  const startObserving = () => {
    if (observer || !document.documentElement) {
      return;
    }

    observer = new MutationObserver(() => {
      if (document.getElementById(TARGET_ID)) {
        scheduleToggle();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  const attachNavigationListeners = () => {
    const events = ['yt-navigate-finish', 'spfdone', 'yt-page-data-updated'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, scheduleToggle, { passive: true });
    });
  };

  const init = () => {
    toggleRelatedVisibility();
    window.addEventListener('resize', scheduleToggle);
    document.addEventListener('visibilitychange', scheduleToggle);
    startObserving();
    attachNavigationListeners();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
