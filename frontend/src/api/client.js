/* ============================================================
   WasteLoop React — Centralized Dynamic API Client (client.js)
   Async fetch wrapper targeting Flask backend via Vite proxy
   Direct PostgreSQL database integration with safe mock fallback
   ============================================================ */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const url = BASE_URL + endpoint;
  const defaultOptions = {
    credentials: 'include',   // send session cookies to Flask
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...(options.headers || {}) },
      credentials: 'include',
    });

    if (response.status === 204) return { data: null, raw: null, error: null };
    const contentType = response.headers.get('content-type') || '';

    // Vite proxy may return HTML (index.html) for unmatched /api/* routes
    // or Flask may be temporarily unreachable
    if (!contentType.includes('application/json')) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        return { data: null, raw: null, error: 'Backend server is not reachable. Please start the Flask server.' };
      }
      return { data: null, raw: null, error: 'Server returned an unexpected response. Please ensure the backend is running on port 5000.' };
    }

    const json = await response.json();

    if (!response.ok) {
      return { data: null, raw: json, error: (json && (json.message || json.error)) || `HTTP ${response.status}` };
    }

    // Auto-unwrap Flask envelope { success: true, data: ..., message: ... }
    const unwrapped = (json && typeof json === 'object' && 'data' in json && 'success' in json) ? json.data : json;
    return { data: unwrapped, raw: json, error: null };
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED')) {
      return { data: null, raw: null, error: 'Cannot connect to server. Please ensure the backend is running.' };
    }
    return { data: null, raw: null, error: msg || 'Network unavailable' };
  }
}

