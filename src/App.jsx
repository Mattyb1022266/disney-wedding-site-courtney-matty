import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart, MapPin, Calendar, Camera, MessageCircle, Navigation,
  Sparkles, Clock, Upload, Star, Wand2, Lock, Image as ImageIcon
} from 'lucide-react';

const WEDDING_DATE_ISO = '2027-04-08T17:00:00'; // Ceremony time (local browser time)

const DEFAULT_SCHEDULE = [
  { time: '4:30 PM', event: 'Guest Arrival', location: 'Wedding Pavilion', note: 'Please arrive early to find your seats' },
  { time: '5:00 PM', event: 'Ceremony Begins', location: "Disney's Wedding Pavilion", note: 'Please be seated by 4:55 PM' },
  { time: '6:00 PM', event: 'Reception & Dinner', location: '✨ Surprise Location ✨', note: 'Get ready for something magical!' },
  { time: '8:30 PM', event: 'Surprise #1', location: 'To Be Revealed', note: "You won't want to miss this!" },
  { time: '9:30 PM', event: 'Surprise #2', location: 'To Be Revealed', note: 'The magic continues!' }
];

const DEFAULT_LOCATIONS = [
  { name: 'Wedding Pavilion', note: 'Ceremony location - arrive early!', address: "Disney's Grand Floridian Resort & Spa", coords: '28.4177,-81.5848' },
  { name: 'Grand Floridian', note: 'Resort & main hub', address: "Disney's Grand Floridian Resort & Spa", coords: '28.4177,-81.5848' },
  { name: 'Parking', note: 'Complimentary valet available', address: 'Grand Floridian Main Entrance', coords: '28.4177,-81.5848' },
  { name: 'Magic Kingdom', note: 'Optional pre-wedding visit', address: 'Magic Kingdom Park', coords: '28.4177,-81.5812' }
];

const DEFAULT_SUGGESTIONS = [
  {
    id: cryptoRandomId(),
    title: 'If You Have 3 Hours Before',
    icon: '⏰',
    items: [
      'Visit Magic Kingdom (20 min away)',
      'Explore the Grand Floridian grounds',
      'Relax at the resort spa',
      'Have lunch at Gasparilla Island Grill'
    ]
  },
  {
    id: cryptoRandomId(),
    title: 'Best Coffee & Breakfast',
    icon: '☕',
    items: [
      'Gasparilla Island Grill (on-site)',
      'Kona Cafe at Polynesian Resort',
      'Starbucks at Magic Kingdom',
      'Garden View Tea Room (afternoon tea)'
    ]
  },
  {
    id: cryptoRandomId(),
    title: 'Family-Friendly Activities',
    icon: '👨‍👩‍👧‍👦',
    items: [
      'Character meet & greets at resort',
      'Resort monorail tour',
      'Pool time at Grand Floridian',
      'Explore Disney Springs (free entry)'
    ]
  },
  {
    id: cryptoRandomId(),
    title: 'Rain Plan Ideas',
    icon: '🌧️',
    items: [
      'Indoor photos at resort lobby',
      'Visit Disney Springs shopping',
      'Enjoy resort amenities',
      'Umbrellas provided at ceremony'
    ]
  }
];

const COUPLE_PHOTOS_PLACEHOLDERS = [
  { id: 1, caption: 'Our First Date', gradient: 'from-pastel-blush to-pastel-lilac' },
  { id: 2, caption: 'The Proposal', gradient: 'from-pastel-sky to-pastel-lavender' },
  { id: 3, caption: 'Disney Magic', gradient: 'from-pastel-butter to-pastel-peach' },
  { id: 4, caption: 'Adventure Together', gradient: 'from-pastel-mint to-pastel-sky' },
  { id: 5, caption: 'Our Love Story', gradient: 'from-pastel-peach to-pastel-blush' },
  { id: 6, caption: 'Forever Begins', gradient: 'from-pastel-lilac to-pastel-sky' }
];

function cryptoRandomId(){
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + '-' + String(Math.random()).slice(2);
}

function openMap(coords) {
  window.open(`https://maps.google.com/?q=${encodeURIComponent(coords)}`, '_blank', 'noreferrer');
}

