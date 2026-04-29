import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'bonfire.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    stock REAL DEFAULT 0,
    par REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    category TEXT,
    supplier_id TEXT REFERENCES suppliers(id),
    shrink_pct REAL DEFAULT 5,
    order_unit TEXT,
    case_cost REAL DEFAULT 0,
    min_order_qty REAL DEFAULT 1,
    tracking_unit TEXT,
    case_qty REAL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    square_item_id TEXT,
    variation_id TEXT,
    price REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipe_lines (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
    qty REAL NOT NULL,
    recipe_unit TEXT,
    stock_qty REAL
  );

  CREATE TABLE IF NOT EXISTS shrink_log (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    ingredient_id TEXT REFERENCES ingredients(id),
    qty REAL NOT NULL,
    reason TEXT,
    cost REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales_log (
    id TEXT PRIMARY KEY,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    item_name TEXT,
    variation_id TEXT,
    qty INTEGER,
    revenue REAL,
    date_range_start TEXT,
    date_range_end TEXT
  );
`);

// Seed menu_items on first run
const { n } = db.prepare('SELECT COUNT(*) as n FROM menu_items').get();
if (n === 0) {
  const SQUARE_MENU = [
    { id:"WNHXXMCHTCTM6JFSVV5WQHH7", name:"Oysters", square_item_id:"FFJKTA2KLVMYTIVHIGVWP3NP", variation_id:"WNHXXMCHTCTM6JFSVV5WQHH7", price:24.00 },
    { id:"DY6IJYOO2ZRGXHNH565NANDV", name:"Oysters Catering (each)", square_item_id:"ABH5HE6NSCNSK2B3L3UDOBJV", variation_id:"DY6IJYOO2ZRGXHNH565NANDV", price:4.00 },
    { id:"WCKORAOQJK2OHHOMKEKPPR7V", name:"Raw Bar and Shucker", square_item_id:"6OQPH5KEWRGOFFJBBXRCCFBG", variation_id:"WCKORAOQJK2OHHOMKEKPPR7V", price:350.00 },
    { id:"GN7PZFOPOJSAQ75774XZOWEJ", name:"Oyster Kit - 50 Oysters", square_item_id:"JTUVAASH5ZEVGQH2ZCXJ76BY", variation_id:"GN7PZFOPOJSAQ75774XZOWEJ", price:125.00 },
    { id:"2L5F3OAC4KMVRWCWASRLYWEX", name:"Oyster Kit - 25 Oysters", square_item_id:"JTUVAASH5ZEVGQH2ZCXJ76BY", variation_id:"2L5F3OAC4KMVRWCWASRLYWEX", price:75.00 },
    { id:"CJUJCZPE6WAQTTMQDUHTPVYL", name:"Connecticut Lobster Roll", square_item_id:"NCQKCKJBCGJR6AP5BLKXYVYH", variation_id:"CJUJCZPE6WAQTTMQDUHTPVYL", price:29.00 },
    { id:"CH7AOB4OLYRN7GG4EXJXVZA5", name:"Maine Lobster Roll", square_item_id:"LV2Y7QNTHZ4A7AA33QLRMCFV", variation_id:"CH7AOB4OLYRN7GG4EXJXVZA5", price:29.00 },
    { id:"AQDX3SG6EP4NB5X5RYBGTCXR", name:"Lobster Roll Kit", square_item_id:"RCEILNXHQ444AIZ3DRFLWDNE", variation_id:"AQDX3SG6EP4NB5X5RYBGTCXR", price:100.00 },
    { id:"AZDCCNRKG2PSIMY3PXZA6WM7", name:"Lobster", square_item_id:"HV5QHHLODIMYJY2RFHTJZYAA", variation_id:"AZDCCNRKG2PSIMY3PXZA6WM7", price:29.00 },
    { id:"Y5YIE6KU4PCWWONRWR5AVUOH", name:"1.5LB Live Lobster", square_item_id:"ZOZKZ7QUKBN4ZJGQQXA7LNBV", variation_id:"Y5YIE6KU4PCWWONRWR5AVUOH", price:45.00 },
    { id:"Z3VFKGXGJVKILLZNNNHLMIWG", name:"Lobster Taco", square_item_id:"2WOTQULCJS36T5YQHP3BJPXX", variation_id:"Z3VFKGXGJVKILLZNNNHLMIWG", price:14.00 },
    { id:"SRY4YYDJSLYUWV7AXGAUR2YL", name:"Gulf Shrimp 1/2 lb Catering", square_item_id:"E2FHBRXAIX7UXLEGU5B7OC63", variation_id:"SRY4YYDJSLYUWV7AXGAUR2YL", price:7.00 },
    { id:"4I5OJRZQAKTD6WPSKKXIUSOT", name:"Peel N Eat Shrimp", square_item_id:"SZCTSNTND7N2L2TPEDR3FCKS", variation_id:"4I5OJRZQAKTD6WPSKKXIUSOT", price:15.00 },
    { id:"CIAZ432IIMHUKMVIONPNZ2FT", name:"Shrimp and Grits", square_item_id:"R2LDONQNNQVYJ2KIRXYCBHAK", variation_id:"CIAZ432IIMHUKMVIONPNZ2FT", price:16.00 },
    { id:"4G3NI3QQYORNMEZOU4MEX6DT", name:"Tuna Carpaccio full", square_item_id:"5AV2ZKYZ4OUMOZ3AZMKCDBDQ", variation_id:"4G3NI3QQYORNMEZOU4MEX6DT", price:32.00 },
    { id:"T66ZJHDLM4BAINIASNORAENJ", name:"Tuna Carpaccio half", square_item_id:"5AV2ZKYZ4OUMOZ3AZMKCDBDQ", variation_id:"T66ZJHDLM4BAINIASNORAENJ", price:18.00 },
    { id:"FC5NHGQ33ZTJZ6V33BSK6E4W", name:"Tuna Aquachile Oysters", square_item_id:"YY3IYQREJXH2HQT5CSVENRTS", variation_id:"FC5NHGQ33ZTJZ6V33BSK6E4W", price:28.00 },
    { id:"RLZLSMXY3BW3TNDGHVK5FIGU", name:"Tuna Tartare", square_item_id:"Y374U7C62RU2LDX3RW3MA4AZ", variation_id:"RLZLSMXY3BW3TNDGHVK5FIGU", price:18.00 },
    { id:"AAZHGEC4E6ZZIQBHDVM4R7DR", name:"Ahi Blanco", square_item_id:"YNUUSDD7NZWKXB3LYK2D46SW", variation_id:"AAZHGEC4E6ZZIQBHDVM4R7DR", price:18.00 },
    { id:"IEFBRFVNWG6UDXOVY5JNOX6C", name:"Ahi Tuna Taco", square_item_id:"LGXYEUGDAE5ZURUEX4MOGZ5H", variation_id:"IEFBRFVNWG6UDXOVY5JNOX6C", price:7.00 },
    { id:"MFLXXCQA4VVVDJXD6RM566HO", name:"Caviar Osetra", square_item_id:"M7GMZYLGHZDP3DRAMB5JXSVW", variation_id:"MFLXXCQA4VVVDJXD6RM566HO", price:110.00 },
    { id:"TJALPBDRBM4SYPBEOT57EPET", name:"Caviar White Sturgeon", square_item_id:"M7GMZYLGHZDP3DRAMB5JXSVW", variation_id:"TJALPBDRBM4SYPBEOT57EPET", price:68.00 },
    { id:"776OE6UTE3NTCTK7HXOCKI6F", name:"Caviar Oysters", square_item_id:"NN7XXMIS5ZL5UBVMLSVINZOZ", variation_id:"776OE6UTE3NTCTK7HXOCKI6F", price:29.00 },
    { id:"WNZCWL4PYPUZ5WKMIYRVZYEY", name:"Caviar Board", square_item_id:"ME2UXLMA3SRPVS4J5OM6C4AD", variation_id:"WNZCWL4PYPUZ5WKMIYRVZYEY", price:95.00 },
    { id:"PRZJRBM545H4VSG2HLTDEVB5", name:"Moules-Frites", square_item_id:"XHSHOPSLT5N7OSBOKF5RQWCF", variation_id:"PRZJRBM545H4VSG2HLTDEVB5", price:16.00 },
    { id:"3ZMMKUQ4HHAJXTUPRF6XKVG7", name:"Clam Chowda", square_item_id:"RP5K2OE5YEAXFINCFCP6PN4U", variation_id:"3ZMMKUQ4HHAJXTUPRF6XKVG7", price:14.00 },
    { id:"UD3HDQSPI7JR25X2SWFJQFWA", name:"Seafood Boil Kit", square_item_id:"CKDLDR6H2M4C6GCMFI3GYSZ7", variation_id:"UD3HDQSPI7JR25X2SWFJQFWA", price:200.00 },
    { id:"Q62HKGXCOGHQQQFFB76BA3EY", name:"Nashville Hot Chicken Taco", square_item_id:"N6P7T63FL3IOBHEPTZ7IHPND", variation_id:"Q62HKGXCOGHQQQFFB76BA3EY", price:8.00 },
    { id:"SZLHYMLFWYO4LPG5VKP537CC", name:"Chicken Bacon Ranch Taco", square_item_id:"76VLIBTCEV56WPBVRZFAEZGS", variation_id:"SZLHYMLFWYO4LPG5VKP537CC", price:6.00 },
    { id:"3ZVIIJL6MZEOSBIHAAR6GEPM", name:"Grilled Chicken Taco", square_item_id:"CWVS5RDWBUJXTRFKS4XK7VDD", variation_id:"3ZVIIJL6MZEOSBIHAAR6GEPM", price:7.00 },
    { id:"KM25DMMVZYGN5MUXBFQPHMDB", name:"Steak Sliders", square_item_id:"3SYTQICWT6PENF2PNYX7GLHV", variation_id:"KM25DMMVZYGN5MUXBFQPHMDB", price:14.00 },
    { id:"TDLMC7BKJGR6FJICD6ACBQY7", name:"Aguachile", square_item_id:"CNELYMJUBGIACYQZUQSNHZAP", variation_id:"TDLMC7BKJGR6FJICD6ACBQY7", price:16.00 },
  ];
  const ins = db.prepare('INSERT INTO menu_items (id, name, square_item_id, variation_id, price) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => { for (const m of SQUARE_MENU) ins.run(m.id, m.name, m.square_item_id, m.variation_id, m.price); })();
}

export { db };
