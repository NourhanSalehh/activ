const Analysis = require('../models/Analysis.js');
const aiService = require('../services/aiService.js'); 
const fileParser = require('../utils/fileParser.js');
const Booking = require('../models/Booking.js');

exports.analyzeFile = async (req, res) => {
    try {
        // Enforce approved booking requirement (unless admin)
        if (req.user && req.user.role !== 'admin') {
            const hasBooking = await Booking.findOne({ user: req.user.id, status: 'approved' });
            if (!hasBooking) {
                return res.status(403).json({ 
                    success: false, 
                    error: "يجب أن تكون مشتركاً في أحد التمارين (ولديك حجز مؤكد) لاستخدام ميزة الذكاء الاصطناعي." 
                });
            }
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: "من فضلك قم برفع ملف." });
        }

        const text = await fileParser.extractTextFromWord(req.file.buffer);

        console.log("تم استخراج النص، جاري الإرسال للذكاء الاصطناعي...");
        const aiAnalysisResult = await aiService.analyzeStudentData(text);
        const newAnalysis = new Analysis({
            fileName: req.file.originalname,
            rawExtractedText: text,     
            aiAnalysis: aiAnalysisResult,
            status: 'completed'
        });

        const savedData = await newAnalysis.save();

        res.status(200).json({
            success: true,
            message: "تم تحليل الملف بنجاح",
            id: savedData._id,
            data: savedData.aiAnalysis
        });

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
