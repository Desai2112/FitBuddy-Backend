import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    contactInfo: {
        mobile: {
            type: String,
            required: true
        },
        alternatePhone: String,
        whatsapp: String
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    healthInfo: {
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: true
        },
        height: {
            type: Number, // in cm
            required: true
        },
        weight: {
            type: Number, // in kg
            required: true
        },
        bmi: Number,
        medicalConditions: [String],
        allergies: [String],
        currentMedications: [String],
        pastSurgeries: [{
            name: String,
            date: Date,
            hospital: String
        }]
    },
    emergencyContact: {
        primaryContact: {
            name: {
                type: String,
                required: true
            },
            relationship: String,
            phone: {
                type: String,
                required: true
            },
            address: String
        },
        secondaryContact: {
            name: String,
            relationship: String,
            phone: String,
            address: String
        }
    },
    documentList: [{
        name: String,
        url: String,
        expiresAt: Date,
        isVisible: {
            type: Boolean,
            default: true
        }
    }],
    insurance: {
        provider: String,
        policyNumber: String,
        validUntil: Date
    }
}, { timestamps: true });

// Calculate BMI before saving
userProfileSchema.pre('save', function (next) {
    if (this.healthInfo.height && this.healthInfo.weight) {
        const heightInMeters = this.healthInfo.height / 100;
        this.healthInfo.bmi = (this.healthInfo.weight / (heightInMeters * heightInMeters)).toFixed(2);
    }
    next();
});

export default mongoose.model('UserProfile', userProfileSchema); 