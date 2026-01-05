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
       const x = Math.sin(t * 0.2) * 10; // -10 to 10
       const y = Math.sin(t * 0.1) * 8; // -8 to 8
       const blur = 20 + Math.sin(t * 0.3) * 10; // 10 to 30
       const spread = Math.sin(t * 0.15) * 3; // -3 to 3

       // Smooth color transition
       const hue = (t * 10) % 360; // Cycle through hues
       const color = `hsla(${hue}, 30%, 60%, 0.3)`;

      card.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;

      animationId = requestAnimationFrame(animate);
    }

    // Start animating after a short delay
    setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 1000);
  }
});
