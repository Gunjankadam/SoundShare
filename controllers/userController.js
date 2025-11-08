const registerModel = require("../models/registerModel");
const passport = require("passport");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const Media = require("../models/mediaModel");
const Audio = require("../models/audioModel");
const generateQRCode = require("../controllers/qrcode");
const axios = require("axios");
const fetch = require('node-fetch');
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require('fs');
const { Mixer, Track } = require('audio-mixer');
const { supabase } = require('../config/supabaseConfig');
const mongoose = require('mongoose');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');



const otpStore = new Map(); // Store OTPs temporarily
const verifiedEmails = new Set();


const getMediaById = asyncHandler(async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).send('Media not found');
        }

        res.render('media', {
            message: media.message,
            username: media.username,
            mood: media.mood,
            audioUrl: media.fileUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});





const getFileUrl = async (filePath) => {
  try {
    const { data, error } = supabase.storage
      .from("recordings") // your bucket name
      .getPublicUrl(filePath);

    if (error) {
      console.error("Error getting public URL:", error);
      throw new Error("Failed to retrieve file URL");
    }

    return data.publicUrl;
  } catch (err) {
    console.error("Error retrieving file URL:", err);
    throw new Error("Failed to retrieve file URL");
  }
};

//@desc fetch recordings
//@route GET /fetch-record
//@access private  
const FetchAudio = asyncHandler(async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: "Username is required." });
  }

  try {
    const files = await Audio.find({ username });

    if (files.length === 0) {
      return res.status(404).json({ success: false, error: "No files found for this user." });
    }

    // Prepare full response
    return res.json({
      success: true,
      files: files.map(file => ({
        name: file.audioname,
        url: file.audiourl // This should already be a Supabase public URL
      }))
    });

  } catch (error) {
    console.error("Error fetching audio files:", error);
    return res.status(500).json({ success: false, error: "Server error while fetching files." });
  }
});
  

