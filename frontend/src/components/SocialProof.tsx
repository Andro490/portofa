/**
 * SocialProof.tsx
 * Animated statistics row — count-up numbers triggered on scroll.
 * Uses GSAP ScrollTrigger (already in project).
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, BookOpen, Clock, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  icon: React.ReactNode;
  endValue: number;
  decimals: number;
  suffix: string;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
}

const STATS: Stat[] = [
  {
    icon: <Users className="w-5 h-5" />,
    endValue: 1200,
    decimals: 0,
    suffix: '+',
    label: 'طالب مسجّل',
    gradientFrom: '#06b6d4',
    gradientTo:   '#0891b2',
    glowColor:    'rgba(6,182,212,0.3)',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    endValue: 48,
    decimals: 0,
    suffix: '+',
    label: 'دورة متخصصة',
    gradientFrom: '#7c3aed',
    gradientTo:   '#6d28d9',
    glowColor:    'rgba(124,58,237,0.3)',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    endValue: 500,
    decimals: 0,
    suffix: 'ساعة',
    label: 'محتوى تعليمي',
    gradientFrom: '#d946ef',
    gradientTo:   '#c026d3',
    glowColor:    'rgba(217,70,239,0.3)',
  },
  {
    icon: <Star className="w-5 h-5" />,
    endValue: 4.9,
    decimals: 1,
    suffix: '★',
    label: 'تقييم المتعلمين',
    gradientFrom: '#fbbf24',
    gradientTo:   '#f59e0b',
    glowColor:    'rgba(251,191,36,0.3)',
  },
];

const SocialProof = () => {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Stagger reveal for the cards
      gsap.fromTo(sectionRef.current!.children, 
        {
          opacity:      0,
          y:            28,
          scale:        0.92,
        },
        {
          opacity:      1,
          y:            0,
          scale:        1,
          stagger:      0.12,
          duration:     0.75,
          ease:         'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start:   'top 88%',
            once:    true,
          },
        }
      );

      // Count-up for each number
      STATS.forEach((stat, i) => {
        const el = counterRefs.current[i];
        if (!el) return;

        const obj = { val: 0 };
        gsap.to(obj, {
          val:      stat.endValue,
          duration: 2.2,
          ease:     'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start:   'top 88%',
            once:    true,
          },
          onUpdate() {
            el.textContent = stat.decimals > 0
              ? obj.val.toFixed(stat.decimals)
              : Math.round(obj.val).toString();
          },
          onComplete() {
            el.textContent = stat.decimals > 0
              ? stat.endValue.toFixed(stat.decimals)
              : stat.endValue.toString();
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="flex flex-wrap justify-center gap-4 mt-10 w-full"
      aria-label="إحصائيات المنصة"
    >
      {STATS.map((stat, i) => (
        <div
          key={i}
          className="
            relative overflow-hidden
            glass-card rounded-2xl px-5 py-4
            flex items-center gap-3
            min-w-[150px] max-w-[190px] flex-1
            group hover:scale-[1.04] transition-transform duration-300 cursor-default
          "
          style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06)` }}
        >
          {/* Glow shimmer on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${stat.glowColor}, transparent 70%)`,
            }}
          />

          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${stat.gradientFrom}22, ${stat.gradientTo}44)`,
              border:      `1px solid ${stat.gradientFrom}44`,
              color:       stat.gradientFrom,
            }}
          >
            {stat.icon}
          </div>

          {/* Text */}
          <div className="text-right leading-tight">
            <div className="flex items-baseline gap-1 justify-end">
              <span
                style={{ color: stat.gradientFrom }}
                className="text-xs font-bold"
              >
                {stat.suffix}
              </span>
              <span className="text-2xl font-extrabold text-body-primary tabular-nums">
                <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
              </span>
            </div>
            <p className="text-[11px] text-body-secondary mt-0.5">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SocialProof;
