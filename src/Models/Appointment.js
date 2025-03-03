import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
        default: 'scheduled'
    },
    type: {
        type: String,
        enum: ['first-visit', 'follow-up', 'consultation', 'emergency'],
        required: true
    },
    mode: {
        type: String,
        enum: ['in-person', 'video', 'phone'],
        required: true
    },
    symptoms: [{
        type: String
    }],
    reasonForVisit: {
        type: String,
        required: true
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    notes: {
        patientNotes: String,
        doctorNotes: String
    },
    cancelledBy: {
        type: String,
        enum: ['patient', 'doctor']
    },
    cancellationReason: String,
    rescheduledFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    reminders: [{
        type: {
            type: String,
            enum: ['email', 'sms', 'whatsapp']
        },
        sentAt: Date,
        status: {
            type: String,
            enum: ['sent', 'failed', 'pending']
        }
    }]
}, {
    timestamps: true
});

// Index for efficient querying
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

// Validate that appointment date is not in the past
appointmentSchema.pre('save', function(next) {
    if (this.appointmentDate < new Date()) {
        next(new Error('Appointment date cannot be in the past'));
    }
    next();
});

// Validate that the same doctor doesn't have overlapping appointments
appointmentSchema.pre('save', async function(next) {
    if (this.isModified('appointmentDate') || this.isModified('timeSlot')) {
        const overlapping = await this.constructor.findOne({
            doctorId: this.doctorId,
            appointmentDate: this.appointmentDate,
            'timeSlot.startTime': this.timeSlot.startTime,
            'timeSlot.endTime': this.timeSlot.endTime,
            status: { $nin: ['cancelled', 'completed'] },
            _id: { $ne: this._id }
        });

        if (overlapping) {
            next(new Error('This time slot is already booked'));
        }
    }
    next();
});

export default mongoose.model('Appointment', appointmentSchema);