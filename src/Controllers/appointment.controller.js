import Appointment from '../Models/Appointment.js';
import User from '../Models/User.js';
import { sendEmail } from '../utils/email.js';

export const createAppointment = async (req, res) => {
    try {
        const {
            doctorId,
            appointmentDate,
            timeSlot,
            type,
            mode,
            symptoms,
            reasonForVisit
        } = req.body;

        // Validate required fields
        if (!doctorId || !appointmentDate || !timeSlot || !type || !mode || !reasonForVisit) {
            return res.status(400).json({
                message: "All required fields must be provided",
                success: false
            });
        }

        const patientId = req.session.userId;

        // Validate doctor exists
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false
            });
        }

        const appointment = new Appointment({
            patientId,
            doctorId,
            appointmentDate,
            timeSlot,
            type,
            mode,
            symptoms,
            reasonForVisit
        });

        await appointment.save();

        // Send confirmation emails
        await sendAppointmentNotifications(appointment, 'created');

        res.status(201).json({
            message: "Appointment booked successfully",
            data: appointment,
            success: true
        });
    } catch (error) {
        if (error.message === 'Appointment date cannot be in the past' ||
            error.message === 'This time slot is already booked') {
            return res.status(400).json({
                message: error.message,
                success: false
            });
        }
        res.status(500).json({
            message: "Error booking appointment",
            error: error.message,
            success: false
        });
    }
};

export const getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.session.userId })
            .populate('doctorId', 'name email')
            .sort({ appointmentDate: -1 });

        res.status(200).json({
            message: "Appointments retrieved successfully",
            data: appointments,
            count: appointments.length,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching appointments",
            error: error.message,
            success: false
        });
    }
};

export const getDoctorAppointments = async (req, res) => {
    try {
        let query = { doctorId: req.session.userId };

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email');
            
        res.status(200).json({
            message: "Doctor appointments retrieved successfully",
            data: appointments,
            count: appointments.length,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching doctor appointments",
            error: error.message,
            success: false
        });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, doctorNotes } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                success: false
            });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
                success: false
            });
        }

        if (appointment.doctorId.toString() !== req.session.userId) {
            return res.status(403).json({
                message: "Not authorized to update this appointment",
                success: false
            });
        }

        appointment.status = status;
        if (doctorNotes) {
            appointment.notes.doctorNotes = doctorNotes;
        }

        await appointment.save();
        await sendAppointmentNotifications(appointment, 'updated');

        res.status(200).json({
            message: "Appointment updated successfully",
            data: appointment,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating appointment",
            error: error.message,
            success: false
        });
    }
};

export const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { cancellationReason } = req.body;

        if (!cancellationReason) {
            return res.status(400).json({
                message: "Cancellation reason is required",
                success: false
            });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
                success: false
            });
        }

        if (['cancelled', 'completed'].includes(appointment.status)) {
            return res.status(400).json({
                message: `Cannot cancel appointment that is already ${appointment.status}`,
                success: false
            });
        }

        const userRole = req.user.role;
        const cancelledBy = userRole === 'doctor' ? 'doctor' : 'patient';

        appointment.status = 'cancelled';
        appointment.cancelledBy = cancelledBy;
        appointment.cancellationReason = cancellationReason;

        await appointment.save();
        await sendAppointmentNotifications(appointment, 'cancelled');

        res.status(200).json({
            message: "Appointment cancelled successfully",
            data: appointment,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error cancelling appointment",
            error: error.message,
            success: false
        });
    }
};

// Helper function for sending notifications
const sendAppointmentNotifications = async (appointment, action) => {
    try {
        const [patient, doctor] = await Promise.all([
            User.findById(appointment.patientId),
            User.findById(appointment.doctorId)
        ]);

        let subject, template;
        switch (action) {
            case 'created':
                subject = 'Appointment Confirmation';
                template = 'appointmentConfirmation';
                break;
            case 'updated':
                subject = 'Appointment Update';
                template = 'appointmentUpdate';
                break;
            case 'cancelled':
                subject = 'Appointment Cancellation';
                template = 'appointmentCancellation';
                break;
            default:
                return;
        }

        // Send notifications to both parties
        await Promise.all([
            sendEmail({
                email: patient.email,
                subject,
                template,
                data: {
                    name: patient.name,
                    doctorName: doctor.name,
                    date: appointment.appointmentDate,
                    time: `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`,
                    mode: appointment.mode,
                    status: appointment.status
                }
            }),
            sendEmail({
                email: doctor.email,
                subject,
                template,
                data: {
                    name: doctor.name,
                    patientName: patient.name,
                    date: appointment.appointmentDate,
                    time: `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`,
                    mode: appointment.mode,
                    status: appointment.status
                }
            })
        ]);
    } catch (error) {
        console.error('Error sending appointment notifications:', error);
    }
}; 