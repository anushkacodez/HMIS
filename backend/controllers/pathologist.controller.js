import Consultation from "../models/consultation.js";
import Test from "../models/test.js";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const pathologistController = {
  /**
   * @desc Get consultation by patient ID
   * @route GET /api/pathologist/consultations/:patientId
   */
  getConsultationByPatientId: async (req, res) => {
    try {
      const { patientId } = req.params;
      //currently using the id generated by mongodb,should change this after updating the schema
      //also not sure about the working of (uploading the file part).-> check!!!
      const consultation = await Consultation.findOne({ patient_id: patientId });

      if (!consultation) {
        return res.status(404).json({ message: "No active consultation found for this patient." });
      }

      return res.status(200).json({ message: "Patient found", consultation });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  /**
   * @desc Upload a medical test report
   * @route POST /api/pathologist/reports
   */
  uploadReport: async (req, res) => {
    try {
      upload.single("reportFile")(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: "File upload error", error: err.message });
        }

        const { consultationId, testName, reportText, status } = req.body;

        // Validate Consultation
        const consultation = await Consultation.findById(consultationId);
        if (!consultation) {
          return res.status(404).json({ message: "Consultation not found" });
        }

        // Validate Test by Name
        const test = await Test.findOne({ title: testName });
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No report file uploaded" });
        }

        // Construct report object
        const reportData = {
          status: status || "completed",
          reportText: reportText || test.title,
          fileUrl: `/uploads/${req.file.filename}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save inside consultation's reports
        consultation.reports.push(reportData);
        await consultation.save();

        return res.status(201).json({ message: "Report added successfully", report: reportData });
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

export default pathologistController;
