import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    qualifications: [{
        degree: String,
        institution: String,
        year: Number
    }],
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    experience: {
        type: Number, // years of experience
        required: true
    },
    clinic: {
        name: String,
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
        },
        phone: String
    },
    consultationFee: {
        type: Number,
        required: true
    },
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        slots: [{
            startTime: String,
            endTime: String
        }]
    }]
}, { timestamps: true });

export default mongoose.model('DoctorProfile', doctorProfileSchema); 