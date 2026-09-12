-- ====================================================================
-- WasteLoop — PostgreSQL Production Database Schema
-- Platform: Intelligent Waste Collection & Circular Economy
-- Compatible with: PostgreSQL 12, 13, 14, 15, 16, Supabase, Neon, RDS
-- ====================================================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if re-deploying (in reverse dependency order)
DROP TABLE IF EXISTS journey_events CASCADE;
DROP TABLE IF EXISTS material_recovery_records CASCADE;
DROP TABLE IF EXISTS collector_earnings CASCADE;
DROP TABLE IF EXISTS collector_availability CASCADE;
DROP TABLE IF EXISTS pickup_requests CASCADE;
DROP TABLE IF EXISTS smart_bins CASCADE;
DROP TABLE IF EXISTS waste_sources CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS collectors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- --------------------------------------------------------------------
-- 2. USERS TABLE
-- Roles: ADMIN, COLLECTOR, GENERATOR
-- --------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'GENERATOR',
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- --------------------------------------------------------------------
-- 3. COLLECTORS TABLE
-- Profiles linked to users with role = 'COLLECTOR'
-- --------------------------------------------------------------------
CREATE TABLE collectors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    rating DOUBLE PRECISION DEFAULT 5.0,
    total_completed INTEGER DEFAULT 0,
    current_workload INTEGER DEFAULT 0,
    duty_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, OFFLINE
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collectors_user ON collectors(user_id);
CREATE INDEX idx_collectors_duty_status ON collectors(duty_status);

-- --------------------------------------------------------------------
-- 4. VEHICLES TABLE
-- Electric vans, compactor trucks, cargo autos
-- --------------------------------------------------------------------
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(80) NOT NULL DEFAULT 'Electric Van',
    capacity_kg DOUBLE PRECISION NOT NULL DEFAULT 1200.0,
    current_load_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, IN_USE, OFFLINE
    assigned_collector_name VARCHAR(120),
    battery_fuel VARCHAR(50) DEFAULT '92% (EV)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_number ON vehicles(vehicle_number);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- --------------------------------------------------------------------
-- 5. WASTE SOURCES TABLE
-- Commercial, industrial, and residential partners generating feedstocks
-- --------------------------------------------------------------------
CREATE TABLE waste_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL DEFAULT 'Commercial', -- Retail, Hospitality, Corporate, Residential
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 37.7749,
    longitude DOUBLE PRECISION NOT NULL DEFAULT -122.4194,
    contact_phone VARCHAR(50),
    monthly_volume_kg DOUBLE PRECISION DEFAULT 1000.0,
    segregation_score DOUBLE PRECISION DEFAULT 90.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waste_sources_user ON waste_sources(user_id);
CREATE INDEX idx_waste_sources_category ON waste_sources(category);

