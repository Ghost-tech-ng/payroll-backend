const Organization = require('../models/Organization');

// @desc    Check storage limit before upload
// @access  Private
const checkStorageLimit = async (req, res, next) => {
    try {
        const organizationId = req.user.organization;
        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Default limit: 1GB (in bytes)
        const STORAGE_LIMIT = organization.storageLimit || 1024 * 1024 * 1024; // 1GB
        const currentUsage = organization.storageUsed || 0;

        // Check if current usage exceeds limit
        if (currentUsage >= STORAGE_LIMIT) {
            return res.status(403).json({
                message: 'Storage limit exceeded. Please upgrade your plan or delete some files.',
                currentUsage,
                limit: STORAGE_LIMIT
            });
        }

        // If 'content-length' header is available, check if adding this file would exceed limit
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > 0 && (currentUsage + contentLength) > STORAGE_LIMIT) {
            return res.status(403).json({
                message: 'Upload would exceed storage limit. Please free up space.',
                currentUsage,
                limit: STORAGE_LIMIT,
                uploadSize: contentLength
            });
        }

        next();
    } catch (error) {
        console.error('Storage check error:', error);
        res.status(500).json({ message: 'Server error checking storage limit' });
    }
};

// @desc    Check file size for specific uploads (e.g. Passport)
const checkFileSize = (maxSizeInBytes) => {
    return (req, res, next) => {
        if (!req.files && !req.file) {
            // No file uploaded, skip check (validation might handle this elsewhere if required)
            return next();
        }

        const file = req.file || (req.files ? Object.values(req.files)[0] : null); // Handle single or multer fields

        // Note: 'file' structure depends on upload middleware (multer vs express-fileupload)
        // Adjust based on actual upload implementation. 
        // Assuming payload might be base64 in body OR multer file. 
        // If checking base64 string length:
        if (req.body.passport) {
            // Approximation: Base64 string length * 0.75 = bytes
            const size = Math.ceil(req.body.passport.length * 0.75);
            if (size > maxSizeInBytes) {
                return res.status(400).json({
                    message: `File too large. Maximum size allowed is ${maxSizeInBytes / 1024}KB.`
                });
            }
        }

        // If using Multer (req.file)
        if (req.file && req.file.size > maxSizeInBytes) {
            return res.status(400).json({
                message: `File too large. Maximum size allowed is ${maxSizeInBytes / 1024}KB.`
            });
        }

        next();
    };
};

module.exports = { checkStorageLimit, checkFileSize };
