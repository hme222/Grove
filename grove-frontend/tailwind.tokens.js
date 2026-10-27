// GENERATED from design/tokens.json by scripts/generate-tokens.js. Do not edit by hand.
module.exports = {
  "colors": {
    "grove": {
      "night": "#0B0F08",
      "understory": "#172010",
      "forest": "#202D14",
      "canopy": "#2D3B1A",
      "moss": "#3C4D26",
      "well": "#1C2416",
      "fernLine": "#64793F",
      "inputLine": "#4E6232",
      "lime": "#92B44B",
      "root": "#1A2410",
      "sprout": "#C3D98A",
      "cream": "#F4F1E6",
      "sage": "#C3CBB1",
      "lichen": "#C8D0B6",
      "sun": "#E8D77A",
      "bloom": "#E57A9C",
      "blush": "#F7B4C8",
      "paper": "#F5F0E8",
      "ink": "#1A1A17",
      "paperCard": "#FDFAF6",
      "paperDeep": "#EDE5D8",
      "paperBorder": "#D3C9B8",
      "inkSoft": "#2B2B26",
      "paperGreen": "#2D5016",
      "paperAccent": "#3B6D11",
      "paperPale": "#EAF3DE",
      "paperError": "#9B1C1C",
      "inputOutline": "#869A68"
    }
  },
  "borderRadius": {
    "hairline": "4px",
    "tag": "6px",
    "inset": "8px",
    "chip": "10px",
    "control": "12px",
    "small": "14px",
    "field": "16px",
    "round": "20px",
    "card": "22px",
    "phone": "56px",
    "phoneScreen": "45px",
    "pill": "999px"
  },
  "borderWidth": {
    "hairline": "0.5px",
    "strong": "1.5px",
    "accent": "3px"
  },
  "aspectRatio": {
    "wide": "2 / 1",
    "band": "5 / 2",
    "short": "3 / 1",
    "photo": "4 / 3",
    "portrait": "4 / 5",
    "tall": "5 / 4",
    "square": "1 / 1",
    "room": "8 / 5"
  },
  "maxWidth": {
    "page": "1100px",
    "content": "900px",
    "sheet": "640px",
    "column": "600px",
    "form": "520px",
    "note": "300px",
    "dialog": "440px",
    "entry": "480px",
    "reading": "720px",
    "print": "340px",
    "chipLabel": "100px",
    "tip": "220px"
  },
  "minHeight": {
    "touch": "44px",
    "row": "56px",
    "panel": "60vh",
    "screen": "100dvh",
    "hero": "220px",
    "field": "60px",
    "media-row": "168px",
    "nav": "calc(var(--nav-height) + env(safe-area-inset-bottom))"
  },
  "maxHeight": {
    "sheet": "85vh",
    "panel": "70vh",
    "hero": "420px",
    "viewport": "calc(100dvh - 2rem)",
    "screen": "100dvh"
  },
  "minWidth": {
    "touch": "44px",
    "tab": "64px"
  },
  "zIndex": {
    "nav": "50",
    "celebration": "80",
    "sheet": "200",
    "entry": "220",
    "swap": "240",
    "lightbox": "250",
    "tip": "300",
    "popover": "120",
    "intro": "60",
    "raised": "1",
    "toast": "100",
    "sticky": "40"
  },
  "fontSize": {
    "xs": [
      "0.875rem",
      "1.25rem"
    ],
    "label": [
      "0.9375rem",
      "1.4rem"
    ],
    "lead": [
      "1.0625rem",
      "1.6rem"
    ],
    "sm": [
      "0.875rem",
      "1.25rem"
    ],
    "base": [
      "1rem",
      "1.5rem"
    ],
    "lg": [
      "1.125rem",
      "1.75rem"
    ],
    "xl": [
      "1.25rem",
      "1.75rem"
    ],
    "2xl": [
      "1.5rem",
      "2rem"
    ],
    "3xl": [
      "1.875rem",
      "2.25rem"
    ]
  },
  "width": {
    "popover": "330px",
    "touch": "44px",
    "tile": "150px"
  },
  "height": {
    "photoFrame": "180px",
    "touch": "44px"
  },
  "boxShadow": {
    "rest": "0 1px 2px color-mix(in srgb, var(--grove-night) 20%, transparent)",
    "lift": "0 1px 2px color-mix(in srgb, var(--grove-night) 35%, transparent), 0 12px 26px color-mix(in srgb, var(--grove-night) 35%, transparent)",
    "dialog": "0 18px 48px color-mix(in srgb, var(--grove-night) 55%, transparent)"
  },
  "backgroundColor": {
    "scrim": "color-mix(in srgb, var(--grove-night) 80%, transparent)"
  },
  "letterSpacing": {
    "label": "0.05em",
    "display": "-0.01em"
  },
  "lineHeight": {
    "reading": "1.55"
  },
  "transitionDuration": {
    "settle": "280ms"
  },
  "keyframes": {
    "petal": {
      "0%": {
        "transform": "translateY(0) rotate(0deg)",
        "opacity": "0"
      },
      "20%": {
        "opacity": "0.9"
      },
      "100%": {
        "transform": "translateY(120px) rotate(220deg)",
        "opacity": "0"
      }
    },
    "soft-pulse": {
      "0%, 100%": {
        "opacity": "1"
      },
      "50%": {
        "opacity": "0.55"
      }
    },
    "popin": {
      "from": {
        "transform": "scale(0.6)",
        "opacity": "0"
      },
      "to": {
        "transform": "scale(1)",
        "opacity": "1"
      }
    }
  },
  "animation": {
    "petal": "petal 1.8s ease-out forwards",
    "popin": "popin 350ms ease-out",
    "soft-pulse": "soft-pulse 2.4s ease-in-out infinite"
  },
  "fontFamily": {
    "sans": "'Alegreya Sans', Optima, Candara, sans-serif",
    "mono": "'Alegreya Sans', Optima, Candara, sans-serif"
  },
  "spacing": {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "24": "6rem",
    "26": "6.5rem",
    "0.5": "0.125rem",
    "1.5": "0.375rem",
    "2.5": "0.625rem",
    "nav": "calc(var(--nav-height) + env(safe-area-inset-bottom))",
    "nav-stack": "calc(var(--nav-height) + var(--float-bar-height) + env(safe-area-inset-bottom))",
    "safe": "env(safe-area-inset-bottom)"
  }
};