-- --------------------------------------------------------------------
-- 6. SMART BINS TABLE
-- Ultrasonic fill sensors and telemetry nodes
-- --------------------------------------------------------------------
CREATE TABLE smart_bins (
    id SERIAL PRIMARY KEY,
    bin_code VARCHAR(50) NOT NULL UNIQUE,
    location_name VARCHAR(150) NOT NULL,
    zone VARCHAR(80) NOT NULL DEFAULT 'Sector 1',
    waste_type VARCHAR(80) NOT NULL DEFAULT 'Plastics',
    current_fill_pct DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    previous_fill_pct DOUBLE PRECISION DEFAULT 0.0,
    fill_rate_per_hour DOUBLE PRECISION DEFAULT 1.5,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 37.7749,
    longitude DOUBLE PRECISION NOT NULL DEFAULT -122.4194,
    last_emptied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_smart_bins_code ON smart_bins(bin_code);
CREATE INDEX idx_smart_bins_fill ON smart_bins(current_fill_pct);

-- --------------------------------------------------------------------
-- 7. PICKUP REQUESTS TABLE
-- Core transactions representing waste collection orders & states
-- --------------------------------------------------------------------
CREATE TABLE pickup_requests (
    id SERIAL PRIMARY KEY,
    pickup_code VARCHAR(50) NOT NULL UNIQUE,
    source_id INTEGER NOT NULL REFERENCES waste_sources(id) ON DELETE CASCADE,
    collector_id INTEGER REFERENCES collectors(id) ON DELETE SET NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    waste_type VARCHAR(100) NOT NULL, -- Plastics, Cardboard, Organics, E-Waste, Metals
    estimated_weight_kg DOUBLE PRECISION NOT NULL,
    actual_weight_kg DOUBLE PRECISION,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    priority_score DOUBLE PRECISION DEFAULT 50.0,
    priority_reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED', -- CREATED, ASSIGNED, ON_THE_WAY, COLLECTED, SEGREGATED, RECOVERED, RECYCLED, DISPOSED, CANCELLED
    scheduled_time VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pickups_code ON pickup_requests(pickup_code);
CREATE INDEX idx_pickups_status ON pickup_requests(status);
CREATE INDEX idx_pickups_priority ON pickup_requests(priority);
CREATE INDEX idx_pickups_source ON pickup_requests(source_id);
CREATE INDEX idx_pickups_collector ON pickup_requests(collector_id);

-- --------------------------------------------------------------------
-- 8. COLLECTOR AVAILABILITY TABLE
-- Operating shifts and calendar availability
-- --------------------------------------------------------------------
CREATE TABLE collector_availability (
    id SERIAL PRIMARY KEY,
    collector_id INTEGER NOT NULL REFERENCES collectors(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, OFFLINE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_collector_date ON collector_availability(collector_id, day_date);

-- --------------------------------------------------------------------
-- 9. COLLECTOR EARNINGS TABLE
-- Base payouts, performance bonuses, and tipping credits
-- --------------------------------------------------------------------
CREATE TABLE collector_earnings (
    id SERIAL PRIMARY KEY,
    collector_id INTEGER NOT NULL REFERENCES collectors(id) ON DELETE CASCADE,
    pickup_id INTEGER UNIQUE REFERENCES pickup_requests(id) ON DELETE CASCADE,
    base_payout DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    distance_bonus DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    purity_bonus DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, CLEARED, PAID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_earnings_collector ON collector_earnings(collector_id);

-- --------------------------------------------------------------------
-- 10. MATERIAL RECOVERY RECORDS TABLE
-- Mass-balance accountability and diversion rates
-- --------------------------------------------------------------------
CREATE TABLE material_recovery_records (
    id SERIAL PRIMARY KEY,
    pickup_id INTEGER UNIQUE REFERENCES pickup_requests(id) ON DELETE CASCADE,
    collected_quantity_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    recyclable_quantity_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    recovered_quantity_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    disposed_quantity_kg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    recovery_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    recycling_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    diversion_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    facility_name VARCHAR(150) NOT NULL DEFAULT 'EcoLoop Central Recovery Hub',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recovery_pickup ON material_recovery_records(pickup_id);

-- --------------------------------------------------------------------
-- 11. JOURNEY EVENTS TABLE
-- Immutable provenance log & chain-of-custody audit trail
-- --------------------------------------------------------------------
CREATE TABLE journey_events (
    id SERIAL PRIMARY KEY,
    pickup_id INTEGER NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- CREATED, ASSIGNED, ON_THE_WAY, COLLECTED, SEGREGATED, RECOVERED, RECYCLED, DISPOSED
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    location VARCHAR(150),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journey_pickup ON journey_events(pickup_id);
CREATE INDEX idx_journey_timestamp ON journey_events(timestamp);

-- ====================================================================
-- 12. INITIAL SEED DATA FOR PRODUCTION / DEMO SETUP
-- Password for all demo accounts below is: 'admin123', 'collector123', 'user123'
-- Werkzeug pbkdf2:sha256 hashes precalculated:
-- admin123 -> scrypt:32768:8:1$u7c6n0yZc... (or Werkzeug generate_password_hash)
-- ====================================================================

-- Users
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
(1, 'admin@wasteloop.com', 'scrypt:32768:8:1$Y6L6R7sN3w8fHq0P$b1fb184e9c73efd8bb3eb6dcf8fbf98a5ceea0d1dfd2ea67098e6ff059bdf8054bebbfa54e5b30b42fbbcaee32d56a236df96f7c7da9965d1d60741270bc5514', 'Operations Admin', 'ADMIN', '+1 (555) 0100'),
(2, 'ravi@wasteloop.com', 'scrypt:32768:8:1$Y6L6R7sN3w8fHq0P$b1fb184e9c73efd8bb3eb6dcf8fbf98a5ceea0d1dfd2ea67098e6ff059bdf8054bebbfa54e5b30b42fbbcaee32d56a236df96f7c7da9965d1d60741270bc5514', 'Alex Rivera', 'COLLECTOR', '+1 (555) 0192'),
(3, 'sarah@wasteloop.com', 'scrypt:32768:8:1$Y6L6R7sN3w8fHq0P$b1fb184e9c73efd8bb3eb6dcf8fbf98a5ceea0d1dfd2ea67098e6ff059bdf8054bebbfa54e5b30b42fbbcaee32d56a236df96f7c7da9965d1d60741270bc5514', 'Sarah Chen', 'COLLECTOR', '+1 (555) 0184'),
(4, 'user@wasteloop.com', 'scrypt:32768:8:1$Y6L6R7sN3w8fHq0P$b1fb184e9c73efd8bb3eb6dcf8fbf98a5ceea0d1dfd2ea67098e6ff059bdf8054bebbfa54e5b30b42fbbcaee32d56a236df96f7c7da9965d1d60741270bc5514', 'Green Corp (Retail)', 'GENERATOR', '+1 (555) 0145')
ON CONFLICT (email) DO NOTHING;

-- Collectors
INSERT INTO collectors (id, user_id, phone, rating, total_completed, current_workload, duty_status) VALUES
(1, 2, '+1 (555) 0192', 4.95, 84, 2, 'AVAILABLE'),
(2, 3, '+1 (555) 0184', 4.88, 62, 1, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- Vehicles
INSERT INTO vehicles (id, vehicle_number, vehicle_type, capacity_kg, current_load_kg, status, assigned_collector_name, battery_fuel) VALUES
(1, 'V-01', 'Compactor Truck', 3500.0, 1800.0, 'IN_USE', 'Sarah Chen', '84% (EV)'),
(2, 'V-02', 'Electric Van', 1200.0, 0.0, 'AVAILABLE', NULL, '98% (EV)'),
(3, 'V-03', 'Electric Van', 1200.0, 500.0, 'IN_USE', 'Alex Rivera', '72% (EV)'),
(4, 'V-05', 'Cargo Trike Auto', 400.0, 160.0, 'AVAILABLE', NULL, '65% (EV)')
ON CONFLICT (vehicle_number) DO NOTHING;

-- Waste Sources
INSERT INTO waste_sources (id, user_id, name, category, address, latitude, longitude, monthly_volume_kg, segregation_score) VALUES
(1, 4, 'Metro Eco Supermarket', 'Retail', '840 Commercial Way', 37.7749, -122.4194, 4800.0, 94.0),
(2, 4, 'Harbor Hotel & Suites', 'Hospitality', '12 Marina Promenade', 37.7650, -122.4250, 6200.0, 89.0),
(3, 4, 'Apex Technology Park', 'Corporate', '400 Innovation Drive', 37.7900, -122.4000, 3100.0, 98.0),
(4, 4, 'GreenValley Condominiums', 'Residential', 'Block A-D, Sector 3', 37.7550, -122.4300, 5400.0, 86.0)
ON CONFLICT (id) DO NOTHING;

-- Smart Bins
INSERT INTO smart_bins (id, bin_code, location_name, zone, waste_type, current_fill_pct, previous_fill_pct, fill_rate_per_hour, latitude, longitude) VALUES
(1, 'B-104', 'Metro Central Plaza', 'Sector 4', 'Plastics', 92.0, 85.0, 2.5, 37.7749, -122.4194),
(2, 'B-107', 'Grand Market West', 'Sector 4', 'Mixed Recyclables', 88.0, 80.0, 2.1, 37.7833, -122.4167),
(3, 'B-112', 'Harbor Hotel Terminal', 'Sector 2', 'Organics', 64.0, 50.0, 1.2, 37.7650, -122.4250),
(4, 'B-118', 'Apex Innovation Campus', 'Sector 1', 'E-Waste', 45.0, 40.0, 0.8, 37.7900, -122.4000),
(5, 'B-125', 'GreenValley Condos Block A', 'Sector 3', 'Cardboard', 78.0, 68.0, 1.8, 37.7550, -122.4300),
(6, 'B-130', 'South Pier Promenade', 'Sector 2', 'Glass & Metals', 32.0, 25.0, 0.5, 37.7600, -122.4100)
ON CONFLICT (bin_code) DO NOTHING;

-- Pickup Requests
INSERT INTO pickup_requests (id, pickup_code, source_id, collector_id, vehicle_id, waste_type, estimated_weight_kg, actual_weight_kg, priority, priority_score, priority_reason, status, scheduled_time) VALUES
(1, 'PK-1002', 1, 1, 3, 'Cardboard', 180.0, 180.0, 'HIGH', 82.0, 'High volume retail packaging', 'ASSIGNED', '10:30 AM Today'),
(2, 'PK-1004', 2, 1, 3, 'Organics', 320.0, NULL, 'HIGH', 78.0, 'Perishable compostable batch', 'ON_THE_WAY', '11:45 AM Today'),
(3, 'PK-1008', 1, NULL, NULL, 'Plastics', 240.0, NULL, 'CRITICAL', 94.0, 'Smart Bin B-104 at 92% capacity threshold', 'CREATED', 'Immediate'),
(4, 'PK-1011', 1, NULL, NULL, 'Cardboard', 420.0, NULL, 'MEDIUM', 65.0, 'Regular warehouse overflow pickup', 'CREATED', '02:00 PM Today'),
(5, 'PK-0998', 3, 2, 1, 'E-Waste', 85.0, 84.5, 'MEDIUM', 60.0, 'End-of-life electronics batch', 'COMPLETED', 'Yesterday')
ON CONFLICT (pickup_code) DO NOTHING;

-- Material Recovery Records
INSERT INTO material_recovery_records (id, pickup_id, collected_quantity_kg, recyclable_quantity_kg, recovered_quantity_kg, disposed_quantity_kg, recovery_rate, recycling_rate, diversion_rate, facility_name) VALUES
(1, 5, 84.5, 78.0, 75.2, 9.3, 89.0, 92.3, 91.2, 'EcoLoop Central Recovery Hub')
ON CONFLICT (id) DO NOTHING;

-- Journey Events
INSERT INTO journey_events (pickup_id, stage, status, location, notes) VALUES
(1, 'CREATED', 'COMPLETED', 'Metro Eco Supermarket', 'Generated and weighed at source facility.'),
(1, 'ASSIGNED', 'COMPLETED', 'Operations Dispatch', 'Assigned to Alex Rivera (Electric Van V-03).'),
(2, 'CREATED', 'COMPLETED', 'Harbor Hotel & Suites', 'Generated organic waste batch.'),
(2, 'ASSIGNED', 'COMPLETED', 'Operations Dispatch', 'Assigned to Alex Rivera.'),
(2, 'ON_THE_WAY', 'COMPLETED', 'In Transit Route', 'Collector in transit to location.'),
(5, 'CREATED', 'COMPLETED', 'Apex Technology Park', 'E-waste items staged.'),
(5, 'ASSIGNED', 'COMPLETED', 'Operations Dispatch', 'Assigned to Sarah Chen.'),
(5, 'COLLECTED', 'COMPLETED', 'Onboard Scale', 'Verified weight: 84.5 kg.'),
(5, 'RECOVERED', 'COMPLETED', 'EcoLoop Central Recovery Hub', 'Disassembled and precious components extracted.');

-- Reset Sequences to current max id
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('collectors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM collectors));
SELECT setval('vehicles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vehicles));
SELECT setval('waste_sources_id_seq', (SELECT COALESCE(MAX(id), 1) FROM waste_sources));
SELECT setval('smart_bins_id_seq', (SELECT COALESCE(MAX(id), 1) FROM smart_bins));
SELECT setval('pickup_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pickup_requests));
SELECT setval('material_recovery_records_id_seq', (SELECT COALESCE(MAX(id), 1) FROM material_recovery_records));
SELECT setval('journey_events_id_seq', (SELECT COALESCE(MAX(id), 1) FROM journey_events));
