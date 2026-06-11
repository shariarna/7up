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

  // Deep rich forest-green matching the real 7up can in the reference photo
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0,    '#0c4a1a'); // very dark edge
  gradient.addColorStop(0.22, '#166828'); // dark mid
  gradient.addColorStop(0.5,  '#1e8530'); // centre — deepest vivid green, not lime
  gradient.addColorStop(0.78, '#166828');
  gradient.addColorStop(1,    '#0c4a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle cylindrical gloss highlight — narrower and softer than before
  const shineGrad = ctx.createLinearGradient(canvas.width * 0.32, 0, canvas.width * 0.66, 0);
  shineGrad.addColorStop(0,    'rgba(255,255,255,0)');
  shineGrad.addColorStop(0.42, 'rgba(255,255,255,0.13)');
  shineGrad.addColorStop(0.58, 'rgba(255,255,255,0.13)');
  shineGrad.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
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

  // Draw the giant white "7" — positioned to fill the left half of label
  ctx.save();
  ctx.translate(canvas.width / 2 - 55, canvas.height / 2 + 60);

  // Draw shadows/glow for "7"
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 8;

  // Large bold "7" path
  ctx.beginPath();
  // Top bar of 7
  ctx.moveTo(-200, -260);
  ctx.lineTo(130, -260);
  // Slanted leg
  ctx.lineTo(-35, 290);
  ctx.lineTo(-155, 290);
  ctx.lineTo(10, -130);
  ctx.lineTo(-200, -130);
  ctx.closePath();

  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Dark green outline around "7"
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#0a3d18';
  ctx.lineWidth = 16;
  ctx.stroke();

  ctx.restore();

  // Draw the red "আপ" circle — overlapping the lower right of the "7"
  ctx.save();
  const circleX = canvas.width / 2 + 105;
  const circleY = canvas.height / 2 + 80;
  const circleRadius = 125;

  // Red circle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 6;

  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#e60012';
  ctx.fill();

  // White stroke
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.stroke();

  // "আপ" text inside the red circle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px "Kalpurush", "SolaimanLipi", "Vrinda", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.fillText('আপ', circleX - 4, circleY - 4);
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
