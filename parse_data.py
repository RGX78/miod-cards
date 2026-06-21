import os
import re
import json
import shutil

# Paths
VAULT_MIOD_DIR = r"j:\My Drive\Obsidian Vault\MIÓD"
VAULT_IMAGES_DIR = r"j:\My Drive\Obsidian Vault\IMAGES"
PUBLIC_IMAGES_DIR = r"c:\Users\R6X\opencode\miod-cards\public\images"
DATA_JSON_DIR = r"c:\Users\R6X\opencode\miod-cards\src\data"
DATA_JSON_PATH = os.path.join(DATA_JSON_DIR, "honeys.json")

# Ensure target directories exist
os.makedirs(PUBLIC_IMAGES_DIR, exist_ok=True)
os.makedirs(DATA_JSON_DIR, exist_ok=True)

# Custom MTG-style configuration for each honey to enrich the card feel
HONEY_CARD_CONFIGS = {
    "Miód Manuka": {
        "cost": "3🧪",
        "manaType": "MGO",
        "rarity": "Mythic",
        "type": "Legendarny Miód Bioaktywny",
        "power": 3,
        "toughness": 8,
        "ability_title": "Certyfikat MGO 500+",
        "ability_desc": "Nie może być celem zaklęć przeciwnika. Gdy wchodzi do gry, przywraca Twojemu bohaterowi 5 punktów życia i usuwa wszystkie negatywne statusy.",
    },
    "Miód akacjowy": {
        "cost": "2🌸",
        "manaType": "Flora",
        "rarity": "Common",
        "type": "Miód Kwiatowy (Robinia)",
        "power": 4,
        "toughness": 2,
        "ability_title": "Wieczna Płynność",
        "ability_desc": "Nie może zostać zamrożony ani skrystalizowany. Pozostaje w stanie płynnym (Ciecz), dając +1 do szybkości innym kartom Flory.",
    },
    "Miód bławatkowy": {
        "cost": "3🌸",
        "manaType": "Flora",
        "rarity": "Rare",
        "type": "Miód Łąkowy (Bławatek)",
        "power": 3,
        "toughness": 5,
        "ability_title": "Nektar Dzikich Łąk",
        "ability_desc": "Unikalny i trudny do zdobycia. Kiedy zagrywasz ten miód, przeszukaj talię w poszukiwaniu innej karty z motywem kwiatowym i weź ją do ręki.",
    },
    "Miód faceliowy": {
        "cost": "2🌸",
        "manaType": "Flora",
        "rarity": "Common",
        "type": "Miód z Nawozu Zielonego",
        "power": 2,
        "toughness": 3,
        "ability_title": "Gładkie Masło",
        "ability_desc": "Szybko krystalizuje w postać kremowego masła. Kiedy ten miód zostaje zablokowany, zyskuje +2 do pancerza do końca tury.",
    },
    "Miód gryczany": {
        "cost": "3🧪",
        "manaType": "MGO",
        "rarity": "Rare",
        "type": "Miód Ziołowy (Gryka)",
        "power": 6,
        "toughness": 4,
        "ability_title": "Wzmocnienie Rutyny",
        "ability_desc": "Piekący w gardle i ostry. Zwiększa odporność naczyń krwionośnych o +3. Zadaje 2 obrażenia wrogowi przy zagraniu.",
    },
    "Miód koniczynowy": {
        "cost": "1🌸",
        "manaType": "Flora",
        "rarity": "Common",
        "type": "Miód Łąkowy (Koniczyna)",
        "power": 1,
        "toughness": 2,
        "ability_title": "Łagodny Codzienniak",
        "ability_desc": "Tani w zagraniu. Zmniejsza koszt przywołania kolejnego miodu Flory o 1 🌸.",
    },
    "Miód lipowy": {
        "cost": "3🌲",
        "manaType": "Arbor",
        "rarity": "Uncommon",
        "type": "Miód Drzewny (Lipa)",
        "power": 3,
        "toughness": 6,
        "ability_title": "Lipowy Napar",
        "ability_desc": "Niezastąpiony przy przeziębieniu. Twój bohater zyskuje odporność na trucizny. Usuwa gorączkę i leczy 3 punkty życia.",
    },
    "Miód malinowy": {
        "cost": "2🌸",
        "manaType": "Flora",
        "rarity": "Uncommon",
        "type": "Miód Owocowy (Malina)",
        "power": 3,
        "toughness": 4,
        "ability_title": "Napój Podgorączkowy",
        "ability_desc": "Rozgrzewa i pobudza. Dodaje +2 do ataku wybranej jednostce do końca tury.",
    },
    "Miód nawłociowy": {
        "cost": "2🌸",
        "manaType": "Flora",
        "rarity": "Uncommon",
        "type": "Miód Jesienny (Nawłoć)",
        "power": 4,
        "toughness": 3,
        "ability_title": "Zimowe Przygotowanie",
        "ability_desc": "Wspiera pszczoły przed zimą. Na koniec Twojej tury dodaje +1/+1 wszystkim przyjaznym kartom owadzim lub pszczelim.",
    },
    "Miód nostrzykowy": {
        "cost": "3🌸",
        "manaType": "Flora",
        "rarity": "Rare",
        "type": "Miód Bobowaty (Nostrzyk)",
        "power": 2,
        "toughness": 4,
        "ability_title": "Kumarynowy Przepływ",
        "ability_desc": "Rozrzedza krew. Kiedy ta karta atakuje, wrogowie tracą zdolność Pierwszego Uderzenia i mają zmniejszoną obronę o 1.",
    },
    "Miód rzepakowy": {
        "cost": "1⚡",
        "manaType": "Glukoza",
        "rarity": "Common",
        "type": "Miód Polny (Rzepak)",
        "power": 2,
        "toughness": 2,
        "ability_title": "Błyskawiczny Beton",
        "ability_desc": "Krystalizuje w zaledwie kilka dni w twardy blok. Ta karta wchodzi do gry z efektem Prowokacji (wrogowie muszą ją atakować najpierw).",
    },
    "Miód spadziowy": {
        "cost": "4🌲",
        "manaType": "Arbor",
        "rarity": "Rare",
        "type": "Miód Leśny (Spadź)",
        "power": 5,
        "toughness": 7,
        "ability_title": "Rosa Leśna (Spadź Iglasta)",
        "ability_desc": "Niezwykle bogaty w minerały. Na początku Twojej tury dobierz kartę i dodaj 1 punkt do puli zasobów.",
    },
    "Miód wielokwiatowy": {
        "cost": "1⚡",
        "manaType": "Glukoza",
        "rarity": "Common",
        "type": "Miód Mieszany (Wielokwiat)",
        "power": 2,
        "toughness": 1,
        "ability_title": "Uniwersalny Start",
        "ability_desc": "Najpopularniejszy i najprostszy. Kiedy ta karta zostanie zniszczona, przywołaj do ręki losowy miód z cmentarza.",
    },
    "Miód wrzosowy": {
        "cost": "4🌲",
        "manaType": "Arbor",
        "rarity": "Rare",
        "type": "Miód Wrzosowiskowy (Wrzos)",
        "power": 4,
        "toughness": 7,
        "ability_title": "Tiksotropia (Galaretka)",
        "ability_desc": "Posiada żelową konsystencję. Kiedy jest atakowany, wrogie jednostki grzęzną w nim i nie mogą atakować w następnej turze.",
    },
    "Miód z mniszka lekarskiego": {
        "cost": "3🌸",
        "manaType": "Flora",
        "rarity": "Rare",
        "type": "Miód Majowy (Mniszek)",
        "power": 3,
        "toughness": 5,
        "ability_title": "Oczyszczenie Wątroby",
        "ability_desc": "Wspiera trawienie i oczyszcza organizm. Usuwa wszystkie negatywne efekty i trucizny ze sprzymierzonych jednostek.",
    }
}

