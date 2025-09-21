import UserProfile from "../Models/UserProfile.js";
import { uploadToS3 } from "../Utils/s3Service.js";
import User from "../Models/User.js";
import fs from "fs";

export const createProfile = async (req, res) => {
    try {
        const existingUSer = await UserProfile.find({ userId: req.session.userId });
        if (existingUSer.length > 0) {
            return res.status(400).json({ message: 'User already have profile' });
        }
        console.log("Request files:", req.files);

        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "No files provided." });
        }

        const uploadedFiles = [];
        for (const file of files) {
            const pdfLocalPath = file.path;

            console.log("Processing file at path:", pdfLocalPath);

            if (!fs.existsSync(pdfLocalPath)) {
                console.warn(`File does not exist: ${pdfLocalPath}`);
                continue; // Skip this file
            }

            try {
                const fileUrl = await uploadToS3(pdfLocalPath);
                console.log("File successfully uploaded to S3:", fileUrl);
                uploadedFiles.push({
                    name: file.originalname,
                    url: fileUrl,
                    expiresAt: null, // Default expiration, if required
                    visibleBlocked: false // Default visibility, if required
                });
            } catch (error) {
                console.error("Error uploading file to S3:", error);
            }
        }

        // Extract profile details from the request body
        const { dateOfBirth, gender, contactInfo, address, healthInfo, emergencyContact, insurance } = req.body;

        // Create a new profile document
        const userProfile = new UserProfile({
            userId: req.session.userId,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            contactInfo,
            address,
            healthInfo,
            emergencyContact: {
                ...emergencyContact,
            },
            documentList: uploadedFiles, // Add the uploaded files to the documentList
            insurance
        });

        // Save the profile in the database
        const savedProfile = await userProfile.save();

        return res.status(201).json({
            success: true,
            message: "Profile created successfully.",
            profile: savedProfile
        });
    } catch (error) {
        console.error("Error creating user profile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const updateProfile = async (req, res) => {
    try {
        const existingUser = await UserProfile.findOne({ userId });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        console.log("Request files:", req.files);

        const files = req.files || [];
        const uploadedFiles = [];

        for (const file of files) {
            const pdfLocalPath = file.path;

            console.log("Processing file at path:", pdfLocalPath);

            if (!fs.existsSync(pdfLocalPath)) {
                console.warn(`File does not exist: ${pdfLocalPath}`);
                continue; // Skip this file
            }

            try {
                const fileUrl = await uploadToS3(pdfLocalPath);
                console.log("File successfully uploaded to S3:", fileUrl);
                uploadedFiles.push({
                    name: file.originalname,
                    url: fileUrl,
                    expiresAt: null, // Default expiration, if required
                    visibleBlocked: false // Default visibility, if required
                });
            } catch (error) {
                console.error("Error uploading file to S3:", error);
            }
        }

        // Extract fields to update from the request body
        const { dateOfBirth, gender, contactInfo, address, healthInfo, emergencyContact, insurance } = req.body;

        // Update the profile fields
        if (dateOfBirth) existingUser.dateOfBirth = new Date(dateOfBirth);
        if (gender) existingUser.gender = gender;
        if (contactInfo) existingUser.contactInfo = contactInfo;
        if (address) existingUser.address = address;
        if (healthInfo) existingUser.healthInfo = healthInfo;
        if (emergencyContact) {
            existingUser.emergencyContact = {
                ...existingUser.emergencyContact,
                ...emergencyContact,
                documentList: [...existingUser.emergencyContact.documentList, ...uploadedFiles]
            };
        }
        if (insurance) existingUser.insurance = insurance;

        // Save the updated profile
        const updatedProfile = await existingUser.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            profile: updatedProfile
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleVisibility = async (req, res) => {
    try {
        const { docId } = req.body;

        // Find the user profile based on the session user ID
        const existingUser = await UserProfile.findOne({ userId: req.session.userId });

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        // Find the document in the documentList array
        const document = existingUser.documentList.find(doc => doc._id.toString() === docId);

        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found." });
        }

        // Update the visibility status of the document
        if (document.isVisible) {
            document.isVisible = false;
        }
        else {
            document.isVisible = true;
        }
        // Save the updated profile
        await existingUser.save()
        return res.status(200).json({
            success: true,
            message: "Document visibility stopped successfully."
        });
    } catch (error) {
        console.error("Error stopping document visibility:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        console.log(req.session.userId);

        const userData = await User.findById(req.session.userId);

        // Find the user profile based on the session user ID
        const user = await UserProfile.findOne({ userId: req.session.userId });

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        // Filter out documents where isVisible is false
        const filteredProfile = {
            ...user.toObject(),
        };

        res.json({
            message: "Profile retrieved successfully",
            data: filteredProfile,
            userData: userData,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching profile",
            error: error.message,
            success: false
        });
    }
};

export const getUserHistory = async (req, res) => {
    try {

        const { userId } = req.params;

        const userData = await User.findById(userId);
        // Find the user profile based on the session user ID
        const user = await UserProfile.findOne({ userId: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        console.log(user);
        
        // Filter out documents where isVisible is false
        const filteredProfile = {
            ...user.toObject(),
            documentList: user.documentList.filter(doc=>doc.isVisible!=false)
        };

        res.json({
            message: "Profile retrieved successfully",
            data: filteredProfile,
            userData: userData,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching profile",
            error: error.message,
            success: false
        });
    }
};

export const uploadDocument = async (req, res) => {
    console.log("Uploaded fields:", req.body); // Log the fields
    console.log("Uploaded files:", req.files); // Log the files
    try {
        const existingUser = await User.findById(req.session.userId);
        if (!existingUser) {
            return res.status(200).json({
                message: "Login again.",
                success: false,
            });
        }

        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "No files provided." });
        }

        const uploadedFiles = []; // Initialize an array to hold uploaded file details

        for (const file of files) {
            const pdfLocalPath = file.path;

            console.log("Processing file at path:", pdfLocalPath);

            if (!fs.existsSync(pdfLocalPath)) {
                console.warn(`File does not exist: ${pdfLocalPath}`);
                continue; // Skip this file
            }

            try {
                const fileUrl = await uploadToS3(pdfLocalPath);
                console.log("File successfully uploaded to S3:", fileUrl);
                uploadedFiles.push({
                    name: file.originalname,
                    url: fileUrl,
                    expiresAt: null, // Default expiration, if required
                    visibleBlocked: false // Default visibility, if required
                });
            } catch (error) {
                console.error("Error uploading file to S3:", error);
            }
        }

        // Update the user's profile with the uploaded documents
        const userProfile = await UserProfile.findOne({ userId: req.session.userId });
        if (userProfile) {
            userProfile.documentList.push(...uploadedFiles); // Add uploaded files to the documentList
            await userProfile.save(); // Save the updated profile
        }

        return res.status(200).json({
            success: true,
            message: "Documents uploaded successfully.",
            uploadedFiles
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};

export const deleteFile = async (req, res) => {
    try {
        const { docId } = req.body;

        // Find the user profile based on the session user ID
        const userProfile = await UserProfile.findOne({ userId: req.session.userId });

        if (!userProfile) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        // Find the index of the document to be deleted
        const documentIndex = userProfile.documentList.findIndex(doc => doc._id.toString() === docId);

        if (documentIndex === -1) {
            return res.status(404).json({ success: false, message: "Document not found." });
        }

        // Remove the document from the documentList
        userProfile.documentList.splice(documentIndex, 1);

        // Save the updated profile
        await userProfile.save();

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};