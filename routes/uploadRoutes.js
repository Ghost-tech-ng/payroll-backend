const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const { protect } = require('../middleware/authMiddleware');
const { checkStorageLimit } = require('../middleware/storageMiddleware');

// Simple base64 logo upload (no Cloudinary needed)
// Apply storage limit check
router.post('/logo-base64', protect, checkStorageLimit, async (req, res) => {
    try {
        console.log('=== Base64 Logo Upload Request ===');
        console.log('User:', req.user ? req.user._id : 'No user');

        const { imageData } = req.body;

        if (!imageData) {
            console.log('ERROR: No image data in request');
            return res.status(400).json({ message: 'No image data provided' });
        }

        // Validate base64 image
        if (!imageData.startsWith('data:image/')) {
            return res.status(400).json({ message: 'Invalid image format' });
        }

        // Start 100KB Limit Check for Logo (Optional but good practice if consistent)
        // Base64 length * 0.75 gives approx size in bytes
        const sizeInBytes = Math.ceil(imageData.length * 0.75);
        if (sizeInBytes > 1024 * 1024) { // Let's allow 1MB for Logo, strict 100KB is for Passport
            return res.status(400).json({ message: 'Logo too large. Max 1MB allowed.' });
        }

        console.log('Image data received, length:', imageData.length);

        // Update organization logo and storage used
        const organization = await Organization.findById(req.user.organization);

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Subtract old logo size if replacing (simplified: just add new for now, or track better)
        // Ideally we should track "current storage" strictly. 
        // For accurate tracking, we assume simple accumulation for now, or we'd need to know old file size.
        // Let's just add to used.
        organization.logo = imageData;
        organization.storageUsed = (organization.storageUsed || 0) + sizeInBytes;

        await organization.save();

        console.log('Logo saved successfully to organization');
        res.json({ logoUrl: imageData, message: 'Logo uploaded successfully' });
    } catch (error) {
        console.error('=== Base64 Logo Upload Error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error during upload', error: error.message });
    }
});

// Keep the Cloudinary route for when it's configured
let parser;
try {
    const cloudinaryConfig = require('../config/cloudinary');
    parser = cloudinaryConfig.parser;

    // Apply storage check BEFORE multer processing if possible, or handle error after
    router.post('/logo', protect, checkStorageLimit, parser.single('logo'), async (req, res) => {
        try {
            console.log('=== Cloudinary Logo Upload Request ===');
            console.log('File received:', req.file ? 'Yes' : 'No');
            console.log('User:', req.user ? req.user._id : 'No user');

            if (!req.file) {
                console.log('ERROR: No file in request');
                return res.status(400).json({ message: 'No file uploaded' });
            }

            console.log('File details:', {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size
            });

            const logoUrl = req.file.path;
            const fileSize = req.file.size;

            // Update storage used
            await Organization.findByIdAndUpdate(req.user.organization, {
                $inc: { storageUsed: fileSize }
            });

            console.log('Logo uploaded successfully to Cloudinary:', logoUrl);
            res.json({ logoUrl });
        } catch (error) {
            console.error('=== Cloudinary Logo Upload Error ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            res.status(500).json({ message: 'Server error during upload', error: error.message });
        }
    });
} catch (error) {
    console.log('Cloudinary not configured, using base64 upload only');
}

module.exports = router;
