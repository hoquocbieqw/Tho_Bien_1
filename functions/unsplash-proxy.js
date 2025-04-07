// functions/unsplash-proxy.js
exports.handler = async function(event) {
  // Lấy tham số từ query string
  const { query, page, per_page, orientation } = event.queryStringParameters || {};
  
  // Kiểm tra các tham số bắt buộc
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Từ khóa tìm kiếm là bắt buộc" })
    };
  }
  
  try {
    // Xây dựng URL API với các tham số
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page || 1}&per_page=${per_page || 20}`;
    
    if (orientation && orientation !== 'all') {
      url += `&orientation=${orientation}`;
    }
    
    // Gọi API với API key từ biến môi trường
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_API_KEY}`
      }
    });
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Lỗi API: ${response.statusText}` })
      };
    }
    
    // Chuyển đổi kết quả và trả về
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Lỗi máy chủ: ${error.message}` })
    };
  }
};