import React from 'react'

const VEHICLE_IMAGES = {
    car: 'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg',
    moto: 'https://shorturl.at/5zCIa',
    auto: 'https://shorturl.at/B2YCj',
};

const LookingForDriver = (props) => {
    const vehicle = props?.vehicleType || 'car';
    const link = VEHICLE_IMAGES[vehicle] || VEHICLE_IMAGES.car;

    const pickup = props?.pickup || '';
    const destination = props?.destination || '';

    // Fare can be either a number or an object keyed by vehicleType
    let fareDisplay = '';
    const fare = props?.fare;
    if (typeof fare === 'number') {
        fareDisplay = fare;
    } else if (fare && typeof fare === 'object') {
        fareDisplay = fare[vehicle] ?? '';
    }

    return (
        <div>
            <h5
                className='p-1 text-center w-[93%] absolute top-0'
                onClick={() => props?.setVehicleFound && props.setVehicleFound(false)}
            >
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-5'>Looking for a Driver</h3>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <img className='h-20' src={link} alt={vehicle} />
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'></h3>
                            <p className='text-sm -mt-1 text-gray-600'>{pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'></h3>
                            <p className='text-sm -mt-1 text-gray-600'>{destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{fareDisplay}</h3>
                            <p className='text-sm -mt-1 text-gray-600'>CASH/ONLINE</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LookingForDriver
