"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

export default function PasteVoucher({
  voucherCount,
  onParse,
  onResetAll,
  onViewVouchers,
}) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = gameRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame;
    let lastTime = performance.now();
    let score = 0;
    let spawnTimer = 0;
    let groundOffset = 0;
    let running = true;

    const dino = {
      x: 44,
      y: 0,
      width: 34,
      height: 38,
      velocityY: 0,
      jumping: false,
    };

    const obstacles = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dino.y = rect.height - dino.height - 20;
    };

    const jump = () => {
      if (!dino.jumping) {
        dino.velocityY = -520;
        dino.jumping = true;
      }
    };

    const handleKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase();

      // Don't hijack typing inside the voucher textarea.
      if (tag === "textarea" || tag === "input") return;

      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
      }
    };

    const drawDino = (x, y) => {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));

      ctx.fillStyle = "#111";

      // Head
      ctx.fillRect(12, 0, 16, 5);
      ctx.fillRect(7, 5, 23, 7);

      // Body
      ctx.fillRect(4, 12, 29, 14);
      ctx.fillRect(9, 26, 20, 7);

      // Tail
      ctx.fillRect(0, 17, 8, 6);
      ctx.fillRect(26, 18, 9, 5);

      // Legs
      const frame = Math.floor(score / 4) % 2;

      if (dino.jumping) {
        ctx.fillRect(10, 32, 6, 6);
        ctx.fillRect(24, 31, 6, 5);
      } else if (frame === 0) {
        ctx.fillRect(10, 32, 5, 7);
        ctx.fillRect(24, 33, 5, 6);
      } else {
        ctx.fillRect(12, 33, 5, 6);
        ctx.fillRect(22, 31, 5, 7);
      }

      // Eye
      ctx.fillStyle = "#fff06a";
      ctx.fillRect(24, 6, 3, 3);

      ctx.restore();
    };

    const drawCactus = (obstacle) => {
      ctx.save();
      ctx.translate(Math.round(obstacle.x), Math.round(obstacle.y));

      ctx.fillStyle = "#111";

      ctx.fillRect(8, 0, 8, 32);
      ctx.fillRect(2, 8, 7, 7);
      ctx.fillRect(0, 10, 7, 4);
      ctx.fillRect(15, 12, 7, 7);
      ctx.fillRect(18, 9, 4, 7);

      ctx.restore();
    };

    const reset = (height) => {
      obstacles.length = 0;
      score = 0;
      spawnTimer = 0;
      dino.velocityY = 0;
      dino.jumping = false;
      dino.y = height - dino.height - 20;
    };

    const loop = (now) => {
      if (!running) return;

      const dt = Math.min((now - lastTime) / 1000, 0.035);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.clearRect(0, 0, width, height);

      // Keep it subtle — it's an easter egg behind the typography.
      ctx.globalAlpha = 0.16;

      const groundY = height - 20;

      // Ground line
      ctx.fillStyle = "#111";
      ctx.fillRect(0, groundY, width, 2);

      // Little moving ground marks
      groundOffset = (groundOffset + 120 * dt) % 32;

      for (let x = -32 + groundOffset; x < width; x += 32) {
        ctx.fillRect(x, groundY + 7, 14, 1);
      }

      // Dino physics
      dino.velocityY += 1450 * dt;
      dino.y += dino.velocityY * dt;

      const floorY = groundY - dino.height;

      if (dino.y >= floorY) {
        dino.y = floorY;
        dino.velocityY = 0;
        dino.jumping = false;
      }

      // Spawn cactus
      spawnTimer -= dt;

      if (spawnTimer <= 0) {
        obstacles.push({
          x: width + 20,
          y: groundY - 32,
          width: 22,
          height: 32,
          speed: 250 + Math.min(score * 1.2, 90),
        });

        spawnTimer = 1.25 + Math.random() * 1.1;
      }

      // Move obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        obstacle.x -= obstacle.speed * dt;

        if (obstacle.x + obstacle.width < 0) {
          obstacles.splice(i, 1);
          score += 1;
          continue;
        }

        drawCactus(obstacle);
      }

      // Collision
      const dx = dino.x + 6;
      const dy = dino.y + 5;
      const dw = dino.width - 8;
      const dh = dino.height - 5;

      const hit = obstacles.some(
        (o) =>
          dx < o.x + o.width - 3 &&
          dx + dw > o.x + 3 &&
          dy < o.y + o.height &&
          dy + dh > o.y + 3,
      );

      if (hit) {
        reset(height);
      }

      drawDino(dino.x, dino.y);

      ctx.globalAlpha = 1;

      animationFrame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);

    observer.observe(canvas);
    resize();
    reset(canvas.clientHeight);

    window.addEventListener("keydown", handleKeyDown);

    // Tap/click the yellow hero to jump.
    canvas.addEventListener("pointerdown", jump);

    animationFrame = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();

      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", jump);
    };
  }, []);

  const handleParse = async () => {
    if (!text.trim()) return;

    setParsing(true);

    try {
      await onParse(text);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f0e8] text-[#111] selection:bg-[#fff06a]">
      {/* =========================================================
          HEADER
      ========================================================== */}
      <header className="border-b-2 border-black bg-[#f3f0e8]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Payment Tracker"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="text-[13px] font-black uppercase tracking-[-0.02em]">
                Payment Tracker
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">
                Daily workspace
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full border-2 border-black bg-[#fff06a] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em]">
              {String(voucherCount).padStart(2, "0")} Entries
            </span>

            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/45">
              September 2026
            </span>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN
      ========================================================== */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {/* =======================================================
            HERO
        ======================================================== */}
        <section className="relative overflow-hidden rounded-[14px] border-2 border-black bg-[#fff06a] shadow-[7px_7px_0_0_#111]">
          {/* Background grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* =========================================================
    HIDDEN DINO EASTER EGG
========================================================= */}
          <canvas
            ref={gameRef}
            aria-hidden="true"
            className="absolute inset-0 z-0 h-full w-full"
          />
          <div className="relative z-10 grid min-h-[330px] lg:grid-cols-[1fr_280px]">
            {/* Hero copy */}
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
              <div>
                <div className="mb-7 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-[10px] font-black">
                    01
                  </span>

                  <span className="h-[2px] w-10 bg-black" />

                  <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                    Voucher entry system
                  </span>
                </div>

                <h1 className="max-w-[800px] text-[48px] font-black leading-[0.9] tracking-[-0.055em] sm:text-[64px] lg:text-[76px]">
                  TURN RAW
                  <br />
                  VOUCHERS INTO
                  <br />
                  <span className="relative inline-block">
                    PAYMENTS.
                    <span className="absolute -bottom-1 left-0 h-[7px] w-full bg-black" />
                  </span>
                </h1>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-md text-[13px] font-medium leading-5">
                  Paste your daily voucher data. We clean it, process it, and
                  turn the mess into something you can actually work with.
                </p>

                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.12em]">
                  Fast / Simple / No nonsense
                </div>
              </div>
            </div>

            {/* Hero side panel */}
            <div className="flex flex-col justify-between border-t-2 border-black bg-[#f3f0e8] lg:border-l-2 lg:border-t-0">
              <div className="p-6">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em]">
                    Today
                  </span>

                  <span className="font-mono text-[10px]">
                    {new Date().toLocaleDateString("en-GB")}
                  </span>
                </div>

                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-black/45">
                  Vouchers captured
                </div>

                <div className="mt-2 text-[72px] font-black leading-none tracking-[-0.07em]">
                  {String(voucherCount).padStart(2, "0")}
                </div>
              </div>

              <div className="border-t-2 border-black p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#35a853]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.14em]">
                    System ready
                  </span>
                </div>

                <p className="text-[11px] font-medium leading-4 text-black/60">
                  Waiting for today's voucher data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            WORKSPACE LABEL
        ======================================================== */}
        <div className="mt-12 mb-5 flex items-end justify-between">
          <div>
            <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-black/45">
              02 / Workspace
            </div>

            <h2 className="text-[28px] font-black tracking-[-0.04em] sm:text-[34px]">
              Drop the vouchers here.
            </h2>
          </div>

          <div className="hidden text-right sm:block">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-black/40">
              Expected format
            </div>
            <div className="mt-1 font-mono text-[10px]">TAB SEPARATED</div>
          </div>
        </div>

        {/* =======================================================
            INPUT CARD
        ======================================================== */}
        <section className="overflow-hidden rounded-[12px] border-2 border-black bg-white shadow-[6px_6px_0_0_#111]">
          {/* Card header */}
          <div className="flex min-h-[58px] items-center justify-between border-b-2 border-black bg-[#f3f0e8] px-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold">INPUT</span>

              <span className="h-4 w-[2px] bg-black/20" />

              <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                Voucher Data
              </span>
            </div>

            <span className="rounded-full border border-black/30 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-black/50">
              Paste → Process
            </span>
          </div>

          {/* Textarea */}
          <div className="relative p-2">
            <div
              className="pointer-events-none absolute inset-2 opacity-[0.07]"
              style={{
                backgroundImage: "linear-gradient(#111 1px, transparent 1px)",
                backgroundSize: "100% 28px",
              }}
            />

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Date\tVch/Bill No\tAccount\tTotal Amount
01-09-2026\tF1\tNEHA TRADERS (ODISHA)\t59,750.00
01-09-2026\tF2\tLOOK ME (MURSHIDABAD)\t32,980.00`}
              rows={13}
              className="relative z-10 min-h-[310px] resize-none rounded-[7px] border-0 bg-transparent px-4 py-4 font-mono text-[12px] leading-7 shadow-none outline-none placeholder:text-black/25 focus:ring-0"
            />
          </div>

          {/* Bottom controls */}
          <div className="flex flex-col gap-5 border-t-2 border-black bg-[#f3f0e8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-[10px] font-black ${
                  text.trim() ? "bg-[#35a853] text-white" : "bg-white"
                }`}
              >
                {text.trim() ? "✓" : "—"}
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.1em]">
                  {text.trim() ? "Data ready" : "Nothing pasted yet"}
                </div>

                <div className="mt-0.5 text-[9px] font-medium text-black/45">
                  {text.trim()
                    ? "Ready to process your vouchers."
                    : "Paste tab-separated voucher data to begin."}
                </div>
              </div>
            </div>

            <button
              onClick={handleParse}
              disabled={!text.trim() || parsing}
              className="group relative flex h-12 items-center justify-center gap-4 rounded-[8px] border-2 border-black bg-black px-6 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#111] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <span>{parsing ? "Processing..." : "Start Processing"}</span>

              {!parsing && (
                <span className="text-base leading-none transition-transform group-hover:translate-x-1">
                  →
                </span>
              )}
            </button>
          </div>
        </section>

        {/* =======================================================
            STATUS / EXISTING DATA
        ======================================================== */}
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {/* Entries */}
          <div className="rounded-[10px] border-2 border-black bg-white p-5 shadow-[4px_4px_0_0_#111]">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.17em]">
                03 / Entries
              </span>

              <span className="font-mono text-[9px] text-black/40">LIVE</span>
            </div>

            <div className="text-[48px] font-black leading-none tracking-[-0.06em]">
              {String(voucherCount).padStart(2, "0")}
            </div>

            <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black/45">
              {voucherCount === 1 ? "Voucher stored" : "Vouchers stored"}
            </div>
          </div>

          {/* Status */}
          <div className="rounded-[10px] border-2 border-black bg-[#fff06a] p-5 shadow-[4px_4px_0_0_#111]">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.17em]">
                System
              </span>

              <span className="font-mono text-[9px]">24 / 7</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full border-2 border-black bg-[#35a853]" />

              <span className="text-[24px] font-black tracking-[-0.04em]">
                Active
              </span>
            </div>

            <div className="mt-3 text-[10px] font-medium text-black/60">
              Ready for today's entries.
            </div>
          </div>

          {/* View */}
          <div className="rounded-[10px] border-2 border-black bg-black p-5 text-white shadow-[4px_4px_0_0_#111]">
            <div className="mb-8 text-[9px] font-black uppercase tracking-[0.17em] text-white/50">
              Existing data
            </div>

            {voucherCount > 0 && onViewVouchers ? (
              <button
                onClick={onViewVouchers}
                className="group flex w-full items-end justify-between text-left"
              >
                <div>
                  <div className="text-[24px] font-black tracking-[-0.04em]">
                    View vouchers
                  </div>

                  <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">
                    Open {voucherCount} stored{" "}
                    {voucherCount === 1 ? "entry" : "entries"}
                  </div>
                </div>

                <span className="text-3xl transition-transform group-hover:translate-x-2">
                  →
                </span>
              </button>
            ) : (
              <div>
                <div className="text-[24px] font-black tracking-[-0.04em]">
                  No entries
                </div>

                <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">
                  Your workspace is clean.
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =======================================================
            FOOTER
        ======================================================== */}
        <footer className="mt-12 flex flex-col gap-4 border-t-2 border-black pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.16em]">
              Payment Tracker
            </span>

            <span className="h-3 w-[2px] bg-black/20" />

            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">
              Built for daily chaos
            </span>
          </div>

          {voucherCount > 0 && onResetAll ? (
            <button
              onClick={onResetAll}
              className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-red-700 transition-opacity hover:opacity-50"
            >
              Delete all vouchers
            </button>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/40">
              Ready for today's entries →
            </span>
          )}
        </footer>
      </main>
    </div>
  );
}
