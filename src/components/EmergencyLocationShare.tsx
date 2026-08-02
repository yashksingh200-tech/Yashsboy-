import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Send,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Smartphone,
  ShieldAlert,
  RefreshCw,
  Navigation,
  UserCheck
} from 'lucide-react';
import { EmergencyContact } from '../types';

interface EmergencyLocationShareProps {
  emergencyContact?: EmergencyContact;
  userName?: string;
  companionName?: string;
  isCrisisPrompt?: boolean;
  onNavigateToSettings?: () => void;
  className?: string;
}

export const EmergencyLocationShare: React.FC<EmergencyLocationShareProps> = ({
  emergencyContact,
  userName,
  companionName = 'Aria',
  isCrisisPrompt = false,
  onNavigateToSettings,
  className = '',
}) => {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  } | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shareConfirmation, setShareConfirmation] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const contactName = emergencyContact?.name || 'Emergency Contact';
  const contactPhone = emergencyContact?.phone || '';

  // Get current GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsFetching(true);
    setLocationError(null);
    setShareConfirmation(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsFetching(false);
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp,
        });

        if (emergencyContact?.name) {
          setShareConfirmation(`GPS location acquired. Ready to share with ${emergencyContact.name}.`);
        } else {
          setShareConfirmation('GPS location acquired.');
        }
      },
      (error) => {
        setIsFetching(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission was denied. Please allow location access in your browser settings to share your emergency location.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is currently unavailable. Please try again or ensure GPS is enabled.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('An unknown error occurred while retrieving your location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const mapUrl = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : '';
  const shareText = `EMERGENCY LOCATION SHARE (${userName || 'User'}):\nMy current GPS location: ${mapUrl}\n(Shared via Ferio Heart AI)`;

  // Trigger SMS share
  const handleShareSMS = () => {
    if (!location) return;
    const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(shareText)}`;
    
    window.location.href = smsUrl;
    setShareConfirmation(`Your location has been shared with ${contactName}!`);
  };

  // Trigger Web Share API
  const handleWebShare = async () => {
    if (!location) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emergency Location Share',
          text: `EMERGENCY LOCATION: I am sharing my current location.`,
          url: mapUrl,
        });
        setShareConfirmation(`Your location link was shared with ${contactName}!`);
      } catch (err) {
        // Share cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Copy link
  const handleCopyLink = () => {
    if (!mapUrl) return;
    navigator.clipboard.writeText(mapUrl);
    setCopiedLink(true);
    setShareConfirmation(`Location map link copied to clipboard. Ready to send to ${contactName}.`);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 shadow-sm space-y-3.5 ${className}`}>
      {/* Header Title */}
      <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
            <MapPin className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Emergency Location Sharing
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Share your live GPS map coordinates with your trusted contact
            </p>
          </div>
        </div>

        {emergencyContact?.name && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Contact: {emergencyContact.name.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Gentle Crisis Prompt Message */}
      {isCrisisPrompt && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-950 dark:text-amber-200 leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{companionName}'s Safety Suggestion:</span>
          </p>
          <p className="text-[11px] font-medium">
            "Would you like me to share your current location with{' '}
            <span className="font-extrabold underline">{contactName}</span>
            {contactPhone ? ` (${contactPhone})` : ''}, so they can reach or assist you?"
          </p>
        </div>
      )}

      {/* Emergency Contact Warning if no contact configured */}
      {!contactPhone && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            No emergency phone saved yet.
          </span>
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition cursor-pointer"
            >
              + Save Contact
            </button>
          )}
        </div>
      )}

      {/* Action / Trigger Button */}
      {!location ? (
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isFetching}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-60"
        >
          {isFetching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Fetching GPS Location...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-rose-200 group-hover:scale-110 transition-transform" />
              <span>Share My Current Location with {contactName}</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Location Details & Map Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span>GPS Location Acquired</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                ±{location.accuracy}m Accuracy
              </span>
            </div>

            <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
              Latitude: <span className="font-bold text-slate-900 dark:text-white">{location.lat.toFixed(6)}</span> | Longitude:{' '}
              <span className="font-bold text-slate-900 dark:text-white">{location.lng.toFixed(6)}</span>
            </p>

            {/* Embedded OpenStreetMap View */}
            <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-inner">
              <iframe
                title="User Emergency Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005}%2C${location.lat - 0.005}%2C${location.lng + 0.005}%2C${location.lat + 0.005}&layer=mapnik&marker=${location.lat}%2C${location.lng}`}
                className="w-full h-full border-0"
              />
            </div>

            {/* Re-fetch GPS Location */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh GPS</span>
              </button>
            </div>
          </div>

          {/* Share Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contactPhone && (
              <button
                type="button"
                onClick={handleShareSMS}
                className="py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send SMS to {contactName.split(' ')[0]}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleWebShare}
              className="py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link via Apps</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Map Link'}</span>
            </button>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* Location Error Display */}
      {locationError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </motion.div>
      )}

      {/* Confirmation Toast / Banner */}
      {shareConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-extrabold flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{shareConfirmation}</span>
        </motion.div>
      )}

      {/* IMPORTANT CLARIFICATION / DISCLAIMER NOTICE */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-normal">
        <p className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Important Clarification regarding Location Tools:</span>
        </p>
        <p>
          This is an <strong>emergency location-sharing tool</strong> to help loved ones find or assist you during a crisis. It is <em>not</em> a lost phone finder service.
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
          For tracking lost or stolen devices, please use your phone system's built-in services:
          <br />
          • <strong>Android</strong>: Google Find My Device (android.com/find)
          <br />
          • <strong>Apple iOS</strong>: Apple Find My iPhone (icloud.com/find)
        </p>
      </div>
    </div>
  );
};
