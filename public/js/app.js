document.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".card-q");
  if (card) {
    // Smooth animation using requestAnimationFrame
    let animationId;
    let startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const t = elapsed * 0.001; // time in seconds

      // Smooth oscillating values using sine waves
      const x = Math.sin(t * 0.5) * 20; // -20 to 20
      const y = Math.sin(t * 0.3) * 15; // -15 to 15
      const blur = 50 + Math.sin(t * 0.7) * 20 + 30; // 30 to 70
      const spread = Math.sin(t * 0.4) * 5; // -5 to 5

      // Smooth color transition
      const hue = (t * 30) % 360; // Cycle through hues
      const color = `hsla(${hue}, 70%, 50%, 0.5)`;

      card.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;

      animationId = requestAnimationFrame(animate);
    }

    // Start animating after a short delay
    setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 1000);

    // Optional: Stop animation on mouse enter/leave
    card.addEventListener('mouseenter', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    });

    card.addEventListener('mouseleave', () => {
      animationId = requestAnimationFrame(animate);
    });
  }
});
