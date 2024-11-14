(() => {
    const log = (message) => {
      console.log(`LinkedIn Profile Tagger: ${message}`);
    };
  
    let observer;
    let isProcessing = false;
    let pendingUpdate = false;
    let shouldCancelProcessing = false;
    let profilesData = [];
    
    log('LinkedIn Profile Tagger content script loaded');
  
    // Initialize Firebase listener for profiles
    const profilesRef = db.ref('roles');
    
    profilesRef.on('value', (snapshot) => {
      const profiles = snapshot.val() || {};
      processProfilesData(profiles);
    });
  
    function processProfilesData(profiles) {
      profilesData = [];
      Object.entries(profiles).forEach(([key, roleData], index) => {
        if (Array.isArray(roleData.profiles)) {
          roleData.profiles.forEach((profile) => {
            profilesData.push({
              name: profile.name ? profile.name.replace(/\n/g, "") : "",
              role: roleData.role ? roleData.role.replace(/\n/g, "") : "",
              bg: colorSchemes[index]?.bg || "#ffffff",
              textColor: colorSchemes[index]?.textColor || "#000000",
              profile_url: profile.profile_url ? profile.profile_url.replace(/\n/g, "") : "",
              username: profile.username ? profile.username.replace(/\n/g, "") : "",
              profile_pic_url: profile.profile_pic_url ? profile.profile_pic_url.replace(/\n/g, "") : "",
              id: profile.id ? profile.id.replace(/\n/g, "") : "",
              code: profile.code ? profile.code.replace(/\n/g, "") : ""
            });
          });
        }
      });
      
      updateProfileTags();
    }
  
    function updateProfileTags() {
      if (isProcessing) {
        pendingUpdate = true;
        shouldCancelProcessing = true;
        return;
      }
      
      isProcessing = true;
      shouldCancelProcessing = false;
      
      try {
        const mainID = document.getElementById('main');
        const doc = document.querySelector('.scaffold-layout-container--reflow');
        doc.style.marginLeft = '100px'
        mainID.style.width = '85vw'
        mainID.style.position = 'relative';
        mainID.style.zIndex = '99'
        const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
        
        if (ulElement && profilesData.length > 0) {
          let liElements = Array.from(ulElement.querySelectorAll('li'));
          const batchSize = 100;
          let index = 0;
  
          function processBatch() {
            if (shouldCancelProcessing) {
              log('Processing canceled');
              isProcessing = false;
              if (pendingUpdate) {
                pendingUpdate = false;
                updateProfileTags();
              }
              return;
            }
  
            const batch = liElements.slice(index, index + batchSize);
            batch.forEach(li => {
              const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
              if (nameTag) {
                const name = nameTag.textContent.trim();
                const matchedProfile = profilesData.find(profile => profile.name === name);
                const profileTagId = 'profile-tag-' + name.replace(/\s+/g, '-');
                let existingProfileTag = document.getElementById(profileTagId);
                
                li.style.display = 'block';
                
                if (matchedProfile) {
                  if (!existingProfileTag) {
                    const profileTagContainer = createProfileTag(matchedProfile, profileTagId, li);
                    const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
                    if (parentDiv) {
                      parentDiv.insertAdjacentElement('afterbegin', profileTagContainer);
                      parentDiv.style.height = '110px';
                    }
                  } else {
                    existingProfileTag.style.display = 'flex';
                  }
                } else {
                  // if (existingProfileTag) {
                  //   existingProfileTag.style.display = 'none';
                  // }
                  // li.style.display = 'none';
                }
              }
            });
  
            index += batchSize;
            if (index < liElements.length) {
              setTimeout(processBatch, 50);
            } else {
              isProcessing = false;
              if (pendingUpdate) {
                pendingUpdate = false;
                updateProfileTags();
              }
            }
          }
  
          processBatch();
        } else {
          handleEmptyList(ulElement);
        }
      } catch (error) {
        log('Error updating profile tags: ' + error.message);
        isProcessing = false;
      }
    }
  
    function createProfileTag(profile, profileTagId, li) {
      const profileTagContainer = document.createElement('div');
      profileTagContainer.id = profileTagId;
      profileTagContainer.style.display = 'flex';
      profileTagContainer.style.alignItems = 'center';
      profileTagContainer.classList.add('profile-tag-container');
  
      // Role span
      const roleSpan = document.createElement('span');
      roleSpan.textContent = profile.role;
      roleSpan.style.borderRadius = '5px';
      roleSpan.style.backgroundColor = profile.bg;
      roleSpan.style.color = profile.textColor;
      roleSpan.style.padding = '3px 5px';
      roleSpan.style.fontSize = '12px';
      roleSpan.style.marginRight = '5px';
  
      // ID span
      const idSpan = document.createElement('span');
      idSpan.textContent = profile.id;
      idSpan.style.marginLeft = '5px';
      idSpan.style.backgroundColor = profile.textColor;
      idSpan.style.color = profile.bg;
      idSpan.style.padding = '3px 5px';
      idSpan.style.borderRadius = '5px';
      idSpan.style.fontSize = '12px';
      idSpan.style.marginRight = '5px';
  
      // Profile status indicator
      const imgSpan = document.createElement('div');
      imgSpan.classList.add('id-tag');
      imgSpan.style.marginLeft = '5px';
      imgSpan.style.width = '10px';
      imgSpan.style.height = '10px';
      imgSpan.style.borderRadius = '50%';
  
      // Check profile image code
      const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
      const imgElement = anchorElement?.querySelector('img.presence-entity__image');
      imgSpan.style.backgroundColor = (profile.code && imgElement?.src.includes(profile.code)) ? 'green' : 'orange';
  
      profileTagContainer.appendChild(roleSpan);
      profileTagContainer.appendChild(idSpan);
      profileTagContainer.appendChild(imgSpan);
  
      return profileTagContainer;
    }
  
    function handleEmptyList(ulElement) {
      if (ulElement) {
        ulElement.querySelectorAll('li').forEach(li => {
          li.style.display = 'block';
          const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
          if (nameTag) {
            const name = nameTag.textContent.trim();
            const profileTagId = 'profile-tag-' + name.replace(/\s+/g, '-');
            let existingProfileTag = document.getElementById(profileTagId);
            // if (existingProfileTag) {
            //   existingProfileTag.style.display = 'none';
            // }
          }
        });
      }
      isProcessing = false;
    }
  
    function startScript() {
      if (observer) observer.disconnect();
      
      updateProfileTags();
  
      observer = new MutationObserver((mutations) => {
        let mutationCausedChange = false;
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length || mutation.removedNodes.length) {
            mutationCausedChange = true;
          }
        });
        if (mutationCausedChange && !isProcessing) {
          updateProfileTags();
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "URL_UPDATED") {
        startScript();
      }
    });
  
    // Initial start
    startScript();
  })();
  