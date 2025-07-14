const jobsGrid = document.getElementById('jobsGrid');
const searchInput = document.getElementById('searchInput');
const workModeBtn = document.getElementById('workModeBtn');
const workModeDropdown = document.getElementById('workModeDropdown');
const jobTypeBtn = document.getElementById('jobTypeBtn');
const jobTypeDropdown = document.getElementById('jobTypeDropdown');
const modalOverlay = document.getElementById('modalOverlay');
const jobModal = document.getElementById('jobModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const bookmarksBtn = document.getElementById('bookmarksBtn');
const bookmarksModal = document.getElementById('bookmarksModal');
const bookmarksOverlay = document.getElementById('bookmarksOverlay');
const bookmarksCloseBtn = document.getElementById('bookmarksCloseBtn');
const bookmarksList = document.getElementById('bookmarksList');
const noBookmarks = document.getElementById('noBookmarks');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const bookmarkCount = document.getElementById('bookmarkCount');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumbers = document.getElementById('pageNumbers');
const clearAllBookmarks = document.getElementById('clearAllBookmarks');
const modalCompanyLogo = document.getElementById('modalCompanyLogo');

let jobsData = [];
let filteredJobs = [];
let currentJob = null;
let bookmarkedJobs = JSON.parse(localStorage.getItem('bookmarkedJobs')) || [];
let currentPage = 1;
const jobsPerPage = 9;

document.addEventListener('DOMContentLoaded', () => {
    fetch('jobs.json')
        .then(response => response.json())
        .then(data => {
            jobsData = data.map(job => ({
                ...job,
                isUrgent: job.start_time.toLowerCase().includes('within the next 7 days')
            }));
            filteredJobs = [...jobsData];
            renderJobs();
            renderPagination();
        })
        .catch(error => console.error('Error loading jobs data:', error));

    initDropdown(workModeBtn, workModeDropdown);
    initDropdown(jobTypeBtn, jobTypeDropdown);
    initTheme();
    renderBookmarks();
    updateBookmarkCount();
    lucide.createIcons();
});

searchInput.addEventListener('input', () => {
    currentPage = 1;
    filterJobs();
});

workModeDropdown.addEventListener('change', () => {
    currentPage = 1;
    filterJobs();
});

jobTypeDropdown.addEventListener('change', () => {
    currentPage = 1;
    filterJobs();
});

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
bookmarksBtn.addEventListener('click', openBookmarksModal);
bookmarksCloseBtn.addEventListener('click', closeBookmarksModal);
bookmarksOverlay.addEventListener('click', closeBookmarksModal);
themeToggle.addEventListener('click', toggleTheme);
prevPageBtn.addEventListener('click', goToPrevPage);
nextPageBtn.addEventListener('click', goToNextPage);
clearAllBookmarks.addEventListener('click', clearAllBookmarksHandler);

function renderJobs() {
    jobsGrid.innerHTML = '';
    
    if (filteredJobs.length === 0) {
        jobsGrid.innerHTML = '<p class="no-jobs">No jobs match your filters. Try adjusting your search criteria.</p>';
        return;
    }
    
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
    
    currentJobs.forEach(job => {
        const isBookmarked = bookmarkedJobs.some(bJob => bJob.timestamp === job.timestamp);
        
        const jobCard = document.createElement('div');
        jobCard.className = `job-card ${job.isUrgent ? 'urgent' : ''}`;
        jobCard.innerHTML = `
            <div class="job-card-header">
                <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-job-timestamp="${job.timestamp}">
                    <i data-lucide="${isBookmarked ? 'bookmark-plus' : 'bookmark'}"></i>
                </button>
                <div class="company-logo">${getInitials(job.company_name)}</div>
                <h3 class="job-title">${job.email || 'No title provided'}</h3>
                <p class="company-name">${job.company_name}</p>
                <div class="job-meta">
                    <div class="meta-item">
                        <i data-lucide="map-pin"></i>
                        <span>${job.state || 'Location not specified'}</span>
                    </div>
                    <div class="meta-item">
                        <i data-lucide="briefcase"></i>
                        <span>${job.mode || 'Work mode not specified'}</span>
                    </div>
                </div>
                <div class="tags">
                    <span class="tag">#${job.mode || 'Unknown'}</span>
                    <span class="tag">#${job.type || 'Unknown'}</span>
                    ${job.isUrgent ? '<span class="tag urgent-tag">#Urgent</span>' : ''}
                </div>
            </div>
            <div class="job-card-footer">
                <span class="salary">${job.salary || 'Salary not specified'}</span>
                <button class="view-btn" data-job-timestamp="${job.timestamp}">
                    <span>View</span>
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        `;
        
        jobsGrid.appendChild(jobCard);
        
        const viewBtn = jobCard.querySelector('.view-btn');
        viewBtn.addEventListener('click', () => openJobModal(job.timestamp));
        
        const bookmarkBtn = jobCard.querySelector('.bookmark-btn');
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmark(job);
        });
    });
    
    lucide.createIcons();
}

