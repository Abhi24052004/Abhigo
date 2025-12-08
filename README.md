# AbhiGo - Ride Booking Platform (Frontend)

## 📱 Project Overview

AbhiGo is a modern, full-stack ride-sharing platform built with the MERN stack (MongoDB, Express, React, Node.js) + Socket.io. It provides real-time ride booking, live location tracking, in-ride chat, and supports both instant and scheduled (event) rides.

**Tech Stack:** React 19 + Vite + TailwindCSS 4 + Socket.io + Google Maps API

---

## ✨ Key Features

### 🚗 Dual Role System
- **Users** - Book rides, track drivers, chat with captains, view ride history
- **Captains (Drivers)** - Accept rides, track earnings, manage vehicle info, view event bookings

### 📍 Instant Ride Booking
- Real-time ride requests with dynamic fare calculation
- Vehicle selection (Car, Auto, Moto) with instant pricing
- Captain matching algorithm with location-based search
- Live status tracking (pending → accepted → ongoing → completed)

### 📅 Event Ride Booking (Scheduled Rides)
- Schedule rides 1-30 days in advance
- Special requests field (decorations, music, etc.)
- Email confirmation with professional templates
- Separate captain event view and management

### 🗺️ Live Location Tracking
- Real-time captain location updates via WebSocket
- Google Maps integration with route rendering
- Custom markers and overlay labels
- Threshold-based camera movement (prevents mobile jitter)
- Auto-follow mode with smart pause on user drag
- Distance and duration display

### 💬 In-Ride Chat
- Room-based messaging architecture (ride-specific rooms)
- Real-time message delivery via Socket.io
- Optimistic rendering with deduplication (user side)
- Bubble UI (user right, captain left)
- Floating chat button for easy access
- Fallback direct emit when counterpart not in room

### 🔐 Authentication & Security
- JWT-based authentication with httpOnly cookies
- Email/password registration with strong password validation
- Password reset flow with OTP via email webhook
- Token blacklisting on logout
- Protected routes with role-based access control

### 💪 Password Security
- Minimum 8 characters required
- Must include uppercase, lowercase, number, and special character
- Validated on signup, login password reset
- Real-time error feedback

### 📊 Ride History & Management
- Paginated ride history (3 rides per page)
- Filter by ride type (Event vs Normal)
- Status indicators (Pending, Accepted, Ongoing, Completed)
- Detailed ride view modal with all information
- Separate views for users and captains

### 👤 Profile Management
- User: Inline editing (First/Last name, Email)
- Captain: Profile display with statistics
  - Total Rides count
  - Total Earnings calculation
  - Ride history with event/normal distinction

### 📧 Email Notifications
- Event ride booking confirmations
- Styled plain-text templates with ASCII borders
- Structured sections (details, service info, next steps)
- Professional tone with emoji icons

### 📱 Responsive Design
- Mobile-first approach
- Touch-friendly UI elements
- Swipeable panels and modals
- Adaptive layouts for all screen sizes
- Optimized map rendering for mobile
- Fast loading with Vite build

---

## 🏗️ Project Structure

```
Frontend/src/
├── pages/
│   ├── Start.jsx                 # Landing/splash screen
│   ├── UserSignUp.jsx            # User registration with strong password validation
│   ├── UserLogin.jsx             # User login with error handling
│   ├── UserLogout.jsx            # Logout handler
│   ├── UserProtectedWrapper.jsx  # Route guard for authenticated users
│   ├── Home.jsx                  # User dashboard (3 tabs: Profile, Book Event, Ride History)
│   ├── Riding.jsx                # Active ride tracking for users
│   ├── CaptainSignUp.jsx         # Captain registration (auto vehicle capacity)
│   ├── CaptainLogin.jsx          # Captain login with error handling
│   ├── CaptainLogout.jsx         # Captain logout
│   ├── CapatinProtectedWrapper.jsx # Route guard for captains
│   ├── CaptainHome.jsx           # Captain dashboard (events, profile, history)
│   ├── CaptainRiding.jsx         # Active ride execution for captains
│   └── CaptainIssue.jsx          # Issue reporting page
│
├── components/
│   ├── LocationSearchPanel.jsx        # Autocomplete for pickup/destination (instant rides)
│   ├── LocationSearchPanelForEvent.jsx # Autocomplete for event rides
│   ├── Vehicle.jsx                    # Vehicle selection for instant rides
│   ├── EventVehicle.jsx               # Vehicle selection for event rides
│   ├── ConfirmRide.jsx                # Confirmation modal (instant rides)
│   ├── EventConfirmRide.jsx           # Confirmation modal (event rides)
│   ├── LookingForDriver.jsx           # Driver search animation/loader
│   ├── Driver.jsx                     # Driver details panel + chat (user side)
│   ├── RidePopUp.jsx                  # Incoming ride notification (captain)
│   ├── EventRidePopUp.jsx             # Incoming event ride notification
│   ├── ConfirmRidePopUp.jsx           # Ride acceptance confirmation
│   ├── ArrivedAtPickup.jsx            # Captain arrival screen + chat
│   ├── StartEvent.jsx                 # Event ride start screen
│   ├── FinishRide.jsx                 # Ride completion screen with fare summary
│   ├── UserRideDetails.jsx            # Detailed ride information modal
│   ├── CaptainDetail.jsx              # Captain profile bottom sheet (3 tabs)
│   ├── ForgotPasswordModal.jsx        # Multi-step password reset (users & captains)
│   ├── LiveTracking.jsx               # Base live map component
│   ├── updatedLiveTracking.jsx        # Enhanced captain → pickup tracking
│   └── DestinationLiveTracking.jsx    # User → destination tracking (active ride)
│
├── context/
│   ├── UserContext.jsx           # Global user authentication state
│   ├── CapatainContext.jsx       # Global captain authentication state
│   └── SocketContext.jsx         # Socket.io client connection provider
│
├── assets/                       # Images and static files
├── img/                          # Project images
├── App.jsx                       # Main app component with routing
├── main.jsx                      # React entry point
├── App.css                       # Global app styles
├── index.css                     # Base styles and resets
└── vite.config.js               # Vite configuration

```

