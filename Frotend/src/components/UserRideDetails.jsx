import React from "react";

/**
 * UserRideDetails
 * Props:
 * - ride: the ride object to display
 * - allRides: (optional) full array of rides (provided by Home)
 * - onClose: function to call when closing the details panel
 *
 * This component shows a modal / bottom-sheet style card with:
 * - Title: "Ride Details" or "Event Details" depending on ride.isEvent
 * - Subtitle: "Ride" or "Event"
 * - Captain name in place of user_name
 * - Price
 * - Date & Time (date shown as dd/mm/yyyy)
 * - Pickup
 * - Destination
 * - Special Requirements (only for events)
 *
 * Styling uses the same utility classes / look-and-feel as the screenshots the user provided.
 */
export default function UserRideDetails({ ride, allRides = [], onClose }) {
  if (!ride) return null;

  const isEvent = !!ride.isEvent;

  const formatDateTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      const dd = pad(d.getDate());
      const mm = pad(d.getMonth() + 1);
      const yyyy = d.getFullYear();
      // 12-hour time with AM/PM
      let hours = d.getHours();
      const minutes = pad(d.getMinutes());
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hh = pad(hours);
      return `${dd}/${mm}/${yyyy} · ${hh}:${minutes} ${ampm}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
      />
      {/* panel */}
      <div className="relative z-10 w-full max-w-xl bg-white rounded-t-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{ride?.eventDateTime ? "Event Details" : "Ride Details"}</h3>
            <div className="text-sm text-gray-500">{isEvent ? "Event" : "Ride"}</div>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-400">Captain</div>
            <div className="font-medium">{ride.captain?.fullname.firstname || "N/A"}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded text-right">
            <div className="text-xs text-gray-400">Price</div>
            <div className="text-orange-600 font-semibold">₹{ride.fare ?? ride.price ?? "-"}</div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded mb-3">
          <div className="text-xs text-gray-400">Date & Time</div>
          <div className="mt-1">{formatDateTime( ride.eventDateTime || ride.createdAt)}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded mb-3">
          <div className="text-xs text-gray-400">Pickup</div>
          <div className="mt-1">{ride.pickup || ride.eventPickup || "-"}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded mb-3">
          <div className="text-xs text-gray-400">Destination</div>
          <div className="mt-1">{ride.destination || ride.eventDestination || "-"}</div>
        </div>

        {isEvent && (
          <div className="bg-gray-50 p-3 rounded mb-3">
            <div className="text-xs text-gray-400">Special Requirements</div>
            <div className="mt-1">{ride.specialRequest || "-"}</div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 ml-2">
          <div className="text-sm text-gray-500">Showing details for this ride</div>
          <div className="text-xs text-gray-400">Total rides: {allRides.length}</div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-amber-50 text-amber-700 px-4 py-2 rounded shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}