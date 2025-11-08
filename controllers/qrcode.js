const QRCode = require('qrcode');

/**
 * Generate a QR code manually using the 'qrcode' library.
 * @param {string} text - The content to encode (e.g., a URL or string).
 * @returns {Promise<string>} - Base64 image data URL.
 */
const generateQRCode = async (text) => {
  try {
    console.log('Generating QR Code for:', text);

    const qrOptions = {
      errorCorrectionLevel: 'H', // High correction
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',  // QR color
        light: '#FFFFFF'  // Background color
      }
    };

    const qrDataUrl = await QRCode.toDataURL(text, qrOptions);
    return qrDataUrl;

  } catch (error) {
    console.error('QR code generation failed:', error.message);
    throw new Error('QR code generation failed');
  }
};

module.exports = generateQRCode;
