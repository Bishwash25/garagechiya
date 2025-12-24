import React from 'react';

interface QRCodeProps {
  url: string;
}

const QRCode: React.FC<QRCodeProps> = ({ url }) => {
  // Generate QR code using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  
  return (
    <div className="bg-card p-4 rounded-2xl shadow-lg animate-pulse-glow">
      <img
        src={qrCodeUrl}
        alt="Scan to order"
        className="w-48 h-48 md:w-56 md:h-56 rounded-lg"
      />
      <p className="text-center mt-3 text-sm font-medium text-muted-foreground">
        Scan to Order
      </p>
    </div>
  );
};

export default QRCode;
