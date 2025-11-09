import React, { useEffect, useState } from 'react';

function RidePopUp(props) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    useEffect(() => {
        const dateTime = props.ride?.eventDateTime;
        if (dateTime) {
            const d = new Date(dateTime);
            setDate(d.toLocaleDateString("en-GB")); // e.g. "01/11/2025"
            setTime(d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })); // e.g. "9:41 PM"
        }
    }, [props.ride]);

    return (
        <div className="flex flex-col w-[96%] mx-2 -mt-3 ">
            <div className="flex justify-between my-4 items-center bg-amber-100 rounded-sm px-2 py-2">
                <div className="flex gap-2 items-center">
                    <img
                        className="h-15 w-15 rounded-full"
                        src="https://shorturl.at/54cnd"
                        alt=""
                    />
                    <h4 className="text-base font-bold">
                        {props.ride?.user?.FullName?.FirstName + " " + props.ride?.user?.FullName?.LastName}
                    </h4>
                </div>
                <div>
                    <p className="font-bold">
                        <i className="ri-money-rupee-circle-line"></i>{" " + props.ride?.fare}
                    </p>
                    <p className="text-sm text-gray-500 font-light text-right">2.2KM</p>
                </div>
            </div>

            <div className="overflow-y-auto max-h-[30vh]">
                <div className="border-b-2 border-gray-300">
                    <h4 className="text-gray-400 text-sm">PICK UP</h4>
                    <p className="text-base font-semibold mb-3">{props.ride?.pickup}</p>
                </div>

                <div className="border-b-2 border-gray-300 mt-3">
                    <h4 className="text-gray-400 text-sm">DROP OFF</h4>
                    <p className="text-base font-semibold mb-3">{props.ride?.destination}</p>
                </div>

                <div className="border-b-2 border-gray-300 mt-3">
                    <h4 className="text-gray-400 text-sm">EVENT DATE</h4>
                    <p className="text-base font-semibold mb-3">{date || "N/A"}</p>
                </div>

                <div className="border-b-2 border-gray-300 mt-3">
                    <h4 className="text-gray-400 text-sm">EVENT TIME</h4>
                    <p className="text-base font-semibold mb-3">{time || "N/A"}</p>
                </div>

                <div className="border-b-2 border-gray-300 mt-3">
                    <h4 className="text-gray-400 text-sm">REQUEST</h4>
                    <p className="text-base font-semibold mb-3">{props.ride?.specialRequest}</p>
                </div>
            </div>

            <div className="flex justify-end gap-5 mt-2 mb-2 bg-white">
                <button className="text-xl text-gray-400 font-semibold" onClick={() => props.setEventRidePopUpPanel(false)}> Ignore</button>
                <button className="text-xl text-black bg-amber-300 px-5 py-2 rounded-xl font-semibold" onClick={() => { props.confirmEventRide();props.setEventRidePopUpPanel(false);}}> Accept Event</button>
            </div>
        </div>
    );
}

export default RidePopUp;
