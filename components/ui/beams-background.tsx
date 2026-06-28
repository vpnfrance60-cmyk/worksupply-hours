"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface AnimatedGradientBackgroundProps {
    className?: string;
    children?: React.ReactNode;
    intensity?: "subtle" | "medium" | "strong";
    showLogo?: boolean;
}

const BG_DARK_BLUE = "#020617";

type Particle = {
    id: number;
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
};

function generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        duration: 6 + Math.random() * 10,
        delay: Math.random() * 6,
    }));
}

function FloatingParticles({ opacity }: { opacity: number }) {
    // Generated client-side only (useEffect) to avoid SSR/client hydration
    // mismatches from Math.random() during render.
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        setParticles(generateParticles(40));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ opacity }}>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-sky-200"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.15, 0.8, 0.15],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

export function BeamsBackground({
    className,
    children,
    intensity = "strong",
    showLogo = true,
}: AnimatedGradientBackgroundProps) {
    const opacityMap = {
        subtle: 0.6,
        medium: 0.8,
        strong: 1,
    };
    const particleOpacity = opacityMap[intensity];

    return (
        <div
            className={cn(
                "relative min-h-screen w-full overflow-hidden",
                className
            )}
            style={{ backgroundColor: BG_DARK_BLUE }}
        >
            {/* Blue radial glow */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        "radial-gradient(circle 600px at 50% 35%, rgba(59,130,246,0.3), transparent)",
                }}
            />

            <FloatingParticles opacity={particleOpacity} />

            {showLogo && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "url('/logo-transparent.png')",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top 36px center",
                        backgroundSize: "380px",
                        opacity: 1,
                    }}
                />
            )}

            <LanguageSwitcher />

            <div
                className={cn(
                    "relative z-10 flex min-h-screen w-full justify-center pb-12",
                    showLogo ? "items-start pt-[320px]" : "items-center"
                )}
            >
                {children}
            </div>
        </div>
    );
}
