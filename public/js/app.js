// Cấu hình API
const UNSPLASH_API_URL = 'https://api.unsplash.com';
const UNSPLASH_API_KEY = '6sIWYGJd_uGX5ojflMTtfjJfWdt0fPs5uCREb1CMHgY'; 
// Các biến toàn cục
let currentQuery = '';
let currentPage = 1;
let totalPages = 0;
let photoData = [];

// DOM elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const perPageSelect = document.getElementById('per-page');
const orientationSelect = document.getElementById('orientation');
const resultsSection = document.getElementById('results');
const statsSection = document.getElementById('stats');
const loadingIndicator = document.getElementById('loading');
const paginationSection = document.getElementById('pagination');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const photoTitle = document.getElementById('photo-title');
const photoAuthor = document.getElementById('photo-author');
const photoLink = document.getElementById('photo-link');
const closeBtn = document.querySelector('.close-btn');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra API key
  if (UNSPLASH_API_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
    displayError('Bạn cần cấu hình API key trước khi sử dụng ứng dụng này.');
    return;
  }

  // Sự kiện khi form tìm kiếm được submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    if (currentQuery) {
      searchPhotos();
    }
  });

  // Sự kiện đóng lightbox khi nhấn nút đóng
  closeBtn.addEventListener('click', () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
  });

  // Sự kiện đóng lightbox khi nhấn ra ngoài ảnh
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Sự kiện phím esc để đóng lightbox
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
});

// Hàm tìm kiếm ảnh
async function searchPhotos() {
  try {
    showLoading(true);
    clearResults();

    const perPage = perPageSelect.value;
    const orientation = orientationSelect.value !== 'all' ? orientationSelect.value : '';

    // Xây dựng URL API với các tham số
    let url = `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(currentQuery)}&page=${currentPage}&per_page=${perPage}`;
    
    if (orientation) {
      url += `&orientation=${orientation}`;
    }

    // Gọi API với API key trong header (phương thức được khuyến nghị)
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_API_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API key không hợp lệ hoặc đã hết hạn');
      } else if (response.status === 403) {
        throw new Error('Bạn đã vượt quá giới hạn API');
      } else {
        throw new Error(`Lỗi HTTP! Mã: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Lưu dữ liệu ảnh
    photoData = data.results;
    
    // Cập nhật tổng số trang
    totalPages = Math.ceil(data.total / perPage);
    
    // Hiển thị kết quả
    displayResults(data);
    
    // Hiển thị thanh phân trang
    displayPagination();
    
  } catch (error) {
    console.error('Lỗi khi tìm kiếm ảnh:', error);
    displayError(`Có lỗi xảy ra khi tìm kiếm ảnh: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

// Hiển thị kết quả tìm kiếm
function displayResults(data) {
  // Hiển thị thống kê
  statsSection.innerHTML = `
    <p>Tìm thấy ${data.total.toLocaleString()} kết quả cho "${currentQuery}" - Trang ${currentPage}/${totalPages || 1}</p>
  `;

  // Kiểm tra nếu không có kết quả
  if (data.results.length === 0) {
    resultsSection.innerHTML = `
      <div class="no-results">
        <h3>Không tìm thấy ảnh nào cho "${currentQuery}"</h3>
        <p>Vui lòng thử với từ khóa khác.</p>
      </div>
    `;
    return;
  }

  // Hiển thị ảnh
  data.results.forEach((photo, index) => {
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-card';
    photoCard.innerHTML = `
      <img src="${photo.urls.small}" alt="${photo.alt_description || 'Unsplash Image'}" class="photo-img">
      <div class="photo-info">
        <div class="photo-author">
          <img src="${photo.user.profile_image.small}" alt="${photo.user.name}" class="author-img">
          <span>${photo.user.name}</span>
        </div>
      </div>
    `;

    // Thêm sự kiện click để mở lightbox
    photoCard.addEventListener('click', () => {
      openLightbox(index);
    });

    resultsSection.appendChild(photoCard);
  });
}

// Mở hộp lightbox để xem ảnh lớn
function openLightbox(index) {
  const photo = photoData[index];
  
  // Hiển thị loading khi ảnh đang tải
  lightboxImg.src = '';
  lightbox.style.display = 'flex';
  
  // Tải ảnh
  const img = new Image();
  img.onload = function() {
    lightboxImg.src = photo.urls.regular;
  };
  img.src = photo.urls.regular;
  
  photoTitle.textContent = photo.description || photo.alt_description || 'Untitled';
  photoAuthor.textContent = `Photographer: ${photo.user.name}`;
  photoLink.href = photo.links.html;
  
  document.body.style.overflow = 'hidden';
}

// Hiển thị thanh phân trang
function displayPagination() {
  paginationSection.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  // Tạo nút Previous
  if (currentPage > 1) {
    const prevBtn = createPageButton('Trước', () => {
      currentPage--;
      searchPhotos();
      window.scrollTo(0, 0);
    });
    paginationSection.appendChild(prevBtn);
  }
  
  // Tạo các nút số trang
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = createPageButton(i, () => {
      currentPage = i;
      searchPhotos();
      window.scrollTo(0, 0);
    }, i === currentPage);
    paginationSection.appendChild(pageBtn);
  }
  
  // Tạo nút Next
  if (currentPage < totalPages) {
    const nextBtn = createPageButton('Tiếp', () => {
      currentPage++;
      searchPhotos();
      window.scrollTo(0, 0);
    });
    paginationSection.appendChild(nextBtn);
  }
}

// Tạo nút phân trang
function createPageButton(text, onClick, isActive = false) {
  const button = document.createElement('button');
  button.className = `page-btn ${isActive ? 'active' : ''}`;
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

// Hiển thị/ẩn loading spinner
function showLoading(show) {
  loadingIndicator.style.display = show ? 'flex' : 'none';
}

// Xóa kết quả cũ
function clearResults() {
  resultsSection.innerHTML = '';
  statsSection.innerHTML = '';
}

// Hiển thị thông báo lỗi
function displayError(message) {
  resultsSection.innerHTML = `
    <div class="no-results">
      <h3>Lỗi</h3>
      <p>${message}</p>
    </div>
  `;
}