//@desc register a user
//@route POST /register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await registerModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        req.flash("error", "Email is already in use.");
      }
      if (existingUser.username === username) {
        req.flash("error", "Username is already in use.");
      }
      return res.redirect("/register");
    }

    // Step 1: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

     const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore.set(email.toLowerCase(), {
      otp,
      hashedPassword,
      username,
      createdAt: Date.now(),
    });

    console.log("Generated OTP for", email, ":", otp);// Store OTP with email

    // Step 4: Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Replace with your Gmail
        pass: process.env.GMAIL_APP,    // Use Gmail App Password or SMTP credentials
      },
    });

    const mailOptions = {
      from: '"Soundshare" ',
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP is ${otp}`,
    };
   
    await transporter.sendMail(mailOptions);
    
    // Step 5: Redirect to OTP verification page
  req.session.tempEmail = email.toLowerCase();
  
  res.redirect("/verify-otp");

  } catch (e) {
    console.log("Error during registration:", e);
    res.redirect("/register");
  }
});


const verifyOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const email = req.session.tempEmail;
  // 1️ Check if OTP exists in memory
  const record = otpStore.get(email);
  if (!record) {
    req.flash("error", "OTP expired or not found.");
    return res.redirect("/register");
  }

  // 2️Compare OTP
  if (parseInt(otp) !== record.otp) {
    req.flash("error", "Invalid OTP.");
    return res.redirect("/verify-otp");
  }

  // 3️ Save verified user
  await registerModel.create({
    username: record.username,
    email,
    password: record.hashedPassword,
  });

  // 4️ Clear from memory
  otpStore.delete(email);

  // 5️ Redirect to login page
  req.flash("success", "Registration successful. You can now log in.");
  res.redirect("/login");
});



const sendForgetOtp = async (req, res) => {
  try {
    
    const { email } = req.body;
    const user = await registerModel.findOne({
      $or: [{ email }],
    });



    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore.set(email, otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Replace with your Gmail
        pass: process.env.GMAIL_APP,// App password
      },
    });

    const mailOptions = {
      from: '"SoundShare Support"',
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP to reset password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending forgot OTP:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};


const verifyForgetOtp = (req, res) => {
  const { email, otp } = req.body;

  console.log("Verifying OTP for email:", email, "with OTP:", otp);
  const storedOtp = otpStore.get(email);
  console.log("Stored OTP:", storedOtp);

  if (!storedOtp || storedOtp.toString() !== otp.toString()) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  otpStore.delete(email); // remove OTP
  verifiedEmails.add(email); // mark as verified
  return res.status(200).json({ success: true, message: 'OTP verified successfully' });
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  // Check if email is verified
  if (!verifiedEmails.has(email)) {
    return res.status(403).json({ success: false, message: 'OTP verification required' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await registerModel.findOneAndUpdate({ email }, { password: hashedPassword });

  verifiedEmails.delete(email); // cleanup after success

  return res.status(200).json({ success: true, message: 'Password updated successfully' });
};



//@desc Save audio
//@route POST /upload
//@access private
// Apply the `upload.single('audio')` middleware to handle the file upload



const tmp = require('tmp-promise');

const RecordUser = asyncHandler(async (req, res) => {
  try {
    console.log('Incoming form data:', req.body);
    console.log('File uploaded:', req.file);

    const { username, audioname } = req.body;

    if (!req.file || !username || !audioname) {
      return res.status(400).json({ error: 'Missing file or user data' });
    }

    const originalSize = req.file.buffer.length;
    

    let finalBuffer = req.file.buffer;

    if (originalSize > 1048576) { // >1MB
     

      const inputTmp = await tmp.file({ postfix: '.wav' });
      const outputTmp = await tmp.file({ postfix: '.mp3' });

      fs.writeFileSync(inputTmp.path, req.file.buffer);

      await new Promise((resolve, reject) => {
        ffmpeg(inputTmp.path)
          .audioBitrate(64) // Adjust as needed
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(outputTmp.path);
      });

      finalBuffer = fs.readFileSync(outputTmp.path);
      const compressedSize = finalBuffer.length;
      

      await inputTmp.cleanup();
      await outputTmp.cleanup();
    } else {
      
    }

    const uniqueId = Date.now();
    const supabaseFilePath = `recordings/${username}-${uniqueId}.${originalSize > 1048576 ? 'mp3' : 'wav'}`;

    const { data, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(supabaseFilePath, finalBuffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError.message);
      return res.status(500).json({ error: 'Failed to upload file to Supabase' });
    }

    const { data: publicData } = supabase.storage
      .from('recordings')
      .getPublicUrl(supabaseFilePath);

    const audiourl = publicData.publicUrl;

    const newAudio = new Audio({ username, audioname, audiourl });
    const savedAudio = await newAudio.save();

    

    res.status(200).json({
      success: true,
      message: 'File uploaded to Supabase and saved!',
      fileUrl: audiourl,
    });

  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ error: 'An error occurred while uploading the file' });
  }
});





//@desc Save audio local
//@route POST /upload-local
//@access private
const LocalUser = asyncHandler(async (req, res) => {
  try {
    console.log("Incoming form data:", req.body);
    console.log("File uploaded:", req.file);

    const audioname = req.file.originalname;

    // Upload audio buffer to Supabase Storage
    const { data, error } = await supabase.storage
      .from("recordings") // replace with your actual bucket name
      .upload(`local/${audioname}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true, // overwrite if file already exists
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Failed to upload to Supabase" });
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("recordings")
      .getPublicUrl(`local/${audioname}`);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: publicUrlData.publicUrl,
    });

  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ error: "An error occurred while uploading the file" });
  }
});


//@desc login a user
//@route POST /login
//@access public
const loginUser = passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:'/login',
    failureFlash: true 
});

//@desc home page
//@route GET /
//@access private
const homePage = asyncHandler( async(req, res) => {
    res.render("index.ejs",{name: req.user.username});
});

//@desc login page
//@route GET /login
//@access public
const loginPage = asyncHandler( async (req, res) => {
    res.render("login.ejs");
});

//@desc register page
//@route GET /register
//@access public
const registerPage = (req, res) => {
    res.render("register.ejs");
}

const otpPage = (req, res) => {
  res.render("verify-otp.ejs", { messages: req.flash() });
};

//@desc delete the session or logout
//@route DELETE /register
//@access private
const logout = (req,res) => { 
    req.logout(req.user, err => {
        if (err) return next(err);
        res.redirect("/");
    });
}

//@desc upload a image 
//@route POST /upload
//@access public



