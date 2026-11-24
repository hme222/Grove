import React from 'react';
import { photoSrc } from '@/components/PhotoBand';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';
import './WelcomeScreen.css';

// The FloraGrove welcome screen composition (Studio 12), drawn on a 430 x 932 stage.
// Used full-screen in onboarding (WelcomeScreen) and inside the phone on the /waitlist page.
// `decorative` renders the Continue button as a picture (not focusable) for the marketing phone.

export const STAGE_W = 430;
export const STAGE_H = 800;
// Where the Continue button ends on the stage, for deciding whether it is in view.
export const CTA_BOTTOM = 768;

// The green line is drawn from the design file's own shapes (Figma "Line 5" and "Line 6"), tapered brush outlines.
// LINE_1 sits under the headline. LINE_2 is ONE long line: it leaves the definition, loops right, runs down behind the
// photo and comes out at the bottom left beside "safe space". The photo is stacked above it, so it reads as one line.
const LINE_1 = 'M156.439 167.301C156.454 167.676 156.468 168.051 156.482 168.425C161.563 168.356 166.295 168.311 170.695 168.291C174.704 168.279 180.147 168.25 184.593 168.282C186.896 168.296 188.863 168.32 191.144 168.355C193.738 168.391 196.14 168.445 198.358 168.518C202.24 168.644 207.907 168.908 211.801 169.377C213.13 169.53 214.293 169.7 215.291 169.885C215.79 169.977 216.248 170.073 216.665 170.172C217.229 170.303 217.943 170.505 218.396 170.676C218.874 170.851 219.226 171.029 219.443 171.174C219.476 171.195 219.6 171.283 219.647 171.328C219.702 171.378 219.726 171.411 219.732 171.42C219.74 171.443 219.697 171.339 219.705 171.287C219.721 171.192 219.696 171.401 219.371 171.743C219.292 171.828 219.199 171.921 219.091 172.02C219.037 172.069 218.98 172.12 218.918 172.172C218.868 172.214 218.841 172.237 218.8 172.27C218.647 172.395 218.475 172.527 218.285 172.663C189.849 186.679 157.466 193.615 127.908 207.44C120.559 210.992 113.186 214.445 107.203 220.549C104.022 223.632 102.375 229.234 105.977 232.961C107.125 234.348 109.145 235.866 110.949 236.897C112.521 237.811 114.364 238.701 116.501 239.572C132.166 245.502 147.607 247.575 163.749 249.857C168.184 250.441 172.906 251.009 177.927 251.559C177.971 251.186 178.015 250.814 178.058 250.441C173.055 249.81 168.352 249.163 163.94 248.504C147.903 245.972 132.454 243.613 117.297 237.649C115.242 236.785 113.496 235.912 112.045 235.04C110.372 234.059 108.587 232.663 107.682 231.527C105.027 228.486 106.096 225.138 108.938 222.151C114.385 216.675 121.743 213.198 128.994 209.793C158.523 196.249 190.068 189.92 220.033 175.101C220.672 174.601 222.559 173.391 222.696 171.438C222.812 170.202 221.777 169.075 221.081 168.673C220.6 168.36 220.052 168.106 219.419 167.875C218.815 167.653 217.973 167.421 217.336 167.278C216.864 167.171 216.358 167.07 215.816 166.974C214.732 166.784 213.505 166.616 212.121 166.469C208.068 166.034 202.335 165.846 198.416 165.818C196.177 165.796 193.757 165.797 191.149 165.824C188.855 165.851 186.88 165.896 184.569 165.957C180.108 166.075 174.656 166.28 170.645 166.492C166.244 166.712 161.514 166.981 156.439 167.301Z';
const LINE_2 = 'M298.8 246.6 C298.9 247.2 299.0 247.9 299.1 248.6 C311.3 247.1 318.7 246.4 330.8 246.4 C341.3 246.8 355.3 247.2 362.1 256.4 C368.2 266.2 359.6 281.1 353.7 290.4 C339.7 311.7 322.5 329.8 305.0 347.9 C270.2 383.4 233.3 417.2 197.2 451.2 C161.0 481.4 125.2 511.3 91.4 544.8 C74.8 561.3 56.3 578.7 41.4 599.1 C34.2 609.5 27.2 620.9 28.0 633.5 C28.8 646.0 41.8 653.0 51.7 655.6 C62.8 658.6 70.9 659.3 83.0 659.9 C83.1 659.3 83.2 658.7 83.3 658.1 C71.3 657.3 63.4 656.4 52.7 653.2 C43.0 650.5 31.4 643.7 31.1 632.8 C30.5 621.8 37.1 611.0 44.3 600.9 C58.9 581.3 77.5 564.1 94.5 547.9 C128.3 514.9 164.2 485.2 200.4 455.1 C236.5 421.6 273.2 387.6 307.9 351.6 C325.4 333.2 342.5 314.9 356.6 292.8 C362.3 283.0 372.4 267.7 364.5 254.2 C355.6 243.6 341.6 244.3 330.8 244.0 C318.5 244.1 311.1 245.0 298.8 246.6 Z';

