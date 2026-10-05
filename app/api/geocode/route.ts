import { NextRequest, NextResponse } from 'next/server';

// GET /api/geocode?address=...
// Uses Google Maps Geocoding API (server-side key stays hidden from browser)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps server key not configured' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=ph&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      console.log(`[GEOCODE] "${address}" → ${lat}, ${lng} (${formattedAddress})`);
      return NextResponse.json({ lat, lng, formattedAddress });
    } else {
      console.warn(`[GEOCODE] No results for "${address}". Status: ${data.status}`);
      return NextResponse.json({ error: `Geocoding failed: ${data.status}`, status: data.status }, { status: 404 });
    }
  } catch (error) {
    console.error('[GEOCODE] Error:', error);
    return NextResponse.json({ error: 'Geocoding request failed' }, { status: 500 });
  }
}
