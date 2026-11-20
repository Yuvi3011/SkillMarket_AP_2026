const BASE_URL = 'http://localhost:5001/api';

function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(endpoint, options = ) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : ),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

export const authAPI = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
};

export const userAPI = {
  getProfile:    ()     => apiFetch('/users/profile'),
  updateProfile: (body) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

export const skillsAPI = {
  getSkills:   ()         => apiFetch('/skills'),
  addSkill:    (body)     => apiFetch('/skills', { method: 'POST', body: JSON.stringify(body) }),
  removeSkill: (skillId)  => apiFetch(`/skills/${skillId}`, { method: 'DELETE' }),
};

export const marketplaceAPI = {
  getCategories: () => apiFetch('/categories'),
  
  getAllServices: (params = ) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category_id && params.category_id !== 'all') query.append('category_id', params.category_id);
    if (params.sort) query.append('sort', params.sort);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    const qs = query.toString();
    return apiFetch(`/services${qs ? `?${qs}` : ''}`);
  },

  getSingleService: (id) => apiFetch(`/services/${id}`),

  getMyServices: () => apiFetch('/services/user/my'),

  createService: (body) => apiFetch('/services', { method: 'POST', body: JSON.stringify(body) }),

  updateService: (id, body) => apiFetch(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteService: (id) => apiFetch(`/services/${id}`, { method: 'DELETE' }),
};

export const exchangeAPI = {
  
  createListing:  (body) => apiFetch('/exchanges', { method: 'POST', body: JSON.stringify(body) }),
  getAllListings:  (params = ) => {
    const q = params.search ? `?search=${encodeURIComponent(params.search)}` : '';
    return apiFetch(`/exchanges${q}`);
  },
  getSingleListing: (id)   => apiFetch(`/exchanges/${id}`),
  updateListing:    (id, body) => apiFetch(`/exchanges/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteListing:    (id)   => apiFetch(`/exchanges/${id}`, { method: 'DELETE' }),
  getMyListings:    ()     => apiFetch('/exchanges/my-listings'),
  
  getMatches:       ()     => apiFetch('/exchanges/matches'),
  
  sendRequest:      (body) => apiFetch('/exchange-requests', { method: 'POST', body: JSON.stringify(body) }),
  getReceivedRequests: ()  => apiFetch('/exchange-requests/received'),
  getSentRequests:  ()     => apiFetch('/exchange-requests/sent'),
  respondToRequest: (id, action) => apiFetch(`/exchange-requests/${id}/respond`, { method: 'PUT', body: JSON.stringify({ action }) }),
  
  getMyExchanges:   ()     => apiFetch('/my-exchanges'),
  completeExchange: (id)   => apiFetch(`/my-exchanges/${id}/complete`, { method: 'PUT' }),
};

export const ordersAPI = {
  createOrder: (body) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: (params = ) => {
    const q = new URLSearchParams();
    if (params.filter) q.append('filter', params.filter);
    if (params.status && params.status !== 'all') q.append('status', params.status);
    const qs = q.toString();
    return apiFetch(`/orders${qs ? `?${qs}` : ''}`);
  },
  getOrderDetails: (id) => apiFetch(`/orders/${id}`),
  updateOrderStatus: (id, status) => apiFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const paymentsAPI = {
  createRazorpayOrder: (body) => apiFetch('/payments/create-order', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body) => apiFetch('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
  getTransactionHistory: (params = ) => {
    const q = params.status && params.status !== 'all' ? `?status=${params.status}` : '';
    return apiFetch(`/payments/history${q}`);
  },
};

export const reviewsAPI = {
  createReview: (body) => apiFetch('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getServiceReviews: (serviceId) => apiFetch(`/reviews/${serviceId}`),
  getUserReviews: (userId) => apiFetch(`/reviews/user/${userId}`),
  getMyReviews: () => apiFetch('/reviews/user/my'),
};

export const rewardsAPI = {
  getUserRewards: () => apiFetch('/rewards'),
  getLeaderboard: () => apiFetch('/rewards/leaderboard'),
};
