'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
// Mapa OpenStreetMap con tiendas y zona dibujada a mano (arrastrando el dedo o el raton)
export default function Map({ shops, zone, drawing, onZone }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), poly = useRef(null), st = useRef({})
  st.current = { drawing, onZone }
  useEffect(() => {
    const m = (map.current = L.map(el.current).setView([41.652, -4.7245], 14))
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    let pts = null, line = null
    const c = m.getContainer()
    c.addEventListener('pointerdown', e => { if (!st.current.drawing) return; pts = [m.mouseEventToLatLng(e)]; m.dragging.disable(); c.setPointerCapture(e.pointerId); line = L.polyline(pts, { color: '#5B2A86' }).addTo(m) })
    c.addEventListener('pointermove', e => { if (!pts) return; pts.push(m.mouseEventToLatLng(e)); line.setLatLngs(pts) })
    c.addEventListener('pointerup', () => { if (!pts) return; m.removeLayer(line); m.dragging.enable(); if (pts.length > 8) st.current.onZone(pts.map(p => [p.lng, p.lat])); pts = null })
    return () => m.remove()
  }, [])
  useEffect(() => { layer.current.clearLayers(); shops.forEach(s => L.circleMarker([s.lat, s.lng], { radius: 7, color: '#5B2A86', fillOpacity: .8 }).bindTooltip(s.name).addTo(layer.current)) }, [shops])
  useEffect(() => { if (poly.current) map.current.removeLayer(poly.current); poly.current = zone ? L.polygon(zone.map(([x, y]) => [y, x]), { color: '#5B2A86' }).addTo(map.current) : null }, [zone])
  return <div ref={el} className="map" />
}
