// app.js - Client-side logic for theme, language, and data management

// Question card animation (if present)
if (document.querySelector('.card')) {
  const card = document.querySelector('.card');
  const colors = ['rgba(255,0,0,0.5)', 'rgba(255,165,0,0.5)', 'rgba(255,255,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(75,0,130,0.5)', 'rgba(238,130,238,0.5)'];
  card.style.boxShadow = '0px 10px 60px 0px rgba(238,130,238,0.5)';
  function animate() {
    const time = Date.now() * 0.001;
    const x = Math.random() * 100 - 50;
    const y = Math.random() * 40 - 10;
    const blur = 60 + Math.random() * 40;
    const spread = Math.random() * 10 - 5;
    const colorIndex = Math.floor(time * 0.1) % colors.length;
    const color = colors[colorIndex];
    card.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    const delay = Math.random() * 3000 + 1000;
    setTimeout(animate, delay);
  }
  setTimeout(animate, 1000);
}