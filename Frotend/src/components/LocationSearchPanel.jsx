import React from 'react'
import 'remixicon/fonts/remixicon.css'


function LocationSearchPanel() {
    const location = [
        "42B, Greenfield Street, Andheri West, Mumbai, MH 400058",
        "17A, Lakeview Road, Banjara Hills, Hyderabad, TS 500034",
        "8/3, Sunrise Apartments, Koregaon Park, Pune, MH 411001",
        "C-204, Orchid Greens, HSR Layout, Bengaluru, KA 560102",
    ]
    return (
        <>
            {
                location.map((ele,indx) => {
                    return <div key={indx} className="flex gap-3 items-center my-4 w-[96%] mx-2 border-2 border-amber-50 active:border-black rounded-xl">
                        <i className="ri-map-pin-line"></i>
                        <div>{ele}</div>
                    </div>
                })
            }
            
        </>

    )
}

export default LocationSearchPanel