---

## 🛠️ Tech Stack Details

### Frontend Technologies
- **React 19** - Latest UI library with automatic batching
- **Vite 7** - Lightning-fast build tool with HMR
- **React Router DOM 7** - Client-side routing
- **TailwindCSS 4** - Utility-first CSS framework
- **@react-google-maps/api 2** - Google Maps integration
- **RemixIcon 4** - Icon library
- **GSAP 3** - Animation library with React integration
- **Socket.io-client 4** - WebSocket client for real-time features
- **Axios 1** - HTTP client for API requests

### Key Libraries
- **express-validator** - Input validation on backend
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **dotenv** - Environment variable management

### External APIs
- **Google Maps API** - Geocoding, directions, places autocomplete, distance/duration
- **Email Webhook** - cloud.automatisch.io for sending emails

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn package manager
- Backend server running on `http://localhost:3000`
- MongoDB database configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abhi24052004/Abhigo.git
   cd Abhigo/Frotend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the Frontend directory
   ```env
   VITE_BASE_URL=http://localhost:3000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_SOCKET_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`

### Build for Production
```bash
npm run build
```

Output: `dist/` folder (static files ready for deployment)

---

## 📋 User Workflows

### User Flow

1. **Start** → Select User/Captain role
2. **Sign Up/Login** → Email, password, profile info
3. **Home Dashboard**
   - **Tab 1: Profile** - View/edit name, email, logout
   - **Tab 2: Book for Event** - Schedule future rides with special requests
   - **Tab 3: Ride History** - View past rides with details
4. **Instant Ride Booking**
   - Enter pickup/destination
   - See vehicle prices
   - Confirm ride → Wait for captain
   - Chat with captain (real-time)
   - Live tracking to destination
   - Complete ride & leave
5. **View Detailed Ride** - Click on any ride to see full information

### Captain Flow

1. **Sign Up** → Name, email, password, vehicle info (capacity auto-filled)
2. **Captain Home**
   - Incoming ride notifications (accept/ignore)
   - Live map showing location
   - Bottom sheet with 3 tabs
3. **Bottom Sheet Tabs**
   - **Events** - View upcoming scheduled rides
   - **Profile** - Show stats (total rides, earnings)
   - **Ride History** - View completed rides
4. **Accept Ride** → Confirm acceptance
5. **Active Ride**
   - Live location sharing
   - Route to pickup
   - Arrive at pickup (chat available)
   - Start ride
   - Route to destination
   - Complete ride
   - View fare summary

---

## 🔑 Key Components Explained

### Authentication
- **UserLogin/CaptainLogin** - Form validation, JWT token storage, error handling
- **UserSignUp/CaptainSignUp** - Registration with strong password, vehicle info collection
- **ForgotPasswordModal** - Multi-step password reset with OTP verification
- **Protected Routes** - Redirect unauthenticated users to login

### Ride Booking
- **LocationSearchPanel** - Google Maps Places autocomplete for addresses
- **Vehicle Selection** - Display fare for each vehicle type
- **ConfirmRide Modal** - Review booking before submission
- **LookingForDriver** - Loading animation while searching for captains

### Real-Time Features
- **Socket Events** - join, join-ride, join-event, ride-message, update-location-captain
- **Live Tracking** - updatedLiveTracking component with threshold-based panning
- **Chat System** - Room-based messaging with optimistic rendering

### Tracking & Maps
- **updatedLiveTracking** - Captain to pickup tracking with stabilization
- **DestinationLiveTracking** - User to destination tracking during active ride
- **Custom Markers** - SVG pins for captain/pickup/destination
- **Auto-Follow Mode** - Smart camera movement with user pause detection

---

## 🔐 Security Features