// Pen paths down the middle of each line. A thick stroke along one of these, drawn on over time, is the mask that
// reveals the line in the direction the pen would have moved.
const PEN_1 = 'M156.5 167.9 L159.5 167.7 L162.6 167.6 L165.7 167.5 L168.7 167.4 L171.8 167.4 L174.9 167.3 L177.9 167.2 L181.0 167.2 L184.1 167.1 L187.2 167.1 L190.3 167.1 L193.3 167.1 L196.4 167.1 L199.5 167.2 L202.6 167.3 L205.7 167.4 L208.8 167.6 L211.9 167.9 L215.0 168.3 L218.2 169.0 L220.4 172.9 L217.3 174.8 L214.5 176.1 L211.7 177.4 L208.9 178.6 L206.0 179.8 L203.2 181.0 L200.3 182.1 L197.4 183.2 L194.6 184.3 L191.6 185.4 L188.8 186.4 L185.8 187.4 L182.9 188.5 L180.0 189.5 L177.1 190.4 L174.2 191.4 L171.3 192.4 L168.4 193.4 L165.5 194.4 L162.6 195.4 L159.7 196.4 L156.8 197.4 L153.9 198.4 L151.0 199.4 L148.1 200.5 L145.3 201.6 L142.4 202.7 L139.6 203.8 L136.7 205.0 L133.9 206.2 L131.1 207.4 L128.4 208.7 L125.6 210.0 L122.9 211.3 L120.2 212.7 L117.5 214.2 L115.0 215.8 L112.5 217.5 L110.2 219.4 L108.0 221.4 L106.3 223.6 L105.3 226.1 L105.1 228.7 L106.0 231.2 L107.8 233.3 L110.1 235.1 L112.6 236.6 L115.3 237.9 L118.1 239.1 L121.0 240.1 L123.8 241.1 L126.8 241.9 L129.7 242.8 L132.7 243.5 L135.6 244.2 L138.6 244.9 L141.6 245.5 L144.6 246.1 L147.6 246.6 L150.7 247.1 L153.7 247.6 L156.7 248.1 L159.7 248.6 L162.8 249.0 L165.8 249.5 L168.9 249.9 L171.9 250.3 L175.0 250.6 L178.0 251.0';
const PEN_2 = 'M299.0 247.6 L303.1 247.0 L307.3 246.5 L311.4 246.1 L315.6 245.8 L319.8 245.5 L324.0 245.3 L328.2 245.2 L332.4 245.2 L336.6 245.4 L340.8 245.6 L345.0 246.0 L349.3 246.8 L353.5 248.1 L357.5 250.1 L361.2 253.0 L364.3 257.2 L365.6 262.1 L365.6 267.3 L364.6 272.4 L363.0 277.0 L361.0 281.4 L358.8 285.5 L356.4 289.5 L354.0 293.5 L351.4 297.3 L348.7 301.0 L346.0 304.7 L343.3 308.3 L340.5 311.9 L337.6 315.4 L334.7 318.9 L331.8 322.3 L328.8 325.7 L325.8 329.1 L322.8 332.4 L319.8 335.7 L316.7 338.9 L313.6 342.2 L310.6 345.4 L307.5 348.7 L304.4 351.9 L301.3 355.0 L298.1 358.2 L295.0 361.4 L291.9 364.5 L288.7 367.7 L285.6 370.8 L282.4 373.9 L279.2 377.0 L276.1 380.2 L272.9 383.2 L269.7 386.3 L266.5 389.4 L263.3 392.5 L260.1 395.6 L256.9 398.6 L253.7 401.7 L250.5 404.8 L247.3 407.8 L244.1 410.9 L240.9 413.9 L237.7 416.9 L234.5 420.0 L231.2 423.0 L228.0 426.0 L224.8 429.1 L221.6 432.1 L218.4 435.1 L215.1 438.2 L211.9 441.2 L208.7 444.2 L205.5 447.3 L202.3 450.3 L199.1 453.0 L195.9 455.6 L192.6 458.3 L189.4 461.0 L186.2 463.6 L183.0 466.3 L179.8 469.0 L176.6 471.7 L173.4 474.4 L170.2 477.0 L167.0 479.7 L163.9 482.4 L160.7 485.1 L157.5 487.8 L154.3 490.5 L151.2 493.2 L148.0 496.0 L144.8 498.7 L141.7 501.4 L138.6 504.2 L135.4 506.9 L132.3 509.7 L129.2 512.5 L126.1 515.2 L123.0 518.0 L119.9 520.8 L116.8 523.6 L113.8 526.5 L110.7 529.3 L107.7 532.1 L104.6 535.0 L101.6 537.9 L98.6 540.8 L95.6 543.7 L92.7 546.6 L89.7 549.5 L86.8 552.5 L83.9 555.5 L81.0 558.5 L78.0 561.5 L74.8 564.5 L71.6 567.6 L68.5 570.7 L65.4 573.8 L62.3 577.0 L59.3 580.2 L56.4 583.4 L53.5 586.7 L50.6 590.1 L47.9 593.5 L45.1 596.9 L42.6 600.4 L40.1 604.0 L37.7 607.6 L35.6 611.3 L33.6 615.1 L32.0 619.0 L30.7 622.9 L29.8 626.8 L29.5 630.8 L29.7 634.7 L30.6 638.3 L32.3 641.6 L34.6 644.5 L37.3 647.1 L40.4 649.3 L43.8 651.2 L47.3 652.8 L51.0 654.1 L54.9 655.2 L58.8 656.1 L62.8 656.9 L66.8 657.5 L70.8 658.0 L74.9 658.4 L79.0 658.7 L83.1 659.0';
// The scribble under "safe space" (Figma "Line 7": a 1px stroke), as drawn.
const UNDERLINE = 'M182.3 674.4C176.1 677 259.9 670.2 242.6 674.4C225.3 678.6 192.7 679.3 188.3 680.7C183.8 682.1 231.8 682.5 235.7 684.2C239.7 686 214.6 685.3 201.1 686';
const DRAW = { fill: 'none', stroke: 'white', strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1, strokeDasharray: '1 2' };

