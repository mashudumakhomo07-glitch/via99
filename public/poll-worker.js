// Via99 Trip Poll Worker
// Runs in background thread — not throttled by Android Chrome

let pollInterval = null;
let supabaseUrl  = null;
let supabaseKey  = null;
let authJwt      = null;
let isActive     = false;

self.onmessage = function(e) {
  const { type, url, key, jwt } = e.data;

  if (type === 'START') {
    supabaseUrl = url;
    supabaseKey = key;
    authJwt     = jwt || key;
    isActive    = true;
    startPolling();
  } else if (type === 'STOP') {
    isActive = false;
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  } else if (type === 'UPDATE_JWT') {
    authJwt = e.data.jwt;
  }
};

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkForTrips, 2000);
}

async function checkForTrips() {
  if (!isActive || !supabaseUrl) return;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/trips?status=eq.requested&driver_id=is.null&order=created_at.asc&limit=1`,
      {
        headers: {
          'apikey':        supabaseKey,
          'Authorization': `Bearer ${authJwt}`,
          'Content-Type':  'application/json'
        }
      }
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.length > 0) {
      self.postMessage({ type: 'TRIP_FOUND', trip: data[0] });
      isActive = false;
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    }
  } catch(e) {
    // Silent fail — worker keeps running
  }
}
