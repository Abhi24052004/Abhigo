import React from 'react'

const LocationSearchPanelEvent = ({
  suggestions = [],
  setPickup,
  setDestination,
  activeField,
  onClose = () => {},
  absolute = false // when true, panel is positioned relative to parent (below input)
}) => {
  const textFor = (item) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    return item.description || item.formatted_address || item.name || item.address || JSON.stringify(item)
  }

  const handleSuggestionClick = (suggestion, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    const text = textFor(suggestion)
    if (!text) return
    if (activeField === 'pickup') {
      if (typeof setPickup === 'function') setPickup(text)
    } else if (activeField === 'destination') {
      if (typeof setDestination === 'function') setDestination(text)
    }
    try { onClose() } catch (err) { /* ignore */ }
  }

  // when absolute is true we place the panel below the input using top: 100%
  const containerClass = absolute
    ? 'absolute left-0 right-0 mt-2 bg-white shadow-lg rounded max-h-56 overflow-auto z-50'
    : 'h-full overflow-y-auto p-2'

  const containerStyle = absolute ? { top: '100%' } : undefined

  return (
    <div className={containerClass} style={containerStyle}>
      {(!suggestions || suggestions.length === 0) && (
        <div className="p-3 text-sm text-gray-500">No suggestions</div>
      )}

      {suggestions.map((elem, idx) => (
        <button
          key={idx}
          type="button"
          onClick={(e) => handleSuggestionClick(elem, e)}
          className="w-full text-left flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start hover:bg-gray-50"
        >
          <div className="bg-[#eee] h-8 w-8 flex items-center justify-center rounded-full">
            <i className="ri-map-pin-fill"></i>
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{textFor(elem)}</h4>
          </div>
        </button>
      ))}
    </div>
  )
}

export default LocationSearchPanelEvent