✅ **Strong Password Requirements**
- Minimum 8 characters
- Uppercase, lowercase, number, special character
- Validated on signup, password reset
- Regex-based validation

✅ **Vehicle Plate Validation**
- Indian plate format (MH-12-AB-1234)
- Regex validation with flexible formats
- Supports with/without hyphens

✅ **Input Validation**
- Email format validation
- Express-validator on backend
- Client-side pre-submission checks

✅ **Authentication**
- JWT tokens with httpOnly cookies
- Token blacklisting on logout
- Protected API routes with middleware

✅ **Error Handling**
- User-friendly error messages
- Backend error propagation
- Network error handling with retries

---

## 📊 Data Flow

```
User/Captain
    ↓
Frontend (React)
    ↓
API Calls (Axios) → Express Server
    ↓
Database Operations (MongoDB)
    ↓
Socket Events (Real-time)
    ↓
Frontend (React)
```

---

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first with TailwindCSS
- **Smooth Animations** - GSAP transitions and panel slides
- **Touch-Friendly** - Large buttons, swipeable panels
- **Real-Time Updates** - Socket.io for instant notifications
- **Visual Feedback** - Loading states, error messages, success confirmations
- **Map Stabilization** - Threshold-based panning prevents jitter on mobile
- **Auto-Follow Mode** - Smart camera tracking with drag pause

---

## 🔄 Ride Status Flow

```
Instant Rides:
pending → accepted → ongoing → completed

Event Rides:
pending → accepted → (on event day) → ongoing → completed
```

---

## 📱 Responsive Breakpoints

- Mobile (< 640px) - Single column, full width buttons
- Tablet (640px - 1024px) - Adjusted spacing, bottom sheets
- Desktop (> 1024px) - Expanded layout, sidebar panels

---

## 🧪 Testing

Manual testing via:
- Browser DevTools (network, console, mobile emulation)
- Mobile device testing for map rendering
- API testing with Postman/Insomnia
- Socket.io connection testing

---

## 📝 Environment Variables

Create `.env` file in Frontend directory:

```env
# API Configuration
VITE_BASE_URL=http://localhost:3000

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Socket Server
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🚢 Deployment

### Build
```bash
npm run build
```

Output: `dist/` folder (static files ready for deployment)

### Deploy to Render

#### Backend Deployment (Node.js)
1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `Backend` directory as root

2. **Configure Environment Variables**
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   GOOGLE_MAPS_API_KEY=your_api_key
   ```

3. **Set Build Command**
   ```bash
   npm install
   ```

4. **Set Start Command**
   ```bash
   npm start
   ```

5. **Deploy** - Render will automatically deploy on push to master

#### Frontend Deployment (React/Vite)
1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Select the `Frontend` directory as root

2. **Configure Build Settings**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

3. **Set Environment Variables** in Render dashboard
   ```
   VITE_BASE_URL=https://your-backend-url.onrender.com
   VITE_GOOGLE_MAPS_API_KEY=your_api_key
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy** - Render will automatically deploy on push to master

### After Deployment

1. **Update Frontend `.env`** to use deployed backend URL
   ```env
   VITE_BASE_URL=https://abhigo-backend.onrender.com
   VITE_GOOGLE_MAPS_API_KEY=your_api_key
   VITE_SOCKET_URL=https://abhigo-backend.onrender.com
   ```

2. **Update Backend CORS settings** to allow frontend domain
   ```javascript
   cors({
     origin: 'https://abhigo-frontend.onrender.com',
     credentials: true
   })
   ```

3. **Test the deployed application**
   - Visit your frontend URL
   - Sign up and test all features
   - Check browser console for errors
   - Monitor Render logs for backend issues

### Render Service Links

Once deployed, you'll have:
- **Frontend URL:** `https://your-frontend-name.onrender.com`
- **Backend URL:** `https://your-backend-name.onrender.com`

Both services will automatically redeploy when you push to the master branch.

---

### Alternative Deployment Options

- **Vercel** - Best for React/Vite frontend
- **Netlify** - Alternative for static sites
- **Heroku** - Alternative for backend (note: free tier discontinued)
- **AWS** - Scalable production option
- **GitHub Pages** - Free static hosting (frontend only)

---

## 📊 Deployment Checklist

- [ ] Backend deployed on Render with MongoDB connection
- [ ] Frontend deployed on Render with build optimizations
- [ ] Environment variables configured on both services
- [ ] CORS settings updated for production domain
- [ ] SSL/TLS enabled (automatic on Render)
- [ ] Tested sign up, login, ride booking flows
- [ ] Tested real-time features (chat, location tracking)
- [ ] Checked browser console for errors
- [ ] Monitored server logs for issues
- [ ] Set up error monitoring/logging (optional: Sentry)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Developer

**Abhi24052004**

GitHub: [github.com/Abhi24052004/Abhigo](https://github.com/Abhi24052004/Abhigo)

---

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include screenshots/logs if applicable

---



---

Happy Coding! 🚀

