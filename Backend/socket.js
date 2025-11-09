const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const rideModel = require('./models/ride.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join', async (data) => {
            try {
                const { userId, userType } = data || {};
                if (!userId || !userType) return;

                if (userType === 'user') {
                    await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
                    await autoJoinActiveEvent(socket, userId, 'user');
                } else if (userType === 'captain') {
                    await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
                    await autoJoinActiveEvent(socket, userId, 'captain');
                }
            } catch (err) {
                console.error('Error in join handler:', err.message);
            }
        });

        socket.on('join-event', async (data) => {
            try {
                const { rideId, userId, userType } = data || {};
                if (!rideId || !userId || !userType) return socket.emit('error', { message: 'Missing join-event params' });
                const ride = await rideModel.findById(rideId).populate('user').populate('captain');
                if (!ride) return socket.emit('error', { message: 'Ride not found' });
                if (!ride.eventDateTime) return socket.emit('error', { message: 'Not an event ride' });

                if (userType === 'captain' && ride.captain && String(ride.captain._id) !== String(userId)) {
                    return socket.emit('error', { message: 'Captain mismatch for ride' });
                }
                if (userType === 'user' && String(ride.user._id) !== String(userId)) {
                    return socket.emit('error', { message: 'User mismatch for ride' });
                }

                const room = `ride:${ride._id}`;
                socket.join(room);
                socket.emit('joined-event', { rideId: ride._id, role: userType });
            } catch (err) {
                console.error('join-event error:', err);
                socket.emit('error', { message: 'Failed to join event ride' });
            }
        });

        // Normal (non-event) ride room join
        socket.on('join-ride', async (data) => {
            try {
                const { rideId, userId, userType } = data || {};
                if (!rideId || !userId || !userType) return socket.emit('error', { message: 'Missing join-ride params' });
                const ride = await rideModel.findById(rideId).populate('user').populate('captain');
                if (!ride) return socket.emit('error', { message: 'Ride not found' });
                if (ride.eventDateTime) return socket.emit('error', { message: 'Use join-event for event ride' });

                // membership checks
                if (userType === 'captain') {
                    if (!ride.captain || String(ride.captain._id) !== String(userId)) {
                        return socket.emit('error', { message: 'Captain mismatch for ride' });
                    }
                } else if (userType === 'user') {
                    if (!ride.user || String(ride.user._id) !== String(userId)) {
                        return socket.emit('error', { message: 'User mismatch for ride' });
                    }
                } else {
                    return socket.emit('error', { message: 'Invalid userType' });
                }

                const room = `ride:${ride._id}`;
                socket.join(room);
                socket.emit('joined-ride', { rideId: ride._id, role: userType });
            } catch (err) {
                console.error('join-ride error:', err);
                socket.emit('error', { message: 'Failed to join ride' });
            }
        });

        // Chat messaging inside ride room (event or normal)
        socket.on('ride-message', async (data) => {
            try {
                const { rideId, userId, userType, text } = data || {};
                if (!rideId || !userId || !userType || !text) return socket.emit('error', { message: 'Missing ride-message params' });
                const ride = await rideModel.findById(rideId).populate('user').populate('captain');
                if (!ride) return socket.emit('error', { message: 'Ride not found' });

                // membership validation
                const isCaptain = userType === 'captain' && ride.captain && String(ride.captain._id) === String(userId);
                const isUser = userType === 'user' && ride.user && String(ride.user._id) === String(userId);
                if (!isCaptain && !isUser) return socket.emit('error', { message: 'Not authorized for this ride' });

                const room = `ride:${ride._id}`;
                const payload = {
                    rideId: ride._id,
                    from: userType,
                    userId,
                    text: String(text).slice(0, 2000),
                    ts: Date.now()
                };
                io.to(room).emit('ride-message', payload);

                // Fallback: if counterpart not currently in the room, emit directly to their socket
                try {
                    const roomSet = io.sockets.adapter.rooms.get(room) || new Set();
                    const senderSocketId = socket.id;
                    const targetSockets = [];
                    if (ride.user && ride.user.socketId && userType !== 'user') targetSockets.push(ride.user.socketId);
                    if (ride.captain && ride.captain.socketId && userType !== 'captain') targetSockets.push(ride.captain.socketId);
                    targetSockets.forEach((sid) => {
                        if (sid && !roomSet.has(sid) && sid !== senderSocketId) {
                            io.to(sid).emit('ride-message', payload);
                        }
                    });
                } catch (e) {
                    console.error('ride-message fallback emit error:', e);
                }
            } catch (err) {
                console.error('ride-message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data || {};
            if (!userId || !location || typeof location.ltd !== 'number' || typeof location.lng !== 'number') {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, { location: { ltd: location.ltd, lng: location.lng } });

            try {
                const ride = await rideModel.findOne({ captain: userId, status: { $in: ['accepted', 'ongoing'] } }).populate('user');
                if (ride) {
                    const payload = { rideId: ride._id, captainId: userId, location };
                    if (ride.user && ride.user.socketId) {
                        io.to(ride.user.socketId).emit('captain-location-update', payload);
                    }
                    const room = `ride:${ride._id}`;
                    io.to(room).emit('captain-location-update', payload);
                }
            } catch (err) {
                console.error('Error forwarding captain location to user/event room:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

    console.log("this msg printed in socket.js -- ", messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

const broadcast = (messageObject) => {
    if (!io) {
        return console.log('Socket.io not initialized.');
    }
    if (!messageObject || !messageObject.event) return;
    io.emit(messageObject.event, messageObject.data);
}

const broadcastExcept = (excludeSocketId, messageObject) => {
    if (!io) {
        return console.log('Socket.io not initialized.');
    }
    if (!messageObject || !messageObject.event) return;
    if (excludeSocketId) {
        io.except(excludeSocketId).emit(messageObject.event, messageObject.data);
    } else {
        io.emit(messageObject.event, messageObject.data);
    }
}

async function autoJoinActiveEvent(socket, userId, userType) {
    try {
        let criteria;
        if (userType === 'captain') {
            criteria = { captain: userId, status: { $in: ['accepted', 'ongoing'] }, eventDateTime: { $ne: null } };
        } else {
            criteria = { user: userId, status: { $in: ['accepted', 'ongoing'] }, eventDateTime: { $ne: null } };
        }
        const ride = await rideModel.findOne(criteria).populate('user').populate('captain');
        if (!ride) return;
        const room = `ride:${ride._id}`;
        socket.join(room);
        socket.emit('joined-event', { rideId: ride._id, role: userType, auto: true });
    } catch (err) {
        console.error('autoJoinActiveEvent error:', err.message);
    }
}

module.exports = { initializeSocket, sendMessageToSocketId, broadcast, broadcastExcept };
