const express = require('express');
const router = express.Router();
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');

// RP (Relying Party) Configuration
const rpName = 'Payroll Biometrics';
const rpID = 'localhost'; // Change this for production (e.g. 'payroll-app.com')
const origin = 'http://localhost:5173'; // Frontend URL

// In-memory challenge store (Use Redis/DB in production)
const challengeStore = new Map();

// --- REGISTRATION ---

// 1. Generate Registration Challenge
// 1. Generate Registration Challenge
// 1. Generate Registration Challenge
router.post('/register-challenge', async (req, res) => {
    try {
        const { employeeId } = req.body;
        console.log(`[Bio] Register Challenge for Employee: ${employeeId}`);

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            console.error(`[Bio] Employee not found: ${employeeId}`);
            return res.status(404).json({ error: 'Employee not found' });
        }

        // DEBUG: Force localhost and minimal options
        const effectiveRpID = 'localhost';

        console.log('[Bio] Generating options with:', { effectiveRpID, userID: employee._id });

        const options = await generateRegistrationOptions({
            rpName: 'Payroll Biometrics',
            rpID: effectiveRpID,
            // Convert User ID to Uint8Array (Buffer) as required by simplewebauthn
            userID: new Uint8Array(Buffer.from(employee._id.toString())),
            userName: employee.email,
            attestationType: 'none',
            // Simplify credentials exclusion to isolate potential error source
            excludeCredentials: [],
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                // Force Platform Authenticator (Windows Hello, Touch ID) 
                // This prevents the "QR Code / Phone" flow and uses the built-in device
                authenticatorAttachment: 'platform',
            },
        });

        // Save challenge
        challengeStore.set(employeeId, options.challenge);
        console.log('[Bio] Challenge generated successfully');

        res.json(options);
    } catch (error) {
        console.error('[Bio] CRITICAL Error generating challenge:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// 2. Verify Registration Response
router.post('/register-verify', async (req, res) => {
    try {
        const { employeeId, response } = req.body;
        const employee = await Employee.findById(employeeId);

        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const expectedChallenge = challengeStore.get(employeeId);
        if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired or not found' });

        // Dynamic Origin Check (Accepts 8080 or 5173)
        const clientOrigin = req.headers.origin;
        const effectiveRpID = req.hostname === '127.0.0.1' ? 'localhost' : req.hostname;

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: clientOrigin, // Trust the origin header for dev flexibility
            expectedRPID: effectiveRpID,
        });

        if (verification.verified && verification.registrationInfo) {
            console.log('[Bio] Verification Successful. Info Keys:', Object.keys(verification.registrationInfo));

            let { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
            const credentialObj = verification.registrationInfo.credential;

            // Fallback: Check inside 'credential' object if top-level variables are undefined
            if (credentialObj) {
                console.log('[Bio] Found nested credential object keys:', Object.keys(credentialObj));
                if (!credentialID && credentialObj.id) credentialID = credentialObj.id;
                if (!credentialPublicKey && credentialObj.publicKey) credentialPublicKey = credentialObj.publicKey;
                // Counter might be in registrationInfo or credentialObj
                if (counter === undefined && credentialObj.counter !== undefined) counter = credentialObj.counter;
            }

            // Debug logging validation
            const hasKey = !!credentialPublicKey;
            const hasID = !!credentialID;

            if (!hasKey || !hasID) {
                console.error('[Bio] Missing key or ID', {
                    hasKey,
                    hasID,
                    infoKeys: Object.keys(verification.registrationInfo || {}),
                    credKeys: credentialObj ? Object.keys(credentialObj) : 'N/A'
                });
                return res.status(500).json({
                    error: 'Missing biometric key data',
                    details: { hasKey, hasID, infoKeys: Object.keys(verification.registrationInfo || {}) }
                });
            }

            // Safer Buffer conversion
            const pubKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');
            const credIDBase64 = Buffer.from(credentialID).toString('base64url');

            employee.credentials.push({
                credentialID: credIDBase64,
                credentialPublicKey: pubKeyBase64,
                counter,
                transports: response.response.transports || [],
            });

            await employee.save();
            challengeStore.delete(employeeId); // Cleanup
            console.log('[Bio] Credential saved for:', employeeId);

            res.json({ verified: true });
        } else {
            console.warn('[Bio] Verification failed');
            res.status(400).json({ verified: false, error: 'Verification failed' });
        }
    } catch (error) {
        console.error('[Bio] Verification Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- AUTHENTICATION (CLOCK-IN) ---

// 3. Generate Authentication Challenge
router.post('/login-challenge', async (req, res) => {
    try {
        // For 1:1 match (user selects name first), we use that ID.
        // For 1:N (user scans finger first), we need Resident Keys (User Handle).
        const { employeeId } = req.body;

        // Allow passkey based login (no ID needed initially) but simpler to start with ID selection
        let allowCredentials = [];

        if (employeeId) {
            const employee = await Employee.findById(employeeId);
            if (employee && employee.credentials) {
                allowCredentials = employee.credentials.map(cred => ({
                    id: cred.credentialID,
                    type: 'public-key',
                    transports: cred.transports,
                }));
            }
            // Save challenge mapped to ID
        }

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials,
            userVerification: 'preferred',
        });

        // Store challenge globally (for 1:N) or keyed by ID. 
        // Simpler: Key by a session ID or just return it and expect client to send it back?
        // Best practice: Store server-side.
        // For simplicity here: we'll store against 'temp-login-' + employeeId if provided, or global if not?
        // Let's assume user selects name first for now (1:1 auth) as it's more robust without Resident Keys.
        if (employeeId) {
            challengeStore.set('login-' + employeeId, options.challenge);
        }

        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Verify Authentication Response
router.post('/login-verify', async (req, res) => {
    try {
        const { employeeId, response } = req.body;
        const employee = await Employee.findById(employeeId);

        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const expectedChallenge = challengeStore.get('login-' + employeeId);
        if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired or not found' });

        // Find the credential user used
        const cred = employee.credentials.find(c => c.credentialID === response.id);
        if (!cred) return res.status(400).json({ error: 'Credential not found' });

        // Dynamic Origin Check
        const clientOrigin = req.headers.origin;
        const effectiveRpID = req.hostname === '127.0.0.1' ? 'localhost' : req.hostname;

        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: clientOrigin,
            expectedRPID: effectiveRpID,
            authenticator: {
                credentialID: cred.credentialID,
                credentialPublicKey: Buffer.from(cred.credentialPublicKey, 'base64url'),
                counter: cred.counter,
            }
        });

        if (verification.verified) {
            const { authenticationInfo } = verification;

            // Update counter
            cred.counter = authenticationInfo.newCounter;
            await employee.save();

            challengeStore.delete('login-' + employeeId);

            res.json({ verified: true, employee });
        } else {
            res.status(400).json({ verified: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