async function apiGet(path){
  const r = await fetch(path, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body, headers = {}){
  const r = await fetch(path, {
    method: 'POST',
    headers: { ...headers, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  // Countdown
  const weddingDate = useMemo(() => new Date(WEDDING_DATE_ISO), []);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Suggestions editable (stored on the server via KV)
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');

  // Guest photos (stored on the server via R2)
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = weddingDate - now;
      const d = Math.max(0, difference);

      setTimeLeft({
        days: Math.floor(d / (1000 * 60 * 60 * 24)),
        hours: Math.floor((d / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((d / 1000 / 60) % 60),
        seconds: Math.floor((d / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  // Restore admin session (local)
  useEffect(() => {
    const saved = sessionStorage.getItem('wedding_admin') === '1';
    setIsAdmin(saved);
  }, []);

  // Load suggestions + photos from server (if Functions bindings are set)
  useEffect(() => {
    (async () => {
      try {
        const s = await apiGet('/api/suggestions');
        if (Array.isArray(s?.suggestions) && s.suggestions.length) setSuggestions(s.suggestions);
      } catch {
        // ok: running as static-only without bindings
      }
      try {
        const p = await apiGet('/api/photos');
        if (Array.isArray(p?.photos)) setPhotos(p.photos);
      } catch {
        // ok: running as static-only without bindings
      }
    })();
  }, []);

  const schedule = DEFAULT_SCHEDULE;
  const locations = DEFAULT_LOCATIONS;

  const quickActions = [
    { label: "Today's Schedule", icon: Calendar, onClick: () => setActiveSection('schedule') },
    { label: "Get Directions", icon: Navigation, onClick: () => openMap('28.4177,-81.5848') },
    { label: "Message Us", icon: MessageCircle, onClick: () => window.open('sms:+1234567890', '_blank', 'noreferrer') },
    { label: "I'm Lost!", icon: MapPin, onClick: () => openMap('28.4177,-81.5848') },
    { label: "Share Photos", icon: Camera, onClick: () => setActiveSection('upload') },
  ];

  async function refreshPhotos(){
    try{
      const p = await apiGet('/api/photos');
      if (Array.isArray(p?.photos)) setPhotos(p.photos);
    } catch {/* ignore */}
  }

  async function handleUpload(e){
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError('');
    setUploading(true);
    try{
      const fd = new FormData();
      for (const f of files) fd.append('photos', f);
      await apiPost('/api/photos/upload', fd);
      await refreshPhotos();
      e.target.value = '';
    } catch (err){
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleAdminLogin(){
    try{
      await apiPost('/api/suggestions', { suggestions }, { 'x-admin-passcode': adminPasscode });
      sessionStorage.setItem('wedding_admin', '1');
      setIsAdmin(true);
      setAdminPasscode('');
    } catch (err){
      alert('Passcode incorrect (or Functions not configured).');
    }
  }

  async function saveSuggestions(){
    try{
      await apiPost('/api/suggestions', { suggestions }, { 'x-admin-passcode': 'SESSION' });
      alert('Saved!');
    } catch (err){
      alert('Could not save (are Functions + KV set up?)');
    }
  }

  function addCategory(){
    setSuggestions(s => [...s, { id: cryptoRandomId(), title: 'New Category', icon: '✨', items: ['New idea'] }]);
  }

  function removeCategory(id){
    setSuggestions(s => s.filter(x => x.id !== id));
  }

  function updateCategory(id, patch){
    setSuggestions(s => s.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  function updateItem(catId, idx, value){
    setSuggestions(s => s.map(x => {
      if (x.id !== catId) return x;
      const items = [...x.items];
      items[idx] = value;
      return { ...x, items };
    }));
  }

  function addItem(catId){
    setSuggestions(s => s.map(x => x.id === catId ? { ...x, items: [...x.items, 'New idea'] } : x));
  }

  function removeItem(catId, idx){
    setSuggestions(s => s.map(x => {
      if (x.id !== catId) return x;
      const items = x.items.filter((_, i) => i !== idx);
      return { ...x, items };
    }));
  }

  return (

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--glass-strong)] backdrop-blur-lg shadow-card border-b border-white/60">
        <div className="flex overflow-x-auto px-4 py-3 gap-2 scrollbar-hide">
          {['home', 'schedule', 'locations', 'suggestions', 'photos', 'upload'].map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={
                "pill " + (
                  activeSection === section
                    ? 'bg-white/80 shadow-card border border-white/60 scale-[1.02]'
                    : 'bg-white/50 hover:bg-white/70 border border-white/40'
                )
              }
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <div className="relative z-10 pb-24">
        {/* HOME */}
        {activeSection === 'home' && (
          <div className="text-center px-6 py-16">
            <div className="inline-block mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/70 shadow-card flex items-center justify-center border border-white/70">
                <Heart className="w-10 h-10 text-rose-500 fill-rose-500" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-slate-800">
              We're Getting Married!
            </h1>
            <p className="text-2xl md:text-3xl text-slate-700 mb-2">at the Most Magical Place on Earth</p>
            <p className="text-lg text-slate-600 mb-10">Disney World, Florida 🏰</p>

            <div className="max-w-2xl mx-auto card p-8 mb-10">
              <h2 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" /> Countdown to Forever
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <div key={unit} className="rounded-xl2 p-4 bg-white/70 border border-white/70 shadow-card">
                    <div className="text-3xl md:text-4xl font-bold text-slate-800">{value ?? 0}</div>
                    <div className="text-xs md:text-sm text-slate-600 uppercase tracking-wide">{unit}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {quickActions.map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="card p-5 hover:shadow-soft transition hover:scale-[1.02]"
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <div className="font-semibold text-slate-800">{label}</div>
                </button>
              ))}
            </div>

            <div className="max-w-5xl mx-auto mt-10 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 bg-white/60 rounded-full px-4 py-2 border border-white/70">
                <Wand2 className="w-4 h-4" /> Pastel mode: on ✨
              </span>
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {activeSection === 'schedule' && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-extrabold text-center mb-10 text-slate-800">
              Wedding Day Timeline
            </h2>
            <div className="space-y-6">
              {schedule.map((item, idx) => (
                <div key={idx} className="card p-6 hover:shadow-soft transition border-l-4 border-white/70">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl2 p-3 bg-white/70 border border-white/70 shadow-card min-w-fit">
                      <Clock className="w-5 h-5 mb-1 text-slate-700" />
                      <div className="font-bold text-slate-800">{item.time}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-1">{item.event}</h3>
                      <p className="text-slate-700 flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4" /> {item.location}
                      </p>
                      <p className="text-sm text-slate-600 italic">{item.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOCATIONS */}
        {activeSection === 'locations' && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-extrabold text-center mb-10 text-slate-800">
              Important Locations
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {locations.map((loc, idx) => (
                <div key={idx} className="card p-6 hover:shadow-soft transition">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{loc.name}</h3>
                  <p className="text-slate-700 mb-3">{loc.note}</p>
                  <p className="text-sm text-slate-600 mb-4">{loc.address}</p>

                  <button
                    onClick={() => openMap(loc.coords)}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Open in Maps
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUGGESTIONS + GUEST PHOTO GALLERY */}
        {activeSection === 'suggestions' && (
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-4xl font-extrabold text-slate-800">
                Things to Do
              </h2>

              {!isAdmin ? (
                <div className="flex items-center gap-2">
                  <input
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Admin passcode"
                    type="password"
                    className="px-4 py-2 rounded-full bg-white/70 border border-white/70 shadow-card outline-none"
                  />
                  <button onClick={handleAdminLogin} className="px-4 py-2 rounded-full bg-white/80 border border-white/70 shadow-card hover:shadow-soft transition inline-flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={addCategory} className="px-4 py-2 rounded-full bg-white/80 border border-white/70 shadow-card hover:shadow-soft transition">
                    + Category
                  </button>
                  <button
                    onClick={() => { sessionStorage.removeItem('wedding_admin'); setIsAdmin(false); }}
                    className="px-4 py-2 rounded-full bg-white/60 border border-white/70 hover:bg-white/70 transition"
                  >
                    Exit admin
                  </button>
                </div>
              )}
            </div>

            <p className="text-slate-600 mt-3 mb-10">
              Tap a card to expand. (Admin can edit right on this page.)
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)}
                    className="w-full p-6 text-left hover:bg-white/40 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{suggestion.icon}</span>
                      <h3 className="text-xl font-bold text-slate-800 flex-1">{suggestion.title}</h3>
                      <Sparkles className={`w-6 h-6 text-slate-700 transition-transform ${expandedSuggestion === suggestion.id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {expandedSuggestion === suggestion.id && (
                    <div className="px-6 pb-6 bg-white/40 border-t border-white/60">
                      {isAdmin ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex gap-2">
                              <input
                                value={suggestion.icon}
                                onChange={(e) => updateCategory(suggestion.id, { icon: e.target.value })}
                                className="w-20 px-3 py-2 rounded-xl bg-white/70 border border-white/70 outline-none"
                                placeholder="✨"
                                title="Emoji icon"
                              />
                              <input
                                value={suggestion.title}
                                onChange={(e) => updateCategory(suggestion.id, { title: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-xl bg-white/70 border border-white/70 outline-none"
                                placeholder="Category title"
                              />
                              <button
                                onClick={() => removeCategory(suggestion.id)}
                                className="px-3 py-2 rounded-xl bg-white/60 border border-white/70 hover:bg-white/70"
                                title="Remove category"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="space-y-2">
                              {suggestion.items.map((it, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input
                                    value={it}
                                    onChange={(e) => updateItem(suggestion.id, idx, e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-xl bg-white/70 border border-white/70 outline-none"
                                  />
                                  <button
                                    onClick={() => removeItem(suggestion.id, idx)}
                                    className="px-3 py-2 rounded-xl bg-white/60 border border-white/70 hover:bg-white/70"
                                    title="Remove item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addItem(suggestion.id)}
                                className="px-4 py-2 rounded-xl bg-white/70 border border-white/70 hover:bg-white/80"
                              >
                                + Add item
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {suggestion.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <Star className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-800">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveSuggestions}
                  className="px-6 py-3 rounded-full bg-white/80 border border-white/70 shadow-card hover:shadow-soft transition font-semibold"
                >
                  Save changes
                </button>
              </div>
            )}

            {/* Guest Photos preview on this tab */}
            <div className="mt-14">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-slate-700" />
                <h3 className="text-2xl font-extrabold text-slate-800">Guest Photos</h3>
              </div>
              <p className="text-slate-600 mb-6">Photos uploaded by guests will appear here (and in the Upload tab).</p>

              {photos?.length ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.slice(0, 8).map((p) => (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
                      <div className="relative aspect-square rounded-xl2 overflow-hidden shadow-card border border-white/70 bg-white/60 hover:shadow-soft transition">
                        <img src={p.url} alt={p.name || 'Guest photo'} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="card p-6 text-slate-700">
                  No guest photos yet — be the first to upload in the <button className="underline font-semibold" onClick={() => setActiveSection('upload')}>Upload</button> tab.
                </div>
              )}
            </div>
          </div>
        )}

        {/* COUPLE PHOTOS PLACEHOLDERS */}
        {activeSection === 'photos' && (
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-extrabold text-center mb-3 text-slate-800">
              Our Love Story
            </h2>
            <p className="text-center text-slate-600 mb-10 text-lg">
              Swap these placeholders with your real photos whenever you’re ready.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {COUPLE_PHOTOS_PLACEHOLDERS.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-xl3 overflow-hidden shadow-card border border-white/70 hover:shadow-soft transition hover:scale-[1.01]">
                  <div className={`w-full h-full bg-gradient-to-br ${photo.gradient} flex items-center justify-center`}>
                    <Camera className="w-16 h-16 text-slate-600/40" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end">
                    <div className="w-full p-4 text-white translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="font-semibold">{photo.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {activeSection === 'upload' && (
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-extrabold text-center mb-3 text-slate-800">
              Share Your Photos
            </h2>
            <p className="text-center text-slate-600 mb-10 text-lg">
              Guests can upload photos here — everyone will be able to see them.
            </p>

            <div className="card p-8 mb-8">
              <label className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-white/70 rounded-xl3 cursor-pointer hover:bg-white/40 transition">
                <Upload className="w-14 h-14 text-slate-700 mb-3" />
                <span className="text-xl font-semibold text-slate-800 mb-1">
                  {uploading ? 'Uploading…' : 'Click to Upload Photos'}
                </span>
                <span className="text-sm text-slate-600">or drag and drop</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
              {uploadError && (
                <div className="mt-4 text-sm text-rose-700 bg-white/70 border border-white/70 rounded-xl p-3">
                  {uploadError}
                </div>
              )}

              <div className="mt-4 text-xs text-slate-600">
                Tip: if uploads fail on your live site, it usually means R2/KV bindings aren’t set in Cloudflare Pages yet.
              </div>
            </div>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-extrabold text-slate-800">Uploaded Photos ({photos?.length || 0})</h3>
              <button onClick={refreshPhotos} className="px-4 py-2 rounded-full bg-white/70 border border-white/70 hover:bg-white/80 transition">
                Refresh
              </button>
            </div>

            {photos?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
                    <div className="relative aspect-square rounded-xl2 overflow-hidden shadow-card border border-white/70 bg-white/60 hover:shadow-soft transition">
                      <img src={p.url} alt={p.name || 'Guest photo'} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-slate-700">
                No uploads yet — once a guest uploads, they’ll show up here.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-t border-white/70 text-center py-4 shadow-card">
        <p className="font-semibold text-slate-800">✨ Made with Love & Magic ✨</p>
      </div>
    </div>
  );
}
