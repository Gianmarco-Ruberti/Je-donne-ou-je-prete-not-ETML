#!/bin/bash

# Configuration
SINCE="2026-01-13"
OUTPUT_FILE="commits_mardi_matin.csv"

echo "--- Extraction des commits (avec auteur) vers $OUTPUT_FILE ---"

# En-tête du CSV
echo "Hash,Auteur,Jour,Heure,Message" > "$OUTPUT_FILE"


git log --since="$SINCE" --date=format:'%A %H:%M' --pretty=format:"%h|%an|%ad|%s" | \
awk -F'|' '{
    split($3, date_parts, " ");
    day = date_parts[1];
    hour_min = date_parts[2];
    hour = substr(hour_min, 1, 2);


    if ((day ~ /[Tt]uesday/ || day ~ /[Mm]ardi/) && hour < 12) {
        hash = $1;
        author = $2;
        message = $4;


        gsub(/,/, " ", author);
        gsub(/,/, " ", message);

        print hash "," author "," day "," hour_min "," message
    }
}' >> "$OUTPUT_FILE"

echo "Check terminé ! Ton fichier est prêt : $OUTPUT_FILE"