function renderPagination() {
    pageNumbers.innerHTML = '';
    const pageCount = Math.ceil(filteredJobs.length / jobsPerPage);
    
    if (pageCount <= 1) {
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    document.getElementById('pagination').style.display = 'flex';
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === pageCount;
    
    const maxVisiblePages = 5;
    let startPage, endPage;
    
    if (pageCount <= maxVisiblePages) {
        startPage = 1;
        endPage = pageCount;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
        const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
        
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage + maxPagesAfterCurrent >= pageCount) {
            startPage = pageCount - maxVisiblePages + 1;
            endPage = pageCount;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageNumber = document.createElement('button');
        pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageNumber.textContent = i;
        pageNumber.addEventListener('click', () => goToPage(i));
        pageNumbers.appendChild(pageNumber);
    }
}

function goToPage(page) {
    currentPage = page;
    renderJobs();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPrevPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToNextPage() {
    const pageCount = Math.ceil(filteredJobs.length / jobsPerPage);
    if (currentPage < pageCount) {
        goToPage(currentPage + 1);
    }
}

function getInitials(companyName) {
    if (!companyName) return 'CO';
    const words = companyName.trim().split(' ');
    return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function filterJobs() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedWorkModes = Array.from(workModeDropdown.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    const selectedJobTypes = Array.from(jobTypeDropdown.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    filteredJobs = jobsData.filter(job => {
        const matchesSearch = 
            (job.email && job.email.toLowerCase().includes(searchTerm)) ||
            (job.company_name && job.company_name.toLowerCase().includes(searchTerm)) ||
            (job.state && job.state.toLowerCase().includes(searchTerm));
        
        const matchesWorkMode = selectedWorkModes.length === 0 || 
            selectedWorkModes.some(mode => job.mode && job.mode.toLowerCase().includes(mode.toLowerCase()));
        
        const matchesJobType = selectedJobTypes.length === 0 || 
            selectedJobTypes.some(type => job.type && job.type.toLowerCase().includes(type.toLowerCase()));
        
        return matchesSearch && matchesWorkMode && matchesJobType;
    });
    
    renderJobs();
    renderPagination();
}

function openJobModal(timestamp) {
    currentJob = jobsData.find(job => job.timestamp === timestamp);
    if (!currentJob) return;
    
    const isBookmarked = bookmarkedJobs.some(job => job.timestamp === timestamp);
    
    document.getElementById('modalJobTitle').textContent = currentJob.email || 'No title provided';
    document.getElementById('modalCompanyName').textContent = currentJob.company_name;
    document.getElementById('modalLocation').textContent = currentJob.state || 'Location not specified';
    document.getElementById('modalWorkMode').textContent = currentJob.mode || 'Work mode not specified';
    document.getElementById('modalStartTime').textContent = currentJob.start_time || 'Start time not specified';
    document.getElementById('modalSalary').textContent = currentJob.salary || 'Salary not specified';
    document.getElementById('modalDescription').textContent = currentJob.role || 'No description provided';
    
    modalCompanyLogo.textContent = getInitials(currentJob.company_name);
    
    const applyBtn = document.getElementById('modalApplyBtn');
    if (currentJob.company_name && currentJob.email) {
        applyBtn.href = `mailto:${currentJob.email}?subject=Application for ${currentJob.email} position`;
    } else {
        applyBtn.href = '#';
    }
    
    const bookmarkModalBtn = document.getElementById('bookmarkModalBtn');
    bookmarkModalBtn.className = `bookmark-modal-btn ${isBookmarked ? 'bookmarked' : ''}`;
    bookmarkModalBtn.innerHTML = `<i data-lucide="${isBookmarked ? 'bookmark-plus' : 'bookmark'}"></i>`;
    bookmarkModalBtn.onclick = (e) => {
        e.stopPropagation();
        toggleBookmark(currentJob);
    };
    
    modalOverlay.classList.add('active');
    jobModal.classList.add('active');
    lucide.createIcons();
}

function closeModal() {
    modalOverlay.classList.remove('active');
    jobModal.classList.remove('active');
    currentJob = null;
}

function initDropdown(button, dropdown) {
    button.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!button.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

function toggleBookmark(job) {
    const index = bookmarkedJobs.findIndex(bJob => bJob.timestamp === job.timestamp);
    let message = '';
    
    if (index === -1) {
        bookmarkedJobs.push(job);
        message = 'Job bookmarked!';
    } else {
        bookmarkedJobs.splice(index, 1);
        message = 'Bookmark removed';
    }
    
    localStorage.setItem('bookmarkedJobs', JSON.stringify(bookmarkedJobs));
    showToast(message, index === -1 ? 'bookmark-plus' : 'trash-2');
    renderJobs();
    renderBookmarks();
    updateBookmarkCount();
    
    if (currentJob && currentJob.timestamp === job.timestamp) {
        const bookmarkModalBtn = document.getElementById('bookmarkModalBtn');
        const isBookmarked = bookmarkedJobs.some(bJob => bJob.timestamp === job.timestamp);
        bookmarkModalBtn.className = `bookmark-modal-btn ${isBookmarked ? 'bookmarked' : ''}`;
        bookmarkModalBtn.innerHTML = `<i data-lucide="${isBookmarked ? 'bookmark-plus' : 'bookmark'}"></i>`;
        lucide.createIcons();
    }
}

function showToast(message, icon) {
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    toast.classList.add('show');
    lucide.createIcons();
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function openBookmarksModal() {
    bookmarksOverlay.classList.add('active');
    bookmarksModal.classList.add('active');
}

function closeBookmarksModal() {
    bookmarksOverlay.classList.remove('active');
    bookmarksModal.classList.remove('active');
}

function renderBookmarks() {
    bookmarksList.innerHTML = '';
    
    if (bookmarkedJobs.length === 0) {
        noBookmarks.style.display = 'flex';
        clearAllBookmarks.style.display = 'none';
        return;
    }
    
    noBookmarks.style.display = 'none';
    clearAllBookmarks.style.display = 'flex';
    
    bookmarkedJobs.forEach(job => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.className = 'bookmark-item';
        bookmarkItem.innerHTML = `
            <div>
                <div class="bookmark-item-title">${job.email || 'No title provided'}</div>
                <div class="bookmark-item-company">${job.company_name}</div>
            </div>
            <div class="bookmark-actions">
                <button class="bookmark-view-btn" data-job-timestamp="${job.timestamp}">
                    <span>View</span>
                    <i data-lucide="arrow-right"></i>
                </button>
                <button class="bookmark-remove-btn" data-job-timestamp="${job.timestamp}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        bookmarksList.appendChild(bookmarkItem);
        
        const viewBtn = bookmarkItem.querySelector('.bookmark-view-btn');
        viewBtn.addEventListener('click', () => {
            closeBookmarksModal();
            openJobModal(job.timestamp);
        });
        
        const removeBtn = bookmarkItem.querySelector('.bookmark-remove-btn');
        removeBtn.addEventListener('click', () => {
            toggleBookmark(job);
        });
    });
    
    lucide.createIcons();
}

function clearAllBookmarksHandler() {
    if (bookmarkedJobs.length === 0) return;
    
    if (confirm('Are you sure you want to clear all bookmarks?')) {
        bookmarkedJobs = [];
        localStorage.setItem('bookmarkedJobs', JSON.stringify(bookmarkedJobs));
        renderBookmarks();
        renderJobs();
        updateBookmarkCount();
        showToast('All bookmarks cleared', 'trash-2');
        
        if (currentJob) {
            const bookmarkModalBtn = document.getElementById('bookmarkModalBtn');
            bookmarkModalBtn.className = 'bookmark-modal-btn';
            bookmarkModalBtn.innerHTML = '<i data-lucide="bookmark"></i>';
            lucide.createIcons();
        }
    }
}

function updateBookmarkCount() {
    bookmarkCount.textContent = bookmarkedJobs.length;
    if (bookmarkedJobs.length === 0) {
        bookmarkCount.style.display = 'none';
    } else {
        bookmarkCount.style.display = 'flex';
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    lucide.createIcons();
}