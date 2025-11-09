import React, { useMemo } from 'react'

function RidePopUp(props) {
    const passengerName = useMemo(() => {
        const user = props.ride?.user;
        if (!user) return 'Passenger';
        const fn = user.FullName?.FirstName || user.fullname?.firstname || '';
        const ln = user.FullName?.LastName || user.fullname?.lastname || '';
        const full = `${fn} ${ln}`.trim();
        return full || 'Passenger';
    }, [props.ride]);

    return (
        <div className="flex flex-col w-[96%] mx-2 -mt-2">
            <div className="flex justify-between my-4 items-center bg-amber-100 rounded-sm px-2 py-2">
                <div className="flex gap-2 items-center">
                    <img
                        className="h-15 w-15 rounded-full"
                        src="https://shorturl.at/54cnd"
                        alt="avatar"
                    />
                    <h4 className="text-base font-bold">{passengerName}</h4>
                </div>
                <div>
                    <p className="font-bold">
                        <i className="ri-money-rupee-circle-line"></i>{'  '}{props.ride?.fare}
                    </p>
                    <p className="text-sm text-gray-500 font-light text-right">2.2KM</p>
                </div>
            </div>
            <div>
                <div className="border-b-2 border-gray-300">
                    <h4 className="text-gray-400 text-sm">PICK UP</h4>
                    <p className="text-base font-semibold mb-3">{props.ride?.pickup}</p>
                </div>
                <div className="border-b-2 border-gray-300 mt-3">
                    <h4 className="text-gray-400 text-sm">DROP OFF</h4>
                    <p className="text-base font-semibold mb-3">{props.ride?.destination}</p>
                </div>
            </div>
            <div className="flex justify-end gap-5 mt-2 mb-2 bg-white">
                <button
                    className="text-xl text-gray-400 font-semibold"
                    onClick={() => props.setRidePopUpPanel(false)}
                >
                    Ignore
                </button>
                <button
                    className="text-xl text-black bg-amber-300 px-5 py-2 rounded-xl font-semibold"
                    onClick={() => {
                        props.confirmRide();
                        props.setRidePopUpPanel(false);
                        props.setArrivedPopUpPanel(true);
                    }}
                >
                    Accept
                </button>
            </div>
        </div>
    );
}

export default RidePopUp;
