(() => {
  const TARGET_ID = 'related';
  const MAX_RELATED_WIDTH_TO_SHOW = 420;
  const TOGGLE_BUTTON_ID = 'yt-related-toggle';
  const TOGGLE_WRAPPER_ID = 'yt-related-toggle-wrapper';
  let rafId = null;
  let observer = null;
  let manualOverride = null;
  let initialHidePending = true;
  let toggleWrapper = null;
  let toggleButton = null;

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

  const getRenderableRect = (element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect;
    }

    const child = Array.from(element.children).find((childEl) => {
      const childRect = childEl.getBoundingClientRect();
      return childRect.width > 0 && childRect.height > 0;
    });

    return child ? child.getBoundingClientRect() : rect;
  };

  const getRelatedWidth = (element) => {
    const inlineDisplay = element.style.getPropertyValue('display');
    const inlinePriority = element.style.getPropertyPriority('display');
    const hiddenByScript =
      inlineDisplay === 'none' &&
      inlinePriority === 'important' &&
      'ytRelatedOriginalDisplay' in element.dataset;

    if (!hiddenByScript) {
      return getRenderableRect(element).width;
    }

    const originalDisplay = element.dataset.ytRelatedOriginalDisplay || '';
    const originalPriority = element.dataset.ytRelatedOriginalPriority || '';

    if (originalDisplay) {
      element.style.setProperty('display', originalDisplay, originalPriority);
    } else {
      element.style.removeProperty('display');
    }

    const width = getRenderableRect(element).width;

    element.style.setProperty('display', 'none', 'important');

    return width;
  };

  const applyToggleWrapperStyles = (wrapper) => {
    wrapper.style.display = 'none';
    wrapper.style.width = '100%';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
    wrapper.style.minHeight = '';
    wrapper.style.removeProperty('min-height');
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.gap = '8px';
  };

  const applyToggleButtonStyles = (button) => {
    button.style.width = 'auto';
    button.style.minWidth = '120px';
    button.style.padding = '6px 10px';
    button.style.borderRadius = '999px';
    button.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    button.style.backgroundColor = 'rgba(32, 33, 36, 0.85)';
    button.style.color = '#fff';
    button.style.fontSize = '12px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.gap = '4px';
    button.style.boxShadow = 'none';
  };

  const findRelatedElement = () => {
    const candidates = Array.from(document.querySelectorAll(`#${TARGET_ID}`));
    if (!candidates.length) {
      return null;
    }

    const scoredCandidates = candidates
      .filter((el) => el.isConnected && !el.closest('#watch-page-skeleton'))
      .map((el) => {
        const rect = getRenderableRect(el);
        const hasSize = rect.width > 0 && rect.height > 0;
        const rendered = el.offsetParent !== null;
        return {
          el,
          rect,
          visible: hasSize || rendered,
        };
      });

    const visibleCandidate = scoredCandidates
      .filter((item) => item.visible)
      .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0];

    if (visibleCandidate) {
      return visibleCandidate.el;
    }

    return (
      candidates.find((el) => el.isConnected && !el.closest('#watch-page-skeleton')) ||
      candidates[0]
    );
  };

  const isElementVisible = (element) => {
    if (!element || !element.isConnected) {
      return false;
    }
    const rect = getRenderableRect(element);
    return (rect.width > 0 && rect.height > 0) || element.offsetParent !== null;
  };

  const getFirstVisibleHost = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el)) {
        return el;
      }
    }
    return null;
  };

  const getFirstExistingHost = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el;
      }
    }
    return null;
  };

  const getWrapperHost = () => {
    const related = findRelatedElement();
    if (related && related.parentElement && isElementVisible(related)) {
      return { host: related, position: 'before' };
    }

    const fallbackSelectors = ['#secondary-inner', '#secondary', '#primary-inner', '#primary'];
    const visibleFallback = getFirstVisibleHost(fallbackSelectors);
    if (visibleFallback) {
      return { host: visibleFallback, position: 'prepend' };
    }

    const existingFallback = getFirstExistingHost(fallbackSelectors);
    if (existingFallback) {
      return { host: existingFallback, position: 'prepend' };
    }

    if (related && related.parentElement) {
      return { host: related, position: 'before' };
    }

    return null;
  };

  const ensureToggleWrapper = () => {
    const hostInfo = getWrapperHost();
    if (!hostInfo) {
      return null;
    }

    let wrapper = document.getElementById(TOGGLE_WRAPPER_ID);
    if (!wrapper || !wrapper.isConnected) {
      wrapper = document.createElement('div');
      wrapper.id = TOGGLE_WRAPPER_ID;
    }

    applyToggleWrapperStyles(wrapper);

    if (hostInfo.position === 'before') {
      const shouldMove =
        wrapper.parentElement !== hostInfo.host.parentElement ||
        wrapper.nextElementSibling !== hostInfo.host;
      if (shouldMove) {
        hostInfo.host.insertAdjacentElement('beforebegin', wrapper);
      }
    } else {
      const shouldMove =
        wrapper.parentElement !== hostInfo.host ||
        wrapper !== hostInfo.host.firstElementChild;
      if (shouldMove) {
        hostInfo.host.insertAdjacentElement('afterbegin', wrapper);
      }
    }

    toggleWrapper = wrapper;
    return toggleWrapper;
  };

  const ensureToggleButton = () => {
    if (toggleButton && toggleButton.isConnected) {
      return toggleButton;
    }

    const wrapper = ensureToggleWrapper();
    if (!wrapper) {
      return null;
    }

    const existing = document.getElementById(TOGGLE_BUTTON_ID);
    if (existing) {
      toggleButton = existing;
      if (existing.parentElement !== wrapper) {
        wrapper.appendChild(existing);
      }
      return toggleButton;
    }

    const button = document.createElement('button');
    button.id = TOGGLE_BUTTON_ID;
    button.type = 'button';
    button.textContent = 'Show related videos';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-live', 'polite');
    applyToggleButtonStyles(button);
    button.addEventListener('click', handleToggleButtonClick);
    wrapper.appendChild(button);
    toggleButton = button;
    return toggleButton;
  };

  const updateToggleButtonState = (isRelatedVisible) => {
    const wrapper = ensureToggleWrapper();
    const button = ensureToggleButton();
    if (!wrapper || !button) {
      return;
    }

    const related = findRelatedElement();
    if (!related) {
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      button.disabled = true;
      button.textContent = 'Show related videos';
      button.setAttribute('aria-pressed', 'false');
      return;
    }

    button.disabled = false;

    const label = isRelatedVisible ? 'Hide related videos' : 'Show related videos';
    button.textContent = label;
    button.setAttribute('aria-pressed', isRelatedVisible ? 'true' : 'false');

    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
  };

  const toggleRelatedVisibility = () => {
    const related = findRelatedElement();
    if (!related) {
      updateToggleButtonState(false);
      return;
    }

    ensureToggleWrapper();
    ensureToggleButton();

    const relatedWidth = getRelatedWidth(related);
    const widthBasedHide = relatedWidth >= MAX_RELATED_WIDTH_TO_SHOW;
    let shouldHide;

    if (manualOverride === 'open') {
      shouldHide = false;
    } else if (manualOverride === 'closed') {
      shouldHide = true;
    } else if (initialHidePending) {
      shouldHide = true;
    } else {
      shouldHide = widthBasedHide;
    }
    if (shouldHide) {
      storeOriginalDisplay(related);
      related.style.setProperty('display', 'none', 'important');
    } else {
      restoreOriginalDisplay(related);
    }

    if (initialHidePending) {
      initialHidePending = false;
    }

    updateToggleButtonState(!shouldHide);
  };

  function handleToggleButtonClick() {
    manualOverride = manualOverride === 'open' ? 'closed' : 'open';
    initialHidePending = false;
    toggleRelatedVisibility();
  }

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
      scheduleToggle();
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
    ensureToggleWrapper();
    ensureToggleButton();
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
