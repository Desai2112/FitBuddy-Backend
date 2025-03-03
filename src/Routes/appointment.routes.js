import express from 'express';
import { 
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    cancelAppointment
} from '../Controllers/appointment.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.middleware.js';
import isDoctor from '../middleware/isDoctor.middleware.js';
// import isUser from '../middleware/isUser.middleware.js';

const router = express.Router();

// Routes accessible by both doctors and patients
router.route('/').post(isAuthenticated, createAppointment);
router.route('/my-appointments').get(isAuthenticated, getPatientAppointments);
router.route('/:appointmentId/cancel').post(isAuthenticated, cancelAppointment);

// Doctor-only routes
router.route('/doctor-schedule').get(isDoctor,getDoctorAppointments);
router.route('/:appointmentId/status').patch(isDoctor, updateAppointmentStatus);

export default router; 