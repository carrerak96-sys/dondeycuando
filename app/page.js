'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { sb } from '../lib/supabase'
const Map = dynamic(() => import('../components/Map'), { ssr: false })
const CATS = ['Todo', 'Fruta', 'Verdura', 'Carne', 'Pescado', 'Quesos', 'Lácteos', 'Especias']
const eur = n => Number(n).toFixed(2).replace('.', ',') + ' €'
const UL = { kg: '€/kg', l: '€/l', ud: '€/ud' }
export default function Home() {
  const [q, setQ] = useState(''), [cat, setCat] = useState('Todo'), [zone, setZone] = useState(null), [drawing, setDrawing] = useState(false)
  const [res, setRes] = useState([]), [cart, setCart] = useState({}), [tickets, setTickets] = useState(null), [email, setEmail] = useState(''), [msg, setMsg] = useState('')
  useEffect(() => {
    const ring = zone && [...zone, zone[0]]
    sb.rpc('search_products', { q: q || null, cat: cat === 'Todo' ? null : cat, zone: ring ? { type: 'Polygon', coordinates: [ring] } : null }).then(({ data }) => setRes(data || []))
  }, [q, cat, zone])
  const shops = [...new globalThis.Map(res.map(r => [r.shop_id, { name: r.shop_name, lat: r.lat, lng: r.lng }])).values()]
  const best = {}; res.forEach(r => { const k = r.name + r.unit; if (!(k in best)) best[k] = r.product_id })
  const step = r => (r.unit === 'kg' ? 0.5 : 1)
  const add = (r, d) => setCart(c => { const v = (c[r.product_id]?.qty || 0) + d * step(r); const n = { ...c }; if (v <= 0) delete n[r.product_id]; else n[r.product_id] = { ...r, qty: v }; return n })
  const items = Object.values(cart), total = items.reduce((a, r) => a + r.price * r.qty, 0)
  const bySh = items.reduce((g, r) => ((g[r.shop_name] = g[r.shop_name] || []).push(r), g), {})
  async function login() { const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } }); setMsg(error ? error.message : 'Te hemos enviado un enlace al correo.') }
  async function pay() {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return setMsg('Inicia sesión para reservar.')
    const { data: id, error } = await sb.rpc('place_order', { items: items.map(r => ({ product_id: r.product_id, qty: r.qty })) })
    if (error) return setMsg(error.message)
    const { data } = await sb.from('orders').select('code,total,shop_orders(code,subtotal,shops(name))').eq('id', id).single()
    setTickets(data); setCart({}); setMsg('')
  }
  return (<main>
    <section>
      <h1>dondeycuando</h1><p className="sh">Todas las tiendas de Valladolid, un solo carrito.</p>
      <input placeholder="Busca manzanas, queso, merluza…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="chips">{CATS.map(c => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
      <Map shops={shops} zone={zone} drawing={drawing} onZone={z => { setZone(z); setDrawing(false) }} />
      <div className="chips"><button className={'btn' + (drawing ? ' p' : '')} onClick={() => setDrawing(!drawing)}>{drawing ? 'Dibuja en el mapa…' : 'Dibujar mi zona'}</button>{zone && <button className="btn" onClick={() => setZone(null)}>Borrar zona</button>}</div>
      {res.map(r => (<div key={r.product_id} className={'row' + (best[r.name + r.unit] === r.product_id && res.filter(x => x.name === r.name).length > 1 ? ' best' : '')}>
        <div className="i"><b>{r.name}</b><div className="sh">{r.shop_name}</div></div>
        <div className="pr">{eur(r.price)}<div className="sh">{UL[r.unit]}</div></div>
        <button className="btn" onClick={() => add(r, 1)}>+</button></div>))}
      {!res.length && <p className="sh">No hay productos en esta zona. Amplía el área.</p>}
    </section>
    <aside>
      <h2>Carrito</h2>
      {tickets ? (<div><h3>Reserva creada</h3><div className="tk"><div className="sh">Ticket conjunto</div><div className="code">{tickets.code}</div><b>{eur(tickets.total)}</b></div>
        {tickets.shop_orders.map(s => <div className="tk" key={s.code}><b>{s.shops.name}</b><div className="code">{s.code}</div>{eur(s.subtotal)}</div>)}</div>)
      : !items.length ? <p className="sh">Vacío. Añade productos de distintas tiendas.</p> : (<div>
        {Object.entries(bySh).map(([s, rs]) => (<div key={s}><b>{s}</b>{rs.map(r => <div className="row" key={r.product_id}><div className="i">{r.name}<div className="sh">{r.qty} {r.unit} × {eur(r.price)}</div></div><button className="btn" onClick={() => add(r, -1)}>−</button></div>)}</div>))}
        <h3>Total {eur(total)}</h3>
        <input placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} />
        <div className="chips"><button className="btn" onClick={login}>Iniciar sesión</button><button className="btn p" onClick={pay}>Reservar en {Object.keys(bySh).length} tienda(s)</button></div></div>)}
      {msg && <p className="sh">{msg}</p>}
    </aside></main>)
}
