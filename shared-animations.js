/**
 * Unified Scroll Animations & Page Synchronization Library
 * Works across Frontend and Hybrid projects
 */

// ============= SCROLL ANIMATIONS =============
class ScrollAnimations {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };
    this.setupObserver();
    this.addScrollAnimationClasses();
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          this.observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);
  }

  addScrollAnimationClasses() {
    // Observe all elements with animation classes
    document.querySelectorAll('[data-animate]').forEach(el => {
      this.observer.observe(el);
    });
  }

  // Add animation to specific element
  animateElement(selector, animationType = 'fade-up') {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      el.setAttribute('data-animate', animationType);
      el.style.animationDelay = `${index * 0.1}s`;
      this.observer.observe(el);
    });
  }

  // Destroy observer
  destroy() {
    if (this.observer) this.observer.disconnect();
  }
}

// ============= PAGE SYNCHRONIZATION =============
class PageSynchronizer {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'page_state';
    this.syncInterval = options.syncInterval || 5000;
    this.debug = options.debug || false;
    
    this.initSync();
  }

  initSync() {
    // Sync page state on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncPages();
      }
    });

    // Auto-sync periodically
    setInterval(() => this.syncPages(), this.syncInterval);

    // Sync on page load
    this.syncPages();
  }

  syncPages() {
    const pageState = this.getPageState();
    this.broadcastState(pageState);
    if (this.debug) console.log('Pages synced:', pageState);
  }

  getPageState() {
    return {
      page: window.location.pathname,
      user: localStorage.getItem('user'),
      timestamp: Date.now(),
      scrollPos: window.scrollY
    };
  }

  broadcastState(state) {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
    // Trigger custom event for other pages to listen
    window.dispatchEvent(new CustomEvent('page-sync', { detail: state }));
  }

  onSync(callback) {
    window.addEventListener('page-sync', (e) => callback(e.detail));
    // Also listen to storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        callback(JSON.parse(e.newValue));
      }
    });
  }

  // Navigate and sync
  navigateTo(url) {
    this.broadcastState({ ...this.getPageState(), target: url });
    window.location.href = url;
  }
}

// ============= SCROLL EVENT HANDLER =============
class ScrollEventManager {
  constructor() {
    this.lastScrollPos = 0;
    this.isScrollingDown = true;
    this.setupScrollListener();
  }

  setupScrollListener() {
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      this.isScrollingDown = scrollPos > this.lastScrollPos;
      this.lastScrollPos = scrollPos;
      
      // Trigger custom scroll event
      document.dispatchEvent(new CustomEvent('custom-scroll', {
        detail: {
          position: scrollPos,
          direction: this.isScrollingDown ? 'down' : 'up'
        }
      }));
    }, { passive: true });
  }

  onCustomScroll(callback) {
    document.addEventListener('custom-scroll', (e) => callback(e.detail));
  }
}

// ============= NAVBAR SYNC =============
class NavbarSync {
  constructor() {
    this.setupNavbarSync();
  }

  setupNavbarSync() {
    // Set active link based on current page
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (currentPath.includes(href) || 
          (href === '/' && currentPath.split('/').pop() === ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  syncNavbarVisibility(scrollManager) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollTop = 0;
    scrollManager.onCustomScroll(({ position, direction }) => {
      if (direction === 'down' && position > 100) {
        navbar.style.transform = 'translateY(-100%)';
        navbar.style.transition = 'transform 0.3s ease';
      } else {
        navbar.style.transform = 'translateY(0)';
        navbar.style.transition = 'transform 0.3s ease';
      }
      lastScrollTop = position;
    });
  }
}

// ============= FORM STATE SYNC =============
class FormStateSync {
  constructor(options = {}) {
    this.storagePrefix = options.storagePrefix || 'form_';
    this.setupFormSync();
  }

  setupFormSync() {
    document.addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'SELECT' || 
          e.target.tagName === 'TEXTAREA') {
        const formId = e.target.form?.id || 'default';
        const fieldName = e.target.name || e.target.id;
        const storageKey = `${this.storagePrefix}${formId}_${fieldName}`;
        localStorage.setItem(storageKey, e.target.value);
      }
    });

    // Restore form values
    document.querySelectorAll('input, select, textarea').forEach(field => {
      const formId = field.form?.id || 'default';
      const fieldName = field.name || field.id;
      const storageKey = `${this.storagePrefix}${formId}_${fieldName}`;
      const savedValue = localStorage.getItem(storageKey);
      if (savedValue) {
        field.value = savedValue;
      }
    });
  }

  clearFormData(formId = 'default') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.storagePrefix + formId)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// ============= INITIALIZE ALL SYSTEMS =============
document.addEventListener('DOMContentLoaded', () => {
  // Initialize scroll animations
  window.scrollAnimations = new ScrollAnimations();

  // Initialize page synchronizer
  window.pageSynchronizer = new PageSynchronizer({ debug: false });

  // Initialize scroll event manager
  window.scrollManager = new ScrollEventManager();

  // Initialize navbar sync
  window.navbarSync = new NavbarSync();
  window.navbarSync.syncNavbarVisibility(window.scrollManager);

  // Initialize form state sync
  window.formStateSync = new FormStateSync();

  // Log initialization
  console.log('✓ Scroll Animations initialized');
  console.log('✓ Page Synchronizer initialized');
  console.log('✓ Scroll Event Manager initialized');
  console.log('✓ Navbar Sync initialized');
  console.log('✓ Form State Sync initialized');
});

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollAnimations, PageSynchronizer, ScrollEventManager, NavbarSync, FormStateSync };
}