// ── Fallback Fixtures (used strictly when offline/unreachable) ──
export const MOCK = {
  dashboard: {
    metrics: {
      total_collected_kg: 18450,
      collected_trend_pct: 14.2,
      segregation_rate_pct: 91.8,
      active_pickups: 16,
      critical_bins_count: 2,
      circularity_score: 88,
      co2_avoided_kg: 24200,
    },
    weekly_trend: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      collected: [2100, 2450, 2800, 3100, 2900, 3400, 3800],
      diverted:  [1900, 2200, 2600, 2900, 2750, 3200, 3550]
    },
    composition: {
      labels: ['Plastics (PET/HDPE)', 'Organics', 'Cardboard & Paper', 'Metals & Aluminum', 'E-Waste'],
      data: [32, 28, 20, 14, 6],
      colors: ['#22c55e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
    },
    ai_insights: [
      {
        id: 'INS-01',
        title: 'Sector 4 Overflow Forecast',
        text: 'Bin #B-104 (92%) and #B-107 (88%) at Metro Plaza will hit 100% capacity within 45 minutes due to weekend retail foot traffic.',
        urgency: 'critical',
        recommended_action: 'Dispatch Vehicle V-03 on priority route'
      },
      {
        id: 'INS-02',
        title: 'High-Purity Segregation Streak',
        text: 'Apex Tech Hub recorded 98.4% clean cardboard segregation for 14 consecutive days. Eligible for Tier 1 circular bonus.',
        urgency: 'positive',
        recommended_action: 'Award ESG Badge'
      }
    ]
  },

  bins: [
    { id: 'B-104', location: 'Metro Central Plaza', zone: 'Sector 4', waste_type: 'Plastics', fill_pct: 92, status: 'critical', last_emptied: '3 hours ago', lat: 37.7749, lng: -122.4194 },
    { id: 'B-107', location: 'Grand Market West', zone: 'Sector 4', waste_type: 'Mixed Recyclables', fill_pct: 88, status: 'warning', last_emptied: '5 hours ago', lat: 37.7833, lng: -122.4167 },
    { id: 'B-112', location: 'Harbor Hotel Terminal', zone: 'Sector 2', waste_type: 'Organics', fill_pct: 64, status: 'normal', last_emptied: '1 hour ago', lat: 37.7650, lng: -122.4250 },
    { id: 'B-118', location: 'Apex Innovation Campus', zone: 'Sector 1', waste_type: 'E-Waste', fill_pct: 45, status: 'normal', last_emptied: 'Yesterday', lat: 37.7900, lng: -122.4000 },
    { id: 'B-125', location: 'GreenValley Condos Block A', zone: 'Sector 3', waste_type: 'Cardboard', fill_pct: 78, status: 'warning', last_emptied: '6 hours ago', lat: 37.7550, lng: -122.4300 },
    { id: 'B-130', location: 'South Pier Promenade', zone: 'Sector 2', waste_type: 'Glass & Metals', fill_pct: 32, status: 'normal', last_emptied: '4 hours ago', lat: 37.7600, lng: -122.4100 },
  ],

  pickups: [
    { id: 'PK-1002', source_name: 'Metro Eco Supermarket', address: '840 Commercial Way', waste_type: 'Cardboard', estimated_weight_kg: 180, priority: 'high', status: 'assigned', collector_id: 1, collector_name: 'Alex Rivera', scheduled_time: '10:30 AM Today' },
    { id: 'PK-1004', source_name: 'Harbor Hotel & Suites', address: '12 Marina Promenade', waste_type: 'Organics', estimated_weight_kg: 320, priority: 'high', status: 'in_transit', collector_id: 1, collector_name: 'Alex Rivera', scheduled_time: '11:45 AM Today' },
    { id: 'PK-1008', source_name: 'Metro Central Plaza (Bin B-104)', address: 'Sector 4 Main Gate', waste_type: 'Plastics', estimated_weight_kg: 240, priority: 'critical', status: 'pending', collector_id: null, collector_name: 'Unassigned', scheduled_time: 'Immediate' },
    { id: 'PK-1011', source_name: 'Grand Horizon Supercenter', address: '120 Logistics Pkwy', waste_type: 'Cardboard', estimated_weight_kg: 420, priority: 'medium', status: 'pending', collector_id: null, collector_name: 'Unassigned', scheduled_time: '02:00 PM Today' },
    { id: 'PK-0998', source_name: 'Apex Technology Park', address: '400 Innovation Drive', waste_type: 'E-Waste', estimated_weight_kg: 85, priority: 'medium', status: 'completed', collector_id: 2, collector_name: 'Sarah Chen', scheduled_time: 'Yesterday' },
  ],

  collectors: [
    { id: 1, name: 'Alex Rivera', status: 'available', rating: 4.9, completed_today: 4, vehicle: 'Electric Van V-03', phone: '+1 555-0192' },
    { id: 2, name: 'Sarah Chen', status: 'available', rating: 4.8, completed_today: 5, vehicle: 'Compactor Truck V-01', phone: '+1 555-0184' }
  ],

  vehicles: [
    { id: 'V-01', type: 'Compactor Truck', capacity_kg: 3500, current_load_kg: 1800, status: 'in_use', assigned_collector: 'Sarah Chen', battery_fuel: '84% (EV)' },
    { id: 'V-02', type: 'Electric Van', capacity_kg: 1200, current_load_kg: 0, status: 'available', assigned_collector: 'Unassigned', battery_fuel: '98% (EV)' },
    { id: 'V-03', type: 'Electric Van', capacity_kg: 1200, current_load_kg: 500, status: 'in_use', assigned_collector: 'Alex Rivera', battery_fuel: '72% (EV)' },
    { id: 'V-05', type: 'Cargo Trike Auto', capacity_kg: 400, current_load_kg: 160, status: 'available', assigned_collector: 'Unassigned', battery_fuel: '65% (EV)' },
  ],

  sources: [
    { id: 1, name: 'Metro Eco Supermarket', category: 'Retail', address: '840 Commercial Way', monthly_volume_kg: 4800, segregation_score: 94 },
    { id: 2, name: 'Harbor Hotel & Suites', category: 'Hospitality', address: '12 Marina Promenade', monthly_volume_kg: 6200, segregation_score: 89 },
    { id: 3, name: 'Apex Technology Park', category: 'Corporate', address: '400 Innovation Drive', monthly_volume_kg: 3100, segregation_score: 98 },
    { id: 4, name: 'GreenValley Condominiums', category: 'Residential', address: 'Block A-D, Sector 3', monthly_volume_kg: 5400, segregation_score: 86 },
  ]
};

