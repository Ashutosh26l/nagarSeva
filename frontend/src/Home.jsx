import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { parse as parseExif } from 'exifr';
import { ArrowRight, Camera, CheckCircle2, MapPin, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CivicShell from './CivicShell';

const emptyLocation = { lat: '', lng: '', address: '', city: '', state: '' };
const emptyForm = { title: '', description: '', category: '' };

const NEXT_STEPS = [
  ['01', 'Your report is received', 'We record the details and location you share.'],
  ['02', 'The local team reviews it', 'Your report is routed for review.'],
  ['03', 'Track the status', 'Follow updates in the issue list.'],
];

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [location, setLocation] = useState(emptyLocation);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locationMessage, setLocationMessage] = useState('Choose a photo or search the issue location.');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('user')) navigate('/login');
  }, [navigate]);

  const fetchAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { format: 'jsonv2', lat, lon: lng },
        headers: { 'Accept-Language': 'en' },
      });
      const addressObj = response.data?.address;
      if (!addressObj) return;
      setLocation((previous) => ({
        ...previous,
        address: response.data.display_name || '',
        city: addressObj.city || addressObj.town || addressObj.village || '',
        state: addressObj.state || '',
      }));
      setLocationMessage('Location detected');
    } catch (err) {
      console.error('Error fetching address from Nominatim:', err);
      setLocationMessage('Coordinates found; address lookup was unavailable.');
    }
  }, []);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by this browser.');
      return;
    }
    setLocationMessage('Fetching your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ ...emptyLocation, lat: latitude, lng: longitude });
        fetchAddressFromCoords(latitude, longitude);
      },
      (err) => {
        const messages = {
          [err.PERMISSION_DENIED]: 'Location permission denied. Allow location access to detect your address.',
          [err.POSITION_UNAVAILABLE]: 'Location information is unavailable.',
          [err.TIMEOUT]: 'Location request timed out. Try refreshing.',
        };
        setLocationMessage(messages[err.code] || 'Could not detect your location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [fetchAddressFromCoords]);

  useEffect(() => {
    const nextPreviews = photos.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  const applyCoordinates = useCallback(async (lat, lng, message) => {
    setLocation((previous) => ({ ...previous, lat, lng }));
    setLocationMessage(message);
    await fetchAddressFromCoords(lat, lng);
  }, [fetchAddressFromCoords]);

  const handlePhotoChange = async (event) => {
    const files = Array.from(event.target.files || []);
    const available = Math.max(0, 10 - photos.length);
    if (files.length > available) setError('You can upload up to 10 images.');
    else setError('');
    setPhotos((current) => [...current, ...files.slice(0, available)]);
    event.target.value = '';

    for (const file of files.slice(0, available)) {
      try {
        const gps = await parseExif(file, { gps: true });
        if (gps?.latitude != null && gps?.longitude != null) {
          await applyCoordinates(gps.latitude, gps.longitude, 'Location read from photo metadata');
          break;
        }
      } catch (err) {
        console.warn('Could not read photo location metadata:', err);
      }
    }
  };

  const searchLocations = async (event) => {
    event.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;
    setSearchingLocations(true);
    setLocationResults([]);
    setLocationMessage('Searching locations...');
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'jsonv2', addressdetails: 1, limit: 5 },
        headers: { 'Accept-Language': 'en' },
      });
      setLocationResults(response.data || []);
      setLocationMessage(response.data?.length ? 'Select the exact location below' : 'No matching locations found.');
    } catch (err) {
      console.error('Error searching locations:', err);
      setLocationMessage('Location search was unavailable. Try again.');
    } finally {
      setSearchingLocations(false);
    }
  };

  const selectLocation = (result) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    const addressObj = result.address || {};
    setLocation({
      lat,
      lng,
      address: result.display_name || '',
      city: addressObj.city || addressObj.town || addressObj.village || '',
      state: addressObj.state || '',
    });
    setLocationQuery(result.display_name || '');
    setLocationResults([]);
    setLocationMessage('Location selected manually');
  };

  const removePhoto = (index) => {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setError('');
  };

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!photos.length) {
      setError('Please upload at least one image.');
      return;
    }
    if (!location.lat || !location.lng || !location.address) {
      setError('Please select the exact issue location using photo GPS, location search, or device location.');
      return;
    }
    setSubmitting(true);
    setError('');
    const data = new FormData();
    data.append('user_id', localStorage.getItem('user_id'));
    data.append('issue_title', form.title);
    data.append('description', form.description);
    data.append('category', form.category);
    data.append('latitude', location.lat);
    data.append('longitude', location.lng);
    data.append('location', location.address);
    photos.forEach((image) => data.append('images', image));

    try {
      await axios.post(`${baseUrl}/api/issues`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setForm(emptyForm);
      setPhotos([]);
    } catch (err) {
      setError(
        err.response?.data?.message ? `Error: ${err.response.data.message}` : 'Network error or server down',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'civic-focus min-h-12 w-full border-2 border-civic-ink bg-white px-4 py-3 placeholder:text-civic-ink/45';

  return (
    <CivicShell
      title="Create New Issue"
      subtitle="Report a local problem and help your community get it resolved."
      eyebrow="NagarSeva / Citizen reporting"
      tagline="CITIZEN DESK · JH"
      headerAction={
        <Link
          to="/issuelist"
          className="civic-focus civic-hard inline-flex min-h-11 items-center gap-2 bg-white px-3 py-2 text-sm font-semibold"
        >
          Issue list <ArrowRight size={16} aria-hidden="true" />
        </Link>
      }
    >
      <div className="report-wrap paper-grid min-h-[calc(100dvh-91px)] p-4 md:p-7 xl:p-8">
        <div className="mx-auto grid max-w-[1150px] grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          {success ? (
            <section className="civic-hard-strong bg-white p-6 md:p-8" role="status">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border-2 border-civic-ink bg-civic-green text-white">
                <CheckCircle2 aria-hidden="true" size={27} />
              </div>
              <p className="civic-eyebrow text-civic-green">Report received</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">Issue Submitted!</h2>
              <p className="mt-2 max-w-xl text-civic-ink/70">
                Your issue has been successfully submitted. Thank you for your feedback.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="civic-focus civic-hard-strong min-h-11 bg-civic-green px-5 py-3 font-bold text-white"
                >
                  Go to Home <ArrowRight size={16} className="ml-2 inline" aria-hidden="true" />
                </button>
                <Link to="/issuelist" className="civic-focus civic-hard min-h-11 bg-white px-5 py-3 font-bold">
                  View issue list
                </Link>
              </div>
            </section>
          ) : (
            <section className="civic-hard-strong bg-white p-5 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-[3px] border-civic-ink pb-5">
                <div>
                  <p className="civic-eyebrow font-bold text-civic-green">New community report</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Tell us what needs fixing</h2>
                  <p className="mt-1 text-sm text-civic-ink/70">
                    Add a photo, location and a few details to get started.
                  </p>
                </div>
                <span className="civic-pill bg-civic-mint px-3 py-1">* Required</span>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <fieldset>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <legend className="font-display text-lg font-bold">
                        1. Add photos <span className="text-civic-red">*</span>
                      </legend>
                      <p className="mt-1 text-sm text-civic-ink/70">Show the issue clearly. Up to 10 images.</p>
                    </div>
                    <span className="shrink-0 border border-civic-ink bg-[#F7F7F2] px-2 py-1 font-mono text-[10px]">
                      {photos.length} / 10
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label htmlFor="camera-input" className="civic-focus civic-hard inline-flex min-h-12 cursor-pointer items-center gap-2 bg-civic-green px-4 py-3 font-bold text-white">
                      <Camera size={20} aria-hidden="true" />
                      Take photo
                    </label>
                    <input type="file" id="camera-input" accept="image/*" capture="environment" onChange={handlePhotoChange} className="sr-only" />
                    <label htmlFor="file-input" className="civic-focus civic-hard inline-flex min-h-12 cursor-pointer items-center gap-2 bg-white px-4 py-3 font-bold">
                      <Plus size={20} aria-hidden="true" />
                      Choose photos
                    </label>
                    <input type="file" id="file-input" accept="image/*" multiple onChange={handlePhotoChange} className="sr-only" />
                    {previews.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="relative h-[94px] w-[94px] overflow-hidden border-2 border-civic-ink bg-[#F7F7F2] shadow-[3px_3px_0_#121210]"
                      >
                        <img src={src} alt={`Selected issue photo ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          aria-label={`Remove image ${index + 1}`}
                          className="civic-focus absolute right-1 top-1 flex h-7 w-7 items-center justify-center border-2 border-civic-ink bg-civic-red text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 10 && (
                      <div
                        aria-hidden="true"
                        className="flex h-[94px] w-[94px] items-center justify-center border-2 border-dashed border-civic-ink/40 bg-[#F7F7F2] text-civic-ink/40"
                      >
                        <Plus size={26} />
                      </div>
                    )}
                    <p className="max-w-[220px] self-center text-xs text-civic-ink/60">
                      Camera photos can provide GPS metadata. Gallery uploads remain available.
                    </p>
                  </div>
                </fieldset>

                <section aria-label="Detected location" className="border-2 border-civic-ink bg-civic-mint p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <span className="civic-hard flex h-10 w-10 shrink-0 items-center justify-center bg-white text-civic-green">
                      <MapPin size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold">Your location</h3>
                        <span className="bg-civic-amber px-2 py-1 font-mono text-[9px] tracking-wide text-civic-ink">
                          PHOTO / MANUAL
                        </span>
                      </div>
                      <p className="mt-1 break-words text-sm">{location.address || locationMessage}</p>
                      {location.lat && (
                        <p className="mt-2 break-words font-mono text-[9px] text-civic-ink/60">
                          {location.city}
                          {location.state ? ` · ${location.state}` : ''} · {Number(location.lat).toFixed(5)},{' '}
                          {Number(location.lng).toFixed(5)}
                        </p>
                      )}
                      <p className="mt-2 font-mono text-[9px] text-civic-ink/55">VERIFY THE ISSUE LOCATION BEFORE SUBMITTING</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchLocation}
                      className="civic-focus flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold underline"
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                      Use device location
                    </button>
                  </div>
                  <div className="mt-4 border-t-2 border-civic-ink/20 pt-4">
                    <form onSubmit={searchLocations} className="flex flex-col gap-2 sm:flex-row">
                      <label htmlFor="location-search" className="sr-only">Search issue location</label>
                      <input id="location-search" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Search the exact issue location" className={`${fieldClass} min-h-11 flex-1`} />
                      <button type="submit" disabled={searchingLocations} className="civic-focus civic-hard min-h-11 bg-white px-4 py-2 text-sm font-bold">
                        {searchingLocations ? 'Searching...' : 'Search location'}
                      </button>
                    </form>
                    {locationResults.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {locationResults.map((result) => (
                          <button type="button" key={`${result.place_id}-${result.lat}-${result.lon}`} onClick={() => selectLocation(result)} className="civic-focus block w-full border-2 border-civic-ink bg-white p-3 text-left text-sm hover:bg-civic-amber">
                            {result.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-civic-ink/60">If the photo has no GPS data, search and select the exact place manually.</p>
                  </div>
                </section>

                <div>
                  <label htmlFor="issue-title" className="mb-2 block font-display font-bold">
                    2. Issue title <span className="text-civic-red">*</span>
                  </label>
                  <input
                    id="issue-title"
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Streetlight not working on Main Road"
                    className={fieldClass}
                    required
                  />
                  <p className="mt-2 font-mono text-[9px] text-civic-ink/50">
                    BE SPECIFIC · {form.title.length} CHARACTERS
                  </p>
                </div>

                <div>
                  <label htmlFor="issue-description" className="mb-2 block font-display font-bold">
                    3. Describe the issue <span className="text-civic-red">*</span>
                  </label>
                  <textarea
                    id="issue-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Tell us what happened, where it is, and when you noticed it…"
                    className={`${fieldClass} min-h-[122px] resize-y`}
                    required
                  />
                  <p className="mt-2 text-xs text-civic-ink/60">Helpful details help the right team take action.</p>
                </div>

                <div>
                  <label htmlFor="issue-category" className="mb-2 block font-display font-bold">
                    4. Choose a category <span className="text-civic-red">*</span>
                  </label>
                  <input
                    id="issue-category"
                    type="text"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="e.g. Roads & potholes"
                    className={fieldClass}
                    required
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="border-2 border-civic-red bg-civic-error-surface px-3 py-2.5 text-sm font-semibold text-[#792323]"
                  >
                    {error}
                  </p>
                )}

                <div className="border-t-[3px] border-civic-ink pt-5">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="max-w-sm text-xs text-civic-ink/65">
                      Your report is shared with the relevant local team. Follow its status in Issue List.
                    </p>
                    <button
                      type="submit"
                      disabled={submitting || photos.length < 1}
                      className="civic-focus civic-hard-strong min-h-12 w-full bg-civic-green px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B9B9B4] disabled:text-[#555] sm:w-auto"
                    >
                      <span>
                        <ArrowRight size={16} className="mr-2 inline" aria-hidden="true" />
                        {submitting ? 'Submitting…' : 'Submit Issue'}
                      </span>
                      {!photos.length && (
                        <span className="mt-1 block font-mono text-[9px] font-normal">ADD A PHOTO TO CONTINUE</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          <aside className="report-aside space-y-5">
            <section className="civic-hard bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">What happens next?</h3>
                <ArrowRight size={21} className="text-civic-green" aria-hidden="true" />
              </div>
              <ol className="mt-5 space-y-4">
                {NEXT_STEPS.map(([number, title, text], index) => (
                  <li key={number} className="flex gap-3">
                    <span
                      className={`civic-hard flex h-8 w-8 shrink-0 items-center justify-center font-mono text-xs ${
                        index === 0 ? 'bg-civic-green text-white' : index === 1 ? 'bg-civic-amber' : 'bg-white'
                      }`}
                    >
                      {number}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="mt-1 text-xs text-civic-ink/65">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="civic-hard bg-civic-ink p-5 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-civic-mint" aria-hidden="true" />
                <h3 className="font-display font-bold">A useful report</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs">
                {['Take a clear, well-lit photo', 'Include a nearby landmark', 'Describe what needs attention'].map(
                  (tip) => (
                    <li key={tip} className="flex gap-2">
                      <CheckCircle2 size={15} className="shrink-0 text-civic-mint" aria-hidden="true" />
                      {tip}
                    </li>
                  ),
                )}
              </ul>
            </section>

            <section className="civic-hard bg-civic-amber p-4">
              <p className="civic-eyebrow">Your contribution</p>
              <p className="mt-2 font-display font-bold">Small details make a big difference.</p>
              <p className="mt-1 text-xs">Thank you for helping improve your neighbourhood.</p>
            </section>
          </aside>
        </div>
      </div>
    </CivicShell>
  );
}
