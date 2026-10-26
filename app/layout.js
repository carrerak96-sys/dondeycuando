import './globals.css'
export const metadata = { title: 'dondeycuando · Compra local en Valladolid', description: 'Compara precios de todas las tiendas de Valladolid, reserva en cada una y recoge tu compra.' }
export default function RootLayout({ children }) {
  return (<html lang="es"><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /></head><body>{children}</body></html>)
}
