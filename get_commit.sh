#!/bin/bash

# Configuration
SINCE="2026-01-13"
OUTPUT_FILE="commits_mardi_matin.csv"

echo "--- Extraction des commits (avec auteur) vers $OUTPUT_FILE ---"

# En-tête du CSV
echo "Hash,Auteur,Jour,Heure,Message" > "$OUTPUT_FILE"

# Format Git : 
# %h : hash | %an : nom de l'auteur | %ad : date formatée | %s : sujet
git log --since="$SINCE" --date=format:'%A %H:%M' --pretty=format:"%h|%an|%ad|%s" | \
awk -F'|' '{
    split($3, date_parts, " ");
    day = date_parts[1];
    hour_min = date_parts[2];
    hour = substr(hour_min, 1, 2);

    # Filtrage : Mardi et avant 12h
    if ((day ~ /[Tt]uesday/ || day ~ /[Mm]ardi/) && hour < 12) {
        hash = $1;
        author = $2;
        message = $4;

        # Sécurité : on nettoie les virgules pour ne pas casser les colonnes CSV
        gsub(/,/, " ", author);
        gsub(/,/, " ", message);

        # Ecriture dans le fichier
        print hash "," author "," day "," hour_min "," message
    }
}' >> "$OUTPUT_FILE"

echo "Check terminé ! Ton fichier est prêt : $OUTPUT_FILE"