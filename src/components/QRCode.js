import React from "react";
import QRCode from "qrcode.react";
import { QRCodeCanvas } from "qrcode.react";

export function QRCodeBox({ url }) {
  if (!url) return null;
  return (
    <div style={{ textAlign: "center", marginTop: 10 }}>
      <QRCodeCanvas value={url} size={120} />
    </div>
  );
}