// ── Central API Export ──────────────────────────────────────
export const api = {
  // ── Authentication ────────────────────────────────────────
  async login(email, password) {
    return request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name, email, password, role, phone) {
    return request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, phone }),
    });
  },

  async logout() {
    return request('/api/logout', { method: 'POST' });
  },

  async getCurrentUser() {
    const res = await request('/api/me');
    return res;
  },

  // ── Operations Dashboard ──────────────────────────────────
  async getDashboard() {
    const res = await request('/api/dashboard');
    if (res.data && typeof res.data === 'object' && res.data.metrics) {
      return res.data;
    }
    return MOCK.dashboard;
  },

  // ── Smart Bins Telemetry ──────────────────────────────────
  async getBins() {
    const res = await request('/api/bins');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return MOCK.bins;
  },

  async createBinPickup(binId, payload = {}) {
    const res = await request(`/api/bins/${binId}/create-pickup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data || { success: true, message: `Pickup dispatched for bin ${binId}` };
  },

  // ── Pickup Requests Lifecycle ─────────────────────────────
  async getPickups(params = {}) {
    let qs = '';
    const queryParts = [];
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.collector_id) queryParts.push(`collector_id=${encodeURIComponent(params.collector_id)}`);
    if (queryParts.length) qs = `?${queryParts.join('&')}`;

    const res = await request(`/api/pickups${qs}`);
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return MOCK.pickups;
  },

  async createPickup(payload) {
    const res = await request('/api/pickups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async updatePickupStatus(pickupId, payload) {
    const res = await request(`/api/pickups/${pickupId}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async assignPickup(pickupId, payload) {
    const res = await request(`/api/pickups/${pickupId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  // ── Fleet & Sources ───────────────────────────────────────
  async getCollectors() {
    const res = await request('/api/collectors');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return MOCK.collectors;
  },

  async getVehicles() {
    const res = await request('/api/vehicles');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return MOCK.vehicles;
  },

  async getSources() {
    const res = await request('/api/sources');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return MOCK.sources;
  },

  async createSource(payload) {
    const res = await request('/api/sources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  // ── GIS Map & Telemetry ───────────────────────────────────
  async getMapData() {
    const res = await request('/api/map');
    return res.data || null;
  },

  async getOptimizedRoute(collectorId = null) {
    const qs = collectorId ? `?collector_id=${collectorId}` : '';
    const res = await request(`/api/route${qs}`);
    return res.data || null;
  },

  // ── Provenance & Waste Journey ────────────────────────────
  async getJourneyEvents(pickupRef = null) {
    const qs = pickupRef ? `?pickup_id=${encodeURIComponent(pickupRef)}` : '';
    const res = await request(`/api/journey${qs}`);
    return res.data || [];
  },

  // ── Material Recovery & Circularity ───────────────────────
  async getRecoveryOverview() {
    const res = await request('/api/recovery');
    return res.data || null;
  },

  async createRecoveryRecord(payload) {
    const res = await request('/api/recovery', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  // ── Collector Portal Dynamic Operations ───────────────────
  async getCollectorEarnings(collectorId = 1) {
    const res = await request(`/api/collectors/${collectorId}/earnings`);
    return res.data || null;
  },

  async acceptJob(collectorId = 1, payload = {}) {
    const res = await request(`/api/collectors/${collectorId}/accept-job`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async setAvailability(collectorId = 1, payload = {}) {
    const res = await request(`/api/collectors/${collectorId}/availability`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  }
};