function Sparkle({ cx, cy, r, i }) {
  const d = `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
  return <path className={`gw-twinkle gw-twinkle-${i}`} d={d} />;
}

export function WelcomeStage({ decorative = false, pinContinue = false, onContinue, disabled }) {
  return (
    <>
      <div className="gw-a gw-brand" data-welcome-wordmark style={{ left: 20, top: 24 }}>
        <FloraGroveWordmark size={30} />
      </div>

      <h1 className="gw-a gw-welcome" style={{ left: 20, top: 104 }}>
        <span className="gw-welcome-to">Welcome to Flora</span>
        <span className="gw-welcome-grove">Grove</span>
      </h1>

      <p className="gw-a gw-def" style={{ left: 184, top: 200, width: 236 }}>
        A <b className="gw-serif-bold">grove</b> is a small group of trees growing closely together
      </p>

      <img className="gw-a gw-forest" src={photoSrc('/photos/welcome-forest-edited.jpg')} alt="" style={{ left: 14, top: 330, width: 402, height: 272 }} />

      <p className="gw-a gw-lower gw-safe" style={{ left: 91, top: 650 }}>
        FloraGrove is a <b>safe space</b> to learn about plants.
      </p>

      <svg className="gw-lines" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width={STAGE_W} height={STAGE_H} aria-hidden="true">
        <defs>
          <mask id="gw-mask-1" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
            <path className="gw-draw gw-draw-1" d={PEN_1} strokeWidth="16" {...DRAW} />
          </mask>
          <mask id="gw-mask-2" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
            <path className="gw-draw gw-draw-2" d={PEN_2} strokeWidth="14" {...DRAW} />
          </mask>
          {/* The line is drawn over the photo but cut just inside the photo's edge, so it tucks under the picture with a clean
              edge. (Seen through the photo's soft rim it looked broken.) */}
          <clipPath id="gw-outside" clipRule="evenodd">
            <path clipRule="evenodd" d={`M0 0H${STAGE_W}V${STAGE_H}H0Z M38 336H392A18 18 0 0 1 410 354V578A18 18 0 0 1 392 596H38A18 18 0 0 1 20 578V354A18 18 0 0 1 38 336Z`} />
          </clipPath>
        </defs>
        <g fill="var(--grove-lime)" clipPath="url(#gw-outside)">
          <path className="gw-line" mask="url(#gw-mask-1)" transform="translate(0 -34)" d={LINE_1} />
          <path className="gw-line" mask="url(#gw-mask-2)" d={LINE_2} />
        </g>
        <g fill="none" stroke="var(--grove-lime)" strokeLinecap="round" strokeLinejoin="round">
          <path className="gw-draw gw-draw-4" transform="translate(194 3) scale(1.16 1) translate(-182.3 0)" pathLength="1" strokeDasharray="1 2" strokeWidth="1.6" d={UNDERLINE} />
        </g>
        <g className="gw-a gw-stars" fill="var(--grove-sun)">
          <Sparkle cx={277} cy={99} r={5.5} i={1} />
          <Sparkle cx={270.5} cy={102} r={4.5} i={2} />
          <Sparkle cx={279} cy={106} r={4.5} i={3} />
        </g>
      </svg>

      {pinContinue ? null : decorative ? (
        <div className="gw-a gw-lower gw-cta" aria-hidden="true" style={{ left: 20, top: 722, width: 390, height: 46 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="gw-cta-ring">
            <circle cx="9" cy="9" r="7" fill="none" stroke="var(--grove-fern-line)" strokeWidth="1.8" />
          </svg>
          Continue
        </div>
      ) : (
        <button
          type="button"
          className="gw-cta"
          onClick={onContinue}
          disabled={disabled}
          data-testid="onboarding-continue"
          style={{ left: 20, top: 722, width: 390, height: 46 }}
        >
          {disabled ? 'Loading…' : 'Sign up'}
        </button>
      )}
    </>
  );
}

export default WelcomeStage;
