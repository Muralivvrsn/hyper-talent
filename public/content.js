// Function to highlight names based on a predefined condition
function highlightName(element) {
    element.style.border = "2px solid red";
  }
  
  // Function to find and process names in the DOM
  function processNames() {
    const nameElements = document.querySelectorAll('h3.msg-conversation-listitem__participant-names');
  
    nameElements.forEach((element) => {
      const name = element.innerText.trim();
      // Replace with your condition to highlight the name
      if (name) {
        highlightName(element);
      }
    });
  }
  
  // Function to observe DOM changes and process names
  function observeDOMChanges() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
  
    const callback = function(mutationsList, observer) {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          processNames();
        }
      }
    };
  
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }
  
  // Initial processing of names
  processNames();
  
  // Start observing the DOM for changes
  observeDOMChanges();