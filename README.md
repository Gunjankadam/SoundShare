# SoundShare

**SoundShare** is a voice-based social platform where users can record, upload, and share audio messages easily. The platform supports secure user authentication and allows recordings to be stored and accessed via personalized QR codes. Users can choose to upload audio from local files or cloud sources like Supabase. With features like password recovery, audio compression, and user-friendly design, SoundShare makes audio sharing simple and efficient.

---

## 🚀 Features

- 🔐 User Authentication (Passport.js)
- 🔊 Media Upload & Management
- 🔗 QR Code Generator/Handler
- ☁️ Firebase & Supabase Integration
- 🛠️ Custom Error Handling Middleware
- 🌐 EJS-based Views for Login, Recordings, and Password Recovery

---

## 📁 Project Structure

```
friendlyBros/
├── config/                # Supabase, Firebase, DB Configs
├── controllers/           # Handles business logic (e.g. qrcode, users)
├── middleware/            # Custom error handling
├── models/                # Mongoose/DB models for media, audio, users
├── routes/                # Express routes (e.g. /user)
├── views/                 # EJS templates
├── server.js              # Main Express server
├── package.json           # Project metadata & dependencies
```

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/friendlyBros.git
   cd friendlyBros
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Create a `.env` file in the root and add:
   ```env
   FIREBASE_API_KEY=your_firebase_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SESSION_SECRET=your_session_secret
   ```

4. **Run the app**
   ```bash
   npm start
   ```

---

## 🛠️ Technologies Used

- Node.js + Express
- Firebase
- Supabase
- MongoDB/Mongoose (assumed from model naming)
- EJS Templates
- Passport.js (Authentication)

---

## 🧪 Deployed Website

https://friendlybro.onrender.com/

---

## 📸 Screenshots

You can add screenshots of:
- Login Page 
  ![Image 1](https://github.com/Gunjankadam/SoundShare/blob/main/login.jpg)
- Homepage
  ![Image 2](https://github.com/Gunjankadam/SoundShare/blob/main/homepage.jpg)
- QR Code Interaction
  ![Image 3](https://github.com/Gunjankadam/SoundShare/blob/main/note.jpg)