def parse_tabela():
    table_path = os.path.join(VAULT_MIOD_DIR, "Tabela.md")
    if not os.path.exists(table_path):
        print(f"Error: {table_path} does not exist.")
        return {}
    
    with open(table_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    data = {}
    for line in lines:
        line = line.strip()
        if not line or line.startswith("|-") or "Rodzaj miodu" in line:
            continue
        
        parts = [p.strip() for p in line.split("|")]
        # Since table lines start and end with |, splitting yields empty first and last elements
        if len(parts) >= 8:
            name = parts[1].replace("**", "").strip()
            color = parts[2]
            taste = parts[3]
            crystallization = parts[4]
            origin = parts[5]
            health = parts[6]
            
            data[name] = {
                "color_desc": color,
                "taste_desc": taste,
                "crystallization_desc": crystallization,
                "origin_desc": origin,
                "health_desc": health
            }
    return data

def parse_honey_files(tabela_data):
    honeys = []
    
    for filename in os.listdir(VAULT_MIOD_DIR):
        if not filename.endswith(".md") or filename == "Tabela.md":
            continue
            
        honey_name = filename[:-3]  # strip .md
        file_path = os.path.join(VAULT_MIOD_DIR, filename)
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse description paragraph and image link
        # Usually it's:
        # Line 1: text description
        # Line 2: ![[Pasted image 2026...]]
        
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        
        description = ""
        image_name = ""
        
        # Extract text content and image link
        for line in lines:
            # Check for image link on the line and extract it
            img_match = re.search(r"!\[\[(.*?)\]\]", line)
            if img_match:
                image_name = img_match.group(1)
            
            # Clean up the line content (remove image link, timestamps, extra spacing)
            cleaned_line = re.sub(r"!\[\[.*?\]\]", "", line)
            cleaned_line = re.sub(r"\(\d{2}:\d{2}\)", "", cleaned_line)
            cleaned_line = re.sub(r"\s+", " ", cleaned_line).strip()
            if cleaned_line:
                description += cleaned_line + " "
                    
        description = description.strip()
        
        # Copy image file to public folder
        if image_name:
            src_image_path = os.path.join(VAULT_IMAGES_DIR, image_name)
            if os.path.exists(src_image_path):
                dest_image_path = os.path.join(PUBLIC_IMAGES_DIR, image_name)
                shutil.copy2(src_image_path, dest_image_path)
                print(f"Copied image {image_name} to public/images")
            else:
                print(f"Warning: Image {image_name} not found in {VAULT_IMAGES_DIR}")
        
        # Get custom card configuration
        config = HONEY_CARD_CONFIGS.get(honey_name, {
            "cost": "2🍯",
            "manaType": "Nectar",
            "rarity": "Common",
            "type": "Miód",
            "power": 2,
            "toughness": 2,
            "ability_title": "Słodki Smak",
            "ability_desc": "Leczy 1 punkt życia przy zagraniu."
        })
        
        # Get table attributes
        attrs = tabela_data.get(honey_name, {
            "color_desc": "Brak danych",
            "taste_desc": "Brak danych",
            "crystallization_desc": "Brak danych",
            "origin_desc": "Brak danych",
            "health_desc": "Brak danych"
        })
        
        honey_data = {
            "name": honey_name,
            "description": description,
            "image": image_name if image_name else "default.png",
            **config,
            **attrs
        }
        
        honeys.append(honey_data)
        
    return honeys

def main():
    print("Starting honey data parser...")
    tabela_data = parse_tabela()
    print(f"Parsed {len(tabela_data)} entries from Tabela.md")
    
    honeys = parse_honey_files(tabela_data)
    print(f"Parsed {len(honeys)} honey markdown files.")
    
    # Save JSON file
    with open(DATA_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(honeys, f, ensure_ascii=False, indent=2)
        
    print(f"Saved database to {DATA_JSON_PATH}")

if __name__ == "__main__":
    main()
