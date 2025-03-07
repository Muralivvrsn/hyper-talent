// Simplified LinkedIn Camera Focus Script
// Press Q to activate direct element focus
// Press P to activate pinch-zoom style focus
// Press X to activate click position zoom
// Press ESC to reset (only ESC will work)

(function() {
    console.log('Initializing LinkedIn Camera Focus Script');
    
    // Configuration
    const config = {
      zoomFactor: 1.4,
      animationDuration: 800,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Smooth easing for camera feel
      vignette: true, // Add vignette when focused
      debugMode: true
    };
    
    // Focus modes
    const FOCUS_MODES = {
      DIRECT: 'direct',
      PINCH_ZOOM: 'pinchZoom',
      CLICK_POSITION: 'clickPosition',
      NONE: 'none'
    };
    
    let originalState = {};
    let isFocused = false;
    let activeFocusMode = FOCUS_MODES.NONE;
    let currentUrl = window.location.href;
    let focusedElement = null;
    let backdropElement = null;
    
    // Debug logging
    function log(...args) {
      if (config.debugMode) {
        console.log('[CameraFocus]', ...args);
      }
    }
    
    // URL change detection
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        log('URL changed, resetting');
        currentUrl = window.location.href;
        resetFocus();
      }
    }, 500);
    
    // Save original state
    function saveState() {
      const html = document.documentElement;
      const body = document.body;
      
      originalState = {
        htmlTransform: html.style.transform,
        htmlTransformOrigin: html.style.transformOrigin,
        htmlTransition: html.style.transition,
        bodyOverflow: body.style.overflow,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      };
      
      log('Original state saved:', originalState);
    }
    
    // Special handling for LinkedIn profiles
    function isLinkedInProfile() {
      return window.location.href.includes('linkedin.com/in/');
    }
    
    // Create backdrop with vignette effect
    function createBackdrop() {
      // Remove existing backdrop if any
      removeBackdrop();
      
      // Only create if vignette is enabled
      if (!config.vignette) return;
      
      // Create new backdrop
      backdropElement = document.createElement('div');
      backdropElement.id = 'camera-focus-backdrop';
      backdropElement.style.position = 'fixed';
      backdropElement.style.top = '0';
      backdropElement.style.left = '0';
      backdropElement.style.width = '100%';
      backdropElement.style.height = '100%';
      backdropElement.style.zIndex = '9998';
      backdropElement.style.pointerEvents = 'none';
      backdropElement.style.transition = `all ${config.animationDuration}ms ${config.easing}`;
      backdropElement.style.boxShadow = 'inset 0 0 150px rgba(0,0,0,0)';
      
      document.body.appendChild(backdropElement);
      
      // Fade in backdrop
      setTimeout(() => {
        backdropElement.style.boxShadow = 'inset 0 0 150px rgba(0,0,0,0.7)';
      }, 50);
    }
    
    // Remove backdrop
    function removeBackdrop() {
      if (backdropElement) {
        // Fade out
        backdropElement.style.boxShadow = 'inset 0 0 150px rgba(0,0,0,0)';
        
        // Remove after transition
        setTimeout(() => {
          if (backdropElement && backdropElement.parentNode) {
            backdropElement.parentNode.removeChild(backdropElement);
          }
          backdropElement = null;
        }, config.animationDuration);
      }
    }
    
    // Main focus function - routes to correct focus method based on active mode
    function focusOnElement(element, event) {
      if (isFocused || activeFocusMode === FOCUS_MODES.NONE) return;
      
      log(`Focusing on element using ${activeFocusMode} mode:`, element);
      saveState();
      focusedElement = element;
      
      // Create camera effect backdrop
      createBackdrop();
      
      // Apply focus based on active mode
      switch(activeFocusMode) {
        case FOCUS_MODES.DIRECT:
          applyDirectElementFocus(element);
          break;
        case FOCUS_MODES.PINCH_ZOOM:
          applyPinchZoomStyle(element);
          break;
        case FOCUS_MODES.CLICK_POSITION:
          applyClickPositionZoom(event, element);
          break;
      }
    }
    
    // Apply direct element focus (simple)
    function applyDirectElementFocus(element) {
      log('Applying direct element focus');
      
      // Skip tiny elements
      const rect = element.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 100) {
        log('Element too small for direct focus, trying pinch zoom instead');
        applyPinchZoomStyle(element);
        return;
      }
      
      // Save original element styles
      const originalTransform = element.style.transform;
      const originalTransitionProperty = element.style.transitionProperty;
      const originalTransitionDuration = element.style.transitionDuration;
      const originalTransitionTimingFunction = element.style.transitionTimingFunction;
      const originalTransformOrigin = element.style.transformOrigin;
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;
      const originalBoxShadow = element.style.boxShadow;
      
      // Create overlay to block clicks but not reset zoom
    //   const overlay = document.createElement('div');
    //   overlay.id = 'focus-overlay';
    //   overlay.style.position = 'fixed';
    //   overlay.style.top = '0';
    //   overlay.style.left = '0';
    //   overlay.style.width = '100%';
    //   overlay.style.height = '100%';
    //   overlay.style.zIndex = '9999';
    //   overlay.style.cursor = 'default';
    //   overlay.style.background = 'transparent';
      
      // Add click handler to overlay (ESC key only for reset)
    //   overlay.addEventListener('click', (e) => {
    //     // Don't do anything on click - require ESC key
    //     e.stopPropagation();
    //     e.preventDefault();
    //   });
      
      // Append overlay
    //   document.body.appendChild(overlay);
      
      // Apply transform and highlight with camera-like motion
      element.style.transitionProperty = 'transform, box-shadow';
      element.style.transitionDuration = `${config.animationDuration}ms`;
      element.style.transitionTimingFunction = config.easing;
      element.style.transformOrigin = 'center';
      element.style.transform = `translateX(100px) scale(${config.zoomFactor})`;
      element.style.boxShadow = '0 10px 50px rgba(0,0,0,0.5)';
      element.style.position = 'relative';
      element.style.zIndex = '10000';
      
      // Store reference for reset
      originalState.directFocus = {
        element,
        originalTransform,
        originalTransitionProperty,
        originalTransitionDuration,
        originalTransitionTimingFunction,
        originalTransformOrigin,
        originalPosition,
        originalZIndex,
        originalBoxShadow
      };
      
      isFocused = true;
    }
    
    // Apply pinch-zoom style focus
    function applyPinchZoomStyle(element) {
      log('Applying pinch-zoom style focus');
      
      const html = document.documentElement;
      const body = document.body;
      
      // Create overlay to block clicks but not reset zoom
    //   const overlay = document.createElement('div');
    //   overlay.id = 'focus-overlay';
    //   overlay.style.position = 'fixed';
    //   overlay.style.top = '0';
    //   overlay.style.left = '0';
    //   overlay.style.width = '100%';
    //   overlay.style.height = '100%';
    //   overlay.style.zIndex = '9999';
    //   overlay.style.cursor = 'default';
    //   overlay.style.background = 'transparent';
      
      // Add click handler to overlay (ESC key only for reset)
    //   overlay.addEventListener('click', (e) => {
    //     // Don't do anything on click - require ESC key
    //     e.stopPropagation();
    //     e.preventDefault();
    //   });
      
      // Append overlay
    //   document.body.appendChild(overlay);
      
      // For pinch zoom style, we'll center on the element
      // but keep the whole page in the view (like mobile pinch zoom)
      const rect = element.getBoundingClientRect();
      
      // Calculate the center point of the element
      const elementCenterX = rect.left + rect.width / 2;
      const elementCenterY = rect.top + rect.height / 2;
      
      // Calculate viewport center
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      
      // Apply transform origin to center of element
      html.style.transformOrigin = `${elementCenterX}px ${elementCenterY}px`;
      html.style.transition = `transform ${config.animationDuration}ms ${config.easing}`;
      
      // Apply transform with a "pinch zoom" effect - scale from the click point and offset 100px to the right
      html.style.transform = `translateX(0px) scale(${config.zoomFactor})`;
      
      body.style.overflow = 'hidden';
      isFocused = true;
      
      // Highlight the element with a subtle glow
      try {
        element.style.transition = `all ${config.animationDuration}ms ${config.easing}`;
        element.style.boxShadow = '0 0 30px rgba(255,255,255,0.3)';
        element._originalOutline = element.style.outline;
        element.style.outline = '1px solid rgba(255,255,255,0.3)';
        
        // Store for reset
        originalState.highlightedElement = element;
      } catch (e) {
        log('Could not highlight element:', e);
      }
    }
    
    // Apply zoom exactly where clicked
    function applyClickPositionZoom(event, element) {
      log('Applying zoom at exact click position');
      
      const html = document.documentElement;
      const body = document.body;
      
      // Create overlay to block clicks but not reset zoom
    //   const overlay = document.createElement('div');
    //   overlay.id = 'focus-overlay';
    //   overlay.style.position = 'fixed';
    //   overlay.style.top = '0';
    //   overlay.style.left = '0';
    //   overlay.style.width = '100%';
    //   overlay.style.height = '100%';
    //   overlay.style.zIndex = '9999';
    //   overlay.style.cursor = 'default';
    //   overlay.style.background = 'transparent';
      
      // Add click handler to overlay (ESC key only for reset)
    //   overlay.addEventListener('click', (e) => {
    //     // Don't do anything on click - require ESC key
    //     e.stopPropagation();
    //     e.preventDefault();
    //   });
      
      // Append overlay
    //   document.body.appendChild(overlay);
      
      // Use the exact click position as the transform origin
      const clickX = event.clientX;
      const clickY = event.clientY;
      
      log('Click position:', { x: clickX, y: clickY });
      
      // Apply transform origin exactly at click point
      html.style.transformOrigin = `${clickX}px ${clickY}px`;
      html.style.transition = `transform ${config.animationDuration}ms ${config.easing}`;
      
      // Apply transform with offset to the right
      html.style.transform = `translateX(0px) scale(${config.zoomFactor})`;
      
      body.style.overflow = 'hidden';
      isFocused = true;
      
      // Create a small indicator at click point
      const indicator = document.createElement('div');
      indicator.id = 'click-point-indicator';
      indicator.style.position = 'fixed';
      indicator.style.width = '10px';
      indicator.style.height = '10px';
      indicator.style.borderRadius = '50%';
    //   indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    //   indicator.style.boxShadow = '0 0 10px white';
      indicator.style.zIndex = '10001';
      indicator.style.pointerEvents = 'none';
      indicator.style.top = (clickY - 5) + 'px';
      indicator.style.left = (clickX - 5) + 'px';
      
      document.body.appendChild(indicator);
      
      // Store for reset
      originalState.clickPositionZoom = {
        indicator
      };
    }
    
    // Reset focus
    function resetFocus() {
      if (!isFocused) return;
      
      log('Resetting focus');
      
      // Remove backdrop
      removeBackdrop();
      
      // Find and remove overlay
      const overlay = document.getElementById('focus-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
      
      // Check for direct element focus first
      if (originalState.directFocus) {
        const { 
          element, 
          originalTransform, 
          originalTransitionProperty, 
          originalTransitionDuration,
          originalTransitionTimingFunction,
          originalTransformOrigin,
          originalPosition,
          originalZIndex,
          originalBoxShadow
        } = originalState.directFocus;
        
        // Reset element style with animation
        element.style.transform = originalTransform;
        element.style.boxShadow = originalBoxShadow;
        
        // Reset after animation
        setTimeout(() => {
          element.style.transitionProperty = originalTransitionProperty;
          element.style.transitionDuration = originalTransitionDuration;
          element.style.transitionTimingFunction = originalTransitionTimingFunction;
          element.style.transformOrigin = originalTransformOrigin;
          element.style.position = originalPosition;
          element.style.zIndex = originalZIndex;
        }, config.animationDuration);
        
        originalState.directFocus = null;
        isFocused = false;
        activeFocusMode = FOCUS_MODES.NONE;
        document.body.style.cursor = '';
        return;
      }
      
      // Check for click position zoom
      if (originalState.clickPositionZoom) {
        const { indicator } = originalState.clickPositionZoom;
        
        if (indicator && indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
        
        originalState.clickPositionZoom = null;
      }
      
      // Standard reset for pinch zoom style
      const html = document.documentElement;
      const body = document.body;
      
      // Reset highlighted element if any
      if (originalState.highlightedElement) {
        originalState.highlightedElement.style.boxShadow = '';
        originalState.highlightedElement.style.outline = originalState.highlightedElement._originalOutline || '';
        originalState.highlightedElement = null;
      }
      
      // Reset transforms with animation
      html.style.transition = `transform ${config.animationDuration}ms ${config.easing}`;
      html.style.transform = originalState.htmlTransform || '';
      
      setTimeout(() => {
        html.style.transformOrigin = originalState.htmlTransformOrigin || '';
        html.style.transition = originalState.htmlTransition || '';
        body.style.overflow = originalState.bodyOverflow || '';
        
        // Restore scroll position
        window.scrollTo({
          top: originalState.scrollY || 0,
          left: originalState.scrollX || 0,
          behavior: 'smooth'
        });
      }, config.animationDuration);
      
      isFocused = false;
      activeFocusMode = FOCUS_MODES.NONE;
      document.body.style.cursor = '';
    }
    
    // Find best target
    function findFocusTarget(element) {
      log('Finding focus target for:', element);
      
      // For LinkedIn profiles, be more specific
      if (isLinkedInProfile()) {
        // Look for specific LinkedIn components
        let target = element;
        const maxParents = 4;
        let count = 0;
        
        while (target && count < maxParents) {
          // Check for LinkedIn common components
          if (target.classList && (
              target.classList.contains('profile-card') ||
              target.classList.contains('profile-section') ||
              target.classList.contains('pv-top-card') ||
              target.classList.contains('pv-entity__summary-info') ||
              target.tagName === 'SECTION' ||
              target.tagName === 'ARTICLE')
          ) {
            log('Found suitable LinkedIn component:', target);
            return target;
          }
          
          // Get minimum size
          const rect = target.getBoundingClientRect();
          if (rect.width >= 100 && rect.height >= 100 && 
              rect.width <= window.innerWidth * 0.8 &&
              rect.height <= window.innerHeight * 0.8) {
            log('Found suitably sized element:', target);
            return target;
          }
          
          target = target.parentElement;
          count++;
        }
      }
      
      // Standard target finding
      let target = element;
      const minSize = 50;
      
      // Check size
      let rect = target.getBoundingClientRect();
      log('Initial size:', rect.width, 'x', rect.height);
      
      // Go up the tree if too small
      while (rect.width < minSize || rect.height < minSize) {
        if (!target.parentElement || target.parentElement === document.body) {
          break;
        }
        
        target = target.parentElement;
        rect = target.getBoundingClientRect();
        log('New target size:', rect.width, 'x', rect.height);
      }
      
      // Don't select huge elements
      if (rect.width > window.innerWidth * 0.9 || rect.height > window.innerHeight * 0.9) {
        log('Target too large, using original element');
        return element;
      }
      
      return target;
    }
    
    // Update cursor based on active focus mode
    function updateCursor() {
      if (activeFocusMode === FOCUS_MODES.NONE) {
        document.body.style.cursor = '';
      } else if (activeFocusMode === FOCUS_MODES.DIRECT) {
        document.body.style.cursor = 'cell'; // Camera-like cursor
      } else if (activeFocusMode === FOCUS_MODES.CLICK_POSITION) {
        document.body.style.cursor = 'crosshair'; // Precise click cursor
      } else {
        document.body.style.cursor = 'zoom-in'; // Standard zoom cursor
      }
    }
    
    // Handle click
    function handleClick(event) {
      if (activeFocusMode === FOCUS_MODES.NONE || isFocused) return;
      
      log('Click detected on:', event.target);
      
      const target = findFocusTarget(event.target);
      log('Focus target selected:', target);
      
      focusOnElement(target, event);
      
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Handle keys
    function handleKey(event) {
      // Q key activates direct element focus
      if (event.key === 'q' || event.key === 'Q') {
        if (!isFocused) {
          log('Q key pressed, activating direct element focus mode');
          activeFocusMode = FOCUS_MODES.DIRECT;
          updateCursor();
        }
      }
      // P key activates pinch zoom style focus
      else if (event.key === 'p' || event.key === 'P') {
        if (!isFocused) {
          log('P key pressed, activating pinch zoom style focus');
          activeFocusMode = FOCUS_MODES.PINCH_ZOOM;
          updateCursor();
        }
      }
      // X key activates click position zoom
      else if (event.key === 'x' || event.key === 'X') {
        if (!isFocused) {
          log('X key pressed, activating click position zoom');
          activeFocusMode = FOCUS_MODES.CLICK_POSITION;
          updateCursor();
        }
      }
      // ESC key resets focus
      else if (event.key === 'c' || event.key === 'c') {
        log('ESC key pressed');
        resetFocus();
      }
    }
    
    // Setup event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKey);
    
    // Display help message
    function showHelp() {
      console.log(`
╔════════════════════════════════════════════════════╗
║          LinkedIn Camera Focus Script               ║
╠════════════════════════════════════════════════════╣
║  Q = Activate Direct Element Focus                  ║
║  P = Activate Pinch-Zoom Style Focus                ║
║  X = Activate Click Position Zoom                   ║
║  ESC = Reset Focus (ONLY ESC will exit zoom)        ║
║                                                    ║
║  After pressing a mode key, click any element      ║
╚════════════════════════════════════════════════════╝
      `);
    }
    
    // Public API
    window.cameraFocus = {
      activateDirectFocus: () => {
        activeFocusMode = FOCUS_MODES.DIRECT;
        updateCursor();
      },
      activatePinchZoomFocus: () => {
        activeFocusMode = FOCUS_MODES.PINCH_ZOOM;
        updateCursor();
      },
      activateClickPositionZoom: () => {
        activeFocusMode = FOCUS_MODES.CLICK_POSITION;
        updateCursor();
      },
      deactivate: () => {
        activeFocusMode = FOCUS_MODES.NONE;
        updateCursor();
        if (isFocused) resetFocus();
      },
      reset: resetFocus,
      isActive: () => activeFocusMode !== FOCUS_MODES.NONE,
      isFocused: () => isFocused,
      config: config,
      showHelp: showHelp
    };
    
    // Show help message on initialization
    showHelp();
    
    log('LinkedIn Camera Focus Script initialized - ESC only to reset zoom.');
})();