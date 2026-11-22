import { forwardRef, memo, useMemo, useRef, useEffect } from 'react';
import './VariableProximity.css';

const VariableProximity = forwardRef((props, ref) => {
  const {
    label,
    fromFontVariationSettings,
    toFontVariationSettings,
    containerRef,
    radius = 50,
    falloff = 'linear',
    className = '',
    onClick,
    style,
    ...restProps
  } = props;

  const letterRefs = useRef([]);

  const parsedSettings = useMemo(() => {
    const parseSettings = settingsStr =>
      new Map(
        settingsStr
          .split(',')
          .map(s => s.trim())
          .map(s => {
            const [name, value] = s.split(' ');
            return [name.replace(/['"]/g, ''), parseFloat(value)];
          })
      );

    const fromSettings = parseSettings(fromFontVariationSettings);
    const toSettings = parseSettings(toFontVariationSettings);

    return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  // Only works while the container is on screen and the pointer moves: one
  // frame of work per pointer move, no layout reads per letter (their
  // centres are measured once and re-measured on resize), and a letter is
  // only touched when its weight actually changes.
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const calculateFalloff = distance => {
      const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
      switch (falloff) {
        case 'exponential':
          return norm ** 2;
        case 'gaussian':
          return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
        case 'linear':
        default:
          return norm;
      }
    };

    let visible = false;
    let rafId = 0;
    let centers = null;
    let pointer = null;
    const applied = [];

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      centers = letterRefs.current.map(el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top
        };
      });
    };

    const update = () => {
      rafId = 0;
      if (!pointer) return;
      if (!centers) measure();
      const containerRect = container.getBoundingClientRect();
      const px = pointer.x - containerRect.left;
      const py = pointer.y - containerRect.top;

      letterRefs.current.forEach((el, index) => {
        const c = centers[index];
        if (!el || !c) return;
        const distance = Math.hypot(px - c.x, py - c.y);
        const value = distance >= radius ? 0 : Math.round(calculateFalloff(distance) * 1000) / 1000;
        if (applied[index] === value) return;
        applied[index] = value;

        if (value === 0) {
          el.style.fontVariationSettings = fromFontVariationSettings;
          el.style.setProperty('--proximity-factor', '0');
          return;
        }
        el.style.fontVariationSettings = parsedSettings
          .map(({ axis, fromValue, toValue }) => `'${axis}' ${fromValue + (toValue - fromValue) * value}`)
          .join(', ');
        el.style.setProperty('--proximity-factor', String(value));
      });
    };

    let disposed = false;
    const schedule = () => {
      if (!disposed && visible && !rafId) rafId = requestAnimationFrame(update);
    };

    const onMouseMove = ev => {
      pointer = { x: ev.clientX, y: ev.clientY };
      schedule();
    };
    const onTouchMove = ev => {
      const touch = ev.touches[0];
      if (!touch) return;
      pointer = { x: touch.clientX, y: touch.clientY };
      schedule();
    };
    const onResize = () => {
      centers = null;
      schedule();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    io.observe(container);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    // Webfonts change the letter widths once they arrive.
    document.fonts?.ready.then(onResize);

    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [containerRef, radius, falloff, parsedSettings, fromFontVariationSettings]);

  const words = label.split(' ');
  let letterIndex = 0;

  return (
    <span
      ref={ref}
      className={`${className} variable-proximity`}
      onClick={onClick}
      style={{ display: 'inline', fontFamily: "'Roboto Flex', sans-serif", ...style }}
      {...restProps}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split('').map(letter => {
            const currentLetterIndex = letterIndex++;
            return (
              <span
                key={currentLetterIndex}
                ref={el => {
                  letterRefs.current[currentLetterIndex] = el;
                }}
                style={{
                  display: 'inline-block',
                  // Live values are written straight to the DOM in the frame loop
                  fontVariationSettings: fromFontVariationSettings
                }}
                aria-hidden="true"
              >
                {letter}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
});

VariableProximity.displayName = 'VariableProximity';
export default memo(VariableProximity);
