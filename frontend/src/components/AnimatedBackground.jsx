import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const shapes = [];
    const shapeCount = 15;
    const colors = [
      "rgba(209, 107, 96, 0.15)",  // terracotta
      "rgba(112, 151, 199, 0.15)", // slate blue
      "rgba(59, 154, 156, 0.15)",  // teal
      "rgba(223, 177, 91, 0.15)",  // sand yellow
      "rgba(0, 0, 0, 0.08)",       // black/gray outline
    ];

    const types = ["circle", "square", "plus"];

    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 20 + 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;

        // Bounce borders
        if (s.x - s.size < 0 || s.x + s.size > canvas.width) s.vx *= -1;
        if (s.y - s.size < 0 || s.y + s.size > canvas.height) s.vy *= -1;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.5;

        if (s.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (s.type === "square") {
          ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
        } else if (s.type === "plus") {
          ctx.beginPath();
          ctx.moveTo(-s.size / 2, 0);
          ctx.lineTo(s.size / 2, 0);
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(0, s.size / 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] bg-cyber-grid"
    />
  );
}
