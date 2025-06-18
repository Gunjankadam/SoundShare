# FriendlyBros

**FriendlyBros** is a full-stack web application built using **Node.js**, **Express**, **Passport.js**, and **EJS** templates. It features user authentication, media management, QR code handling, and integration with services like Firebase and Supabase.

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

## 📸 Screenshots

You can add screenshots of:
- Login Page (`views/login.ejs`)
- Audio Recorder (`views/record.ejs`)
- QR Code Interaction

---

## 🛠️ Technologies Used

- Node.js + Express
- Firebase
- Supabase
- MongoDB/Mongoose (assumed from model naming)
- EJS Templates
- Passport.js (Authentication)

---

## 🧪 Testing

To be added. You can use tools like Postman for API testing or add Mocha/Chai for unit testing.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙋‍♂️ Authors

- [Your Name](https://github.com/your-username)

Feel free to contribute, open issues, or suggest improvements!