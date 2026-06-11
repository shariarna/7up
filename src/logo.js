/**
 * logo.js
 * Dynamically draws a high-resolution Bengali 7-Up label on a 2D canvas
 * to be used as a texture on the 3D bottle.
 */

export function createSevenUpTextureCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Fill with a vibrant green base gradient representing the Seven Up bottle label
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#007032');
  gradient.addColorStop(0.3, '#00a84c');
  gradient.addColorStop(0.7, '#00c356');
  gradient.addColorStop(1, '#007032');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw some yellow and green circular accents (lime/soda bubbles) on the label background
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 5 + Math.random() * 25;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(242, 226, 5, 0.25)' : 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw the yellow lime slice graphics on the right side of the label
  ctx.save();
  ctx.translate(canvas.width / 2 + 180, canvas.height / 2 + 50);
  ctx.rotate(0.2);
  ctx.fillStyle = '#ffd600';
  ctx.beginPath();
  // Drawing a stylized lime arc/slice
  ctx.arc(0, 0, 90, 0, Math.PI, true);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Draw segments
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  for (let angle = 0; angle <= Math.PI; angle += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * 85, -Math.sin(angle) * 85);
    ctx.stroke();
  }
  ctx.restore();

  // Draw the red "২৫০ মিলি" (250 ml) banner at the top
  const bannerWidth = 260;
  const bannerHeight = 65;
  const bannerX = canvas.width / 2 - bannerWidth / 2;
  const bannerY = 130;
  
  ctx.save();
  ctx.fillStyle = '#e60012'; // Red
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 12);
  ctx.fill();
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw banner text "২৫০ মিলি" in Bengali
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Kalpurush", "SolaimanLipi", "Vrinda", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('২৫০ মিলি', canvas.width / 2, bannerY + bannerHeight / 2);
  ctx.restore();

  // Draw small yellow sub-banner text: "এনার্জি ড্রিংক" or "লেমন-লাইম ফ্লেভার"
  ctx.save();
  ctx.fillStyle = '#ffd600';
  ctx.font = 'bold 24px "Kalpurush", "SolaimanLipi", "Vrinda", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('লেমন-লাইম ফ্লেভারড কার্বোনেটেড বেভারেজ', canvas.width / 2, 230);
  ctx.restore();

  // Draw the giant white "7"
  ctx.save();
  ctx.translate(canvas.width / 2 - 80, canvas.height / 2 + 50);
  ctx.skewX = -0.15; // Italicize slightly

  // Draw shadows/glow for "7"
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 10;

  // Let's draw the 7 path manually for a clean, stylized look
  ctx.beginPath();
  // Top bar of 7
  ctx.moveTo(-180, -220);
  ctx.lineTo(120, -220);
  // Slanted leg
  ctx.lineTo(-40, 260);
  ctx.lineTo(-150, 260);
  ctx.lineTo(0, -110);
  ctx.lineTo(-180, -110);
  ctx.closePath();

  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Draw a dark green border/stroke around 7
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#004a20';
  ctx.lineWidth = 14;
  ctx.stroke();

  ctx.restore();

  // Draw the red "আপ" circle
  ctx.save();
  // Position the circle overlapping the lower right part of the "7"
  const circleX = canvas.width / 2 + 90;
  const circleY = canvas.height / 2 + 90;
  const circleRadius = 110;

  // Red circle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#e60012'; // Vibrant red
  ctx.fill();

  // White stroke for the red circle
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Draw "আপ" (up) in Bengali script inside the red circle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px "Kalpurush", "SolaimanLipi", "Vrinda", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Custom shadow for "আপ" text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  ctx.fillText('আপ', circleX - 5, circleY - 5);
  ctx.restore();

  // Add the banter subtext at the bottom of the can label
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'italic bold 28px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EST. 2014 - HEAL THE 7-1 PAIN', canvas.width / 2, canvas.height - 120);
  ctx.fillStyle = '#ffd600';
  ctx.font = 'bold 26px "Kalpurush", "SolaimanLipi", "Vrinda", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('১০০% কান্নাকাটি করা সমর্থকদের দ্বারা অনুমোদিত', canvas.width / 2, canvas.height - 80);
  ctx.restore();

  return canvas;
}
