/**
 * MSM TrainerZone - A modern game trainer website
 * Designed and coded by Muhammad Meluk under MelokMade Innovations
 * Copyright (c) 2025 MelokMade Innovations. All rights reserved.
 */

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const trainerContainer = document.getElementById('trainer-container');
    const trainerCountElement = document.getElementById('trainer-count');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const sortAZButton = document.getElementById('sort-az');
    const sortZAButton = document.getElementById('sort-za');
    const themeToggle = document.getElementById('theme-toggle');
    const downloadModal = document.getElementById('download-modal');
    const modalGameName = document.getElementById('modal-game-name');
    const closeModal = document.querySelector('.close-modal');
    const progressBar = document.querySelector('.progress-bar');

    // Initialize dark mode from localStorage
    initTheme();
    
    // Define variables for pagination and trainer data
    let trainers = []; // All trainers from JSON
    let displayedTrainers = []; // Currently displayed trainers
    let currentPage = 1;
    const itemsPerPage = 9; // Show 9 trainers per page
    let isSearching = false; // Flag to track if user is searching

    // Fetch trainers from JSON file
    fetch('assets/trainers.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load trainer data');
            }
            return response.json();
        })
        .then(data => {
            // Store all trainers
            trainers = data;
            // Update total count in UI (shows total available)
            updateTrainerCount(trainers.length);
            // Show first page of trainers
            loadTrainerPage(currentPage);
            // Add load more button if needed
            checkAndAddLoadMoreButton();
        })
        .catch(error => {
            console.error('Error loading trainers:', error);
            // Show error message in trainer container
            trainerContainer.innerHTML = `
                <div class="error-message">
                    <p>Unable to load trainer data. Please try again later.</p>
                </div>
            `;
        });
        
    // Function to load a specific page of trainers
    function loadTrainerPage(page) {
        // If searching, don't use pagination
        if (isSearching) return;
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        displayedTrainers = trainers.slice(0, endIndex); // Get trainers up to current page
        
        // Render the current set of trainers
        renderTrainerCards(displayedTrainers);
    }
    
    // Check if we need a load more button and add it if necessary
    function checkAndAddLoadMoreButton() {
        // Remove existing button if it exists
        const existingButton = document.getElementById('load-more-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Don't show load more during search
        if (isSearching) return;
        
        // Check if we have more trainers to show
        if (trainers.length > displayedTrainers.length) {
            const loadMoreButton = document.createElement('button');
            loadMoreButton.id = 'load-more-button';
            loadMoreButton.className = 'load-more-button';
            loadMoreButton.textContent = 'Load More Trainers';
            loadMoreButton.addEventListener('click', () => {
                currentPage++;
                loadTrainerPage(currentPage);
                checkAndAddLoadMoreButton();
            });
            
            trainerContainer.insertAdjacentElement('afterend', loadMoreButton);
        }
    }

    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', handleSearch);
    searchButton.addEventListener('click', () => handleSearch());
    sortAZButton.addEventListener('click', () => sortTrainers('asc'));
    sortZAButton.addEventListener('click', () => sortTrainers('desc'));
    closeModal.addEventListener('click', closeDownloadModal);

    // Clicking outside modal closes it
    window.addEventListener('click', function(event) {
        if (event.target === downloadModal) {
            closeDownloadModal();
        }
    });

    // Create and render trainer cards
    function renderTrainerCards(trainersArray) {
        // Clear container first
        trainerContainer.innerHTML = '';

        if (trainersArray.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No trainers found matching your search.';
            trainerContainer.appendChild(noResults);
            return;
        }

        // Render each trainer card
        trainersArray.forEach(trainer => {
            const card = createTrainerCard(trainer);
            trainerContainer.appendChild(card);
        });
    }

    // Create individual trainer card
    function createTrainerCard(trainer) {
        const card = document.createElement('div');
        card.className = 'trainer-card';

        // Create image element or placeholder
        const imageContainer = document.createElement('div');
        imageContainer.className = 'trainer-image';
        
        if (trainer.image) {
            const img = document.createElement('img');
            img.src = trainer.image;
            img.alt = `${trainer.name} game cover`;
            imageContainer.appendChild(img);
        } else {
            imageContainer.textContent = trainer.name[0];
        }

        // Create trainer details section
        const details = document.createElement('div');
        details.className = 'trainer-details';

        const name = document.createElement('h3');
        name.className = 'trainer-name';
        name.textContent = trainer.name;

        // Create download link instead of button to support opening in new tab
        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'download-button';
        downloadBtn.href = trainer.downloadLink;
        downloadBtn.target = '_blank'; // Open in new tab
        downloadBtn.rel = 'noopener noreferrer'; // Security best practice for target="_blank"
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Trainer
        `;
        
        // Add click event for download tracking and modal
        downloadBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            handleDownload(trainer);
            
            // Open the link in a new tab after a short delay
            setTimeout(() => {
                window.open(trainer.downloadLink, '_blank');
            }, 1000);
        });

        // Assemble the card
        details.appendChild(name);
        details.appendChild(downloadBtn);

        card.appendChild(imageContainer);
        card.appendChild(details);

        return card;
    }

    // Update trainer count display
    function updateTrainerCount(count) {
        trainerCountElement.textContent = count;
    }

    // Handle search functionality
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            // If search is cleared, return to pagination view
            isSearching = false;
            currentPage = 1;
            loadTrainerPage(currentPage);
            checkAndAddLoadMoreButton();
            updateTrainerCount(trainers.length);
            return;
        }
        
        // Set searching flag to true during search
        isSearching = true;
        
        // Filter trainers based on search term
        const filteredTrainers = trainers.filter(trainer => 
            trainer.name.toLowerCase().includes(searchTerm)
        );
        
        // Render search results
        renderTrainerCards(filteredTrainers);
        updateTrainerCount(filteredTrainers.length);
        
        // Hide load more button during search
        checkAndAddLoadMoreButton();
    }

    // Sort trainers by name
    function sortTrainers(direction) {
        // Sort all trainers first
        trainers.sort((a, b) => {
            if (direction === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });
        
        // If we're searching, sort the filtered results
        if (isSearching) {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const filteredTrainers = trainers.filter(trainer => 
                trainer.name.toLowerCase().includes(searchTerm)
            );
            renderTrainerCards(filteredTrainers);
        } else {
            // Reset pagination and reload first page
            currentPage = 1;
            loadTrainerPage(currentPage);
            checkAndAddLoadMoreButton();
        }
    }

    // Handle download button click
    function handleDownload(trainer) {
        console.log(`Downloading ${trainer.name} trainer...`);
        
        // Track download event with Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', 'download_trainer', {
                'event_category': 'trainers',
                'event_label': trainer.name,
                'value': 1
            });
        }
        
        // Update modal content
        modalGameName.textContent = trainer.name;
        
        // Show the modal with animation
        downloadModal.classList.add('show');
        
        // Animate progress bar
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 100);
        
        // Auto dismiss after animation completes
        setTimeout(() => {
            closeDownloadModal();
        }, 2500);
    }

    // Close download modal
    function closeDownloadModal() {
        downloadModal.classList.remove('show');
        
        // Reset progress bar after modal is hidden
        setTimeout(() => {
            progressBar.style.width = '0';
        }, 300);
    }

    // Toggle between dark and light theme
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        
        // Save theme preference to localStorage
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Initialize theme from localStorage
    function initTheme() {
        const savedDarkMode = localStorage.getItem('darkMode');
        
        // If darkMode is not set in localStorage or is 'true', apply dark mode
        if (savedDarkMode === null || savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        }
    }

    // Implement intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Apply observer to sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});