const UploadUser = asyncHandler(async (req, res) => {
    try {
        console.log('Incoming form data:', req.body);

        const tempId = new mongoose.Types.ObjectId(); 
        console.log(tempId);// Use for MongoDB _id
         const uniqueId = Date.now();
        const supabaseAudioFileName = `recordings/${uniqueId}`; // For Supabase audio
        const supabaseQRFileName = `qrs/${tempId}.jpg`; // For Supabase QR code

        // Upload audio file to Supabase
        const { data: audioData, error: audioError } = await supabase.storage
            .from('recordings')
            .upload(supabaseAudioFileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true,
            });

        if (audioError) {
            console.error("Audio upload failed:", audioError.message);
            return res.status(500).json({ error: 'Failed to upload audio file' });
        }

        // Generate signed URL for audio
        const { data: signedAudioUrlData } = await supabase.storage
            .from('recordings')
            .createSignedUrl(supabaseAudioFileName, 60 * 60 * 24 * 365 * 5); // 5 years

        const fileUrl = signedAudioUrlData?.signedUrl;

        // Generate QR Code
        const useUrl = `${process.env.NGROK_URL}/media/${tempId}`;
        const qrImageDataUrl = await generateQRCode(useUrl);

        // Convert base64 image to buffer
        const qrImageBuffer = Buffer.from(qrImageDataUrl.split(',')[1], 'base64');

        // Upload QR code to Supabase
        const { error: qrError } = await supabase.storage
            .from('recordings')
            .upload(supabaseQRFileName, qrImageBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (qrError) {
            console.error("QR code upload failed:", qrError.message);
            return res.status(500).json({ error: 'Failed to upload QR code' });
        }

        // Generate signed URL for QR
        const { data: signedQrUrlData } = await supabase.storage
            .from('recordings')
            .createSignedUrl(supabaseQRFileName, 60 * 60 * 24 * 365 * 5); // 5 years

        const qrlocUrl = signedQrUrlData?.signedUrl;

        // Save Media document after both uploads
        const newMedia = new Media({
            _id: tempId,
            filename: `${req.body.username}-${Date.now()}.${req.file.originalname.split('.').pop()}`,
            uploadedBy: req.body.uploadedBy,
            message: req.body.message,
            username: req.body.username,
            mood: req.body.mood,
            fileUrl,
            qrlocUrl,
            mimeType: req.file.mimetype,
        });

        const savedMedia = await newMedia.save();

        return res.status(200).json({
            message: 'File uploaded successfully!',
            fileUrl: savedMedia.fileUrl,
            qrCodeUrl: savedMedia.qrlocUrl,
            mediaId: savedMedia._id,
        });
    } catch (error) {
        console.error('Upload error:', error.message || error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});



//@desc mix audio based on mood, set mood volume to 20, and adjust length to match audioUrl
//@route POST /mix-audio
//@access private


const mixAudio = asyncHandler(async (req, res) => {
    const { audioUrl, mood } = req.body;  // Extract the audio URL and mood audio

    if (!audioUrl || !mood) {
        return res.status(400).json({ error: 'Audio URL and mood audio are required' });
    }

    console.log("Audio URL:", audioUrl);
    console.log("Mood Audio URL:", mood);

    try {
        // Fetch the audio file (audioUrl)
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
            throw new Error('Failed to fetch audio URL');
        }
        const audioBuffer = await audioResponse.buffer();

        // Fetch the mood audio (mood)
        const moodResponse = await fetch(mood);
        if (!moodResponse.ok) {
            throw new Error('Failed to fetch mood audio');
        }
        const moodBuffer = await moodResponse.buffer();

        // Set up audio mixer
        const audioMixer = new Mixer({
            channels: 2,          // Stereo
            bitDepth: 16,
            sampleRate: 44100,
            bufferSize: 1024
        });

        // Add audio tracks to mixer using the correct method
        const track1 = new Track({ buffer: audioBuffer, volume: 1.0 });
        const track2 = new Track({ buffer: moodBuffer, volume: 0.2 });

        audioMixer.addTrack(track1);
        audioMixer.addTrack(track2);

        // Pipe mixed audio to response
        const tempOutputPath = path.join(__dirname, 'temp_mixed_audio.mp3');
        audioMixer.pipe(fs.createWriteStream(tempOutputPath));

        audioMixer.on('end', () => {
            console.log('Audio mix complete');

            // Read the mixed audio file into a buffer
            fs.readFile(tempOutputPath, (err, mixedBuffer) => {
                if (err) {
                    console.error('Error reading mixed audio file:', err);
                    return res.status(500).json({ error: 'Error reading mixed audio file' });
                }

                // Clean up temporary file
                fs.unlinkSync(tempOutputPath);

                // Set headers to send the audio as a response
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Content-Disposition', 'attachment; filename=mixed_audio.mp3');
                
                // Send the mixed audio buffer directly in the response
                res.status(200).send(mixedBuffer);
            });
        });

        audioMixer.start();

    } catch (error) {
        console.error('Error mixing audio:', error);
        res.status(500).json({ error: 'Error mixing audio' });
    }
});



const mediapage = asyncHandler(async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).send('Media not found');

        const moodUrls = {
            A: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Main%20agar%20kahoon.mp3`,
            B: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Tera%20yaar%20hoon%20mai.mp3`,
            C: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Tere%20jaisa%20yaar%20kaha.mp3`,
            D: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Tu%20hai%20toh.mp3`,
            E: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Tu%20hi%20yaar%20mera.mp3`,
            F: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Old%20song%20mashup.mp3`,
            G: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/Thousand%20years.mp3`,
            H: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/tumse%20mil%20ke.mp3v`,
            DEFAULT: `https://wbblviqosrvinorxqnwk.supabase.co/storage/v1/object/public/recordings/zara%20zara.mp3`
        };

        const hiddenAudioUrl = moodUrls[media.mood] || moodUrls.DEFAULT;

        res.render('media.ejs', {
            media,
            hiddenAudioUrl
        });

    } catch (error) {
        console.error("Error fetching media:", error);
        res.status(500).send('Internal Server Error');
    }
});




