import { useState, useEffect, useRef } from "react";

/* ─── Google Fonts ─────────────────────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@300;400;500&family=Jost:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:        #07090f;
      --ocean:     #0b1120;
      --deep:      #0f1929;
      --surface:   #131e2e;
      --surfaceHi: #182438;
      --border:    #1e2e42;
      --borderLt:  #243548;
      --ember:     #c8621a;
      --emberLt:   #e8864a;
      --emberDim:  #3d1f0a;
      --gold:      #c49a3c;
      --goldLt:    #e0be70;
      --goldDim:   #3d2e0a;
      --teal:      #2ab4a0;
      --tealDim:   #0a2e2a;
      --red:       #d94f4f;
      --redDim:    #3d1010;
      --yellow:    #c9a83c;
      --yellowDim: #3d2e0a;
      --text:      #e8e2d8;
      --textMuted: #7a8ea8;
      --textFaint: #364255;
      --shell:     #d4c5b0;
    }
    body { background: var(--bg); }
    input, select, button { font-family: inherit; }
    input:focus, select:focus { outline: 1px solid var(--ember); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--surface); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes flicker {
      0%,100% { opacity:1; } 50% { opacity:.7; }
    }
    @keyframes pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(200,98,26,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(200,98,26,0); }
    }
    .fade-up { animation: fadeUp 0.4s ease both; }
    .fade-up-1 { animation: fadeUp 0.4s 0.05s ease both; }
    .fade-up-2 { animation: fadeUp 0.4s 0.1s ease both; }
    .fade-up-3 { animation: fadeUp 0.4s 0.15s ease both; }
    .fade-up-4 { animation: fadeUp 0.4s 0.2s ease both; }
    .tab-btn { transition: color 0.2s, border-color 0.2s; }
    .tab-btn:hover { color: var(--shell) !important; }
    .row-hover:hover td { background: rgba(30,46,66,0.4) !important; }
    .btn-hover:hover { opacity: 0.85; }
    .card-hover:hover { border-color: var(--borderLt) !important; }
  `}</style>
);

/* ─── Default Data (empty — fill in the app) ────────────────────────────────── */
const SUPPLIERS        = [];
const SEED_INGREDIENTS = [];
const SEED_SHRINK      = [];

