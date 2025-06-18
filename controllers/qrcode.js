const axios = require('axios');

/**
 * Generate a custom QR code using the QRCode Monkey API.
 * @param {string} text - The content to encode (e.g., a URL).
 * @returns {Promise<string>} - Base64 image data URL.
 */
const generateQRCode = async (text) => {
    try {
        const apiUrl = 'https://api.qrcode-monkey.com//qr/custom';

        const payload = {
            data: text,
            size: 400,
            file: 'png',
            download: false,
            config: {
                body: 'circle',
                eye: 'frame14',
                eyeBall: 'ball16',
                bodyColor: '#FF33A1',
                bgColor: '#FFFFFF',
                eye1Color: '#33AFFF',
                eye2Color: '#33AFFF',
                eye3Color: '#33AFFF',
                eyeBall1Color: '#000000',
                eyeBall2Color: '#000000',
                eyeBall3Color: '#000000',
            }
        };

        console.log('QR Payload Data:', JSON.stringify(payload, null, 2));

        const response = await axios.post(apiUrl, payload, {
            responseType: 'arraybuffer',
        });

        const base64Image = Buffer.from(response.data).toString('base64');
        return `data:image/png;base64,${base64Image}`;

    } catch (error) {
        console.error('QR code generation failed:', error.message);
        throw new Error('QR code generation failed');
    }
};

module.exports = generateQRCode;