//@desc display media 
//@route GET /medis/:id
//@access public






//@desc upload a image 
//@route GET /upload
//@access public
const UploadPage = (req, res) => {
    const name = req.user ? req.user.username : 'Guest';  
    console.log("User name:", name);
    res.render('upload.ejs', { name });  // Pass the name to upload.ejs
};

//@desc record audio 
//@route GET /upload
//@access public
const RecordPage = (req, res) => {
    const name = req.user ? req.user.username : 'Guest';  
    console.log("User name:", name);
    res.render('record.ejs', { name });  
};

//@desc create image
//@route GET /imaage
//@access public
const ImagePage = (req, res) => {
    const name = req.user ? req.user.username : 'Guest';  
    console.log("User name:", name);
    res.render('model.ejs', { name });  
};

const Generate = async (req, res) => {
    const text = req.body.text; // Assuming the text is sent as part of the request body

    if (!text) {
        return res.status(400).json({ error: 'Text input is required.' });
    }

    try {
        // Call the DeepAI API
        const response = await fetch('https://api.deepai.org/api/text2img', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': '6ef65cd6-451f-44b6-bd06-5ca2c16fbbc9'
            },
            body: JSON.stringify({ text : text })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ imageUrl: data.output_url });
        } else {
            return res.status(500).json({ error: data.error || 'Failed to generate image.' });
        }
    } catch (error) {
        console.error('Error generating image:', error);
        return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
}

//@desc previous uploaded data 
//@route GET /upload
//@access private
const NotesPage = async (req, res) => {
    const name = req.user ? req.user.username : 'Guest';  // Retrieve the username from the session, or default to 'Guest'
    console.log("User name:", name);

    try {
        // Fetch media entries from MongoDB where the uploadedBy field matches the username
        const mediaEntries = await Media.find({ username : name }).exec();

        // Render the page with media entries and the username
        res.render('uploadenote.ejs', { name, mediaEntries });
    } catch (error) {
        console.error('Error fetching media entries:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    registerUser,
    loginUser,
    homePage,
    registerPage,
    loginPage,
    logout,
    UploadPage,
    UploadUser,
    mediapage,
    NotesPage,
    RecordPage,
    RecordUser,
    FetchAudio,
    LocalUser,
    mixAudio,
    ImagePage,
    Generate,
    verifyOtp,
    otpPage,
    getMediaById,
    sendForgetOtp,
    verifyForgetOtp,
    resetPassword
};