// ── Real Square catalog items (synced from Square API) ──────────────────────
const SEED_MENU = [
  // Core Raw Bar
  { id:"WNHXXMCHTCTM6JFSVV5WQHH7",  name:"Oysters",                    squareId:"FFJKTA2KLVMYTIVHIGVWP3NP", variationId:"WNHXXMCHTCTM6JFSVV5WQHH7",  price:24.00,  recipe:[] },
  { id:"DY6IJYOO2ZRGXHNH565NANDV",  name:"Oysters Catering (each)",    squareId:"ABH5HE6NSCNSK2B3L3UDOBJV", variationId:"DY6IJYOO2ZRGXHNH565NANDV",  price:4.00,   recipe:[] },
  { id:"WCKORAOQJK2OHHOMKEKPPR7V",  name:"Raw Bar and Shucker",        squareId:"6OQPH5KEWRGOFFJBBXRCCFBG", variationId:"WCKORAOQJK2OHHOMKEKPPR7V",  price:350.00, recipe:[] },
  { id:"GN7PZFOPOJSAQ75774XZOWEJ",  name:"Oyster Kit — 50 Oysters",    squareId:"JTUVAASH5ZEVGQH2ZCXJ76BY", variationId:"GN7PZFOPOJSAQ75774XZOWEJ",  price:125.00, recipe:[] },
  { id:"2L5F3OAC4KMVRWCWASRLYWEX",  name:"Oyster Kit — 25 Oysters",    squareId:"JTUVAASH5ZEVGQH2ZCXJ76BY", variationId:"2L5F3OAC4KMVRWCWASRLYWEX",  price:75.00,  recipe:[] },
  // Lobster
  { id:"CJUJCZPE6WAQTTMQDUHTPVYL",  name:"Connecticut Lobster Roll",   squareId:"NCQKCKJBCGJR6AP5BLKXYVYH", variationId:"CJUJCZPE6WAQTTMQDUHTPVYL",  price:29.00,  recipe:[] },
  { id:"CH7AOB4OLYRN7GG4EXJXVZA5",  name:"Maine Lobster Roll",         squareId:"LV2Y7QNTHZ4A7AA33QLRMCFV", variationId:"CH7AOB4OLYRN7GG4EXJXVZA5",  price:29.00,  recipe:[] },
  { id:"AQDX3SG6EP4NB5X5RYBGTCXR",  name:"Lobster Roll Kit",           squareId:"RCEILNXHQ444AIZ3DRFLWDNE", variationId:"AQDX3SG6EP4NB5X5RYBGTCXR",  price:100.00, recipe:[] },
  { id:"AZDCCNRKG2PSIMY3PXZA6WM7",  name:"Lobster",                    squareId:"HV5QHHLODIMYJY2RFHTJZYAA", variationId:"AZDCCNRKG2PSIMY3PXZA6WM7",  price:29.00,  recipe:[] },
  { id:"Y5YIE6KU4PCWWONRWR5AVUOH",  name:"1.5LB Live Lobster",         squareId:"ZOZKZ7QUKBN4ZJGQQXA7LNBV", variationId:"Y5YIE6KU4PCWWONRWR5AVUOH",  price:45.00,  recipe:[] },
  { id:"Z3VFKGXGJVKILLZNNNHLMIWG",  name:"Lobster Taco",               squareId:"2WOTQULCJS36T5YQHP3BJPXX", variationId:"Z3VFKGXGJVKILLZNNNHLMIWG",  price:14.00,  recipe:[] },
  // Shrimp
  { id:"SRY4YYDJSLYUWV7AXGAUR2YL",  name:"Gulf Shrimp 1/2 lb Catering",squareId:"E2FHBRXAIX7UXLEGU5B7OC63", variationId:"SRY4YYDJSLYUWV7AXGAUR2YL",  price:7.00,   recipe:[] },
  { id:"4I5OJRZQAKTD6WPSKKXIUSOT",  name:"Peel N' Eat Shrimp",         squareId:"SZCTSNTND7N2L2TPEDR3FCKS", variationId:"4I5OJRZQAKTD6WPSKKXIUSOT",  price:15.00,  recipe:[] },
  { id:"CIAZ432IIMHUKMVIONPNZ2FT",  name:"Shrimp & Grits",             squareId:"R2LDONQNNQVYJ2KIRXYCBHAK", variationId:"CIAZ432IIMHUKMVIONPNZ2FT",  price:16.00,  recipe:[] },
  // Tuna / Fish
  { id:"4G3NI3QQYORNMEZOU4MEX6DT",  name:"Tuna Carpaccio (full)",      squareId:"5AV2ZKYZ4OUMOZ3AZMKCDBDQ", variationId:"4G3NI3QQYORNMEZOU4MEX6DT",  price:32.00,  recipe:[] },
  { id:"T66ZJHDLM4BAINIASNORAENJ",  name:"Tuna Carpaccio (half)",      squareId:"5AV2ZKYZ4OUMOZ3AZMKCDBDQ", variationId:"T66ZJHDLM4BAINIASNORAENJ",  price:18.00,  recipe:[] },
  { id:"FC5NHGQ33ZTJZ6V33BSK6E4W",  name:"Tuna Aquachile Oysters",     squareId:"YY3IYQREJXH2HQT5CSVENRTS", variationId:"FC5NHGQ33ZTJZ6V33BSK6E4W",  price:28.00,  recipe:[] },
  { id:"RLZLSMXY3BW3TNDGHVK5FIGU",  name:"Tuna Tartare",               squareId:"Y374U7C62RU2LDX3RW3MA4AZ", variationId:"RLZLSMXY3BW3TNDGHVK5FIGU",  price:18.00,  recipe:[] },
  { id:"AAZHGEC4E6ZZIQBHDVM4R7DR",  name:"Ahi Blanco",                 squareId:"YNUUSDD7NZWKXB3LYK2D46SW", variationId:"AAZHGEC4E6ZZIQBHDVM4R7DR",  price:18.00,  recipe:[] },
  { id:"IEFBRFVNWG6UDXOVY5JNOX6C",  name:"Ahi Tuna Taco",              squareId:"LGXYEUGDAE5ZURUEX4MOGZ5H", variationId:"IEFBRFVNWG6UDXOVY5JNOX6C",  price:7.00,   recipe:[] },
  // Caviar
  { id:"MFLXXCQA4VVVDJXD6RM566HO",  name:"Caviar — Osetra",            squareId:"M7GMZYLGHZDP3DRAMB5JXSVW", variationId:"MFLXXCQA4VVVDJXD6RM566HO",  price:110.00, recipe:[] },
  { id:"TJALPBDRBM4SYPBEOT57EPET",  name:"Caviar — White Sturgeon",    squareId:"M7GMZYLGHZDP3DRAMB5JXSVW", variationId:"TJALPBDRBM4SYPBEOT57EPET",  price:68.00,  recipe:[] },
  { id:"776OE6UTE3NTCTK7HXOCKI6F",  name:"Caviar Oysters",             squareId:"NN7XXMIS5ZL5UBVMLSVINZOZ", variationId:"776OE6UTE3NTCTK7HXOCKI6F",  price:29.00,  recipe:[] },
  { id:"WNZCWL4PYPUZ5WKMIYRVZYEY",  name:"Caviar Board",               squareId:"ME2UXLMA3SRPVS4J5OM6C4AD", variationId:"WNZCWL4PYPUZ5WKMIYRVZYEY",  price:95.00,  recipe:[] },
  // Clams & Shellfish
  { id:"PRZJRBM545H4VSG2HLTDEVB5",  name:"Moules-Frites",              squareId:"XHSHOPSLT5N7OSBOKF5RQWCF", variationId:"PRZJRBM545H4VSG2HLTDEVB5",  price:16.00,  recipe:[] },
  { id:"3ZMMKUQ4HHAJXTUPRF6XKVG7",  name:"Clam Chowda",               squareId:"RP5K2OE5YEAXFINCFCP6PN4U", variationId:"3ZMMKUQ4HHAJXTUPRF6XKVG7",  price:14.00,  recipe:[] },
  { id:"UD3HDQSPI7JR25X2SWFJQFWA",  name:"Seafood Boil Kit",           squareId:"CKDLDR6H2M4C6GCMFI3GYSZ7", variationId:"UD3HDQSPI7JR25X2SWFJQFWA",  price:200.00, recipe:[] },
  // Tacos & Other
  { id:"Q62HKGXCOGHQQQFFB76BA3EY",  name:"Nashville Hot Chicken Taco", squareId:"N6P7T63FL3IOBHEPTZ7IHPND", variationId:"Q62HKGXCOGHQQQFFB76BA3EY",  price:8.00,   recipe:[] },
  { id:"SZLHYMLFWYO4LPG5VKP537CC",  name:"Chicken Bacon Ranch Taco",   squareId:"76VLIBTCEV56WPBVRZFAEZGS", variationId:"SZLHYMLFWYO4LPG5VKP537CC",  price:6.00,   recipe:[] },
  { id:"3ZVIIJL6MZEOSBIHAAR6GEPM",  name:"Grilled Chicken Taco",       squareId:"CWVS5RDWBUJXTRFKS4XK7VDD", variationId:"3ZVIIJL6MZEOSBIHAAR6GEPM",  price:7.00,   recipe:[] },
  { id:"KM25DMMVZYGN5MUXBFQPHMDB",  name:"Steak Sliders",              squareId:"3SYTQICWT6PENF2PNYX7GLHV", variationId:"KM25DMMVZYGN5MUXBFQPHMDB",  price:14.00,  recipe:[] },
  { id:"TDLMC7BKJGR6FJICD6ACBQY7",  name:"Aguachile",                  squareId:"CNELYMJUBGIACYQZUQSNHZAP", variationId:"TDLMC7BKJGR6FJICD6ACBQY7",  price:16.00,  recipe:[] },

export default FontLoader;
