#!/bin/bash

# Configuration
SINCE="2026-01-13"
OUTPUT_FILE="commits_mardi_matin.csv"

echo "--- Extraction des commits vers $OUTPUT_FILE ---"

# En-tête du CSV
echo "Hash,Jour,Heure,Message" > "$OUTPUT_FILE"

# Récupération et filtrage
git log --since="$SINCE" --date=format:'%A %H:%M' --pretty=format:"%h|%ad|%s" | \
awk -F'|' '{
    # On récupère le jour et l heure
    # $2 contient par exemple "mardi 09:45" ou "Tuesday 09:45"
    split($2, date_parts, " ");
    day = date_parts[1];
    hour_min = date_parts[2];
    hour = substr(hour_min, 1, 2);

    # Vérification Mardi + Matin (avant 12h)
    if ((day ~ /[Tt]uesday/ || day ~ /[Mm]ardi/) && hour < 12) {
        # On remplace les potentielles virgules dans le message pour ne pas casser le CSV
        gsub(/,/, " ", $3);
        # On écrit dans le fichier
        print $1 "," day "," hour_min "," $3
    }
}' >> "$OUTPUT_FILE"

echo "Terminé ! Tu peux ouvrir $OUTPUT_FILE"