import User from '../Models/User.js';
import validator from 'validator';
import OTP from '../Models/OTP.js';
import { sendOTPEmail } from '../utils/email.js';
import UserProfile from '../Models/UserProfile.js';

export const register = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        message: "Email and role are required",
        success: false
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email",
        success: false
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email }).exec();
    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
        success: false
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check for existing OTP
    const existingOTP = await OTP.findOne({ email }).exec();
    if (existingOTP) {
      existingOTP.otp = otp;
      existingOTP.expiresAt = otpExpires;
      await existingOTP.save();
    } else {
      const newOTP = new OTP({
        email,
        otp,
        expiresAt: otpExpires
      });
      await newOTP.save();
    }

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      message: "OTP sent to your email",
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const {
      email,
      otp,
      password,
      name,
      role
    } = req.body;

    console.log(req.body)

    // Validate required fields
    if (!email || !otp || !password || !name || !role) {
      return res.status(400).json({
        message: "All fields are required",
        success: false
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email",
        success: false
      });
    }

    // Verify OTP
    const otpData = await OTP.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() }
    }).exec();

    if (!otpData) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        success: false
      });
    }

    // Validate password and name
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password should be at least 8 characters long",
        success: false
      });
    }

    if (name.length < 3) {
      return res.status(400).json({
        message: "Name should be at least 3 characters long",
        success: false
      });
    }

    // Create new user with all fields
    const user = await User.create({
      email: email.toLowerCase(),
      password: password,
      name: name,
      role: role,
      status: 'active',
    });

    // Delete OTP after successful verification
    await OTP.deleteOne({ email }).exec();

    // Start session
    req.session.userId = user._id;

    res.status(200).json({
      message: "User registered successfully",
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      },
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Start session and store user data
    req.session.userId = user._id;

    res.json({
      message: 'Login successful',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        profileCompleted:user.isProfileCompleted
      },
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error in login',
      error: error.message,
      success: false
    });
  }
};

export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.json({
        message: 'Logged out successfully',
        success: true
      });
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error in logout',
      error: error.message,
      success: false
    });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select("-password").exec();
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    return res.json({
      message: "Profile retrieved successfully",
      data: user,
      success: true
    });
  }
  catch (error) {
    res.status(500).json({
      message: "Error fetching profile",
      error: error.message,
      success: false
    });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' });
    return res.status(200).json({
      doctors: doctors,
      success: true
    })
  } catch (error) {
    // Handle error
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
};
