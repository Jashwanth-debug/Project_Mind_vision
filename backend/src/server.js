/**
 * MindVision Clinical AI - Decoupled Backend Services API Server
 * 
 * Commercial-grade standalone HTTP server providing:
 * - Clinician Directory & Authentication API
 * - Real-Time Telemetry Timeline & Longitudinal Delta Analytics
 * - Immutable Clinical Audit Trail Governance API
 * - Standard CORS and Health Probes
 */

import http from 'http';
import { registerDoctorRoutes } from './routes/doctorRoutes.js';
import { registerTelemetryRoutes } from './routes/telemetryRoutes.js';
import { registerAuditRoutes } from './routes/auditRoutes.js';

const PORT = process.env.PORT || 5001;

class SimpleRouter {
  constructor() {
    this.routes = [];
  }

  add(method, path, handler) {
    this.routes.push({ method, path, handler });
  }

  get(path, handler) { this.add('GET', path, handler); }
  post(path, handler) { this.add('POST', path, handler); }
  put(path, handler) { this.add('PUT', path, handler); }
  delete(path, handler) { this.add('DELETE', path, handler); }

  match(method, urlPath) {
    for (const r of this.routes) {
      if (r.method !== method) continue;

      // Handle parameterized routes like /api/doctors/:doctorId/approve
      const rParts = r.path.split('/');
      const uParts = urlPath.split('/');
      if (rParts.length !== uParts.length) continue;

      let matched = true;
      const params = {};
      for (let i = 0; i < rParts.length; i++) {
        if (rParts[i].startsWith(':')) {
          const paramName = rParts[i].slice(1);
          params[paramName] = uParts[i];
        } else if (rParts[i] !== uParts[i]) {
          matched = false;
          break;
        }
      }

      if (matched) {
        return { handler: r.handler, params };
      }
    }
    return null;
  }
}

const router = new SimpleRouter();

// Root & Health Checks
router.get('/', (req, res) => {
  return res.json({
    name: 'MindVision Clinical AI - Backend Services API',
    version: '1.0.0',
    status: 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

router.get('/api/health', (req, res) => {
  return res.json({
    status: 'HEALTHY',
    service: 'mindvision-backend',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Register Domain Routes
registerDoctorRoutes(router);
registerTelemetryRoutes(router);
registerAuditRoutes(router);

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper response wrapper
  res.json = (data, statusCode = 200) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  res.status = (code) => {
    return {
      json: (data) => res.json(data, code)
    };
  };

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Read JSON body if present
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawText = Buffer.concat(buffers).toString();
      if (rawText.trim()) {
        body = JSON.parse(rawText);
      }
    } catch {
      body = {};
    }
  }

  req.body = body;
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  const matched = router.match(req.method, pathname);
  if (matched) {
    req.params = matched.params;
    try {
      return matched.handler(req, res);
    } catch (err) {
      console.error('API Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${pathname}` });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🏥 MindVision Backend API running at http://localhost:${PORT}`);
  });
}

export { server, router };
